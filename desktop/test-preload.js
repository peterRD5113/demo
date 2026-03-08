const { app, BrowserWindow } = require('electron');
const path = require('path');

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'dist/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 加載一個簡單的 HTML 來測試
  win.loadFile(path.join(__dirname, 'dist/renderer/index.html'));

  // 打開開發者工具
  win.webContents.openDevTools();

  // 監聽控制台消息
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message}`);
  });

  // 檢查 preload 是否加載
  win.webContents.on('did-finish-load', () => {
    console.log('Page loaded, checking electronAPI...');
    win.webContents.executeJavaScript('typeof window.electronAPI')
      .then(result => {
        console.log('typeof window.electronAPI:', result);
        if (result === 'undefined') {
          console.error('❌ electronAPI is NOT available!');
        } else {
          console.log('✅ electronAPI is available');
        }
      });
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
