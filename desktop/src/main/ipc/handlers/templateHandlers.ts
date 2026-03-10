import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { templateService } from '../../services';
import { TEMPLATE_CHANNELS } from '../channels';
import type { IPCResponse, IPCListResponse } from '../types';
import type { ClauseTemplate } from '@shared/types';

class TemplateHandlers {
  register(ipcMain: IpcMain): void {
    // 取得模板列表
    ipcMain.handle(
      TEMPLATE_CHANNELS.LIST,
      async (_event: IpcMainInvokeEvent, request: { type?: 'clause' | 'annotation' }): Promise<IPCResponse<IPCListResponse<ClauseTemplate>>> => {
        try {
          const result = await templateService.getTemplates(request?.type);
          return {
            success: true,
            message: '取得模板列表成功',
            data: {
              items: result.templates,
              total: result.total,
              page: 1,
              pageSize: result.total,
            },
          };
        } catch (error) {
          console.error('取得模板列表失敗:', error);
          return { success: false, message: error instanceof Error ? error.message : '取得模板列表失敗' };
        }
      }
    );

    // 建立模板
    ipcMain.handle(
      TEMPLATE_CHANNELS.CREATE,
      async (_event: IpcMainInvokeEvent, request: {
        name: string;
        category: string;
        content: string;
        templateType: 'clause' | 'annotation';
        userId: number;
        title?: string | null;
        description?: string | null;
      }): Promise<IPCResponse<{ templateId: number }>> => {
        try {
          const result = await templateService.createTemplate(
            request.name,
            request.category,
            request.content,
            request.templateType,
            request.userId,
            request.title,
            request.description
          );
          if (result.success && result.templateId) {
            return { success: true, message: result.message, data: { templateId: result.templateId } };
          }
          return { success: false, message: result.message };
        } catch (error) {
          console.error('建立模板失敗:', error);
          return { success: false, message: error instanceof Error ? error.message : '建立模板失敗' };
        }
      }
    );

    // 更新模板
    ipcMain.handle(
      TEMPLATE_CHANNELS.UPDATE,
      async (_event: IpcMainInvokeEvent, request: {
        id: number;
        userId: number;
        name?: string;
        category?: string;
        title?: string | null;
        content?: string;
        description?: string | null;
      }): Promise<IPCResponse<void>> => {
        try {
          const result = await templateService.updateTemplate(request.id, request.userId, {
            name: request.name,
            category: request.category,
            title: request.title,
            content: request.content,
            description: request.description,
          });
          return { success: result.success, message: result.message };
        } catch (error) {
          console.error('更新模板失敗:', error);
          return { success: false, message: error instanceof Error ? error.message : '更新模板失敗' };
        }
      }
    );

    // 刪除模板
    ipcMain.handle(
      TEMPLATE_CHANNELS.DELETE,
      async (_event: IpcMainInvokeEvent, request: { id: number; userId: number }): Promise<IPCResponse<void>> => {
        try {
          const result = await templateService.deleteTemplate(request.id, request.userId);
          return { success: result.success, message: result.message };
        } catch (error) {
          console.error('刪除模板失敗:', error);
          return { success: false, message: error instanceof Error ? error.message : '刪除模板失敗' };
        }
      }
    );
  }
}

export const templateHandlers = new TemplateHandlers();

