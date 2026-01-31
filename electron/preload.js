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
    appVersion: ipcRenderer.sendSync('get-app-version'),

    // Window controls
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // Auto-updater
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    installUpdate: () => ipcRenderer.send('install-update'),
    getAutoDownload: () => ipcRenderer.sendSync('get-auto-download'),
    setAutoDownload: (enabled) => ipcRenderer.send('set-auto-download', enabled),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data)),
    removeUpdateListener: () => ipcRenderer.removeAllListeners('update-status')
});
