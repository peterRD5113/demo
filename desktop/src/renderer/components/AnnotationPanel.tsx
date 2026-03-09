// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Space, Tag, message, Empty, Spin } from 'antd';
import {
  CommentOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AnnotationPanel.css';

const { TextArea } = Input;
const { Option } = Select;

interface Annotation {
  id: number;
  clause_id: number;
  user_id: number;
  username: string;
  content: string;
  type: 'comment' | 'suggestion' | 'question' | 'issue';
  status: 'active' | 'resolved' | 'deleted';
  created_at: string;
  updated_at: string;
}

interface AnnotationPanelProps {
  clauseId: number;
  visible: boolean;
  onClose: () => void;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ clauseId, visible, onClose }) => {
  const { currentUser } = useAuth();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'comment' | 'suggestion' | 'question' | 'issue'>('comment');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (visible && clauseId) {
      loadAnnotations();
    }
  }, [visible, clauseId]);

  const loadAnnotations = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.annotation.getByClause(clauseId, currentUser.id);
      
      if (result.success && result.data && result.data.items) {
        setAnnotations(result.data.items);
      } else {
        message.error(result.message || '載入?�註失�?');
      }
    } catch (error) {
      console.error('載入?�註失�?:', error);
      message.error('載入?�註失�?');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newContent.trim()) {
      message.error('?�註?�容不能?�空');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.create(
        clauseId,
        currentUser.id,
        newContent,
        newType
      );

      if (result.success) {
        message.success('添�??�註?��?');
        setNewContent('');
        setNewType('comment');
        setIsAdding(false);
        loadAnnotations();
      } else {
        message.error(result.message || '添�??�註失�?');
      }
    } catch (error) {
      console.error('添�??�註失�?:', error);
      message.error('添�??�註失�?');
    }
  };

  const handleUpdate = async (annotationId: number) => {
    if (!editContent.trim()) {
      message.error('?�註?�容不能?�空');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.update(
        annotationId,
        currentUser.id,
        editContent
      );

      if (result.success) {
        message.success('?�新?�註?��?');
        setEditingId(null);
        setEditContent('');
        loadAnnotations();
      } else {
        message.error(result.message || '?�新?�註失�?');
      }
    } catch (error) {
      console.error('?�新?�註失�?:', error);
      message.error('?�新?�註失�?');
    }
  };

  const handleDelete = async (annotationId: number) => {
    try {
      const result = await window.electronAPI.annotation.delete(annotationId, currentUser.id);

      if (result.success) {
        message.success('?�除?�註?��?');
        loadAnnotations();
      } else {
        message.error(result.message || '?�除?�註失�?');
      }
    } catch (error) {
      console.error('?�除?�註失�?:', error);
      message.error('?�除?�註失�?');
    }
  };

  const handleResolve = async (annotationId: number) => {
    try {
      const result = await window.electronAPI.annotation.resolve(annotationId, currentUser.id);

      if (result.success) {
        message.success('標�??�已�?��');
        loadAnnotations();
      } else {
        message.error(result.message || '?��?失�?');
      }
    } catch (error) {
      console.error('標�?失�?:', error);
      message.error('?��?失�?');
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap = {
      comment: <CommentOutlined />,
      suggestion: <BulbOutlined />,
      question: <QuestionCircleOutlined />,
      issue: <ExclamationCircleOutlined />,
    };
    return iconMap[type] || <CommentOutlined />;
  };

  const getTypeTag = (type: string) => {
    const tagMap = {
      comment: { color: 'blue', text: '評�?' },
      suggestion: { color: 'green', text: '建議' },
      question: { color: 'orange', text: '?��?' },
      issue: { color: 'red', text: '?��?' },
    };
    const config = tagMap[type] || tagMap.comment;
    return <Tag color={config.color} icon={getTypeIcon(type)}>{config.text}</Tag>;
  };

  const renderMentions = (content: string) => {
    // �?@username 高亮顯示
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="mention-highlight">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!visible) return null;

  return (
    <div className="annotation-panel">
      <div className="annotation-panel-header">
        <h3>
          <CommentOutlined /> ?�註 ({annotations.length})
        </h3>
        <Button type="text" onClick={onClose}>
          ?��?
        </Button>
      </div>

      <div className="annotation-panel-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* ?�註?�表 */}
            {annotations.length === 0 ? (
              <Empty description="?�無?�註" style={{ margin: '40px 0' }} />
            ) : (
              <div className="annotations-list">
                {annotations.map((annotation) => (
                  <Card
                    key={annotation.id}
                    size="small"
                    className={`annotation-card ${annotation.status === 'resolved' ? 'resolved' : ''}`}
                  >
                    <div className="annotation-header">
                      <Space>
                        {getTypeTag(annotation.type)}
                        <span className="annotation-author">{annotation.username}</span>
                        <span className="annotation-time">
                          {new Date(annotation.created_at).toLocaleString()}
                        </span>
                      </Space>
                      {annotation.status === 'resolved' && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          已解�?
                        </Tag>
                      )}
                    </div>

                    {editingId === annotation.id ? (
                      <div className="annotation-edit">
                        <TextArea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          placeholder="輸入?�註?�容，使??@username ?��??��?"
                        />
                        <div className="annotation-actions">
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleUpdate(annotation.id)}
                            >
                              保�?
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                              }}
                            >
                              ?��?
                            </Button>
                          </Space>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="annotation-content">
                          {renderMentions(annotation.content)}
                        </div>
                        {annotation.user_id === currentUser.id && annotation.status === 'active' && (
                          <div className="annotation-actions">
                            <Space>
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingId(annotation.id);
                                  setEditContent(annotation.content);
                                }}
                              >
                                編輯
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleResolve(annotation.id)}
                              >
                                �?��
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(annotation.id)}
                              >
                                ?�除
                              </Button>
                            </Space>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* 添�??�註表單 */}
            {isAdding ? (
              <Card size="small" className="annotation-form">
                <Select
                  value={newType}
                  onChange={setNewType}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <Option value="comment">
                    <CommentOutlined /> 評�?
                  </Option>
                  <Option value="suggestion">
                    <BulbOutlined /> 建議
                  </Option>
                  <Option value="question">
                    <QuestionCircleOutlined /> ?��?
                  </Option>
                  <Option value="issue">
                    <ExclamationCircleOutlined /> ?��?
                  </Option>
                </Select>
                <TextArea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="輸入?�註?�容，使??@username ?��??��?"
                  style={{ marginBottom: 12 }}
                />
                <div className="annotation-form-actions">
                  <Space>
                    <Button type="primary" onClick={handleAdd}>
                      添�??�註
                    </Button>
                    <Button onClick={() => {
                      setIsAdding(false);
                      setNewContent('');
                      setNewType('comment');
                    }}>
                      ?��?
                    </Button>
                  </Space>
                </div>
              </Card>
            ) : (
              <Button
                type="dashed"
                block
                icon={<CommentOutlined />}
                onClick={() => setIsAdding(true)}
                style={{ marginTop: 16 }}
              >
                添�??�註
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;
