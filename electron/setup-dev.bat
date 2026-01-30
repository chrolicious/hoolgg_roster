@echo off
echo ====================================
echo Hool.gg Roster - Electron Dev Setup
echo ====================================
echo.

echo [1/3] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

echo [2/3] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+
    pause
    exit /b 1
)
echo.

echo [3/3] Installing Python dependencies...
cd ..
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed
    pause
    exit /b 1
)
cd electron
echo.

echo ====================================
echo Setup complete!
echo ====================================
echo.
echo To run the app in development mode:
echo   npm start
echo.
echo To build for production:
echo   npm run build
echo.
pause
