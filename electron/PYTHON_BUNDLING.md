# Python Bundling Guide

This guide explains how to bundle Python 3.11 embedded with the Electron app for standalone distribution.

## Why Bundle Python?

The desktop app bundles Python so users don't need to:
- Install Python separately
- Deal with version conflicts
- Configure PATH environment variables
- Install pip or Flask manually

Everything is self-contained in the app.

## Step-by-Step Instructions

### 1. Download Python 3.11 Embedded

**Windows PowerShell**:
```powershell
cd electron

# Create directory
mkdir python-embedded

# Download Python 3.11.7 embedded (64-bit)
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.7/python-3.11.7-embed-amd64.zip" -OutFile python-embed.zip

# Extract
Expand-Archive python-embed.zip -DestinationPath python-embedded

# Cleanup
Remove-Item python-embed.zip
```

**Manual Download**:
1. Visit: https://www.python.org/downloads/windows/
2. Find "Python 3.11.7" → Download "Windows embeddable package (64-bit)"
3. Extract to `electron/python-embedded/`

### 2. Enable Site Packages

Python embedded disables site-packages by default. We need to enable it:

**Edit** `electron/python-embedded/python311._pth`:

Find this line:
```
#import site
```

Uncomment it (remove the #):
```
import site
```

This allows pip to install packages to `Lib/site-packages/`.

### 3. Install pip

pip is not included in the embedded distribution, so we need to bootstrap it:

```powershell
cd electron/python-embedded

# Download get-pip.py
Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile get-pip.py

# Install pip using the embedded Python
.\python.exe get-pip.py

# Verify pip installed
.\python.exe -m pip --version
```

Expected output:
```
pip 24.x.x from ...\Lib\site-packages\pip (python 3.11)
```

### 4. Install Flask Dependencies

```powershell
# Still in electron/python-embedded/

# Install Flask
.\python.exe -m pip install Flask==3.0.0

# Install requests (for Blizzard API)
.\python.exe -m pip install requests==2.31.0

# Verify installations
.\python.exe -c "import flask; print('Flask', flask.__version__)"
.\python.exe -c "import requests; print('Requests', requests.__version__)"
```

Expected output:
```
Flask 3.0.0
Requests 2.31.0
```

### 5. Test Flask Runs

Test that Flask can run using the embedded Python:

```powershell
# From electron/python-embedded/
.\python.exe ..\..\app.py
```

You should see:
```
* Serving Flask app 'app'
* Running on http://127.0.0.1:5000
```

Press Ctrl+C to stop. If this works, Python is correctly bundled!

### 6. Verify Directory Structure

Your `electron/python-embedded/` should look like:

```
python-embedded/
├── python.exe              # Main Python executable
├── python311.dll           # Python runtime library
├── python311._pth          # Path configuration (modified)
├── pythonw.exe            # Windowless Python (not used)
├── Lib/                   # Standard library
│   └── site-packages/     # pip-installed packages
│       ├── flask/         # Flask framework
│       ├── requests/      # HTTP library
│       └── ...            # Dependencies
├── DLLs/                  # Extension DLLs
├── get-pip.py            # pip installer (can delete after install)
└── [other Python files]
```

## File Size

After bundling:
- Base Python: ~15MB
- Flask + dependencies: ~10MB
- Total: ~25MB (compressed in installer: ~8-10MB)

## Common Issues

### Issue: "No module named 'flask'"

**Cause**: pip installed to wrong location or site-packages not enabled

**Fix**:
1. Check `python311._pth` has `import site` uncommented
2. Reinstall Flask: `.\python.exe -m pip install --force-reinstall Flask`
3. Verify location: `.\python.exe -m pip show Flask`

### Issue: "Cannot find python311.dll"

**Cause**: Missing DLL or incorrect extraction

**Fix**:
1. Re-download Python embedded zip
2. Extract all files (don't cherry-pick)
3. Ensure `python311.dll` is in `python-embedded/` root

### Issue: pip install fails with SSL error

**Cause**: Missing SSL libraries in embedded Python

**Fix**:
- Embedded Python 3.11.7+ includes SSL by default
- If using older version, upgrade to 3.11.7
- Or download `get-pip.py` manually and run offline

### Issue: Flask imports work but app crashes

**Cause**: Missing transitive dependencies

**Fix**:
```powershell
# Install with all dependencies explicitly
.\python.exe -m pip install Flask requests werkzeug jinja2 click itsdangerous markupsafe
```

## Production Build

Once Python is bundled:

1. **electron-builder** automatically includes `python-embedded/` in the installer
2. **extraResources** in `package.json` copies it to `resources/python/`
3. **main.js** detects packaged mode and uses bundled Python path

No additional configuration needed!

## Development vs Production

### Development Mode (`npm start`)
- Uses system Python (`python` command)
- Allows hot-reloading Flask changes
- Faster iteration

### Production Mode (built .exe)
- Uses bundled Python (`resources/python/python.exe`)
- Self-contained, no external dependencies
- Consistent across all user machines

## GitHub Actions

The CI/CD workflow (`.github/workflows/build-release.yml`) automates this:

1. Downloads Python embedded
2. Installs pip
3. Installs Flask/requests
4. Builds the app

For manual builds, follow this guide. For automated releases, GitHub Actions handles it.

## Updating Python Version

To update to a newer Python version:

1. Download new embedded distribution (e.g., 3.11.8, 3.12.x)
2. Extract to `python-embedded/`
3. Repeat steps 2-5 above
4. Update `.github/workflows/build-release.yml` Python URL
5. Test build thoroughly

⚠️ **Warning**: Test compatibility with Flask before upgrading Python versions.

## Security Notes

- Embedded Python is official from python.org (verified)
- pip downloads from PyPI (official Python package index)
- Flask/requests are trusted, widely-used packages
- No unofficial binaries or sketchy sources

## Clean Reinstall

To start over:

```powershell
# Delete the directory
Remove-Item -Recurse -Force electron/python-embedded

# Follow steps 1-5 again
```

## Checklist

Before building the app, verify:

- [ ] `python-embedded/` directory exists
- [ ] `python.exe` runs: `.\python.exe --version`
- [ ] pip works: `.\python.exe -m pip --version`
- [ ] Flask installed: `.\python.exe -c "import flask"`
- [ ] Flask runs: `.\python.exe ..\..\app.py`
- [ ] File size reasonable (~25MB for python-embedded/)

If all checks pass, you're ready to build! Run `npm run build` in the `electron/` directory.

## Getting Help

If stuck:
- Check Flask logs: `python.exe app.py` output
- Check pip logs: `python.exe -m pip install --verbose Flask`
- Check Electron logs: DevTools → Console (Ctrl+Shift+I)
- GitHub Issues: File a bug report with error details

## Next Steps

After Python bundling is complete:
1. Test local build: `npm run build`
2. Test installer on clean Windows VM
3. Verify app launches and Flask starts
4. Push to GitHub and create release tag
5. GitHub Actions will build with bundled Python automatically
