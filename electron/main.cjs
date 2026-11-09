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
const STEAM_APP_ID = 4037900;
let steamworks = null;
let steamClient = null;

function initSteam() {
  if (steamClient) return steamClient;
  try {
    if (!steamworks) {
      steamworks = require('steamworks.js');
    }
    // Try explicit App ID first, fallback to steam_appid.txt
    try {
      steamClient = steamworks.init(STEAM_APP_ID);
    } catch (e1) {
      steamClient = steamworks.init();
    }
    console.log('[Steamworks] Steam API initialized successfully');

    // Unlock firstLaunch achievement
    try {
      if (steamClient.achievement && steamClient.achievement.activate('firstLaunch')) {
        console.log('[Steamworks] Achievement unlocked: firstLaunch');
      }
    } catch (achErr) {
      console.warn('[Steamworks] Failed to unlock firstLaunch achievement:', achErr.message);
    }

    return steamClient;
  } catch (error) {
    console.log('[Steamworks] Steam not running or not available:', error.message);
    steamClient = null;
    return null;
  }
}

// Attempt initial Steam connection
initSteam();

// IPC Handler for unlocking achievements from renderer
ipcMain.handle('unlock-achievement', (_, id) => {
  try {
    const client = initSteam();
    if (!client || !client.achievement) return false;
    const success = client.achievement.activate(id);
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

// IPC Handler for checking Steam status
ipcMain.handle('is-steam-available', () => {
  const client = initSteam();
  if (!client) {
    return { available: false };
  }
  let username = '';
  try {
    username = client.localplayer ? client.localplayer.getName() : '';
  } catch (e) {}

  return {
    available: true,
    username,
    appId: client.utils ? client.utils.getAppId() : STEAM_APP_ID
  };
});

// IPC Handler for opening external URLs safely
ipcMain.handle('open-external', async (_, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('steam://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

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
  const client = initSteam();
  if (!client || !client.workshop) {
    return { success: false, themes: [], isSteamRunning: false, error: 'Steam is not running' };
  }
  
  let username = '';
  try {
    username = client.localplayer ? client.localplayer.getName() : '';
  } catch (e) {}

  try {
    const items = client.workshop.getSubscribedItems();
    console.log('[Workshop] Subscribed Items:', items.map(id => id.toString()));
    const themes = [];
    
    for (const itemId of items) {
      let state = client.workshop.state(itemId);
      let isInstalled = (state & 4) !== 0;
      let needsUpdate = (state & 8) !== 0;
      
      console.log(`[Workshop] Item ${itemId} State: ${state} (Installed: ${isInstalled}, NeedsUpdate: ${needsUpdate})`);

      // If missing or needs update, trigger download and wait briefly for completion
      if (!isInstalled || needsUpdate) {
        console.log(`[Workshop] Forcing download for ${itemId}...`);
        try {
          client.workshop.download(itemId, true);
        } catch (dlErr) {
          console.warn(`[Workshop] Could not trigger download for ${itemId}:`, dlErr);
        }

        // Wait briefly (up to 3.5 seconds) for small theme file download to finish
        const startTime = Date.now();
        while (Date.now() - startTime < 3500) {
          await new Promise(r => setTimeout(r, 250));
          try {
            state = client.workshop.state(itemId);
            isInstalled = (state & 4) !== 0;
            if (isInstalled) {
              console.log(`[Workshop] Item ${itemId} download finished successfully.`);
              break;
            }
          } catch (e) {
            break;
          }
        }
      }

      const info = client.workshop.installInfo(itemId);
      console.log(`[Workshop] Item ${itemId} Install Info:`, info);
      
      if (info && info.folder && fs.existsSync(info.folder)) {
        try {
          const files = fs.readdirSync(info.folder);
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const content = fs.readFileSync(path.join(info.folder, file), 'utf8');
                const theme = JSON.parse(content);
                if (theme.colors && theme.colors['--theme-bg']) {
                  theme.workshopId = itemId.toString();
                  if (!theme.name) {
                    theme.name = path.basename(file, '.json');
                  }
                  themes.push(theme);
                }
              } catch (err) {
                console.error(`[Workshop] Error reading theme file ${file} from workshop:`, err);
              }
            }
          }
        } catch (dirErr) {
          console.error(`[Workshop] Error reading folder for item ${itemId}:`, dirErr);
        }
      }
    }
    return { success: true, themes, isSteamRunning: true, username };
  } catch (error) {
    console.error('Error fetching workshop themes:', error);
    return { success: false, themes: [], isSteamRunning: true, error: error.message || String(error), username };
  }
});

ipcMain.handle('upload-workshop-theme', async (event, fileContent, title, description) => {
  const client = initSteam();
  if (!client || !client.workshop) {
    throw new Error('Steam is not running. Please start the Steam desktop client and ensure you are logged in.');
  }
  
  // Validate theme JSON before doing any Steam operations
  let parsedTheme;
  try {
    parsedTheme = JSON.parse(fileContent);
    if (!parsedTheme.colors || !parsedTheme.colors['--theme-bg']) {
      throw new Error('Invalid theme format: missing theme color palette (--theme-bg).');
    }
    if (!parsedTheme.name && title) {
      parsedTheme.name = title;
      fileContent = JSON.stringify(parsedTheme, null, 2);
    }
  } catch (jsonErr) {
    throw new Error('Theme file is invalid JSON: ' + jsonErr.message);
  }

  const appId = client.utils ? client.utils.getAppId() : STEAM_APP_ID;
  const tempDir = path.join(app.getPath('userData'), `temp_workshop_upload_${Date.now()}`);

  try {
    // 1. Create workshop item
    console.log(`[Workshop] Step 1: Creating item for App ID: ${appId}`);
    let result;
    try {
      result = await client.workshop.createItem(appId);
      console.log(`[Workshop] Created item: ${result.itemId}, NeedsAgreement: ${result.needsToAcceptAgreement}`);
    } catch (createErr) {
      console.error('[Workshop] createItem failed:', createErr);
      const errMsg = createErr && createErr.message ? createErr.message : String(createErr);
      if (errMsg.toLowerCase().includes('limit exceeded')) {
        throw new Error(
          'Steam Cloud Quota überschritten ("limit exceeded").\n\n' +
          'Ursache: In Steamworks ist das "Speicherplatzkontingent pro Benutzer" (Byte quota per user) noch auf 0 Bytes eingestellt.\n\n' +
          'Lösung im Steamworks Partner Portal:\n' +
          '1. Gehe auf partner.steamgames.com -> App 4037900\n' +
          '2. "Steamworks-Einstellungen bearbeiten" -> Reiter "Steam Cloud"\n' +
          '3. "Speicherplatzkontingent pro Benutzer" auf z. B. 104857600 Bytes (100 MB) oder 1073741824 Bytes (1 GB) setzen\n' +
          '4. "Zulässige Dateianzahl pro Benutzer" auf z. B. 1000 setzen\n' +
          '5. Speichern und im Tab "Veröffentlichen" die Änderung live schalten!'
        );
      }
      throw createErr;
    }
    
    // 2. Create temp folder for content
    console.log(`[Workshop] Step 2: Preparing upload directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Write content to temp folder as theme.json
    const destPath = path.join(tempDir, 'theme.json');
    fs.writeFileSync(destPath, fileContent, 'utf8');

    // Copy icon as workshop thumbnail preview if available
    const iconCandidates = [
      path.join(__dirname, 'assets', 'icon.png'),
      path.join(__dirname, '../public', 'icon.png')
    ];
    let previewFilePath = null;
    for (const cand of iconCandidates) {
      if (fs.existsSync(cand)) {
        const targetPreview = path.join(tempDir, 'preview.png');
        fs.copyFileSync(cand, targetPreview);
        previewFilePath = targetPreview;
        break;
      }
    }
    
    // 3. Update workshop item details
    console.log(`[Workshop] Step 3: Updating item details for ${result.itemId}`);
    const updateDetails = {
      title: title || parsedTheme.name || 'Custom Theme',
      description: description || 'Theme for YourFocus',
      contentPath: tempDir,
      tags: ['Theme'],
      visibility: 0 // Public
    };

    if (previewFilePath) {
      updateDetails.previewPath = previewFilePath;
    }

    try {
      await client.workshop.updateItem(result.itemId, updateDetails, appId);
      console.log(`[Workshop] Item ${result.itemId} updated successfully!`);
    } catch (updateErr) {
      console.error('[Workshop] updateItem failed:', updateErr);
      const updateMsg = updateErr && updateErr.message ? updateErr.message : String(updateErr);
      if (updateMsg.toLowerCase().includes('limit exceeded')) {
        throw new Error(
          'Steam Cloud Quota überschritten ("limit exceeded") beim Hochladen der Theme-Dateien.\n' +
          'Bitte erhöhe das Steam Cloud Kontingent im Steamworks-Portal auf mindestens 100 MB.'
        );
      }
      throw updateErr;
    }

    // Auto-subscribe creator to the item so it immediately appears in their themes
    try {
      await client.workshop.subscribe(result.itemId);
      console.log(`[Workshop] Auto-subscribed to item ${result.itemId}`);
    } catch (subErr) {
      console.warn(`[Workshop] Auto-subscribe warning:`, subErr);
    }
    
    return {
      success: true,
      itemId: result.itemId.toString(),
      needsToAcceptAgreement: Boolean(result.needsToAcceptAgreement)
    };
  } catch (error) {
    console.error('Error uploading to workshop:', error);
    throw error;
  } finally {
    // Always clean up temp folder
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanErr) {
      console.error('Error cleaning up temp directory:', cleanErr);
    }
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
