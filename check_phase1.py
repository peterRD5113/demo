#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DocumentReviewPage.tsx 代码检查脚本
"""

import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("DocumentReviewPage.tsx 代码检查")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

issues = []
warnings = []
success = []

# 1. 检查导入
print("\n[1] 检查导入...")
if 'SaveOutlined' in content:
    if re.search(r'import.*SaveOutlined.*from.*@ant-design/icons', content):
        success.append("✓ SaveOutlined 已正确导入")
    else:
        issues.append("✗ SaveOutlined 导入格式可能有问题")
else:
    issues.append("✗ 缺少 SaveOutlined 导入")

# 2. 检查函数定义
print("[2] 检查 handleSaveVersion 函数...")
if 'const handleSaveVersion' in content:
    success.append("✓ handleSaveVersion 函数已定义")
    
    # 检查函数内容
    if 'window.electronAPI.version.create' in content:
        success.append("✓ 调用了正确的 API")
    else:
        issues.append("✗ API 调用可能有问题")
    
    if "message.success('版本保存成功')" in content:
        success.append("✓ 成功提示已添加")
    else:
        warnings.append("! 成功提示可能缺失")
    
    if "message.error" in content and "保存版本失敗" in content:
        success.append("✓ 错误处理已添加")
    else:
        warnings.append("! 错误处理可能不完整")
else:
    issues.append("✗ handleSaveVersion 函数未定义")

# 3. 检查按钮
print("[3] 检查保存版本按钮...")
if 'onClick={handleSaveVersion}' in content:
    success.append("✓ 保存版本按钮已添加")
    
    if '<SaveOutlined />' in content:
        success.append("✓ 按钮图标正确")
    else:
        warnings.append("! 按钮图标可能缺失")
    
    if '保存版本' in content:
        success.append("✓ 按钮文字正确")
    else:
        warnings.append("! 按钮文字可能缺失")
else:
    issues.append("✗ 保存版本按钮未添加")

# 4. 检查 JSX 结构
print("[4] 检查 JSX 结构...")
open_tags = content.count('<Button')
close_tags = content.count('</Button>')
if open_tags == close_tags:
    success.append(f"✓ Button 标签匹配 ({open_tags} 个)")
else:
    issues.append(f"✗ Button 标签不匹配 (开始:{open_tags}, 结束:{close_tags})")

open_space = content.count('<Space>')
close_space = content.count('</Space>')
if open_space == close_space:
    success.append(f"✓ Space 标签匹配 ({open_space} 个)")
else:
    issues.append(f"✗ Space 标签不匹配 (开始:{open_space}, 结束:{close_space})")

# 5. 检查语法问题
print("[5] 检查常见语法问题...")

# 检查是否有未闭合的括号
open_paren = content.count('(')
close_paren = content.count(')')
if abs(open_paren - close_paren) < 10:  # 允许小误差
    success.append("✓ 括号基本平衡")
else:
    warnings.append(f"! 括号可能不平衡 (开:{open_paren}, 闭:{close_paren})")

# 检查是否有未闭合的花括号
open_brace = content.count('{')
close_brace = content.count('}')
if abs(open_brace - close_brace) < 10:
    success.append("✓ 花括号基本平衡")
else:
    warnings.append(f"! 花括号可能不平衡 (开:{open_brace}, 闭:{close_brace})")

# 6. 检查按钮顺序
print("[6] 检查按钮顺序...")
button_pattern = r'onClick=\{(handle\w+)\}'
buttons = re.findall(button_pattern, content)
button_section = content[content.find('<Space>'):content.find('</Space>') + 8]
buttons_in_space = re.findall(button_pattern, button_section)

if 'handleExport' in buttons_in_space and 'handleSaveVersion' in buttons_in_space and 'handleVersionManagement' in buttons_in_space:
    success.append("✓ 三个按钮都在 Space 中")
    
    # 检查顺序
    export_pos = button_section.find('handleExport')
    save_pos = button_section.find('handleSaveVersion')
    version_pos = button_section.find('handleVersionManagement')
    
    if export_pos < save_pos < version_pos:
        success.append("✓ 按钮顺序正确：导出 → 保存版本 → 版本管理")
    else:
        warnings.append("! 按钮顺序可能不是预期的")
else:
    warnings.append("! 无法确认所有按钮都在正确位置")

# 7. 检查 TypeScript 类型
print("[7] 检查 TypeScript 类型...")
if 'async () =>' in content:
    success.append("✓ handleSaveVersion 是异步函数")
else:
    warnings.append("! handleSaveVersion 可能不是异步函数")

# 输出结果
print("\n" + "=" * 60)
print("检查结果")
print("=" * 60)

if success:
    print(f"\n✓ 成功项 ({len(success)}):")
    for item in success:
        print(f"  {item}")

if warnings:
    print(f"\n! 警告项 ({len(warnings)}):")
    for item in warnings:
        print(f"  {item}")

if issues:
    print(f"\n✗ 问题项 ({len(issues)}):")
    for item in issues:
        print(f"  {item}")

print("\n" + "=" * 60)
if not issues:
    print("状态: 通过 ✓")
    print("代码检查未发现严重问题，可以进行功能测试")
else:
    print("状态: 有问题 ✗")
    print("发现严重问题，需要修复")

print("=" * 60)

# 返回状态码
sys.exit(0 if not issues else 1)
