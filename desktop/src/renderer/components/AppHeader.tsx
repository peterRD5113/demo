// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, Button, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, HomeOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import type { MenuProps } from 'antd';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { user, logout, currentUser } = useAuth();
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser && currentProject) {
      loadUnreadCount();
    }
  }, [currentUser, currentProject]);

  const loadUnreadCount = async () => {
    if (!currentUser || !currentProject) return;

    try {
      const result = await window.electronAPI.annotation.getMentions(
        currentUser.id,
        currentProject.id
      );

      if (result.success && result.data) {
        const pending = result.data.filter((m: any) => m.status === 'pending');
        setUnreadCount(pending.length);
      }
    } catch (error) {
      console.error('載入未讀提及數量失敗:', error);
    }
  };

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
    // 如果在文檔列表頁面，顯示返回項目列表按鈕
    ...(location.pathname.includes('/documents') ? [{
      key: 'back-to-projects',
      label: '← Back to Projects',
      onClick: () => navigate('/projects'),
    }] : []),
    // 如果在文檔審閱頁面，顯示返回文檔列表按鈕
    ...(location.pathname.includes('/document/') && currentProject ? [{
      key: 'back-to-documents',
      label: '← Back to Documents',
      onClick: () => navigate(`/project/${currentProject.id}/documents`),
    }] : []),
    {
      key: '/mentions',
      icon: <BellOutlined />,
      label: (
        <Badge count={unreadCount} offset={[10, 0]}>
          <span>待確認提及</span>
        </Badge>
      ),
      onClick: () => navigate('/mentions'),
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
