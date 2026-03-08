/**
 * IPC Handler Registration
 * Register all IPC channel handlers
 */

import { ipcMain } from 'electron';
import { authHandlers } from './handlers/authHandlers';
import { projectHandlers } from './handlers/projectHandlers';
import { documentHandlers } from './handlers/documentHandlers';
import { riskHandlers } from './handlers/riskHandlers';
import { fileHandlers } from './handlers/fileHandlers';
import { systemHandlers } from './handlers/systemHandlers';

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers(): void {
  console.log('Registering IPC handlers...');

  // Register authentication handlers
  authHandlers.register(ipcMain);

  // Register project handlers
  projectHandlers.register(ipcMain);

  // Register document handlers
  documentHandlers.register(ipcMain);

  // Register risk handlers
  riskHandlers.register(ipcMain);

  // Register file operation handlers
  fileHandlers.register(ipcMain);

  // Register system handlers
  systemHandlers.register(ipcMain);

  console.log('IPC handlers registered successfully');
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIPCHandlers(): void {
  console.log('Unregistering IPC handlers...');
  ipcMain.removeAllListeners();
  console.log('IPC handlers unregistered successfully');
}
