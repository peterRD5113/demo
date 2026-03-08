// @ts-nocheck
import React from 'react';
import { Layout, Card, Form, Input, Button, Switch, message, Divider } from 'antd';
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import '../styles/SettingsPage.css';

const { Content } = Layout;

const SettingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [form] = Form.useForm();

  const handleSaveSettings = async (values: any) => {
    try {
      // Here you can call the save settings API
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  const handleClearCache = async () => {
    if (!token) return;

    try {
      const response = await window.electronAPI.system.clearCache({ token });
      if (response.success) {
        message.success('Cache cleared successfully');
      } else {
        message.error(response.message || 'Failed to clear cache');
      }
    } catch (error) {
      message.error('Failed to clear cache');
    }
  };

  return (
    <Layout className="settings-layout">
      <AppHeader />
      <Content className="settings-content">
        <Card title="User Settings" bordered={false}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
            initialValues={{
              username: user?.username,
              autoSave: true,
              showRiskHints: true,
            }}
          >
            <Form.Item label="Username" name="username">
              <Input disabled />
            </Form.Item>

            <Form.Item label="Role">
              <Input value={user?.role === 'admin' ? 'Administrator' : 'Regular User'} disabled />
            </Form.Item>

            <Divider />

            <Form.Item
              label="Auto Save"
              name="autoSave"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Show Risk Hints"
              name="showRiskHints"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="System Maintenance" bordered={false} style={{ marginTop: 24 }}>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearCache}
          >
            Clear Cache
          </Button>
          <p style={{ marginTop: 12, color: '#999', fontSize: 13 }}>
            Clearing cache will free up disk space and delete temporary files.
          </p>
        </Card>
      </Content>
    </Layout>
  );
};

export default SettingsPage;
