# Hool.gg Roster - Electron Desktop App

This is the Electron wrapper for the Hool.gg Roster WoW character tracker. It packages the Flask web app into a native Windows desktop application with auto-update support.

## Features

- ✅ Native Windows desktop application
- ✅ Auto-updates from GitHub Releases
- ✅ System tray integration
- ✅ No browser required (embedded Chromium)
- ✅ Professional installer (NSIS)
- ✅ Bundled Python environment (no installation needed)

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git

### Install Dependencies

```bash
cd electron
npm install
```

### Run in Development Mode

```bash
npm start
```

This will:
1. Start the Flask backend on port 5000
2. Open an Electron window pointing to the Flask app
3. Hot reload when you modify Electron code (not Flask)

## Building for Production

### 1. Download Python Embedded

Download Python 3.11 embedded for Windows:
```bash
mkdir python-embedded
# Download from: https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip
# Extract to electron/python-embedded/
```

### 2. Install Flask in Embedded Python

```bash
cd python-embedded
# Download get-pip.py
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
# Install pip
python.exe get-pip.py
# Install dependencies
python.exe -m pip install Flask requests
```

### 3. Build the Installer

```bash
npm run build
```

This creates:
- `dist/Hool.gg Roster Setup 1.0.0.exe` - Installer
- `dist/win-unpacked/` - Unpacked app files

## Auto-Update Setup

### 1. Create GitHub Repository

1. Create a new GitHub repository (e.g., `midnight_tracker`)
2. Update `package.json` with your GitHub username:
   ```json
   "repository": {
     "url": "https://github.com/YOUR_USERNAME/midnight_tracker.git"
   },
   "publish": {
     "owner": "YOUR_USERNAME",
     "repo": "midnight_tracker"
   }
   ```

### 2. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/midnight_tracker.git
git push -u origin main
```

### 3. Create a Release

**Option A: Automatic (Recommended)**

Push a version tag to trigger GitHub Actions build:
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
- Build the app
- Create a GitHub Release
- Upload the installer

**Option B: Manual**

1. Build locally: `npm run build`
2. Go to GitHub → Releases → New Release
3. Create tag (e.g., `v1.0.0`)
4. Upload `dist/Hool.gg Roster Setup 1.0.0.exe`
5. Publish release

### 4. How Auto-Update Works

1. App checks GitHub Releases API on startup
2. If new version found, shows "Update Available" dialog
3. User clicks "Download" → downloads `.exe` in background
4. When download complete, shows "Restart to Install"
5. User restarts → installer runs → app updates

## Release Process

### For New Versions:

1. Update version in `package.json`:
   ```json
   "version": "1.1.0"
   ```

2. Commit changes:
   ```bash
   git add .
   git commit -m "Release v1.1.0"
   ```

3. Create and push tag:
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

4. GitHub Actions automatically builds and publishes the release

5. Users with v1.0.0 will get update notification next time they open the app

## Configuration

### App Icons

Place icons in `electron/assets/`:
- `icon.ico` - Main app icon (256x256 recommended)
- `tray-icon.ico` - System tray icon (16x16 or 32x32)

Use a tool like [icoconvert.com](https://icoconvert.com/) to create `.ico` files from PNG.

### Auto-Update Settings

In `main.js`, you can configure:

```javascript
// Check for updates immediately
autoUpdater.checkForUpdatesAndNotify();

// Check for updates every hour
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60 * 60 * 1000);

// Auto-download updates
autoUpdater.autoDownload = true;

// Auto-install on quit
autoUpdater.autoInstallOnAppQuit = true;
```

## Troubleshooting

### "App won't start"
- Check that Flask dependencies are installed in embedded Python
- Check `python-embedded/python311._pth` - ensure it includes `Lib/site-packages`

### "Update check fails"
- Verify GitHub repository settings in `package.json`
- Ensure releases are public
- Check that `latest.yml` exists in the release assets

### "Build fails"
- Run `npm install` in electron folder
- Ensure Python embedded is in `electron/python-embedded/`
- Check that all Flask files are in parent directory

## Project Structure

```
midnight_tracker/
├── app.py                    # Flask backend
├── data.json                 # App data
├── templates/                # Flask templates
├── static/                   # CSS, JS, images
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Security bridge
│   ├── package.json         # Dependencies & build config
│   ├── assets/              # Icons
│   └── python-embedded/     # Bundled Python (not in git)
└── .github/
    └── workflows/
        └── build-release.yml # Auto-build on tags
```

## Security Notes

- The app uses `contextIsolation: true` for security
- Python is sandboxed and only accessible to Electron
- No remote code execution vulnerabilities
- Updates are verified with checksums from GitHub

## License

MIT
