/**
 * 系統相關 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { app, shell, dialog } from 'electron';
import * as fs from 'fs';
import { SYSTEM_CHANNELS } from '../channels';
import { getDb, getDatabasePath, saveDatabase } from '../../database/connection';
import type {
  OpenExternalRequest,
  ShowMessageRequest,
  ShowMessageResponse,
  IPCResponse
} from '../types';

class SystemHandlers {
  /**
   * 註冊所有系統相關的 IPC 處理器
   */
  register(ipcMain: IpcMain): void {
    // 獲取應用版本
    ipcMain.handle(
      SYSTEM_CHANNELS.GET_APP_VERSION,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<{ version: string }>> => {
        try {
          return {
            success: true,
            message: '獲取版本成功',
            data: { version: app.getVersion() }
          };
        } catch (error) {
          console.error('獲取應用版本失敗:', error);
          return {
            success: false,
            message: '獲取版本失敗'
          };
        }
      }
    );

    // 獲取應用路徑
    ipcMain.handle(
      SYSTEM_CHANNELS.GET_APP_PATH,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<{ appPath: string; userDataPath: string }>> => {
        try {
          return {
            success: true,
            message: '獲取路徑成功',
            data: {
              appPath: app.getAppPath(),
              userDataPath: app.getPath('userData')
            }
          };
        } catch (error) {
          console.error('獲取應用路徑失敗:', error);
          return {
            success: false,
            message: '獲取路徑失敗'
          };
        }
      }
    );

    // 打開外部鏈接
    ipcMain.handle(
      SYSTEM_CHANNELS.OPEN_EXTERNAL,
      async (_event: IpcMainInvokeEvent, request: OpenExternalRequest): Promise<IPCResponse> => {
        try {
          await shell.openExternal(request.url);
          return {
            success: true,
            message: '打開鏈接成功'
          };
        } catch (error) {
          console.error('打開外部鏈接失敗:', error);
          return {
            success: false,
            message: '打開鏈接失敗'
          };
        }
      }
    );

    // 顯示消息對話框
    ipcMain.handle(
      SYSTEM_CHANNELS.SHOW_MESSAGE,
      async (_event: IpcMainInvokeEvent, request: ShowMessageRequest): Promise<IPCResponse<ShowMessageResponse>> => {
        try {
          const result = await dialog.showMessageBox({
            type: request.type,
            title: request.title,
            message: request.message,
            buttons: request.buttons || ['確定']
          });

          return {
            success: true,
            message: '顯示消息成功',
            data: { response: result.response }
          };
        } catch (error) {
          console.error('顯示消息對話框失敗:', error);
          return {
            success: false,
            message: '顯示消息失敗'
          };
        }
      }
    );

    // 顯示錯誤對話框
    ipcMain.handle(
      SYSTEM_CHANNELS.SHOW_ERROR,
      async (_event: IpcMainInvokeEvent, request: { title: string; content: string }): Promise<IPCResponse> => {
        try {
          dialog.showErrorBox(request.title, request.content);
          return {
            success: true,
            message: '顯示錯誤成功'
          };
        } catch (error) {
          console.error('顯示錯誤對話框失敗:', error);
          return {
            success: false,
            message: '顯示錯誤失敗'
          };
        }
      }
    );

    // 獲取緩存統計資訊
    ipcMain.handle(
      SYSTEM_CHANNELS.GET_CACHE_INFO,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<{
        auditLogCount: number;
        deletedProjectCount: number;
        riskMatchCount: number;
        dbFileSizeKB: number;
      }>> => {
        try {
          const db = getDb();
          const auditRes = db.exec("SELECT COUNT(*) FROM audit_logs WHERE created_at < datetime('now', '-30 days')");
          const auditLogCount = (auditRes.length > 0 && auditRes[0].values.length > 0)
            ? (auditRes[0].values[0][0] as number)
            : 0;
          const projectRes = db.exec('SELECT COUNT(*) FROM projects WHERE deleted_at IS NOT NULL');
          const deletedProjectCount = (projectRes.length > 0 && projectRes[0].values.length > 0)
            ? (projectRes[0].values[0][0] as number)
            : 0;
          const riskRes = db.exec('SELECT COUNT(*) FROM risk_matches');
          const riskMatchCount = (riskRes.length > 0 && riskRes[0].values.length > 0)
            ? (riskRes[0].values[0][0] as number)
            : 0;
          const dbFileSizeKB = Math.round(fs.statSync(getDatabasePath()).size / 1024);
          return {
            success: true,
            message: '獲取緩存信息成功',
            data: { auditLogCount, deletedProjectCount, riskMatchCount, dbFileSizeKB }
          };
        } catch (error) {
          console.error('獲取緩存信息失敗:', error);
          return {
            success: false,
            message: '獲取緩存信息失敗'
          };
        }
      }
    );

    // 清理緩存
    ipcMain.handle(
      SYSTEM_CHANNELS.CLEAR_CACHE,
      async (
        _event: IpcMainInvokeEvent,
        request: { clearAuditLogs: boolean; clearDeletedProjects: boolean; clearRiskMatches: boolean }
      ): Promise<IPCResponse<{
        clearedAuditLogs: number;
        clearedDeletedProjects: number;
        clearedRiskMatches: number;
        freedKB: number;
      }>> => {
        try {
          const db = getDb();
          const sizeBefore = fs.statSync(getDatabasePath()).size;
          let clearedAuditLogs = 0;
          let clearedDeletedProjects = 0;
          let clearedRiskMatches = 0;

          if (request.clearAuditLogs) {
            const countRes = db.exec("SELECT COUNT(*) FROM audit_logs WHERE created_at < datetime('now', '-30 days')");
            clearedAuditLogs = (countRes.length > 0 && countRes[0].values.length > 0)
              ? (countRes[0].values[0][0] as number)
              : 0;
            db.run("DELETE FROM audit_logs WHERE created_at < datetime('now', '-30 days')");
          }

          if (request.clearDeletedProjects) {
            const countRes = db.exec('SELECT COUNT(*) FROM projects WHERE deleted_at IS NOT NULL');
            clearedDeletedProjects = (countRes.length > 0 && countRes[0].values.length > 0)
              ? (countRes[0].values[0][0] as number)
              : 0;
            // ON DELETE CASCADE handles documents, clauses, risk_matches, annotations, etc.
            db.run('DELETE FROM projects WHERE deleted_at IS NOT NULL');
          }

          if (request.clearRiskMatches) {
            const countRes = db.exec('SELECT COUNT(*) FROM risk_matches');
            clearedRiskMatches = (countRes.length > 0 && countRes[0].values.length > 0)
              ? (countRes[0].values[0][0] as number)
              : 0;
            db.run('DELETE FROM risk_matches');
          }

          db.run('VACUUM');
          saveDatabase();
          const sizeAfter = fs.statSync(getDatabasePath()).size;
          const freedKB = Math.max(0, Math.round((sizeBefore - sizeAfter) / 1024));

          return {
            success: true,
            message: '緩存清理完成',
            data: { clearedAuditLogs, clearedDeletedProjects, clearedRiskMatches, freedKB }
          };
        } catch (error) {
          console.error('清理緩存失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '緩存清理失敗'
          };
        }
      }
    );
  }
}

export const systemHandlers = new SystemHandlers();
