/**
 * IPC 通道定義
 * 定義主進程和渲染進程之間的通信通道
 */

// 認證相關通道
export const AUTH_CHANNELS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',
  CHANGE_PASSWORD: 'auth:change-password',
  GET_CURRENT_USER: 'auth:get-current-user',
  VERIFY_TOKEN: 'auth:verify-token'
} as const;

// 項目相關通道
export const PROJECT_CHANNELS = {
  CREATE: 'project:create',
  GET: 'project:get',
  LIST: 'project:list',
  UPDATE: 'project:update',
  DELETE: 'project:delete',
  SEARCH: 'project:search',
  GET_STATS: 'project:get-stats',
  VERIFY_PASSWORD: 'project:verify-password'
} as const;

// 文檔相關通道
export const DOCUMENT_CHANNELS = {
  CREATE: 'document:create',
  GET: 'document:get',
  LIST: 'document:list',
  UPDATE: 'document:update',
  DELETE: 'document:delete',
  SEARCH: 'document:search',
  GET_BY_STATUS: 'document:get-by-status',
  UPDATE_STATUS: 'document:update-status',
  GET_FILE_PATH: 'document:get-file-path'
} as const;

// 條款相關通道
export const CLAUSE_CHANNELS = {
  CREATE: 'clause:create',
  GET: 'clause:get',
  LIST: 'clause:list',
  UPDATE: 'clause:update',
  DELETE: 'clause:delete',
  SEARCH: 'clause:search',
  GET_BY_DOCUMENT: 'clause:get-by-document'
} as const;

// 風險相關通道
export const RISK_CHANNELS = {
  IDENTIFY: 'risk:identify',
  GET: 'risk:get',
  LIST: 'risk:list',
  GET_BY_LEVEL: 'risk:get-by-level',
  GET_BY_CATEGORY: 'risk:get-by-category',
  UPDATE_STATUS: 'risk:update-status',
  GET_STATS: 'risk:get-stats',
  GET_RULES: 'risk:get-rules',
  GET_ACTIVE_RULES: 'risk:get-active-rules',
  CREATE_RULE: 'risk:create-rule',
  UPDATE_RULE: 'risk:update-rule',
  DELETE_RULE: 'risk:delete-rule'
} as const;

// 批註相關通道
export const ANNOTATION_CHANNELS = {
  CREATE: 'annotation:create',
  GET_BY_CLAUSE: 'annotation:get-by-clause',
  UPDATE: 'annotation:update',
  DELETE: 'annotation:delete',
  RESOLVE: 'annotation:resolve',
  GET_MENTIONS: 'annotation:get-mentions',
  MARK_MENTION_READ: 'annotation:mark-mention-read'
} as const;

// 文件操作相關通道
export const FILE_CHANNELS = {
  SELECT_FILE: 'file:select-file',
  SELECT_FOLDER: 'file:select-folder',
  READ_FILE: 'file:read-file',
  WRITE_FILE: 'file:write-file',
  DELETE_FILE: 'file:delete-file',
  GET_FILE_INFO: 'file:get-file-info'
} as const;

// 系統相關通道
export const SYSTEM_CHANNELS = {
  GET_APP_VERSION: 'system:get-app-version',
  GET_APP_PATH: 'system:get-app-path',
  OPEN_EXTERNAL: 'system:open-external',
  SHOW_MESSAGE: 'system:show-message',
  SHOW_ERROR: 'system:show-error'
} as const;

// 所有通道的聯合類型
export type IPCChannel =
  | typeof AUTH_CHANNELS[keyof typeof AUTH_CHANNELS]
  | typeof PROJECT_CHANNELS[keyof typeof PROJECT_CHANNELS]
  | typeof DOCUMENT_CHANNELS[keyof typeof DOCUMENT_CHANNELS]
  | typeof CLAUSE_CHANNELS[keyof typeof CLAUSE_CHANNELS]
  | typeof RISK_CHANNELS[keyof typeof RISK_CHANNELS]
  | typeof ANNOTATION_CHANNELS[keyof typeof ANNOTATION_CHANNELS]
  | typeof FILE_CHANNELS[keyof typeof FILE_CHANNELS]
  | typeof SYSTEM_CHANNELS[keyof typeof SYSTEM_CHANNELS];
