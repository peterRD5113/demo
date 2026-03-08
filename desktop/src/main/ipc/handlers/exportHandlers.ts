/**
 * Export IPC Handlers
 * 處理文檔導出相關的 IPC 通信
 */

import { ipcMain, IpcMainInvokeEvent, shell } from 'electron';
import { ExportService } from '../../services/ExportService';
import { errorHandler } from '../../middleware/errorHandler';
import { verifyToken } from '../../middleware/authMiddleware';

/**
 * 註冊導出相關的 IPC handlers
 */
export function registerExportHandlers(): void {
  // 導出為 PDF
  ipcMain.handle(
    'export:pdf',
    errorHandler(
      async (
        event: IpcMainInvokeEvent,
        documentId: number,
        includeAnnotations: boolean,
        includeRisks: boolean
      ) => {
        const token = (event as any).token;
        if (!token) {
          throw new Error('未提供認證令牌');
        }

        const payload = await verifyToken(token);
        if (!payload) {
          throw new Error('認證失敗');
        }

        const filePath = await ExportService.exportToPDF(documentId, {
          format: 'pdf',
          includeAnnotations,
          includeRisks,
        });

        // 打開文件所在目錄
        shell.showItemInFolder(filePath);

        return { success: true, data: { filePath } };
      }
    )
  );

  // 導出為 DOCX
  ipcMain.handle(
    'export:docx',
    errorHandler(
      async (
        event: IpcMainInvokeEvent,
        documentId: number,
        includeAnnotations: boolean,
        includeRisks: boolean
      ) => {
        const token = (event as any).token;
        if (!token) {
          throw new Error('未提供認證令牌');
        }

        const payload = await verifyToken(token);
        if (!payload) {
          throw new Error('認證失敗');
        }

        const filePath = await ExportService.exportToDOCX(documentId, {
          format: 'docx',
          includeAnnotations,
          includeRisks,
        });

        // 打開文件所在目錄
        shell.showItemInFolder(filePath);

        return { success: true, data: { filePath } };
      }
    )
  );

  // 導出審閱報告
  ipcMain.handle(
    'export:report',
    errorHandler(async (event: IpcMainInvokeEvent, documentId: number) => {
      const token = (event as any).token;
      if (!token) {
        throw new Error('未提供認證令牌');
      }

      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('認證失敗');
      }

      const filePath = await ExportService.exportReport(documentId);

      // 打開文件所在目錄
      shell.showItemInFolder(filePath);

      return { success: true, data: { filePath } };
    })
  );
}
