# 合同風險管理系統 - 開發文檔

## 📚 目錄

1. [項目概述](#項目概述)
2. [技術架構](#技術架構)
3. [開發環境設置](#開發環境設置)
4. [項目結構](#項目結構)
5. [核心模塊](#核心模塊)
6. [開發規範](#開發規範)
7. [測試指南](#測試指南)
8. [部署指南](#部署指南)
9. [常見問題](#常見問題)

---

## 項目概述

### 項目信息

- **項目名稱**: 合同風險管理系統
- **項目類型**: Electron 桌面應用
- **開發語言**: TypeScript
- **版本**: 1.0.0

### 技術棧

**前端**:
- React 18.3.1
- TypeScript 5.3.3
- Ant Design 5.29.3
- React Router 6.30.3
- Zustand 4.5.7 (狀態管理)

**後端**:
- Electron 28.1.3
- Node.js 18+
- Better-SQLite3 9.2.2
- TypeScript 5.3.3

**工具鏈**:
- Vite 5.0.0 (構建工具)
- Electron Forge 7.2.0 (打包工具)
- Jest 29.7.0 (測試框架)
- ESLint 8.56.0 (代碼檢查)
- Prettier 3.2.4 (代碼格式化)

---

## 技術架構

### 整體架構

```
┌─────────────────────────────────────────┐
│           Renderer Process              │
│  ┌─────────────────────────────────┐   │
│  │         React UI Layer          │   │
│  │  ├─ Pages (路由頁面)            │   │
│  │  ├─ Components (UI 組件)        │   │
│  │  ├─ Contexts (狀態管理)         │   │
│  │  └─ Hooks (自定義 Hooks)        │   │
│  └─────────────────────────────────┘   │
│              ↕ IPC                      │
└─────────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────────┐
│            Main Process                 │
│  ┌─────────────────────────────────┐   │
│  │      Service Layer (業務邏輯)   │   │
│  │  ├─ AuthService                 │   │
│  │  ├─ ProjectService              │   │
│  │  ├─ DocumentService             │   │
│  │  └─ RiskService                 │   │
│  └─────────────────────────────────┘   │
│              ↕                          │
│  ┌─────────────────────────────────┐   │
│  │   Repository Layer (數據訪問)   │   │
│  │  ├─ UserRepository              │   │
│  │  ├─ ProjectRepository           │   │
│  │  ├─ DocumentRepository          │   │
│  │  └─ RiskRepository              │   │
│  └─────────────────────────────────┘   │
│              ↕                          │
│  ┌─────────────────────────────────┐   │
│  │      Database (SQLite)          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 數據流

```
User Action (UI)
    ↓
React Component
    ↓
IPC Call (Preload)
    ↓
IPC Handler (Main)
    ↓
Service Layer
    ↓
Repository Layer
    ↓
Database
    ↓
Response (逆向返回)
```

---

## 開發環境設置

### 前置要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Git
- Visual Studio Code (推薦)

### 克隆項目

```bash
git clone https://github.com/example/contract-risk-management.git
cd contract-risk-management
```

### 安裝依賴

```bash
# 安裝根目錄依賴
npm install

# 安裝 desktop 依賴
cd desktop
npm install
```

### 啟動開發服務器

```bash
cd desktop
npm run dev
```

### VS Code 推薦擴展

- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- SQLite Viewer

### 環境變量

創建 `.env` 文件（如需要）：

```env
NODE_ENV=development
LOG_LEVEL=debug
```

---

## 項目結構

```
contract-risk-management/
├── .cursor/                    # Cursor 規則配置
│   └── rules/                  # 開發規範
├── desktop/                    # Electron 應用
│   ├── src/
│   │   ├── main/              # 主進程
│   │   │   ├── database/      # 數據庫
│   │   │   │   ├── schema.ts  # 表結構
│   │   │   │   └── connection.ts
│   │   │   ├── repositories/  # 數據訪問層
│   │   │   │   ├── BaseRepository.ts
│   │   │   │   ├── UserRepository.ts
│   │   │   │   ├── ProjectRepository.ts
│   │   │   │   ├── DocumentRepository.ts
│   │   │   │   └── RiskRepository.ts
│   │   │   ├── services/      # 業務邏輯層
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── ProjectService.ts
│   │   │   │   ├── DocumentService.ts
│   │   │   │   └── RiskService.ts
│   │   │   ├── ipc/           # IPC 通信
│   │   │   │   ├── channels.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── handlers/
│   │   │   ├── middleware/    # 中間件
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   ├── permissionMiddleware.ts
│   │   │   │   └── errorHandler.ts
│   │   │   └── utils/         # 工具函數
│   │   ├── renderer/          # 渲染進程
│   │   │   ├── pages/         # 頁面組件
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── ProjectListPage.tsx
│   │   │   │   ├── DocumentListPage.tsx
│   │   │   │   └── DocumentReviewPage.tsx
│   │   │   ├── components/    # 通用組件
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   ├── ClauseItem.tsx
│   │   │   │   └── RiskDetailPanel.tsx
│   │   │   ├── contexts/      # Context API
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── ProjectContext.tsx
│   │   │   ├── hooks/         # 自定義 Hooks
│   │   │   ├── styles/        # 樣式文件
│   │   │   ├── App.tsx        # 應用根組件
│   │   │   └── index.tsx      # 入口文件
│   │   ├── preload/           # Preload 腳本
│   │   │   └── index.ts
│   │   └── shared/            # 共享代碼
│   │       ├── types/         # 類型定義
│   │       ├── constants/     # 常量
│   │       └── utils/         # 共享工具
│   ├── assets/                # 靜態資源
│   ├── resources/             # 應用資源
│   ├── package.json
│   ├── tsconfig.json
│   ├── forge.config.js        # Electron Forge 配置
│   └── vite.config.ts         # Vite 配置
├── unit_tests/                # 單元測試
├── API_tests/                 # API 測試
├── docs/                      # 文檔
│   ├── design.md
│   ├── api-spec.md
│   ├── user-manual.md
│   └── packaging-guide.md
├── prompt.md                  # 原始需求
├── questions.md               # 業務邏輯疑問
├── run_tests.sh              # 測試腳本
└── README.md
```

---

## 核心模塊

### 1. 數據庫模塊

**位置**: `src/main/database/`

**核心文件**:
- `schema.ts`: 數據庫表結構定義
- `connection.ts`: 數據庫連接管理

**表結構**:
```typescript
// 用戶表
users: {
  id: INTEGER PRIMARY KEY
  username: TEXT UNIQUE
  password_hash: TEXT
  email: TEXT
  role: TEXT
  created_at: TEXT
}

// 項目表
projects: {
  id: INTEGER PRIMARY KEY
  name: TEXT
  description: TEXT
  user_id: INTEGER
  created_at: TEXT
}

// 文檔表
documents: {
  id: INTEGER PRIMARY KEY
  project_id: INTEGER
  filename: TEXT
  file_path: TEXT
  status: TEXT
  created_at: TEXT
}

// 條款表
clauses: {
  id: INTEGER PRIMARY KEY
  document_id: INTEGER
  content: TEXT
  position: INTEGER
}

// 風險表
risks: {
  id: INTEGER PRIMARY KEY
  clause_id: INTEGER
  risk_level: TEXT
  description: TEXT
}
```

### 2. Repository 層

**位置**: `src/main/repositories/`

**設計模式**: Repository Pattern

**基類**: `BaseRepository<T>`
- 提供通用 CRUD 操作
- 類型安全
- 事務支持

**示例**:
```typescript
class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  findByUsername(username: string): User | null {
    return this.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as User | null;
  }
}
```

### 3. Service 層

**位置**: `src/main/services/`

**職責**: 業務邏輯處理

**核心服務**:

**AuthService**:
- 用戶登錄/登出
- Token 生成和驗證
- 密碼加密

**ProjectService**:
- 項目 CRUD
- 權限檢查
- 統計信息

**DocumentService**:
- 文檔導入
- 文檔解析
- 狀態管理

**RiskService**:
- 風險識別
- 風險評估
- 風險統計

### 4. IPC 通信

**位置**: `src/main/ipc/`

**通道定義**: `channels.ts`
```typescript
export const IPC_CHANNELS = {
  AUTH: {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    VERIFY: 'auth:verify',
  },
  PROJECT: {
    CREATE: 'project:create',
    LIST: 'project:list',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
  },
  // ...
};
```

**類型定義**: `types.ts`
```typescript
export interface IPCRequest<T = any> {
  token?: string;
  data: T;
}

export interface IPCResponse<T = any> {
  success: boolean;
  code: number;
  msg: string;
  data: T;
}
```

### 5. 前端組件

**位置**: `src/renderer/`

**頁面組件**:
- `LoginPage`: 登錄頁面
- `ProjectListPage`: 項目列表
- `DocumentListPage`: 文檔列表
- `DocumentReviewPage`: 文檔審閱

**通用組件**:
- `AppHeader`: 應用頭部
- `ClauseItem`: 條款項目
- `RiskDetailPanel`: 風險詳情面板

**Context**:
- `AuthContext`: 認證狀態管理
- `ProjectContext`: 項目狀態管理

---

## 開發規範

### 代碼風格

**TypeScript**:
- 使用 ESLint + Prettier
- 嚴格模式 (`strict: true`)
- 禁止 `any` 類型（除非必要）

**命名規範**:
- 文件名: PascalCase (組件) 或 camelCase (工具)
- 類名: PascalCase
- 函數名: camelCase
- 常量: UPPER_SNAKE_CASE
- 接口: PascalCase (以 I 開頭可選)

**示例**:
```typescript
// ✅ 正確
export class UserService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  
  async loginUser(username: string): Promise<User> {
    // ...
  }
}

// ❌ 錯誤
export class user_service {
  private max_login_attempts = 5;
  
  async LoginUser(UserName: string): Promise<any> {
    // ...
  }
}
```

### Git 提交規範

使用 Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式調整
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 構建/工具相關

**示例**:
```
feat(auth): 添加登錄失敗鎖定功能

- 連續失敗 5 次後鎖定 10 分鐘
- 添加鎖定狀態檢查
- 更新相關測試

Closes #123
```

### 錯誤處理

**統一錯誤響應**:
```typescript
interface ErrorResponse {
  success: false;
  code: number;
  msg: string;
  data: null;
}
```

**錯誤碼規範**:
- 200: 成功
- 400: 請求參數錯誤
- 401: 未認證
- 403: 無權限
- 404: 資源不存在
- 500: 服務器錯誤

**示例**:
```typescript
try {
  const user = await userRepository.findById(userId);
  if (!user) {
    return {
      success: false,
      code: 404,
      msg: '用戶不存在',
      data: null,
    };
  }
  // ...
} catch (error) {
  console.error('Error:', error);
  return {
    success: false,
    code: 500,
    msg: '服務器錯誤',
    data: null,
  };
}
```

### 日誌規範

**日誌級別**:
- `error`: 錯誤信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 調試信息

**示例**:
```typescript
console.error('[AuthService] Login failed:', error);
console.warn('[ProjectService] Project not found:', projectId);
console.info('[DocumentService] Document imported:', documentId);
console.debug('[RiskService] Analyzing document:', documentId);
```

---

## 測試指南

### 測試結構

```
unit_tests/          # 單元測試
├── services/        # 服務層測試
├── repositories/    # 數據訪問層測試
└── utils/          # 工具函數測試

API_tests/          # API 測試
├── auth.test.ts
├── project.test.ts
└── risk.test.ts
```

### 運行測試

```bash
# 所有測試
npm test

# 單元測試
npm run test:unit

# API 測試
npm run test:api

# 覆蓋率報告
npm run test:coverage

# 監視模式
npm run test:watch
```

### 編寫測試

**單元測試示例**:
```typescript
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  it('應該成功登錄', async () => {
    const result = await authService.login('admin', 'admin123');
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('token');
  });

  it('應該在密碼錯誤時返回 401', async () => {
    const result = await authService.login('admin', 'wrong');
    
    expect(result.success).toBe(false);
    expect(result.code).toBe(401);
  });
});
```

### 測試覆蓋率要求

- 服務層: > 80%
- Repository 層: > 70%
- 工具函數: > 90%

---

## 部署指南

### 構建應用

```bash
cd desktop
npm run build
```

### 打包應用

```bash
# 所有平台
npm run make

# Windows
npm run make:win

# macOS
npm run make:mac

# Linux
npm run make:linux
```

### 發布流程

1. 更新版本號 (`package.json`)
2. 更新 CHANGELOG
3. 運行所有測試
4. 構建並打包
5. 測試安裝包
6. 創建 Git tag
7. 推送到倉庫
8. 創建 GitHub Release
9. 上傳安裝包

---

## 常見問題

### Q1: 如何調試主進程？

**A**: 在 VS Code 中配置 launch.json:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Electron Main",
  "runtimeExecutable": "${workspaceFolder}/desktop/node_modules/.bin/electron",
  "program": "${workspaceFolder}/desktop/dist/main/index.js",
  "protocol": "inspector"
}
```

### Q2: 如何調試渲染進程？

**A**: 
1. 啟動應用 (`npm run dev`)
2. 打開 DevTools (Ctrl+Shift+I)
3. 在 Sources 面板設置斷點

### Q3: 數據庫文件在哪裡？

**A**: 
- 開發環境: `desktop/database/`
- 生產環境: `app.getPath('userData')/contract-risk.db`

### Q4: 如何添加新的 IPC 通道？

**A**:
1. 在 `channels.ts` 中定義通道名
2. 在 `handlers/` 中創建處理器
3. 在 `index.ts` 中註冊處理器
4. 在 `preload/index.ts` 中暴露 API
5. 在前端調用

### Q5: 如何添加新的數據表？

**A**:
1. 在 `schema.ts` 中定義表結構
2. 創建對應的 Repository
3. 在 Service 中使用
4. 更新類型定義

---

**文檔版本**: v1.0.0  
**更新日期**: 2026-03-08  
**維護者**: 開發團隊
