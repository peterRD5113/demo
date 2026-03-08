// @ts-nocheck
import React, { useState } from 'react';
import { Card, Tag, Space, Button, Input, message } from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
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
  annotation: string | null;
}

interface ClauseItemProps {
  clause: Clause;
  onClick: () => void;
  onUpdate?: () => void;
  editable?: boolean;
}

const ClauseItem: React.FC<ClauseItemProps> = ({ 
  clause, 
  onClick, 
  onUpdate,
  editable = true 
}) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(clause.title || '');
  const [editedContent, setEditedContent] = useState(clause.content);
  const [isSaving, setIsSaving] = useState(false);

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
      const result = await window.api.clause.update(
        clause.id,
        currentUser.id,
        {
          content: editedContent,
          title: editedTitle || null
        }
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

  return (
    <Card
      className={`clause-item ${clause.risk_level ? `risk-${clause.risk_level}` : ''} ${isEditing ? 'editing' : ''}`}
      hoverable={!isEditing}
      onClick={handleCardClick}
    >
      <div className="clause-header">
        <Space>
          <span className="clause-number">{clause.clause_number}</span>
          {getRiskTag(clause.risk_level)}
          {clause.annotation && (
            <Tag icon={<CommentOutlined />} color="blue">
              有批註
            </Tag>
          )}
        </Space>
        
        {editable && !isEditing && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={handleEdit}
            className="edit-button"
          >
            編輯
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="clause-edit-mode" onClick={(e) => e.stopPropagation()}>
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
            {clause.content}
          </div>
        </div>
      )}

      {clause.risk_description && !isEditing && (
        <div className="clause-risk-hint">
          <WarningOutlined /> {clause.risk_description}
        </div>
      )}
    </Card>
  );
};

export default ClauseItem;
