/**
 * Version IPC Handlers
 * 處理版本管理相關的 IPC 通信
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { VersionService } from '../../services/VersionService';
import { errorHandler } from '../../middleware/errorHandler';
import { verifyToken } from '../../middleware/authMiddleware';

/**
 * 註冊版本相關的 IPC handlers
 */
export function registerVersionHandlers(): void {
  // 保存版本
  ipcMain.handle(
    'version:save',
    errorHandler(async (event: IpcMainInvokeEvent, documentId: number, content: string, comment?: string) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.saveVersion(documentId, content, payload.userId, comment);
      return { success: true, data: result };
    })
  );

  // 獲取文檔版本列表
  ipcMain.handle(
    'version:list',
    errorHandler(async (event: IpcMainInvokeEvent, documentId: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.getDocumentVersions(documentId);
      return { success: true, data: result };
    })
  );

  // 獲取版本詳情
  ipcMain.handle(
    'version:get',
    errorHandler(async (event: IpcMainInvokeEvent, versionId: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.getVersionById(versionId);
      return { success: true, data: result };
    })
  );

  // 比較版本
  ipcMain.handle(
    'version:compare',
    errorHandler(async (event: IpcMainInvokeEvent, versionId1: number, versionId2: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.compareVersions(versionId1, versionId2);
      return { success: true, data: result };
    })
  );

  // 回滾版本
  ipcMain.handle(
    'version:rollback',
    errorHandler(async (event: IpcMainInvokeEvent, versionId: number, comment?: string) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.rollbackToVersion(versionId, payload.userId, comment);
      return { success: true, data: result };
    })
  );

  // 刪除版本
  ipcMain.handle(
    'version:delete',
    errorHandler(async (event: IpcMainInvokeEvent, versionId: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      await VersionService.deleteVersion(versionId);
      return { success: true };
    })
  );

  // 獲取版本統計
  ipcMain.handle(
    'version:stats',
    errorHandler(async (event: IpcMainInvokeEvent, documentId: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const result = await VersionService.getVersionStats(documentId);
      return { success: true, data: result };
    })
  );
}
