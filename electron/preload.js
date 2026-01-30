// Preload script for security
// This runs in the renderer process before web content loads
// It bridges the gap between Node.js and the web page

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // System info
    platform: process.platform,
    version: process.versions.electron,
    appVersion: require('electron').remote?.app?.getVersion() || 'dev',

    // Window controls
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // Auto-updater
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    installUpdate: () => ipcRenderer.send('install-update'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
    removeUpdateListener: () => ipcRenderer.removeAllListeners('update-status')
});
