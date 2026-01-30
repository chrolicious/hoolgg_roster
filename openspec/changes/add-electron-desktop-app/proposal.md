# Change: Add Electron Desktop Application with Auto-Update

## Why

The Flask-based Hool.gg Roster currently runs as a web application requiring users to manually start a local server and open a browser. This creates friction for non-technical users and lacks professional distribution mechanisms. Converting to an Electron desktop application provides:

1. **Professional Distribution** - Single-click installer with no Python/browser setup required
2. **Auto-Update System** - Automatic updates via GitHub Releases without user intervention
3. **Native Experience** - Proper desktop window, system tray integration, no browser chrome
4. **Simplified Installation** - Bundled Python environment eliminates dependency conflicts

## What Changes

- Add Electron wrapper that launches Flask backend and displays UI in embedded Chromium window
- Implement auto-update system using electron-updater with GitHub Releases as distribution channel
- Bundle Python environment with Flask app for standalone execution
- Create Windows installer (NSIS) with desktop/start menu shortcuts
- Add system tray integration for background operation
- Implement GitHub Actions workflow for automated builds on version tags
- Add development and production build configurations

**BREAKING**: None - web version remains functional alongside desktop app

## Impact

### Affected Specs
- **ADDED**: `desktop-app` - New capability for desktop packaging and distribution

### Affected Code
- New directory: `electron/` containing all Electron-specific code
  - `main.js` - Main process (window management, Flask lifecycle, auto-updates)
  - `preload.js` - Security bridge between Node.js and renderer
  - `package.json` - Dependencies, build config, auto-update settings
  - `assets/` - Application icons (app icon, tray icon)
- New workflow: `.github/workflows/build-release.yml` - Automated build pipeline
- Documentation: `electron/README.md`, `ELECTRON_SETUP.md` - Setup and usage guides
- No changes to existing Flask app (app.py, templates, static files remain unchanged)

### User Impact
- **Existing users**: Web app continues working identically
- **New users**: Can download installer from GitHub Releases
- **All users**: Desktop app provides better UX with auto-updates

### Technical Constraints
- Windows-only initially (electron-builder configured for win32)
- Requires ~150-200MB download (includes Python + Chromium)
- Auto-updates require public GitHub repository
- Code signing optional but recommended (prevents Windows SmartScreen warnings)

### Dependencies Added
- Electron 28.x (desktop framework)
- electron-updater 6.x (auto-update mechanism)
- electron-builder 24.x (packaging and installer creation)
- axios (HTTP client for Flask health checks)
- Python 3.11 embedded (bundled runtime)
