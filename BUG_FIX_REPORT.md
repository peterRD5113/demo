# Bug 修復報告

## 日期：2025-03-09

---

## 🐛 問題 1：模塊導入錯誤 - `Cannot find module '../database'`

### 問題描述
應用啟動時報錯：
```
Failed to initialize application: Error: Cannot find module '../database'
Require stack:
- C:\Users\fortu\Desktop\Project\Demo\desktop\dist\main\services\AnnotationService.js
```

### 根本原因
1. `AnnotationService.ts` 使用了錯誤的導入路徑：`import { db } from '@main/database'`
2. `auditMiddleware.ts` 使用了不存在的導出：`import { dbConnection } from '@main/database/connection'`
3. 實際的數據庫模塊在 `../database/connection` 並且只導出 `getDb()` 函數，不導出 `db` 變量

### 修復方案
✅ **已修復**

1. **AnnotationService.ts**：
   - 修改導入：`import { getDb } from '../database/connection'`
   - 替換所有 `db.` 為 `getDb().`

2. **auditMiddleware.ts**：
   - 修改導入：`import { getDb } from '../database/connection'`
   - 替換 `dbConnection.getDatabase()` 為 `getDb()`

### 驗證步驟
```bash
# 1. 清理舊的編譯文件
Remove-Item "desktop\dist" -Recurse -Force

# 2. 重新編譯
cd desktop
npm start
```

---

## 🐛 問題 2：文檔上傳後狀態顯示 `failed`

### 問題描述
用戶上傳文檔後，狀態立即顯示為 `failed`，點擊 View 進入後顯示多個錯誤且無法返回。

### 可能原因分析

#### 原因 1：文檔解析失敗
文檔上傳後會自動執行兩個階段：
1. **階段 1**：文檔解析（提取條款）
2. **階段 2**：風險識別

如果階段 1 失敗，狀態會變成 `failed`，錯誤信息存儲在 `error_message` 字段。

**檢查點**：
- 文件格式是否支持（PDF, DOCX, TXT）
- 文件是否損壞
- 文件編碼是否正確（TXT 文件）
- DocumentParserService 是否正常工作

#### 原因 2：數據庫查詢錯誤
由於之前的模塊導入錯誤，可能導致：
- 條款數據未正確保存
- 風險數據查詢失敗
- 顯示多個錯誤提示

#### 原因 3：前端錯誤處理不當
`DocumentReviewPage` 可能沒有正確處理：
- 文檔狀態為 `failed` 的情況
- 條款列表為空的情況
- 錯誤信息的顯示

### 修復方案

#### 方案 1：改進錯誤顯示（立即實施）

**修改 `DocumentReviewPage.tsx`**：

```typescript
// 在組件頂部添加錯誤狀態處理
useEffect(() => {
  if (document && document.status === 'failed') {
    Modal.error({
      title: '文檔處理失敗',
      content: document.error_message || '文檔解析失敗，請重新上傳',
      onOk: () => navigate(`/project/${projectId}`)
    });
  }
}, [document]);

// 在條款列表為空時顯示友好提示
{clauses.length === 0 && !loading && (
  <Empty
    description={
      document?.status === 'failed' 
        ? '文檔解析失敗，無法顯示條款'
        : '暫無條款數據'
    }
  />
)}
```

#### 方案 2：添加返回按鈕（立即實施）

在頁面頭部添加返回按鈕：

```typescript
<Button 
  icon={<ArrowLeftOutlined />}
  onClick={() => navigate(`/project/${projectId}`)}
>
  返回文檔列表
</Button>
```

#### 方案 3：改進文檔解析錯誤處理（建議實施）

**修改 `DocumentParserService.ts`**：

```typescript
// 添加更詳細的錯誤信息
catch (error) {
  console.error('Parse document failed:', error);
  return {
    success: false,
    message: `解析失敗: ${error.message}`,
    clauseCount: 0
  };
}
```

#### 方案 4：添加重新解析功能（可選）

在文檔列表頁面添加「重新解析」按鈕：

```typescript
{record.status === 'failed' && (
  <Button
    type="link"
    icon={<ReloadOutlined />}
    onClick={() => handleReparse(record.id)}
  >
    重新解析
  </Button>
)}
```

### 調試步驟

1. **檢查控制台日誌**：
   ```
   開始解析文檔 ID: X
   文檔解析失敗: [錯誤信息]
   ```

2. **檢查數據庫**：
   ```sql
   SELECT id, filename, status, error_message 
   FROM documents 
   WHERE status = 'failed';
   ```

3. **測試不同文件類型**：
   - 上傳簡單的 TXT 文件
   - 上傳標準的 PDF 文件
   - 上傳 DOCX 文件

4. **檢查文件路徑**：
   - 確認文件路徑正確
   - 確認文件可讀取

---

## 🔧 建議的測試流程

### 1. 模塊導入修復驗證
```bash
# 清理並重新編譯
cd desktop
Remove-Item dist -Recurse -Force
npm start

# 預期結果：應用正常啟動，無模塊錯誤
```

### 2. 文檔上傳測試
```bash
# 測試步驟：
1. 登錄系統
2. 創建或選擇項目
3. 上傳測試文檔（使用 測試文檔_簡單合同.txt）
4. 觀察狀態變化：pending → processing → completed
5. 點擊 View 查看文檔詳情
6. 確認條款列表正常顯示
7. 確認風險列表正常顯示
```

### 3. 錯誤處理測試
```bash
# 測試步驟：
1. 上傳損壞的文件
2. 確認狀態變為 failed
3. 點擊 View 查看錯誤信息
4. 確認有返回按鈕
5. 確認錯誤信息清晰易懂
```

---

## 📊 優先級評估

| 問題 | 嚴重程度 | 優先級 | 狀態 |
|------|---------|--------|------|
| 模塊導入錯誤 | 🔴 阻塞 | P0 | ✅ 已修復 |
| 文檔狀態 failed | 🟡 高 | P1 | 🔄 調查中 |
| 錯誤顯示不友好 | 🟢 中 | P2 | 📝 待修復 |
| 缺少返回按鈕 | 🟢 中 | P2 | 📝 待修復 |

---

## 🎯 下一步行動

### 立即執行（今天）
1. ✅ 修復模塊導入錯誤
2. 🔄 重新編譯並測試應用啟動
3. 📝 測試文檔上傳功能
4. 📝 記錄具體的錯誤信息

### 短期執行（本週）
1. 改進 DocumentReviewPage 錯誤處理
2. 添加返回按鈕
3. 改進錯誤提示信息
4. 添加重新解析功能

### 中期執行（下週）
1. 完善文檔解析服務
2. 添加更詳細的日誌
3. 改進錯誤恢復機制
4. 編寫自動化測試

---

## 📝 修復記錄

### 2025-03-09 14:30
- ✅ 修復 `AnnotationService.ts` 模塊導入錯誤
- ✅ 修復 `auditMiddleware.ts` 模塊導入錯誤
- ✅ 替換所有 `db.` 為 `getDb().`
- ✅ 替換 `dbConnection.getDatabase()` 為 `getDb()`

### 待修復
- 📝 改進 DocumentReviewPage 錯誤處理
- 📝 添加返回按鈕
- 📝 調查文檔解析失敗的具體原因

---

## 🔍 需要收集的信息

為了更好地診斷文檔上傳問題，請提供：

1. **控制台日誌**：
   - 上傳文檔時的完整日誌
   - 特別是「開始解析文檔」和「文檔解析失敗」之間的信息

2. **測試文件信息**：
   - 文件類型（PDF/DOCX/TXT）
   - 文件大小
   - 文件內容概要

3. **錯誤截圖**：
   - 文檔列表頁面的狀態顯示
   - 點擊 View 後的錯誤信息
   - 瀏覽器控制台的錯誤信息

4. **數據庫狀態**：
   - documents 表中 failed 記錄的 error_message
   - clauses 表中是否有對應的條款記錄

---

**報告生成時間**：2025-03-09 14:35  
**報告作者**：AI Assistant  
**版本**：1.0
