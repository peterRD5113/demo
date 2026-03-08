// @ts-nocheck
/**
 * Main Process Entry Point
 * Electron main process initialization
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initDatabase } from './database/connection';
import { registerIPCHandlers } from './ipc';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

/**
 * Create main window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the index.html
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize application
 */
async function initialize(): Promise<void> {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized successfully');

    // Register IPC handlers
    registerIPCHandlers();
    console.log('IPC handlers registered successfully');

    // Create window
    createWindow();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// App event handlers
app.on('ready', initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
