// IPC 通道定義
export const IPC_CHANNELS = {
  // 認證相關
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_VERIFY: 'auth:verify',
  AUTH_CHANGE_PASSWORD: 'auth:changePassword',
  
  // 用戶相關
  USER_GET_PROFILE: 'user:getProfile',
  USER_UPDATE_PROFILE: 'user:updateProfile',
  USER_LIST: 'user:list',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 項目相關
  PROJECT_LIST: 'project:list',
  PROJECT_GET: 'project:get',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_GET_STATS: 'project:getStats',
  
  // 文檔相關
  DOCUMENT_LIST: 'document:list',
  DOCUMENT_GET: 'document:get',
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_PARSE: 'document:parse',
  
  // 條款相關
  CLAUSE_LIST: 'clause:list',
  CLAUSE_GET: 'clause:get',
  CLAUSE_UPDATE: 'clause:update',
  
  // 風險相關
  RISK_LIST: 'risk:list',
  RISK_ANALYZE: 'risk:analyze',
  RISK_UPDATE_STATUS: 'risk:updateStatus',
  RISK_GET_STATS: 'risk:getStats',
  
  // 風險規則相關
  RISK_RULE_LIST: 'riskRule:list',
  RISK_RULE_CREATE: 'riskRule:create',
  RISK_RULE_UPDATE: 'riskRule:update',
  RISK_RULE_DELETE: 'riskRule:delete',
  RISK_RULE_TOGGLE: 'riskRule:toggle',
  
  // 批註相關
  ANNOTATION_LIST: 'annotation:list',
  ANNOTATION_CREATE: 'annotation:create',
  ANNOTATION_UPDATE: 'annotation:update',
  ANNOTATION_DELETE: 'annotation:delete',
  
  // 版本相關
  VERSION_LIST: 'version:list',
  VERSION_CREATE: 'version:create',
  VERSION_RESTORE: 'version:restore',
  
  // 模板相關
  TEMPLATE_LIST: 'template:list',
  TEMPLATE_GET: 'template:get',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_UPDATE: 'template:update',
  TEMPLATE_DELETE: 'template:delete',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
