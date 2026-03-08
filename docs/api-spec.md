# API 規格說明

## 1. 概述

本文檔描述主進程與渲染進程之間的 IPC 通信接口規範。

## 2. 通用規範

### 2.1 請求格式

所有 IPC 調用使用 `ipcRenderer.invoke()` 方法：

```typescript
const result = await window.electronAPI.moduleName.methodName(params);
```

### 2.2 響應格式

成功響應：
```typescript
{
  success: true,
  data: any
}
```

錯誤響應：
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 2.3 錯誤碼

| 錯誤碼 | 說明 |
|--------|------|
| AUTH_FAILED | 認證失敗 |
| PERMISSION_DENIED | 權限不足 |
| NOT_FOUND | 資源不存在 |
| VALIDATION_ERROR | 參數驗證失敗 |
| DATABASE_ERROR | 數據庫錯誤 |
| FILE_ERROR | 文件操作錯誤 |
| PARSE_ERROR | 文檔解析錯誤 |
| EXPORT_ERROR | 導出錯誤 |

## 3. 文檔管理 API

### 3.1 導入文檔

```typescript
document.import(filePath: string): Promise<Document>
```

**參數**:
- `filePath`: 文件路徑

**返回**: Document 對象

**示例**:
```typescript
const doc = await window.electronAPI.document.import('/path/to/contract.docx');
```

### 3.2 獲取文檔

```typescript
document.get(id: string): Promise<Document>
```

### 3.3 獲取文檔列表

```typescript
document.list(options?: ListOptions): Promise<Document[]>
```

**參數**:
```typescript
interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
```

### 3.4 更新文檔

```typescript
document.update(id: string, data: Partial<Document>): Promise<void>
```

### 3.5 刪除文檔

```typescript
document.delete(id: string): Promise<void>
```

## 4. 條款管理 API

### 4.1 獲取條款列表

```typescript
clause.list(documentId: string): Promise<Clause[]>
```

### 4.2 獲取單個條款

```typescript
clause.get(id: string): Promise<Clause>
```

### 4.3 更新條款

```typescript
clause.update(id: string, data: Partial<Clause>): Promise<void>
```

### 4.4 添加條款

```typescript
clause.create(data: CreateClauseData): Promise<Clause>
```

### 4.5 刪除條款

```typescript
clause.delete(id: string): Promise<void>
```

## 5. 風險規則 API

### 5.1 獲取規則列表

```typescript
rule.list(options?: RuleListOptions): Promise<RiskRule[]>
```

**參數**:
```typescript
interface RuleListOptions {
  category?: string;
  enabled?: boolean;
  riskLevel?: 'high' | 'medium' | 'low';
}
```

### 5.2 匹配風險

```typescript
rule.match(clauseId: string): Promise<RiskMatch[]>
```

**返回**:
```typescript
interface RiskMatch {
  ruleId: string;
  ruleName: string;
  riskLevel: 'high' | 'medium' | 'low';
  score: number;
  suggestions: string[];
}
```

### 5.3 創建規則

```typescript
rule.create(data: CreateRuleData): Promise<RiskRule>
```

### 5.4 更新規則

```typescript
rule.update(id: string, data: Partial<RiskRule>): Promise<void>
```

### 5.5 刪除規則

```typescript
rule.delete(id: string): Promise<void>
```

## 6. 版本管理 API

### 6.1 保存版本

```typescript
version.save(documentId: string, summary: string): Promise<DocumentVersion>
```

### 6.2 獲取版本列表

```typescript
version.list(documentId: string): Promise<DocumentVersion[]>
```

### 6.3 獲取版本詳情

```typescript
version.get(versionId: string): Promise<DocumentVersion>
```

### 6.4 版本對比

```typescript
version.compare(versionId1: string, versionId2: string): Promise<VersionDiff>
```

**返回**:
```typescript
interface VersionDiff {
  changes: Change[];
  stats: {
    added: number;
    modified: number;
    deleted: number;
  };
}
```

### 6.5 回滾版本

```typescript
version.rollback(versionId: string): Promise<void>
```

## 7. 批註管理 API

### 7.1 添加批註

```typescript
comment.create(data: CreateCommentData): Promise<Comment>
```

**參數**:
```typescript
interface CreateCommentData {
  clauseId: string;
  content: string;
  type: 'comment' | 'suggestion' | 'question';
}
```

### 7.2 獲取批註列表

```typescript
comment.list(clauseId: string): Promise<Comment[]>
```

### 7.3 更新批註

```typescript
comment.update(id: string, data: Partial<Comment>): Promise<void>
```

### 7.4 刪除批註

```typescript
comment.delete(id: string): Promise<void>
```

### 7.5 回覆批註

```typescript
comment.reply(commentId: string, content: string): Promise<CommentReply>
```

## 8. 模板管理 API

### 8.1 獲取模板列表

```typescript
template.list(category?: string): Promise<ClauseTemplate[]>
```

### 8.2 獲取模板詳情

```typescript
template.get(id: string): Promise<ClauseTemplate>
```

### 8.3 創建模板

```typescript
template.create(data: CreateTemplateData): Promise<ClauseTemplate>
```

### 8.4 更新模板

```typescript
template.update(id: string, data: Partial<ClauseTemplate>): Promise<void>
```

### 8.5 刪除模板

```typescript
template.delete(id: string): Promise<void>
```

## 9. 待辦管理 API

### 9.1 創建待辦

```typescript
todo.create(data: CreateTodoData): Promise<TodoItem>
```

### 9.2 獲取待辦列表

```typescript
todo.list(options?: TodoListOptions): Promise<TodoItem[]>
```

**參數**:
```typescript
interface TodoListOptions {
  documentId?: string;
  assigneeId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}
```

### 9.3 更新待辦

```typescript
todo.update(id: string, data: Partial<TodoItem>): Promise<void>
```

### 9.4 完成待辦

```typescript
todo.complete(id: string): Promise<void>
```

### 9.5 刪除待辦

```typescript
todo.delete(id: string): Promise<void>
```

## 10. 導出 API

### 10.1 導出 PDF

```typescript
export.pdf(documentId: string, options: ExportPDFOptions): Promise<string>
```

**參數**:
```typescript
interface ExportPDFOptions {
  includeComments: boolean;
  includeRiskAnnotations: boolean;
  savePath?: string;
}
```

**返回**: 導出文件路徑

### 10.2 導出 DOCX

```typescript
export.docx(documentId: string, options: ExportDOCXOptions): Promise<string>
```

**參數**:
```typescript
interface ExportDOCXOptions {
  trackChanges: boolean;
  includeComments: boolean;
  savePath?: string;
}
```

### 10.3 生成審閱報告

```typescript
export.report(documentId: string, options?: ReportOptions): Promise<string>
```

**參數**:
```typescript
interface ReportOptions {
  format: 'pdf' | 'docx';
  includeRiskSummary: boolean;
  includeTodoList: boolean;
  includeSuggestions: boolean;
  savePath?: string;
}
```

## 11. 用戶認證 API

### 11.1 登錄

```typescript
auth.login(username: string, password: string): Promise<User>
```

**返回**:
```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
  email?: string;
}
```

### 11.2 登出

```typescript
auth.logout(): Promise<void>
```

### 11.3 獲取當前用戶

```typescript
auth.getCurrentUser(): Promise<User | null>
```

### 11.4 修改密碼

```typescript
auth.changePassword(oldPassword: string, newPassword: string): Promise<void>
```

## 12. 用戶管理 API

### 12.1 創建用戶

```typescript
user.create(data: CreateUserData): Promise<User>
```

**參數**:
```typescript
interface CreateUserData {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'user' | 'viewer';
  email?: string;
}
```

### 12.2 獲取用戶列表

```typescript
user.list(): Promise<User[]>
```

### 12.3 更新用戶

```typescript
user.update(id: string, data: Partial<User>): Promise<void>
```

### 12.4 刪除用戶

```typescript
user.delete(id: string): Promise<void>
```

### 12.5 重置密碼

```typescript
user.resetPassword(id: string, newPassword: string): Promise<void>
```

### 12.6 解鎖用戶

```typescript
user.unlock(id: string): Promise<void>
```

## 13. 設置 API

### 13.1 獲取設置

```typescript
settings.get(key: string): Promise<any>
```

### 13.2 保存設置

```typescript
settings.set(key: string, value: any): Promise<void>
```

### 13.3 獲取所有設置

```typescript
settings.getAll(): Promise<Record<string, any>>
```

### 13.4 重置設置

```typescript
settings.reset(): Promise<void>
```

## 14. 文件操作 API

### 14.1 選擇文件

```typescript
file.selectFile(options?: FileSelectOptions): Promise<string | null>
```

**參數**:
```typescript
interface FileSelectOptions {
  filters?: { name: string; extensions: string[] }[];
  defaultPath?: string;
}
```

### 14.2 選擇保存路徑

```typescript
file.selectSavePath(options?: SavePathOptions): Promise<string | null>
```

### 14.3 打開文件夾

```typescript
file.openFolder(path: string): Promise<void>
```

### 14.4 打開文件

```typescript
file.openFile(path: string): Promise<void>
```

## 15. 系統 API

### 15.1 獲取應用信息

```typescript
system.getAppInfo(): Promise<AppInfo>
```

**返回**:
```typescript
interface AppInfo {
  name: string;
  version: string;
  platform: string;
  arch: string;
}
```

### 15.2 清理緩存

```typescript
system.clearCache(): Promise<void>
```

### 15.3 獲取日誌路徑

```typescript
system.getLogPath(): Promise<string>
```

### 15.4 檢查更新

```typescript
system.checkUpdate(): Promise<UpdateInfo | null>
```

## 16. 數據類型定義

### 16.1 Document

```typescript
interface Document {
  id: string;
  name: string;
  filePath: string;
  fileType: 'docx' | 'pdf' | 'txt';
  content: string;
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface DocumentMetadata {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  pageCount?: number;
  wordCount?: number;
}
```

### 16.2 Clause

```typescript
interface Clause {
  id: string;
  documentId: string;
  number: string;
  title: string;
  content: string;
  level: number;
  parent: string | null;
  children: string[];
  position: {
    start: number;
    end: number;
  };
  formatting: FormatInfo;
}

interface FormatInfo {
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}
```

### 16.3 RiskRule

```typescript
interface RiskRule {
  id: string;
  name: string;
  category: string;
  riskLevel: 'high' | 'medium' | 'low';
  patterns: Pattern[];
  suggestions: string[];
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Pattern {
  type: 'keyword' | 'regex' | 'semantic';
  value: string;
  weight: number;
}
```

### 16.4 DocumentVersion

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  userId: string;
  userName: string;
  summary: string;
  changes: Change[];
  snapshot: string;
  createdAt: Date;
}

interface Change {
  type: 'add' | 'modify' | 'delete';
  clauseId: string;
  clauseNumber: string;
  before?: string;
  after?: string;
}
```

### 16.5 Comment

```typescript
interface Comment {
  id: string;
  clauseId: string;
  userId: string;
  userName: string;
  content: string;
  type: 'comment' | 'suggestion' | 'question';
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  replies: CommentReply[];
}

interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}
```

### 16.6 ClauseTemplate

```typescript
interface ClauseTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: Variable[];
  description: string;
  riskNote: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Variable {
  name: string;
  placeholder: string;
  type: 'text' | 'number' | 'date';
  required: boolean;
  defaultValue?: string;
}
```

### 16.7 TodoItem

```typescript
interface TodoItem {
  id: string;
  clauseId: string;
  documentId: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  assigneeName: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}
```

## 17. 事件通知

主進程可以向渲染進程發送事件通知：

### 17.1 文檔事件

```typescript
// 文檔已更新
'document:updated' -> { documentId: string }

// 文檔已刪除
'document:deleted' -> { documentId: string }
```

### 17.2 版本事件

```typescript
// 新版本已創建
'version:created' -> { versionId: string, documentId: string }
```

### 17.3 批註事件

```typescript
// 新批註已添加
'comment:created' -> { commentId: string, clauseId: string }

// 批註已更新
'comment:updated' -> { commentId: string }
```

### 17.4 待辦事件

```typescript
// 新待辦已創建
'todo:created' -> { todoId: string }

// 待辦已完成
'todo:completed' -> { todoId: string }
```

## 18. 使用示例

### 18.1 完整的文檔導入流程

```typescript
// 1. 選擇文件
const filePath = await window.electronAPI.file.selectFile({
  filters: [
    { name: '合同文檔', extensions: ['docx', 'pdf', 'txt'] }
  ]
});

if (!filePath) return;

// 2. 導入文檔
const document = await window.electronAPI.document.import(filePath);

// 3. 獲取條款列表
const clauses = await window.electronAPI.clause.list(document.id);

// 4. 匹配風險
for (const clause of clauses) {
  const risks = await window.electronAPI.rule.match(clause.id);
  console.log(`條款 ${clause.number} 的風險:`, risks);
}
```

### 18.2 完整的審閱流程

```typescript
// 1. 添加批註
await window.electronAPI.comment.create({
  clauseId: 'clause-123',
  content: '此條款需要修改付款期限',
  type: 'suggestion'
});

// 2. 創建待辦
await window.electronAPI.todo.create({
  clauseId: 'clause-123',
  assigneeId: 'user-456',
  title: '確認付款期限',
  description: '請與財務部門確認合理的付款期限',
  priority: 'high'
});

// 3. 保存版本
await window.electronAPI.version.save(
  documentId,
  '修改了付款條款，添加了分期付款選項'
);
```

### 18.3 完整的導出流程

```typescript
// 1. 選擇保存路徑
const savePath = await window.electronAPI.file.selectSavePath({
  defaultPath: '審閱報告.pdf',
  filters: [{ name: 'PDF', extensions: ['pdf'] }]
});

if (!savePath) return;

// 2. 生成報告
const reportPath = await window.electronAPI.export.report(documentId, {
  format: 'pdf',
  includeRiskSummary: true,
  includeTodoList: true,
  includeSuggestions: true,
  savePath
});

// 3. 打開報告
await window.electronAPI.file.openFile(reportPath);
```
