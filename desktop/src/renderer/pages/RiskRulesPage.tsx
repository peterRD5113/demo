// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Table, Button, Space, Tag, message, Modal, Switch, Tooltip, Alert } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import RiskRuleModal from '../components/RiskRuleModal';
import '../styles/RiskRulesPage.css';

const { Content } = Layout;

interface RiskRule {
  id: number;
  name: string;
  category: string;
  keywords: string | string[];
  pattern: string;
  risk_level: 'high' | 'medium' | 'low';
  suggestion: string;
  enabled: boolean | number;
  created_at: string;
  updated_at: string;
}

const RiskRulesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.risk.getRules();
      if (response.success && response.data) {
        setRules(response.data);
      } else {
        message.error(response.message || '載入規則失敗');
      }
    } catch (error) {
      console.error('載入規則失敗:', error);
      message.error('載入規則失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!isAdmin) {
      message.warning('僅管理員可新增規則');
      return;
    }
    setEditingRule(null);
    setModalVisible(true);
  };

  const handleEdit = (rule: RiskRule) => {
    if (!isAdmin) {
      message.warning('僅管理員可編輯規則');
      return;
    }
    setEditingRule(rule);
    setModalVisible(true);
  };

  const handleToggle = async (rule: RiskRule) => {
    if (!isAdmin) {
      message.warning('僅管理員可修改規則狀態');
      return;
    }

    try {
      const isEnabled = Boolean(rule.enabled);
      const response = await window.electronAPI.risk.updateRule(rule.id, {
        enabled: isEnabled ? 0 : 1
      });

      if (response.success) {
        message.success(isEnabled ? '規則已停用' : '規則已啟用');
        loadRules();
      } else {
        message.error(response.message || '操作失敗');
      }
    } catch (error) {
      console.error('切換規則狀態失敗:', error);
      message.error('操作失敗');
    }
  };

  const handleDelete = (rule: RiskRule) => {
    if (!isAdmin) {
      message.warning('僅管理員可刪除規則');
      return;
    }

    Modal.confirm({
      title: '確認刪除',
      icon: <ExclamationCircleOutlined />,
      content: `確定要刪除規則「${rule.name}」嗎？此操作無法恢復。`,
      okText: '確定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await window.electronAPI.risk.deleteRule(rule.id);
          if (response.success) {
            message.success('規則刪除成功');
            loadRules();
          } else {
            message.error(response.message || '刪除失敗');
          }
        } catch (error) {
          console.error('刪除規則失敗:', error);
          message.error('刪除失敗');
        }
      },
    });
  };

  const handleModalOk = async (values: any) => {
    try {
      let response;
      
      if (editingRule) {
        response = await window.electronAPI.risk.updateRule(editingRule.id, {
          name: values.name,
          pattern: values.pattern,
          risk_level: values.riskLevel,
          description: values.suggestion,
          keywords: values.keywords ? values.keywords.split(',').map((k: string) => k.trim()) : []
        });
      } else {
        response = await window.electronAPI.risk.createRule(
          values.name,
          values.pattern,
          values.riskLevel,
          values.category,
          values.suggestion
        );
      }

      if (response.success) {
        message.success(editingRule ? '規則更新成功' : '規則新增成功');
        setModalVisible(false);
        setEditingRule(null);
        loadRules();
      } else {
        message.error(response.message || '操作失敗');
      }
    } catch (error) {
      console.error('保存規則失敗:', error);
      message.error('操作失敗');
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRule(null);
  };

  const getRiskIcon = (level: string) => {
    const iconMap = {
      high: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      medium: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      low: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    };
    return iconMap[level] || null;
  };

  const getRiskTag = (level: string) => {
    const tagMap = {
      high: { color: 'error', text: '高風險' },
      medium: { color: 'warning', text: '中風險' },
      low: { color: 'processing', text: '低風險' },
    };
    const config = tagMap[level];
    return config ? (
      <Tag color={config.color} icon={getRiskIcon(level)}>
        {config.text}
      </Tag>
    ) : null;
  };

  const formatKeywords = (keywords: string | string[]) => {
    if (!keywords) return '-';
    
    const keywordArray = typeof keywords === 'string' 
      ? JSON.parse(keywords) 
      : keywords;
    
    if (!Array.isArray(keywordArray) || keywordArray.length === 0) return '-';
    
    const displayKeywords = keywordArray.slice(0, 3);
    const remaining = keywordArray.length - 3;
    
    return (
      <Space size={4} wrap>
        {displayKeywords.map((keyword, index) => (
          <Tag key={index} style={{ margin: 0 }}>
            {keyword}
          </Tag>
        ))}
        {remaining > 0 && (
          <Tooltip title={keywordArray.slice(3).join(', ')}>
            <Tag style={{ margin: 0 }}>+{remaining}</Tag>
          </Tooltip>
        )}
      </Space>
    );
  };

  // 篩選規則
  const filteredRules = rules.filter(rule => {
    if (filterCategory !== 'all' && rule.category !== filterCategory) return false;
    if (filterLevel !== 'all' && rule.risk_level !== filterLevel) return false;
    if (filterStatus === 'enabled' && !Boolean(rule.enabled)) return false;
    if (filterStatus === 'disabled' && Boolean(rule.enabled)) return false;
    return true;
  });

  // 獲取所有類別
  const categories = Array.from(new Set(rules.map(r => r.category))).filter(Boolean);

  const columns = [
    {
      title: '規則名稱',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      ellipsis: true,
    },
    {
      title: '類別',
      dataIndex: 'category',
      key: 'category',
      width: '13%',
      ellipsis: true,
    },
    {
      title: '風險等級',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: '13%',
      render: (level: string) => getRiskTag(level),
    },
    {
      title: '關鍵字',
      dataIndex: 'keywords',
      key: 'keywords',
      width: '22%',
      render: (keywords: string | string[]) => formatKeywords(keywords),
    },
    {
      title: '狀態',
      dataIndex: 'enabled',
      key: 'enabled',
      width: '10%',
      render: (enabled: boolean | number) => (
        <Tag color={Boolean(enabled) ? 'success' : 'default'}>
          {Boolean(enabled) ? '✅ 啟用' : '⏸️ 停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_: any, record: RiskRule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!isAdmin}
          >
            編輯
          </Button>
          <Switch
            size="small"
            checked={Boolean(record.enabled)}
            onChange={() => handleToggle(record)}
            disabled={!isAdmin}
            checkedChildren="啟用"
            unCheckedChildren="停用"
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={!isAdmin}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="risk-rules-layout">
      <AppHeader />
      <Content className="risk-rules-content">
        <Card
          title={
            <Space>
              <WarningOutlined />
              <span>風險規則管理</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                disabled={!isAdmin}
              >
                新增規則
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadRules}>
                刷新
              </Button>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="停用或修改規則後，需回到文件審閱頁執行「重新識別風險」才會生效，已識別的風險不會自動更新。"
          />

          {!isAdmin && (
            <div style={{ marginBottom: 16, padding: '12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              <span style={{ color: '#ad6800' }}>您當前為普通用戶，僅可查看規則。如需管理規則，請聯繫管理員。</span>
            </div>
          )}

          {/* 篩選器 */}
          <div style={{ marginBottom: 16 }}>
            <Space size="middle">
              <span>類別：</span>
              <Button
                type={filterCategory === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterCategory('all')}
              >
                全部
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  type={filterCategory === cat ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Space size="middle">
              <span>風險等級：</span>
              <Button
                type={filterLevel === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterLevel('all')}
              >
                全部
              </Button>
              <Button
                type={filterLevel === 'high' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterLevel('high')}
              >
                高風險
              </Button>
              <Button
                type={filterLevel === 'medium' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterLevel('medium')}
              >
                中風險
              </Button>
              <Button
                type={filterLevel === 'low' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterLevel('low')}
              >
                低風險
              </Button>
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Space size="middle">
              <span>狀態：</span>
              <Button
                type={filterStatus === 'all' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterStatus('all')}
              >
                全部
              </Button>
              <Button
                type={filterStatus === 'enabled' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterStatus('enabled')}
              >
                啟用
              </Button>
              <Button
                type={filterStatus === 'disabled' ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterStatus('disabled')}
              >
                停用
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredRules}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 條規則`,
            }}
          />
        </Card>

        <RiskRuleModal
          visible={modalVisible}
          rule={editingRule}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
        />
      </Content>
    </Layout>
  );
};

export default RiskRulesPage;
