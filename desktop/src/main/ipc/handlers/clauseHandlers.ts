/**
 * 條款相關 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { clauseService } from '../../services';
import { CLAUSE_CHANNELS } from '../channels';
import type {
  GetClauseRequest,
  GetClausesByDocumentRequest,
  UpdateClauseRequest,
  SearchClausesRequest,
  IPCResponse,
  IPCListResponse
} from '../types';
import type { Clause } from '@shared/types';

class ClauseHandlers {
  /**
   * 註冊所有條款相關的 IPC 處理器
   */
  register(ipcMain: IpcMain): void {
    // 獲取單個條款
    ipcMain.handle(
      CLAUSE_CHANNELS.GET,
      async (_event: IpcMainInvokeEvent, request: GetClauseRequest): Promise<IPCResponse<Clause>> => {
        try {
          const clause = await clauseService.getClause(request.clauseId, request.userId);
          
          if (clause) {
            return {
              success: true,
              message: '獲取條款成功',
              data: clause
            };
          }

          return {
            success: false,
            message: '條款不存在或無權訪問'
          };
        } catch (error) {
          console.error('獲取條款失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '獲取條款失敗'
          };
        }
      }
    );

    // 獲取文檔的所有條款
    ipcMain.handle(
      CLAUSE_CHANNELS.GET_BY_DOCUMENT,
      async (_event: IpcMainInvokeEvent, request: GetClausesByDocumentRequest): Promise<IPCResponse<IPCListResponse<Clause>>> => {
        try {
          const result = await clauseService.getDocumentClauses(
            request.documentId,
            request.userId,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '獲取條款列表成功',
            data: {
              items: result.clauses,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 100
            }
          };
        } catch (error) {
          console.error('獲取條款列表失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '獲取條款列表失敗'
          };
        }
      }
    );

    // 更新條款
    ipcMain.handle(
      CLAUSE_CHANNELS.UPDATE,
      async (_event: IpcMainInvokeEvent, request: UpdateClauseRequest): Promise<IPCResponse<void>> => {
        try {
          let result;
          
          // 如果提供了內容，更新內容
          if (request.content !== undefined) {
            result = await clauseService.updateClauseContent(
              request.clauseId,
              request.userId,
              request.content
            );
          }
          
          // 如果提供了標題，更新標題
          if (request.title !== undefined) {
            result = await clauseService.updateClauseTitle(
              request.clauseId,
              request.userId,
              request.title
            );
          }
          
          if (result && result.success) {
            return {
              success: true,
              message: '更新條款成功'
            };
          }

          return {
            success: false,
            message: result?.message || '更新條款失敗'
          };
        } catch (error) {
          console.error('更新條款失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '更新條款失敗'
          };
        }
      }
    );

    // 搜索條款
    ipcMain.handle(
      CLAUSE_CHANNELS.SEARCH,
      async (_event: IpcMainInvokeEvent, request: SearchClausesRequest): Promise<IPCResponse<IPCListResponse<Clause>>> => {
        try {
          const result = await clauseService.searchClauses(
            request.projectId,
            request.userId,
            request.keyword
          );
          
          return {
            success: true,
            message: '搜索成功',
            data: {
              items: result.clauses,
              total: result.total,
              page: 1,
              pageSize: result.total
            }
          };
        } catch (error) {
          console.error('搜索條款失敗:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '搜索條款失敗'
          };
        }
      }
    );
  }
}

export const clauseHandlers = new ClauseHandlers();
