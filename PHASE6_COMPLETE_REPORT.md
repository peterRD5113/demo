# Phase 6: 導出功能 - 完成報告

## 實施日期
2024年（實際日期）

## 概述
成功實現了完整的文檔導出系統，支持 PDF、DOCX 和審閱報告三種導出格式，包含批註和風險標註功能。

---

## 1. 後端服務實現

### 1.1 ExportService (ExportService.ts)

**核心功能：**

#### 導出為 PDF
```typescript
static async exportToPDF(
  documentId: number,
  options: ExportOptions
): Promise<string>
```

**功能特性：**
- 使用 `pdfkit` 生成 PDF
- 支持中文字體
- 包含文檔標題
- 風險摘要統計（高/中/低風險數量）
- 條款內容展示
- 風險標註（顏色區分）
- 批註顯示（用戶名、類型、內容）
- 自動分頁處理
- 保存到下載目錄

#### 導出為 DOCX
```typescript
static async exportToDOCX(
  documentId: number,
  options: ExportOptions
): Promise<string>
```

**功能特性：**
- 使用 `docx` 庫生成 Word 文檔
- 標題和章節結構
- 風險摘要（彩色文字）
- 條款編號和內容
- 風險標註（彩色斜體）
- 批註顯示（灰色斜體，縮進）
- 專業排版格式

#### 導出審閱報告
```typescript
static async exportReport(documentId: number): Promise<string>
```

**功能特性：**
- 完整的審閱報告結構
- 生成日期標記
- 風險統計（總數、高/中/低分類）
- 高風險條款清單（詳細列表）
- 待確認問題列表（question 和 issue 類型批註）
- 建議修改條款清單（suggestion 類型批註）
- 專業報告格式

### 1.2 數據獲取

**getDocumentData 方法：**
- 獲取文檔基本信息
- 獲取所有條款
- 獲取風險檢測結果
- 獲取批註信息
- 關聯用戶信息
- 數據結構化處理

**支持的選項：**
```typescript
interface ExportOptions {
  includeAnnotations?: boolean;  // 包含批註
  includeRisks?: boolean;         // 包含風險標註
  format: 'pdf' | 'docx' | 'report';
}
```

---

## 2. IPC 通信層

### 2.1 Export Handlers (exportHandlers.ts)

**註冊的 IPC 頻道：**

| 頻道名稱 | 功能 | 參數 |
|---------|------|------|
| `export:pdf` | 導出 PDF | documentId, includeAnnotations, includeRisks |
| `export:docx` | 導出 DOCX | documentId, includeAnnotations, includeRisks |
| `export:report` | 導出審閱報告 | documentId |

**安全特性：**
- Token 認證保護
- 統一錯誤處理
- 標準化響應格式

**用戶體驗：**
- 導出完成後自動打開文件所在目錄
- 使用 `shell.showItemInFolder()` 定位文件

---

## 3. 前端實現

### 3.1 導出對話框 (ExportModal.tsx)

**主要組件：**

#### 文檔信息顯示
- 文檔名稱展示
- 灰色背景卡片

#### 導出選項
- 包含批註（Checkbox）
- 包含風險標註（Checkbox）
- 默認全選

#### 導出格式按鈕

**1. 導出為 PDF**
- 紅色主題按鈕
- PDF 圖標
- 標題：導出為 PDF
- 描述：適合打印和分享，保留格式和樣式

**2. 導出為 DOCX**
- 藍色主題按鈕
- Word 圖標
- 標題：導出為 DOCX
- 描述：可編輯的 Word 文檔，支持進一步修改

**3. 導出審閱報告**
- 綠色主題按鈕
- 文本圖標
- 標題：導出審閱報告
- 描述：包含風險統計、問題列表和修改建議

#### 提示信息
- 藍色提示框
- 說明文件保存位置
- 自動打開文件夾提示

### 3.2 DocumentReviewPage 集成

**新增功能：**
- 導出按鈕（工具欄）
- 導出對話框觸發
- 與版本管理按鈕並列

**UI 布局：**
```tsx
<Space>
  <Button icon={<DownloadOutlined />} onClick={handleExport}>
    導出
  </Button>
  <Button type="primary" icon={<HistoryOutlined />} onClick={handleVersionManagement}>
    版本管理
  </Button>
</Space>
```

---

## 4. 樣式實現

### 4.1 ExportModal.css

**主要樣式：**

#### 對話框內容
```css
.export-modal-content {
  padding: 16px 0;
}
```

#### 文檔信息
```css
.document-info {
  margin-bottom: 24px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}
```

#### 格式按鈕
```css
.export-button {
  height: auto;
  padding: 16px;
  text-align: left;
}

.export-button .button-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
```

#### 顏色主題
- PDF 按鈕：紅色 (#ff4d4f)
- DOCX 按鈕：藍色 (#1890ff)
- 報告按鈕：綠色 (#52c41a)

#### 響應式設計
- 移動端字體調整
- 靈活布局

---

## 5. 功能特性

### 5.1 PDF 導出
- ✅ 專業 PDF 格式
- ✅ 文檔標題居中
- ✅ 風險摘要統計
- ✅ 條款編號和內容
- ✅ 風險顏色標註（紅/橙/藍）
- ✅ 批註顯示（用戶、類型、內容）
- ✅ 自動分頁
- ✅ 保存到下載目錄

### 5.2 DOCX 導出
- ✅ Word 文檔格式
- ✅ 標題和章節結構
- ✅ 風險摘要（彩色文字）
- ✅ 條款格式化
- ✅ 風險標註（彩色斜體）
- ✅ 批註顯示（灰色斜體）
- ✅ 可編輯格式

### 5.3 審閱報告導出
- ✅ 完整報告結構
- ✅ 生成日期
- ✅ 風險統計（總數、分類）
- ✅ 高風險條款清單
- ✅ 待確認問題列表
- ✅ 建議修改條款清單
- ✅ 專業報告格式

### 5.4 用戶體驗
- ✅ 直觀的導出對話框
- ✅ 清晰的選項說明
- ✅ 加載狀態提示
- ✅ 成功/失敗消息
- ✅ 自動打開文件位置

---

## 6. 技術實現

### 6.1 依賴庫

**PDF 生成：**
```json
"pdfkit": "^0.15.0"
```

**DOCX 生成：**
```json
"docx": "^8.5.0"
```

### 6.2 文件命名

**命名規則：**
```typescript
const safeName = fileName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
const timestamp = new Date().getTime();
const outputPath = `${safeName}_${timestamp}.${extension}`;
```

**特點：**
- 安全的文件名（移除特殊字符）
- 時間戳避免重名
- 支持中文文件名

### 6.3 文件保存位置

```typescript
const downloadsPath = app.getPath('downloads');
```

**自動定位：**
- Windows: `C:\Users\用戶名\Downloads\`
- macOS: `/Users/用戶名/Downloads/`
- Linux: `/home/用戶名/Downloads/`

---

## 7. 數據處理

### 7.1 條款數據獲取

```sql
SELECT id, clause_number, content 
FROM clauses 
WHERE document_id = ? 
ORDER BY id
```

### 7.2 風險數據獲取

```sql
SELECT risk_level, description 
FROM risk_detections 
WHERE clause_id = ? 
ORDER BY CASE risk_level 
  WHEN 'high' THEN 1 
  WHEN 'medium' THEN 2 
  WHEN 'low' THEN 3 
END 
LIMIT 1
```

### 7.3 批註數據獲取

```sql
SELECT a.id, u.display_name, a.type, a.content, a.created_at
FROM annotations a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.clause_id = ? AND a.status = 'active'
ORDER BY a.created_at
```

---

## 8. 安全性

### 8.1 認證與授權
- ✅ Token 認證
- ✅ 用戶身份驗證
- ✅ 操作權限檢查

### 8.2 文件安全
- ✅ 安全的文件名處理
- ✅ 防止路徑遍歷
- ✅ 文件權限控制

### 8.3 錯誤處理
- ✅ 統一錯誤處理
- ✅ 友好錯誤提示
- ✅ 異常捕獲

---

## 9. 導出示例

### 9.1 PDF 導出示例

**文檔結構：**
```
合同審閱文檔
================

風險摘要
--------
高風險: 2  中風險: 3  低風險: 1

文檔內容
--------

1. 合同雙方
甲方：XXX公司
乙方：YYY公司

⚠ 風險: 未明確雙方法定代表人信息

💬 張三 (question): 是否需要補充法人信息？

2. 合同期限
...
```

### 9.2 DOCX 導出示例

**Word 文檔結構：**
- 標題（居中、大字體）
- 風險摘要（彩色文字）
- 文檔內容（章節結構）
- 條款（編號 + 內容）
- 風險標註（彩色斜體）
- 批註（灰色斜體、縮進）

### 9.3 審閱報告示例

**報告結構：**
```
合同審閱文檔 - 審閱報告
生成日期: 2024-XX-XX XX:XX:XX

一、風險統計
總風險數: 6
高風險: 2
中風險: 3
低風險: 1

二、高風險條款清單
1. 條款 1: 未明確雙方法定代表人信息
   內容: 甲方：XXX公司...

2. 條款 5: 違約責任條款不明確
   內容: 如一方違約...

三、待確認問題列表
1. 張三: 是否需要補充法人信息？
2. 李四: 合同期限是否合理？

四、建議修改條款清單
1. 條款 3: 建議明確付款時間節點
2. 條款 7: 建議增加爭議解決條款
```

---

## 10. 待優化項目

### 10.1 功能增強
- [ ] 自定義導出模板
- [ ] 批量導出多個文檔
- [ ] 導出格式預覽
- [ ] 導出歷史記錄

### 10.2 格式優化
- [ ] PDF 添加頁眉頁腳
- [ ] PDF 添加目錄
- [ ] DOCX 添加樣式模板
- [ ] 支持更多導出格式（HTML、Markdown）

### 10.3 性能優化
- [ ] 大文檔分塊處理
- [ ] 導出進度顯示
- [ ] 後台導出任務
- [ ] 導出緩存機制

---

## 11. 測試建議

### 11.1 單元測試
```typescript
describe('ExportService', () => {
  test('should export PDF with annotations', async () => {
    // 測試 PDF 導出
  });
  
  test('should export DOCX with risks', async () => {
    // 測試 DOCX 導出
  });
  
  test('should generate review report', async () => {
    // 測試審閱報告生成
  });
});
```

### 11.2 集成測試
- PDF 導出流程
- DOCX 導出流程
- 審閱報告生成流程
- 文件保存和打開

### 11.3 UI 測試
- 導出對話框顯示
- 選項切換
- 按鈕交互
- 加載狀態

---

## 12. 編譯狀態

### 12.1 編譯結果
```
✓ Main process compiled successfully
✓ Renderer process compiled successfully
✓ No TypeScript errors
✓ No linting errors
```

### 12.2 構建產物
- `dist/main/` - 主進程代碼
- `dist/renderer/` - 渲染進程代碼
- `dist/renderer/index.html` - 入口頁面

---

## 13. 文檔更新

### 13.1 API 文檔
- ✅ IPC 頻道文檔
- ✅ 數據結構定義
- ✅ 導出選項說明

### 13.2 用戶手冊
- [ ] 導出功能使用指南
- [ ] 導出格式說明
- [ ] 常見問題解答

---

## 總結

Phase 6（導出功能）已成功完成，實現了完整的文檔導出系統。主要成果包括：

1. ✅ 完整的導出服務（PDF、DOCX、報告）
2. ✅ 專業的文檔格式化
3. ✅ 風險和批註集成
4. ✅ 直觀的導出對話框
5. ✅ 自動文件定位
6. ✅ 完整的錯誤處理
7. ✅ 編譯成功，無錯誤

系統現在具備了專業的文檔導出能力，用戶可以：
- 導出帶批註和風險標註的 PDF
- 導出可編輯的 Word 文檔
- 生成完整的審閱報告
- 自定義導出選項
- 快速定位導出文件

**所有核心功能（Phase 1-6）已全部完成！**

---

## 項目完成度總覽

- ✅ Phase 1: 項目與文檔管理
- ✅ Phase 2: 文檔解析與風險識別
- ✅ Phase 3: 註解功能
- ✅ Phase 4: 條款編輯（已集成在 Phase 3）
- ✅ Phase 5: 版本管理
- ✅ **Phase 6: 導出功能** ← 剛完成

**項目狀態：核心功能開發完成，可進入測試和優化階段。**
