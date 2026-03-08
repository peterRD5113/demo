# IPC Handlers 修復報告

## 問題概述

重新生成的 IPC handlers 文件與實際的 Service 方法簽名不匹配，導致大量類型錯誤。

## 主要問題

### 1. AuthService 方法簽名不匹配
- `verifyToken()` 返回 `TokenPayload | null`，不是 `{ success, data }`
- 缺少 `getUserById()` 方法
- `refreshToken()` 方法簽名需要確認

### 2. DocumentService 方法簽名不匹配
- `createDocument()` 參數數量不匹配
- `listDocuments()` 方法不存在
- `getDocumentFilePath()` 參數不匹配

### 3. ProjectService 方法簽名不匹配
- `createProject()` 參數數量不匹配
- `listProjects()` 方法不存在
- `getProjectStats()` 方法不存在

### 4. RiskService 方法簽名不匹配
- 方法名稱不匹配（如 `getAllRiskRules` vs `getAllRules`）
- `getRisk()`, `listRisks()` 等方法不存在
- `getRiskStatistics()` 方法不存在

### 5. Middleware 問題
- `authMiddleware.ts` 中 `verifyToken` 返回類型處理錯誤
- `index.ts` 導出的成員不存在

## 解決方案

需要檢查所有 Service 文件的實際方法簽名，然後重新生成匹配的 handlers。

## 下一步

1. 讀取所有 Service 文件
2. 確認實際的方法簽名和返回類型
3. 重新生成正確的 handlers
