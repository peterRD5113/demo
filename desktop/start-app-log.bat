@echo off
cd /d "%~dp0"
echo ======================================== > electron-log.txt
echo Starting Electron Application >> electron-log.txt
echo ======================================== >> electron-log.txt
echo. >> electron-log.txt
echo Current directory: %CD% >> electron-log.txt
echo. >> electron-log.txt

echo Checking files... >> electron-log.txt
if exist "dist\main\index.js" (
    echo [OK] Main process file found >> electron-log.txt
) else (
    echo [ERROR] Main process file not found >> electron-log.txt
    exit /b 1
)

if exist "dist\renderer\index.html" (
    echo [OK] Renderer file found >> electron-log.txt
) else (
    echo [ERROR] Renderer file not found >> electron-log.txt
    exit /b 1
)

echo. >> electron-log.txt
echo Starting Electron... >> electron-log.txt
echo. >> electron-log.txt

node_modules\.bin\electron.cmd . >> electron-log.txt 2>&1

echo. >> electron-log.txt
echo ======================================== >> electron-log.txt
echo Application closed >> electron-log.txt
echo ======================================== >> electron-log.txt
