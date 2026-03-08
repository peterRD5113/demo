import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Button,
  Modal,
  Input,
  message,
  Spin,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Typography,
  Divider,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  SaveOutlined,
  SwapOutlined,
  RollbackOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import './VersionManagementPage.css';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  content: string;
  created_by: number;
  comment?: string;
  created_at: string;
  creator_name?: string;
}

interface VersionStats {
  total_versions: number;
  latest_version: number;
  first_created: string;
  last_created: string;
}

interface CompareResult {
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

const VersionManagementPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [saveComment, setSaveComment] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<{
    version1?: number;
    version2?: number;
  }>({});
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);

  useEffect(() => {
    if (documentId) {
      loadVersions();
      loadStats();
    }
  }, [documentId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'version:list',
        parseInt(documentId!)
      );
      if (result.success) {
        setVersions(result.data);
      } else {
        message.error(result.message || '????????');
      }
    } catch (error: any) {
      message.error(error.message || '????????');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'version:stats',
        parseInt(documentId!)
      );
      if (result.success) {
        setStats(result.data);
      }
    } catch (error: any) {
      console.error('????????:', error);
    }
  };

  const handleSaveVersion = async () => {
    if (!saveComment.trim()) {
      message.warning('???????');
      return;
    }

    setLoading(true);
    try {
      // ????????????
      // ???????????????
      const content = '??????'; // TODO: ??????

      const result = await window.electron.ipcRenderer.invoke(
        'version:save',
        parseInt(documentId!),
        content,
        saveComment
      );

      if (result.success) {
        message.success('??????');
        setSaveModalVisible(false);
        setSaveComment('');
        loadVersions();
        loadStats();
      } else {
        message.error(result.message || '??????');
      }
    } catch (error: any) {
      message.error(error.message || '??????');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (version: DocumentVersion) => {
    setSelectedVersion(version);
    setViewModalVisible(true);
  };

  const handleCompareVersions = async () => {
    if (!compareVersions.version1 || !compareVersions.version2) {
      message.warning('???????????');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'version:compare',
        compareVersions.version1,
        compareVersions.version2
      );
      if (result.success) {
        setCompareResult(result.data);
      } else {
        message.error(result.message || '??????');
      }
    } catch (error: any) {
      message.error(error.message || '??????');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionId: number, versionNumber: number) => {
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'version:rollback',
        versionId,
        `????? ${versionNumber}`
      );

      if (result.success) {
        message.success('??????');
        loadVersions();
        loadStats();
      } else {
        message.error(result.message || '??????');
      }
    } catch (error: any) {
      message.error(error.message || '??????');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (versionId: number) => {
    setLoading(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('version:delete', versionId);
      if (result.success) {
        message.success('??????');
        loadVersions();
        loadStats();
      } else {
        message.error(result.message || '??????');
      }
    } catch (error: any) {
      message.error(error.message || '??????');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompareVersion = (versionId: number, slot: 'version1' | 'version2') => {
    setCompareVersions((prev) => ({
      ...prev,
      [slot]: prev[slot] === versionId ? undefined : versionId,
    }));
  };

  return (
    <div className="version-management-page">
      <div className="page-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginRight: 16 }}
        >
          ??
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <HistoryOutlined /> ????
        </Title>
      </div>

      {stats && (
        <Card className="stats-card" size="small">
          <Space size="large">
            <div>
              <Text type="secondary">?????</Text>
              <Text strong>{stats.total_versions}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">?????</Text>
              <Text strong>v{stats.latest_version}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">?????</Text>
              <Text>{new Date(stats.first_created).toLocaleString()}</Text>
            </div>
            <Divider type="vertical" />
            <div>
              <Text type="secondary">?????</Text>
              <Text>{new Date(stats.last_created).toLocaleString()}</Text>
            </div>
          </Space>
        </Card>
      )}

      <Card
        title="????"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => setSaveModalVisible(true)}
            >
              ?????
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => setCompareModalVisible(true)}
              disabled={versions.length < 2}
            >
              ????
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {versions.length === 0 ? (
            <Empty description="??????" />
          ) : (
            <List
              dataSource={versions}
              renderItem={(version) => (
                <List.Item
                  key={version.id}
                  actions={[
                    <Tooltip title="????">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewVersion(version)}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="???????????"
                      onConfirm={() => handleRollback(version.id, version.version_number)}
                      okText="??"
                      cancelText="??"
                    >
                      <Tooltip title="??????">
                        <Button type="link" icon={<RollbackOutlined />} />
                      </Tooltip>
                    </Popconfirm>,
                    <Popconfirm
                      title="??????????"
                      onConfirm={() => handleDeleteVersion(version.id)}
                      okText="??"
                      cancelText="??"
                      disabled={versions.length <= 1}
                    >
                      <Tooltip
                        title={
                          versions.length <= 1 ? '??????????' : '????'
                        }
                      >
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={versions.length <= 1}
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">v{version.version_number}</Tag>
                        {version.version_number === stats?.latest_version && (
                          <Tag color="green">??</Tag>
                        )}
                        <Text strong>{version.comment || '???'}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          ????{version.creator_name || '??'}
                        </Text>
                        <Text type="secondary">
                          ?????{new Date(version.created_at).toLocaleString()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>

      {/* ??????? */}
      <Modal
        title="?????"
        open={saveModalVisible}
        onOk={handleSaveVersion}
        onCancel={() => {
          setSaveModalVisible(false);
          setSaveComment('');
        }}
        okText="??"
        cancelText="??"
        confirmLoading={loading}
      >
        <TextArea
          rows={4}
          placeholder="???????????"
          value={saveComment}
          onChange={(e) => setSaveComment(e.target.value)}
          maxLength={200}
          showCount
        />
      </Modal>

      {/* ????????? */}
      <Modal
        title={`?? v${selectedVersion?.version_number} - ${selectedVersion?.comment || '???'}`}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedVersion(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            ??
          </Button>,
        ]}
        width={800}
      >
        {selectedVersion && (
          <div>
            <Space direction="vertical" size="small" style={{ marginBottom: 16 }}>
              <Text type="secondary">
                ????{selectedVersion.creator_name || '??'}
              </Text>
              <Text type="secondary">
                ?????{new Date(selectedVersion.created_at).toLocaleString()}
              </Text>
            </Space>
            <Divider />
            <Paragraph>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {selectedVersion.content}
              </pre>
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* ??????? */}
      <Modal
        title="????"
        open={compareModalVisible}
        onCancel={() => {
          setCompareModalVisible(false);
          setCompareVersions({});
          setCompareResult(null);
        }}
        footer={[
          <Button
            key="compare"
            type="primary"
            onClick={handleCompareVersions}
            disabled={!compareVersions.version1 || !compareVersions.version2}
            loading={loading}
          >
            ????
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setCompareModalVisible(false);
              setCompareVersions({});
              setCompareResult(null);
            }}
          >
            ??
          </Button>,
        ]}
        width={900}
      >
        {!compareResult ? (
          <div>
            <Paragraph>????????????</Paragraph>
            <List
              dataSource={versions}
              renderItem={(version) => (
                <List.Item
                  key={version.id}
                  actions={[
                    <Button
                      type={
                        compareVersions.version1 === version.id ? 'primary' : 'default'
                      }
                      size="small"
                      onClick={() => toggleCompareVersion(version.id, 'version1')}
                    >
                      {compareVersions.version1 === version.id ? '?????1' : '????1'}
                    </Button>,
                    <Button
                      type={
                        compareVersions.version2 === version.id ? 'primary' : 'default'
                      }
                      size="small"
                      onClick={() => toggleCompareVersion(version.id, 'version2')}
                    >
                      {compareVersions.version2 === version.id ? '?????2' : '????2'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">v{version.version_number}</Tag>
                        <Text>{version.comment || '???'}</Text>
                      </Space>
                    }
                    description={new Date(version.created_at).toLocaleString()}
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div className="compare-result">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>????</Title>
                <Space size="large">
                  <div>
                    <Tag color="blue">??1: v{compareResult.version1.version_number}</Tag>
                    <Text>{compareResult.version1.comment}</Text>
                  </div>
                  <div>
                    <Tag color="green">??2: v{compareResult.version2.version_number}</Tag>
                    <Text>{compareResult.version2.comment}</Text>
                  </div>
                </Space>
              </div>

              {compareResult.differences.added.length > 0 && (
                <div>
                  <Title level={5}>
                    <Tag color="success">????</Tag>
                  </Title>
                  <List
                    size="small"
                    dataSource={compareResult.differences.added}
                    renderItem={(item) => (
                      <List.Item>
                        <Text type="success">{item}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {compareResult.differences.removed.length > 0 && (
                <div>
                  <Title level={5}>
                    <Tag color="error">????</Tag>
                  </Title>
                  <List
                    size="small"
                    dataSource={compareResult.differences.removed}
                    renderItem={(item) => (
                      <List.Item>
                        <Text type="danger" delete>
                          {item}
                        </Text>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {compareResult.differences.modified.length > 0 && (
                <div>
                  <Title level={5}>
                    <Tag color="warning">????</Tag>
                  </Title>
                  <List
                    size="small"
                    dataSource={compareResult.differences.modified}
                    renderItem={(item) => (
                      <List.Item>
                        <Text type="warning">{item}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {compareResult.differences.added.length === 0 &&
                compareResult.differences.removed.length === 0 &&
                compareResult.differences.modified.length === 0 && (
                  <Empty description="??????????" />
                )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VersionManagementPage;
