// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Input, List, Avatar, Space, Popconfirm, message, Empty } from 'antd';
import {
  CloseOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/CommentPanel.css';

const { TextArea } = Input;

interface Comment {
  id: number;
  author: string;
  authorId: number;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

interface CommentPanelProps {
  clauseId: number;
  onClose: () => void;
  visible: boolean;
  onCommentAdded?: () => void;
}

const CommentPanel: React.FC<CommentPanelProps> = ({ clauseId, onClose, visible, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // 加载批注
  useEffect(() => {
    if (clauseId) {
      loadComments();
    }
  }, [clauseId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // TODO: 调用 API 获取批注
      // const result = await window.electronAPI.comment.getByClause(clauseId);
      // if (result.success) {
      //   setComments(result.data);
      // }
      
      // 暂时使用模拟数据
      setComments([
        {
          id: 1,
          author: '张三',
          authorId: 1,
          content: '需要补充验证跳转的测试步骤，确保跳转到正确页面',
          timestamp: '2024-03-09 10:30',
          replies: [],
        },
        {
          id: 2,
          author: '李四',
          authorId: 2,
          content: '同意，建议增加边界测试场景',
          timestamp: '2024-03-09 11:15',
          replies: [],
        },
      ]);
    } catch (error) {
      console.error('加载批注失败:', error);
      message.error('加载批注失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加批注
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      message.warning('请输入批注内容');
      return;
    }

    if (!user) {
      message.error('用户未登录');
      return;
    }

    try {
      // TODO: 调用 API 添加批注
      // const result = await window.electronAPI.comment.create({
      //   clauseId,
      //   userId: user.id,
      //   content: newComment,
      // });
      
      // 暂时添加到本地状态
      const newCommentObj: Comment = {
        id: Date.now(),
        author: user.username,
        authorId: user.id,
        content: newComment,
        timestamp: new Date().toLocaleString('zh-CN'),
        replies: [],
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
      message.success('批注添加成功');
      
      // 通知父组件刷新数据
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('添加批注失败:', error);
      message.error('添加批注失败');
    }
  };

  // 编辑批注
  const handleEditComment = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  // 保存编辑
  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) {
      message.warning('批注内容不能为空');
      return;
    }

    try {
      // TODO: 调用 API 更新批注
      // const result = await window.electronAPI.comment.update(commentId, {
      //   content: editContent,
      // });
      
      // 暂时更新本地状态
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, content: editContent } : c
      ));
      setEditingId(null);
      setEditContent('');
      message.success('批注更新成功');
    } catch (error) {
      console.error('更新批注失败:', error);
      message.error('更新批注失败');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 删除批注
  const handleDeleteComment = async (commentId: number) => {
    try {
      // TODO: 调用 API 删除批注
      // const result = await window.electronAPI.comment.delete(commentId);
      
      // 暂时从本地状态删除
      setComments(comments.filter(c => c.id !== commentId));
      message.success('批注删除成功');
      
      // 通知父组件刷新数据
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('删除批注失败:', error);
      message.error('删除批注失败');
    }
  };

  return (
    <div className={`comment-panel ${visible ? 'visible' : ''}`}>
      {/* 头部 */}
      <div className="comment-panel-header">
        <h3>💬 批注详情</h3>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
        />
      </div>

      {/* 当前选中条款信息 */}
      <div className="comment-panel-info">
        <div className="info-label">当前选中：</div>
        <div className="info-value">条款 #{clauseId}</div>
      </div>

      {/* 批注列表 */}
      <div className="comment-panel-content">
        {comments.length === 0 ? (
          <Empty
            description="暂无批注"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <div className="comment-count">共 {comments.length} 条批注</div>
            <List
              dataSource={comments}
              loading={loading}
              renderItem={(comment) => (
                <div className="comment-item">
                  <div className="comment-header">
                    <Space>
                      <Avatar icon={<UserOutlined />} size="small" />
                      <span className="comment-author">{comment.author}</span>
                    </Space>
                    <span className="comment-time">{comment.timestamp}</span>
                  </div>

                  {editingId === comment.id ? (
                    // 编辑模式
                    <div className="comment-edit">
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={500}
                        showCount
                      />
                      <div className="comment-edit-actions">
                        <Space>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSaveEdit(comment.id)}
                          >
                            保存
                          </Button>
                          <Button
                            size="small"
                            onClick={handleCancelEdit}
                          >
                            取消
                          </Button>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    // 查看模式
                    <>
                      <div className="comment-content">
                        {comment.content}
                      </div>
                      {user && user.id === comment.authorId && (
                        <div className="comment-actions">
                          <Space>
                            <Button
                              type="link"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleEditComment(comment)}
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确定删除这条批注吗？"
                              onConfirm={() => handleDeleteComment(comment.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            />
          </>
        )}
      </div>

      {/* 添加新批注 */}
      <div className="comment-panel-footer">
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="添加新批注..."
          rows={3}
          maxLength={500}
          showCount
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleAddComment}
          disabled={!newComment.trim()}
          style={{ marginTop: 8 }}
        >
          添加批注
        </Button>
      </div>
    </div>
  );
};

export default CommentPanel;
