/**
 * 系統相關 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { app, shell, dialog } from 'electron';
import { SYSTEM_CHANNELS } from '../channels';
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
  }
}

export const systemHandlers = new SystemHandlers();
