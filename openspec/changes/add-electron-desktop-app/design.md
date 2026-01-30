# Design: Electron Desktop Application Architecture

## Context

Hool.gg Roster is a Flask-based web application for tracking WoW character progression. Users currently run it locally via Python CLI, which requires technical knowledge and lacks update mechanisms. This design addresses how to package the app as a distributable desktop application with automatic updates.

### Background
- **Current**: Flask app on http://127.0.0.1:5000, user manages server lifecycle
- **Target**: Native Windows app with embedded Flask, auto-updates, professional installer
- **Users**: WoW players (varied technical skill levels)
- **Distribution**: GitHub Releases (free, familiar workflow)

### Constraints
- Must maintain Flask backend unchanged (no Flask rewrites)
- Must work offline after initial install
- Must support auto-updates from GitHub
- Budget: Free tooling only (no paid code signing initially)

### Stakeholders
- **End Users**: Want simple install, automatic updates, no technical setup
- **Developer**: Wants maintainable build process, automated releases
- **Distribution**: GitHub provides free hosting for releases

## Goals / Non-Goals

### Goals
1. Single-file installer that bundles all dependencies (Python, Flask, app code)
2. Auto-update system that checks GitHub Releases on app launch
3. Native Windows experience (system tray, proper window, no browser UI)
4. Automated build pipeline (tag push → build → release)
5. Development mode that works without full build process

### Non-Goals
- Cross-platform support initially (macOS/Linux can come later)
- Offline installer (updates require internet)
- Code signing (optional enhancement, not blocking v1)
- Custom update server (GitHub Releases is sufficient)
- Multiple installation modes (single-user install only)

## Decisions

### 1. Desktop Framework: Electron vs Alternatives

**Decision**: Use Electron

**Rationale**:
- **Electron Pros**:
  - Mature ecosystem with excellent auto-update support (electron-updater)
  - Embeds Chromium (consistent rendering across Windows versions)
  - Strong Python integration examples in community
  - electron-builder handles installer creation, code signing, updates
  - Can bundle arbitrary files (Python, Flask app)

- **Alternatives Considered**:
  - **PyWebView**: Lighter (~30MB vs 150MB) but limited update mechanisms, uses system webview (EdgeHTML inconsistencies)
  - **Tauri**: Modern/smaller but immature, complex Rust toolchain, limited Python bundling support
  - **NW.js**: Similar to Electron but smaller community, weaker updater

**Trade-off**: Larger download size (150-200MB) for better update UX and ecosystem maturity

### 2. Python Bundling: Embedded vs Installer

**Decision**: Bundle Python 3.11 embedded distribution

**Rationale**:
- **Embedded Python Pros**:
  - No system PATH pollution
  - Version-locked (no "Python 3.9 vs 3.11" conflicts)
  - Portable (users without Python can run app)
  - Only ~50MB compressed

- **Alternatives Considered**:
  - **Require system Python**: Fragile (users have wrong versions, missing pip)
  - **PyInstaller**: Packages Python+Flask as single .exe but complex with Flask, harder to debug
  - **Virtual environment**: Still requires Python installed, version conflicts

**Trade-off**: Larger installer but eliminates dependency issues

### 3. Auto-Update Distribution: GitHub Releases vs Custom Server

**Decision**: Use GitHub Releases with electron-updater

**Rationale**:
- **GitHub Releases Pros**:
  - Free hosting (unlimited bandwidth for public repos)
  - Built-in versioning (git tags map to releases)
  - electron-updater has native GitHub support
  - Familiar developer workflow (git tag → CI builds → release)
  - No server maintenance

- **Alternatives Considered**:
  - **Custom S3/CDN**: Costs money, requires infrastructure maintenance
  - **Squirrel.Windows**: Older update framework, less active
  - **Manual downloads**: No auto-update, poor UX

**Trade-off**: Requires public GitHub repo (acceptable for open-source project)

### 4. Build Automation: GitHub Actions vs Local Builds

**Decision**: GitHub Actions for production builds, local builds for testing

**Rationale**:
- **GitHub Actions Pros**:
  - Free CI/CD for public repos
  - Reproducible builds (same environment every time)
  - Automated release creation on git tags
  - No developer machine setup (Windows VM included)

- **Alternatives Considered**:
  - **Manual local builds**: Fragile (works on my machine), time-consuming
  - **AppVeyor/CircleCI**: Less integrated with GitHub Releases

**Trade-off**: Requires pushing code to trigger builds (acceptable, matches Git workflow)

### 5. Flask Lifecycle: Subprocess vs Embedded

**Decision**: Launch Flask as subprocess, monitor health with HTTP polling

**Rationale**:
- **Subprocess Pros**:
  - Flask runs in separate process (Electron crash doesn't kill Flask)
  - Easy to restart Flask if it crashes
  - Clean shutdown on app quit (kill subprocess)
  - Simpler than embedding Flask in Electron's Node process

- **Implementation**:
  ```javascript
  // Start Flask subprocess
  flaskProcess = spawn(pythonPath, [appPath], { env: { FLASK_ENV: 'production' } });

  // Poll for readiness
  await waitForFlask(); // Try http://127.0.0.1:5000 with retries

  // Show window only when ready
  mainWindow.loadURL('http://127.0.0.1:5000');
  ```

**Trade-off**: Small startup delay (1-2 seconds) while Flask initializes

### 6. Security Model: Context Isolation + Preload Script

**Decision**: Enable contextIsolation, use preload.js for controlled API exposure

**Rationale**:
- **Security Requirements**:
  - Web content should not access Node.js directly (XSS protection)
  - Only expose specific APIs via preload script
  - Flask backend is trusted (localhost only, no CORS issues)

- **Configuration**:
  ```javascript
  webPreferences: {
    nodeIntegration: false,        // No Node in renderer
    contextIsolation: true,        // Separate contexts
    preload: path.join(__dirname, 'preload.js')
  }
  ```

**Trade-off**: Slightly more complex than disabling security, but prevents vulnerabilities

### 7. System Tray: Keep Running vs Exit on Close

**Decision**: Keep app running in system tray when window closes

**Rationale**:
- **UX Benefits**:
  - Fast re-open (Flask already running)
  - Matches desktop app expectations (Discord, Slack behavior)
  - Allows background data sync (future feature)

- **Implementation**:
  ```javascript
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  ```

**Trade-off**: Uses memory when "closed" (acceptable, ~100MB)

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│              Electron Main Process              │
│  ┌──────────────────────────────────────────┐  │
│  │  Auto-Updater (electron-updater)         │  │
│  │  - Checks GitHub Releases API            │  │
│  │  - Downloads updates in background       │  │
│  │  - Schedules install on quit             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Flask Subprocess Manager                │  │
│  │  - Spawns python.exe + app.py           │  │
│  │  - Monitors health (HTTP polling)        │  │
│  │  - Kills on app quit                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  BrowserWindow                           │  │
│  │  - Loads http://127.0.0.1:5000          │  │
│  │  - Context isolation enabled             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  System Tray                             │  │
│  │  - Show/Hide window                      │  │
│  │  - Check for updates                     │  │
│  │  - Quit app                              │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                       │
                       │ HTTP (localhost:5000)
                       ▼
┌─────────────────────────────────────────────────┐
│           Flask Subprocess (Python)             │
│  ┌──────────────────────────────────────────┐  │
│  │  Flask App (app.py)                      │  │
│  │  - Serves static files                   │  │
│  │  - Renders templates                     │  │
│  │  - API endpoints                         │  │
│  │  - Blizzard API integration              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Data Storage (data.json)                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### File Structure

```
midnight_tracker/
├── app.py                          # Flask backend (unchanged)
├── data.json                       # User data
├── templates/                      # Flask templates (unchanged)
├── static/                         # CSS/JS (unchanged)
├── electron/
│   ├── main.js                    # Electron main process
│   │   - Window management
│   │   - Flask subprocess lifecycle
│   │   - Auto-update handlers
│   │   - System tray setup
│   ├── preload.js                 # Security bridge (minimal)
│   ├── package.json               # NPM config + build settings
│   │   - Dependencies (electron, electron-updater)
│   │   - Build config (electron-builder)
│   │   - Auto-update config (GitHub provider)
│   ├── assets/
│   │   ├── icon.ico              # App icon (256x256)
│   │   └── tray-icon.ico         # Tray icon (16x16)
│   └── python-embedded/           # Bundled Python (not in git)
│       ├── python.exe
│       ├── python311.dll
│       └── Lib/                   # Flask + dependencies
└── .github/
    └── workflows/
        └── build-release.yml      # CI/CD pipeline
```

### Build Process

```
Developer                  GitHub Actions              Users
    │                           │                        │
    │ 1. git tag v1.0.0         │                        │
    │ ──────────────────────>   │                        │
    │                           │                        │
    │ 2. git push origin v1.0.0 │                        │
    │ ──────────────────────>   │                        │
    │                           │                        │
    │                       3. Trigger build             │
    │                           │                        │
    │                       4. Download Python           │
    │                           │   embedded              │
    │                           │                        │
    │                       5. npm install               │
    │                           │                        │
    │                       6. electron-builder build    │
    │                           │   → .exe installer     │
    │                           │                        │
    │                       7. Create GitHub Release     │
    │                           │   + upload .exe        │
    │                           │                        │
    │                           │ ────────────────────>  │
    │                           │         8. Download    │
    │                           │            installer   │
    │                           │                        │
    │                           │                9. Run  │
    │                           │            app, check  │
    │                           │            for updates │
```

### Auto-Update Flow

```
App Startup
    │
    ├─> Check GitHub Releases API
    │   (https://api.github.com/repos/{owner}/{repo}/releases/latest)
    │
    ├─> Compare version (current vs latest)
    │
    ├─> If update available:
    │   │
    │   ├─> Show dialog: "Update Available - v1.1.0"
    │   │   Options: [Download] [Later]
    │   │
    │   ├─> User clicks Download
    │   │
    │   ├─> Download .exe in background
    │   │   (shows progress: 45% - 12MB/26MB)
    │   │
    │   ├─> Download complete
    │   │
    │   ├─> Show dialog: "Update Ready"
    │   │   Options: [Restart Now] [Later]
    │   │
    │   └─> User clicks Restart
    │       │
    │       ├─> Quit app
    │       ├─> Run installer (auto-upgrade)
    │       └─> Relaunch with new version
    │
    └─> If no update:
        Continue normal operation
```

## Risks / Trade-offs

### Risk: Large Download Size (~150-200MB)
- **Mitigation**: Document file size prominently, use delta updates for subsequent releases (~5-10MB)
- **Trade-off**: Eliminates Python installation issues, consistent experience

### Risk: Auto-Update Failures
- **Mitigation**:
  - Graceful degradation (app still works if update check fails)
  - Users can manually download from GitHub
  - Retry logic with exponential backoff
- **Trade-off**: Some users may stay on old versions (acceptable)

### Risk: Windows SmartScreen Warnings (Unsigned Code)
- **Mitigation**:
  - Document warning in README with screenshots
  - Note that warning disappears after enough downloads
  - Provide option to purchase code signing cert later ($200/year)
- **Trade-off**: Initial friction for cautious users

### Risk: GitHub API Rate Limits (60 req/hour unauthenticated)
- **Mitigation**:
  - Check for updates max once per app launch
  - Use `If-Modified-Since` header to reduce API hits
  - Rate limit is per IP (home users unlikely to hit)
- **Trade-off**: Slow update propagation if many users launch simultaneously

### Risk: Flask Startup Failures
- **Mitigation**:
  - Health check with 30 retries (30 seconds timeout)
  - Show error dialog with logs if Flask fails to start
  - Include troubleshooting guide in error message
- **Trade-off**: Slightly longer startup time (~2 seconds)

### Risk: Breaking Changes in Flask App
- **Mitigation**:
  - Flask app continues running standalone (dev/test use)
  - Electron wrapper is thin (minimal coupling)
  - Version pinning (package.json locks Electron version)
- **Trade-off**: Requires testing both web and desktop modes

## Migration Plan

### Phase 1: Development Setup (Week 1)
1. Create `electron/` directory with Electron boilerplate
2. Implement Flask subprocess management
3. Add health check polling (axios → localhost:5000)
4. Test in development mode (`npm start`)
5. Verify Flask app still works standalone

### Phase 2: Build Configuration (Week 1)
1. Configure electron-builder for Windows NSIS installer
2. Download and bundle Python 3.11 embedded
3. Install Flask in embedded Python (pip install)
4. Test production build locally (`npm run build`)
5. Verify installer works on clean Windows VM

### Phase 3: Auto-Update System (Week 2)
1. Add electron-updater dependency
2. Implement update check on app launch
3. Add update dialogs (available, downloading, ready)
4. Configure GitHub provider in package.json
5. Test with mock GitHub releases (fake version tags)

### Phase 4: CI/CD Pipeline (Week 2)
1. Create GitHub Actions workflow
2. Add Python download step (embedded distribution)
3. Add npm install + electron-builder build steps
4. Configure automatic release creation on tags
5. Test with real tag push (v0.1.0-alpha)

### Phase 5: Documentation & Release (Week 3)
1. Write user-facing README (how to install)
2. Write developer-facing guide (how to build/release)
3. Create app icons (icon.ico, tray-icon.ico)
4. Test complete flow: tag → build → release → update
5. Release v1.0.0 to production

### Rollback Plan
If Electron app is unusable:
1. Users can fall back to web version (Flask still works)
2. Mark GitHub Release as "pre-release" to stop auto-updates
3. Delete tag to prevent new installs
4. Fix issues, release patched version

### Backward Compatibility
- Web version continues working (no breaking changes to Flask app)
- Users can run both (different ports if needed)
- Data file (`data.json`) compatible between versions

## Open Questions

1. **Code Signing**: Should we purchase certificate immediately or wait for user feedback?
   - **Decision**: Wait - unsigned app works, adds ~$200 cost

2. **macOS/Linux Support**: Priority for cross-platform?
   - **Decision**: Windows-first, add others based on demand

3. **Update Channel**: Stable vs Beta releases?
   - **Decision**: Single stable channel initially, add beta channel if needed

4. **Crash Reporting**: Add Sentry or similar?
   - **Decision**: Not v1 - can add later if crash reports become issue

5. **Offline Mode**: Should app work without internet?
   - **Decision**: Yes - app works offline, only updates require internet

## Implementation Notes

### Critical Paths
1. **Flask Health Check**: Must reliably detect Flask startup before showing window
   - Retry logic essential (Flask takes 1-2 seconds to start)
   - Timeout prevents infinite waiting if Flask crashes

2. **Auto-Update Checksum Verification**: electron-updater verifies signatures
   - GitHub provides SHA512 checksums in `latest.yml`
   - Prevents malicious update injection

3. **Process Cleanup**: Must kill Flask subprocess on app quit
   - Use `flaskProcess.kill()` in `before-quit` event
   - Prevents orphaned Python processes

### Performance Targets
- **Startup Time**: <5 seconds (Flask init + window load)
- **Update Check**: <2 seconds (GitHub API call)
- **Download Speed**: Limited by user bandwidth, show progress
- **Memory Usage**: ~150MB (Electron) + ~50MB (Flask) = 200MB total

### Testing Strategy
1. **Manual Testing**:
   - Install on clean Windows 10/11 VMs
   - Test update flow with sequential version tags
   - Verify Flask logs accessible (DevTools console)

2. **Automated Testing** (future):
   - Spectron for Electron UI testing
   - Jest for main process unit tests
   - Flask pytest suite unchanged

### Success Metrics
- **Installation Success Rate**: >95% (from GitHub release download stats)
- **Update Adoption**: >80% on v1.1.0 within 1 week of release
- **Crash Rate**: <1% (via GitHub Issues)
- **User Feedback**: Positive (less "how do I install Python?" questions)

## References

- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [electron-builder](https://www.electron.build/)
- [electron-updater Auto-Update](https://www.electron.build/auto-update)
- [Python Embedded Distribution](https://docs.python.org/3/using/windows.html#embedded-distribution)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [NSIS Installer](https://nsis.sourceforge.io/Docs/)
