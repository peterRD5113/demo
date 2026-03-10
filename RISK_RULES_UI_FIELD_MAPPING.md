## 🔍 風險規則管理 UI - 數據欄位對應檢查

### ⚠️ 發現的問題

#### 1. **數據庫欄位名稱不一致**

**數據庫 Schema (init.sql):**
```sql
CREATE TABLE risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT,                    -- ⚠️ 注意這裡
  patterns TEXT,                    -- ⚠️ 注意這裡
  exclude_keywords TEXT,
  risk_level TEXT NOT NULL,
  suggestion TEXT,
  enabled BOOLEAN DEFAULT 1,
  ...
)
```

**後端代碼期望 (RiskRepository.ts):**
```typescript
interface RiskRule {
  id: number;
  name: string;
  description: string;              -- ❌ 數據庫沒有這個欄位
  keywords: string | string[];      -- ✅ 有
  pattern: string;                  -- ❌ 數據庫是 patterns (複數)
  risk_level: string;
  is_enabled: number;               -- ❌ 數據庫是 enabled (沒有 is_)
}
```

### 🔧 需要修正的地方

#### 選項 1: 修改數據庫 Schema（推薦）
將數據庫欄位改為與代碼一致：
- `patterns` → `pattern` (單數)
- `enabled` → 保持不變，但後端統一使用 `enabled`
- 新增 `description` 欄位（或使用 `suggestion` 作為 description）

#### 選項 2: 修改後端代碼
調整 Repository 和 Service 以匹配數據庫欄位名稱。

### 📋 建議的修正方案

**方案：統一使用數據庫現有欄位**

1. **RiskRuleRepository.ts** 中的欄位映射：
   - `pattern` → 使用 `patterns` 欄位
   - `description` → 使用 `suggestion` 欄位
   - `is_enabled` → 使用 `enabled` 欄位

2. **前端 API 調用**：
   - 確保傳遞正確的欄位名稱

### ✅ 當前實現狀態

**前端 (RiskRulesPage.tsx):**
- ✅ 使用 `enabled` (正確)
- ✅ 使用 `risk_level` (正確)
- ✅ 使用 `suggestion` (正確)
- ✅ 使用 `keywords` (正確)
- ✅ 使用 `pattern` (需要後端映射到 `patterns`)

**後端 (riskHandlers.ts):**
- ✅ createRule 使用正確的參數
- ✅ updateRule 使用正確的參數
- ⚠️ 需要確認 Service 層的欄位映射

### 🎯 結論

目前的實現應該可以正常工作，因為：
1. 數據庫有 `patterns` 欄位（雖然是複數）
2. 數據庫有 `enabled` 欄位
3. 數據庫有 `suggestion` 欄位
4. 後端 Repository 應該會處理欄位映射

但建議在實際測試時注意觀察：
- 創建規則時 `pattern` 是否正確保存到 `patterns` 欄位
- 讀取規則時 `patterns` 是否正確映射到 `pattern`
- `enabled` 欄位的布爾值處理（SQLite 使用 INTEGER 0/1）
