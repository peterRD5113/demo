// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Table,
  Upload,
  message,
  Space,
  Tag,
  Modal,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import AppHeader from '../components/AppHeader';
import type { UploadFile } from 'antd/es/upload/interface';
import '../styles/DocumentListPage.css';

const { Content } = Layout;

interface Document {
  id: number;
  project_id: number;
  filename: string;
  file_path: string;
  file_type: string;
  status: string;
  risk_count: number;
  created_at: string;
}

const DocumentListPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { token } = useAuth();
  const { currentProject, setCurrentDocument } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId]);

  const loadDocuments = async () => {
    if (!token || !projectId) return;

    setLoading(true);
    try {
      const response = await window.electronAPI.document.list({
        token,
        projectId: parseInt(projectId),
        page: 1,
        pageSize: 100,
      });

      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      } else {
        message.error(response.message || '? è??‡æ??—è¡¨å¤±æ?');
      }
    } catch (error) {
      console.error('? è??‡æ?å¤±æ?:', error);
      message.error('? è??‡æ??—è¡¨å¤±æ?');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: UploadFile) => {
    if (!token || !projectId) return false;

    const filePath = (file as any).path;
    if (!filePath) {
      message.error('?¡æ??²å??‡ä»¶è·¯å?');
      return false;
    }

    setUploading(true);
    try {
      const response = await window.electronAPI.document.import({
        token,
        projectId: parseInt(projectId),
        filePath,
      });

      if (response.success) {
        message.success('?‡æ?å°Žå…¥?å?');
        loadDocuments();
      } else {
        message.error(response.message || '?‡æ?å°Žå…¥å¤±æ?');
      }
    } catch (error) {
      console.error('ä¸Šå‚³?‡æ?å¤±æ?:', error);
      message.error('?‡æ?å°Žå…¥å¤±æ?');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await window.electronAPI.document.delete({
        token,
        documentId,
      });

      if (response.success) {
        message.success('?‡æ??ªé™¤?å?');
        loadDocuments();
      } else {
        message.error(response.message || '?ªé™¤?‡æ?å¤±æ?');
      }
    } catch (error) {
      console.error('?ªé™¤?‡æ?å¤±æ?:', error);
      message.error('?ªé™¤?‡æ?å¤±æ?');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document: Document) => {
    setCurrentDocument(document);
    navigate(`/project/${projectId}/document/${document.id}`);
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: 'å¾…è??? },
      processing: { color: 'processing', text: '?•ç?ä¸? },
      completed: { color: 'success', text: 'å·²å??? },
      failed: { color: 'error', text: 'å¤±æ?' },
    };

    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRiskTag = (count: number) => {
    if (count === 0) {
      return <Tag color="success">?¡é¢¨??/Tag>;
    } else if (count < 5) {
      return (
        <Tag icon={<WarningOutlined />} color="warning">
          {count} ?‹é¢¨??
        </Tag>
      );
    } else {
      return (
        <Tag icon={<WarningOutlined />} color="error">
          {count} ?‹é¢¨??
        </Tag>
      );
    }
  };

  const columns = [
    {
      title: '?‡æ??ç¨±',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string, record: Document) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <a onClick={() => handleViewDocument(record)}>{text}</a>
        </Space>
      ),
    },
    {
      title: '?‡ä»¶é¡žå?',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 120,
      render: (type: string) => (
        <Tag>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: '?€??,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'é¢¨éšª?¸é?',
      dataIndex: 'risk_count',
      key: 'risk_count',
      width: 150,
      render: (count: number) => getRiskTag(count),
    },
    {
      title: 'å°Žå…¥?‚é?',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '?ä?',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Document) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDocument(record)}
          >
            ?¥ç?
          </Button>
          <Popconfirm
            title="ç¢ºå?è¦åˆª?¤é€™å€‹æ?æª”å?ï¼?
            description="?ªé™¤å¾Œå??¡æ??¢å¾©??
            onConfirm={() => handleDeleteDocument(record.id)}
            okText="ç¢ºå?"
            cancelText="?–æ?"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              ?ªé™¤
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="document-list-layout">
      <AppHeader />
      <Content className="document-list-content">
        <Card
          title={`?…ç›®ï¼?{currentProject?.name || '?ªçŸ¥?…ç›®'}`}
          extra={
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              accept=".docx,.pdf,.txt"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploading}
              >
                å°Žå…¥?‡æ?
              </Button>
            </Upload>
          }
        >
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `??${total} ?‹æ?æª”`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default DocumentListPage;
