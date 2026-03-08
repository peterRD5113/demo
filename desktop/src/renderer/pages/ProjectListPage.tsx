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
  const [form] = Form.useForm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await window.electronAPI.project.getProjects({
        token,
        page: 1,
        pageSize: 50,
      });

      if (response.success && response.data) {
        setProjects(response.data.projects || []);
      } else {
        message.error(response.message || 'Failed to load projects');
      }
    } catch (error) {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: { name: string; description: string }) => {
    if (!token) return;

    try {
      const response = await window.electronAPI.project.createProject({
        token,
        name: values.name,
        description: values.description,
      });

      if (response.success) {
        message.success('Project created successfully');
        setIsModalVisible(false);
        form.resetFields();
        loadProjects();
      } else {
        message.error(response.message || 'Failed to create project');
      }
    } catch (error) {
      message.error('Failed to create project');
    }
  };

  const handleOpenProject = (projectId: number) => {
    navigate(`/project/${projectId}/documents`);
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

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Create
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ProjectListPage;
