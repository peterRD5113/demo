# API 功能測試說明

## 概述

本目錄包含桌面應用的 API 功能測試，測試 IPC 通信和業務邏輯接口。

## 測試文件

- `test_auth_api.test.ts` - 認證接口測試（登錄、登出、Token、權限）
- `test_project_api.test.ts` - 項目管理接口測試（CRUD、權限控制、數據隔離）

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
npx jest test_auth_api.test.ts
```

### 運行測試並生成覆蓋率報告

```bash
npx jest --coverage
```

## 測試覆蓋範圍

### 認證接口測試（test_auth_api.test.ts）

#### POST /api/auth/login
- ✅ 正常登錄（200）
- ✅ 密碼錯誤（401）
- ✅ 用戶名不存在（401）
- ✅ 缺少參數（400）
- ✅ 賬號鎖定（403）
- ✅ 連續失敗 5 次鎖定機制

#### POST /api/auth/logout
- ✅ 正常登出（200）
- ✅ 無效用戶ID（400）

#### POST /api/auth/refresh
- ✅ 有效 Refresh Token（200）
- ✅ 無效 Token（401）
- ✅ 缺少 Token（400）
- ✅ 過期 Token（401）

#### POST /api/auth/change-password
- ✅ 正常修改密碼（200）
- ✅ 原密碼錯誤（400）
- ✅ 新密碼格式錯誤（400）
- ✅ 無效用戶ID（404）

#### GET /api/auth/me
- ✅ 有效 Token（200）
- ✅ 無效 Token（401）
- ✅ Token 過期（401）
- ✅ 缺少 Token（401）

#### 權限驗證
- ✅ 管理員訪問管理員接口
- ✅ 普通用戶訪問管理員接口（403）
- ✅ 查看者訪問編輯接口（403）

#### 安全性測試
- ✅ 密碼 bcrypt 加密
- ✅ 響應不包含密碼哈希
- ✅ Token 包含過期時間
- ✅ 不同用戶 Token 不同

### 項目管理接口測試（test_project_api.test.ts）

#### POST /api/projects
- ✅ 正常創建項目（200）
- ✅ 缺少必填字段（400）
- ✅ 未登錄創建（401）

#### GET /api/projects
- ✅ 查詢自己的項目列表（200）
- ✅ 分頁查詢（200）
- ✅ 未登錄查詢（401）

#### GET /api/projects/:id
- ✅ 查詢自己的項目（200）
- ✅ 查詢不存在的項目（404）
- ✅ 查詢其他用戶的項目（403）- IDOR 防護
- ✅ 管理員查詢所有項目（200）

#### PUT /api/projects/:id
- ✅ 更新自己的項目（200）
- ✅ 更新不存在的項目（404）
- ✅ 更新其他用戶的項目（403）

#### DELETE /api/projects/:id
- ✅ 刪除自己的項目（200）- 邏輯刪除
- ✅ 刪除不存在的項目（404）
- ✅ 刪除其他用戶的項目（403）

#### 數據隔離測試
- ✅ 用戶只能看到自己的項目
- ✅ 查詢時必須過濾 user_id

#### 參數驗證測試
- ✅ 項目名稱為空（400）
- ✅ 項目名稱過長（400）

## 測試配置

測試配置文件：`jest.config.js`

主要配置：
- 使用 ts-jest 預設
- Node.js 測試環境
- 自動生成覆蓋率報告
- 路徑別名映射
- 測試超時：15 秒

## HTTP 狀態碼說明

| 狀態碼 | 說明 | 使用場景 |
|--------|------|---------|
| 200 | 成功 | 請求成功處理 |
| 400 | 請求參數錯誤 | 缺少必填字段、格式錯誤 |
| 401 | 未認證 | 未登錄、Token 無效/過期 |
| 403 | 無權限 | 賬號鎖定、權限不足、訪問他人資源 |
| 404 | 資源不存在 | 查詢的資源不存在 |
| 500 | 服務器錯誤 | 內部錯誤 |

## 安全測試重點

### 1. 認證安全
- ✅ 密碼使用 bcrypt 加密
- ✅ Token 包含過期時間
- ✅ 響應不包含敏感信息

### 2. 授權安全
- ✅ 路由級鑑權（角色檢查）
- ✅ 對象級授權（IDOR 防護）
- ✅ 數據隔離（用戶只能訪問自己的數據）

### 3. 輸入驗證
- ✅ 參數完整性檢查
- ✅ 參數格式驗證
- ✅ SQL 注入防護（使用參數化查詢）

## 測試數據清理

所有測試都會在執行後自動清理測試數據，確保測試之間互不影響。

## 測試結果示例

```
PASS  API_tests/test_auth_api.test.ts
  Auth API - 認證接口測試
    POST /api/auth/login - 登錄接口
      ✓ 正常登錄 - 應該返回 200 和 Token (52ms)
      ✓ 密碼錯誤 - 應該返回 401 錯誤 (15ms)
      ✓ 用戶名不存在 - 應該返回 401 錯誤 (10ms)
      ...

PASS  API_tests/test_project_api.test.ts
  Project API - 項目管理接口測試
    POST /api/projects - 創建項目
      ✓ 正常創建項目 - 應該返回 200 和項目信息 (28ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        4.123s
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
4. 檢查權限配置

### 超時錯誤

如果測試超時，可以增加超時時間：

```javascript
// jest.config.js
testTimeout: 30000  // 30 秒
```

## 貢獻指南

添加新測試時：

1. 遵循現有的測試結構
2. 測試所有 HTTP 狀態碼
3. 測試權限控制
4. 測試數據隔離
5. 添加必要的清理邏輯
6. 更新本 README
