// @ts-nocheck
/**
 * Main Process Entry Point
 * Electron main process initialization
 */

import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { initDatabase } from './database/connection';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

/**
 * Create main window
 */
function createWindow(): void {
  console.log('Creating main window...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove native menu bar
  Menu.setApplicationMenu(null);

  console.log('Window created, loading HTML...');
  const htmlPath = path.join(__dirname, '../renderer/index.html');
  console.log('HTML path:', htmlPath);

  // Load the index.html
  // Always load from dist in production build
  mainWindow.loadFile(htmlPath)
    .then(() => {
      console.log('✅ HTML loaded successfully');
      // Open DevTools after page loads
      mainWindow?.webContents.openDevTools();
    })
    .catch((error) => {
      console.error('❌ Failed to load HTML:', error);
    });

  // Add keyboard shortcut to toggle DevTools (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && (input.key === 'I' || input.key === 'i'))) {
      if (mainWindow) {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools();
        }
      }
      event.preventDefault();
    }
  });

  // Add error handlers
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page finished loading');
  });

  mainWindow.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });
}

/**
 * Initialize application
 */
async function initialize(): Promise<void> {
  try {
    // Initialize database first
    await initDatabase();
    console.log('Database initialized successfully');

    // Dynamically import and register IPC handlers after database is ready
    const { registerIPCHandlers } = await import('./ipc');
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
