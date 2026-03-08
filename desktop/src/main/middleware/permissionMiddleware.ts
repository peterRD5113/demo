/**
 * 權限檢查中間件
 * 檢查用戶是否有權限執行操作
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { TokenPayload } from '@main/ipc/types';

/**
 * 要求管理員權限
 */
export function requireAdmin(
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
) {
  return async (event: IpcMainInvokeEvent, ...args: any[]): Promise<any> => {
    try {
      const request = args[0];
      const currentUser: TokenPayload | null = request?.currentUser;

      if (!currentUser) {
        return {
          success: false,
          message: '未認證'
        };
      }

      if (currentUser.role !== 'admin') {
        return {
          success: false,
          message: '需要管理員權限'
        };
      }

      return await handler(event, ...args);
    } catch (error) {
      console.error('權限檢查中間件錯誤:', error);
      return {
        success: false,
        message: '權限檢查失敗'
      };
    }
  };
}

/**
 * 要求特定角色
 */
export function requireRole(role: 'admin' | 'user') {
  return function (
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
  ) {
    return async (event: IpcMainInvokeEvent, ...args: any[]): Promise<any> => {
      try {
        const request = args[0];
        const currentUser: TokenPayload | null = request?.currentUser;

        if (!currentUser) {
          return {
            success: false,
            message: '未認證'
          };
        }

        if (currentUser.role !== role) {
          return {
            success: false,
            message: `需要 ${role} 角色權限`
          };
        }

        return await handler(event, ...args);
      } catch (error) {
        console.error('角色檢查中間件錯誤:', error);
        return {
          success: false,
          message: '角色檢查失敗'
        };
      }
    };
  };
}

/**
 * 檢查用戶是否是資源的所有者
 */
export function requireOwnership(
  getUserIdFromRequest: (request: any) => number
) {
  return function (
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
  ) {
    return async (event: IpcMainInvokeEvent, ...args: any[]): Promise<any> => {
      try {
        const request = args[0];
        const currentUser: TokenPayload | null = request?.currentUser;

        if (!currentUser) {
          return {
            success: false,
            message: '未認證'
          };
        }

        const requestUserId = getUserIdFromRequest(request);

        // 管理員可以訪問所有資源
        if (currentUser.role === 'admin') {
          return await handler(event, ...args);
        }

        // 普通用戶只能訪問自己的資源
        if (currentUser.userId !== requestUserId) {
          return {
            success: false,
            message: '無權訪問該資源'
          };
        }

        return await handler(event, ...args);
      } catch (error) {
        console.error('所有權檢查中間件錯誤:', error);
        return {
          success: false,
          message: '所有權檢查失敗'
        };
      }
    };
  };
}

/**
 * 組合多個中間件
 */
export function compose(
  ...middlewares: Array<(handler: any) => any>
) {
  return function (handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>) {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}
