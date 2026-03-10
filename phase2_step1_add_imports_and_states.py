#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段2 - 第1步：添加导入和状态
这是最安全的一步，只添加必要的导入和状态声明
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("阶段2 - 第1步：添加导入和状态")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = []

# 1. 添加 useRef 和 useCallback 到 React 导入
print("\n[1] 添加 useRef 和 useCallback...")
old_react_import = "import React, { useEffect, useState } from 'react';"
new_react_import = "import React, { useEffect, useState, useRef, useCallback } from 'react';"

if old_react_import in content:
    content = content.replace(old_react_import, new_react_import)
    changes.append("✓ 添加了 useRef 和 useCallback 导入")
else:
    print("! React 导入已包含 useRef/useCallback 或格式不同")

# 2. 添加新的图标导入
print("[2] 添加新图标...")
old_icons = "import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';"
new_icons = "import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined, SaveOutlined, SwapOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';"

if old_icons in content:
    content = content.replace(old_icons, new_icons)
    changes.append("✓ 添加了 SwapOutlined, MenuFoldOutlined, MenuUnfoldOutlined 图标")
else:
    print("! 图标导入格式不同或已包含新图标")

# 3. 添加新的状态变量
print("[3] 添加新状态变量...")

# 找到现有状态声明的位置（在 showExportModal 之后）
state_insertion_point = "  const [showExportModal, setShowExportModal] = useState(false);"

new_states = """  const [showExportModal, setShowExportModal] = useState(false);

  // 对照修订模式相关状态
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [latestVersion, setLatestVersion] = useState<any>(null);
  const [versionClauses, setVersionClauses] = useState<Clause[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 滚动同步相关
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);"""

if state_insertion_point in content and 'isComparisonMode' not in content:
    content = content.replace(state_insertion_point, new_states)
    changes.append("✓ 添加了对照修订相关状态")
    changes.append("✓ 添加了滚动同步相关状态和 refs")
else:
    print("! 状态已存在或插入点不同")

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 输出结果
print("\n" + "=" * 60)
print("修改完成")
print("=" * 60)

if changes:
    print("\n成功的修改:")
    for change in changes:
        print(f"  {change}")
else:
    print("\n! 没有进行任何修改（可能已经修改过）")

print("\n" + "=" * 60)
print("第1步完成 ✓")
print("=" * 60)
print("\n添加的内容：")
print("1. React hooks: useRef, useCallback")
print("2. 图标: SwapOutlined, MenuFoldOutlined, MenuUnfoldOutlined")
print("3. 状态变量:")
print("   - isComparisonMode: 是否处于对照模式")
print("   - latestVersion: 最新版本数据")
print("   - versionClauses: 版本条款列表")
print("   - sidebarCollapsed: 侧边栏是否收起")
print("   - leftRef, rightRef: 滚动容器引用")
print("   - isSyncing: 是否正在同步滚动")
print("\n下一步：实现辅助函数")
print("=" * 60)
