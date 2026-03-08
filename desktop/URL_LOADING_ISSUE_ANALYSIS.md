# Electron 載入錯誤網址問題分析

## 問題描述
窗口打開後立即關閉，日誌顯示：
- ✅ HTML loaded successfully
- ✅ Page finished loading
- ❌ Window closed

## 根本原因分析

### 1. Electron Forge 開發模式配置缺失

**當前問題**：
- 使用 `npm start` (即 `electron-forge start`)
- Forge 配置中**沒有指定開發服務器插件**
- 主進程代碼使用 `loadFile` 載入靜態文件
- 但在開發模式下，應該載入 Vite 開發服務器的 URL

**正常的開發流程應該是**：
```
1. Vite 啟動開發服務器 (http://localhost:5173)
2. Electron 連接到開發服務器
3. 支持熱重載 (HMR)
```

**當前的錯誤流程**：
```
1. Electron Forge 啟動 Electron
2. 主進程嘗試 loadFile(dist/renderer/index.html)
3. 載入的是靜態構建文件（可能過時或有問題）
4. 沒有開發服務器，沒有 HMR
```

### 2. 缺少 Vite 插件

**應該安裝的插件**：
```bash
npm install --save-dev @electron-forge/plugin-vite
```

**應該在 forge.config.js 中配置**：
```javascript
plugins: [
  {
    name: '@electron-forge/plugin-vite',
    config: {
      // 主進程配置
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.mjs'
        },
        {
          entry: 'src/preload/index.ts',
          config: 'vite.preload.config.mjs'
        }
      ],
      // 渲染進程配置
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mjs'
        }
      ]
    }
  }
]
```

### 3. 主進程載入邏輯需要區分環境

**當前代碼問題**：
```typescript
// 總是載入靜態文件
mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
```

**應該根據環境區分**：
```typescript
// 開發模式：載入開發服務器
if (process.env.NODE_ENV === 'development') {
  mainWindow.loadURL('http://localhost:5173');
} else {
  // 生產模式：載入靜態文件
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}
```

### 4. 為什麼窗口會立即關閉？

**可能的原因**：
1. **載入的靜態文件有錯誤**
   - 前端 JavaScript 拋出未捕獲的錯誤
   - React 渲染失敗
   - 導致頁面崩潰

2. **BrowserRouter 在 file:// 協議下不工作**
   - `BrowserRouter` 依賴 HTML5 History API
   - 在 `file://` 協議下可能失敗
   - 應該使用 `HashRouter`

3. **資源路徑解析錯誤**
   - CSS/JS 文件路徑在 `file://` 協議下解析錯誤
   - 導致資源加載失敗

## 解決方案選項

### 選項 A：使用 Electron Forge Vite 插件（推薦）

**優點**：
- 官方支持
- 自動處理開發/生產環境
- 支持 HMR
- 配置簡單

**步驟**：
1. 安裝插件
2. 配置 forge.config.js
3. 創建 vite.main.config.mjs 和 vite.preload.config.mjs
4. 修改主進程載入邏輯

### 選項 B：手動區分開發/生產環境

**優點**：
- 不需要額外插件
- 更靈活

**缺點**：
- 需要手動管理開發服務器
- 沒有 HMR

**步驟**：
1. 修改主進程載入邏輯（區分環境）
2. 修改 package.json 腳本
3. 將 BrowserRouter 改為 HashRouter

### 選項 C：不使用 Electron Forge（最簡單）

**優點**：
- 配置最簡單
- 直接使用 Electron

**步驟**：
1. 修改 package.json：
   ```json
   {
     "scripts": {
       "start": "npm run build && electron ."
     }
   }
   ```
2. 將 BrowserRouter 改為 HashRouter
3. 確保每次啟動前都重新構建

## 當前最快的解決方案

**立即可以嘗試的修復**：

### 1. 將 BrowserRouter 改為 HashRouter
```typescript
// src/renderer/App.tsx
import { HashRouter } from 'react-router-dom';

// 將 <BrowserRouter> 改為 <HashRouter>
<HashRouter>
  {/* ... */}
</HashRouter>
```

**原因**：
- `HashRouter` 使用 URL hash (#) 來管理路由
- 在 `file://` 協議下完全兼容
- 不依賴 HTML5 History API

### 2. 確保每次啟動前重新構建
```json
{
  "scripts": {
    "start": "npm run build && electron-forge start"
  }
}
```

### 3. 添加更詳細的錯誤日誌
```typescript
// 主進程
mainWindow.webContents.on('console-message', (event, level, message) => {
  console.log(`[Renderer Console] ${message}`);
});

mainWindow.webContents.on('crashed', (event, killed) => {
  console.error('Renderer process crashed!', { killed });
});
```

## 診斷步驟

1. **先嘗試最簡單的修復**：改為 HashRouter
2. **如果還是不行**：檢查 Console 錯誤
3. **如果需要開發服務器**：安裝 Vite 插件
4. **如果只需要運行**：使用選項 C

## 結論

**最可能的問題**：
1. 🔴 **BrowserRouter 在 file:// 協議下不工作**（最可能）
2. 🔴 **前端 JavaScript 錯誤導致崩潰**
3. 🟡 **缺少 Electron Forge Vite 插件**（開發體驗問題）

**建議的修復順序**：
1. 先改 HashRouter（最快）
2. 查看 Console 錯誤（診斷）
3. 如果需要開發服務器，再配置 Vite 插件（可選）
