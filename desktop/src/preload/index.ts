// @ts-nocheck
/**
 * Preload 腳本
 * 在渲染進程中暴露安全的 API
 */

import { contextBridge, ipcRenderer } from 'electron';

// 內聯定義 IPC 通道常量（避免模塊導入問題）
const AUTH_CHANNELS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  REFRESH_TOKEN: 'auth:refresh-token',
  CHANGE_PASSWORD: 'auth:change-password',
  GET_CURRENT_USER: 'auth:get-current-user',
  VERIFY_TOKEN: 'auth:verify-token'
};

const PROJECT_CHANNELS = {
  CREATE: 'project:create',
  GET: 'project:get',
  LIST: 'project:list',
  UPDATE: 'project:update',
  DELETE: 'project:delete',
  SEARCH: 'project:search',
  GET_STATS: 'project:get-stats',
  VERIFY_PASSWORD: 'project:verify-password'
};

const DOCUMENT_CHANNELS = {
  CREATE: 'document:create',
  GET: 'document:get',
  LIST: 'document:list',
  UPDATE: 'document:update',
  DELETE: 'document:delete',
  SEARCH: 'document:search',
  GET_BY_STATUS: 'document:get-by-status',
  UPDATE_STATUS: 'document:update-status',
  GET_FILE_PATH: 'document:get-file-path'
};

const CLAUSE_CHANNELS = {
  CREATE: 'clause:create',
  GET: 'clause:get',
  LIST: 'clause:list',
  UPDATE: 'clause:update',
  DELETE: 'clause:delete',
  SEARCH: 'clause:search',
  GET_BY_DOCUMENT: 'clause:get-by-document'
};

const RISK_CHANNELS = {
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
};

const ANNOTATION_CHANNELS = {
  CREATE: 'annotation:create',
  GET_BY_CLAUSE: 'annotation:get-by-clause',
  UPDATE: 'annotation:update',
  DELETE: 'annotation:delete',
  RESOLVE: 'annotation:resolve',
  GET_MENTIONS: 'annotation:get-mentions',
  MARK_MENTION_READ: 'annotation:mark-mention-read',
  SEARCH_USERS: 'annotation:search-users'
};

const FILE_CHANNELS = {
  SELECT_FILE: 'file:select-file',
  SELECT_FOLDER: 'file:select-folder',
  READ_FILE: 'file:read-file',
  WRITE_FILE: 'file:write-file',
  DELETE_FILE: 'file:delete-file',
  GET_FILE_INFO: 'file:get-file-info'
};

const SYSTEM_CHANNELS = {
  GET_APP_VERSION: 'system:get-app-version',
  GET_APP_PATH: 'system:get-app-path',
  OPEN_EXTERNAL: 'system:open-external',
  SHOW_MESSAGE: 'system:show-message',
  SHOW_ERROR: 'system:show-error'
};

const TEMPLATE_CHANNELS = {
  LIST: 'template:list',
  CREATE: 'template:create',
  UPDATE: 'template:update',
  DELETE: 'template:delete',
};

// 定義暴露給渲染進程的API
const api = {
  // ============= 認證 API =============
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.LOGIN, { username, password }),
    
    logout: (userId: number) =>
      ipcRenderer.invoke(AUTH_CHANNELS.LOGOUT, userId),
    
    refreshToken: (refreshToken: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.REFRESH_TOKEN, { refreshToken }),
    
    verifyToken: (token: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.VERIFY_TOKEN, { token }),
    
    changePassword: (userId: number, oldPassword: string, newPassword: string) =>
      ipcRenderer.invoke(AUTH_CHANNELS.CHANGE_PASSWORD, { userId, oldPassword, newPassword }),
    
    getCurrentUser: (userId: number) =>
      ipcRenderer.invoke(AUTH_CHANNELS.GET_CURRENT_USER, userId)
  },

  // ============= 項目 API =============
  project: {
    create: (name: string, userId: number, description?: string, password?: string) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.CREATE, { name, userId, description, password }),
    
    get: (projectId: number, userId: number) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.GET, { projectId, userId }),
    
    list: (userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.LIST, { userId, page, pageSize }),
    
    update: (projectId: number, userId: number, data: { name?: string; description?: string; password?: string }) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.UPDATE, { projectId, userId, ...data }),
    
    delete: (projectId: number, userId: number) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.DELETE, { projectId, userId }),
    
    search: (userId: number, keyword: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.SEARCH, { userId, keyword, page, pageSize }),
    
    getStats: (projectId: number, userId: number) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.GET_STATS, { projectId, userId }),
    
    verifyPassword: (projectId: number, userId: number, password: string) =>
      ipcRenderer.invoke(PROJECT_CHANNELS.VERIFY_PASSWORD, { projectId, userId, password })
  },

  // ============= 文檔 API =============
  document: {
    create: (projectId: number, userId: number, name: string, filePath: string, fileType: 'pdf' | 'docx' | 'txt') =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.CREATE, { projectId, userId, name, filePath, fileType }),
    
    get: (documentId: number, userId: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.GET, { documentId, userId }),
    
    list: (projectId: number, userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.LIST, { projectId, userId, page, pageSize }),
    
    update: (documentId: number, userId: number, data: { name?: string; status?: string }) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.UPDATE, { documentId, userId, ...data }),
    
    delete: (documentId: number, userId: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.DELETE, { documentId, userId }),
    
    search: (projectId: number, userId: number, keyword: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.SEARCH, { projectId, userId, keyword, page, pageSize }),
    
    getByStatus: (projectId: number, userId: number, status: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.GET_BY_STATUS, { projectId, userId, status, page, pageSize }),
    
    updateStatus: (documentId: number, status: string, errorMessage?: string) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.UPDATE_STATUS, { documentId, status, errorMessage }),
    
    getFilePath: (documentId: number, userId: number) =>
      ipcRenderer.invoke(DOCUMENT_CHANNELS.GET_FILE_PATH, { documentId, userId })
  },

  // ============= 條款 API =============
  clause: {
    create: (projectId: number, documentId: number, title: string, content: string, clauseNumber?: string, pageNumber?: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.CREATE, { projectId, documentId, title, content, clauseNumber, pageNumber }),
    
    get: (clauseId: number, userId: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.GET, { clauseId, userId }),
    
    list: (projectId: number, userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.LIST, { projectId, userId, page, pageSize }),
    
    update: (clauseId: number, userId: number, data: any) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.UPDATE, { clauseId, userId, ...data }),
    
    delete: (clauseId: number, userId: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.DELETE, { clauseId, userId }),
    
    search: (projectId: number, userId: number, keyword: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.SEARCH, { projectId, userId, keyword, page, pageSize }),
    
    getByDocument: (documentId: number, userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(CLAUSE_CHANNELS.GET_BY_DOCUMENT, { documentId, userId, page, pageSize })
  },

  // ============= 風險 API =============
  risk: {
    identify: (documentId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.IDENTIFY, { documentId, userId }),
    
    get: (riskId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET, { riskId, userId }),
    
    list: (documentId: number, userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.LIST, { documentId, userId, page, pageSize }),
    
    getByLevel: (documentId: number, userId: number, level: 'high' | 'medium' | 'low', page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_BY_LEVEL, { documentId, userId, level, page, pageSize }),
    
    getByCategory: (documentId: number, userId: number, category: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_BY_CATEGORY, { documentId, userId, category, page, pageSize }),
    
    updateStatus: (riskId: number, userId: number, status: 'high' | 'medium' | 'low') =>
      ipcRenderer.invoke(RISK_CHANNELS.UPDATE_STATUS, { riskId, userId, status }),
    
    getStats: (documentId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_STATS, { documentId, userId }),
    
    getRules: () =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_RULES),
    
    getActiveRules: () =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_ACTIVE_RULES),
    
    createRule: (name: string, pattern: string, riskLevel: 'high' | 'medium' | 'low', category: string, description: string) =>
      ipcRenderer.invoke(RISK_CHANNELS.CREATE_RULE, { name, pattern, riskLevel, category, description }),
    
    updateRule: (ruleId: number, data: any) =>
      ipcRenderer.invoke(RISK_CHANNELS.UPDATE_RULE, { ruleId, ...data }),
    
    deleteRule: (ruleId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.DELETE_RULE, { ruleId })
  },

  // ============= 批註 API =============
  annotation: {
    create: (clauseId: number, userId: number, content: string, type?: 'comment' | 'suggestion' | 'question' | 'issue') =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.CREATE, { clauseId, userId, content, type }),
    
    getByClause: (clauseId: number, userId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.GET_BY_CLAUSE, { clauseId, userId }),
    
    update: (annotationId: number, userId: number, content: string) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.UPDATE, { annotationId, userId, content }),
    
    delete: (annotationId: number, userId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.DELETE, { annotationId, userId }),
    
    resolve: (annotationId: number, userId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.RESOLVE, { annotationId, userId }),
    
    getMentions: (userId: number, projectId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.GET_MENTIONS, { userId, projectId }),
    
    markMentionRead: (mentionId: number, userId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.MARK_MENTION_READ, { mentionId, userId }),

    searchUsers: (keyword: string, currentUserId: number) =>
      ipcRenderer.invoke(ANNOTATION_CHANNELS.SEARCH_USERS, { keyword, currentUserId })
  },

  // ============= 文件操作 API =============
  file: {
    selectFile: (title?: string, filters?: Array<{ name: string; extensions: string[] }>, defaultPath?: string) =>
      ipcRenderer.invoke(FILE_CHANNELS.SELECT_FILE, { title, filters, defaultPath }),
    
    selectFolder: (title?: string, defaultPath?: string) =>
      ipcRenderer.invoke(FILE_CHANNELS.SELECT_FOLDER, { title, defaultPath }),
    
    readFile: (filePath: string) =>
      ipcRenderer.invoke(FILE_CHANNELS.READ_FILE, { filePath }),
    
    writeFile: (filePath: string, content: string | Buffer) =>
      ipcRenderer.invoke(FILE_CHANNELS.WRITE_FILE, { filePath, content }),
    
    deleteFile: (filePath: string) =>
      ipcRenderer.invoke(FILE_CHANNELS.DELETE_FILE, { filePath }),
    
    getFileInfo: (filePath: string) =>
      ipcRenderer.invoke(FILE_CHANNELS.GET_FILE_INFO, { filePath })
  },

  // ============= 版本管理 API =============
  version: {
    getList: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getList', documentId, userId),
    
    getLatest: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getLatest', documentId, userId),
    
    getClauses: (versionId: number, userId: number) =>
      ipcRenderer.invoke('version:getClauses', versionId, userId),
    
    create: (documentId: number, userId: number, changeSummary?: string) =>
      ipcRenderer.invoke('version:create', documentId, userId, changeSummary),
    
    rollback: (documentId: number, versionId: number, userId: number) =>
      ipcRenderer.invoke('version:rollback', documentId, versionId, userId),
    
    getComparison: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getComparison', documentId, userId)
  },

  // ============= 系統 API =============
  system: {
    getAppVersion: () =>
      ipcRenderer.invoke(SYSTEM_CHANNELS.GET_APP_VERSION),
    
    getAppPath: () =>
      ipcRenderer.invoke(SYSTEM_CHANNELS.GET_APP_PATH),
    
    openExternal: (url: string) =>
      ipcRenderer.invoke(SYSTEM_CHANNELS.OPEN_EXTERNAL, { url }),
    
    showMessage: (type: 'info' | 'warning' | 'error' | 'question', title: string, message: string, buttons?: string[]) =>
      ipcRenderer.invoke(SYSTEM_CHANNELS.SHOW_MESSAGE, { type, title, message, buttons }),
    
    showError: (title: string, content: string) =>
      ipcRenderer.invoke(SYSTEM_CHANNELS.SHOW_ERROR, { title, content })
  },

  // ============= 模板 API =============
  template: {
    list: (type?: 'clause' | 'annotation') =>
      ipcRenderer.invoke(TEMPLATE_CHANNELS.LIST, { type }),

    create: (name: string, category: string, content: string, templateType: 'clause' | 'annotation', userId: number, title?: string | null, description?: string | null) =>
      ipcRenderer.invoke(TEMPLATE_CHANNELS.CREATE, { name, category, content, templateType, userId, title, description }),

    update: (id: number, userId: number, data: { name?: string; category?: string; title?: string | null; content?: string; description?: string | null }) =>
      ipcRenderer.invoke(TEMPLATE_CHANNELS.UPDATE, { id, userId, ...data }),

    delete: (id: number, userId: number) =>
      ipcRenderer.invoke(TEMPLATE_CHANNELS.DELETE, { id, userId }),
  }
};

// 暴露 API 到渲染進程
contextBridge.exposeInMainWorld('electronAPI', api);

// TypeScript 類型定義（用於渲染進程）
export type ElectronAPI = typeof api;
