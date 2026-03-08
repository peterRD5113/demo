# 全面修復報告

**日期**: 2026-03-08  
**狀態**: 部分完成，仍有重大問題需要解決

---

## ✅ 已完成的修復

### 1. 服務類導入錯誤（優先級 1.1）
**問題**: 測試文件導入了類名，但服務文件導出的是實例

**修復**:
- `unit_tests/services/AuthService.test.ts` - 改為導入 `authService` 實例
- `unit_tests/services/ProjectService.test.ts` - 改為導入 `projectService` 實例  
- `unit_tests/services/RiskService.test.ts` - 改為導入 `riskService` 實例

### 2. Repository 方法名稱（優先級 1.2）
**問題**: 測試調用 `projectRepository.create()`，但實際方法名是 `createProject()`

**修復**:
- `API_tests/test_project_api.test.ts` - 批量替換為 `createProject()`
- `unit_tests/services/ProjectService.test.ts` - 修復方法名

### 3. Validation 測試重寫（優先級 1.3）
**問題**: 測試期望驗證函數返回布爾值，但實際是拋出錯誤

**修復**:
- 完全重寫 `unit_tests/utils/validation.test.ts`
- 改用 `expect(() => ...).toThrow()` 模式
- 移除不存在的 `validateProjectName` 函數

### 4. Repository 別名（優先級 1.4）
**問題**: `riskRepository` 不存在，實際是 `riskRuleRepository`

**修復**:
- 在 `desktop/src/main/repositories/index.ts` 添加別名導出

### 5. 未使用變量清理（優先級 2）
**修復**:
- `API_tests/auth.test.ts` - 添加 `_` 前綴
- `API_tests/project.test.ts` - 添加 `_` 前綴
- `API_tests/risk.test.ts` - 添加 `_` 前綴

---

## ❌ 仍存在的重大問題

### 問題 1: 文件編碼損壞（阻塞級）

**影響文件**:
- `API_tests/auth.test.ts`
- `API_tests/project.test.ts`
- `API_tests/risk.test.ts`
- `unit_tests/services/ProjectService.test.ts`
- 以及其他多個測試文件

**症狀**:
```
TS1002: Unterminated string literal
```

**原因**: 中文字符編碼損壞，導致字符串未正確終止

**示例**:
```typescript
// 損壞的代碼
it('?�該?��??��??��?�?, () => {  // 應該是 "應該驗證有效的項目名稱"
```

**修復方案**: 需要重新保存這些文件為 UTF-8 編碼

---

### 問題 2: 路徑別名無法解析（阻塞級）

**錯誤信息**:
```
TS2307: Cannot find module '@main/repositories' or its corresponding type declarations.
TS2307: Cannot find module '@shared/types' or its corresponding type declarations.
TS2307: Cannot find module '@main/utils/validation' or its corresponding type declarations.
```

**原因**: Jest 配置中的 `moduleNameMapper` 可能不完整或路徑不正確

**當前配置** (`desktop/package.json`):
```json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@main/(.*)$": "<rootDir>/src/main/$1",
  "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
  "^@shared/(.*)$": "<rootDir>/src/shared/$1",
  "^@preload/(.*)$": "<rootDir>/src/preload/$1"
}
```

**可能的問題**: 
- 測試文件在 `../unit_tests/` 和 `../API_tests/`，不在 `desktop/` 內
- `<rootDir>` 可能指向錯誤的目錄

**修復方案**: 需要調整 Jest 配置或測試文件位置

---

### 問題 3: API 不匹配（高優先級）

#### 3.1 ProjectRepository.createProject() 參數不匹配

**測試期望**:
```typescript
projectRepository.createProject({
  name: '測試項目',
  description: '描述',
  user_id: userId
})
```

**實際簽名**:
```typescript
createProject(
  name: string,
  userId: number,
  description?: string,
  password?: string
): number
```

**影響**: `API_tests/test_project_api.test.ts` 中的所有測試

---

#### 3.2 AuthService API 不匹配

**測試期望**:
```typescript
result.code  // 期望有 code 屬性
result.msg   // 期望有 msg 屬性
```

**實際返回**:
```typescript
interface LoginResponse {
  success: boolean;
  message: string;
  data?: { user: User; token: string };
}
```

**影響**: `unit_tests/services/AuthService.test.ts`

---

#### 3.3 ProjectService API 不匹配

**測試調用**:
```typescript
projectService.createProject(1, 'Test Project', 'Test Description')
```

**實際簽名**: 可能不同

**測試期望**:
```typescript
projectService.getProjectList(userId, page, pageSize)
```

**實際方法**: 可能是 `getProject()` 或其他名稱

**影響**: `unit_tests/services/ProjectService.test.ts`

---

#### 3.4 RiskService 方法不存在

**測試調用的方法**:
- `riskRepository.getAllRules()`
- `riskRepository.createRisk()`
- `riskService.analyzeDocument()`
- `riskService.getRisksByDocument()`
- `riskService.updateRiskLevel()`

**問題**: 這些方法在實際代碼中可能不存在或名稱不同

**影響**: `unit_tests/services/RiskService.test.ts`

---

### 問題 4: 測試文件結構問題（中優先級）

#### 4.1 變量作用域問題

**錯誤**:
```typescript
TS2304: Cannot find name 'testUserIds'.
TS2304: Cannot find name 'testProjectIds'.
```

**原因**: 這些變量在某些測試中未定義

---

#### 4.2 重複聲明

**錯誤**:
```typescript
TS2451: Cannot redeclare block-scoped variable 'response'.
TS2451: Cannot redeclare block-scoped variable 'projectId'.
```

**原因**: 在同一作用域內多次聲明相同變量

---

## 📊 測試統計

```
測試套件: 11 個失敗，0 個通過
測試用例: 0 個執行（全部編譯失敗）
編譯錯誤: 數百個
```

---

## 🔧 建議的修復順序

### 階段 1: 修復編碼問題（最高優先級）
1. 將所有測試文件重新保存為 UTF-8 編碼
2. 確保中文字符正確顯示

### 階段 2: 修復路徑別名（阻塞級）
1. 調整 Jest 配置中的 `moduleNameMapper`
2. 或者將測試文件移動到 `desktop/` 目錄內

### 階段 3: 修復 API 不匹配（高優先級）
1. 檢查所有服務和 Repository 的實際 API
2. 更新測試以匹配實際實現
3. 或者修改實現以匹配測試期望

### 階段 4: 修復測試結構問題（中優先級）
1. 修復變量作用域問題
2. 消除重複聲明
3. 確保測試邏輯正確

---

## 💡 關鍵建議

### 1. 編碼標準化
**建議**: 在項目根目錄添加 `.editorconfig` 文件：
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,js,json}]
indent_style = space
indent_size = 2
```

### 2. 測試文件位置
**當前結構**:
```
project-root/
├── desktop/          # 源代碼
├── unit_tests/       # 單元測試（在外面）
└── API_tests/        # API 測試（在外面）
```

**建議結構**:
```
project-root/
└── desktop/
    ├── src/
    └── tests/
        ├── unit/
        └── api/
```

### 3. API 設計一致性
**建議**: 統一所有服務的響應格式：
```typescript
interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: number;  // HTTP 狀態碼
}
```

---

## 📝 下一步行動

1. **立即**: 修復文件編碼問題
2. **立即**: 修復路徑別名配置
3. **短期**: 統一 API 設計並更新測試
4. **中期**: 重構測試文件結構
5. **長期**: 建立 CI/CD 流程確保測試持續通過

---

## 🎯 預期結果

修復所有問題後，應該看到：
```
Test Suites: X passed, X total
Tests:       ~80 passed, ~80 total
Snapshots:   0 total
Time:        ~5-10s
Coverage:    >70%
```

---

**生成時間**: 2026-03-08  
**修復進度**: 30% 完成  
**預計剩餘工作**: 8-12 小時
