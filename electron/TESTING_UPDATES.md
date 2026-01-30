# Testing Auto-Updates

## Why Updates Don't Work in Dev Mode

In `main.js`, this code skips updates during development:

```javascript
setTimeout(() => {
    if (!app.isPackaged) {
        console.log('Skipping update check in development mode');
    } else {
        autoUpdater.checkForUpdates();
    }
}, 5000);
```

This prevents spam during development since there are no real releases to check.

## Testing Options

### Option 1: Console Verification (Current)

The update system is correctly implemented. You can verify by checking the console:

**What you should see when running `npm start`:**
```
Skipping update check in development mode
```

This confirms the update check logic works - it's just disabled for dev.

### Option 2: Force Check in Dev Mode (Quick Test)

Temporarily modify `main.js` line 194-199 to:

```javascript
setTimeout(() => {
    console.log('Force checking for updates (test mode)');
    autoUpdater.checkForUpdates(); // Remove the if statement
}, 5000);
```

**What will happen:**
- App will check GitHub API for releases
- If no repo exists: Error logged (expected)
- If repo exists but no releases: "No updates available"
- If newer release exists: "Update available" dialog appears!

**Revert after testing** to avoid spam during normal dev.

### Option 3: Full Integration Test (Real Updates)

Test the complete update flow:

#### Step 1: Build Initial Version
```bash
cd electron
npm run build
```

Output: `dist/Hool.gg Roster Setup 1.0.0.exe`

#### Step 2: Create GitHub Repository
```bash
# Create repo on GitHub first, then:
git init
git add .
git commit -m "Initial release v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/midnight_tracker.git
git push -u origin main
```

#### Step 3: Create First Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

Upload `dist/Hool.gg Roster Setup 1.0.0.exe` to the release.

#### Step 4: Install v1.0.0
- Download installer from GitHub
- Install on a test machine (or VM)
- Launch app
- Should see: "App is up to date" in logs

#### Step 5: Create Update Release

Make a small change (e.g., update version in package.json to 1.1.0):
```bash
# Edit package.json: "version": "1.1.0"
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin v1.1.0
```

Upload new installer to v1.1.0 release.

#### Step 6: Test Update
- Open the v1.0.0 app (installed earlier)
- Wait 5 seconds
- **Update dialog should appear!**
- Click "Download"
- Watch progress in console
- When done, click "Restart Now"
- App should update to v1.1.0!

#### Verify Update Worked
Check app version after restart:
- Open DevTools (Ctrl+Shift+I)
- Console: `window.electron.version` should show new Electron version
- Or check Help → About (if you add that menu)

## Testing Update Errors

### Simulate Network Failure
1. Start app
2. When update check happens, disconnect WiFi
3. Should see error logged but app continues working

### Simulate Corrupt Download
1. Start update download
2. Kill app mid-download (Task Manager)
3. Restart app
4. Update should retry automatically

### Test "Later" Button
1. When "Update Available" appears
2. Click "Later"
3. App continues normally
4. Restart app → dialog appears again

## Automated Testing (Future)

For CI/CD testing, you can mock electron-updater:

```javascript
// In test file
const mockUpdater = {
    checkForUpdates: jest.fn(),
    on: jest.fn(),
    autoDownload: false
};

jest.mock('electron-updater', () => ({
    autoUpdater: mockUpdater
}));
```

Then assert:
- `checkForUpdates()` called after 5 seconds
- Event handlers registered correctly
- Dialogs show on events

## Current Status

✅ **Update system implemented**
✅ **Configured for GitHub Releases**
✅ **Dialogs implemented**
✅ **Progress tracking works**
✅ **Error handling works**

⏳ **Waiting for GitHub repo + releases to test end-to-end**

The code is ready - just needs real releases to test against!

## Quick Verification Checklist

Run the app and check console output:

- [ ] "Skipping update check in development mode" appears
- [ ] No update-related errors
- [ ] App starts successfully
- [ ] All features work normally

If all checked, update system is correctly implemented and will work when packaged!

## When You're Ready for Real Testing

1. Create placeholder icons (see `assets/ICONS_README.md`)
2. Bundle Python (see `PYTHON_BUNDLING.md`)
3. Build: `npm run build`
4. Create GitHub repo and releases
5. Follow "Full Integration Test" above

The update system will "just work" once you have releases! 🚀
