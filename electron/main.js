const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

let mainWindow;
let flaskProcess;
let tray;

const FLASK_PORT = 5000;
const FLASK_URL = `http://127.0.0.1:${FLASK_PORT}`;

// Settings persistence
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading settings:', e);
    }
    return {};
}

function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving settings:', e);
    }
}

// Auto-updater configuration
const settings = loadSettings();
autoUpdater.autoDownload = settings.autoDownload !== false; // default true
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.validateUpdate = false; // no code signing certificate

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        frame: false, // Remove default title bar
        backgroundColor: '#050410', // Match body background
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '..', 'static', 'hoolio-logo.png'),
        show: false // Don't show until Flask is ready
    });

    // Hide default menu bar for sleeker look
    mainWindow.setMenuBarVisibility(false);

    // Wait for Flask to be ready, then load
    waitForFlask().then(() => {
        mainWindow.loadURL(FLASK_URL);
        mainWindow.show();
    }).catch((error) => {
        console.error('Failed to start Flask:', error);
        app.quit();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startFlask() {
    const isPackaged = app.isPackaged;
    const fs = require('fs');

    let pythonPath;
    let appPath;

    if (isPackaged) {
        // Check if bundled Python exists
        const bundledPython = path.join(process.resourcesPath, 'python', 'python.exe');

        if (fs.existsSync(bundledPython)) {
            // Use bundled Python if available
            pythonPath = bundledPython;
            appPath = path.join(process.resourcesPath, 'app', 'app.py');
        } else {
            // Fall back to system Python (v0.1.0 - requires Python installed)
            pythonPath = 'python';
            appPath = path.join(process.resourcesPath, 'app', 'app.py');
        }
    } else {
        // Development: Use system Python
        pythonPath = 'python';
        appPath = path.join(__dirname, '..', 'app.py');
    }

    console.log('Starting Flask with:', pythonPath, appPath);

    flaskProcess = spawn(pythonPath, [appPath], {
        env: { ...process.env, FLASK_ENV: 'production' }
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });

    flaskProcess.stderr.on('data', (data) => {
        console.error(`Flask Error: ${data}`);
    });

    flaskProcess.on('close', (code) => {
        console.log(`Flask process exited with code ${code}`);
    });
}

async function waitForFlask(maxRetries = 30, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await axios.get(FLASK_URL);
            console.log('Flask server is ready!');
            return true;
        } catch (error) {
            console.log(`Waiting for Flask... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Flask server failed to start');
}

function createTray() {
    const iconPath = path.join(__dirname, '..', 'static', 'hoolio-logo.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Check for Updates',
            click: () => {
                autoUpdater.checkForUpdates();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Hool.gg Roster');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'checking',
            message: 'Checking for updates...'
        });
    }
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);

    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'available',
            version: info.version,
            message: `Update available: v${info.version}`
        });
    }
});

autoUpdater.on('update-not-available', () => {
    console.log('App is up to date');
    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'up-to-date',
            message: 'App is up to date'
        });
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(2)}%`);
    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'downloading',
            percent: progressObj.percent
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');

    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'downloaded',
            version: info.version,
            message: `Update v${info.version} ready to install`
        });
    }
});

autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    if (mainWindow) {
        mainWindow.webContents.send('update-status', {
            status: 'error',
            message: 'Update failed: ' + error.message
        });
    }
});

// App lifecycle
app.whenReady().then(() => {
    startFlask();
    createWindow();
    // createTray(); // Commented out - needs tray-icon.ico in assets/

    // Check for updates 5 seconds after app starts
    setTimeout(() => {
        if (!app.isPackaged) {
            console.log('Skipping update check in development mode');
        } else {
            autoUpdater.checkForUpdates();
        }
    }, 5000);
});

app.on('window-all-closed', () => {
    // Quit when all windows are closed (v0.1 - no tray support yet)
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    // Kill Flask process when app quits
    if (flaskProcess) {
        flaskProcess.kill();
    }
});

app.on('will-quit', () => {
    if (flaskProcess) {
        flaskProcess.kill();
    }
});

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.on('get-app-version', (event) => {
    event.returnValue = app.getVersion();
});

// Auto-updater IPC handlers
ipcMain.on('check-for-updates', () => {
    if (app.isPackaged) {
        autoUpdater.checkForUpdates();
    } else {
        if (mainWindow) {
            mainWindow.webContents.send('update-status', {
                status: 'dev-mode',
                message: 'Update checking disabled in development mode'
            });
        }
    }
});

ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on('get-auto-download', (event) => {
    event.returnValue = autoUpdater.autoDownload;
});

ipcMain.on('set-auto-download', (event, enabled) => {
    autoUpdater.autoDownload = enabled;
    const current = loadSettings();
    current.autoDownload = enabled;
    saveSettings(current);
});
