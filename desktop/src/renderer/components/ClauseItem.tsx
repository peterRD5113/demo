// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Tag, Space, Button, Input, message, Dropdown, Modal } from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ClauseItem.css';

const { TextArea } = Input;

interface Clause {
  id: number;
  clause_number: string;
  title?: string | null;
  content: string;
  risk_level: string | null;
  risk_description: string | null;
  suggestion: string | null;
  matched_text: string | null;
  annotation: string | null;
  commentCount?: number;
}

interface ClauseItemProps {
  clause: Clause;
  onClick: () => void;
  onUpdate?: () => void;
  editable?: boolean;
  onCommentClick?: (clauseId: number) => void;
  isCommentActive?: boolean;
  showCommentButton?: boolean;
}

const ClauseItem: React.FC<ClauseItemProps> = ({ 
  clause, 
  onClick, 
  onUpdate,
  editable = true,
  onCommentClick,
  isCommentActive = false,
  showCommentButton = false
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(clause.title || '');
  const [editedContent, setEditedContent] = useState(clause.content);
  const [isSaving, setIsSaving] = useState(false);
  const [clauseTemplates, setClauseTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (isEditing) {
      loadClauseTemplates();
    }
  }, [isEditing]);

  const loadClauseTemplates = async () => {
    try {
      const res = await window.electronAPI.template.list('clause');
      if (res.success && res.data?.items) {
        setClauseTemplates(res.data.items);
      }
    } catch (e) {
      // 靜默失敗，不影響編輯功能
    }
  };

  const handleInsertTemplate = (tpl: any) => {
    const hasTitle = editedTitle.trim().length > 0;
    const hasContent = editedContent.trim().length > 0;
    if (hasTitle || hasContent) {
      Modal.confirm({
        title: '插入模板',
        content: '插入模板將取代現有的標題與內容，確定繼續嗎？',
        okText: '確定取代',
        cancelText: '取消',
        onOk: () => {
          setEditedTitle(tpl.title || '');
          setEditedContent(tpl.content);
        },
      });
    } else {
      setEditedTitle(tpl.title || '');
      setEditedContent(tpl.content);
    }
  };

  const getRiskIcon = (level: string | null) => {
    if (!level) return null;

    const iconMap: Record<string, React.ReactNode> = {
      high: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      medium: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      low: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    };

    return iconMap[level];
  };

  const getRiskTag = (level: string | null) => {
    if (!level) return null;

    const tagMap: Record<string, { color: string; text: string }> = {
      high: { color: 'error', text: '高風險' },
      medium: { color: 'warning', text: '中風險' },
      low: { color: 'processing', text: '低風險' },
    };

    const config = tagMap[level];
    return config ? (
      <Tag color={config.color} icon={getRiskIcon(level)}>
        {config.text}
      </Tag>
    ) : null;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      message.error('用戶未登入，無法保存');
      return;
    }
    
    if (!editedContent.trim()) {
      message.error('條款內容不能為空');
      return;
    }

    if (editedContent.length > 10000) {
      message.error('條款內容不能超過 10000 字符');
      return;
    }

    if (editedTitle.length > 200) {
      message.error('條款標題不能超過 200 字符');
      return;
    }

    setIsSaving(true);
    try {
      // 构建更新数据对象
      const updateData: { content: string; title?: string } = {
        content: editedContent
      };
      
      // 只有当标题有值时才包含 title 字段
      if (editedTitle.trim()) {
        updateData.title = editedTitle.trim();
      }
      
      const result = await window.electronAPI.clause.update(
        clause.id,
        user.id,
        updateData
      );

      if (result.success) {
        message.success('保存成功');
        setIsEditing(false);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        message.error(result.message || '保存失敗');
      }
    } catch (error) {
      console.error('保存條款失敗:', error);
      message.error('保存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(clause.title || '');
    setEditedContent(clause.content);
    setIsEditing(false);
  };

  const handleCardClick = () => {
    if (!isEditing) {
      onClick();
    }
  };

  // Render clause content with matched text highlighted
  const renderHighlightedContent = (
    content: string,
    matchedText: string | null,
    riskLevel: string | null
  ) => {
    if (!matchedText || !riskLevel) {
      return content;
    }

    // matchedText from DB is the first 200 chars of clause content;
    // find any sub-segment that overlaps with what was stored
    const highlightMap: Record<string, string> = {
      high: 'highlight-high',
      medium: 'highlight-medium',
      low: 'highlight-low',
    };
    const cls = highlightMap[riskLevel] || '';

    // Try to find the matched segment inside content
    const matchedTrimmed = matchedText.trim();
    const idx = content.indexOf(matchedTrimmed);
    if (idx === -1) {
      // If not found verbatim, just highlight the whole content block with a wrapper
      return (
        <span className={`content-highlight-block ${cls}`}>{content}</span>
      );
    }

    const before = content.slice(0, idx);
    const highlighted = content.slice(idx, idx + matchedTrimmed.length);
    const after = content.slice(idx + matchedTrimmed.length);

    return (
      <>
        {before}
        <span className={`content-highlight ${cls}`}>{highlighted}</span>
        {after}
      </>
    );
  };

  return (
    <Card
      className={`clause-item ${clause.risk_level ? `risk-${clause.risk_level}` : ''} ${isEditing ? 'editing' : ''}`}
      hoverable={!isEditing}
      onClick={handleCardClick}
    >
      <div className="clause-header">
        <div className="clause-header-left">
          <Space>
            <span className="clause-number">{clause.clause_number}</span>
            {getRiskTag(clause.risk_level)}
          </Space>
        </div>
        
        {!isEditing && (
          <div className="clause-header-right">
            <Space size="small">
              {showCommentButton && onCommentClick && (
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentClick(clause.id);
                  }}
                  className={`comment-button ${isCommentActive ? 'active' : ''}`}
                >
                  批注({clause.commentCount || 0})
                  {isCommentActive && ' ✓'}
                </Button>
              )}
              
              {editable && (
                <Button
                  type="text"
                  size="small"
                  onClick={handleEdit}
                  className="edit-button"
                >
                  编辑
                </Button>
              )}
            </Space>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="clause-edit-mode" onClick={(e) => e.stopPropagation()}>
          {/* 插入模板工具列 */}
          {clauseTemplates.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Dropdown
                menu={{
                  items: (() => {
                    const categories = Array.from(new Set(clauseTemplates.map((t: any) => t.category)));
                    return categories.map((cat: any) => ({
                      key: cat,
                      label: cat,
                      children: clauseTemplates
                        .filter((t: any) => t.category === cat)
                        .map((t: any) => ({
                          key: String(t.id),
                          label: t.name,
                          onClick: () => handleInsertTemplate(t),
                        })),
                    }));
                  })()
                }}
                trigger={['click']}
              >
                <Button size="small" icon={<FileTextOutlined />}>
                  插入模板
                </Button>
              </Dropdown>
            </div>
          )}

          {/* 標題編輯器 */}
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="條款標題（可選）"
            className="clause-title-input"
            maxLength={200}
            disabled={isSaving}
          />

          {/* 內容編輯器 */}
          <TextArea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="條款內容"
            className="clause-content-textarea"
            rows={6}
            maxLength={10000}
            showCount
            disabled={isSaving}
          />

          {/* 操作按鈕 */}
          <div className="clause-edit-actions">
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={isSaving}
              >
                保存
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={isSaving}
              >
                取消
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <div className="clause-view-mode">
          {clause.title && (
            <div className="clause-title">
              {clause.title}
            </div>
          )}
          <div className="clause-content">
            {renderHighlightedContent(clause.content, clause.matched_text, clause.risk_level)}
          </div>
        </div>
      )}

      {clause.risk_description && !isEditing && (
        <div className="clause-risk-hint">
          <WarningOutlined /> {clause.risk_description}
        </div>
      )}

      {clause.suggestion && !isEditing && (
        <div className="clause-suggestion">
          <div className="clause-suggestion-label">💡 建議措辭</div>
          <div className="clause-suggestion-content">{clause.suggestion}</div>
        </div>
      )}
    </Card>
  );
};

export default ClauseItem;
