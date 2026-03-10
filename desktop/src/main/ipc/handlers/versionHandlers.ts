/**
 * 版本管理相关 IPC 处理器
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { versionService } from '../../services';

class VersionHandlers {
  /**
   * 注册所有版本管理相关的 IPC 处理器
   */
  register(ipcMain: IpcMain): void {
    // 获取文档的所有版本列表
    ipcMain.handle(
      'version:getList',
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number) => {
        try {
          const versions = await versionService.getDocumentVersions(documentId, userId);
          return {
            success: true,
            message: '获取版本列表成功',
            data: versions
          };
        } catch (error) {
          console.error('获取版本列表失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '获取版本列表失败'
          };
        }
      }
    );

    // 获取最新版本信息
    ipcMain.handle(
      'version:getLatest',
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number) => {
        try {
          const version = await versionService.getLatestVersion(documentId, userId);
          return {
            success: true,
            message: version ? '获取最新版本成功' : '暂无版本',
            data: version
          };
        } catch (error) {
          console.error('获取最新版本失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '获取最新版本失败'
          };
        }
      }
    );

    // 获取指定版本的所有条款
    ipcMain.handle(
      'version:getClauses',
      async (_event: IpcMainInvokeEvent, versionId: number, userId: number) => {
        try {
          const clauses = await versionService.getVersionClauses(versionId, userId);
          return {
            success: true,
            message: '获取版本条款成功',
            data: {
              items: clauses,
              total: clauses.length
            }
          };
        } catch (error) {
          console.error('获取版本条款失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '获取版本条款失败'
          };
        }
      }
    );

    // 创建新版本
    ipcMain.handle(
      'version:create',
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number, changeSummary?: string) => {
        try {
          const result = await versionService.createVersion(documentId, userId, changeSummary);
          return {
            success: true,
            message: `已保存为版本${result.version_number}`,
            data: result
          };
        } catch (error) {
          console.error('创建版本失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '创建版本失败'
          };
        }
      }
    );

    // 回滚到指定版本
    ipcMain.handle(
      'version:rollback',
      async (_event: IpcMainInvokeEvent, documentId: number, versionId: number, userId: number) => {
        try {
          await versionService.rollbackToVersion(documentId, versionId, userId);
          return {
            success: true,
            message: '已回滚到指定版本'
          };
        } catch (error) {
          console.error('回滚版本失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '回滚版本失败'
          };
        }
      }
    );

    // 获取对照数据
    ipcMain.handle(
      'version:getComparison',
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number) => {
        try {
          const data = await versionService.getComparisonData(documentId, userId);
          return {
            success: true,
            message: '获取对照数据成功',
            data
          };
        } catch (error) {
          console.error('获取对照数据失败:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '获取对照数据失败'
          };
        }
      }
    );
  }
}

export const versionHandlers = new VersionHandlers();
