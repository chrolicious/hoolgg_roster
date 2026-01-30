## ADDED Requirements

### Requirement: Desktop Application Packaging
The system SHALL package the Flask web application as a standalone Windows desktop application using Electron, bundling all dependencies including Python runtime and Flask framework.

#### Scenario: User installs application without Python
- **GIVEN** a Windows computer without Python installed
- **WHEN** user downloads and runs the installer
- **THEN** the application SHALL install successfully
- **AND** the application SHALL launch without requiring Python installation
- **AND** Flask SHALL run using the bundled Python environment

#### Scenario: Application startup
- **GIVEN** the desktop application is installed
- **WHEN** user launches the application from desktop shortcut
- **THEN** Flask server SHALL start automatically in the background
- **AND** application window SHALL appear within 5 seconds
- **AND** Flask SHALL be accessible at http://127.0.0.1:5000

#### Scenario: Application shutdown
- **GIVEN** the desktop application is running
- **WHEN** user closes the application window
- **THEN** the window SHALL hide to system tray
- **AND** Flask SHALL continue running in background
- **WHEN** user quits from system tray
- **THEN** Flask subprocess SHALL terminate gracefully
- **AND** all application resources SHALL be released

### Requirement: Automatic Updates from GitHub Releases
The system SHALL implement automatic update checking and installation using GitHub Releases as the distribution mechanism, providing users with seamless updates without manual intervention.

#### Scenario: Update check on application start
- **GIVEN** the desktop application is running
- **AND** a newer version is available on GitHub Releases
- **WHEN** 5 seconds have elapsed since application start
- **THEN** the system SHALL check GitHub Releases API for updates
- **AND** the system SHALL display "Update Available" dialog with new version number
- **AND** dialog SHALL offer [Download] and [Later] options

#### Scenario: User downloads update
- **GIVEN** "Update Available" dialog is shown
- **WHEN** user clicks [Download] button
- **THEN** the system SHALL download the new installer in background
- **AND** download progress SHALL be logged to console
- **WHEN** download completes successfully
- **THEN** the system SHALL display "Update Ready" dialog
- **AND** dialog SHALL offer [Restart Now] and [Later] options

#### Scenario: User installs update
- **GIVEN** "Update Ready" dialog is shown
- **WHEN** user clicks [Restart Now]
- **THEN** the system SHALL quit the application
- **AND** the system SHALL run the downloaded installer
- **AND** the installer SHALL upgrade the application automatically
- **AND** the application SHALL relaunch with new version after installation

#### Scenario: No update available
- **GIVEN** the desktop application is running
- **AND** the current version is the latest
- **WHEN** update check executes
- **THEN** the system SHALL log "App is up to date" to console
- **AND** no dialog SHALL be shown to user

#### Scenario: Manual update check
- **GIVEN** the application is running in system tray
- **WHEN** user right-clicks tray icon
- **AND** user selects "Check for Updates"
- **THEN** the system SHALL immediately check for updates
- **AND** follow the normal update flow (dialog, download, install)

#### Scenario: Update check network failure
- **GIVEN** the desktop application is running
- **AND** network is unavailable
- **WHEN** update check executes
- **THEN** the system SHALL log error to console
- **AND** the application SHALL continue functioning normally
- **AND** no error dialog SHALL be shown to user

### Requirement: System Tray Integration
The system SHALL integrate with Windows system tray, allowing the application to run in background and providing quick access via tray icon.

#### Scenario: Minimize to system tray
- **GIVEN** the application window is open
- **WHEN** user closes the window (clicks X button)
- **THEN** the window SHALL hide
- **AND** application SHALL remain running in system tray
- **AND** tray icon SHALL be visible in Windows taskbar notification area

#### Scenario: Restore from system tray
- **GIVEN** application is minimized to system tray
- **WHEN** user clicks the tray icon
- **THEN** the application window SHALL show
- **AND** the window SHALL focus and move to foreground

#### Scenario: System tray context menu
- **GIVEN** application is running in system tray
- **WHEN** user right-clicks the tray icon
- **THEN** context menu SHALL appear with options:
  - Show App (restores window)
  - Check for Updates (triggers manual update check)
  - Quit (exits application completely)

#### Scenario: Quit from system tray
- **GIVEN** application is running in system tray
- **WHEN** user right-clicks tray icon
- **AND** user selects "Quit"
- **THEN** the application SHALL exit completely
- **AND** Flask subprocess SHALL terminate
- **AND** tray icon SHALL disappear

### Requirement: Flask Subprocess Management
The system SHALL manage the Flask web server as a child subprocess, ensuring proper lifecycle management and health monitoring.

#### Scenario: Flask startup in production mode
- **GIVEN** the packaged application is launched
- **WHEN** Electron main process starts
- **THEN** Flask SHALL be spawned as subprocess using bundled Python
- **AND** Flask SHALL run at http://127.0.0.1:5000
- **AND** FLASK_ENV SHALL be set to "production"

#### Scenario: Flask startup in development mode
- **GIVEN** the application is run via `npm start`
- **WHEN** Electron main process starts
- **THEN** Flask SHALL be spawned using system Python
- **AND** Flask SHALL run at http://127.0.0.1:5000

#### Scenario: Flask health check before window display
- **GIVEN** Flask subprocess has been spawned
- **WHEN** Flask is starting up
- **THEN** the system SHALL poll http://127.0.0.1:5000 with 1-second intervals
- **AND** the system SHALL retry up to 30 times (30-second timeout)
- **WHEN** Flask responds with HTTP 200
- **THEN** the application window SHALL load Flask URL
- **AND** the window SHALL display to user

#### Scenario: Flask startup timeout
- **GIVEN** Flask subprocess has been spawned
- **WHEN** Flask fails to respond after 30 seconds
- **THEN** the system SHALL log timeout error
- **AND** the system SHALL display error dialog to user
- **AND** the application SHALL quit

#### Scenario: Flask subprocess logs
- **GIVEN** Flask is running as subprocess
- **WHEN** Flask writes to stdout or stderr
- **THEN** output SHALL be captured and logged to Electron console
- **AND** logs SHALL be visible in DevTools (Ctrl+Shift+I)

#### Scenario: Flask subprocess cleanup on quit
- **GIVEN** Flask is running as subprocess
- **WHEN** user quits the application
- **THEN** Flask subprocess SHALL be killed (SIGTERM)
- **AND** Flask process SHALL not remain as zombie process

### Requirement: Security Configuration
The system SHALL implement Electron security best practices, isolating web content from Node.js and preventing XSS vulnerabilities.

#### Scenario: Context isolation enabled
- **GIVEN** BrowserWindow is created
- **THEN** contextIsolation SHALL be set to true
- **AND** nodeIntegration SHALL be set to false
- **AND** web content SHALL not have direct access to Node.js APIs

#### Scenario: Preload script security bridge
- **GIVEN** contextIsolation is enabled
- **WHEN** web content loads in renderer process
- **THEN** preload script SHALL execute before web content
- **AND** preload script SHALL expose only safe APIs via contextBridge
- **AND** exposed APIs SHALL include: platform, electron version
- **AND** Node.js require/import SHALL remain inaccessible to web content

#### Scenario: Flask localhost trust
- **GIVEN** Flask is running on localhost
- **WHEN** BrowserWindow loads Flask URL
- **THEN** all Flask endpoints SHALL be accessible without CORS restrictions
- **AND** Flask SHALL be trusted as local application server

### Requirement: Automated Build Pipeline
The system SHALL provide automated build and release process via GitHub Actions, triggered by version tags and publishing to GitHub Releases.

#### Scenario: Automated build on version tag
- **GIVEN** a GitHub repository with GitHub Actions enabled
- **WHEN** developer pushes a tag matching pattern `v*.*.*` (e.g., v1.0.0)
- **THEN** GitHub Actions workflow SHALL trigger
- **AND** workflow SHALL build the Electron application on Windows VM
- **AND** workflow SHALL download Python embedded distribution
- **AND** workflow SHALL install Flask dependencies in embedded Python
- **AND** workflow SHALL run electron-builder to create installer

#### Scenario: Automated release creation
- **GIVEN** build succeeds in GitHub Actions
- **WHEN** installer .exe is generated
- **THEN** workflow SHALL create GitHub Release with tag name
- **AND** workflow SHALL upload installer to release assets
- **AND** workflow SHALL generate update metadata (latest.yml)
- **AND** release SHALL be marked as "Latest" on GitHub

#### Scenario: Build failure notification
- **GIVEN** GitHub Actions workflow is triggered
- **WHEN** build fails at any step
- **THEN** workflow SHALL fail with error message
- **AND** no release SHALL be created
- **AND** developer SHALL receive email notification

### Requirement: Installer Configuration
The system SHALL provide a Windows installer using NSIS that installs the application with proper shortcuts and uninstall capability.

#### Scenario: Installer creates desktop shortcut
- **GIVEN** user runs the installer
- **WHEN** installation completes
- **THEN** desktop shortcut SHALL be created with application icon
- **AND** shortcut SHALL launch the application when clicked

#### Scenario: Installer creates Start Menu entry
- **GIVEN** user runs the installer
- **WHEN** installation completes
- **THEN** Start Menu entry SHALL be created under "Hool.gg Roster"
- **AND** entry SHALL launch the application when clicked

#### Scenario: User chooses installation directory
- **GIVEN** installer is running in custom mode (not one-click)
- **WHEN** user reaches directory selection screen
- **THEN** user SHALL be able to choose custom installation directory
- **AND** default SHALL be `C:\Program Files\Hool.gg Roster\`

#### Scenario: Uninstaller removes all files
- **GIVEN** application is installed
- **WHEN** user runs uninstaller from Control Panel
- **THEN** all application files SHALL be removed
- **AND** desktop shortcut SHALL be removed
- **AND** Start Menu entry SHALL be removed
- **AND** registry entries SHALL be cleaned up
- **AND** user data (data.json) SHALL be preserved

### Requirement: Development and Production Modes
The system SHALL support both development mode (for developers) and production mode (for end users) with appropriate configuration for each.

#### Scenario: Development mode startup
- **GIVEN** developer has cloned the repository
- **AND** run `npm install` in electron/ directory
- **WHEN** developer runs `npm start`
- **THEN** Flask SHALL start using system Python
- **AND** Electron window SHALL open in development mode
- **AND** DevTools SHALL be accessible
- **AND** auto-update checks SHALL be skipped

#### Scenario: Production mode startup
- **GIVEN** user has installed the application from installer
- **WHEN** user launches the application
- **THEN** Flask SHALL start using bundled Python from resources
- **AND** Electron window SHALL open in production mode
- **AND** DevTools SHALL be disabled (unless manually opened)
- **AND** auto-update checks SHALL run normally

#### Scenario: Development build for testing
- **GIVEN** developer wants to test production build locally
- **WHEN** developer runs `npm run build`
- **THEN** electron-builder SHALL create installer in `dist/` folder
- **AND** developer SHALL be able to install and test the packaged version
- **AND** build SHALL not publish to GitHub

### Requirement: Cross-Version Compatibility
The system SHALL maintain compatibility with the standalone Flask web version, allowing both to coexist and share data files.

#### Scenario: Shared data.json file
- **GIVEN** both desktop app and web app installed
- **WHEN** user modifies data in desktop app (e.g., adds character)
- **THEN** changes SHALL be saved to data.json
- **WHEN** user opens web app (http://127.0.0.1:5000)
- **THEN** changes SHALL be visible in web app
- **AND** data format SHALL be compatible between versions

#### Scenario: Port conflict handling
- **GIVEN** web app is already running on port 5000
- **WHEN** user launches desktop app
- **THEN** Flask subprocess SHALL fail to start (port in use)
- **AND** desktop app SHALL display error message
- **AND** error message SHALL suggest closing existing Flask instance

#### Scenario: Web app continues working
- **GIVEN** desktop app is installed
- **WHEN** user runs Flask directly via `python app.py`
- **THEN** web app SHALL start normally on port 5000
- **AND** web app SHALL function identically to before desktop app existed
- **AND** no desktop app features SHALL interfere with web version
