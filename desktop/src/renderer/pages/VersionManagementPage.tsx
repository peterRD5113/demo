import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Button,
  Modal,
  Input,
  message,
  Spin,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Typography,
  Divider,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  SaveOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './VersionManagementPage.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  created_by: number;
  creator_name?: string;
  change_summary: string | null;
  is_current: number;
  created_at: string;
}

const VersionManagementPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveComment, setSaveComment] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);

  const getUserId = (): number => {
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    if (documentId && token) {
      loadVersions();
    }
  }, [documentId, token]);

  const loadVersions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const userId = getUserId();
      const result = await window.electronAPI.version.getList(
        parseInt(documentId),
        userId
      );
      if (result.success) {
        setVersions(result.data || []);
      } else {
        message.error(result.message || '載入版本列表失敗');
      }
    } catch (error: any) {
      message.error(error.message || '載入版本列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!saveComment.trim()) {
      message.warning('請輸入變更摘要');
      return;
    }
    if (!documentId) return;

    setSavingVersion(true);
    try {
      const userId = getUserId();
      const result = await window.electronAPI.version.create(
        parseInt(documentId),
        userId,
        saveComment.trim()
      );
      if (result.success) {
        message.success(`已儲存為版本 v${result.data?.version_number}`);
        setSaveModalVisible(false);
        setSaveComment('');
        await loadVersions();
      } else {
        message.error(result.message || '儲存版本失敗');
      }
    } catch (error: any) {
      message.error(error.message || '儲存版本失敗');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleRollback = async (version: DocumentVersion) => {
    if (!documentId) return;
    setLoading(true);
    try {
      const userId = getUserId();
      const result = await window.electronAPI.version.rollback(
        parseInt(documentId),
        version.id,
        userId
      );
      if (result.success) {
        message.success(`已回滾至版本 v${version.version_number}`);
        await loadVersions();
      } else {
        message.error(result.message || '回滾失敗');
      }
    } catch (error: any) {
      message.error(error.message || '回滾失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (version: DocumentVersion) => {
    setLoading(true);
    try {
      const userId = getUserId();
      const result = await window.electronAPI.version.delete(
        version.id,
        userId
      );
      if (result.success) {
        message.success('版本已刪除');
        await loadVersions();
      } else {
        message.error(result.message || '刪除失敗');
      }
    } catch (error: any) {
      message.error(error.message || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const totalVersions = versions.length;
  const latestVersionNumber = versions.length > 0 ? versions[0].version_number : 0;
  const firstCreated = versions.length > 0 ? versions[versions.length - 1].created_at : null;
  const lastCreated = versions.length > 0 ? versions[0].created_at : null;

  return (
    <div className="version-management-page">
      <div className="page-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          版本管理
        </Title>
      </div>

      {totalVersions > 0 && (
        <Card className="stats-card" size="small">
          <Space size="large">
            <div>
              <Text type="secondary">版本總數：</Text>
              <Text strong>{totalVersions}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">最新版本：</Text>
              <Text strong>v{latestVersionNumber}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">首次建立：</Text>
              <Text>{firstCreated ? new Date(firstCreated).toLocaleString() : '-'}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">最後更新：</Text>
              <Text>{lastCreated ? new Date(lastCreated).toLocaleString() : '-'}</Text>
            </div>
          </Space>
        </Card>
      )}

      <Card
        title="版本列表"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalVisible(true)}
          >
            儲存目前版本
          </Button>
        }
      >
        <Spin spinning={loading}>
          {versions.length === 0 ? (
            <Empty description="尚無版本記錄，請先儲存版本" />
          ) : (
            <List
              dataSource={versions}
              renderItem={(version) => (
                <List.Item
                  key={version.id}
                  actions={[
                    <Popconfirm
                      key="rollback"
                      title={`確定要回滾至版本 v${version.version_number} 嗎？`}
                      description="回滾後目前的條款內容將被覆蓋"
                      onConfirm={() => handleRollback(version)}
                      okText="確定"
                      cancelText="取消"
                      disabled={version.is_current === 1}
                    >
                      <Tooltip title={version.is_current === 1 ? '目前使用中的版本' : '回滾至此版本'}>
                        <Button
                          type="link"
                          icon={<RollbackOutlined />}
                          disabled={version.is_current === 1}
                        >
                          回滾
                        </Button>
                      </Tooltip>
                    </Popconfirm>,
                    <Popconfirm
                      key="delete"
                      title={`確定要刪除版本 v${version.version_number} 嗎？`}
                      description="刪除後無法復原"
                      onConfirm={() => handleDelete(version)}
                      okText="刪除"
                      okType="danger"
                      cancelText="取消"
                      disabled={version.is_current === 1 || versions.length <= 1}
                    >
                      <Tooltip
                        title={
                          version.is_current === 1
                            ? '無法刪除目前使用中的版本'
                            : versions.length <= 1
                            ? '至少保留一個版本'
                            : '刪除此版本'
                        }
                      >
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={version.is_current === 1 || versions.length <= 1}
                        >
                          刪除
                        </Button>
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">v{version.version_number}</Tag>
                        {version.is_current === 1 && (
                          <Tag color="green">目前版本</Tag>
                        )}
                        <Text strong>
                          {version.change_summary || '（無變更摘要）'}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Space>
                          <UserOutlined />
                          <Text type="secondary">
                            審閱人：{version.creator_name || '未知'}
                          </Text>
                        </Space>
                        <Space>
                          <CalendarOutlined />
                          <Text type="secondary">
                            儲存時間：{new Date(version.created_at).toLocaleString()}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="儲存目前版本"
        open={saveModalVisible}
        onOk={handleSaveVersion}
        onCancel={() => {
          setSaveModalVisible(false);
          setSaveComment('');
        }}
        okText="儲存"
        cancelText="取消"
        confirmLoading={savingVersion}
      >
        <div style={{ marginBottom: 8 }}>
          <Text>請輸入本次版本的變更摘要（審閱重點、修改說明等）：</Text>
        </div>
        <TextArea
          rows={4}
          placeholder="例如：修正第三條付款條款措辭、新增不可抗力定義..."
          value={saveComment}
          onChange={(e) => setSaveComment(e.target.value)}
          maxLength={200}
          showCount
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default VersionManagementPage;
