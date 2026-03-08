// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, List, Tag, Button, Empty, Spin, message, Typography, Space, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  BellOutlined,
  CheckOutlined,
  EyeOutlined,
  CommentOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import AppHeader from '../components/AppHeader';
import '../styles/UnreadMentionsPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Mention {
  id: number;
  annotation_id: number;
  mentioned_user_id: number;
  status: 'pending' | 'read' | 'resolved';
  created_at: string;
  annotation_content: string;
  annotation_type: 'comment' | 'suggestion' | 'question' | 'issue';
  author_username: string;
  clause_id: number;
  clause_number: string;
  clause_content: string;
  document_id: number;
  document_name: string;
  project_id: number;
  project_name: string;
}

const UnreadMentionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'read'>('pending');

  useEffect(() => {
    if (currentUser && currentProject) {
      loadMentions();
    }
  }, [currentUser, currentProject, filter]);

  const loadMentions = async () => {
    if (!currentUser || !currentProject) return;

    setLoading(true);
    try {
      const result = await window.api.annotation.getMentions(
        currentUser.id,
        currentProject.id
      );

      if (result.success && result.data) {
        let filteredMentions = result.data;
        
        // 根據過濾條件篩選
        if (filter === 'pending') {
          filteredMentions = result.data.filter((m: Mention) => m.status === 'pending');
        } else if (filter === 'read') {
          filteredMentions = result.data.filter((m: Mention) => m.status === 'read');
        }
        
        setMentions(filteredMentions);
      } else {
        message.error(result.message || '載入待確認清單失敗');
      }
    } catch (error) {
      console.error('載入待確認清單失敗:', error);
      message.error('載入待確認清單失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (mentionId: number) => {
    try {
      const result = await window.api.annotation.markMentionRead(
        mentionId,
        currentUser.id
      );

      if (result.success) {
        message.success('已標記為已讀');
        loadMentions();
      } else {
        message.error(result.message || '操作失敗');
      }
    } catch (error) {
      console.error('標記失敗:', error);
      message.error('操作失敗');
    }
  };

  const handleViewClause = (mention: Mention) => {
    // 跳轉到文檔審閱頁面，並打開對應條款的批註面板
    navigate(`/project/${mention.project_id}/document/${mention.document_id}`);
    
    // 標記為已讀
    if (mention.status === 'pending') {
      handleMarkAsRead(mention.id);
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

  const getStatusTag = (status: string) => {
    const tagMap = {
      pending: { color: 'warning', text: '待確認' },
      read: { color: 'default', text: '已讀' },
      resolved: { color: 'success', text: '已解決' },
    };
    const config = tagMap[status] || tagMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderMentionContent = (content: string) => {
    // 高亮顯示 @username
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

  const pendingCount = mentions.filter(m => m.status === 'pending').length;
  const readCount = mentions.filter(m => m.status === 'read').length;
  const totalCount = mentions.length;

  return (
    <Layout className="unread-mentions-layout">
      <AppHeader />
      <Content className="unread-mentions-content" style={{ padding: '24px' }}>
        <Card>
          <div className="mentions-header">
            <Title level={3}>
              <BellOutlined /> 待確認清單
              {pendingCount > 0 && (
                <Badge count={pendingCount} style={{ marginLeft: 12 }} />
              )}
            </Title>
            
            <Space>
              <Button
                type={filter === 'all' ? 'primary' : 'default'}
                onClick={() => setFilter('all')}
              >
                全部 ({totalCount})
              </Button>
              <Button
                type={filter === 'pending' ? 'primary' : 'default'}
                onClick={() => setFilter('pending')}
              >
                待確認 ({pendingCount})
              </Button>
              <Button
                type={filter === 'read' ? 'primary' : 'default'}
                onClick={() => setFilter('read')}
              >
                已讀 ({readCount})
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
              <p style={{ marginTop: 20 }}>載入中...</p>
            </div>
          ) : mentions.length === 0 ? (
            <Empty
              description={
                filter === 'pending'
                  ? '暫無待確認的提及'
                  : filter === 'read'
                  ? '暫無已讀的提及'
                  : '暫無提及記錄'
              }
              style={{ margin: '60px 0' }}
            />
          ) : (
            <List
              className="mentions-list"
              itemLayout="vertical"
              dataSource={mentions}
              renderItem={(mention) => (
                <List.Item
                  key={mention.id}
                  className={`mention-item ${mention.status === 'pending' ? 'unread' : ''}`}
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewClause(mention)}
                    >
                      查看條款
                    </Button>,
                    mention.status === 'pending' && (
                      <Button
                        type="link"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkAsRead(mention.id)}
                      >
                        標記為已讀
                      </Button>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {getTypeTag(mention.annotation_type)}
                        {getStatusTag(mention.status)}
                        <Text strong>{mention.author_username}</Text>
                        <Text type="secondary">在</Text>
                        <Text strong>{mention.document_name}</Text>
                        <Text type="secondary">中提及了你</Text>
                      </Space>
                    }
                    description={
                      <div className="mention-details">
                        <div className="mention-time">
                          {new Date(mention.created_at).toLocaleString()}
                        </div>
                        <div className="mention-location">
                          <Text type="secondary">
                            項目: {mention.project_name} / 條款: {mention.clause_number}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                  
                  <div className="mention-content-section">
                    <div className="mention-annotation">
                      <Text strong>批註內容：</Text>
                      <div className="mention-text">
                        {renderMentionContent(mention.annotation_content)}
                      </div>
                    </div>
                    
                    <div className="mention-clause-preview">
                      <Text strong>條款預覽：</Text>
                      <div className="clause-preview-text">
                        {mention.clause_content.length > 200
                          ? mention.clause_content.substring(0, 200) + '...'
                          : mention.clause_content}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default UnreadMentionsPage;
