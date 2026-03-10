/**
 * 風險識別 IPC 處理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { riskService } from '../../services';
import { RISK_CHANNELS } from '../channels';
import type {
  IdentifyRisksRequest,
  IdentifyRisksResponse,
  GetRiskRequest,
  ListRisksRequest,
  GetRisksByLevelRequest,
  UpdateRiskStatusRequest,
  RiskStatisticsResponse,
  CreateRiskRuleRequest,
  UpdateRiskRuleRequest,
  DeleteRiskRuleRequest,
  IPCResponse,
  IPCListResponse
} from '../types';
import type { RiskMatch, RiskRule } from '@shared/types';

class RiskHandlers {
  /**
   * 註冊所有風險相關 IPC 處理器
   */
  register(ipcMain: IpcMain): void {
    // 識別風險
    ipcMain.handle(
      RISK_CHANNELS.IDENTIFY,
      async (_event: IpcMainInvokeEvent, request: IdentifyRisksRequest): Promise<IPCResponse<IdentifyRisksResponse>> => {
        try {
          const result = await riskService.identifyRisks(request.documentId, request.userId);
          
          if (result.success) {
            return {
              success: true,
              message: result.message,
              data: {
                risksFound: result.risksFound || 0,
                risks: result.risks || []
              }
            };
          }

          return {
            success: false,
            message: result.message || 'Risk identification failed'
          };
        } catch (error) {
          console.error('Risk identification failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Risk identification failed'
          };
        }
      }
    );

    // 獲取單個風險（暫不實現）
    ipcMain.handle(
      RISK_CHANNELS.GET,
      async (_event: IpcMainInvokeEvent, request: GetRiskRequest): Promise<IPCResponse<RiskMatch>> => {
        try {
          return {
            success: false,
            message: 'Feature not implemented'
          };
        } catch (error) {
          console.error('Get risk failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get risk failed'
          };
        }
      }
    );

    // 獲取文檔風險列表
    ipcMain.handle(
      RISK_CHANNELS.LIST,
      async (_event: IpcMainInvokeEvent, request: ListRisksRequest): Promise<IPCResponse<IPCListResponse<RiskMatch>>> => {
        try {
          const result = await riskService.getDocumentRisks(
            request.documentId,
            request.userId
          );
          
          return {
            success: true,
            message: 'Get risks list success',
            data: {
              items: result.risks,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 50
            }
          };
        } catch (error) {
          console.error('Get risks list failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get risks list failed'
          };
        }
      }
    );

    // 按風險等級獲取
    ipcMain.handle(
      RISK_CHANNELS.GET_BY_LEVEL,
      async (_event: IpcMainInvokeEvent, request: GetRisksByLevelRequest): Promise<IPCResponse<IPCListResponse<RiskMatch>>> => {
        try {
          const result = await riskService.getRisksByLevel(
            request.documentId,
            request.userId,
            request.level
          );
          
          return {
            success: true,
            message: 'Get success',
            data: {
              items: result.risks,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 50
            }
          };
        } catch (error) {
          console.error('Get failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get failed'
          };
        }
      }
    );

    // 按類別獲取（暫不實現）
    ipcMain.handle(
      RISK_CHANNELS.GET_BY_CATEGORY,
      async (_event: IpcMainInvokeEvent, request: any): Promise<IPCResponse<IPCListResponse<RiskMatch>>> => {
        try {
          return {
            success: false,
            message: 'Feature not implemented'
          };
        } catch (error) {
          console.error('Get failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get failed'
          };
        }
      }
    );

    // 調整風險等級
    ipcMain.handle(
      RISK_CHANNELS.UPDATE_STATUS,
      async (_event: IpcMainInvokeEvent, request: UpdateRiskStatusRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.adjustRiskLevel(
            request.riskId,
            request.userId,
            request.status as 'high' | 'medium' | 'low'
          );
          
          if (result.success) {
            return {
              success: true,
              message: 'Adjust risk level success'
            };
          }

          return {
            success: false,
            message: result.message || 'Adjust risk level failed'
          };
        } catch (error) {
          console.error('Adjust risk level failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Adjust risk level failed'
          };
        }
      }
    );

    // 獲取統計
    ipcMain.handle(
      RISK_CHANNELS.GET_STATS,
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number): Promise<IPCResponse<RiskStatisticsResponse>> => {
        try {
          const stats = await riskService.getDocumentRiskStatistics(documentId, userId);
          
          if (stats) {
            return {
              success: true,
              message: 'Get statistics success',
              data: stats
            };
          }

          return {
            success: false,
            message: 'Get statistics failed'
          };
        } catch (error) {
          console.error('Get statistics failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get statistics failed'
          };
        }
      }
    );

    // 獲取所有規則
    ipcMain.handle(
      RISK_CHANNELS.GET_RULES,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<RiskRule[]>> => {
        try {
          const rules = await riskService.getAllRules();
          
          return {
            success: true,
            message: 'Get rules success',
            data: rules
          };
        } catch (error) {
          console.error('Get rules failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get rules failed'
          };
        }
      }
    );

    // 獲取啟用規則
    ipcMain.handle(
      RISK_CHANNELS.GET_ACTIVE_RULES,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<RiskRule[]>> => {
        try {
          const rules = await riskService.getActiveRules();
          
          return {
            success: true,
            message: 'Get active rules success',
            data: rules
          };
        } catch (error) {
          console.error('Get active rules failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Get active rules failed'
          };
        }
      }
    );

    // 創建規則
    ipcMain.handle(
      RISK_CHANNELS.CREATE_RULE,
      async (_event: IpcMainInvokeEvent, request: CreateRiskRuleRequest): Promise<IPCResponse<{ ruleId: number }>> => {
        try {
          const result = await riskService.createRule(
            request.name,
            request.description,
            [],
            request.pattern,
            request.riskLevel,
            request.category
          );
          
          if (result.success && result.ruleId) {
            return {
              success: true,
              message: 'Create rule success',
              data: { ruleId: result.ruleId }
            };
          }

          return {
            success: false,
            message: result.message || 'Create rule failed'
          };
        } catch (error) {
          console.error('Create rule failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Create rule failed'
          };
        }
      }
    );

    // 更新規則
    ipcMain.handle(
      RISK_CHANNELS.UPDATE_RULE,
      async (_event: IpcMainInvokeEvent, request: UpdateRiskRuleRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.updateRule(request.ruleId, {
            name: request.name,
            pattern: request.pattern,
            riskLevel: request.risk_level,
            description: request.description,
            enabled: (request as any).enabled
          });
          
          if (result.success) {
            return {
              success: true,
              message: 'Update rule success'
            };
          }

          return {
            success: false,
            message: result.message || 'Update rule failed'
          };
        } catch (error) {
          console.error('Update rule failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Update rule failed'
          };
        }
      }
    );

    // 刪除規則
    ipcMain.handle(
      RISK_CHANNELS.DELETE_RULE,
      async (_event: IpcMainInvokeEvent, request: DeleteRiskRuleRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.deleteRule(request.ruleId);
          
          if (result.success) {
            return {
              success: true,
              message: 'Delete rule success'
            };
          }

          return {
            success: false,
            message: result.message || 'Delete rule failed'
          };
        } catch (error) {
          console.error('Delete rule failed:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Delete rule failed'
          };
        }
      }
    );
  }
}

export const riskHandlers = new RiskHandlers();
