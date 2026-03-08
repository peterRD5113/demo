/**
 * 錯誤處理中間件
 * 統一處理和格式化錯誤響應
 */

import type { IpcMainInvokeEvent } from 'electron';

/**
 * 錯誤類型
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_ERROR = 'FILE_ERROR'
}

/**
 * 自定義錯誤類
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 錯誤處理中間件
 * 捕獲並格式化所有錯誤
 */
export function errorHandler(
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
) {
  return async (event: IpcMainInvokeEvent, ...args: any[]): Promise<any> => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      console.error('IPC 處理器錯誤:', error);

      // 如果是自定義錯誤
      if (error instanceof AppError) {
        return {
          success: false,
          message: error.message,
          errorType: error.type,
          details: error.details
        };
      }

      // 如果是標準錯誤
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
          errorType: ErrorType.INTERNAL_ERROR
        };
      }

      // 未知錯誤
      return {
        success: false,
        message: '發生未知錯誤',
        errorType: ErrorType.INTERNAL_ERROR
      };
    }
  };
}

/**
 * 驗證錯誤
 */
export function validationError(message: string, details?: any): AppError {
  return new AppError(ErrorType.VALIDATION_ERROR, message, details);
}

/**
 * 認證錯誤
 */
export function authenticationError(message: string = '認證失敗'): AppError {
  return new AppError(ErrorType.AUTHENTICATION_ERROR, message);
}

/**
 * 授權錯誤
 */
export function authorizationError(message: string = '無權限執行此操作'): AppError {
  return new AppError(ErrorType.AUTHORIZATION_ERROR, message);
}

/**
 * 資源不存在錯誤
 */
export function notFoundError(resource: string): AppError {
  return new AppError(ErrorType.NOT_FOUND_ERROR, `${resource}不存在`);
}

/**
 * 衝突錯誤
 */
export function conflictError(message: string): AppError {
  return new AppError(ErrorType.CONFLICT_ERROR, message);
}

/**
 * 數據庫錯誤
 */
export function databaseError(message: string, details?: any): AppError {
  return new AppError(ErrorType.DATABASE_ERROR, message, details);
}

/**
 * 文件錯誤
 */
export function fileError(message: string, details?: any): AppError {
  return new AppError(ErrorType.FILE_ERROR, message, details);
}

/**
 * 內部錯誤
 */
export function internalError(message: string = '內部服務器錯誤'): AppError {
  return new AppError(ErrorType.INTERNAL_ERROR, message);
}
