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
  const { user } = useAuth();
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
    if (!user) {
      message.error('請先登入');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.annotation.getByClause(clauseId, user.id);
      
      if (result.success && result.data && result.data.items) {
        setAnnotations(result.data.items);
      } else {
        message.error(result.message || '載入備註失敗');
      }
    } catch (error) {
      console.error('載入備註失敗:', error);
      message.error('載入備註失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user) {
      message.error('請先登入');
      return;
    }

    if (!newContent.trim()) {
      message.error('備註內容不能為空');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.create(
        clauseId,
        user.id,
        newContent,
        newType
      );

      if (result.success) {
        message.success('添加備註成功');
        setNewContent('');
        setNewType('comment');
        setIsAdding(false);
        loadAnnotations();
      } else {
        message.error(result.message || '添加備註失敗');
      }
    } catch (error) {
      console.error('添加備註失敗:', error);
      message.error('添加備註失敗');
    }
  };

  const handleUpdate = async (annotationId: number) => {
    if (!user) {
      message.error('請先登入');
      return;
    }

    if (!editContent.trim()) {
      message.error('備註內容不能為空');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.update(
        annotationId,
        user.id,
        editContent
      );

      if (result.success) {
        message.success('更新備註成功');
        setEditingId(null);
        setEditContent('');
        loadAnnotations();
      } else {
        message.error(result.message || '更新備註失敗');
      }
    } catch (error) {
      console.error('更新備註失敗:', error);
      message.error('更新備註失敗');
    }
  };

  const handleDelete = async (annotationId: number) => {
    if (!user) {
      message.error('請先登入');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.delete(annotationId, user.id);

      if (result.success) {
        message.success('刪除備註成功');
        loadAnnotations();
      } else {
        message.error(result.message || '刪除備註失敗');
      }
    } catch (error) {
      console.error('刪除備註失敗:', error);
      message.error('刪除備註失敗');
    }
  };

  const handleResolve = async (annotationId: number) => {
    if (!user) {
      message.error('請先登入');
      return;
    }

    try {
      const result = await window.electronAPI.annotation.resolve(annotationId, user.id);

      if (result.success) {
        message.success('標記為已解決');
        loadAnnotations();
      } else {
        message.error(result.message || '操作失敗');
      }
    } catch (error) {
      console.error('標記失敗:', error);
      message.error('操作失敗');
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
      comment: { color: 'blue', text: '評論' },
      suggestion: { color: 'green', text: '建議' },
      question: { color: 'orange', text: '疑問' },
      issue: { color: 'red', text: '問題' },
    };
    const config = tagMap[type] || tagMap.comment;
    return <Tag color={config.color} icon={getTypeIcon(type)}>{config.text}</Tag>;
  };

  const renderMentions = (content: string) => {
    // 將 @username 高亮顯示
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
          <CommentOutlined /> 備註 ({annotations.length})
        </h3>
        <Button type="text" onClick={onClose}>
          關閉
        </Button>
      </div>

      <div className="annotation-panel-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : (
          <>
            {/* 備註列表 */}
            {annotations.length === 0 ? (
              <Empty description="暫無備註" style={{ margin: '40px 0' }} />
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
                          已解決
                        </Tag>
                      )}
                    </div>

                    {editingId === annotation.id ? (
                      <div className="annotation-edit">
                        <TextArea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          placeholder="輸入備註內容，使用 @username 提及他人"
                        />
                        <div className="annotation-actions">
                          <Space>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleUpdate(annotation.id)}
                            >
                              保存
                            </Button>
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingId(null);
                                setEditContent('');
                              }}
                            >
                              取消
                            </Button>
                          </Space>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="annotation-content">
                          {renderMentions(annotation.content)}
                        </div>
                        {user && annotation.user_id === user.id && annotation.status === 'active' && (
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
                                解決
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(annotation.id)}
                              >
                                刪除
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

            {/* 添加備註表單 */}
            {isAdding ? (
              <Card size="small" className="annotation-form">
                <Select
                  value={newType}
                  onChange={setNewType}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  <Option value="comment">
                    <CommentOutlined /> 評論
                  </Option>
                  <Option value="suggestion">
                    <BulbOutlined /> 建議
                  </Option>
                  <Option value="question">
                    <QuestionCircleOutlined /> 疑問
                  </Option>
                  <Option value="issue">
                    <ExclamationCircleOutlined /> 問題
                  </Option>
                </Select>
                <TextArea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="輸入備註內容，使用 @username 提及他人"
                  style={{ marginBottom: 12 }}
                />
                <div className="annotation-form-actions">
                  <Space>
                    <Button type="primary" onClick={handleAdd}>
                      添加備註
                    </Button>
                    <Button onClick={() => {
                      setIsAdding(false);
                      setNewContent('');
                      setNewType('comment');
                    }}>
                      取消
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
                添加備註
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;
