# Phase 4: 條款編輯功能實現報告

## 📋 實現概述

Phase 4 專注於實現條款編輯功能，允許用戶直接在文檔審閱頁面編輯條款內容和標題。

---

## ✅ 已完成的後端功能

### 1. ClauseService 編輯方法

**文件**: `desktop/src/main/services/ClauseService.ts`

已實現的編輯方法：
- ✅ `updateClauseContent()` - 更新條款內容
- ✅ `updateClauseTitle()` - 更新條款標題
- ✅ 權限檢查（確保用戶擁有項目權限）
- ✅ 參數驗證（內容長度、標題長度）

```typescript
// 更新條款內容
async updateClauseContent(
  clauseId: number,
  userId: number,
  content: string
): Promise<{ success: boolean; message: string }>

// 更新條款標題
async updateClauseTitle(
  clauseId: number,
  userId: number,
  title: string
): Promise<{ success: boolean; message: string }>
```

### 2. ClauseRepository 數據庫操作

**文件**: `desktop/src/main/repositories/ClauseRepository.ts`

已實現的數據庫方法：
- ✅ `updateContent()` - 更新條款內容
- ✅ `updateTitle()` - 更新條款標題
- ✅ 使用 BaseRepository 的 `update()` 方法

### 3. IPC Handlers

**文件**: `desktop/src/main/ipc/handlers/clauseHandlers.ts`

已實現的 IPC 處理器：
- ✅ `CLAUSE_CHANNELS.UPDATE` - 處理條款更新請求
- ✅ 支持同時更新內容和標題
- ✅ 錯誤處理和響應格式化

### 4. Preload API 暴露

**文件**: `desktop/src/preload/index.ts`

已暴露的前端 API：
```typescript
clause: {
  update: (clauseId: number, userId: number, data: any) =>
    ipcRenderer.invoke(CLAUSE_CHANNELS.UPDATE, { clauseId, userId, ...data })
}
```

---

## 🎯 待實現的前端功能

### 1. 條款編輯 UI 組件

需要在 `ClauseItem.tsx` 中添加：
- [ ] 編輯模式切換按鈕
- [ ] 內容編輯器（textarea）
- [ ] 標題編輯器（input）
- [ ] 保存/取消按鈕
- [ ] 編輯狀態管理

### 2. 編輯功能流程

```
用戶點擊「編輯」按鈕
  ↓
進入編輯模式（顯示編輯器）
  ↓
用戶修改內容/標題
  ↓
點擊「保存」
  ↓
調用 window.api.clause.update()
  ↓
更新成功 → 退出編輯模式，刷新顯示
更新失敗 → 顯示錯誤訊息
```

### 3. UI 設計要點

**編輯模式 UI**：
- 內容編輯器：多行文本框，自動調整高度
- 標題編輯器：單行輸入框
- 保存按鈕：主要操作按鈕（藍色）
- 取消按鈕：次要操作按鈕（灰色）
- 編輯中狀態：禁用其他操作按鈕

**權限控制**：
- 只有項目所有者可以編輯條款
- 編輯按鈕根據權限顯示/隱藏

---

## 📊 數據流程圖

### 條款更新流程

```
前端 (ClauseItem.tsx)
  ↓ window.api.clause.update(clauseId, userId, { content, title })
Preload (index.ts)
  ↓ ipcRenderer.invoke(CLAUSE_CHANNELS.UPDATE, ...)
IPC Handler (clauseHandlers.ts)
  ↓ clauseService.updateClauseContent() / updateClauseTitle()
Service (ClauseService.ts)
  ↓ 權限檢查 + 參數驗證
Repository (ClauseRepository.ts)
  ↓ this.update(clauseId, { content/title })
Database (clauses 表)
  ↓ UPDATE clauses SET content/title = ? WHERE id = ?
返回結果
  ↓ { success: true/false, message: string }
前端更新 UI
```

---

## 🔧 技術實現細節

### 1. 權限檢查邏輯

```typescript
// 1. 獲取條款信息
const clause = clauseRepository.findById(clauseId);

// 2. 獲取文檔信息
const document = documentRepository.findById(clause.document_id);

// 3. 檢查項目權限
if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
  return { success: false, message: 'No permission' };
}
```

### 2. 參數驗證

```typescript
// 內容驗證：1-10000 字符
validateRequiredString(content, 'Clause content', 1, 10000);

// 標題驗證：1-200 字符
validateRequiredString(title, 'Clause title', 1, 200);
```

### 3. 數據庫更新

```typescript
// 使用 BaseRepository 的 update 方法
this.update(clauseId, { content } as Partial<Clause>);
this.update(clauseId, { title } as Partial<Clause>);
```

---

## 🎨 前端實現建議

### ClauseItem 組件狀態管理

```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedContent, setEditedContent] = useState(clause.content);
const [editedTitle, setEditedTitle] = useState(clause.title || '');
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    const result = await window.api.clause.update(
      clause.id,
      currentUser.id,
      {
        content: editedContent,
        title: editedTitle
      }
    );
    
    if (result.success) {
      setIsEditing(false);
      // 刷新條款列表
      onRefresh();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('保存失敗:', error);
    alert('保存失敗');
  } finally {
    setIsSaving(false);
  }
};

const handleCancel = () => {
  setEditedContent(clause.content);
  setEditedTitle(clause.title || '');
  setIsEditing(false);
};
```

### 編輯模式 UI 結構

```tsx
{isEditing ? (
  <div className="clause-edit-mode">
    {/* 標題編輯器 */}
    <input
      type="text"
      value={editedTitle}
      onChange={(e) => setEditedTitle(e.target.value)}
      placeholder="條款標題（可選）"
      className="clause-title-input"
    />
    
    {/* 內容編輯器 */}
    <textarea
      value={editedContent}
      onChange={(e) => setEditedContent(e.target.value)}
      className="clause-content-textarea"
      rows={5}
    />
    
    {/* 操作按鈕 */}
    <div className="clause-edit-actions">
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? '保存中...' : '保存'}
      </button>
      <button onClick={handleCancel} disabled={isSaving}>
        取消
      </button>
    </div>
  </div>
) : (
  <div className="clause-view-mode">
    {/* 原有的顯示內容 */}
    <button onClick={() => setIsEditing(true)}>
      編輯
    </button>
  </div>
)}
```

---

## 🧪 測試要點

### 功能測試

- [ ] 編輯條款內容並保存
- [ ] 編輯條款標題並保存
- [ ] 同時編輯內容和標題
- [ ] 取消編輯（恢復原內容）
- [ ] 保存空內容（應該失敗）
- [ ] 保存超長內容（應該失敗）

### 權限測試

- [ ] 非項目所有者無法編輯條款
- [ ] 編輯按鈕根據權限顯示/隱藏

### UI 測試

- [ ] 編輯模式切換流暢
- [ ] 保存中狀態顯示正確
- [ ] 錯誤訊息顯示清晰
- [ ] 編輯器自動聚焦

---

## 📝 下一步行動

1. **實現前端編輯 UI**
   - 修改 `ClauseItem.tsx` 組件
   - 添加編輯模式狀態管理
   - 實現保存/取消邏輯

2. **添加 CSS 樣式**
   - 編輯器樣式
   - 按鈕樣式
   - 編輯模式布局

3. **測試編輯功能**
   - 手動測試各種編輯場景
   - 驗證權限控制
   - 檢查錯誤處理

4. **優化用戶體驗**
   - 添加保存確認提示
   - 實現自動保存（可選）
   - 添加編輯歷史記錄（可選）

---

## 🎯 Phase 4 完成標準

- ✅ 後端 API 完整實現
- ✅ IPC 通道正確配置
- ✅ Preload API 正確暴露
- [ ] 前端編輯 UI 實現
- [ ] 編輯功能測試通過
- [ ] 用戶體驗優化完成

---

## 📅 時間估算

- 前端 UI 實現：2 小時
- CSS 樣式調整：0.5 小時
- 功能測試：0.5 小時
- 優化調整：0.5 小時

**總計**：約 3.5 小時

---

*報告生成時間：2025-01-XX*
*Phase 4 狀態：後端完成，前端待實現*
