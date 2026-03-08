# 項目交接文檔 - 合約風險管理系統

> **交接時間**: 2026-03-07  
> **當前階段**: Phase 1 已完成，準備進入 Phase 2  
> **項目狀態**: 共享代碼層完成，數據庫設計待開始

---

## 📋 項目概況

### 基本信息
- **項目名稱**: 合約風險管理系統（Contract Risk Management System）
- **技術棧**: Electron 28 + React 18 + TypeScript 5 + SQLite3
- **架構模式**: 主進程（Node.js）+ 渲染進程（React）+ 共享代碼層
- **開發模式**: 分階段開發（Phase 1-7）

### 核心功能
1. 合約管理（CRUD、版本控制、狀態追蹤）
2. 條款管理（關聯合約、風險評估）
3. 風險管理（等級評估、處理措施）
4. 用戶管理（角色權限、操作日誌）
5. 審計日誌（完整操作記錄）

---

## 📁 當前目錄結構

```
Demo/
├── .cursor/
│   └── rules/                    # 開發規範（必讀！）
│       ├── 00-core-standards.mdc
│       ├── 01-project-structure.mdc
│       ├── 02-testing-requirements.mdc
│       ├── 03-security-checklist.mdc
│       ├── 04-delivery-checklist.mdc
│       └── 05-project-type-classification.mdc
├── docs/
│   ├── design.md                 # 系統設計文檔
│   └── api-spec.md               # API 規格說明（873 行）
├── src/
│   └── shared/                   # ✅ Phase 1 已完成
│       ├── types/
│       │   └── index.ts          # 共享類型定義（159 行）
│       ├── constants/
│       │   └── index.ts          # 共享常量（129 行）
│       └── utils/
│           └── index.ts          # 共享工具函數（152 行）
├── prompt.md                     # 原始需求文檔
├── questions.md                  # 業務邏輯疑問（13 個待解答）
├── PLANNING_COMPLIANCE_REPORT.md # 規劃符合度報告
├── PHASE1_COMPLETION_REPORT.md   # Phase 1 完成報告
└── README.md                     # 項目說明文檔

待創建目錄：
├── src/
│   ├── main/                     # Phase 2-3: 主進程代碼
│   │   ├── database/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── ipc/
│   └── renderer/                 # Phase 4: 渲染進程代碼
│       ├── components/
│       ├── pages/
│       └── hooks/
├── unit_tests/                   # Phase 6: 單元測試
├── API_tests/                    # Phase 6: API 測試
└── run_tests.sh                  # Phase 6: 測試腳本
```

---

## ✅ Phase 1 完成狀態

### 已完成項目
1. **共享類型定義** (`src/shared/types/index.ts`)
   - 10+ 個核心類型（User, Contract, Clause, Risk 等）
   - 完整的 TypeScript 類型安全
   - API 響應標準化類型

2. **共享常量** (`src/shared/constants/index.ts`)
   - 風險等級枚舉（HIGH, MEDIUM, LOW）
   - 用戶角色枚舉（ADMIN, MANAGER, VIEWER）
   - HTTP 狀態碼常量
   - 錯誤碼定義

3. **共享工具函數** (`src/shared/utils/index.ts`)
   - API 響應創建函數
   - 日期格式化工具
   - 驗證函數（email, 密碼強度）
   - 錯誤處理工具

### 規範符合度
- ✅ 代碼風格：100% 符合
- ✅ 類型安全：100% 符合
- ✅ 錯誤處理：100% 符合
- ✅ 文檔完整性：100% 符合

詳細檢查報告見：`PHASE1_COMPLETION_REPORT.md`

---

## 🎯 下一步工作：Phase 2

### Phase 2 目標：數據庫設計與初始化

#### 2.1 創建數據庫結構
**文件**: `src/main/database/schema.ts`

```typescript
// 需要創建 5 個核心表：
// 1. users - 用戶表
// 2. contracts - 合約表
// 3. clauses - 條款表
// 4. risks - 風險表
// 5. audit_logs - 審計日誌表

// 參考 docs/design.md 中的數據庫設計章節
```

**關鍵點**：
- 使用 SQLite3 的 `better-sqlite3` 庫
- 實現自動建表邏輯
- 添加索引優化查詢
- 實現數據庫版本管理

#### 2.2 創建數據庫連接管理
**文件**: `src/main/database/connection.ts`

```typescript
// 需要實現：
// - 數據庫連接初始化
// - 連接池管理
// - 事務支持
// - 錯誤處理
```

#### 2.3 創建 Repository 層
**文件結構**:
```
src/main/repositories/
├── BaseRepository.ts      # 基礎 Repository（CRUD 通用邏輯）
├── UserRepository.ts      # 用戶數據訪問
├── ContractRepository.ts  # 合約數據訪問
├── ClauseRepository.ts    # 條款數據訪問
├── RiskRepository.ts      # 風險數據訪問
└── AuditLogRepository.ts  # 審計日誌數據訪問
```

**關鍵點**：
- 使用 `src/shared/types` 中定義的類型
- 實現參數化查詢（防 SQL 注入）
- 添加數據驗證
- 實現分頁查詢

---

## 📚 必讀文檔清單

### 開發前必讀（優先級：高）
1. **`.cursor/rules/00-core-standards.mdc`**
   - 核心評分標準
   - 一票否決紅線
   - 工程質量要求

2. **`.cursor/rules/03-security-checklist.mdc`**
   - 認證與鑑權規範
   - SQL 注入防護
   - 敏感信息保護

3. **`docs/design.md`**
   - 系統架構設計
   - 數據庫設計
   - 核心業務流程

4. **`docs/api-spec.md`**
   - API 接口規格
   - 請求/響應格式
   - 錯誤碼說明

### 開發中參考（優先級：中）
5. **`.cursor/rules/01-project-structure.mdc`**
   - 目錄結構規範
   - Docker 容器化要求

6. **`.cursor/rules/02-testing-requirements.mdc`**
   - 測試驗收標準
   - 測試覆蓋要求

7. **`questions.md`**
   - 13 個業務邏輯疑問
   - 需要在開發過程中解答

### 交付前必讀（優先級：高）
8. **`.cursor/rules/04-delivery-checklist.mdc`**
   - 交付物規範
   - 提交前檢查清單

---

## 🔧 技術細節

### 共享代碼使用示例

#### 1. 使用共享類型
```typescript
import { User, Contract, ApiResponse } from '@/shared/types';

// 創建用戶對象
const user: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'ADMIN',
  createdAt: new Date(),
  updatedAt: new Date()
};

// API 響應
const response: ApiResponse<User> = {
  code: 200,
  msg: 'success',
  data: user
};
```

#### 2. 使用共享常量
```typescript
import { RiskLevel, UserRole, HttpStatus } from '@/shared/constants';

// 風險等級判斷
if (risk.level === RiskLevel.HIGH) {
  // 高風險處理邏輯
}

// 角色權限檢查
if (user.role === UserRole.ADMIN) {
  // 管理員操作
}

// HTTP 狀態碼
return { code: HttpStatus.OK, msg: 'success' };
```

#### 3. 使用共享工具函數
```typescript
import { 
  createSuccessResponse, 
  createErrorResponse,
  formatDate,
  validateEmail 
} from '@/shared/utils';

// 創建成功響應
return createSuccessResponse(data);

// 創建錯誤響應
return createErrorResponse('用戶不存在', 404);

// 日期格式化
const dateStr = formatDate(new Date()); // "2026-03-07 14:30:00"

// Email 驗證
if (!validateEmail(email)) {
  throw new Error('Email 格式錯誤');
}
```

---

## 🚨 重要注意事項

### 安全規範（必須遵守）
1. **SQL 注入防護**
   - ✅ 使用參數化查詢
   - ❌ 禁止字符串拼接 SQL

2. **密碼處理**
   - ✅ 使用 bcrypt 加密
   - ❌ 禁止明文存儲

3. **API 鑑權**
   - ✅ 所有受保護路由必須驗證 Token
   - ✅ 實現對象級授權（防 IDOR 攻擊）

4. **數據隔離**
   - ✅ 查詢時過濾用戶範圍
   - ❌ 禁止返回所有用戶的數據

### 測試要求（Phase 6 必須完成）
1. **單元測試**
   - 覆蓋所有核心業務邏輯
   - 測試正常流程 + 異常流程
   - 測試邊界條件

2. **API 測試**
   - 測試所有 API 接口
   - 測試認證錯誤（401）
   - 測試權限錯誤（403）
   - 測試參數錯誤（400）

3. **測試腳本**
   - 創建 `run_tests.sh`
   - 輸出清晰的測試結果

---

## 📝 開發計劃

### Phase 2: 數據庫設計與初始化（當前階段）
- [ ] 創建數據庫 Schema
- [ ] 實現數據庫連接管理
- [ ] 創建 BaseRepository
- [ ] 創建各個 Repository
- [ ] 編寫數據庫初始化腳本

### Phase 3: 主進程核心功能
- [ ] 實現 Service 層（業務邏輯）
- [ ] 實現 IPC 通信（主進程 ↔ 渲染進程）
- [ ] 實現認證與鑑權中間件
- [ ] 實現審計日誌記錄

### Phase 4: 渲染進程 UI 開發
- [ ] 創建 React 組件
- [ ] 實現頁面路由
- [ ] 實現表單驗證
- [ ] 實現狀態管理

### Phase 5: 業務邏輯整合
- [ ] 整合主進程與渲染進程
- [ ] 實現完整業務流程
- [ ] 處理錯誤與異常

### Phase 6: 測試與優化
- [ ] 編寫單元測試
- [ ] 編寫 API 測試
- [ ] 性能優化
- [ ] 安全加固

### Phase 7: 打包與部署
- [ ] 配置 Electron Builder
- [ ] 創建安裝包
- [ ] 編寫部署文檔

---

## 🎬 新對話窗開場白建議

```
你好！我正在開發一個 Electron + React + TypeScript 的合約風險管理系統。

當前狀態：
- Phase 1（共享代碼層）已完成
- 準備開始 Phase 2（數據庫設計與初始化）

請先閱讀以下文檔：
1. HANDOVER_DOCUMENT.md（本文檔）
2. docs/design.md（系統設計）
3. docs/api-spec.md（API 規格）
4. .cursor/rules/00-core-standards.mdc（核心規範）
5. .cursor/rules/03-security-checklist.mdc（安全規範）

然後我們開始 Phase 2 的開發工作。
```

---

## 📞 聯繫方式

如有疑問，請參考：
- **業務邏輯疑問**: 見 `questions.md`（13 個待解答問題）
- **技術規範**: 見 `.cursor/rules/` 目錄
- **API 規格**: 見 `docs/api-spec.md`
- **系統設計**: 見 `docs/design.md`

---

**文檔版本**: v1.0  
**最後更新**: 2026-03-07  
**下次更新**: Phase 2 完成後
