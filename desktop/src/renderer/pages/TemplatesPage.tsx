// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Table, Button, Space, Tag, message, Modal, Tabs, Tooltip, Alert } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import TemplateModal from '../components/TemplateModal';
import '../styles/TemplatesPage.css';

const { Content } = Layout;

interface ClauseTemplate {
  id: number;
  name: string;
  category: string;
  title: string | null;
  content: string;
  template_type: 'clause' | 'annotation';
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clauseTemplates, setClauseTemplates] = useState<ClauseTemplate[]>([]);
  const [annotationTemplates, setAnnotationTemplates] = useState<ClauseTemplate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ClauseTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'clause' | 'annotation'>('clause');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await window.electronAPI.template.list();
      if (response.success && response.data) {
        const all: ClauseTemplate[] = response.data.items || [];
        setClauseTemplates(all.filter(t => t.template_type === 'clause'));
        setAnnotationTemplates(all.filter(t => t.template_type === 'annotation'));
      } else {
        message.error(response.message || '載入模板失敗');
      }
    } catch (error) {
      console.error('載入模板失敗:', error);
      message.error('載入模板失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!isAdmin) { message.warning('僅管理員可新增模板'); return; }
    setEditingTemplate(null);
    setModalVisible(true);
  };

  const handleEdit = (tpl: ClauseTemplate) => {
    if (!isAdmin) { message.warning('僅管理員可編輯模板'); return; }
    setEditingTemplate(tpl);
    setModalVisible(true);
  };

  const handleDelete = (tpl: ClauseTemplate) => {
    if (!isAdmin) { message.warning('僅管理員可刪除模板'); return; }
    Modal.confirm({
      title: '確認刪除',
      icon: <ExclamationCircleOutlined />,
      content: `確定要刪除模板「${tpl.name}」嗎？此操作無法恢復。`,
      okText: '確定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await window.electronAPI.template.delete(tpl.id, user.id);
          if (response.success) {
            message.success('模板刪除成功');
            loadTemplates();
          } else {
            message.error(response.message || '刪除失敗');
          }
        } catch (error) {
          message.error('刪除失敗');
        }
      },
    });
  };

  const handleModalOk = async (values: any) => {
    if (!user) return;
    try {
      let response;
      if (editingTemplate) {
        response = await window.electronAPI.template.update(editingTemplate.id, user.id, {
          name: values.name,
          category: values.category,
          title: activeTab === 'clause' ? values.title : null,
          content: values.content,
          description: values.description || null,
        });
      } else {
        response = await window.electronAPI.template.create(
          values.name,
          values.category,
          values.content,
          activeTab,
          user.id,
          activeTab === 'clause' ? values.title : null,
          values.description || null
        );
      }
      if (response.success) {
        message.success(editingTemplate ? '模板更新成功' : '模板新增成功');
        setModalVisible(false);
        setEditingTemplate(null);
        loadTemplates();
      } else {
        message.error(response.message || '操作失敗');
      }
    } catch (error) {
      message.error('操作失敗');
    }
  };

  const buildColumns = (type: 'clause' | 'annotation') => {
    const cols: any[] = [
      {
        title: '模板名稱',
        dataIndex: 'name',
        key: 'name',
        width: '18%',
        ellipsis: true,
      },
      {
        title: '分類',
        dataIndex: 'category',
        key: 'category',
        width: '12%',
        render: (cat: string) => <Tag color="blue">{cat}</Tag>,
      },
    ];

    if (type === 'clause') {
      cols.push({
        title: '標題',
        dataIndex: 'title',
        key: 'title',
        width: '15%',
        ellipsis: true,
        render: (t: string | null) => <span className="template-title-preview">{t || '-'}</span>,
      });
    }

    cols.push(
      {
        title: '內容預覽',
        dataIndex: 'content',
        key: 'content',
        ellipsis: true,
        render: (c: string) => (
          <Tooltip title={c}>
            <span className="template-content-preview">{c}</span>
          </Tooltip>
        ),
      },
      {
        title: '說明',
        dataIndex: 'description',
        key: 'description',
        width: '15%',
        ellipsis: true,
        render: (d: string | null) => d || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: '130px',
        render: (_: any, record: ClauseTemplate) => (
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
      }
    );
    return cols;
  };

  const currentTemplates = activeTab === 'clause' ? clauseTemplates : annotationTemplates;
  const categories = Array.from(new Set(currentTemplates.map(t => t.category))).filter(Boolean);
  const filteredTemplates = filterCategory === 'all'
    ? currentTemplates
    : currentTemplates.filter(t => t.category === filterCategory);

  return (
    <Layout className="templates-layout">
      <AppHeader />
      <Content className="templates-content">
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>模板管理</span>
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
                新增模板
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadTemplates}>刷新</Button>
            </Space>
          }
        >
          {!isAdmin && (
            <div style={{ marginBottom: 16, padding: '12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4 }}>
              <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
              <span style={{ color: '#ad6800' }}>您目前為普通用戶，僅可查看模板。如需管理，請聯繫管理員。</span>
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={(key) => { setActiveTab(key as 'clause' | 'annotation'); setFilterCategory('all'); }}
            items={[
              {
                key: 'clause',
                label: (<span><FileTextOutlined /> 條款模板</span>),
              },
              {
                key: 'annotation',
                label: (<span><CommentOutlined /> 批注模板</span>),
              },
            ]}
          />

          <div style={{ marginBottom: 16 }}>
            <Space size="middle">
              <span>分類：</span>
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

          <Table
            columns={buildColumns(activeTab)}
            dataSource={filteredTemplates}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 個模板`,
            }}
          />
        </Card>

        <TemplateModal
          visible={modalVisible}
          template={editingTemplate}
          templateType={activeTab}
          onOk={handleModalOk}
          onCancel={() => { setModalVisible(false); setEditingTemplate(null); }}
        />
      </Content>
    </Layout>
  );
};

export default TemplatesPage;

