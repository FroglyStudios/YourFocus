const { app, BrowserWindow, Menu, shell, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Discord RPC Integration
let discordRPC = null;
let discordClient = null;
try {
  discordRPC = require('discord-rpc');
  console.log('Discord RPC available in main process');
} catch (error) {
  console.log('Discord RPC not available in main process');
}

// Initialize Steam with greenworks
let greenworks = null;
let steamInitialized = false;

try {
  greenworks = require('greenworks');

  if (greenworks.initAPI()) {
    console.log('[Greenworks] Steam API initialized successfully');
    steamInitialized = true;

    // Unlock firstLaunch achievement
    const achievementId = 'firstLaunch';

    greenworks.getAchievement(achievementId, (achieved) => {
      if (!achieved) {
        greenworks.activateAchievement(achievementId, () => {
          console.log(`[Greenworks] Achievement unlocked: ${achievementId}`);
        }, (err) => {
          console.error(`[Greenworks] Failed to unlock achievement ${achievementId}:`, err);
        });
      } else {
        console.log(`[Greenworks] Achievement already unlocked: ${achievementId}`);
      }
    }, (err) => {
      console.error(`[Greenworks] Failed to check achievement ${achievementId}:`, err);

      greenworks.activateAchievement(achievementId, () => {
        console.log(`[Greenworks] Achievement unlocked: ${achievementId}`);
      }, (err) => {
        console.error(`[Greenworks] Failed to unlock achievement ${achievementId}:`, err);
      });
    });

    // IPC Handler for unlocking achievements from renderer
    ipcMain.handle('unlock-achievement', (_, id) => {
      return new Promise((resolve) => {
        if (!steamInitialized || !greenworks) {
          console.log('[Greenworks] Steam not initialized');
          resolve(false);
          return;
        }

        greenworks.getAchievement(id, (achieved) => {
          if (!achieved) {
            greenworks.activateAchievement(id, () => {
              console.log(`[Greenworks] Achievement unlocked: ${id}`);
              resolve(true);
            }, (err) => {
              console.error(`[Greenworks] Failed to unlock achievement ${id}:`, err);
              resolve(false);
            });
          } else {
            console.log(`[Greenworks] Achievement already unlocked: ${id}`);
            resolve(true);
          }
        }, (err) => {
          console.error(`[Greenworks] Failed to check achievement ${id}:`, err);
          resolve(false);
        });
      });
    });

  } else {
    console.log('[Greenworks] Failed to initialize Steam API');
  }
} catch (error) {
  console.log('[Greenworks] Not available:', error.message);
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    minWidth: 1000,
    minHeight: 1000,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-session');
          }
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About YourFocus',
          click: () => {
            mainWindow.webContents.send('menu-about');
          }
        },
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://froglystudios.github.io/hello/yourfocus/');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('show-notification', async (event, title, body) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, 'assets', 'icon.png')
    });
    
    notification.show();
    return true;
  }
  return false;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Discord RPC handlers
ipcMain.handle('discord-connect', async (event, clientId) => {
  if (!discordRPC) return false;
  
  try {
    // Disconnect existing client if any
    if (discordClient) {
      try {
        await discordClient.destroy();
      } catch (error) {
        console.log('Error destroying existing Discord client:', error);
      }
    }

    discordClient = new discordRPC.Client({ transport: 'ipc' });
    
    discordClient.on('ready', () => {
      console.log('Discord RPC ready in main process');
    });

    discordClient.on('disconnected', () => {
      console.log('Discord RPC disconnected in main process');
      discordClient = null;
    });

    await discordClient.login({ clientId });
    console.log('Discord RPC connected successfully with client ID:', clientId);
    return true;
  } catch (error) {
    console.error('Failed to connect to Discord:', error);
    discordClient = null;
    return false;
  }
});

ipcMain.handle('discord-set-activity', async (event, activity) => {
  if (!discordClient) {
    console.log('Discord client not connected');
    return false;
  }

  try {
    await discordClient.setActivity(activity);
    console.log('Discord activity set:', activity);
    return true;
  } catch (error) {
    console.error('Failed to set Discord activity:', error);
    return false;
  }
});

ipcMain.handle('discord-clear-activity', async (event) => {
  if (!discordClient) {
    console.log('Discord client not connected');
    return false;
  }

  try {
    await discordClient.clearActivity();
    console.log('Discord activity cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear Discord activity:', error);
    return false;
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});
