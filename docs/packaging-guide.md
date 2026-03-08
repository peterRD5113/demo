# 打包與部署指南

## 📦 打包配置

本項目使用 Electron Forge 進行打包，支持 Windows、macOS 和 Linux 三個平台。

## 🚀 快速開始

### 開發模式
```bash
cd desktop
npm run dev
```

### 構建應用
```bash
cd desktop
npm run build
```

### 打包應用
```bash
cd desktop
npm run package
```

### 製作安裝包
```bash
# 所有平台
npm run make

# Windows 安裝包
npm run make:win

# macOS 安裝包
npm run make:mac

# Linux 安裝包
npm run make:linux
```

## 📋 打包輸出

打包後的文件位於 `desktop/out/` 目錄：

```
out/
├── make/
│   ├── squirrel.windows/     # Windows 安裝包
│   │   └── x64/
│   │       ├── ContractRiskManagement-1.0.0 Setup.exe
│   │       └── RELEASES
│   ├── zip/                   # macOS/Linux 壓縮包
│   │   ├── darwin/
│   │   │   └── x64/
│   │   │       └── ContractRiskManagement-darwin-x64-1.0.0.zip
│   │   └── linux/
│   │       └── x64/
│   │           └── ContractRiskManagement-linux-x64-1.0.0.zip
│   ├── deb/                   # Debian/Ubuntu 安裝包
│   │   └── x64/
│   │       └── contract-risk-management_1.0.0_amd64.deb
│   └── rpm/                   # RedHat/Fedora 安裝包
│       └── x64/
│           └── contract-risk-management-1.0.0-1.x86_64.rpm
└── ContractRiskManagement-win32-x64/  # 未打包的應用
```

## 🖥️ 平台特定說明

### Windows

**安裝包格式**: Squirrel (`.exe`)

**構建要求**:
- Windows 10 或更高版本
- Node.js 18+
- Visual Studio Build Tools（用於編譯原生模塊）

**安裝**:
1. 雙擊 `ContractRiskManagement-1.0.0 Setup.exe`
2. 按照安裝向導完成安裝
3. 應用會自動創建桌面快捷方式

**卸載**:
- 通過「設置 > 應用 > 應用和功能」卸載

### macOS

**安裝包格式**: ZIP (`.zip`)

**構建要求**:
- macOS 10.13 或更高版本
- Node.js 18+
- Xcode Command Line Tools

**安裝**:
1. 解壓 `ContractRiskManagement-darwin-x64-1.0.0.zip`
2. 將 `ContractRiskManagement.app` 拖到「應用程序」文件夾
3. 首次運行時，右鍵點擊應用選擇「打開」

**注意**:
- 如果遇到「無法打開，因為它來自身份不明的開發者」，需要在「系統偏好設置 > 安全性與隱私」中允許

### Linux

**安裝包格式**: 
- Debian/Ubuntu: `.deb`
- RedHat/Fedora: `.rpm`
- 通用: `.zip`

**構建要求**:
- Linux (任何發行版)
- Node.js 18+
- 構建工具: `build-essential`

**安裝 (Debian/Ubuntu)**:
```bash
sudo dpkg -i contract-risk-management_1.0.0_amd64.deb
sudo apt-get install -f  # 安裝依賴
```

**安裝 (RedHat/Fedora)**:
```bash
sudo rpm -i contract-risk-management-1.0.0-1.x86_64.rpm
```

**安裝 (通用)**:
```bash
unzip ContractRiskManagement-linux-x64-1.0.0.zip
cd ContractRiskManagement-linux-x64
./contract-risk-management
```

## 🔧 打包配置詳解

### forge.config.js

主要配置項：

```javascript
{
  packagerConfig: {
    asar: true,                    // 使用 ASAR 打包
    name: 'ContractRiskManagement', // 應用名稱
    icon: './assets/icon',         // 應用圖標
    extraResource: ['./resources'] // 額外資源
  },
  makers: [
    // Windows 安裝包
    '@electron-forge/maker-squirrel',
    
    // macOS/Linux 壓縮包
    '@electron-forge/maker-zip',
    
    // Debian 安裝包
    '@electron-forge/maker-deb',
    
    // RPM 安裝包
    '@electron-forge/maker-rpm'
  ]
}
```

### 圖標要求

不同平台需要不同格式的圖標：

- **Windows**: `icon.ico` (256x256)
- **macOS**: `icon.icns` (512x512)
- **Linux**: `icon.png` (512x512)

圖標文件應放在 `desktop/assets/` 目錄。

## 📝 打包前檢查清單

- [ ] 更新版本號（`package.json` 中的 `version`）
- [ ] 更新應用名稱和描述
- [ ] 準備應用圖標（所有平台）
- [ ] 測試應用功能
- [ ] 運行所有測試（`npm test`）
- [ ] 檢查依賴是否完整
- [ ] 清理開發文件（`node_modules/.cache` 等）
- [ ] 更新 README 和文檔

## 🐛 常見問題

### 1. 打包失敗：找不到模塊

**原因**: 依賴未正確安裝

**解決**:
```bash
cd desktop
rm -rf node_modules
npm install
npm run make
```

### 2. Windows 打包失敗：缺少 Visual Studio Build Tools

**原因**: 原生模塊需要編譯工具

**解決**:
安裝 Visual Studio Build Tools:
```bash
npm install --global windows-build-tools
```

### 3. macOS 打包失敗：權限問題

**原因**: 文件權限不足

**解決**:
```bash
chmod +x desktop/node_modules/.bin/*
npm run make:mac
```

### 4. Linux 打包失敗：缺少依賴

**原因**: 系統缺少必要的庫

**解決** (Ubuntu/Debian):
```bash
sudo apt-get install build-essential libsqlite3-dev
```

### 5. 打包後應用無法啟動

**原因**: 數據庫文件路徑錯誤

**解決**:
檢查 `src/main/database/connection.ts` 中的數據庫路徑是否使用 `app.getPath('userData')`

## 🔐 代碼簽名

### Windows

使用 SignTool 簽名：
```bash
signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com ContractRiskManagement-1.0.0 Setup.exe
```

### macOS

使用 codesign 簽名：
```bash
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" ContractRiskManagement.app
```

### 公證（macOS）

```bash
xcrun altool --notarize-app --primary-bundle-id "com.example.contract-risk-management" --username "your@email.com" --password "app-specific-password" --file ContractRiskManagement-darwin-x64-1.0.0.zip
```

## 📊 打包大小優化

### 1. 排除不必要的文件

在 `forge.config.js` 中配置 `ignore`:
```javascript
ignore: [
  /^\/src/,
  /\.ts$/,
  /\.map$/,
  /^\/test/,
  /^\/coverage/
]
```

### 2. 使用 ASAR 打包

ASAR 可以減少文件數量和大小：
```javascript
packagerConfig: {
  asar: true
}
```

### 3. 壓縮資源文件

- 壓縮圖片（使用 TinyPNG 等工具）
- 移除未使用的字體
- 最小化 CSS 和 JS

### 4. 只打包必要的依賴

檢查 `package.json`，確保 `devDependencies` 不會被打包。

## 🚀 自動化部署

### GitHub Actions

創建 `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          cd desktop
          npm install
      
      - name: Build and package
        run: |
          cd desktop
          npm run make
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: desktop/out/make/**/*
```

## 📦 發布清單

發布新版本時：

1. 更新版本號
2. 更新 CHANGELOG
3. 運行所有測試
4. 打包所有平台
5. 測試安裝包
6. 創建 Git tag
7. 上傳到發布平台
8. 更新文檔

## 📞 支持

如有打包問題，請查看：
- [Electron Forge 文檔](https://www.electronforge.io/)
- [Electron 打包指南](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- 項目 Issues 頁面
