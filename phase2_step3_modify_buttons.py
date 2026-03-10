#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段2 - 第3步：修改按钮区域
添加"收起目录"和"对照修订"按钮
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("阶段2 - 第3步：修改按钮区域")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到按钮区域
# 原有的按钮区域：导出、保存版本、版本管理
old_buttons = '''            <Space>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                導出
              </Button>              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={handleSaveVersion}
              >
                保存版本
              </Button>

              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={handleVersionManagement}
              >
                版本管理
              </Button>
            </Space>'''

# 新的按钮区域：添加收起目录和对照修订按钮
new_buttons = '''            <Space>
              <Button
                type="default"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? '展开目录' : '收起目录'}
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                導出
              </Button>
              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={handleSaveVersion}
              >
                保存版本
              </Button>
              <Button
                type={isComparisonMode ? 'primary' : 'default'}
                icon={<SwapOutlined />}
                onClick={toggleComparisonMode}
              >
                {isComparisonMode ? '退出对照' : '对照修订'}
              </Button>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={handleVersionManagement}
              >
                版本管理
              </Button>
            </Space>'''

if old_buttons in content:
    content = content.replace(old_buttons, new_buttons)
    print("\n✓ 成功修改按钮区域")
    print("\n添加的按钮:")
    print("  1. 收起目录/展开目录 - 切换侧边栏显示")
    print("  2. 对照修订/退出对照 - 切换对照模式")
    print("\n按钮顺序:")
    print("  收起目录 → 导出 → 保存版本 → 对照修订 → 版本管理")
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n" + "=" * 60)
    print("第3步完成 ✓")
    print("=" * 60)
    print("\n按钮功能:")
    print("1. 收起目录按钮:")
    print("   - 图标根据状态切换")
    print("   - 文字根据状态切换")
    print("   - 点击调用 toggleSidebar()")
    print("\n2. 对照修订按钮:")
    print("   - 对照模式时显示为 primary（蓝色）")
    print("   - 文字根据状态切换")
    print("   - 点击调用 toggleComparisonMode()")
    print("\n下一步：修改目录区域")
    print("=" * 60)
else:
    print("\n! 按钮区域不匹配")
    print("\n正在查找按钮区域...")
    idx = content.find('<Space>')
    if idx > 0:
        print("\n找到的内容:")
        print(content[idx:idx+500])
    sys.exit(1)
