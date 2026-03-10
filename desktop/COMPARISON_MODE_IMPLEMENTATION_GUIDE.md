# DocumentReviewPage 对照修订功能实现指南

## ✅ 阶段2已完全完成！

所有功能已成功实现并集成到 DocumentReviewPage.tsx 中。

## 已完成的修改

1. ✅ 添加了必要的导入
2. ✅ 添加了对照修订相关的状态变量
3. ✅ 添加了 loadLatestVersion 函数
4. ✅ 添加了同步滚动函数
5. ✅ 添加了切换侧边栏和保存版本的函数
6. ✅ 修改了按钮区域
7. ✅ 修改了主体布局部分（侧边栏条件渲染）
8. ✅ 修改了条款内容区域（单栏/双栏切换）

## 实现详情

### 1. 状态变量（第58-66行）

```typescript
// 对照修订模式相关状态
const [isComparisonMode, setIsComparisonMode] = useState(false);
const [latestVersion, setLatestVersion] = useState<any>(null);
const [versionClauses, setVersionClauses] = useState<Clause[]>([]);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

// 滚动同步相关
const leftRef = useRef<HTMLDivElement>(null);
const rightRef = useRef<HTMLDivElement>(null);
const [isSyncing, setIsSyncing] = useState(false);
```

### 2. 辅助函数（第200-300行）

#### loadLatestVersion()
- 加载最新保存的版本信息
- 获取版本对应的条款数据
- 设置到 `latestVersion` 和 `versionClauses` 状态

#### toggleComparisonMode()
- 切换对照模式开关
- 进入对照模式时自动调用 `loadLatestVersion()`

#### toggleSidebar()
- 切换侧边栏显示/隐藏状态

#### handleLeftScroll() / handleRightScroll()
- 实现左右栏的同步滚动
- 使用 `isSyncing` 标志防止循环触发
- 使用 `requestAnimationFrame` 优化性能

### 3. 按钮区域（第360-400行）

```typescript
<Space>
  <Button
    type="default"
    icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    onClick={toggleSidebar}
  >
    {sidebarCollapsed ? '展开目录' : '收起目录'}
  </Button>
  <Button type="default" icon={<DownloadOutlined />} onClick={handleExport}>
    導出
  </Button>
  <Button type="default" icon={<SaveOutlined />} onClick={handleSaveVersion}>
    保存版本
  </Button>
  <Button
    type={isComparisonMode ? 'primary' : 'default'}
    icon={<SwapOutlined />}
    onClick={toggleComparisonMode}
  >
    {isComparisonMode ? '退出对照' : '对照修订'}
  </Button>
  <Button type="primary" icon={<HistoryOutlined />} onClick={handleVersionManagement}>
    版本管理
  </Button>
</Space>
```

### 4. 侧边栏条件渲染（第429行）

```typescript
{!sidebarCollapsed && clauses.length > 0 && (
  <div style={{ width: '280px', flexShrink: 0 }}>
    <Title level={4} style={{ marginBottom: 16 }}>目錄</Title>
    {/* 目录内容 */}
  </div>
)}
```

### 5. 单栏/双栏条件渲染（第557-854行）

#### 单栏模式（isComparisonMode = false）
- 显示原有的条款列表布局
- 条款可编辑
- 显示风险标记和注释

#### 双栏模式（isComparisonMode = true）

**左栏：最新版本（只读）**
```typescript
<div 
  ref={leftRef}
  onScroll={handleLeftScroll}
  style={{ 
    flex: 1,
    minWidth: 0,
    maxHeight: 'calc(100vh - 400px)',
    overflowY: 'auto',
    border: '1px solid #e8e8e8',
    borderRadius: '4px',
    padding: '16px',
    backgroundColor: '#fafafa'
  }}
>
  {/* 蓝色标题栏 */}
  <div style={{ 
    padding: '12px 16px',
    backgroundColor: '#f0f5ff',
    borderRadius: '4px',
    marginBottom: '16px',
    borderBottom: '2px solid #1890ff'
  }}>
    <Title level={4} style={{ margin: 0 }}>
      版本 {latestVersion?.version_number || 1}（已保存）
    </Title>
    {latestVersion && (
      <Text type="secondary" style={{ fontSize: '12px' }}>
        {new Date(latestVersion.created_at).toLocaleString()}
      </Text>
    )}
  </div>
  
  {/* 版本条款列表 */}
  <div>
    {versionClauses.map((clause) => (
      <ClauseItem
        clause={clause}
        editable={false}
        onClick={() => {}}
        onUpdate={() => {}}
      />
    ))}
  </div>
</div>
```

**右栏：当前编辑（可编辑）**
```typescript
<div 
  ref={rightRef}
  onScroll={handleRightScroll}
  style={{ 
    flex: 1,
    minWidth: 0,
    maxHeight: 'calc(100vh - 400px)',
    overflowY: 'auto',
    border: '1px solid #e8e8e8',
    borderRadius: '4px',
    padding: '16px',
    backgroundColor: '#fff'
  }}
>
  {/* 橙色标题栏 */}
  <div style={{ 
    padding: '12px 16px',
    backgroundColor: '#fff7e6',
    borderRadius: '4px',
    marginBottom: '16px',
    borderBottom: '2px solid #faad14'
  }}>
    <Title level={4} style={{ margin: 0 }}>
      当前编辑中
    </Title>
    <Text type="secondary" style={{ fontSize: '12px' }}>
      未保存的修改
    </Text>
  </div>
  
  {/* 当前条款列表 */}
  <div>
    {clauses.map((clause) => (
      <ClauseItem
        clause={clause}
        editable={true}
        onClick={() => handleClauseClick(clause.id)}
        onUpdate={handleClauseUpdate}
      />
    ))}
  </div>
</div>
```

## 功能特性

### ✅ 侧边栏收起/展开
- 点击按钮切换目录显示
- 按钮图标和文字动态变化
- 条款区域自动调整宽度

### ✅ 对照修订模式
- 点击按钮进入/退出对照模式
- 进入时自动加载最新版本
- 按钮样式动态变化（primary/default）

### ✅ 双栏布局
- 左栏显示最新保存版本（只读）
- 右栏显示当前编辑内容（可编辑）
- 清晰的视觉区分（蓝色/橙色标题栏）

### ✅ 同步滚动
- 滚动左栏，右栏同步
- 滚动右栏，左栏同步
- 防止循环触发
- 性能优化

### ✅ 版本保存
- 点击按钮保存当前版本
- 显示成功/失败提示
- 保存后可在对照模式中查看

## 测试指南

详细的测试步骤请参考：`PHASE2_TESTING_GUIDE.md`

## 下一步

阶段2已完成，可以进行：
1. 功能测试（参考测试指南）
2. 修复发现的问题
3. 继续实现阶段3：版本管理页面
