// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Form, Input, Button, Switch, message, Divider, Checkbox, Modal, Descriptions, Alert, Spin } from 'antd';
import { SaveOutlined, ClearOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import '../styles/SettingsPage.css';

const { Content } = Layout;

const SettingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [form] = Form.useForm();

  // Cache info state
  const [cacheInfo, setCacheInfo] = useState<{
    auditLogCount: number;
    deletedProjectCount: number;
    riskMatchCount: number;
    dbFileSizeKB: number;
  } | null>(null);
  const [cacheInfoLoading, setCacheInfoLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearOptions, setClearOptions] = useState({
    clearAuditLogs: true,
    clearDeletedProjects: true,
    clearRiskMatches: false,
  });
  const [clearResult, setClearResult] = useState<{
    clearedAuditLogs: number;
    clearedDeletedProjects: number;
    clearedRiskMatches: number;
    freedKB: number;
  } | null>(null);

  const handleSaveSettings = async (values: any) => {
    try {
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    }
  };

  const handleLoadCacheInfo = async () => {
    setCacheInfoLoading(true);
    setClearResult(null);
    try {
      const res = await window.electronAPI.system.getCacheInfo();
      if (res.success && res.data) {
        setCacheInfo(res.data);
      } else {
        message.error('獲取緩存信息失敗');
      }
    } catch {
      message.error('獲取緩存信息失敗');
    } finally {
      setCacheInfoLoading(false);
    }
  };

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      const res = await window.electronAPI.system.clearCache(clearOptions);
      if (res.success && res.data) {
        setClearResult(res.data);
        message.success('緩存清理完成');
        await handleLoadCacheInfo();
      } else {
        message.error(res.message || '清理失敗');
      }
    } catch {
      message.error('清理失敗');
    } finally {
      setClearing(false);
    }
  };

  const handleClearClick = () => {
    if (!cacheInfo) {
      message.warning('緩存信息尚未載入，請稍後再試');
      return;
    }
    if (!clearOptions.clearAuditLogs && !clearOptions.clearDeletedProjects && !clearOptions.clearRiskMatches) {
      message.warning('請至少選擇一項清理內容');
      return;
    }
    const items: string[] = [];
    if (clearOptions.clearAuditLogs && cacheInfo)
      items.push(`稽核日誌（30天前）：${cacheInfo.auditLogCount} 筆`);
    if (clearOptions.clearDeletedProjects && cacheInfo)
      items.push(`已刪除的專案資料：${cacheInfo.deletedProjectCount} 個`);
    if (clearOptions.clearRiskMatches && cacheInfo)
      items.push(`風險識別結果：${cacheInfo.riskMatchCount} 筆`);

    Modal.confirm({
      title: '確認清理緩存',
      content: (
        <div>
          <p>即將清理以下項目，此操作<strong>無法復原</strong>：</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            {items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      ),
      okText: '確認清理',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: handleConfirmClear,
    });
  };

  useEffect(() => {
    handleLoadCacheInfo();
  }, []);

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

        <Card
          title="系統維護"
          bordered={false}
          style={{ marginTop: 24 }}
          extra={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={cacheInfoLoading}
              onClick={handleLoadCacheInfo}
            >
              重新整理
            </Button>
          }
        >
          {/* Cache info section */}
          {cacheInfoLoading && !cacheInfo ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Spin />
            </div>
          ) : cacheInfo ? (
            <Descriptions
              title="當前緩存狀態"
              size="small"
              bordered
              column={1}
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="稽核日誌（30天前）">
                {cacheInfo.auditLogCount} 筆
              </Descriptions.Item>
              <Descriptions.Item label="已刪除的專案">
                {cacheInfo.deletedProjectCount} 個
              </Descriptions.Item>
              <Descriptions.Item label="風險識別結果">
                {cacheInfo.riskMatchCount} 筆
              </Descriptions.Item>
              <Descriptions.Item label="資料庫大小">
                {cacheInfo.dbFileSizeKB} KB
              </Descriptions.Item>
            </Descriptions>
          ) : null}

          {/* Clear options */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, marginBottom: 10 }}>選擇清理項目：</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <Checkbox
                  checked={clearOptions.clearAuditLogs}
                  onChange={e => setClearOptions(prev => ({ ...prev, clearAuditLogs: e.target.checked }))}
                >
                  清理 30 天前的稽核日誌
                </Checkbox>
                <div style={{ color: '#999', fontSize: 12, marginLeft: 24 }}>系統操作記錄，清理後不影響功能</div>
              </div>
              <div>
                <Checkbox
                  checked={clearOptions.clearDeletedProjects}
                  onChange={e => setClearOptions(prev => ({ ...prev, clearDeletedProjects: e.target.checked }))}
                >
                  清理已刪除的專案資料
                </Checkbox>
                <div style={{ color: '#999', fontSize: 12, marginLeft: 24 }}>包含文件、條款等關聯資料，徹底釋放空間</div>
              </div>
              <div>
                <Checkbox
                  checked={clearOptions.clearRiskMatches}
                  onChange={e => setClearOptions(prev => ({ ...prev, clearRiskMatches: e.target.checked }))}
                >
                  清理風險識別結果
                </Checkbox>
                <div style={{ color: '#999', fontSize: 12, marginLeft: 24 }}>清理後需重新執行風險識別才能還原</div>
              </div>
            </div>
          </div>

          <Alert
            type="warning"
            message="清理後無法復原，請謹慎操作"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Button
            danger
            icon={<ClearOutlined />}
            onClick={handleClearClick}
            loading={clearing}
          >
            一鍵清理緩存
          </Button>

          {/* Clear result */}
          {clearResult && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              backgroundColor: '#f6ffed'
            }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#52c41a' }}>
                <CheckCircleOutlined /> 清理完成
              </div>
              {clearResult.clearedAuditLogs > 0 && (
                <div style={{ fontSize: 13, color: '#555' }}>已清理稽核日誌 {clearResult.clearedAuditLogs} 筆</div>
              )}
              {clearResult.clearedDeletedProjects > 0 && (
                <div style={{ fontSize: 13, color: '#555' }}>已清理已刪除專案 {clearResult.clearedDeletedProjects} 個</div>
              )}
              {clearResult.clearedRiskMatches > 0 && (
                <div style={{ fontSize: 13, color: '#555' }}>已清理風險識別結果 {clearResult.clearedRiskMatches} 筆</div>
              )}
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                釋放空間：{clearResult.freedKB} KB
              </div>
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default SettingsPage;
