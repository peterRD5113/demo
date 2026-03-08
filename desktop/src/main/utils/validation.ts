/**
 * 參數驗證工具
 * 提供常用的參數校驗函數
 */

import { validationError } from '@main/middleware';

/**
 * 驗證必填字符串
 */
export function validateRequiredString(
  value: any,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 255
): void {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName}不能為空`);
  }

  if (typeof value !== 'string') {
    throw validationError(`${fieldName}必須是字符串`);
  }

  const trimmed = value.trim();
  
  if (trimmed.length < minLength) {
    throw validationError(`${fieldName}不能為空`);
  }

  if (trimmed.length > maxLength) {
    throw validationError(`${fieldName}不能超過 ${maxLength} 個字符`);
  }
}

/**
 * 驗證可選字符串
 */
export function validateOptionalString(
  value: any,
  fieldName: string,
  maxLength: number = 500
): void {
  if (value === undefined || value === null || value === '') {
    return; // 可選字段，允許為空
  }

  if (typeof value !== 'string') {
    throw validationError(`${fieldName}必須是字符串`);
  }

  if (value.length > maxLength) {
    throw validationError(`${fieldName}不能超過 ${maxLength} 個字符`);
  }
}

/**
 * 驗證用戶名格式
 */
export function validateUsername(username: any): void {
  validateRequiredString(username, '用戶名', 3, 50);

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    throw validationError('用戶名只能包含字母、數字、下劃線和連字符');
  }
}

/**
 * 驗證密碼格式
 */
export function validatePassword(password: any): void {
  validateRequiredString(password, '密碼', 6, 100);

  // 密碼強度檢查（至少包含字母和數字）
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    throw validationError('密碼必須包含字母和數字');
  }
}

/**
 * 驗證郵箱格式
 */
export function validateEmail(email: any): void {
  if (!email) {
    throw validationError('郵箱不能為空');
  }

  if (typeof email !== 'string') {
    throw validationError('郵箱格式不正確');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw validationError('郵箱格式不正確');
  }

  if (email.length > 255) {
    throw validationError('郵箱不能超過 255 個字符');
  }
}

/**
 * 驗證正整數
 */
export function validatePositiveInteger(value: any, fieldName: string): void {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName}不能為空`);
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw validationError(`${fieldName}必須是整數`);
  }

  if (value <= 0) {
    throw validationError(`${fieldName}必須大於 0`);
  }
}

/**
 * 驗證非負整數
 */
export function validateNonNegativeInteger(value: any, fieldName: string): void {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName}不能為空`);
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw validationError(`${fieldName}必須是整數`);
  }

  if (value < 0) {
    throw validationError(`${fieldName}不能為負數`);
  }
}

/**
 * 驗證枚舉值
 */
export function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  allowedValues: readonly T[]
): void {
  if (value === undefined || value === null) {
    throw validationError(`${fieldName}不能為空`);
  }

  if (!allowedValues.includes(value as T)) {
    throw validationError(
      `${fieldName}必須是以下值之一: ${allowedValues.join(', ')}`
    );
  }
}

/**
 * 驗證文件路徑
 */
export function validateFilePath(filePath: any): void {
  validateRequiredString(filePath, '文件路徑', 1, 1000);

  // 檢查是否包含非法字符
  const illegalChars = /[<>"|?*]/;
  if (illegalChars.test(filePath)) {
    throw validationError('文件路徑包含非法字符');
  }
}

/**
 * 驗證正則表達式
 */
export function validateRegex(pattern: any, fieldName: string = '正則表達式'): void {
  validateRequiredString(pattern, fieldName, 1, 500);

  try {
    new RegExp(pattern);
  } catch (error) {
    throw validationError(`${fieldName}格式不正確`);
  }
}

/**
 * 驗證分頁參數
 */
export function validatePagination(page?: number, pageSize?: number): void {
  if (page !== undefined) {
    validatePositiveInteger(page, '頁碼');
  }

  if (pageSize !== undefined) {
    validatePositiveInteger(pageSize, '每頁數量');
    
    if (pageSize > 100) {
      throw validationError('每頁數量不能超過 100');
    }
  }
}

/**
 * 驗證 ID
 */
export function validateId(id: any, fieldName: string = 'ID'): void {
  validatePositiveInteger(id, fieldName);
}
