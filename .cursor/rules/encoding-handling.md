# 編碼問題處理規則

## 問題描述
在編輯包含中文的 TypeScript/JavaScript 文件時，經常出現亂碼問題。

## 根本原因
1. **文件編碼不一致**：文件可能被保存為 Big5、GBK 或其他非 UTF-8 編碼
2. **工具使用不當**：
   - 使用 `Get-Content` 時沒有指定 `-Encoding UTF8`
   - 使用 `Set-Content` 時沒有指定 `-Encoding UTF8`
   - 使用 PowerShell 的 `-replace` 操作可能破壞編碼
3. **StrReplace 工具失敗**：當文件有編碼問題時，StrReplace 無法找到匹配的字符串

## 解決方案和最佳實踐

### ✅ 推薦做法

#### 1. 使用 Write 工具重寫整個文件
當需要修改包含中文的文件時，**優先使用 Write 工具**：

```typescript
// 1. 先用 Read 工具讀取完整文件
// 2. 在內存中修改內容
// 3. 用 Write 工具重寫整個文件（自動使用 UTF-8）
```

**優點**：
- Write 工具自動使用 UTF-8 編碼
- 避免編碼轉換問題
- 確保文件編碼一致性

#### 2. 避免使用 Shell 命令進行文本替換
**不要使用**：
```powershell
# ❌ 錯誤示例
$content = Get-Content file.ts -Raw
$content = $content -replace "old", "new"
Set-Content file.ts -Value $content
```

**原因**：
- PowerShell 的字符串操作可能破壞 UTF-8 編碼
- `-replace` 對複雜的多行文本不可靠
- 容易產生亂碼

#### 3. 如果必須使用 Shell，明確指定編碼
```powershell
# ✅ 正確示例
Get-Content file.ts -Raw -Encoding UTF8
Set-Content file.ts -Value $content -Encoding UTF8
```

#### 4. StrReplace 失敗時的處理流程
```
StrReplace 失敗
    ↓
檢查是否有編碼問題（亂碼）
    ↓
使用 Read 讀取完整文件
    ↓
在內存中修改內容
    ↓
使用 Write 重寫整個文件
```

### ❌ 避免的做法

1. **不要**使用 PowerShell 的 `-replace` 操作處理包含中文的文件
2. **不要**在 Shell 命令中使用複雜的正則表達式替換
3. **不要**假設文件編碼是 UTF-8（先檢查）
4. **不要**在 StrReplace 失敗後重複嘗試相同的方法

### 🔍 診斷編碼問題

檢查文件是否有編碼問題：
```powershell
# 讀取文件並查看是否有亂碼
Get-Content file.ts -Raw -Encoding UTF8 | Select-String -Pattern "�"
```

如果看到 `�` 或其他亂碼字符，說明文件編碼有問題。

### 🛠️ 修復已損壞的文件

如果文件已經出現亂碼：
1. 使用 `git checkout` 恢復原始文件
2. 使用 Read + Write 工具重新編輯
3. 確保所有中文註釋正確顯示

## 工作流程

### 修改包含中文的文件時：

```
1. 使用 Read 工具讀取文件
   ↓
2. 檢查是否有亂碼
   ↓
3. 如果有亂碼：git checkout 恢復
   ↓
4. 在內存中修改內容
   ↓
5. 使用 Write 工具重寫整個文件
   ↓
6. 編譯測試
   ↓
7. 提交
```

### 不要：
```
❌ 使用 Shell 命令替換
❌ 使用 PowerShell -replace
❌ 在 StrReplace 失敗後繼續嘗試
```

## 總結

**核心原則**：
- **優先使用 Write 工具**重寫整個文件
- **避免使用 Shell 命令**進行文本替換
- **始終檢查編碼**，發現亂碼立即恢復
- **StrReplace 失敗 = 切換到 Write 工具**

這樣可以避免 90% 的編碼問題。
