/**
 * Export IPC Handlers
 * 處理文檔導出相關的 IPC 通信
 */

import { ipcMain, IpcMainInvokeEvent, shell, dialog, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { ExportService } from '../../services/ExportService';

/**
 * 註冊導出相關的 IPC handlers
 */
export function registerExportHandlers(): void {
  // 導出為 PDF
  ipcMain.handle(
    'export:pdf',
    async (
      _event: IpcMainInvokeEvent,
      documentId: number,
      includeAnnotations: boolean,
      includeRisks: boolean
    ) => {
      try {
        const { buffer, suggestedName } = await ExportService.generatePDFBuffer(documentId, {
          format: 'pdf',
          includeAnnotations,
          includeRisks,
        });

        const { canceled, filePath } = await dialog.showSaveDialog({
          title: '儲存 PDF 檔案',
          defaultPath: path.join(app.getPath('downloads'), suggestedName),
          filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
        });

        if (canceled || !filePath) {
          return { success: false, message: '已取消儲存' };
        }

        fs.writeFileSync(filePath, buffer);
        shell.showItemInFolder(filePath);
        return { success: true, data: { filePath } };
      } catch (error) {
        console.error('PDF 導出失敗:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'PDF 導出失敗',
        };
      }
    }
  );

  // 導出為 DOCX
  ipcMain.handle(
    'export:docx',
    async (
      _event: IpcMainInvokeEvent,
      documentId: number,
      includeAnnotations: boolean,
      includeRisks: boolean,
      userId: number = 0
    ) => {
      try {
        const { buffer, suggestedName } = await ExportService.generateDOCXBuffer(documentId, {
          format: 'docx',
          includeAnnotations,
          includeRisks,
        }, userId);

        const { canceled, filePath } = await dialog.showSaveDialog({
          title: '儲存 DOCX 檔案',
          defaultPath: path.join(app.getPath('downloads'), suggestedName),
          filters: [{ name: 'Word 文件', extensions: ['docx'] }],
        });

        if (canceled || !filePath) {
          return { success: false, message: '已取消儲存' };
        }

        fs.writeFileSync(filePath, buffer);
        shell.showItemInFolder(filePath);
        return { success: true, data: { filePath } };
      } catch (error) {
        console.error('DOCX 導出失敗:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'DOCX 導出失敗',
        };
      }
    }
  );

  // 導出審閱報告
  ipcMain.handle(
    'export:report',
    async (_event: IpcMainInvokeEvent, documentId: number, userId: number) => {
      try {
        const { buffer, suggestedName } = await ExportService.generateReportBuffer(documentId, userId);

        const { canceled, filePath } = await dialog.showSaveDialog({
          title: '儲存審閱報告',
          defaultPath: path.join(app.getPath('downloads'), suggestedName),
          filters: [{ name: 'Word 文件', extensions: ['docx'] }],
        });

        if (canceled || !filePath) {
          return { success: false, message: '已取消儲存' };
        }

        fs.writeFileSync(filePath, buffer);
        shell.showItemInFolder(filePath);
        return { success: true, data: { filePath } };
      } catch (error) {
        console.error('審閱報告導出失敗:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : '審閱報告導出失敗',
        };
      }
    }
  );
}
