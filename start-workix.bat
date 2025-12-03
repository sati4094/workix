@echo off
title Workix Launcher
echo Starting Workix...

REM Start backend server in background
echo Starting backend server...
start /B cmd /c "cd /d d:\OneDrive\Documents\GitHub\workix\backend && node src/server.js"

REM Wait for backend to be ready
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start Tauri app
echo Starting Workix Desktop...
start "" "d:\OneDrive\Documents\GitHub\workix\workix-desktop\src-tauri\target\release\workix-desktop.exe"

echo Workix started successfully!
