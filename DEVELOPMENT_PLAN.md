# 文檔解析功能開發規劃

## 📋 當前狀態分析

### ✅ 已完成功能
1. **基礎架構**
   - ✅ 用戶認證系統（登錄、登出、密碼修改）
   - ✅ 項目管理（創建、列表、密碼保護）
   - ✅ 文檔導入（創建數據庫記錄）
   - ✅ 文檔列表顯示
   - ✅ 文檔查看頁面（UI 已完成）

2. **數據庫結構**
   - ✅ users 表
   - ✅ projects 表
   - ✅ documents 表
   - ✅ clauses 表
   - ✅ risk_rules 表
   - ✅ risk_matches 表
   - ✅ annotations 表
   - ✅ mentions 表
   - ✅ document_versions 表
   - ✅ clause_templates 表

### ❌ 缺失的核心功能
1. **文檔解析** - 最關鍵的缺失
2. **風險識別**
3. **批註功能**
4. **條款編輯**
5. **版本管理**
6. **條款模板**
7. **@同事功能**
8. **導出功能**

---

## 🎯 開發優先級規劃

### 第一階段：文檔解析（核心功能）⭐⭐⭐⭐⭐

#### 1.1 文檔解析服務
**目標**：實現 TXT/DOCX/PDF 文件解析，提取條款內容

**需要開發**：
- [ ] `DocumentParserService` - 文檔解析服務
  - [ ] TXT 解析器（最簡單，先實現）
  - [ ] DOCX 解析器（使用 mammoth 或 docx 庫）
  - [ ] PDF 解析器（使用 pdf-parse）

**技術方案**：
```typescript
// 解析流程
1. 讀取文件內容
2. 根據文件類型選擇解析器
3. 提取文本內容
4. 識別條款結構（標題、編號、內容）
5. 生成條款編號（1.1, 1.2, 2.1 等）
6. 存入 clauses 表
7. 更新文檔狀態為 'completed'
```

**依賴包**：
```json
{
  "mammoth": "^1.6.0",      // DOCX 解析
  "pdf-parse": "^1.1.1",    // PDF 解析
  "fs": "內置",              // 文件讀取
  "path": "內置"             // 路徑處理
}
```

**數據結構**：
```typescript
interface ParsedClause {
  clause_number: string;    // "1.1", "1.2", "2.1"
  title: string | null;     // 條款標題
  content: string;          // 條款內容
  level: number;            // 層級 (1, 2, 3)
  parent_id: number | null; // 父條款 ID
  order_index: number;      // 排序索引
}
```

**預計時間**：2-3 小時

---

#### 1.2 條款自動編號
**目標**：為解析出的條款生成結構化編號

**編號規則**：
```
第一條 → 1
  第一款 → 1.1
  第二款 → 1.2
    第一項 → 1.2.1
第二條 → 2
  第一款 → 2.1
```

**實現邏輯**：
```typescript
// 根據標題關鍵詞識別層級
- "第X條" → level 1
- "第X款" / "(一)" → level 2
- "第X項" / "1." → level 3
```

**預計時間**：1 小時

---

#### 1.3 目錄生成
**目標**：根據條款結構生成文檔目錄

**實現方式**：
- 前端根據 clauses 數據生成樹形目錄
- 支持點擊跳轉到對應條款

**預計時間**：1 小時

---

### 第二階段：風險識別（核心功能）⭐⭐⭐⭐⭐

#### 2.1 風險規則匹配
**目標**：根據風險規則庫識別風險條款

**需要開發**：
- [ ] `RiskAnalysisService` - 風險分析服務
  - [ ] 關鍵詞匹配
  - [ ] 正則表達式匹配
  - [ ] 風險等級判定

**匹配邏輯**：
```typescript
// 遍歷所有條款
for (const clause of clauses) {
  // 遍歷所有風險規則
  for (const rule of riskRules) {
    // 檢查關鍵詞是否匹配
    if (clause.content.includes(rule.keyword)) {
      // 創建風險匹配記錄
      createRiskMatch({
        clause_id: clause.id,
        rule_id: rule.id,
        risk_level: rule.risk_level,
        matched_text: extractMatchedText(clause.content, rule.keyword),
        suggestion: rule.suggestion
      });
    }
  }
}
```

**預計時間**：2 小時

---

#### 2.2 風險標註顯示
**目標**：在文檔查看頁面顯示風險標註

**UI 實現**：
```typescript
// 條款卡片根據風險等級顯示不同顏色
- 高風險：紅色邊框 + 紅色標籤
- 中風險：黃色邊框 + 黃色標籤
- 低風險：藍色邊框 + 藍色標籤
- 無風險：默認樣式
```

**預計時間**：1 小時

---

### 第三階段：批註功能⭐⭐⭐⭐

#### 3.1 批註 CRUD
**需要開發**：
- [ ] 添加批註
- [ ] 查看批註列表
- [ ] 編輯批註
- [ ] 刪除批註

**API 設計**：
```typescript
// 已有 AnnotationService，需要實現前端調用
- createAnnotation(clauseId, userId, content, type)
- getClauseAnnotations(clauseId, userId)
- updateAnnotation(annotationId, userId, content)
- deleteAnnotation(annotationId, userId)
```

**預計時間**：2 小時

---

#### 3.2 @同事功能
**需要開發**：
- [ ] 批註中 @ 用戶
- [ ] 創建 mention 記錄
- [ ] 待確認清單

**實現邏輯**：
```typescript
// 解析批註內容中的 @username
const mentions = extractMentions(content); // ["@user1", "@user2"]

// 為每個被 @ 的用戶創建 mention 記錄
for (const username of mentions) {
  const user = await getUserByUsername(username);
  await createMention({
    annotation_id: annotationId,
    mentioned_user_id: user.id,
    status: 'pending'
  });
}
```

**預計時間**：2 小時

---

### 第四階段：條款編輯⭐⭐⭐

#### 4.1 條款內容編輯
**需要開發**：
- [ ] 編輯模式切換
- [ ] 保存編輯內容
- [ ] 記錄修改歷史

**預計時間**：2 小時

---

#### 4.2 條款模板插入
**需要開發**：
- [ ] 模板列表顯示
- [ ] 模板預覽
- [ ] 插入到文檔

**預計時間**：1.5 小時

---

### 第五階段：版本管理⭐⭐⭐⭐

#### 5.1 版本保存
**需要開發**：
- [ ] 保存當前文檔快照
- [ ] 記錄變更摘要

**實現邏輯**：
```typescript
// 保存版本時
1. 獲取當前所有條款內容
2. 序列化為 JSON
3. 存入 document_versions 表
4. 記錄版本號、時間、審閱人、變更摘要
```

**預計時間**：2 小時

---

#### 5.2 版本對比與回滾
**需要開發**：
- [ ] 版本列表顯示
- [ ] 版本對比（diff）
- [ ] 回滾到歷史版本

**預計時間**：3 小時

---

### 第六階段：導出功能⭐⭐⭐⭐⭐

#### 6.1 導出 PDF
**需要開發**：
- [ ] 生成帶批註的 PDF
- [ ] 風險條款顏色標註

**技術方案**：
- 使用 `pdfkit` 或 `puppeteer` 生成 PDF
- 將批註以註釋形式添加

**預計時間**：3 小時

---

#### 6.2 導出 DOCX
**需要開發**：
- [ ] 生成帶修訂痕跡的 DOCX
- [ ] 批註以 Word 註釋形式顯示

**技術方案**：
- 使用 `docx` 庫生成 DOCX
- 使用 Track Changes 功能

**預計時間**：3 小時

---

#### 6.3 導出審閱報告
**需要開發**：
- [ ] 風險統計
- [ ] 待確認問題列表
- [ ] 建議修改條款清單

**預計時間**：2 小時

---

## 📊 總體時間估算

| 階段 | 功能 | 預計時間 | 優先級 |
|------|------|---------|--------|
| 第一階段 | 文檔解析 | 4-5 小時 | ⭐⭐⭐⭐⭐ |
| 第二階段 | 風險識別 | 3 小時 | ⭐⭐⭐⭐⭐ |
| 第三階段 | 批註功能 | 4 小時 | ⭐⭐⭐⭐ |
| 第四階段 | 條款編輯 | 3.5 小時 | ⭐⭐⭐ |
| 第五階段 | 版本管理 | 5 小時 | ⭐⭐⭐⭐ |
| 第六階段 | 導出功能 | 8 小時 | ⭐⭐⭐⭐⭐ |
| **總計** | | **27.5-28.5 小時** | |

---

## 🚀 建議開發順序

### 立即開始（今天）
1. **文檔解析 - TXT 解析器**（最簡單，1 小時）
   - 先實現 TXT 文件解析
   - 簡單的條款識別（按行或段落分割）
   - 存入數據庫
   - 測試導入 `測試文檔_簡單合同.txt`

2. **條款顯示**（0.5 小時）
   - 修改 DocumentReviewPage 顯示解析後的條款
   - 測試查看功能

3. **風險識別 - 基礎版**（2 小時）
   - 實現關鍵詞匹配
   - 顯示風險標註
   - 測試風險識別

### 第二天
4. **DOCX 解析器**（2 小時）
5. **PDF 解析器**（2 小時）
6. **批註功能**（4 小時）

### 第三天
7. **條款編輯**（3.5 小時）
8. **版本管理**（5 小時）

### 第四天
9. **導出功能**（8 小時）

---

## 💡 技術決策

### 文檔解析庫選擇
- **TXT**: 內置 `fs.readFileSync`
- **DOCX**: `mammoth` (推薦) 或 `docx`
- **PDF**: `pdf-parse` (推薦)

### 為什麼選擇這些庫？
- `mammoth`: 專門用於提取 DOCX 文本，簡單易用
- `pdf-parse`: 輕量級，適合提取 PDF 文本
- 都是純 JavaScript，無需額外依賴

---

## 📝 下一步行動

**現在開始第一階段：文檔解析 - TXT 解析器**

你同意這個規劃嗎？我們可以：
1. 立即開始實現 TXT 解析器
2. 或者先討論調整規劃
3. 或者先完成其他測試項目

你想怎麼進行？
