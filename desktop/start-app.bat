@echo off
cd /d "%~dp0"
echo Starting Electron application...
node_modules\.bin\electron.cmd .
pause
