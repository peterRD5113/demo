# Electron 窗口空白/立即關閉問題 - 完整診斷清單

## 當前狀態觀察
- ✅ 窗口創建成功
- ✅ HTML 文件加載成功
- ✅ Page finished loading
- ❌ 窗口立即關閉 ("Window closed")

---

## 可能原因分類

### 類別 A：前端 JavaScript 錯誤導致崩潰

#### A1. React 渲染錯誤
**症狀**：頁面加載後立即白屏或崩潰
**可能原因**：
- React 組件拋出未捕獲的錯誤
- `useEffect` 中的錯誤導致無限循環
- Context Provider 配置錯誤
- 路由配置錯誤

**檢查方法**：
```javascript
// 查看 Console 是否有 React 錯誤
// 查看是否有 "Uncaught Error" 或 "Unhandled Promise Rejection"
```

#### A2. 模塊導入失敗
**症狀**：JS 文件無法正確加載
**可能原因**：
- `import` 語句路徑錯誤
- 缺少必要的依賴包
- Vite 打包時遺漏了某些模塊
- 動態導入 (`import()`) 失敗

**檢查方法**：
```bash
# 檢查 dist/renderer/assets/ 中的文件是否完整
# 查看 Network 標籤是否有 404 錯誤
```

#### A3. 全局變量未定義
**症狀**：訪問不存在的全局變量
**可能原因**：
- `window.electronAPI` 未正確暴露
- 其他全局變量（如 `process`）在渲染進程中不可用
- TypeScript 類型定義與實際不符

**檢查方法**：
```javascript
console.log('window.electronAPI:', window.electronAPI);
console.log('typeof window.electronAPI:', typeof window.electronAPI);
```

---

### 類別 B：Content Security Policy (CSP) 問題

#### B1. CSP 阻止腳本執行
**症狀**：腳本被 CSP 阻止
**可能原因**：
```html
<!-- 當前 CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

問題：
- `script-src 'self'` 可能阻止某些動態腳本
- Vite 的 HMR 或某些功能需要 `'unsafe-eval'`
- 第三方庫（如 Ant Design）可能需要更寬鬆的 CSP

**檢查方法**：
```
查看 Console 是否有 CSP 違規警告：
"Refused to execute inline script because it violates CSP"
```

#### B2. 資源加載被 CSP 阻止
**可能原因**：
- 字體文件被阻止
- 圖片資源被阻止
- WebAssembly 被阻止（如果使用）

---

### 類別 C：Vite 構建配置問題

#### C1. Base Path 配置錯誤
**當前配置**：`base: './'`
**可能問題**：
- 相對路徑在 Electron 中可能解析錯誤
- 應該使用絕對路徑或空字符串

**檢查**：
```typescript
// vite.renderer.config.mjs
base: './',  // 可能有問題
```

#### C2. 輸出格式問題
**可能原因**：
- Vite 默認輸出 ES modules
- Electron 可能需要特定的模塊格式
- `type="module"` 在某些情況下可能有問題

**檢查**：
```html
<script type="module" crossorigin src="./assets/index-w-fdez3A.js"></script>
```

#### C3. 代碼分割問題
**可能原因**：
- Vite 自動進行代碼分割
- 動態導入的 chunk 無法正確加載
- 路徑解析問題

#### C4. Source Map 問題
**可能原因**：
- Source map 文件過大或損壞
- 影響調試和錯誤追蹤

---

### 類別 D：Electron 主進程配置問題

#### D1. 窗口事件處理錯誤
**當前代碼**：
```typescript
mainWindow.on('closed', () => {
  mainWindow = null;
});
```

**可能問題**：
- 窗口關閉事件被意外觸發
- 沒有阻止窗口關閉的邏輯

#### D2. 生命週期管理問題
**可能原因**：
```typescript
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();  // 窗口關閉後立即退出
  }
});
```

#### D3. 開發者工具問題
**當前代碼**：
```typescript
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

**可能問題**：
- `NODE_ENV` 未正確設置
- DevTools 未打開，無法看到錯誤

---

### 類別 E：React Router 問題

#### E1. 路由配置錯誤
**當前配置**：使用 `BrowserRouter`
**可能問題**：
- `BrowserRouter` 在 Electron 中可能有問題
- 應該使用 `HashRouter` 或 `MemoryRouter`

**原因**：
```typescript
// BrowserRouter 依賴 HTML5 History API
// 在 file:// 協議下可能不工作
<BrowserRouter>  // 可能有問題
```

**應該使用**：
```typescript
import { HashRouter } from 'react-router-dom';
<HashRouter>  // 更適合 Electron
```

#### E2. 路由重定向循環
**可能原因**：
```typescript
<Route path="/" element={<Navigate to="/projects" replace />} />
```
- 重定向邏輯可能導致無限循環
- 權限檢查可能導致循環重定向

---

### 類別 F：Context Provider 問題

#### F1. AuthContext 初始化錯誤
**可能原因**：
- `AuthContext` 中的 `useEffect` 拋出錯誤
- 異步操作未正確處理
- Token 驗證失敗導致崩潰

#### F2. ProjectContext 初始化錯誤
**類似問題**

#### F3. Provider 嵌套順序錯誤
**當前順序**：
```typescript
<BrowserRouter>
  <AuthProvider>
    <ProjectProvider>
```

**可能問題**：
- Provider 之間的依賴關係錯誤
- 某個 Provider 依賴另一個但順序不對

---

### 類別 G：Ant Design 相關問題

#### G1. ConfigProvider 配置問題
**當前配置**：
```typescript
<ConfigProvider locale={zhCN}>
```

**可能問題**：
- `zhCN` 導入失敗
- Ant Design 樣式未正確加載
- 某些組件初始化失敗

#### G2. Message 組件問題
**當前使用**：
```typescript
message.error('Application initialization failed');
```

**可能問題**：
- `message` 需要在 DOM 中插入節點
- 在 React 渲染前調用可能失敗

---

### 類別 H：異步初始化問題

#### H1. useEffect 執行順序
**當前邏輯**：
```typescript
useEffect(() => {
  if (!window.electronAPI) {
    message.error('...');
    return;  // 不設置 isReady
  }
  setIsReady(true);
}, []);
```

**可能問題**：
- `window.electronAPI` 在 `useEffect` 執行時還未準備好
- Preload 腳本執行有延遲
- 需要等待 DOM 完全加載

#### H2. 競態條件
**可能原因**：
- Preload 腳本和 React 初始化的時序問題
- `contextBridge.exposeInMainWorld` 執行時機

---

### 類別 I：文件協議問題

#### I1. file:// 協議限制
**當前加載方式**：
```typescript
mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
```

**可能問題**：
- `file://` 協議有安全限制
- 某些 Web API 在 `file://` 下不可用
- CORS 問題

#### I2. 相對路徑解析
**HTML 中的路徑**：
```html
<script type="module" crossorigin src="./assets/index-w-fdez3A.js"></script>
```

**可能問題**：
- `./assets/` 相對路徑可能解析錯誤
- 應該確保路徑相對於 HTML 文件

---

### 類別 J：依賴包問題

#### J1. React 版本問題
**當前版本**：React 19.2.4
**可能問題**：
- React 19 是較新版本，可能有兼容性問題
- 某些庫可能不支持 React 19

#### J2. React Router 版本問題
**當前版本**：react-router-dom 7.13.1
**可能問題**：
- 版本 7 是較新版本
- API 可能有變化

#### J3. Ant Design 版本問題
**當前版本**：antd 6.3.1
**可能問題**：
- 與 React 19 的兼容性
- 某些組件可能有 bug

---

### 類別 K：內存或性能問題

#### K1. 打包文件過大
**觀察到**：
```
index-w-fdez3A.js   1,266.65 kB
```

**可能問題**：
- 文件過大導致加載緩慢
- 內存不足
- 解析時間過長

#### K2. 無限循環或遞歸
**可能原因**：
- 某個組件的 `useEffect` 導致無限重渲染
- 狀態更新邏輯錯誤

---

### 類別 L：Preload 腳本問題

#### L1. contextBridge 執行失敗
**可能原因**：
- `contextBridge.exposeInMainWorld` 拋出錯誤
- API 對象結構有問題
- 某個函數定義錯誤

#### L2. IPC 通道名稱錯誤
**可能原因**：
- Preload 中定義的通道名與主進程不匹配
- 拼寫錯誤

---

## 診斷優先級

### 🔴 高優先級（最可能）
1. **React Router 使用 BrowserRouter** - 應該改為 HashRouter
2. **前端 JavaScript 錯誤** - 需要查看 Console
3. **window.electronAPI 時序問題** - Preload 可能未完成
4. **Context Provider 初始化錯誤** - AuthContext 或 ProjectContext

### 🟡 中優先級
5. **CSP 配置過於嚴格** - 可能阻止某些功能
6. **Vite base path 配置** - 可能影響資源加載
7. **異步初始化競態** - useEffect 執行時機
8. **依賴版本兼容性** - React 19 較新

### 🟢 低優先級
9. **文件過大** - 影響性能但不會導致崩潰
10. **Source map 問題** - 只影響調試

---

## 建議的診斷步驟（按順序）

### 步驟 1：查看 Console 錯誤（最重要）
- 打開 DevTools Console
- 查看是否有紅色錯誤信息
- 查看 Network 標籤是否有加載失敗

### 步驟 2：確認 electronAPI 是否可用
```javascript
// 在 App.tsx 最開始添加
console.log('=== App.tsx loaded ===');
console.log('window.electronAPI:', window.electronAPI);
```

### 步驟 3：測試最小化 App
- 暫時移除所有 Provider
- 只渲染一個簡單的 `<div>Hello</div>`
- 逐步添加功能

### 步驟 4：更改 Router 類型
- 將 `BrowserRouter` 改為 `HashRouter`
- 這是 Electron 中最常見的問題

### 步驟 5：放寬 CSP
- 暫時移除或放寬 CSP 限制
- 看是否解決問題

---

## 需要檢查的文件

1. `src/renderer/App.tsx` - 主要邏輯
2. `src/renderer/contexts/AuthContext.tsx` - 可能的錯誤源
3. `src/renderer/contexts/ProjectContext.tsx` - 可能的錯誤源
4. `dist/renderer/index.html` - CSP 和資源路徑
5. `vite.renderer.config.mjs` - 構建配置
6. DevTools Console - 實際錯誤信息

---

## 下一步行動

**不要立即修改代碼，先：**
1. 啟動應用並打開 DevTools
2. 截圖 Console 中的所有錯誤
3. 檢查 Network 標籤
4. 根據實際錯誤信息確定問題
5. 然後再針對性修復
