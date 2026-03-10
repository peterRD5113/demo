#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段2 - 第4步：修改目录区域
添加条件渲染，根据 sidebarCollapsed 状态显示/隐藏目录
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("阶段2 - 第4步：修改目录区域")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到目录区域的开始
old_sidebar_start = '''          {/* 左右分栏布局：左侧目录，右侧条款内容 */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* 左侧目录 */}
            {clauses.length > 0 && ('''

new_sidebar_start = '''          {/* 左右分栏布局：左侧目录，右侧条款内容 */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* 左侧目录 */}
            {!sidebarCollapsed && clauses.length > 0 && ('''

if old_sidebar_start in content:
    content = content.replace(old_sidebar_start, new_sidebar_start)
    print("\n✓ 成功修改目录区域")
    print("\n修改内容:")
    print("  添加条件: !sidebarCollapsed &&")
    print("  效果: 当 sidebarCollapsed 为 true 时，目录隐藏")
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n" + "=" * 60)
    print("第4步完成 ✓")
    print("=" * 60)
    print("\n实现逻辑:")
    print("1. 原条件: clauses.length > 0")
    print("2. 新条件: !sidebarCollapsed && clauses.length > 0")
    print("3. 结果:")
    print("   - sidebarCollapsed = false: 显示目录")
    print("   - sidebarCollapsed = true: 隐藏目录")
    print("\n下一步：实现双栏布局（最复杂的部分）")
    print("=" * 60)
else:
    print("\n! 目录区域不匹配")
    print("\n正在查找目录区域...")
    idx = content.find('左侧目录')
    if idx > 0:
        print("\n找到的内容:")
        print(content[idx-100:idx+200])
    sys.exit(1)
