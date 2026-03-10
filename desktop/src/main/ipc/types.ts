/**
 * IPC 類型定義
 * 定義所有 IPC 通信的請求和響應類型
 */

import type { User, Project, Document, Clause, Risk, RiskRule } from '@shared/types';

// ============= 通用響應類型 =============

export interface IPCResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface IPCListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============= 認證相關類型 =============

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

// ============= 項目相關類型 =============

export interface CreateProjectRequest {
  name: string;
  description?: string;
  userId: number;
  password?: string;
}

export interface UpdateProjectRequest {
  projectId: number;
  userId: number;
  name?: string;
  description?: string;
  password?: string;
}

export interface GetProjectRequest {
  projectId: number;
  userId: number;
}

export interface ListProjectsRequest {
  userId: number;
  page?: number;
  pageSize?: number;
}

export interface DeleteProjectRequest {
  projectId: number;
  userId: number;
}

export interface SearchProjectsRequest {
  userId: number;
  keyword: string;
  page?: number;
  pageSize?: number;
}

export interface VerifyProjectPasswordRequest {
  projectId: number;
  userId: number;
  password: string;
}

export interface ProjectStatsResponse {
  documentCount: number;
  clauseCount: number;
  riskCount: number;
}

// ============= 文檔相關類型 =============

export interface CreateDocumentRequest {
  projectId: number;
  userId: number;
  name: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'txt';
}

export interface UpdateDocumentRequest {
  documentId: number;
  userId: number;
  name?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface GetDocumentRequest {
  documentId: number;
  userId: number;
}

export interface ListDocumentsRequest {
  projectId: number;
  userId: number;
  page?: number;
  pageSize?: number;
}

export interface DeleteDocumentRequest {
  documentId: number;
  userId: number;
}

export interface SearchDocumentsRequest {
  projectId: number;
  userId: number;
  keyword: string;
  page?: number;
  pageSize?: number;
}

export interface GetDocumentsByStatusRequest {
  projectId: number;
  userId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  page?: number;
  pageSize?: number;
}

export interface UpdateDocumentStatusRequest {
  documentId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

// ============= 條款相關類型 =============

export interface CreateClauseRequest {
  projectId: number;
  documentId: number;
  title: string;
  content: string;
  clauseNumber?: string;
  pageNumber?: number;
}

export interface UpdateClauseRequest {
  clauseId: number;
  userId: number;
  title?: string;
  content?: string;
  clauseNumber?: string;
  pageNumber?: number;
}

export interface GetClauseRequest {
  clauseId: number;
  userId: number;
}

export interface ListClausesRequest {
  projectId: number;
  userId: number;
  page?: number;
  pageSize?: number;
}

export interface DeleteClauseRequest {
  clauseId: number;
  userId: number;
}

export interface SearchClausesRequest {
  projectId: number;
  userId: number;
  keyword: string;
  page?: number;
  pageSize?: number;
}

export interface GetClausesByDocumentRequest {
  documentId: number;
  userId: number;
  page?: number;
  pageSize?: number;
}

// ============= 風險相關類型 =============

export interface IdentifyRisksRequest {
  documentId: number;
  userId: number;
}

export interface IdentifyRisksResponse {
  risksFound: number;
  risks: Risk[];
}

export interface GetRiskRequest {
  riskId: number;
  userId: number;
}

export interface ListRisksRequest {
  documentId: number;
  userId: number;
  page?: number;
  pageSize?: number;
}

export interface GetRisksByLevelRequest {
  documentId: number;
  userId: number;
  level: 'high' | 'medium' | 'low';
  page?: number;
  pageSize?: number;
}

export interface GetRisksByCategoryRequest {
  projectId: number;
  userId: number;
  category: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateRiskStatusRequest {
  riskId: number;
  userId: number;
  status: 'pending' | 'reviewing' | 'resolved' | 'ignored';
}

export interface RiskStatisticsResponse {
  total: number;
  high: number;
  medium: number;
  low: number;
  byCategory: Record<string, number>;
}

export interface CreateRiskRuleRequest {
  name: string;
  pattern: string;
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  description: string;
}

export interface UpdateRiskRuleRequest {
  ruleId: number;
  name?: string;
  pattern?: string;
  risk_level?: 'high' | 'medium' | 'low';
  category?: string;
  description?: string;
  is_active?: boolean;
}

export interface DeleteRiskRuleRequest {
  ruleId: number;
}

// ============= 文件操作相關類型 =============

export interface SelectFileRequest {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
}

export interface SelectFolderRequest {
  title?: string;
  defaultPath?: string;
}

export interface ReadFileRequest {
  filePath: string;
}

export interface WriteFileRequest {
  filePath: string;
  content: string | Buffer;
}

export interface DeleteFileRequest {
  filePath: string;
}

export interface GetFileInfoRequest {
  filePath: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  createdAt: Date;
  modifiedAt: Date;
}

// ============= 系統相關類型 =============

export interface OpenExternalRequest {
  url: string;
}

export interface ShowMessageRequest {
  type: 'info' | 'warning' | 'error' | 'question';
  title: string;
  message: string;
  buttons?: string[];
}

export interface ShowMessageResponse {
  response: number; // 按鈕索引
}
