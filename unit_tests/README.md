# 單元測試說明

## 概述

本目錄包含桌面應用的單元測試，使用 Jest 測試框架和 TypeScript。

## 測試文件

- `test_auth_service.test.ts` - 認證服務測試（登錄、登出、Token 管理）
- `test_repositories.test.ts` - 數據訪問層測試（用戶 CRUD、密碼加密、賬號鎖定）

## 運行測試

### 安裝依賴

```bash
cd ../desktop
npm install
```

### 運行所有測試

```bash
npm test
```

### 運行特定測試文件

```bash
npx jest test_auth_service.test.ts
```

### 運行測試並生成覆蓋率報告

```bash
npx jest --coverage
```

### 監視模式（開發時使用）

```bash
npx jest --watch
```

## 測試覆蓋範圍

### 認證服務測試（test_auth_service.test.ts）

- ✅ 正常登錄流程
- ✅ 密碼錯誤處理
- ✅ 用戶名不存在處理
- ✅ 參數驗證（空用戶名、空密碼）
- ✅ 賬號鎖定機制
- ✅ Token 生成和驗證
- ✅ Token 過期處理
- ✅ Token 刷新
- ✅ 登出功能
- ✅ 修改密碼
- ✅ 獲取當前用戶信息

### 數據訪問層測試（test_repositories.test.ts）

- ✅ 創建用戶（密碼加密）
- ✅ 查詢用戶（按用戶名、按角色、按ID）
- ✅ 密碼驗證
- ✅ 修改密碼
- ✅ 登錄失敗次數管理
- ✅ 賬號鎖定和解鎖
- ✅ 更新用戶角色
- ✅ 敏感信息過濾
- ✅ 分頁查詢
- ✅ 獲取所有用戶

## 測試配置

測試配置文件：`jest.config.js`

主要配置：
- 使用 ts-jest 預設
- Node.js 測試環境
- 自動生成覆蓋率報告
- 路徑別名映射（@main, @renderer, @shared）

## 測試數據清理

所有測試都會在執行後自動清理測試數據，確保測試之間互不影響。

## 注意事項

1. 測試使用獨立的測試數據庫
2. 每個測試用例都是獨立的，不依賴其他測試
3. 測試會自動 mock console 輸出以減少噪音
4. 測試環境變量在 `setup.ts` 中配置

## 測試結果示例

```
PASS  unit_tests/test_auth_service.test.ts
  AuthService - 認證服務測試
    登錄功能測試
      ✓ 正常登錄 - 應該返回 Token 和用戶信息 (45ms)
      ✓ 密碼錯誤 - 應該返回錯誤信息 (12ms)
      ✓ 用戶名不存在 - 應該返回錯誤信息 (8ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        3.456s
```

## 持續集成

測試可以集成到 CI/CD 流程中：

```bash
# 在 CI 環境中運行
npm test -- --ci --coverage --maxWorkers=2
```

## 問題排查

### 測試失敗

1. 檢查數據庫連接
2. 確認依賴已安裝
3. 查看測試日誌

### 覆蓋率不足

運行 `npm test -- --coverage` 查看詳細的覆蓋率報告，識別未測試的代碼路徑。

## 貢獻指南

添加新測試時：

1. 遵循現有的測試結構
2. 使用描述性的測試名稱
3. 確保測試獨立性
4. 添加必要的清理邏輯
5. 更新本 README
