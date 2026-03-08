// ??????
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
  is_locked?: boolean;
}

export interface UserResponse {
  id: number;
  username: string;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  msg: string;
  data: {
    token: string;
    user: UserResponse;
    expires_in: number;
  } | null;
}

// ??????
export interface Project {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ??????
export interface Document {
  id: number;
  project_id: number;
  name: string;
  original_name: string;
  file_type: 'docx' | 'pdf' | 'txt';
  file_size: number;
  file_path: string;
  status: 'parsing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

// ??????
export interface Clause {
  id: number;
  document_id: number;
  project_id?: number;
  clause_number: string;
  title: string | null;
  content: string;
  level: number;
  parent_id: number | null;
  order_index: number;
  created_at: string;
}

// ??????
export type RiskLevel = 'high' | 'medium' | 'low';

export interface RiskRule {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  pattern: string | null;
  risk_level: RiskLevel;
  suggestion: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  project_id?: number;
}

export interface RiskMatch {
  id: number;
  clause_id: number;
  rule_id: number;
  risk_level: RiskLevel;
  matched_text: string;
  suggestion: string;
  user_adjusted_level: RiskLevel | null;
  created_at: string;
}

// Risk ????????????
export type Risk = RiskMatch;

// ??????
export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  content_snapshot: string;
  change_summary: string;
  user_id: number;
  created_at: string;
}

// ??????
export interface Annotation {
  id: number;
  clause_id: number;
  user_id: number;
  content: string;
  type: 'comment' | 'suggestion' | 'question';
  created_at: string;
  updated_at: string;
}

// @??????
export interface Mention {
  id: number;
  annotation_id: number;
  mentioned_user_id: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
}

// ????????
export interface ClauseTemplate {
  id: number;
  category: string;
  title: string;
  content: string;
  variables: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
}

// API ??????
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T | null;
}

// ????
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
