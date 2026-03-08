# 測試套件完整報告

## 測試覆蓋範圍

### 單元測試 (Unit Tests) - 20+ 測試用例

#### 1. 認證服務測試 (`test_auth_service.test.ts`)
- ✅ 用戶註冊功能
  - 成功註冊新用戶
  - 拒絕重複用戶名
  - 驗證密碼加密
- ✅ 用戶登錄功能
  - 成功登錄並返回 token
  - 拒絕錯誤密碼
  - 拒絕不存在的用戶
  - 賬戶鎖定機制（5次失敗後鎖定）
- ✅ Token 驗證功能
  - 驗證有效 token
  - 拒絕無效 token
  - 拒絕過期 token

#### 2. 項目管理服務測試 (`test_project_service.test.ts`)
- ✅ 項目 CRUD 操作
  - 創建新項目
  - 獲取項目列表
  - 獲取單個項目詳情
  - 更新項目信息
  - 刪除項目
- ✅ 權限控制
  - 用戶只能訪問自己的項目
  - 拒絕訪問其他用戶的項目
- ✅ 數據驗證
  - 驗證必填字段
  - 驗證數據格式

#### 3. 文檔處理服務測試 (`test_document_service.test.ts`)
- ✅ 文檔上傳功能
  - 支持 PDF 文檔上傳
  - 支持 DOCX 文檔上傳
  - 文件大小限制驗證
  - 文件類型驗證
- ✅ 文檔解析功能
  - PDF 文本提取
  - DOCX 文本提取
  - 處理損壞的文檔
- ✅ 文檔管理
  - 獲取文檔列表
  - 刪除文檔
  - 文檔歸屬驗證

#### 4. 風險分析服務測試 (`test_risk_analysis.test.ts`)
- ✅ 風險識別功能
  - 識別付款條款風險
  - 識別違約責任風險
  - 識別知識產權風險
  - 識別保密條款風險
- ✅ 風險評分功能
  - 計算風險等級（高/中/低）
  - 生成風險報告
- ✅ 風險建議生成
  - 針對不同風險類型提供建議
  - 生成完整風險分析報告

### API 功能測試 (API Tests) - 15+ 測試用例

#### 1. 認證 API 測試 (`test_auth_api.test.ts`)
- ✅ POST /api/auth/register
  - 成功註冊返回 201
  - 重複用戶名返回 409
  - 缺少必填字段返回 400
- ✅ POST /api/auth/login
  - 成功登錄返回 200 和 token
  - 錯誤密碼返回 401
  - 不存在用戶返回 401
  - 賬戶鎖定返回 403
- ✅ POST /api/auth/logout
  - 成功登出返回 200
  - 未認證返回 401
- ✅ GET /api/auth/validate
  - 有效 token 返回 200
  - 無效 token 返回 401

#### 2. 項目管理 API 測試 (`test_project_api.test.ts`)
- ✅ POST /api/projects
  - 成功創建項目返回 201
  - 未認證返回 401
  - 缺少必填字段返回 400
- ✅ GET /api/projects
  - 成功獲取項目列表返回 200
  - 未認證返回 401
  - 只返回當前用戶的項目
- ✅ GET /api/projects/:id
  - 成功獲取項目詳情返回 200
  - 項目不存在返回 404
  - 無權訪問返回 403
- ✅ PUT /api/projects/:id
  - 成功更新項目返回 200
  - 無權更新返回 403
- ✅ DELETE /api/projects/:id
  - 成功刪除項目返回 200
  - 無權刪除返回 403

#### 3. 文檔管理 API 測試 (`test_document_api.test.ts`)
- ✅ POST /api/documents/upload
  - 成功上傳文檔返回 201
  - 文件類型不支持返回 400
  - 文件過大返回 413
- ✅ GET /api/documents
  - 成功獲取文檔列表返回 200
  - 支持分頁查詢
- ✅ DELETE /api/documents/:id
  - 成功刪除文檔返回 200
  - 無權刪除返回 403

#### 4. 風險分析 API 測試 (`test_risk_api.test.ts`)
- ✅ POST /api/risk/analyze
  - 成功分析文檔返回 200
  - 返回風險列表和評分
  - 文檔不存在返回 404
- ✅ GET /api/risk/report/:documentId
  - 成功獲取風險報告返回 200
  - 包含完整風險分析結果

## 測試執行方式

### 運行所有測試
```bash
cd desktop
npm test
```

### 只運行單元測試
```bash
npm run test:unit
```

### 只運行 API 測試
```bash
npm run test:api
```

### 監視模式（開發時使用）
```bash
npm run test:watch
```

### 使用項目根目錄的腳本
```bash
bash run_tests.sh
```

## 測試覆蓋率目標

- **單元測試**: 20+ 測試用例 ✅
- **API 測試**: 15+ 測試用例 ✅
- **代碼覆蓋率**: 目標 > 70%
- **關鍵路徑覆蓋**: 100%

## 測試環境配置

### 環境變量
- `NODE_ENV=test` - 測試環境標識
- `JWT_SECRET=test-secret-key` - JWT 密鑰（測試用）

### Mock 數據
- 使用內存數據庫進行測試
- 每個測試用例獨立的數據環境
- 測試後自動清理數據

## 持續集成

測試套件已配置為可在 CI/CD 流程中自動執行：
- 所有測試必須通過才能合併代碼
- 自動生成測試覆蓋率報告
- 失敗測試會阻止部署

## 測試維護

### 添加新測試
1. 在對應目錄創建 `*.test.ts` 文件
2. 遵循現有測試結構
3. 確保測試獨立且可重複執行

### 測試最佳實踐
- 每個測試用例只測試一個功能點
- 使用描述性的測試名稱
- 測試正常流程和異常情況
- 保持測試代碼簡潔清晰
