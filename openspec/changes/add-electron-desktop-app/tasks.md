# Implementation Tasks: Electron Desktop App

## 1. Electron Setup & Configuration
- [x] 1.1 Create `electron/` directory structure
- [x] 1.2 Initialize npm package with `package.json`
  - [x] Add Electron 28.x dependency
  - [x] Add electron-updater 6.x dependency
  - [x] Add electron-builder 24.x dev dependency
  - [x] Add axios for HTTP health checks
- [x] 1.3 Configure build settings in `package.json`
  - [x] Set `appId`, `productName`, `author`
  - [x] Configure Windows target (NSIS installer)
  - [x] Set file inclusion patterns
  - [x] Configure extraResources for Flask app and Python
- [x] 1.4 Configure auto-update GitHub provider
  - [x] Set repository owner and name
  - [x] Set release type (release vs draft)
- [x] 1.5 Create `.gitignore` for `node_modules/`, `dist/`, `python-embedded/`

## 2. Main Process Implementation
- [x] 2.1 Create `electron/main.js` skeleton
  - [x] Import required Electron modules (app, BrowserWindow, Menu, Tray)
  - [x] Import electron-updater (autoUpdater)
  - [x] Import axios for Flask health checks
- [x] 2.2 Implement Flask subprocess management
  - [x] Add `startFlask()` function
  - [x] Detect packaged vs development mode (different Python paths)
  - [x] Spawn Python subprocess with app.py
  - [x] Capture stdout/stderr for logging
  - [x] Handle subprocess close events
- [x] 2.3 Implement Flask health check
  - [x] Add `waitForFlask()` async function
  - [x] Implement retry logic (30 retries, 1 second interval)
  - [x] Poll http://127.0.0.1:5000 with axios
  - [x] Return success or throw timeout error
- [x] 2.4 Implement window management
  - [x] Add `createWindow()` function
  - [x] Configure BrowserWindow with security settings
  - [x] Set window dimensions (1400x900, min 1200x700)
  - [x] Configure webPreferences (contextIsolation, preload)
  - [x] Load Flask URL after health check succeeds
  - [x] Show window only when ready
- [x] 2.5 Implement system tray
  - [x] Add `createTray()` function
  - [x] Load tray icon from assets
  - [x] Create context menu (Show, Check for Updates, Quit)
  - [x] Handle tray click to show/focus window
- [x] 2.6 Implement app lifecycle handlers
  - [x] `app.whenReady()` - Start Flask, create window, create tray, check updates
  - [x] `app.on('window-all-closed')` - Keep running on Windows (tray)
  - [x] `app.on('activate')` - Recreate window if needed (macOS behavior)
  - [x] `app.on('before-quit')` - Kill Flask subprocess
  - [x] `app.on('will-quit')` - Cleanup

## 3. Auto-Update Implementation
- [x] 3.1 Configure auto-updater settings
  - [x] Set `autoDownload = false` (ask user first)
  - [x] Set `autoInstallOnAppQuit = true`
- [x] 3.2 Implement update check on startup
  - [x] Check 5 seconds after app ready (allow UI to load)
  - [x] Skip in development mode (check `app.isPackaged`)
- [x] 3.3 Implement update event handlers
  - [x] `checking-for-update` - Log to console
  - [x] `update-available` - Show dialog with version info, offer download
  - [x] `update-not-available` - Log to console
  - [x] `download-progress` - Log progress percentage
  - [x] `update-downloaded` - Show restart dialog
  - [x] `error` - Log error details
- [x] 3.4 Add manual update check to tray menu
  - [x] "Check for Updates" menu item calls `autoUpdater.checkForUpdates()`

## 4. Security Configuration
- [x] 4.1 Create `electron/preload.js`
  - [x] Import contextBridge and ipcRenderer
  - [x] Expose safe APIs to renderer (platform, version)
  - [x] Document security boundaries in comments
- [x] 4.2 Configure BrowserWindow security
  - [x] Set `nodeIntegration: false`
  - [x] Set `contextIsolation: true`
  - [x] Set `preload` path to preload.js
- [x] 4.3 Verify no direct Node.js access from Flask pages
  - [x] Test DevTools console for Node APIs (should be undefined)

## 5. Asset Creation
- [ ] 5.1 Create application icon (📝 Documented in assets/ICONS_README.md)
  - [ ] Design or source Hool.gg branded icon (256x256px)
  - [ ] Convert to .ico format (16, 32, 48, 256 sizes)
  - [ ] Save as `electron/assets/icon.ico`
- [ ] 5.2 Create system tray icon (📝 Documented in assets/ICONS_README.md)
  - [ ] Create 16x16 and 32x32 versions
  - [ ] Save as `electron/assets/tray-icon.ico`
- [x] 5.3 Set icon paths in build config
  - [x] Update `package.json` build.win.icon
  - [x] Update `package.json` build.nsis.installerIcon

## 6. Python Bundling (📝 Complete guide in PYTHON_BUNDLING.md)
- [ ] 6.1 Download Python 3.11 embedded for Windows x64
  - [ ] From: https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip
  - [ ] Extract to `electron/python-embedded/`
- [ ] 6.2 Configure pip in embedded Python
  - [ ] Edit `python311._pth` to uncomment `import site`
  - [ ] Download get-pip.py
  - [ ] Run `python.exe get-pip.py` in embedded directory
- [ ] 6.3 Install Flask dependencies
  - [ ] Run `python.exe -m pip install Flask==3.0.0`
  - [ ] Run `python.exe -m pip install requests==2.31.0`
  - [ ] Verify imports work: `python.exe -c "import flask; print(flask.__version__)"`
- [ ] 6.4 Test Flask runs with embedded Python
  - [ ] Run `python.exe ../app.py` from electron/python-embedded/
  - [ ] Verify app starts on port 5000

## 7. Build Configuration
- [ ] 7.1 Configure electron-builder extraResources
  - [ ] Include Flask app files (app.py, templates/, static/, data.json)
  - [ ] Include python-embedded/ directory
  - [ ] Set proper filter patterns (exclude .git, node_modules, etc.)
- [ ] 7.2 Test local production build
  - [ ] Run `npm run build` in electron/
  - [ ] Verify output in `electron/dist/`
  - [ ] Check installer size (~150-200MB)
- [ ] 7.3 Test installer on clean Windows VM
  - [ ] Install app from .exe
  - [ ] Verify desktop shortcut created
  - [ ] Verify start menu shortcut created
  - [ ] Launch app and verify Flask starts
  - [ ] Test all features (character sync, drag-drop, etc.)
- [ ] 7.4 Test uninstaller
  - [ ] Run uninstaller from Control Panel
  - [ ] Verify files removed
  - [ ] Verify shortcuts removed

## 8. GitHub Actions CI/CD
- [ ] 8.1 Create `.github/workflows/build-release.yml`
  - [ ] Configure trigger on `tags: v*.*.*`
  - [ ] Set runner to `windows-latest`
- [ ] 8.2 Add workflow steps
  - [ ] Checkout code
  - [ ] Setup Node.js 20
  - [ ] Setup Python 3.11
  - [ ] Install Python dependencies (requirements.txt)
  - [ ] Download Python embedded distribution
  - [ ] Install pip in embedded Python
  - [ ] Install Flask in embedded Python
  - [ ] Install Electron dependencies (npm install)
  - [ ] Build app (npm run build:publish)
  - [ ] Upload build artifacts
  - [ ] Create GitHub Release
  - [ ] Upload installer to release
- [ ] 8.3 Configure GitHub secrets
  - [ ] Verify GH_TOKEN available (auto-provided)
- [ ] 8.4 Test workflow with pre-release tag
  - [ ] Push tag `v0.1.0-alpha`
  - [ ] Monitor GitHub Actions logs
  - [ ] Verify release created
  - [ ] Download installer from release
  - [ ] Test installation

## 9. Auto-Update Testing
- [ ] 9.1 Test update detection
  - [ ] Install v0.1.0-alpha
  - [ ] Create v0.2.0-alpha release
  - [ ] Launch app
  - [ ] Verify "Update Available" dialog appears
- [ ] 9.2 Test update download
  - [ ] Click "Download" in dialog
  - [ ] Verify progress shown in logs
  - [ ] Verify "Update Ready" dialog appears after download
- [ ] 9.3 Test update installation
  - [ ] Click "Restart Now"
  - [ ] Verify app quits
  - [ ] Verify installer runs
  - [ ] Verify app relaunches with new version
- [ ] 9.4 Test update error handling
  - [ ] Simulate network error (disable WiFi during download)
  - [ ] Verify error logged, app continues working
  - [ ] Test manual update check from tray menu

## 10. Documentation
- [x] 10.1 Create `electron/README.md`
  - [x] Document development setup (npm install, npm start)
  - [x] Document build process (npm run build)
  - [x] Document Python bundling steps
  - [x] Document troubleshooting common issues
- [x] 10.2 Create `ELECTRON_SETUP.md` in project root
  - [x] Complete step-by-step guide for users
  - [x] How to install app
  - [x] How auto-updates work
  - [x] How to create GitHub releases
  - [x] Release process documentation
- [x] 10.3 Create development setup script
  - [x] `electron/setup-dev.bat` for Windows
  - [x] Automates: npm install, pip install
  - [x] Prints success/error messages
- [x] 10.4 Update main README.md
  - [x] Add "Download" section with release link
  - [x] Add "Desktop App" section explaining features
  - [x] Link to ELECTRON_SETUP.md for developers

## 11. Release Preparation
- [x] 11.1 Version alignment
  - [x] Set version in `electron/package.json` to `1.0.0`
  - [x] Ensure version consistency across docs
- [ ] 11.2 Create GitHub repository (if not exists)
  - [ ] Make repository public (required for auto-updates)
  - [ ] Add description and topics
  - [ ] Enable Releases feature
- [ ] 11.3 Update package.json repository URLs
  - [ ] Replace `YOUR_USERNAME` with actual GitHub username
  - [ ] Verify repository URL correct
  - [ ] Verify publish.owner and publish.repo correct
- [ ] 11.4 Final testing checklist
  - [ ] Clean VM install test
  - [ ] Update flow test (v1.0.0 → v1.0.1-test)
  - [ ] System tray functionality
  - [ ] Window hide/show behavior
  - [ ] Flask subprocess lifecycle
  - [ ] All Flask features work (sync, drag-drop, tasks, etc.)

## 12. Production Release
- [ ] 12.1 Commit all changes
  - [ ] Git add electron/, .github/workflows/, docs
  - [ ] Commit message: "Add Electron desktop app with auto-updates"
- [ ] 12.2 Push to GitHub
  - [ ] Push to main branch
  - [ ] Verify GitHub Actions workflow file visible
- [ ] 12.3 Create release tag
  - [ ] Create tag: `git tag v1.0.0`
  - [ ] Push tag: `git push origin v1.0.0`
- [ ] 12.4 Monitor automated build
  - [ ] Watch GitHub Actions workflow execute
  - [ ] Verify build succeeds (~10-15 minutes)
  - [ ] Verify GitHub Release created
  - [ ] Verify installer uploaded to release
- [ ] 12.5 Test production release
  - [ ] Download installer from GitHub Release
  - [ ] Install on clean system
  - [ ] Verify all features work
  - [ ] Verify update check works (should say "up to date")

## 13. Post-Release
- [ ] 13.1 Announce release
  - [ ] Share download link with users
  - [ ] Document installation instructions
- [ ] 13.2 Monitor for issues
  - [ ] Check GitHub Issues for bug reports
  - [ ] Monitor installer download count
- [ ] 13.3 Plan next release
  - [ ] Test update flow (v1.0.0 → v1.1.0)
  - [ ] Verify update adoption metrics

## Notes
- Each task should be completed in order
- Test thoroughly after each major section (sections 1-7 before CI/CD)
- Use `npm start` for development testing (fast iteration)
- Use `npm run build` for production testing (slow but complete)
- Keep Flask app unchanged (all changes in `electron/` directory)
- Auto-updates only work with public GitHub repositories
