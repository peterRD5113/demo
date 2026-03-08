// 風險等級常量
export const RISK_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// 風險等級顏色映射
export const RISK_LEVEL_COLORS = {
  high: '#ff4d4f',    // 紅色
  medium: '#faad14',  // 橙色
  low: '#52c41a',     // 綠色
} as const;

// 風險等級中文名稱
export const RISK_LEVEL_NAMES = {
  high: '高風險',
  medium: '中風險',
  low: '低風險',
} as const;

// 用戶角色常量
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

// 用戶角色中文名稱
export const USER_ROLE_NAMES = {
  admin: '管理員',
  user: '普通用戶',
  viewer: '查看者',
} as const;

// 文檔狀態常量
export const DOCUMENT_STATUS = {
  PARSING: 'parsing',
  READY: 'ready',
  ERROR: 'error',
} as const;

// 文檔類型常量
export const FILE_TYPES = {
  DOCX: 'docx',
  PDF: 'pdf',
  TXT: 'txt',
} as const;

// 批註類型常量
export const ANNOTATION_TYPES = {
  COMMENT: 'comment',
  SUGGESTION: 'suggestion',
  QUESTION: 'question',
} as const;

// 提及狀態常量
export const MENTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
} as const;

// 登錄失敗鎖定配置
export const LOGIN_CONFIG = {
  MAX_ATTEMPTS: 5,           // 最大失敗次數
  LOCK_DURATION: 10 * 60,    // 鎖定時長（秒）
  TOKEN_EXPIRE_HOURS: 24,    // Token 過期時間（小時）
} as const;

// 性能配置
export const PERFORMANCE_CONFIG = {
  LARGE_DOC_CLAUSE_THRESHOLD: 1000,  // 大文檔條款數閾值
  LARGE_DOC_SIZE_THRESHOLD: 5,       // 大文檔大小閾值（MB）
  VIRTUAL_SCROLL_BUFFER: 20,         // 虛擬滾動緩衝區大小
  INITIAL_LOAD_COUNT: 200,           // 首次加載條款數
} as const;

// HTTP 狀態碼
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 錯誤碼
export const ERROR_CODES = {
  // 認證相關
  INVALID_CREDENTIALS: 40001,
  ACCOUNT_LOCKED: 40002,
  TOKEN_EXPIRED: 40003,
  TOKEN_INVALID: 40004,
  
  // 權限相關
  PERMISSION_DENIED: 40301,
  RESOURCE_NOT_OWNED: 40302,
  
  // 資源相關
  RESOURCE_NOT_FOUND: 40401,
  
  // 業務邏輯相關
  DOCUMENT_PARSING_FAILED: 50001,
  DOCUMENT_EXPORT_FAILED: 50002,
  VERSION_SAVE_FAILED: 50003,
  
  // 系統相關
  DATABASE_ERROR: 50101,
  FILE_SYSTEM_ERROR: 50102,
} as const;

// 錯誤消息
export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: '用戶名或密碼錯誤',
  [ERROR_CODES.ACCOUNT_LOCKED]: '賬號已鎖定，請稍後再試',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Token 已過期，請重新登錄',
  [ERROR_CODES.TOKEN_INVALID]: 'Token 無效',
  [ERROR_CODES.PERMISSION_DENIED]: '權限不足',
  [ERROR_CODES.RESOURCE_NOT_OWNED]: '無權訪問此資源',
  [ERROR_CODES.RESOURCE_NOT_FOUND]: '資源不存在',
  [ERROR_CODES.DOCUMENT_PARSING_FAILED]: '文檔解析失敗',
  [ERROR_CODES.DOCUMENT_EXPORT_FAILED]: '文檔導出失敗',
  [ERROR_CODES.VERSION_SAVE_FAILED]: '版本保存失敗',
  [ERROR_CODES.DATABASE_ERROR]: '數據庫錯誤',
  [ERROR_CODES.FILE_SYSTEM_ERROR]: '文件系統錯誤',
} as const;
