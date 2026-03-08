@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================
echo Starting Electron Application (Debug Mode)
echo ========================================
echo.

echo Current directory: %CD%
echo.

echo Checking files...
if exist "dist\main\index.js" (
    echo [OK] Main process file found
) else (
    echo [ERROR] Main process file NOT found
    pause
    exit /b 1
)

if exist "dist\renderer\index.html" (
    echo [OK] Renderer file found
) else (
    echo [ERROR] Renderer file NOT found
    pause
    exit /b 1
)

echo.
echo Starting Electron with full logging...
echo.

set ELECTRON_ENABLE_LOGGING=1
set NODE_ENV=development

node_modules\.bin\electron . > electron-debug.log 2>&1

echo.
echo Application closed. Check electron-debug.log for details.
type electron-debug.log
pause
