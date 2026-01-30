const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');

let mainWindow;
let flaskProcess;
let tray;

const FLASK_PORT = 5000;
const FLASK_URL = `http://127.0.0.1:${FLASK_PORT}`;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

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
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);

    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        buttons: ['Download', 'Later'],
        defaultId: 0
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-not-available', () => {
    console.log('App is up to date');
});

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(2)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');

    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. Restart the app to install.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
    }).then((result) => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
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
