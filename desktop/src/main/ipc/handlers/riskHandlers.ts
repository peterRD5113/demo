/**
 * ???? IPC ???
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
  GetRisksByCategoryRequest,
  UpdateRiskStatusRequest,
  RiskStatisticsResponse,
  CreateRiskRuleRequest,
  UpdateRiskRuleRequest,
  DeleteRiskRuleRequest,
  IPCResponse,
  IPCListResponse
} from '../types';
import type { Risk, RiskRule } from '@shared/types';

class RiskHandlers {
  /**
   * ????????? IPC ???
   */
  register(ipcMain: IpcMain): void {
    // ????
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
            message: result.message || '??????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ?????????????????? getRisk ???
    ipcMain.handle(
      RISK_CHANNELS.GET,
      async (_event: IpcMainInvokeEvent, request: GetRiskRequest): Promise<IPCResponse<Risk>> => {
        try {
          // TODO: ??????????
          return {
            success: false,
            message: '??????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      RISK_CHANNELS.LIST,
      async (_event: IpcMainInvokeEvent, request: ListRisksRequest): Promise<IPCResponse<IPCListResponse<Risk>>> => {
        try {
          const result = await riskService.getProjectRisks(
            request.projectId,
            request.userId,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '????????',
            data: {
              items: result.risks,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 50
            }
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ?????????
    ipcMain.handle(
      RISK_CHANNELS.GET_BY_LEVEL,
      async (_event: IpcMainInvokeEvent, request: GetRisksByLevelRequest): Promise<IPCResponse<IPCListResponse<Risk>>> => {
        try {
          const result = await riskService.getRisksByLevel(
            request.projectId,
            request.userId,
            request.level,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '??????',
            data: {
              items: result.risks,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 50
            }
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ???????
    ipcMain.handle(
      RISK_CHANNELS.GET_BY_CATEGORY,
      async (_event: IpcMainInvokeEvent, request: GetRisksByCategoryRequest): Promise<IPCResponse<IPCListResponse<Risk>>> => {
        try {
          const result = await riskService.getRisksByCategory(
            request.projectId,
            request.userId,
            request.category,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '??????',
            data: {
              items: result.risks,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 50
            }
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      RISK_CHANNELS.UPDATE_STATUS,
      async (_event: IpcMainInvokeEvent, request: UpdateRiskStatusRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.updateRiskStatus(
            request.riskId,
            request.userId,
            request.status
          );
          
          if (result.success) {
            return {
              success: true,
              message: '????????'
            };
          }

          return {
            success: false,
            message: result.message || '????????'
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      RISK_CHANNELS.GET_STATS,
      async (_event: IpcMainInvokeEvent, projectId: number, userId: number): Promise<IPCResponse<RiskStatisticsResponse>> => {
        try {
          const stats = await riskService.getProjectRiskStatistics(projectId, userId);
          
          if (stats) {
            return {
              success: true,
              message: '????????',
              data: stats
            };
          }

          return {
            success: false,
            message: '????????'
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ????????
    ipcMain.handle(
      RISK_CHANNELS.GET_RULES,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<RiskRule[]>> => {
        try {
          const rules = await riskService.getAllRules();
          
          return {
            success: true,
            message: '????????',
            data: rules
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ????????
    ipcMain.handle(
      RISK_CHANNELS.GET_ACTIVE_RULES,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<RiskRule[]>> => {
        try {
          const rules = await riskService.getActiveRules();
          
          return {
            success: true,
            message: '??????????',
            data: rules
          };
        } catch (error) {
          console.error('??????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      RISK_CHANNELS.CREATE_RULE,
      async (_event: IpcMainInvokeEvent, request: CreateRiskRuleRequest): Promise<IPCResponse<{ ruleId: number }>> => {
        try {
          const result = await riskService.createRule(
            request.name,
            request.pattern,
            request.riskLevel,
            request.category,
            request.description
          );
          
          if (result.success && result.ruleId) {
            return {
              success: true,
              message: '????????',
              data: { ruleId: result.ruleId }
            };
          }

          return {
            success: false,
            message: result.message || '????????'
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      RISK_CHANNELS.UPDATE_RULE,
      async (_event: IpcMainInvokeEvent, request: UpdateRiskRuleRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.updateRule(request.ruleId, {
            name: request.name,
            pattern: request.pattern,
            risk_level: request.risk_level,
            category: request.category,
            description: request.description,
            is_active: request.is_active
          });
          
          if (result.success) {
            return {
              success: true,
              message: '????????'
            };
          }

          return {
            success: false,
            message: result.message || '????????'
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      RISK_CHANNELS.DELETE_RULE,
      async (_event: IpcMainInvokeEvent, request: DeleteRiskRuleRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await riskService.deleteRule(request.ruleId);
          
          if (result.success) {
            return {
              success: true,
              message: '????????'
            };
          }

          return {
            success: false,
            message: result.message || '????????'
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );
  }
}

export const riskHandlers = new RiskHandlers();
