# 安全設計文檔

## 1. 安全概述

### 1.1 安全目標

- **數據安全**: 保護用戶數據不被未授權訪問
- **身份認證**: 確保用戶身份真實可靠
- **訪問控制**: 基於角色的權限管理
- **數據加密**: 敏感信息加密存儲
- **審計追蹤**: 記錄所有關鍵操作

### 1.2 威脅模型

| 威脅類型 | 風險等級 | 防護措施 |
|---------|---------|---------|
| 未授權訪問 | 高 | 登錄認證、會話管理 |
| 暴力破解 | 高 | 登錄失敗鎖定、密碼強度要求 |
| 數據洩露 | 高 | 數據加密、訪問控制 |
| SQL 注入 | 中 | 參數化查詢、輸入驗證 |
| XSS 攻擊 | 中 | 輸入過濾、輸出轉義 |
| 本地文件訪問 | 中 | 路徑驗證、權限檢查 |

## 2. 身份認證

### 2.1 密碼策略

**密碼強度要求**:
- 最小長度: 8 個字符
- 必須包含: 大寫字母、小寫字母、數字
- 可選包含: 特殊字符
- 禁止使用: 常見弱密碼（123456、password 等）

**密碼驗證**:
```typescript
function validatePassword(password: string): boolean {
  // 長度檢查
  if (password.length < 8) return false;
  
  // 複雜度檢查
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
}
```

**密碼加密**:
```typescript
import bcrypt from 'bcrypt';

// 加密密碼
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// 驗證密碼
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2.2 登錄流程

```typescript
async function login(username: string, password: string): Promise<User> {
  // 1. 查詢用戶
  const user = await userDAO.findByUsername(username);
  if (!user) {
    throw new Error('用戶名或密碼錯誤');
  }
  
  // 2. 檢查鎖定狀態
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new Error(`賬號已鎖定，請 ${remainingMinutes} 分鐘後再試`);
  }
  
  // 3. 驗證密碼
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    // 增加失敗次數
    await userDAO.incrementLoginAttempts(user.id);
    
    // 檢查是否需要鎖定
    if (user.loginAttempts + 1 >= 5) {
      const lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 分鐘
      await userDAO.lockUser(user.id, lockedUntil);
      throw new Error('登錄失敗次數過多，賬號已鎖定 10 分鐘');
    }
    
    throw new Error('用戶名或密碼錯誤');
  }
  
  // 4. 登錄成功
  await userDAO.resetLoginAttempts(user.id);
  await userDAO.updateLastLogin(user.id);
  
  // 5. 記錄日誌
  await logService.log({
    userId: user.id,
    action: 'login',
    resourceType: 'user',
    resourceId: user.id
  });
  
  return user;
}
```

### 2.3 會話管理

**會話存儲**:
- 使用內存存儲會話信息
- 不持久化到數據庫
- 應用關閉時自動清除

**會話超時**:
- 默認超時時間: 8 小時
- 無操作超時: 30 分鐘
- 超時後自動登出

```typescript
class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 小時
  private readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 分鐘
  
  createSession(user: User): string {
    const sessionId = crypto.randomUUID();
    const session: Session = {
      id: sessionId,
      userId: user.id,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT)
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  
  validateSession(sessionId: string): User | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const now = Date.now();
    
    // 檢查會話是否過期
    if (session.expiresAt.getTime() < now) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    // 檢查是否超過無操作時間
    if (now - session.lastActivityAt.getTime() > this.IDLE_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    // 更新最後活動時間
    session.lastActivityAt = new Date();
    
    return userDAO.findById(session.userId);
  }
  
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
```

## 3. 訪問控制

### 3.1 角色權限

| 角色 | 權限 |
|-----|------|
| **Admin** | 完整權限：管理用戶、管理規則庫、審閱文檔、導出報告 |
| **User** | 審閱文檔、導出報告、管理自己的文檔 |
| **Viewer** | 僅查看文檔和報告 |

### 3.2 權限檢查

```typescript
// 權限裝飾器
function requireRole(role: UserRole) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = getCurrentUser();
      
      if (!user) {
        throw new Error('未登錄');
      }
      
      if (user.role !== role && user.role !== 'admin') {
        throw new Error('權限不足');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// 使用示例
class UserService {
  @requireRole('admin')
  async deleteUser(userId: string): Promise<void> {
    // 只有管理員可以刪除用戶
    await userDAO.delete(userId);
  }
}
```

### 3.3 資源訪問控制

```typescript
// 檢查文檔訪問權限
async function checkDocumentAccess(
  documentId: string,
  userId: string,
  requiredPermission: 'read' | 'write'
): Promise<boolean> {
  const document = await documentDAO.findById(documentId);
  if (!document) return false;
  
  const user = await userDAO.findById(userId);
  if (!user) return false;
  
  // 管理員有所有權限
  if (user.role === 'admin') return true;
  
  // 文檔所有者有所有權限
  if (document.userId === userId) return true;
  
  // 檢查項目成員權限
  const project = await projectDAO.findByDocumentId(documentId);
  if (project) {
    const member = await projectMemberDAO.findByProjectAndUser(project.id, userId);
    if (member) {
      if (requiredPermission === 'read') {
        return true; // 所有成員都可以讀
      }
      if (requiredPermission === 'write') {
        return member.role === 'owner' || member.role === 'editor';
      }
    }
  }
  
  return false;
}
```

### 3.4 項目訪問密碼

```typescript
// 驗證項目訪問密碼
async function verifyProjectPassword(
  projectId: string,
  password: string
): Promise<boolean> {
  const project = await projectDAO.findById(projectId);
  if (!project) return false;
  
  if (!project.hasPassword) return true;
  
  return bcrypt.compare(password, project.passwordHash);
}

// 設置項目訪問密碼
async function setProjectPassword(
  projectId: string,
  password: string
): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  await projectDAO.update(projectId, {
    hasPassword: true,
    passwordHash
  });
}
```

## 4. 數據加密

### 4.1 敏感信息脫敏

```typescript
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

class EncryptionService {
  // 加密
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  }
  
  // 解密
  decrypt(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  // 脫敏
  mask(text: string, rule: MaskingRule): string {
    const regex = new RegExp(rule.pattern);
    
    if (rule.maskType === 'partial') {
      // 部分脫敏
      const match = text.match(regex);
      if (!match) return text;
      
      const value = match[0];
      const keepPrefix = rule.keepPrefix || 0;
      const keepSuffix = rule.keepSuffix || 0;
      const maskLength = value.length - keepPrefix - keepSuffix;
      
      if (maskLength <= 0) return value;
      
      const masked = 
        value.substring(0, keepPrefix) +
        rule.maskChar.repeat(maskLength) +
        value.substring(value.length - keepSuffix);
      
      return text.replace(regex, masked);
    } else if (rule.maskType === 'full') {
      // 完全脫敏
      return text.replace(regex, rule.maskChar.repeat(8));
    } else if (rule.maskType === 'replace') {
      // 替換
      return text.replace(regex, rule.replacement || '***');
    }
    
    return text;
  }
}
```

### 4.2 內置脫敏規則

```typescript
const BUILTIN_MASKING_RULES: MaskingRule[] = [
  {
    id: 'id-card',
    name: '身份證號',
    pattern: '\\d{17}[\\dXx]',
    maskType: 'partial',
    maskChar: '*',
    keepPrefix: 3,
    keepSuffix: 4
  },
  {
    id: 'bank-account',
    name: '銀行賬號',
    pattern: '\\d{16,19}',
    maskType: 'partial',
    maskChar: '*',
    keepPrefix: 0,
    keepSuffix: 4
  },
  {
    id: 'phone',
    name: '手機號',
    pattern: '1[3-9]\\d{9}',
    maskType: 'partial',
    maskChar: '*',
    keepPrefix: 3,
    keepSuffix: 4
  },
  {
    id: 'amount',
    name: '金額',
    pattern: '\\d+(\\.\\d+)?元',
    maskType: 'replace',
    replacement: '***元'
  }
];
```

## 5. 輸入驗證

### 5.1 參數驗證

```typescript
// 驗證文檔名稱
function validateDocumentName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 255) return false;
  
  // 禁止特殊字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) return false;
  
  return true;
}

// 驗證文件路徑
function validateFilePath(path: string): boolean {
  // 禁止路徑遍歷
  if (path.includes('..')) return false;
  
  // 禁止絕對路徑
  if (path.startsWith('/') || /^[A-Z]:/i.test(path)) return false;
  
  return true;
}

// 驗證 JSON 輸入
function validateJSON(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}
```

### 5.2 SQL 注入防護

```typescript
// ✅ 正確：使用參數化查詢
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
const user = stmt.get(username);

// ❌ 錯誤：字符串拼接
const query = `SELECT * FROM users WHERE username = '${username}'`;
const user = db.exec(query);
```

### 5.3 XSS 防護

```typescript
// 輸出轉義
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// React 自動轉義
// 使用 dangerouslySetInnerHTML 時需要手動轉義
<div dangerouslySetInnerHTML={{ __html: escapeHtml(content) }} />
```

## 6. 文件安全

### 6.1 文件上傳驗證

```typescript
async function validateUploadedFile(file: File): Promise<void> {
  // 檢查文件大小（最大 50MB）
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('文件大小超過限制（50MB）');
  }
  
  // 檢查文件類型
  const allowedTypes = ['docx', 'pdf', 'txt'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !allowedTypes.includes(ext)) {
    throw new Error('不支持的文件類型');
  }
  
  // 檢查 MIME 類型
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain'
  ];
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('文件類型不匹配');
  }
  
  // 檢查文件內容（魔術數字）
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (ext === 'pdf') {
    // PDF 文件應以 %PDF 開頭
    const header = String.fromCharCode(...bytes.slice(0, 4));
    if (header !== '%PDF') {
      throw new Error('無效的 PDF 文件');
    }
  }
}
```

### 6.2 文件路徑安全

```typescript
import path from 'path';

// 安全的文件路徑處理
function getSafeFilePath(userPath: string, baseDir: string): string {
  // 規範化路徑
  const normalized = path.normalize(userPath);
  
  // 解析為絕對路徑
  const absolute = path.resolve(baseDir, normalized);
  
  // 檢查是否在允許的目錄內
  if (!absolute.startsWith(baseDir)) {
    throw new Error('非法的文件路徑');
  }
  
  return absolute;
}
```

## 7. 審計日誌

### 7.1 日誌記錄

```typescript
interface LogEntry {
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  timestamp: Date;
}

class LogService {
  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    await logDAO.create({
      ...entry,
      timestamp: new Date()
    });
  }
  
  // 記錄登錄
  async logLogin(userId: string, success: boolean): Promise<void> {
    await this.log({
      userId,
      action: success ? 'login_success' : 'login_failed',
      resourceType: 'user',
      resourceId: userId,
      details: { success },
      ipAddress: null
    });
  }
  
  // 記錄文檔操作
  async logDocumentAction(
    userId: string,
    action: 'create' | 'update' | 'delete',
    documentId: string
  ): Promise<void> {
    await this.log({
      userId,
      action: `document_${action}`,
      resourceType: 'document',
      resourceId: documentId,
      details: {},
      ipAddress: null
    });
  }
}
```

### 7.2 日誌查詢

```typescript
// 查詢用戶操作日誌
async function getUserLogs(
  userId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    limit?: number;
  }
): Promise<LogEntry[]> {
  let query = 'SELECT * FROM logs WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (options.startDate) {
    query += ' AND created_at >= ?';
    params.push(options.startDate);
  }
  
  if (options.endDate) {
    query += ' AND created_at <= ?';
    params.push(options.endDate);
  }
  
  if (options.action) {
    query += ' AND action = ?';
    params.push(options.action);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  
  return db.prepare(query).all(params);
}
```

## 8. 安全配置

### 8.1 環境變量

```bash
# .env.example
# 加密密鑰（生產環境必須修改）
ENCRYPTION_KEY=your-secret-key-here

# 會話超時時間（小時）
SESSION_TIMEOUT=8

# 無操作超時時間（分鐘）
IDLE_TIMEOUT=30

# 登錄失敗鎖定次數
MAX_LOGIN_ATTEMPTS=5

# 鎖定時長（分鐘）
LOCK_DURATION=10

# 密碼最小長度
MIN_PASSWORD_LENGTH=8
```

### 8.2 安全頭部

```typescript
// Electron 安全配置
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // 禁用 Node.js 集成
    contextIsolation: true,        // 啟用上下文隔離
    sandbox: true,                 // 啟用沙箱
    webSecurity: true,             // 啟用 Web 安全
    allowRunningInsecureContent: false,
    preload: path.join(__dirname, 'preload.js')
  }
});

// CSP 策略
mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
      ]
    }
  });
});
```

## 9. 安全測試

### 9.1 測試清單

- [ ] 密碼強度驗證
- [ ] 登錄失敗鎖定
- [ ] 會話超時
- [ ] 權限檢查
- [ ] SQL 注入防護
- [ ] XSS 防護
- [ ] 文件上傳驗證
- [ ] 路徑遍歷防護
- [ ] 數據加密
- [ ] 審計日誌

### 9.2 滲透測試

定期進行安全測試：
- 暴力破解測試
- SQL 注入測試
- XSS 攻擊測試
- 文件上傳漏洞測試
- 權限繞過測試

## 10. 安全更新

### 10.1 依賴更新

定期更新依賴庫：
```bash
npm audit
npm audit fix
```

### 10.2 安全公告

關注安全公告：
- Electron 安全公告
- Node.js 安全公告
- npm 包安全公告

### 10.3 應急響應

發現安全漏洞時：
1. 評估影響範圍
2. 制定修復方案
3. 發布安全更新
4. 通知用戶升級
5. 記錄事件報告

## 11. 安全最佳實踐

### 11.1 開發階段

- 使用最新版本的依賴庫
- 啟用所有安全特性
- 進行代碼審查
- 使用靜態分析工具

### 11.2 部署階段

- 修改默認密碼和密鑰
- 啟用所有安全配置
- 定期備份數據
- 監控異常行為

### 11.3 運維階段

- 定期更新應用
- 定期審查日誌
- 定期安全測試
- 定期備份驗證

## 12. 合規性

### 12.1 數據保護

- 用戶數據本地存儲
- 敏感信息加密
- 支持數據導出
- 支持數據刪除

### 12.2 隱私保護

- 不收集用戶隱私信息
- 不上傳用戶數據
- 不使用第三方追蹤
- 透明的隱私政策

### 12.3 審計要求

- 完整的操作日誌
- 可追溯的變更記錄
- 定期的安全審計
- 合規性報告
