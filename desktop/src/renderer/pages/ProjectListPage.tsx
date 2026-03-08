// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Button, Table, message, Modal, Form, Input } from 'antd';
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import '../styles/ProjectListPage.css';

const { Content } = Layout;

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

const ProjectListPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.project.list(
        userId,
        1,
        50
      );

      if (response.success && response.data) {
        setProjects(response.data.items || []);
      } else {
        message.error(response.message || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: { name: string; description: string; password?: string }) => {
    if (!token) return;

    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.project.create(
        values.name,
        userId,
        values.description,
        values.password // 添加密碼參數
      );

      if (response.success) {
        message.success('Project created successfully');
        setIsModalVisible(false);
        form.resetFields();
        loadProjects();
      } else {
        message.error(response.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      message.error('Failed to create project');
    }
  };

  const handleOpenProject = async (projectId: number) => {
    if (!token) return;

    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      // 檢查項目是否有密碼保護
      const project = await window.electronAPI.project.get(projectId, userId);
      
      if (!project.success) {
        message.error('Failed to get project info');
        return;
      }

      // 如果項目有密碼，顯示密碼輸入框
      if (project.data.password_hash) {
        setSelectedProjectId(projectId);
        setIsPasswordModalVisible(true);
      } else {
        // 沒有密碼，直接進入
        navigate(`/project/${projectId}/documents`);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      message.error('Failed to open project');
    }
  };

  const handleVerifyPassword = async (values: { password: string }) => {
    if (!token || !selectedProjectId) return;

    try {
      // 從 token 中解析 userId
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.electronAPI.project.verifyPassword(
        selectedProjectId,
        userId,
        values.password
      );

      if (response.success) {
        message.success('Password verified');
        setIsPasswordModalVisible(false);
        passwordForm.resetFields();
        navigate(`/project/${selectedProjectId}/documents`);
      } else {
        message.error(response.message || 'Incorrect password');
      }
    } catch (error) {
      console.error('Failed to verify password:', error);
      message.error('Failed to verify password');
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Button
          type="link"
          icon={<FolderOpenOutlined />}
          onClick={() => handleOpenProject(record.id)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <Layout className="project-list-layout">
      <AppHeader />
      <Content className="project-list-content">
        <Card
          title="My Projects"
          bordered={false}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              New Project
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} projects`,
            }}
          />
        </Card>

        <Modal
          title="Create New Project"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateProject}
          >
            <Form.Item
              label="Project Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter project name' },
                { min: 2, message: 'Project name must be at least 2 characters' },
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
              rules={[
                { required: true, message: 'Please enter description' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter project description"
              />
            </Form.Item>

            <Form.Item
              label="Project Password (Optional)"
              name="password"
              extra="Set a password to protect this project. Leave empty for no password."
            >
              <Input.Password
                placeholder="Enter project password (optional)"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Create
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Enter Project Password"
          open={isPasswordModalVisible}
          onCancel={() => {
            setIsPasswordModalVisible(false);
            setSelectedProjectId(null);
            passwordForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleVerifyPassword}
          >
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter project password' },
              ]}
            >
              <Input.Password
                placeholder="Enter project password"
                autoFocus
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Verify
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ProjectListPage;
