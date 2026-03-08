/**
 * Jest 測試環境設置
 */

// 設置測試環境變量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Mock console 方法以減少測試輸出噪音
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
