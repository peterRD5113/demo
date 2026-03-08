/**
 * 文件操作相關 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { FILE_CHANNELS } from '../channels';
import type {
  SelectFileRequest,
  SelectFolderRequest,
  ReadFileRequest,
  WriteFileRequest,
  DeleteFileRequest,
  GetFileInfoRequest,
  FileInfo,
  IPCResponse
} from '../types';

class FileHandlers {
  /**
   * 註冊所有文件操作相關的 IPC 處理器
   */
  register(ipcMain: IpcMain): void {
    // 選擇文件
    ipcMain.handle(
      FILE_CHANNELS.SELECT_FILE,
      async (_event: IpcMainInvokeEvent, request: SelectFileRequest): Promise<IPCResponse<{ filePath: string }>> => {
        try {
          const result = await dialog.showOpenDialog({
            title: request.title || '選擇文件',
            defaultPath: request.defaultPath,
            filters: request.filters || [
              { name: '所有文件', extensions: ['*'] }
            ],
            properties: ['openFile']
          });

          if (result.canceled || result.filePaths.length === 0) {
            return {
              success: false,
              message: '未選擇文件'
            };
          }

          return {
            success: true,
            message: '文件選擇成功',
            data: { filePath: result.filePaths[0] }
          };
        } catch (error) {
          console.error('選擇文件失敗:', error);
          return {
            success: false,
            message: '選擇文件失敗'
          };
        }
      }
    );

    // 選擇文件夾
    ipcMain.handle(
      FILE_CHANNELS.SELECT_FOLDER,
      async (_event: IpcMainInvokeEvent, request: SelectFolderRequest): Promise<IPCResponse<{ folderPath: string }>> => {
        try {
          const result = await dialog.showOpenDialog({
            title: request.title || '選擇文件夾',
            defaultPath: request.defaultPath,
            properties: ['openDirectory']
          });

          if (result.canceled || result.filePaths.length === 0) {
            return {
              success: false,
              message: '未選擇文件夾'
            };
          }

          return {
            success: true,
            message: '文件夾選擇成功',
            data: { folderPath: result.filePaths[0] }
          };
        } catch (error) {
          console.error('選擇文件夾失敗:', error);
          return {
            success: false,
            message: '選擇文件夾失敗'
          };
        }
      }
    );

    // 讀取文件
    ipcMain.handle(
      FILE_CHANNELS.READ_FILE,
      async (_event: IpcMainInvokeEvent, request: ReadFileRequest): Promise<IPCResponse<{ content: string }>> => {
        try {
          if (!fs.existsSync(request.filePath)) {
            return {
              success: false,
              message: '文件不存在'
            };
          }

          const content = fs.readFileSync(request.filePath, 'utf-8');

          return {
            success: true,
            message: '文件讀取成功',
            data: { content }
          };
        } catch (error) {
          console.error('讀取文件失敗:', error);
          return {
            success: false,
            message: '讀取文件失敗'
          };
        }
      }
    );

    // 寫入文件
    ipcMain.handle(
      FILE_CHANNELS.WRITE_FILE,
      async (_event: IpcMainInvokeEvent, request: WriteFileRequest): Promise<IPCResponse> => {
        try {
          // 確保目錄存在
          const dir = path.dirname(request.filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(request.filePath, request.content);

          return {
            success: true,
            message: '文件寫入成功'
          };
        } catch (error) {
          console.error('寫入文件失敗:', error);
          return {
            success: false,
            message: '寫入文件失敗'
          };
        }
      }
    );

    // 刪除文件
    ipcMain.handle(
      FILE_CHANNELS.DELETE_FILE,
      async (_event: IpcMainInvokeEvent, request: DeleteFileRequest): Promise<IPCResponse> => {
        try {
          if (!fs.existsSync(request.filePath)) {
            return {
              success: false,
              message: '文件不存在'
            };
          }

          fs.unlinkSync(request.filePath);

          return {
            success: true,
            message: '文件刪除成功'
          };
        } catch (error) {
          console.error('刪除文件失敗:', error);
          return {
            success: false,
            message: '刪除文件失敗'
          };
        }
      }
    );

    // 獲取文件信息
    ipcMain.handle(
      FILE_CHANNELS.GET_FILE_INFO,
      async (_event: IpcMainInvokeEvent, request: GetFileInfoRequest): Promise<IPCResponse<FileInfo>> => {
        try {
          if (!fs.existsSync(request.filePath)) {
            return {
              success: false,
              message: '文件不存在'
            };
          }

          const stats = fs.statSync(request.filePath);
          const fileInfo: FileInfo = {
            name: path.basename(request.filePath),
            path: request.filePath,
            size: stats.size,
            extension: path.extname(request.filePath),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };

          return {
            success: true,
            message: '獲取文件信息成功',
            data: fileInfo
          };
        } catch (error) {
          console.error('獲取文件信息失敗:', error);
          return {
            success: false,
            message: '獲取文件信息失敗'
          };
        }
      }
    );
  }
}

export const fileHandlers = new FileHandlers();
