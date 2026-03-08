# 架構設計文檔

## 1. 整體架構

### 1.1 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        用戶界面層                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 文檔視圖  │  │ 審閱視圖  │  │ 版本視圖  │  │ 設置視圖  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│                      Electron 主進程                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    服務層                              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │文檔服務 │ │規則服務│ │版本服務│ │用戶服務│       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    數據訪問層                          │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │文檔DAO │ │規則DAO │ │版本DAO │ │用戶DAO │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      SQLite 數據庫                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │文檔表 │ │條款表│ │規則表│ │版本表│ │用戶表│           │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技術棧

#### 前端技術棧
- **框架**: React 18.2.0
- **語言**: TypeScript 5.3.0
- **UI 組件**: Ant Design 5.12.0
- **狀態管理**: Zustand 4.4.0
- **路由**: React Router 6.20.0
- **樣式**: CSS Modules + Less
- **圖標**: @ant-design/icons

#### 後端技術棧
- **運行時**: Electron 28.0.0
- **語言**: TypeScript 5.3.0
- **數據庫**: better-sqlite3 9.2.0
- **文檔處理**:
  - mammoth 1.6.0 (docx 解析)
  - pdf-lib 1.17.1 (PDF 生成)
  - pdfjs-dist 3.11.174 (PDF 解析)
  - docx 8.5.0 (docx 生成)
- **工具庫**:
  - diff-match-patch 1.0.5 (文本對比)
  - crypto-js 4.2.0 (加密)
  - bcrypt 5.1.1 (密碼加密)
  - dayjs 1.11.10 (日期處理)

#### 構建工具
- **構建**: Vite 5.0.0
- **打包**: electron-builder 24.9.0
- **代碼檢查**: ESLint 8.55.0
- **代碼格式化**: Prettier 3.1.0
- **測試**: Vitest 1.0.0

## 2. 分層架構

### 2.1 表現層 (Presentation Layer)

**職責**: 用戶界面展示和交互

**主要組件**:

```typescript
// 頁面組件
src/renderer/pages/
├── Login/              # 登錄頁
├── Dashboard/          # 儀表板
├── DocumentEditor/     # 文檔編輯器
├── VersionHistory/     # 版本歷史
├── Settings/           # 設置頁面
└── Reports/            # 報告頁面

// 通用組件
src/renderer/components/
├── ClauseList/         # 條款列表
├── RiskPanel/          # 風險面板
├── CommentPanel/       # 批註面板
├── TemplateLibrary/    # 模板庫
├── TodoList/           # 待辦清單
└── VersionCompare/     # 版本對比
```

**狀態管理**:

```typescript
// 使用 Zustand 管理全局狀態
interface AppState {
  // 用戶狀態
  user: User | null;
  isAuthenticated: boolean;
  
  // 文檔狀態
  currentDocument: Document | null;
  clauses: Clause[];
  selectedClauseId: string | null;
  
  // 風險狀態
  riskMatches: Map<string, RiskMatch[]>;
  
  // UI 狀態
  sidebarCollapsed: boolean;
  viewMode: 'review' | 'compare';
  
  // 操作方法
  setUser: (user: User) => void;
  loadDocument: (id: string) => Promise<void>;
  selectClause: (id: string) => void;
  // ...
}
```

### 2.2 業務邏輯層 (Business Logic Layer)

**職責**: 實現核心業務邏輯

**主要服務**:

```typescript
// 主進程服務
src/main/services/
├── DocumentService.ts      # 文檔管理服務
├── RuleService.ts          # 規則引擎服務
├── VersionService.ts       # 版本管理服務
├── CommentService.ts       # 批註服務
├── TemplateService.ts      # 模板服務
├── ExportService.ts        # 導出服務
├── AuthService.ts          # 認證服務
└── EncryptionService.ts    # 加密服務
```

**服務接口示例**:

```typescript
// DocumentService.ts
export class DocumentService {
  constructor(
    private documentDAO: DocumentDAO,
    private clauseDAO: ClauseDAO,
    private ruleService: RuleService
  ) {}
  
  // 導入文檔
  async importDocument(filePath: string): Promise<Document> {
    // 1. 解析文檔
    const parseResult = await this.parseDocument(filePath);
    
    // 2. 提取條款
    const clauses = await this.extractClauses(parseResult);
    
    // 3. 匹配風險
    const risks = await this.ruleService.matchRisks(clauses);
    
    // 4. 保存到數據庫
    const document = await this.documentDAO.create({
      name: path.basename(filePath),
      content: parseResult.content,
      metadata: parseResult.metadata
    });
    
    await this.clauseDAO.batchCreate(clauses);
    
    return document;
  }
  
  // 獲取文檔
  async getDocument(id: string): Promise<Document> {
    return this.documentDAO.findById(id);
  }
  
  // 更新文檔
  async updateDocument(id: string, data: Partial<Document>): Promise<void> {
    await this.documentDAO.update(id, data);
  }
  
  // 刪除文檔
  async deleteDocument(id: string): Promise<void> {
    await this.documentDAO.delete(id);
  }
}
```

### 2.3 數據訪問層 (Data Access Layer)

**職責**: 封裝數據庫操作

**主要 DAO**:

```typescript
// 數據訪問對象
src/main/dao/
├── DocumentDAO.ts      # 文檔數據訪問
├── ClauseDAO.ts        # 條款數據訪問
├── RuleDAO.ts          # 規則數據訪問
├── VersionDAO.ts       # 版本數據訪問
├── CommentDAO.ts       # 批註數據訪問
├── TemplateDAO.ts      # 模板數據訪問
└── UserDAO.ts          # 用戶數據訪問
```

**DAO 接口示例**:

```typescript
// BaseDAO.ts - 基礎 DAO
export abstract class BaseDAO<T> {
  constructor(protected db: Database, protected tableName: string) {}
  
  // 創建
  create(data: Omit<T, 'id'>): T {
    const stmt = this.db.prepare(`
      INSERT INTO ${this.tableName} (${this.getColumns()})
      VALUES (${this.getPlaceholders()})
    `);
    const result = stmt.run(this.getValues(data));
    return { ...data, id: result.lastInsertRowid } as T;
  }
  
  // 查詢單個
  findById(id: string | number): T | null {
    const stmt = this.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE id = ?
    `);
    return stmt.get(id) as T | null;
  }
  
  // 查詢多個
  findAll(where?: string, params?: any[]): T[] {
    let sql = `SELECT * FROM ${this.tableName}`;
    if (where) sql += ` WHERE ${where}`;
    const stmt = this.db.prepare(sql);
    return stmt.all(params || []) as T[];
  }
  
  // 更新
  update(id: string | number, data: Partial<T>): void {
    const stmt = this.db.prepare(`
      UPDATE ${this.tableName}
      SET ${this.getUpdateSet()}
      WHERE id = ?
    `);
    stmt.run(...this.getValues(data), id);
  }
  
  // 刪除
  delete(id: string | number): void {
    const stmt = this.db.prepare(`
      DELETE FROM ${this.tableName} WHERE id = ?
    `);
    stmt.run(id);
  }
  
  protected abstract getColumns(): string;
  protected abstract getPlaceholders(): string;
  protected abstract getUpdateSet(): string;
  protected abstract getValues(data: any): any[];
}
```

### 2.4 數據持久層 (Data Persistence Layer)

**職責**: SQLite 數據庫管理

**數據庫初始化**:

```typescript
// src/main/database/index.ts
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseManager {
  private db: Database.Database;
  
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'database', 'app.db');
    this.db = new Database(dbPath);
    this.initialize();
  }
  
  private initialize() {
    // 啟用外鍵約束
    this.db.pragma('foreign_keys = ON');
    
    // 設置 WAL 模式（提高並發性能）
    this.db.pragma('journal_mode = WAL');
    
    // 創建表
    this.createTables();
    
    // 創建索引
    this.createIndexes();
    
    // 初始化數據
    this.seedData();
  }
  
  private createTables() {
    // 執行建表 SQL
    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    this.db.exec(schema);
  }
  
  private createIndexes() {
    // 創建索引以優化查詢
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_clauses_document_id ON clauses(document_id);
      CREATE INDEX IF NOT EXISTS idx_comments_clause_id ON comments(clause_id);
      CREATE INDEX IF NOT EXISTS idx_versions_document_id ON versions(document_id);
      CREATE INDEX IF NOT EXISTS idx_risk_matches_clause_id ON risk_matches(clause_id);
    `);
  }
  
  private seedData() {
    // 初始化管理員賬號和默認規則
    // ...
  }
  
  getDatabase(): Database.Database {
    return this.db;
  }
  
  close() {
    this.db.close();
  }
}
```

## 3. 進程通信架構

### 3.1 IPC 通信模式

**主進程 → 渲染進程**: 使用 `webContents.send()`

**渲染進程 → 主進程**: 使用 `ipcRenderer.invoke()`

**Preload 腳本**: 提供安全的 API 橋接

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文檔操作
  document: {
    import: (filePath: string) => ipcRenderer.invoke('document:import', filePath),
    get: (id: string) => ipcRenderer.invoke('document:get', id),
    update: (id: string, data: any) => ipcRenderer.invoke('document:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('document:delete', id),
  },
  
  // 條款操作
  clause: {
    list: (documentId: string) => ipcRenderer.invoke('clause:list', documentId),
    get: (id: string) => ipcRenderer.invoke('clause:get', id),
    update: (id: string, data: any) => ipcRenderer.invoke('clause:update', id, data),
  },
  
  // 風險規則
  rule: {
    list: () => ipcRenderer.invoke('rule:list'),
    match: (clauseId: string) => ipcRenderer.invoke('rule:match', clauseId),
  },
  
  // 版本管理
  version: {
    save: (documentId: string, summary: string) => ipcRenderer.invoke('version:save', documentId, summary),
    list: (documentId: string) => ipcRenderer.invoke('version:list', documentId),
    rollback: (versionId: string) => ipcRenderer.invoke('version:rollback', versionId),
  },
  
  // 導出
  export: {
    pdf: (documentId: string, options: any) => ipcRenderer.invoke('export:pdf', documentId, options),
    docx: (documentId: string, options: any) => ipcRenderer.invoke('export:docx', documentId, options),
    report: (documentId: string) => ipcRenderer.invoke('export:report', documentId),
  },
  
  // 用戶認證
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  },
});
```

### 3.2 IPC 處理器

```typescript
// src/main/ipc/handlers.ts
import { ipcMain } from 'electron';
import { DocumentService } from '../services/DocumentService';
import { RuleService } from '../services/RuleService';
// ...

export function registerIpcHandlers(services: Services) {
  // 文檔操作
  ipcMain.handle('document:import', async (event, filePath: string) => {
    return services.document.importDocument(filePath);
  });
  
  ipcMain.handle('document:get', async (event, id: string) => {
    return services.document.getDocument(id);
  });
  
  ipcMain.handle('document:update', async (event, id: string, data: any) => {
    return services.document.updateDocument(id, data);
  });
  
  ipcMain.handle('document:delete', async (event, id: string) => {
    return services.document.deleteDocument(id);
  });
  
  // 條款操作
  ipcMain.handle('clause:list', async (event, documentId: string) => {
    return services.clause.listByDocument(documentId);
  });
  
  // ... 其他處理器
}
```

## 4. 模塊依賴關係

```
┌─────────────────────────────────────────────────────────┐
│                      UI Components                       │
│  (依賴 Hooks, Store, Utils)                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Custom Hooks                          │
│  (依賴 Store, IPC API)                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    State Store                           │
│  (依賴 IPC API)                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      IPC API                             │
│  (Preload 暴露的 API)                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    IPC Handlers                          │
│  (依賴 Services)                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Services                            │
│  (依賴 DAO, 其他 Services)                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                        DAO                               │
│  (依賴 Database)                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    SQLite Database                       │
└─────────────────────────────────────────────────────────┘
```

## 5. 安全架構

### 5.1 進程隔離

- **主進程**: 擁有完整的 Node.js 權限
- **渲染進程**: 運行在沙箱環境，無直接訪問 Node.js API
- **Preload 腳本**: 提供受控的 API 橋接

### 5.2 數據加密

- **密碼**: 使用 bcrypt 加密存儲
- **敏感信息**: 使用 AES 加密存儲
- **會話**: 使用內存存儲，不持久化

### 5.3 訪問控制

- **用戶認證**: 登錄驗證
- **權限控制**: 基於角色的訪問控制（RBAC）
- **項目保護**: 項目級別的訪問密碼

## 6. 性能架構

### 6.1 多線程架構

```
主進程
  ├── UI 線程（渲染進程）
  ├── Worker 線程 1（文檔解析）
  ├── Worker 線程 2（風險匹配）
  └── Worker 線程 3（導出處理）
```

### 6.2 緩存策略

- **內存緩存**: 當前文檔數據
- **數據庫緩存**: 解析結果、風險匹配結果
- **文件緩存**: 導出的臨時文件

### 6.3 懶加載策略

- **條款列表**: 虛擬滾動
- **圖片**: 延遲加載
- **模板庫**: 按需加載

## 7. 擴展性架構

### 7.1 插件系統（未來）

```typescript
interface Plugin {
  name: string;
  version: string;
  activate(context: PluginContext): void;
  deactivate(): void;
}

interface PluginContext {
  registerRule(rule: RiskRule): void;
  registerExporter(exporter: Exporter): void;
  registerCommand(command: Command): void;
}
```

### 7.2 事件系統

```typescript
// 事件總線
class EventBus {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }
  
  emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

// 使用示例
eventBus.on('document:imported', (document) => {
  console.log('Document imported:', document.name);
});

eventBus.emit('document:imported', document);
```

## 8. 部署架構

### 8.1 目錄結構

```
應用安裝目錄/
├── resources/
│   ├── app.asar          # 應用代碼
│   ├── icons/            # 圖標資源
│   └── templates/        # 模板文件
├── locales/              # 語言包
└── electron.exe          # Electron 可執行文件

用戶數據目錄/
├── database/
│   ├── app.db           # 主數據庫
│   └── cache/           # 緩存數據
├── logs/                # 日誌文件
├── exports/             # 導出文件
└── config.json          # 用戶配置
```

### 8.2 更新機制（未來）

- 使用 electron-updater
- 支持自動檢查更新
- 支持增量更新
- 支持回滾

## 9. 監控與日誌

### 9.1 日誌架構

```typescript
// 日誌級別
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 日誌記錄器
class Logger {
  constructor(private module: string) {}
  
  error(message: string, error?: Error) {
    this.log(LogLevel.ERROR, message, error);
  }
  
  warn(message: string) {
    this.log(LogLevel.WARN, message);
  }
  
  info(message: string) {
    this.log(LogLevel.INFO, message);
  }
  
  debug(message: string) {
    this.log(LogLevel.DEBUG, message);
  }
  
  private log(level: LogLevel, message: string, error?: Error) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.module,
      message,
      stack: error?.stack
    };
    
    // 寫入日誌文件
    this.writeToFile(logEntry);
    
    // 控制台輸出
    console[level](logEntry);
  }
}
```

### 9.2 性能監控

```typescript
// 性能監控
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  measure(name: string, fn: () => any) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return result;
  }
  
  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
```

## 10. 總結

本架構設計遵循以下原則：

1. **分層清晰**: UI、業務邏輯、數據訪問分離
2. **職責單一**: 每個模塊職責明確
3. **低耦合**: 模塊間通過接口通信
4. **高內聚**: 相關功能集中在同一模塊
5. **可擴展**: 支持插件和功能擴展
6. **高性能**: 多線程、緩存、懶加載
7. **安全性**: 進程隔離、數據加密、訪問控制
