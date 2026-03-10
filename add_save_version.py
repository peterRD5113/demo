#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
添加保存版本功能到 DocumentReviewPage.tsx
"""

import re
import sys
import io

# 设置输出编码为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

# 读取文件
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 添加 SaveOutlined 图标导入
if 'SaveOutlined' not in content:
    content = content.replace(
        'import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined } from',
        'import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined, SaveOutlined } from'
    )
    print("[OK] Added SaveOutlined import")

# 2. 添加 handleSaveVersion 函数
save_version_function = '''
  const handleSaveVersion = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.version.create(
        parseInt(documentId),
        userId,
        `手動保存 - ${new Date().toLocaleString()}`
      );

      if (response.success) {
        message.success('版本保存成功');
      } else {
        message.error(response.message || '保存版本失敗');
      }
    } catch (error) {
      console.error('保存版本失敗:', error);
      message.error('保存版本失敗');
    }
  };
'''

if 'handleSaveVersion' not in content:
    # 在 handleExport 之后插入
    pattern = r'(  const handleExport = \(\) => \{\s+setShowExportModal\(true\);\s+\};)'
    replacement = r'\1' + save_version_function
    content = re.sub(pattern, replacement, content)
    print("[OK] Added handleSaveVersion function")

# 3. 添加"保存版本"按钮
button_code = '''              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={handleSaveVersion}
              >
                保存版本
              </Button>
'''

if 'onClick={handleSaveVersion}' not in content:
    # 在"导出"按钮之后插入
    pattern = r'(              <Button\s+type="default"\s+icon={<DownloadOutlined />}\s+onClick={handleExport}\s+>\s+導出\s+</Button>)'
    replacement = r'\1' + button_code
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("[OK] Added save version button")

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n[SUCCESS] Modification completed!")
print("\nChanges made:")
print("1. Imported SaveOutlined icon")
print("2. Added handleSaveVersion function")
print("3. Added 'Save Version' button in the top button area")
print("\nNext step: Start the app and test the save version functionality")
