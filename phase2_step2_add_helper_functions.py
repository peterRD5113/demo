#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段2 - 第2步：实现辅助函数
添加加载版本、同步滚动、切换侧边栏等函数
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("阶段2 - 第2步：实现辅助函数")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 定义要添加的函数
helper_functions = '''
  // ============= 对照修订相关函数 =============
  
  // 加载最新版本
  const loadLatestVersion = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      // 获取最新版本
      const versionResponse = await window.electronAPI.version.getLatest(
        parseInt(documentId),
        userId
      );

      if (versionResponse.success && versionResponse.data) {
        setLatestVersion(versionResponse.data);

        // 获取版本的条款
        const clausesResponse = await window.electronAPI.version.getClauses(
          versionResponse.data.id,
          userId
        );

        if (clausesResponse.success && clausesResponse.data) {
          setVersionClauses(clausesResponse.data);
        }
      } else {
        message.warning('暂无保存的版本');
      }
    } catch (error) {
      console.error('加载版本失败:', error);
      message.error('加载版本失败');
    }
  };

  // 切换对照模式
  const toggleComparisonMode = async () => {
    if (!isComparisonMode) {
      // 进入对照模式：加载最新版本
      await loadLatestVersion();
    }
    setIsComparisonMode(!isComparisonMode);
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 同步滚动 - 左侧滚动时
  const handleLeftScroll = useCallback(() => {
    if (isSyncing || !leftRef.current || !rightRef.current) return;
    
    setIsSyncing(true);
    requestAnimationFrame(() => {
      if (leftRef.current && rightRef.current) {
        rightRef.current.scrollTop = leftRef.current.scrollTop;
      }
      setTimeout(() => setIsSyncing(false), 50);
    });
  }, [isSyncing]);

  // 同步滚动 - 右侧滚动时
  const handleRightScroll = useCallback(() => {
    if (isSyncing || !leftRef.current || !rightRef.current) return;
    
    setIsSyncing(true);
    requestAnimationFrame(() => {
      if (leftRef.current && rightRef.current) {
        leftRef.current.scrollTop = rightRef.current.scrollTop;
      }
      setTimeout(() => setIsSyncing(false), 50);
    });
  }, [isSyncing]);
'''

# 找到插入点（注意有两个空行）
insertion_marker = '''  };


  const getRiskLevel = (clauseId: number): 'high' | 'medium' | 'low' | null => {'''

replacement = '''  };
''' + helper_functions + '''

  const getRiskLevel = (clauseId: number): 'high' | 'medium' | 'low' | null => {'''

if insertion_marker in content and 'loadLatestVersion' not in content:
    content = content.replace(insertion_marker, replacement)
    print("\n✓ 成功添加辅助函数")
    print("\n添加的函数:")
    print("  1. loadLatestVersion() - 加载最新版本和条款")
    print("  2. toggleComparisonMode() - 切换对照模式")
    print("  3. toggleSidebar() - 切换侧边栏显示/隐藏")
    print("  4. handleLeftScroll() - 左侧滚动同步")
    print("  5. handleRightScroll() - 右侧滚动同步")
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n" + "=" * 60)
    print("第2步完成 ✓")
    print("=" * 60)
    print("\n关键实现:")
    print("1. loadLatestVersion:")
    print("   - 调用 version.getLatest API")
    print("   - 调用 version.getClauses API")
    print("   - 更新状态")
    print("\n2. toggleComparisonMode:")
    print("   - 进入对照模式时加载版本")
    print("   - 切换 isComparisonMode 状态")
    print("\n3. 滚动同步:")
    print("   - 使用 useCallback 优化性能")
    print("   - 使用 isSyncing 防止循环触发")
    print("   - 使用 requestAnimationFrame 优化")
    print("\n下一步：修改按钮区域")
    print("=" * 60)
else:
    if 'loadLatestVersion' in content:
        print("\n! 函数已存在")
    else:
        print("\n! 插入点不匹配")
        print("\n正在查找插入点...")
        # 显示实际的插入点附近内容
        idx = content.find('const getRiskLevel')
        if idx > 0:
            print("\n找到的内容:")
            print(content[idx-100:idx+100])
    sys.exit(1)
