# Complete Electron Setup Guide

This guide walks you through converting Hool.gg Roster into a Windows desktop app with auto-updates from GitHub.

## What's Been Set Up

✅ **Electron wrapper** - Native desktop app shell
✅ **Auto-updater** - Updates from GitHub Releases
✅ **System tray** - Runs in background
✅ **GitHub Actions** - Automated build pipeline
✅ **NSIS installer** - Professional Windows installer

## Quick Start (Development)

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Version 18 or higher

2. **Run the setup script**
   ```bash
   cd electron
   setup-dev.bat
   ```

3. **Start development mode**
   ```bash
   npm start
   ```
   This opens the app in a desktop window!

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│      Electron Desktop Window        │
│  (Chromium + Node.js)               │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Your Flask App             │  │
│  │   (http://127.0.0.1:5000)   │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Bundled Python + Flask     │  │
│  │   (Runs in background)       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Auto-Update Flow

```
1. User opens app
2. App checks GitHub Releases API
3. If new version exists:
   → Shows "Update Available" dialog
   → User clicks "Download"
   → Downloads new installer in background
   → Shows "Restart to Install" when ready
   → User restarts → Update installs
4. App opens with new version
```

## Production Build

### Prerequisites

You need to bundle Python with the app so users don't need Python installed.

#### 1. Download Python Embedded

```powershell
# Create directory
cd electron
mkdir python-embedded

# Download Python 3.11 embedded
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip" -OutFile python-embed.zip

# Extract
Expand-Archive python-embed.zip -DestinationPath python-embedded

# Cleanup
Remove-Item python-embed.zip
```

#### 2. Enable pip in Embedded Python

Edit `python-embedded/python311._pth` and uncomment this line:
```
import site
```

#### 3. Install pip

```powershell
cd python-embedded

# Download get-pip.py
Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile get-pip.py

# Install pip
.\python.exe get-pip.py
```

#### 4. Install Flask Dependencies

```powershell
.\python.exe -m pip install Flask requests
```

#### 5. Create App Icons

You need 2 icons in `electron/assets/`:

- **icon.ico** - Main app icon (256x256px recommended)
- **tray-icon.ico** - System tray icon (16x16 or 32x32px)

**Tools to create .ico files:**
- https://icoconvert.com/ (online)
- https://www.gimp.org/ (free software)
- https://www.photopea.com/ (online Photoshop alternative)

**Tip:** Use your Hool.gg logo or a WoW-themed icon.

#### 6. Build the App

```bash
npm run build
```

Output will be in `electron/dist/`:
- `Hool.gg Roster Setup 1.0.0.exe` - The installer

## Setting Up GitHub Releases (Auto-Update)

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `midnight_tracker` (or whatever you prefer)
3. Make it **Public** (required for auto-updates)
4. Don't initialize with README (we already have code)

### 2. Update package.json

Edit `electron/package.json` and replace `YOUR_USERNAME`:

```json
{
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/midnight_tracker.git"
  },
  "publish": {
    "owner": "YOUR_USERNAME",
    "repo": "midnight_tracker"
  }
}
```

### 3. Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Hool.gg Roster v1.0.0"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/midnight_tracker.git

# Push
git push -u origin main
```

### 4. Create First Release

**Option A: Automatic (Recommended)**

```bash
# Create version tag
git tag v1.0.0

# Push tag (triggers GitHub Actions)
git push origin v1.0.0
```

GitHub Actions will:
1. Build the app automatically
2. Create a GitHub Release
3. Upload the installer
4. Generate update metadata

**Option B: Manual**

1. Build locally: `npm run build`
2. Go to: https://github.com/YOUR_USERNAME/midnight_tracker/releases/new
3. Tag version: `v1.0.0`
4. Release title: `Hool.gg Roster v1.0.0`
5. Upload `electron/dist/Hool.gg Roster Setup 1.0.0.exe`
6. Click "Publish release"

### 5. Distribute to Users

Send users the installer link:
```
https://github.com/YOUR_USERNAME/midnight_tracker/releases/latest/download/Hool.gg-Roster-Setup-1.0.0.exe
```

They download and install. That's it!

## Releasing Updates

When you have changes to release:

### 1. Update Version

Edit `electron/package.json`:
```json
"version": "1.1.0"
```

### 2. Commit Changes

```bash
git add .
git commit -m "Release v1.1.0 - Added new features"
```

### 3. Create Tag

```bash
git tag v1.1.0
git push origin v1.1.0
```

### 4. GitHub Actions Builds Automatically

Within ~5-10 minutes:
- New release appears on GitHub
- Installer is available for download
- **Users with v1.0.0 automatically get update notification!**

## Testing Auto-Update

1. Build and release v1.0.0
2. Install it on your computer
3. Make a change (e.g., update title in HTML)
4. Bump version to v1.1.0
5. Build and release v1.1.0
6. Open the v1.0.0 app
7. Wait 5 seconds → Update dialog appears!

## Features

### System Tray

- App stays running in system tray when you close the window
- Right-click tray icon for menu:
  - Show App
  - Check for Updates
  - Quit

### Auto-Update Settings

You can customize update behavior in `electron/main.js`:

```javascript
// Check for updates silently, auto-download
autoUpdater.autoDownload = true;
autoUpdater.checkForUpdatesAndNotify();

// Check for updates every hour
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60 * 60 * 1000);

// Install updates when app quits (no restart needed)
autoUpdater.autoInstallOnAppQuit = true;
```

## File Structure

```
midnight_tracker/
├── app.py                          # Flask backend
├── data.json                       # User data
├── templates/                      # HTML templates
├── static/                         # CSS, JS, assets
│   ├── app.js
│   └── style.css
├── electron/
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # Security bridge
│   ├── package.json               # App config & dependencies
│   ├── setup-dev.bat              # Dev setup script
│   ├── assets/
│   │   ├── icon.ico              # App icon (create this)
│   │   └── tray-icon.ico         # Tray icon (create this)
│   └── python-embedded/           # Bundled Python (download separately)
│       ├── python.exe
│       └── Lib/
└── .github/
    └── workflows/
        └── build-release.yml       # Auto-build pipeline
```

## Troubleshooting

### "Python not found" when building

Make sure you:
1. Downloaded Python embedded to `electron/python-embedded/`
2. Installed Flask: `python-embedded\python.exe -m pip install Flask requests`

### "npm install fails"

Delete `node_modules` and try again:
```bash
rm -rf node_modules
npm install
```

### "Auto-update not working"

Check:
1. Repository is **public** on GitHub
2. `package.json` has correct GitHub username/repo
3. Release has the `.exe` file uploaded
4. Release has `latest.yml` metadata (auto-generated by electron-builder)

### "App won't start in production"

Check logs:
1. Open app
2. Press `Ctrl+Shift+I` to open DevTools
3. Check Console for errors

Common issues:
- Flask dependencies not installed in embedded Python
- `python311._pth` doesn't have `import site` uncommented

## Advanced: Code Signing

For a professional app without Windows warnings, you need a code signing certificate:

1. Buy certificate from SSL.com, DigiCert, etc. (~$200/year)
2. Update `package.json`:
   ```json
   "win": {
     "certificateFile": "certificate.pfx",
     "certificatePassword": "your-password"
   }
   ```
3. Rebuild

Signed apps:
- No Windows SmartScreen warnings
- Users trust it more
- Required for enterprise deployment

## What's Next?

✅ You have a complete desktop app setup
✅ Users can download and install with one click
✅ Updates are automatic via GitHub
✅ Professional Windows installer

**Next steps:**
1. Create your app icons
2. Download and configure Python embedded
3. Build your first release
4. Push to GitHub
5. Share with your guild!

## Support

- Electron docs: https://www.electronjs.org/docs/latest/
- electron-builder: https://www.electron.build/
- electron-updater: https://www.electron.build/auto-update

## Summary

You now have:
- **Professional desktop app** (not a website)
- **Auto-updates** (users always have latest version)
- **Easy distribution** (one .exe installer)
- **System tray** (runs in background)
- **Automated builds** (GitHub Actions)

Total setup time: ~30 minutes
File size: ~150-200MB (includes Python + Chromium)
Update size: ~5-10MB (delta patches)

Enjoy your new desktop app! 🎮
