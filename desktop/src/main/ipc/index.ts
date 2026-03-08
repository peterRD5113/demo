/**
 * IPC Handler Registration
 * Register all IPC channel handlers
 */

import { ipcMain } from 'electron';
import { authHandlers } from './handlers/authHandlers';
import { projectHandlers } from './handlers/projectHandlers';
import { documentHandlers } from './handlers/documentHandlers';
import { clauseHandlers } from './handlers/clauseHandlers';
import { riskHandlers } from './handlers/riskHandlers';
import { annotationHandlers } from './handlers/annotationHandlers';
import { registerVersionHandlers } from './handlers/versionHandlers';
import { registerExportHandlers } from './handlers/exportHandlers';
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

  // Register clause handlers
  clauseHandlers.register(ipcMain);

  // Register risk handlers
  riskHandlers.register(ipcMain);

  // Register annotation handlers
  annotationHandlers.register(ipcMain);

  // Register version handlers
  registerVersionHandlers();

  // Register export handlers
  registerExportHandlers();

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
