/**
 * IPC 處理器主文件
 * 註冊所有 IPC 通道的處理函數
 */

import { ipcMain } from 'electron';
import { authHandlers } from './handlers/authHandlers';
import { projectHandlers } from './handlers/projectHandlers';
import { documentHandlers } from './handlers/documentHandlers';
import { riskHandlers } from './handlers/riskHandlers';
import { fileHandlers } from './handlers/fileHandlers';
import { systemHandlers } from './handlers/systemHandlers';

/**
 * 註冊所有 IPC 處理器
 */
export function registerIPCHandlers(): void {
  console.log('註冊 IPC 處理器...');

  // 註冊認證相關處理器
  authHandlers.register(ipcMain);

  // 註冊項目相關處理器
  projectHandlers.register(ipcMain);

  // 註冊文檔相關處理器
  documentHandlers.register(ipcMain);

  // 註冊風險相關處理器
  riskHandlers.register(ipcMain);

  // 註冊文件操作處理器
  fileHandlers.register(ipcMain);

  // 註冊系統相關處理器
  systemHandlers.register(ipcMain);

  console.log('IPC 處理器註冊完成');
}

/**
 * 移除所有 IPC 處理器
 */
export function unregisterIPCHandlers(): void {
  console.log('移除 IPC 處理器...');
  ipcMain.removeAllListeners();
  console.log('IPC 處理器移除完成');
}
