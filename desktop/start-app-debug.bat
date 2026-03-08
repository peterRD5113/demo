@echo off
cd /d "%~dp0"
echo ========================================
echo Starting Electron Application
echo ========================================
echo.
echo Current directory: %CD%
echo.
echo Checking files...
if exist "dist\main\index.js" (
    echo [OK] Main process file found
) else (
    echo [ERROR] Main process file not found
    pause
    exit /b 1
)

if exist "dist\renderer\index.html" (
    echo [OK] Renderer file found
) else (
    echo [ERROR] Renderer file not found
    pause
    exit /b 1
)

echo.
echo Starting Electron...
echo.
node_modules\.bin\electron.cmd . 2>&1
echo.
echo ========================================
echo Application closed
echo ========================================
pause
