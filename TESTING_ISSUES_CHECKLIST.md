# 測試修復問題清單

## 專案資訊
- **專案路徑**: `c:\Users\fortu\Desktop\Project\Demo`
- **測試框架**: Jest + ts-jest
- **當前狀態**: 所有測試套件編譯失敗，0 個測試執行

---

## ✅ 已完成的修復

### 1. TypeScript 配置問題
- ✅ 移除了根目錄 `tsconfig.json` 中不存在的 `tsconfig.node.json` 引用
- ✅ 移除了根目錄 `tsconfig.json` 中的 `vite/client` 類型引用（vite 只在 desktop/ 子目錄）
- ✅ 創建了 `desktop/tsconfig.vite.json` 用於 Vite 配置文件

### 2. 依賴安裝
- ✅ 安裝了 `@vitejs/plugin-react`
- ✅ 安裝了 `@types/jsonwebtoken`
- ✅ 安裝了 `@types/bcrypt`

### 3. Jest 配置修復
- ✅ 更新了 `desktop/package.json` 中的 `moduleNameMapper`，添加了所有路徑別名：
  ```json
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@main/(.*)$": "<rootDir>/src/main/$1",
    "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@preload/(.*)$": "<rootDir>/src/preload/$1"
  }
  ```
- ✅ 移除了已棄用的 `globals` 配置，改用新的 `transform` 格式

### 4. 測試文件編碼問題
- ✅ 修復了 `unit_tests/test_repositories.test.ts` 的編碼損壞問題
- ✅ 移除了未使用的 `bcrypt` import

---

## ⚠️ 待修復問題（按優先級排序）

### 優先級 1: 編譯錯誤（必須修復才能運行測試）

#### 問題 1.1: 服務類導入錯誤
**影響文件**:
- `unit_tests/services/AuthService.test.ts`
- `unit_tests/services/ProjectService.test.ts`
- `unit_tests/services/RiskService.test.ts`

**錯誤信息**:
```
TS2724: '"../../desktop/src/main/services/AuthService"' has no exported member named 'AuthService'. 
Did you mean 'authService'?
```

**原因**: 測試文件導入了類名，但服務文件導出的是實例

**修復方案**:
```typescript
// ❌ 錯誤寫法
import { AuthService } from '../../desktop/src/main/services/AuthService';

// ✅ 正確寫法
import { authService } from '../../desktop/src/main/services/AuthService';
```

**需要修改的行**:
- `AuthService.test.ts:1` - 導入語句
- `ProjectService.test.ts:1` - 導入語句
- `RiskService.test.ts:1` - 導入語句

---

#### 問題 1.2: Repository 方法不存在
**影響文件**:
- `API_tests/test_project_api.test.ts` (多處)
- `unit_tests/services/ProjectService.test.ts`

**錯誤信息**:
```
TS2339: Property 'create' does not exist on type 'ProjectRepository'.
```

**原因**: 測試調用 `projectRepository.create()`，但實際方法名可能不同

**需要檢查**:
1. 打開 `desktop/src/main/repositories/ProjectRepository.ts`
2. 查看實際的方法名稱（可能是 `createProject` 或其他）
3. 更新所有測試文件中的方法調用

**受影響的測試行**:
- `test_project_api.test.ts:37, 53, 62, 77, 97, 130, 157, 177, 195, 226, 245, 272, 293, 300, 321, 343, 357`
- `ProjectService.test.ts:24`

---

#### 問題 1.3: 缺少導出的驗證函數
**影響文件**:
- `unit_tests/utils/validation.test.ts`

**錯誤信息**:
```
TS2305: Module '"../../desktop/src/main/utils/validation"' has no exported member 'validateProjectName'.
```

**需要檢查**:
1. 確認 `desktop/src/main/utils/validation.ts` 是否存在
2. 如果存在，檢查是否導出了 `validateProjectName` 函數
3. 如果不存在，需要創建此文件或刪除相關測試

---

#### 問題 1.4: Repository 導入錯誤
**影響文件**:
- `unit_tests/services/RiskService.test.ts`

**錯誤信息**:
```
TS2724: '"../../desktop/src/main/repositories"' has no exported member named 'riskRepository'. 
Did you mean 'RiskRuleRepository'?
```

**需要檢查**:
1. 打開 `desktop/src/main/repositories/index.ts`
2. 查看實際導出的 repository 名稱
3. 更新測試文件中的導入語句

---

### 優先級 2: 未使用的變量警告（TS6133）

這些是代碼質量問題，不影響測試運行，但應該清理：

#### 問題 2.1: API_tests/auth.test.ts
**未使用的變量**:
- Line 20: `userToken`
- Line 21: `adminToken`
- Line 264: `maliciousInput`
- Line 362: `longUsername`
- Line 374: `specialChars`
- Line 386: `whitespaceUsername`

**修復方案**:
- 選項 A: 刪除這些變量
- 選項 B: 在變量名前加 `_` (如 `_userToken`)
- 選項 C: 實際使用這些變量（如果它們是為了測試準備的）

---

#### 問題 2.2: API_tests/project.test.ts
**未使用的變量**:
- Line 13: `user1Token`
- Line 14: `user2Token`
- Line 15: `createdProjectId`
- Line 418: `user2ProjectId`
- Line 470: `longName`
- Line 482: `longDesc`
- Line 494: `specialName`
- Line 506: `whitespaceName`

---

#### 問題 2.3: API_tests/risk.test.ts
**未使用的變量**:
- Line 10: `userToken`

---

### 優先級 3: 其他問題

#### 問題 3.1: bcrypt vs bcryptjs
**觀察**: 
- `package.json` 中安裝的是 `bcryptjs`
- 但代碼中可能導入的是 `bcrypt`

**需要檢查**:
- `desktop/src/main/repositories/UserRepository.ts:3` 是否使用正確的包名

---

## 📋 修復步驟建議

### 步驟 1: 修復服務類導入（最快）
```bash
# 在 unit_tests/services/ 目錄下的三個文件中
# 將 AuthService, ProjectService, RiskService 改為小寫開頭
```

### 步驟 2: 檢查 Repository 方法
```bash
# 查看實際的方法名稱
cat desktop/src/main/repositories/ProjectRepository.ts | grep "create"
```

### 步驟 3: 檢查 validation.ts
```bash
# 確認文件是否存在
ls desktop/src/main/utils/validation.ts
```

### 步驟 4: 清理未使用的變量
```bash
# 可以批量處理，在變量名前加 _
# 或者刪除這些聲明
```

### 步驟 5: 重新運行測試
```bash
cd desktop
npm test
```

---

## 🎯 預期結果

修復所有問題後，應該看到：
```
Test Suites: X passed, X total
Tests:       ~80 passed, ~80 total
Snapshots:   0 total
Time:        ~5-10s
Coverage:    XX%
```

---

## 📁 相關文件路徑

### 測試文件
- `unit_tests/test_auth_service.test.ts` ✅ (已修復編碼)
- `unit_tests/test_repositories.test.ts` ✅ (已修復編碼和 import)
- `unit_tests/services/AuthService.test.ts` ⚠️ (需要修復導入)
- `unit_tests/services/ProjectService.test.ts` ⚠️ (需要修復導入)
- `unit_tests/services/RiskService.test.ts` ⚠️ (需要修復導入)
- `unit_tests/utils/validation.test.ts` ⚠️ (需要檢查)
- `API_tests/auth.test.ts` ⚠️ (未使用變量)
- `API_tests/project.test.ts` ⚠️ (未使用變量)
- `API_tests/risk.test.ts` ⚠️ (未使用變量)
- `API_tests/test_auth_api.test.ts` ⚠️ (需要檢查)
- `API_tests/test_project_api.test.ts` ⚠️ (需要修復方法調用)

### 源代碼文件
- `desktop/src/main/services/AuthService.ts`
- `desktop/src/main/services/ProjectService.ts`
- `desktop/src/main/services/RiskService.ts`
- `desktop/src/main/repositories/ProjectRepository.ts`
- `desktop/src/main/repositories/index.ts`
- `desktop/src/main/utils/validation.ts` (需要確認是否存在)

### 配置文件
- `desktop/package.json` ✅ (已更新 Jest 配置)
- `desktop/tsconfig.json`
- `desktop/tsconfig.vite.json` ✅ (已創建)
- `tsconfig.json` (根目錄) ✅ (已修復)

---

## 💡 快速命令參考

```bash
# 進入專案目錄
cd c:\Users\fortu\Desktop\Project\Demo

# 運行所有測試
cd desktop
npm test

# 運行特定測試文件
npx jest ../unit_tests/test_auth_service.test.ts

# 查看覆蓋率
npm test -- --coverage

# 只編譯不運行（檢查錯誤）
npx tsc --noEmit

# 查看 Jest 配置
cat desktop/package.json | grep -A 30 '"jest"'
```

---

## 📊 當前測試統計

```
✅ 已修復: 4 個主要配置問題
⚠️ 待修復: 4 個編譯錯誤 + 多個代碼質量問題
📝 測試文件: 11 個
🎯 預期測試數: ~80 個
⏱️ 上次運行時間: 13.924s (編譯失敗)
```

---

## 🔗 相關報告

- 詳細測試報告: `docs/reports/TEST_EXECUTION_REPORT_1.md`
- TypeScript 配置修復: `docs/reports/TSCONFIG_REFERENCE_FIX.md`
- Vite 插件修復: (口頭報告)
- 編碼問題修復: `docs/reports/TEST_FILE_ENCODING_FIX.md`
- 未使用 import 修復: `docs/reports/UNUSED_IMPORT_FIX.md`

---

## ⚠️ 重要提醒

1. **不要直接修改 `node_modules/`** - 所有修改應該在源代碼中
2. **測試前先編譯檢查** - 使用 `npx tsc --noEmit` 快速檢查錯誤
3. **一次修復一類問題** - 避免同時修改太多文件
4. **修復後驗證** - 每次修復後重新運行測試確認
5. **保持備份** - 重要文件修改前先備份（如 `.backup` 後綴）

---

**生成時間**: 2026-03-08
**狀態**: 待修復
**下一步**: 修復優先級 1 的編譯錯誤
