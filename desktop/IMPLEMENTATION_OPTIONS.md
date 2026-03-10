# DocumentReviewPage 对照修订功能 - 完整实现方案

## 当前状态

✅ 后端完全完成：
- 数据库表
- VersionService
- IPC handlers
- preload API

❌ 前端需要完成：
- DocumentReviewPage 修改

## 问题分析

之前的修改失败是因为：
1. 文件太大（706行）
2. JSX 结构复杂，嵌套层级多
3. 自动替换容易破坏结构

## 推荐方案

**方案A：最小化修改（推荐）**
只添加对照修订的核心功能，不改动现有的复杂样式和结构。

**方案B：完全重写**
创建一个新的简化版本，但需要大量测试。

## 方案A：最小化修改步骤

### 步骤1：添加导入和状态（已完成部分）

在文件顶部添加：
```typescript
import { useRef, useCallback } from 'react';
import { Modal, Input } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, SaveOutlined } from '@ant-design/icons';

const { TextArea } = Input;
```

在状态声明部分添加：
```typescript
const [isComparisonMode, setIsComparisonMode] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [versionClauses, setVersionClauses] = useState<Clause[]>([]);
const [latestVersion, setLatestVersion] = useState<any>(null);
const [isSyncing, setIsSyncing] = useState(false);

const leftRef = useRef<HTMLDivElement>(null);
const rightRef = useRef<HTMLDivElement>(null);
```

### 步骤2：添加函数

在 `loadRisks` 函数后添加 `loadLatestVersion`、同步滚动函数、切换函数、保存版本函数。

### 步骤3：修改按钮区域

替换"对照修订"按钮的 onClick 事件。

### 步骤4：修改条款显示区域

这是最复杂的部分。需要：
1. 在条款内容外层添加 `{!isComparisonMode ? (...) : (...)}`
2. 单栏模式保持原样
3. 双栏模式添加左右两栏

## 建议

由于修改复杂且容易出错，我建议：

1. **先测试后端功能**
   - 使用 Postman 或类似工具测试 IPC API
   - 确保版本创建、获取等功能正常

2. **分阶段实现前端**
   - 第一阶段：只添加"保存版本"按钮和功能
   - 第二阶段：添加简单的对照视图（不需要复杂样式）
   - 第三阶段：优化UI和交互

3. **或者使用现有的 ReviewComparisonPage**
   - 虽然它是独立页面，但功能是完整的
   - 可以先用它来测试后端功能
   - 之后再慢慢迁移到 DocumentReviewPage

你想选择哪个方案？
