// @ts-nocheck
/**
 * Preload ?≥Êú¨
 * ?®Ê∏≤?ìÈÄ≤Á?‰∏≠Êö¥?≤Â??®Á? API
 */

import { contextBridge, ipcRenderer } from 'electron';
import {
  AUTH_CHANNELS,
  PROJECT_CHANNELS,
  DOCUMENT_CHANNELS,
  CLAUSE_CHANNELS,
  RISK_CHANNELS,
  FILE_CHANNELS,
  SYSTEM_CHANNELS
} from './ipc/channels';

// ÂÆöÁæ©?¥Èú≤Áµ¶Ê∏≤?ìÈÄ≤Á???API
const api = {
  // ============= Ë™çË? API =============
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

  // ============= ?ÖÁõÆ API =============
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

  // ============= ?áÊ? API =============
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

  // ============= Ê¢ùÊ¨æ API =============
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

  // ============= È¢®Èö™ API =============
  risk: {
    identify: (documentId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.IDENTIFY, { documentId, userId }),
    
    get: (riskId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET, { riskId, userId }),
    
    list: (projectId: number, userId: number, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.LIST, { projectId, userId, page, pageSize }),
    
    getByLevel: (projectId: number, userId: number, level: 'high' | 'medium' | 'low', page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_BY_LEVEL, { projectId, userId, level, page, pageSize }),
    
    getByCategory: (projectId: number, userId: number, category: string, page?: number, pageSize?: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_BY_CATEGORY, { projectId, userId, category, page, pageSize }),
    
    updateStatus: (riskId: number, userId: number, status: 'pending' | 'reviewing' | 'resolved' | 'ignored') =>
      ipcRenderer.invoke(RISK_CHANNELS.UPDATE_STATUS, { riskId, userId, status }),
    
    getStats: (projectId: number, userId: number) =>
      ipcRenderer.invoke(RISK_CHANNELS.GET_STATS, { projectId, userId }),
    
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

  // ============= ?á‰ª∂?ç‰? API =============
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

  // ============= Á≥ªÁµ± API =============
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
  }
};

// ?¥Èú≤ API ?∞Ê∏≤?ìÈÄ≤Á?
contextBridge.exposeInMainWorld('electronAPI', api);

// TypeScript È°ûÂ??≤Ê?ÔºàÁî®?ºÊ∏≤?ìÈÄ≤Á?Ôº?
export type ElectronAPI = typeof api;
