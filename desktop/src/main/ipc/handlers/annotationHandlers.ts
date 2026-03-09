/**
 * 批註相關 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { annotationService } from '../../services';
import { ANNOTATION_CHANNELS } from '../channels';
import type { IPCResponse, IPCListResponse } from '../types';

class AnnotationHandlers {
  /**
   * 註冊所有批註相關的 IPC 處理器
   */
  register(ipcMain: IpcMain): void {
    console.log('Registering annotation IPC handlers...');
    
    // 創建批註
    ipcMain.handle(
      ANNOTATION_CHANNELS.CREATE,
      async (_event: IpcMainInvokeEvent, request: {
        clauseId: number;
        userId: number;
        content: string;
        type?: 'comment' | 'suggestion' | 'question' | 'issue';
      }): Promise<IPCResponse<{ annotationId: number }>> => {
        console.log('IPC handler received CREATE request:', request);
        try {
          const result = await annotationService.createAnnotation(
            request.clauseId,
            request.userId,
            request.content,
            request.type
          );
          
          console.log('Service returned result:', result);
          
          if (result.success && result.annotationId) {
            return {
              success: true,
              message: result.message,
              data: { annotationId: result.annotationId }
            };
          }

          return {
            success: false,
            message: result.message
          };
        } catch (error) {
          console.error('創建批註失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '創建批註失敗'
          };
        }
      }
    );

    console.log('Annotation CREATE handler registered for channel:', ANNOTATION_CHANNELS.CREATE);

    // 獲取條款的所有批註
    ipcMain.handle(
      ANNOTATION_CHANNELS.GET_BY_CLAUSE,
      async (_event: IpcMainInvokeEvent, request: {
        clauseId: number;
        userId: number;
      }): Promise<IPCResponse<IPCListResponse<any>>> => {
        try {
          const result = await annotationService.getClauseAnnotations(
            request.clauseId,
            request.userId
          );
          
          return {
            success: true,
            message: '獲取批註列表成功',
            data: {
              items: result.annotations,
              total: result.total,
              page: 1,
              pageSize: result.total
            }
          };
        } catch (error) {
          console.error('獲取批註列表失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '獲取批註列表失敗'
          };
        }
      }
    );

    // 更新批註
    ipcMain.handle(
      ANNOTATION_CHANNELS.UPDATE,
      async (_event: IpcMainInvokeEvent, request: {
        annotationId: number;
        userId: number;
        content: string;
      }): Promise<IPCResponse<void>> => {
        try {
          const result = await annotationService.updateAnnotation(
            request.annotationId,
            request.userId,
            request.content
          );
          
          if (result.success) {
            return {
              success: true,
              message: result.message
            };
          }

          return {
            success: false,
            message: result.message
          };
        } catch (error) {
          console.error('更新批註失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '更新批註失敗'
          };
        }
      }
    );

    // 刪除批註
    ipcMain.handle(
      ANNOTATION_CHANNELS.DELETE,
      async (_event: IpcMainInvokeEvent, request: {
        annotationId: number;
        userId: number;
      }): Promise<IPCResponse<void>> => {
        try {
          const result = await annotationService.deleteAnnotation(
            request.annotationId,
            request.userId
          );
          
          if (result.success) {
            return {
              success: true,
              message: result.message
            };
          }

          return {
            success: false,
            message: result.message
          };
        } catch (error) {
          console.error('刪除批註失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '刪除批註失敗'
          };
        }
      }
    );

    // 解決批註
    ipcMain.handle(
      ANNOTATION_CHANNELS.RESOLVE,
      async (_event: IpcMainInvokeEvent, request: {
        annotationId: number;
        userId: number;
      }): Promise<IPCResponse<void>> => {
        try {
          const result = await annotationService.resolveAnnotation(
            request.annotationId,
            request.userId
          );
          
          if (result.success) {
            return {
              success: true,
              message: result.message
            };
          }

          return {
            success: false,
            message: result.message
          };
        } catch (error) {
          console.error('解決批註失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '解決批註失敗'
          };
        }
      }
    );

    // 獲取用戶的待確認列表
    ipcMain.handle(
      ANNOTATION_CHANNELS.GET_MENTIONS,
      async (_event: IpcMainInvokeEvent, request: {
        userId: number;
        projectId: number;
      }): Promise<IPCResponse<IPCListResponse<any>>> => {
        try {
          const result = await annotationService.getUserMentions(
            request.userId,
            request.projectId
          );
          
          return {
            success: true,
            message: '獲取待確認列表成功',
            data: {
              items: result.mentions,
              total: result.total,
              page: 1,
              pageSize: result.total
            }
          };
        } catch (error) {
          console.error('獲取待確認列表失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '獲取待確認列表失敗'
          };
        }
      }
    );

    // 標記 mention 為已讀
    ipcMain.handle(
      ANNOTATION_CHANNELS.MARK_MENTION_READ,
      async (_event: IpcMainInvokeEvent, request: {
        mentionId: number;
        userId: number;
      }): Promise<IPCResponse<void>> => {
        try {
          const result = await annotationService.markMentionAsRead(
            request.mentionId,
            request.userId
          );
          
          if (result.success) {
            return {
              success: true,
              message: result.message
            };
          }

          return {
            success: false,
            message: result.message
          };
        } catch (error) {
          console.error('標記已讀失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '標記已讀失敗'
          };
        }
      }
    );
    
    console.log('All annotation IPC handlers registered');
  }
}

export const annotationHandlers = new AnnotationHandlers();
