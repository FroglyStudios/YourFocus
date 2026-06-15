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

// Initialize Steam with steamworks.js
let steamworks = null;
let steamClient = null;

try {
  steamworks = require('steamworks.js');
  // Initialize Steam (automatically reads from steam_appid.txt if present)
  steamClient = steamworks.init();
  
  console.log('[Steamworks] Steam API initialized successfully');

  // Unlock firstLaunch achievement
  const achievementId = 'firstLaunch';
  try {
    if (steamClient.achievement.activate(achievementId)) {
      console.log(`[Steamworks] Achievement unlocked: ${achievementId}`);
    }
  } catch (err) {
    console.error(`[Steamworks] Failed to unlock achievement ${achievementId}:`, err);
  }

  // IPC Handler for unlocking achievements from renderer
  ipcMain.handle('unlock-achievement', (_, id) => {
    try {
      if (!steamClient) return false;
      const success = steamClient.achievement.activate(id);
      if (success) {
        console.log(`[Steamworks] Achievement unlocked: ${id}`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Steamworks] Failed to unlock achievement ${id}:`, err);
      return false;
    }
  });
} catch (error) {
  console.log('[Steamworks] Not available or failed to initialize:', error.message);
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

// Mini-Overlay Widget logic
let miniWindow = null;

function createMiniWindow() {
  if (miniWindow) return;
  
  miniWindow = new BrowserWindow({
    width: 280,
    height: 120,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (isDev) {
    miniWindow.loadURL('http://localhost:5173/?mini=true');
  } else {
    miniWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'mini=true', search: 'mini=true' });
  }

  miniWindow.on('closed', () => {
    miniWindow = null;
  });
}

ipcMain.handle('toggle-mini-mode', (event) => {
  if (!miniWindow) {
    createMiniWindow();
  }
  
  if (mainWindow) {
    mainWindow.hide();
  }
  
  if (miniWindow) {
    miniWindow.show();
  }
  return true;
});

ipcMain.handle('close-mini-mode', (event) => {
  if (miniWindow) {
    miniWindow.hide();
  }
  
  if (mainWindow) {
    mainWindow.show();
  }
  return true;
});

// Sync timer state from main window to mini window
ipcMain.on('update-mini-timer', (event, state) => {
  if (miniWindow && miniWindow.isVisible()) {
    miniWindow.webContents.send('sync-mini-timer', state);
  }
});
// Steam Workshop handlers
ipcMain.handle('get-workshop-themes', async () => {
  if (!steamClient || !steamClient.workshop) return [];
  
  try {
    const items = steamClient.workshop.getSubscribedItems();
    const themes = [];
    
    for (const itemId of items) {
      const info = steamClient.workshop.installInfo(itemId);
      if (info && info.folder) {
        // Read folder for .json files
        const files = fs.readdirSync(info.folder);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const content = fs.readFileSync(path.join(info.folder, file), 'utf8');
              const theme = JSON.parse(content);
              if (theme.colors && theme.colors['--theme-bg']) {
                theme.workshopId = itemId.toString(); // Store ID to know it's from workshop
                themes.push(theme);
              }
            } catch (err) {
              console.error('Error reading theme from workshop', err);
            }
          }
        }
      }
    }
    return themes;
  } catch (error) {
    console.error('Error fetching workshop themes:', error);
    return [];
  }
});

ipcMain.handle('upload-workshop-theme', async (event, fileContent, title, description) => {
  if (!steamClient || !steamClient.workshop) throw new Error('Steam not running');
  
  try {
    // 1. Create item
    const appId = steamClient.utils.getAppId();
    const result = await steamClient.workshop.createItem(appId);
    
    // 2. Create temp folder for content
    const tempDir = path.join(app.getPath('userData'), 'temp_workshop_upload');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Write content to temp folder as theme.json
    const destPath = path.join(tempDir, 'theme.json');
    fs.writeFileSync(destPath, fileContent, 'utf8');
    
    // 3. Update item
    await steamClient.workshop.updateItem(result.itemId, {
      title,
      description,
      contentPath: tempDir,
      tags: ['Theme'],
      visibility: 0 // Public
    });
    
    // Clean up
    fs.unlinkSync(destPath);
    fs.rmdirSync(tempDir);
    
    return true;
  } catch (error) {
    console.error('Error uploading to workshop:', error);
    throw error;
  }
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
