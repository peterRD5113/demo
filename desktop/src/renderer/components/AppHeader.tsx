// @ts-nocheck
import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const mainMenuItems: MenuProps['items'] = [
    {
      key: '/projects',
      icon: <HomeOutlined />,
      label: 'Projects',
      onClick: () => navigate('/projects'),
    },
  ];

  return (
    <Header className="app-header" style={{ 
      background: '#fff', 
      padding: '0 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, marginRight: 32 }}>Contract Risk Review</h2>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={mainMenuItems}
          style={{ border: 'none', flex: 1 }}
        />
      </div>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Button type="text" style={{ height: 'auto', padding: '4px 8px' }}>
          <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
          <span>{user?.username || 'User'}</span>
        </Button>
      </Dropdown>
    </Header>
  );
};

export default AppHeader;
