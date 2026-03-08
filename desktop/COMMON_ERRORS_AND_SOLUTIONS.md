# Electron 應用開發常見錯誤記錄

## 日期：2026-03-08

本文檔記錄了在開發 Electron 應用時遇到的常見錯誤及其解決方案，以避免重複犯錯。

---

## 1. 文件編碼問題

### 問題描述
- package.json 中的中文描述顯示為亂碼
- 例如：`"description": "?��?風險管�?系統"`

### 原因
- 文件保存時使用了錯誤的編碼格式（非 UTF-8）

### 解決方案
```json
// ✅ 正確：使用 UTF-8 編碼保存文件
"description": "合同風險管理系統 - 智能識別合同風險"
```

### 預防措施
- **始終使用 UTF-8 編碼保存所有源代碼文件**
- 在 VS Code 中設置：右下角點擊編碼 → 選擇 "UTF-8"
- 在 `.editorconfig` 中添加：`charset = utf-8`

---

## 2. sql.js WASM 文件路徑問題

### 問題描述
```
Error: Could not load sql-wasm.wasm
```

### 原因
- TypeScript 編譯後，`__dirname` 指向 `dist/main/database/`
- 相對路徑 `../../node_modules` 不正確

### 解決方案
```typescript
// ❌ 錯誤
locateFile: (file) => path.join(__dirname, '../../node_modules/sql.js/dist', file)

// ✅ 正確：需要回到項目根目錄
locateFile: (file) => path.join(__dirname, '../../../node_modules/sql.js/dist', file)
```

### 預防措施
- **編譯後的路徑與源代碼路徑不同**
- 使用 `console.log(__dirname)` 確認實際路徑
- 考慮使用 `app.getAppPath()` 獲取應用根目錄

---

## 3. Preload 腳本模塊導入問題

### 問題描述
```
Error: module not found: ./ipc/channels
Unable to load preload script
```

### 原因
- Electron 的 preload 腳本在沙盒環境中運行
- **不支持 CommonJS 的 `require` 相對路徑導入**
- 即使文件存在於 `dist/preload/ipc/channels.js`，也無法加載

### 解決方案
```typescript
// ❌ 錯誤：不要在 preload 中使用相對路徑導入
import { AUTH_CHANNELS } from './ipc/channels';

// ✅ 正確：直接在 preload 中內聯定義常量
const AUTH_CHANNELS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  // ...
};
```

### 預防措施
- **Preload 腳本應該是自包含的，避免外部依賴**
- 如果必須共享代碼，考慮：
  1. 內聯定義（推薦）
  2. 使用打包工具（如 webpack）將所有代碼打包成單個文件
  3. 使用絕對路徑（不推薦，不可移植）

---

## 4. Vite React 插件缺失

### 問題描述
- 前端編譯成功，但窗口顯示空白
- HTML 結構混亂

### 原因
- Vite 配置文件缺少 `@vitejs/plugin-react` 插件
- React JSX 無法正確轉換

### 解決方案
```typescript
// ❌ 錯誤
export default defineConfig({
  plugins: [],  // 空數組
  // ...
});

// ✅ 正確
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],  // 添加 React 插件
  // ...
});
```

### 預防措施
- **使用 React 時必須添加 `@vitejs/plugin-react`**
- 檢查 `package.json` 中是否已安裝該插件
- 使用 Vite 官方模板創建項目

---

## 5. Vite 配置文件 ESM/CommonJS 問題

### 問題描述
```
Error: "@vitejs/plugin-react" resolved to an ESM file. 
ESM file cannot be loaded by `require`.
```

### 原因
- `@vitejs/plugin-react` 是 ESM 模塊
- TypeScript 配置文件默認編譯為 CommonJS
- CommonJS 無法導入 ESM 模塊

### 解決方案
```javascript
// ❌ 錯誤：vite.renderer.config.ts (會被編譯為 CommonJS)
import react from '@vitejs/plugin-react';  // 無法導入

// ✅ 正確：vite.renderer.config.mjs (原生 ESM)
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // ...
});
```

同時更新 `package.json`：
```json
{
  "scripts": {
    "build:renderer": "vite build --config vite.renderer.config.mjs"
  }
}
```

### 預防措施
- **Vite 配置文件使用 `.mjs` 擴展名**（原生 ESM）
- 或者在 `package.json` 中添加 `"type": "module"`（影響整個項目）
- 注意 `.mjs` 中需要手動定義 `__dirname`

---

## 6. 窗口創建但無內容顯示

### 問題描述
- Electron 窗口打開
- 但顯示空白頁面
- 控制台顯示 "electronAPI is not available"

### 可能原因及解決方案

#### 原因 1：Preload 腳本未正確加載
```typescript
// 檢查主進程中的 preload 路徑
webPreferences: {
  preload: path.join(__dirname, '../preload/index.js'),  // 確認路徑正確
  nodeIntegration: false,
  contextIsolation: true,
}
```

#### 原因 2：前端代碼未編譯
```bash
# 確保前端已編譯
npm run build:renderer
```

#### 原因 3：HTML 文件路徑錯誤
```typescript
// 主進程中加載 HTML
mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
```

#### 原因 4：前端檢查過於嚴格
```typescript
// ❌ 可能導致無限等待
if (!window.electronAPI) {
  message.error('Application initialization failed');
  return;  // 永遠不會 setIsReady(true)
}

// ✅ 添加超時或重試機制
useEffect(() => {
  const checkAPI = () => {
    if (window.electronAPI) {
      setIsReady(true);
    } else {
      console.error('electronAPI not available');
      // 可以添加重試邏輯
    }
  };
  checkAPI();
}, []);
```

---

## 7. 數據庫文件名不一致

### 問題描述
- 代碼中使用 `contract_risk.db`（下劃線）
- 但舊數據庫是 `contract-risk.db`（連字符）
- 導致創建了兩個數據庫文件

### 解決方案
```typescript
// 統一使用一種命名方式
const dbPath = path.join(userDataPath, 'contract_risk.db');  // 使用下劃線
```

### 預防措施
- **在項目開始時確定命名規範**
- 文件名使用：
  - 下劃線：`contract_risk.db`（推薦，更易讀）
  - 連字符：`contract-risk.db`
  - 駝峰：`contractRisk.db`
- **全項目統一使用同一種命名方式**

---

## 8. 調試技巧

### 添加詳細日誌
```typescript
// 主進程
console.log('Creating main window...');
console.log('HTML path:', htmlPath);

// Preload 腳本
console.log('Preload script starting...');
contextBridge.exposeInMainWorld('electronAPI', api);
console.log('electronAPI exposed successfully');

// 前端
console.log('window.electronAPI:', window.electronAPI);
```

### 監聽錯誤事件
```typescript
// 主進程
mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
  console.error('Page failed to load:', errorCode, errorDescription);
});

mainWindow.webContents.on('did-finish-load', () => {
  console.log('Page finished loading');
});

// 全局錯誤處理
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
```

### 使用開發者工具
```typescript
// 開發環境自動打開 DevTools
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

---

## 9. 編譯順序問題

### 正確的編譯順序
```bash
# 1. 先編譯主進程和 preload
npm run build:main

# 2. 再編譯前端
npm run build:renderer

# 3. 或者使用組合命令
npm run build  # 自動執行 build:main && build:renderer
```

### 預防措施
- **確保 package.json 中的 build 腳本順序正確**
```json
{
  "scripts": {
    "build": "npm run build:main && npm run build:renderer"
  }
}
```

---

## 10. 常見檢查清單

### 啟動前檢查
- [ ] 所有文件使用 UTF-8 編碼
- [ ] `npm install` 已執行，依賴已安裝
- [ ] `npm run build` 已執行，代碼已編譯
- [ ] `dist/` 目錄存在且包含所有必要文件
- [ ] 數據庫路徑正確
- [ ] WASM 文件路徑正確

### 出現問題時檢查
- [ ] 查看控制台錯誤信息
- [ ] 檢查 DevTools Console
- [ ] 確認文件路徑（使用 `console.log(__dirname)`）
- [ ] 確認文件是否存在（使用 `Test-Path` 或 `fs.existsSync`）
- [ ] 檢查編碼格式
- [ ] 清理並重新編譯（`rm -rf dist && npm run build`）

---

## 總結

### 核心原則
1. **路徑問題**：始終考慮編譯後的路徑與源代碼路徑不同
2. **編碼問題**：所有文件使用 UTF-8 編碼
3. **模塊導入**：Preload 腳本避免外部依賴，使用內聯定義
4. **配置文件**：Vite 配置使用 `.mjs` 擴展名
5. **調試優先**：添加詳細日誌，使用開發者工具
6. **命名規範**：全項目統一命名方式

### 開發流程
1. 設計階段：確定命名規範、文件結構
2. 開發階段：添加詳細日誌、使用 TypeScript
3. 測試階段：逐步測試（主進程 → Preload → 前端）
4. 調試階段：使用 DevTools、查看控制台
5. 部署階段：清理並重新編譯、測試打包

---

## 參考資源

- [Electron 官方文檔](https://www.electronjs.org/docs)
- [Vite 官方文檔](https://vitejs.dev/)
- [sql.js 文檔](https://sql.js.org/)
- [TypeScript 官方文檔](https://www.typescriptlang.org/)
