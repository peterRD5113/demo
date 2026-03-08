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
  const { currentProject, setCurrentProject, setCurrentDocument } = useProject();
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && token) {
      loadProjectInfo();
      loadDocuments();
    }
  }, [projectId, token]);

  const loadProjectInfo = async () => {
    if (!token || !projectId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.project.get(
        parseInt(projectId),
        userId
      );

      if (response.success && response.data) {
        setCurrentProject(response.data);
      }
    } catch (error) {
      console.error('Failed to load project info:', error);
    }
  };

  const loadDocuments = async () => {
    if (!token || !projectId) return;

    setLoading(true);
    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.document.list(
        parseInt(projectId),
        userId,
        1,
        100
      );

      if (response.success && response.data) {
        setDocuments(response.data.items || []); // 改為 items
      } else {
        message.error(response.message || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: UploadFile) => {
    if (!token || !projectId) return false;

    const filePath = (file as any).path;
    if (!filePath) {
      message.error('Cannot get file path');
      return false;
    }

    setUploading(true);
    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      // 獲取文件類型
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      let fileType: 'pdf' | 'docx' | 'txt' = 'txt';
      
      if (fileExtension === 'pdf') {
        fileType = 'pdf';
      } else if (fileExtension === 'docx') {
        fileType = 'docx';
      } else if (fileExtension === 'txt') {
        fileType = 'txt';
      } else {
        message.error('Unsupported file type. Please upload .docx, .pdf, or .txt files.');
        setUploading(false);
        return false;
      }

      const response = await window.electronAPI.document.create(
        parseInt(projectId),
        userId,
        fileName,
        filePath,
        fileType
      );

      if (response.success) {
        message.success('Document imported successfully');
        loadDocuments();
      } else {
        message.error(response.message || 'Failed to import document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      message.error('Failed to import document');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (!token) return;

    setLoading(true);
    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.document.delete(
        documentId,
        userId
      );

      if (response.success) {
        message.success('Document deleted successfully');
        loadDocuments();
      } else {
        message.error(response.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      message.error('Failed to delete document');
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
      pending: { color: 'default', text: 'Pending' },
      processing: { color: 'processing', text: 'Processing' },
      completed: { color: 'success', text: 'Completed' },
      failed: { color: 'error', text: 'Failed' },
    };

    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getRiskTag = (count: number) => {
    if (count === 0) {
      return <Tag color="success">No Risk</Tag>;
    } else if (count < 5) {
      return (
        <Tag icon={<WarningOutlined />} color="warning">
          {count} Risks
        </Tag>
      );
    } else {
      return (
        <Tag icon={<WarningOutlined />} color="error">
          {count} Risks
        </Tag>
      );
    }
  };

  const columns = [
    {
      title: 'Document Name',
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
      title: 'File Type',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 120,
      render: (type: string) => (
        <Tag>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Risk Count',
      dataIndex: 'risk_count',
      key: 'risk_count',
      width: 150,
      render: (count: number) => getRiskTag(count),
    },
    {
      title: 'Imported At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Document) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDocument(record)}
          >
            View
          </Button>
          <Popconfirm
            title="Delete this document?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteDocument(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
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
          title={
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {currentProject?.name || 'Unknown Project'}
              </div>
              {currentProject?.description && (
                <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginTop: '8px' }}>
                  {currentProject.description}
                </div>
              )}
            </div>
          }
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
                Import Document
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
              showTotal: (total) => `Total ${total} documents`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default DocumentListPage;
