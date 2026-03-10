#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
阶段2 - 第5步完整版：实现双栏布局
将条款内容区域改为条件渲染：单栏模式或双栏模式
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = r'c:\Users\fortu\Desktop\Project\Demo\desktop\src\renderer\pages\DocumentReviewPage.tsx'

print("=" * 60)
print("阶段2 - 第5步：实现双栏布局（完整版）")
print("=" * 60)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 定义要替换的旧内容（单栏模式）
old_content = '''            {/* 右侧条款内容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="clauses-section">
                <Title level={4}>
                  合同條款 ({clauses.filter(c => c.level > 0).length} 條)
                  {risks.length > 0 && (
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '16px' }}>
                      <CheckCircleOutlined /> 已完成風險識別
                    </Text>
                  )}
                </Title>
                
                {clauses.length === 0 ? (
                  <Empty 
                    description="暫無條款數據，請先解析文檔" 
                    style={{ marginTop: 40 }}
                  />
                ) : (
                  <div className="clauses-list" style={{ marginTop: 16 }}>
                    {clauses.map((clause) => {
                      // 文档标题显示
                      if (clause.level === -1) {
                        return (
                          <div 
                            key={clause.id}
                            id={`clause-${clause.id}`}
                            style={{
                              padding: '24px 32px',
                              backgroundColor: '#fafafa',
                              borderRadius: '4px',
                              marginBottom: '24px',
                              textAlign: 'center'
                            }}
                          >
                            <Text strong style={{ fontSize: '24px', color: '#262626' }}>
                              {clause.title}
                            </Text>
                          </div>
                        );
                      }
                      
                      // 章节显示
                      if (clause.level === 0) {
                        return (
                          <div 
                            key={clause.id}
                            id={`clause-${clause.id}`}
                            style={{
                              padding: '16px 24px',
                              backgroundColor: '#f0f5ff',
                              borderLeft: '4px solid #1890ff',
                              marginBottom: '16px',
                              marginTop: '32px',
                              borderRadius: '4px'
                            }}
                          >
                            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                              {clause.title}
                            </Text>
                          </div>
                        );
                      }
                      
                      // 条款显示
                      const riskLevel = getRiskLevel(clause.id);
                      const riskDescription = getRiskDescription(clause.id);
                      
                      return (
                        <div 
                          key={clause.id}
                          id={`clause-${clause.id}`}
                          style={{ 
                            transition: 'background-color 0.3s',
                            borderRadius: '4px',
                            paddingLeft: `${(clause.level - 1) * 24}px`,
                            marginBottom: '12px'
                          }}
                        >
                          <ClauseItem
                            clause={{
                              ...clause,
                              risk_level: riskLevel,
                              risk_description: riskDescription,
                              annotation: null
                            }}
                            onClick={() => handleClauseClick(clause.id)}
                            onUpdate={handleClauseUpdate}
                            editable={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>'''

# 由于新内容太长，我将其保存到单独的文件
new_content_file = r'c:\Users\fortu\Desktop\Project\Demo\phase2_step5_new_content.txt'

# 读取新内容模板
try:
    with open(new_content_file, 'r', encoding='utf-8') as f:
        new_content = f.read()
    print("✓ 从文件读取新内容模板")
except FileNotFoundError:
    print("! 新内容模板文件不存在")
    print("! 正在创建模板文件...")
    
    # 创建新内容模板
    # 这里我会先创建模板文件，然后再运行替换
    print("\n请稍等，我需要先创建新内容模板...")
    sys.exit(2)  # 特殊退出码，表示需要先创建模板

if old_content in content:
    print("✓ 找到要替换的内容")
    print(f"  旧内容长度: {len(old_content)} 字符")
    print(f"  新内容长度: {len(new_content)} 字符")
    
    # 执行替换
    content = content.replace(old_content, new_content)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✓ 替换成功！")
    print("\n" + "=" * 60)
    print("第5步完成 ✓")
    print("=" * 60)
    print("\n实现的功能:")
    print("1. 单栏模式（!isComparisonMode）:")
    print("   - 保持原有布局")
    print("   - 显示标题、章节、条款")
    print("   - 可编辑")
    print("\n2. 双栏模式（isComparisonMode）:")
    print("   - 左栏：最新版本（只读）")
    print("   - 右栏：当前编辑（可编辑）")
    print("   - 同步滚动")
    print("\n下一步：测试功能")
    print("=" * 60)
else:
    print("\n✗ 未找到要替换的内容")
    print("可能原因：")
    print("1. 文件已经被修改过")
    print("2. 内容格式不完全匹配")
    sys.exit(1)
