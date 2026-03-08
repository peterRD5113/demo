# 數據庫設計文檔

## 1. 數據庫概述

### 1.1 數據庫類型

使用 SQLite3 作為本地數據庫，原因：
- 無需獨立服務器，嵌入式數據庫
- 單文件存儲，便於備份和遷移
- 支持事務，保證數據一致性
- 性能優秀，適合桌面應用

### 1.2 數據庫文件位置

- Windows: `%APPDATA%/contract-review/database/app.db`
- macOS: `~/Library/Application Support/contract-review/database/app.db`
- Linux: `~/.config/contract-review/database/app.db`

### 1.3 數據庫配置

```sql
-- 啟用外鍵約束
PRAGMA foreign_keys = ON;

-- 使用 WAL 模式（提高並發性能）
PRAGMA journal_mode = WAL;

-- 設置緩存大小（10MB）
PRAGMA cache_size = -10000;

-- 設置同步模式
PRAGMA synchronous = NORMAL;
```

## 2. 數據表設計

### 2.1 用戶表 (users)

存儲用戶賬號信息。

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'viewer')),
  email TEXT,
  login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

**字段說明**:
- `id`: 用戶唯一標識（UUID）
- `username`: 登錄用戶名（唯一）
- `password_hash`: 密碼哈希（bcrypt）
- `display_name`: 顯示名稱
- `role`: 角色（admin/user/viewer）
- `email`: 郵箱（可選）
- `login_attempts`: 登錄失敗次數
- `locked_until`: 鎖定截止時間
- `last_login_at`: 最後登錄時間

### 2.2 文檔表 (documents)

存儲導入的合同文檔。

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK(file_type IN ('docx', 'pdf', 'txt')),
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
```

**字段說明**:
- `id`: 文檔唯一標識（UUID）
- `name`: 文檔名稱
- `file_path`: 原始文件路徑
- `file_type`: 文件類型（docx/pdf/txt）
- `file_size`: 文件大小（字節）
- `file_hash`: 文件 MD5 哈希（用於緩存）
- `content`: 文檔文本內容
- `metadata`: 元數據（JSON 格式）
- `user_id`: 創建用戶 ID

### 2.3 條款表 (clauses)

存儲文檔中的條款。

```sql
CREATE TABLE clauses (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  level INTEGER NOT NULL,
  parent_id TEXT,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  formatting TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES clauses(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_clauses_document_id ON clauses(document_id);
CREATE INDEX idx_clauses_parent_id ON clauses(parent_id);
CREATE INDEX idx_clauses_number ON clauses(document_id, number);
```

**字段說明**:
- `id`: 條款唯一標識（UUID）
- `document_id`: 所屬文檔 ID
- `number`: 條款編號（如 "1.1.1"）
- `title`: 條款標題
- `content`: 條款內容
- `level`: 條款層級（1-3）
- `parent_id`: 父條款 ID
- `position_start`: 在文檔中的起始位置
- `position_end`: 在文檔中的結束位置
- `formatting`: 格式信息（JSON 格式）

### 2.4 風險規則表 (risk_rules)

存儲風險識別規則。

```sql
CREATE TABLE risk_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
  patterns TEXT NOT NULL,
  suggestions TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_risk_rules_category ON risk_rules(category);
CREATE INDEX idx_risk_rules_enabled ON risk_rules(enabled);
CREATE INDEX idx_risk_rules_risk_level ON risk_rules(risk_level);
```

**字段說明**:
- `id`: 規則唯一標識（UUID）
- `name`: 規則名稱
- `category`: 規則分類（付款、違約、保密等）
- `risk_level`: 風險等級（high/medium/low）
- `patterns`: 匹配模式（JSON 數組）
- `suggestions`: 建議措辭（JSON 數組）
- `description`: 規則描述
- `enabled`: 是否啟用（1/0）

### 2.5 風險匹配表 (risk_matches)

存儲條款與風險規則的匹配結果。

```sql
CREATE TABLE risk_matches (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  score REAL NOT NULL,
  user_adjusted_level TEXT CHECK(user_adjusted_level IN ('high', 'medium', 'low')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES risk_rules(id) ON DELETE CASCADE,
  UNIQUE(clause_id, rule_id)
);

-- 索引
CREATE INDEX idx_risk_matches_clause_id ON risk_matches(clause_id);
CREATE INDEX idx_risk_matches_rule_id ON risk_matches(rule_id);
```

**字段說明**:
- `id`: 匹配記錄唯一標識（UUID）
- `clause_id`: 條款 ID
- `rule_id`: 規則 ID
- `score`: 匹配分數（0-1）
- `user_adjusted_level`: 用戶調整後的風險等級
- `created_at`: 匹配時間

### 2.6 版本表 (versions)

存儲文檔版本歷史。

```sql
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  changes TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(document_id, version_number)
);

-- 索引
CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_versions_created_at ON versions(created_at DESC);
```

**字段說明**:
- `id`: 版本唯一標識（UUID）
- `document_id`: 文檔 ID
- `version_number`: 版本號（自動遞增）
- `user_id`: 審閱人 ID
- `summary`: 變更摘要
- `changes`: 變更列表（JSON 數組）
- `snapshot`: 文檔快照（JSON 格式）
- `created_at`: 創建時間

### 2.7 批註表 (comments)

存儲用戶添加的批註。

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('comment', 'suggestion', 'question')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'rejected')),
  parent_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_comments_clause_id ON comments(clause_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_status ON comments(status);
```

**字段說明**:
- `id`: 批註唯一標識（UUID）
- `clause_id`: 關聯的條款 ID
- `user_id`: 批註人 ID
- `content`: 批註內容
- `type`: 批註類型（comment/suggestion/question）
- `status`: 狀態（pending/resolved/rejected）
- `parent_id`: 父批註 ID（用於回覆）
- `created_at`: 創建時間
- `updated_at`: 更新時間

### 2.8 模板表 (templates)

存儲常用條款模板。

```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT,
  description TEXT,
  risk_note TEXT,
  usage_count INTEGER DEFAULT 0,
  user_id TEXT,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_is_system ON templates(is_system);
```

**字段說明**:
- `id`: 模板唯一標識（UUID）
- `title`: 模板標題
- `category`: 模板分類
- `content`: 模板內容
- `variables`: 變量列表（JSON 數組）
- `description`: 使用說明
- `risk_note`: 風險提示
- `usage_count`: 使用次數
- `user_id`: 創建用戶 ID（系統模板為 NULL）
- `is_system`: 是否系統模板（1/0）

### 2.9 待辦表 (todos)

存儲待確認事項。

```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  assigner_id TEXT NOT NULL,
  assignee_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
  due_date DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (assigner_id) REFERENCES users(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_todos_clause_id ON todos(clause_id);
CREATE INDEX idx_todos_document_id ON todos(document_id);
CREATE INDEX idx_todos_assignee_id ON todos(assignee_id);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
```

**字段說明**:
- `id`: 待辦唯一標識（UUID）
- `clause_id`: 關聯的條款 ID
- `document_id`: 關聯的文檔 ID
- `assigner_id`: 指派人 ID
- `assignee_id`: 被指派人 ID
- `title`: 待辦標題
- `description`: 詳細描述
- `priority`: 優先級（high/medium/low）
- `status`: 狀態（pending/in_progress/completed）
- `due_date`: 截止日期
- `completed_at`: 完成時間

### 2.10 項目表 (projects)

存儲項目信息（用於訪問控制）。

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  document_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  has_password INTEGER DEFAULT 0,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  UNIQUE(document_id)
);

-- 索引
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_document_id ON projects(document_id);
```

**字段說明**:
- `id`: 項目唯一標識（UUID）
- `name`: 項目名稱
- `document_id`: 關聯的文檔 ID
- `owner_id`: 項目所有者 ID
- `has_password`: 是否設置密碼（1/0）
- `password_hash`: 訪問密碼哈希

### 2.11 項目成員表 (project_members)

存儲項目成員信息。

```sql
CREATE TABLE project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

-- 索引
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
```

**字段說明**:
- `id`: 記錄唯一標識（UUID）
- `project_id`: 項目 ID
- `user_id`: 用戶 ID
- `role`: 角色（owner/editor/viewer）
- `added_at`: 添加時間

### 2.12 設置表 (settings)

存儲用戶設置。

```sql
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, key)
);

-- 索引
CREATE INDEX idx_settings_user_id ON settings(user_id);
CREATE INDEX idx_settings_key ON settings(key);
```

**字段說明**:
- `id`: 設置唯一標識（UUID）
- `user_id`: 用戶 ID（NULL 表示全局設置）
- `key`: 設置鍵
- `value`: 設置值（JSON 格式）

### 2.13 日誌表 (logs)

存儲操作日誌。

```sql
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_action ON logs(action);
CREATE INDEX idx_logs_resource_type ON logs(resource_type);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
```

**字段說明**:
- `id`: 日誌唯一標識（UUID）
- `user_id`: 操作用戶 ID
- `action`: 操作類型（login/logout/create/update/delete等）
- `resource_type`: 資源類型（document/clause/comment等）
- `resource_id`: 資源 ID
- `details`: 詳細信息（JSON 格式）
- `ip_address`: IP 地址
- `created_at`: 操作時間

### 2.14 緩存表 (cache)

存儲解析結果緩存。

```sql
CREATE TABLE cache (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_cache_key ON cache(key);
CREATE INDEX idx_cache_expires_at ON cache(expires_at);
```

**字段說明**:
- `id`: 緩存唯一標識（UUID）
- `key`: 緩存鍵（如文件 MD5）
- `value`: 緩存值（JSON 格式）
- `expires_at`: 過期時間
- `created_at`: 創建時間

## 3. 數據關係圖

```
users (用戶)
  ├─→ documents (文檔)
  │     ├─→ clauses (條款)
  │     │     ├─→ risk_matches (風險匹配)
  │     │     │     └─→ risk_rules (風險規則)
  │     │     ├─→ comments (批註)
  │     │     └─→ todos (待辦)
  │     ├─→ versions (版本)
  │     └─→ projects (項目)
  │           └─→ project_members (項目成員)
  ├─→ templates (模板)
  ├─→ settings (設置)
  └─→ logs (日誌)
```

## 4. 初始化數據

### 4.1 默認管理員賬號

```sql
INSERT INTO users (id, username, password_hash, display_name, role)
VALUES (
  'admin-uuid',
  'admin',
  '$2b$10$...', -- bcrypt hash of 'Admin@123'
  '系統管理員',
  'admin'
);
```

### 4.2 默認風險規則

```sql
-- 付款條件風險
INSERT INTO risk_rules (id, name, category, risk_level, patterns, suggestions, description, enabled)
VALUES (
  'rule-payment-1',
  '無上限違約金',
  '付款條件',
  'high',
  '[{"type":"keyword","value":"無上限","weight":0.8},{"type":"keyword","value":"全部損失","weight":0.7}]',
  '["建議設置違約金上限為合同總額的30%","建議明確違約金計算方式"]',
  '合同中約定無上限違約金，可能導致過高的賠償責任',
  1
);

-- 更多默認規則...
```

### 4.3 默認模板

```sql
-- 分期付款條款模板
INSERT INTO templates (id, title, category, content, variables, description, is_system)
VALUES (
  'template-payment-1',
  '分期付款條款',
  '付款條款',
  '甲方應按以下方式向乙方支付款項：\n1. 合同簽訂後{{天數1}}日內支付{{比例1}}%\n2. {{里程碑}}後{{天數2}}日內支付{{比例2}}%\n3. 驗收合格後{{天數3}}日內支付{{比例3}}%',
  '[{"name":"天數1","placeholder":"{{天數1}}","type":"number","required":true},{"name":"比例1","placeholder":"{{比例1}}","type":"number","required":true}]',
  '適用於需要分期支付的合同',
  1
);

-- 更多默認模板...
```

## 5. 數據維護

### 5.1 定期清理

```sql
-- 清理過期緩存
DELETE FROM cache WHERE expires_at < datetime('now');

-- 清理 30 天前的日誌
DELETE FROM logs WHERE created_at < datetime('now', '-30 days');
```

### 5.2 數據備份

建議定期備份數據庫文件：
- 每日自動備份
- 保留最近 7 天的備份
- 重要操作前手動備份

### 5.3 數據遷移

版本升級時的數據遷移腳本：

```sql
-- 示例：添加新字段
ALTER TABLE documents ADD COLUMN new_field TEXT;

-- 示例：創建新表
CREATE TABLE new_table (...);

-- 示例：遷移數據
INSERT INTO new_table SELECT ... FROM old_table;
```

## 6. 性能優化

### 6.1 索引優化

- 為外鍵字段創建索引
- 為常用查詢字段創建索引
- 為排序字段創建索引
- 定期分析索引使用情況

### 6.2 查詢優化

- 使用 EXPLAIN QUERY PLAN 分析查詢
- 避免 SELECT *，只查詢需要的字段
- 使用 LIMIT 限制結果數量
- 使用事務批量操作

### 6.3 數據庫維護

```sql
-- 分析數據庫
ANALYZE;

-- 優化數據庫
VACUUM;

-- 重建索引
REINDEX;
```

## 7. 安全考慮

### 7.1 SQL 注入防護

- 使用參數化查詢
- 不直接拼接 SQL 語句
- 驗證用戶輸入

### 7.2 數據加密

- 密碼使用 bcrypt 加密
- 敏感信息使用 AES 加密
- 數據庫文件可選加密（SQLCipher）

### 7.3 訪問控制

- 基於角色的權限控制
- 項目級別的訪問密碼
- 操作日誌記錄

## 8. 數據庫版本管理

### 8.1 版本號

在 settings 表中存儲數據庫版本號：

```sql
INSERT INTO settings (id, user_id, key, value)
VALUES ('db-version', NULL, 'database_version', '"1.0.0"');
```

### 8.2 升級腳本

每個版本的升級腳本：
- `migrations/v1.0.0_to_v1.1.0.sql`
- `migrations/v1.1.0_to_v1.2.0.sql`

### 8.3 自動升級

應用啟動時檢查數據庫版本，自動執行升級腳本。

## 9. 測試數據

開發和測試環境使用的測試數據：

```sql
-- 測試用戶
INSERT INTO users (id, username, password_hash, display_name, role)
VALUES 
  ('user-1', 'user1', '$2b$10$...', '測試用戶1', 'user'),
  ('user-2', 'test', '$2b$10$...', '測試用戶', 'viewer');

-- 測試文檔
INSERT INTO documents (id, name, file_path, file_type, file_size, file_hash, content, user_id)
VALUES (
  'doc-1',
  '測試合同.docx',
  '/path/to/test.docx',
  'docx',
  102400,
  'abc123...',
  '測試合同內容...',
  'admin-uuid'
);
```

## 10. 監控與統計

### 10.1 統計查詢

```sql
-- 用戶統計
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- 文檔統計
SELECT file_type, COUNT(*) as count FROM documents GROUP BY file_type;

-- 風險統計
SELECT r.risk_level, COUNT(*) as count
FROM risk_matches rm
JOIN risk_rules r ON rm.rule_id = r.id
GROUP BY r.risk_level;

-- 活躍用戶統計
SELECT user_id, COUNT(*) as action_count
FROM logs
WHERE created_at > datetime('now', '-7 days')
GROUP BY user_id
ORDER BY action_count DESC
LIMIT 10;
```

### 10.2 性能監控

```sql
-- 慢查詢日誌
-- 記錄執行時間超過 1 秒的查詢

-- 數據庫大小
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

-- 表大小統計
SELECT name, SUM(pgsize) as size
FROM dbstat
GROUP BY name
ORDER BY size DESC;
```
