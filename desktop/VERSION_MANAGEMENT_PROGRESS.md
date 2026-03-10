# 版本管理功能实现进度

## 已完成的部分

### 1. ✅ 数据库表（database/init.sql）
- `document_versions` 表：存储文档版本信息
- `version_clauses` 表：存储每个版本的条款快照
- 相关索引已创建

### 2. ✅ 后端服务（desktop/src/main/services/VersionService.ts）
- `getDocumentVersions()` - 获取文档的所有版本列表
- `getLatestVersion()` - 获取最新版本信息
- `getVersionClauses()` - 获取指定版本的所有条款
- `createVersion()` - 创建新版本（保存当前编辑状态）
- `rollbackToVersion()` - 回滚到指定版本
- `getComparisonData()` - 获取对照数据（最新版本 vs 当前编辑）

### 3. ✅ IPC Handlers（desktop/src/main/ipc/handlers/versionHandlers.ts）
- 所有 6 个 API 的 IPC handlers 已创建
- 已在 desktop/src/main/ipc/index.ts 中注册

### 4. ✅ 编译测试
- 主进程代码编译成功，无错误

---

## 需要手动完成的部分

### ⚠️ 前端 API 暴露（desktop/src/preload/index.ts）

**需要在 `file` API 之后、`system` API 之前添加以下代码：**

```typescript
  // ============= 版本管理 API =============
  version: {
    getList: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getList', documentId, userId),
    
    getLatest: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getLatest', documentId, userId),
    
    getClauses: (versionId: number, userId: number) =>
      ipcRenderer.invoke('version:getClauses', versionId, userId),
    
    create: (documentId: number, userId: number, changeSummary?: string) =>
      ipcRenderer.invoke('version:create', documentId, userId, changeSummary),
    
    rollback: (documentId: number, versionId: number, userId: number) =>
      ipcRenderer.invoke('version:rollback', documentId, versionId, userId),
    
    getComparison: (documentId: number, userId: number) =>
      ipcRenderer.invoke('version:getComparison', documentId, userId)
  },
```

**位置：** 在文件的第 283 行左右，`file` API 的 `}` 之后，`system` API 的注释之前。

---

## 下一步：前端实现

完成 preload.ts 修改后，需要：

1. 修改 DocumentReviewPage.tsx：
   - 添加对照修订模式切换
   - 添加目录收起/展开功能
   - 实现双栏布局和同步滚动
   - 添加保存版本功能

2. 删除不需要的文件：
   - `desktop/src/renderer/pages/ReviewComparisonPage.tsx`（这是之前错误创建的独立页面）
   - `desktop/src/renderer/styles/ReviewComparisonPage.css`
   - `desktop/src/renderer/components/CommentPanel.tsx`（如果不需要）
   - `desktop/src/renderer/styles/CommentPanel.css`

3. 从 App.tsx 中移除 ReviewComparisonPage 的路由

---

## 测试清单

完成所有实现后需要测试：

- [ ] 文档上传后自动创建版本1
- [ ] 修改条款后，对照视图能正确显示原始版本和当前编辑
- [ ] 保存版本功能正常工作
- [ ] 版本列表显示正确
- [ ] 回滚功能正常工作
- [ ] 同步滚动功能正常
- [ ] 目录收起/展开功能正常
