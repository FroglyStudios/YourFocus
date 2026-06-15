const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Menu events
  onMenuNewSession: (callback) => ipcRenderer.on('menu-new-session', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  
  // Discord RPC
  discord: {
    connect: (clientId) => ipcRenderer.invoke('discord-connect', clientId),
    setActivity: (activity) => ipcRenderer.invoke('discord-set-activity', activity),
    clearActivity: () => ipcRenderer.invoke('discord-clear-activity'),
    isAvailable: () => true
  },
  
  // Steam integration
  steam: {
    isAvailable: () => true,
    unlockAchievement: (achievementId) => ipcRenderer.invoke('unlock-achievement', achievementId),
    getWorkshopThemes: () => ipcRenderer.invoke('get-workshop-themes'),
    uploadWorkshopTheme: (fileContent, title, description) => ipcRenderer.invoke('upload-workshop-theme', fileContent, title, description)
  },
  
  // Mini Overlay mode
  mini: {
    toggle: () => ipcRenderer.invoke('toggle-mini-mode'),
    close: () => ipcRenderer.invoke('close-mini-mode'),
    updateTimer: (state) => ipcRenderer.send('update-mini-timer', state),
    onTimerUpdate: (callback) => ipcRenderer.on('sync-mini-timer', (_event, state) => callback(state))
  }
});

// Prevent the renderer process from accessing Node.js
delete window.require;
delete window.exports;
delete window.module;