// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Layout, Card, Spin, message, Typography, Divider, Empty, Tag, Button, Space, Modal, Input, Select } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined, SaveOutlined, SwapOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import ClauseItem from '../components/ClauseItem';
import AnnotationPanel from '../components/AnnotationPanel';
import ExportModal from '../components/ExportModal';
import '../styles/DocumentReviewPage.css';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Document {
  id: number;
  name: string;
  file_path: string;
  status: string;
  file_type: string;
  created_at: string;
}

interface Clause {
  id: number;
  clause_number: string;
  title?: string | null;
  content: string;
  level: number;
}

interface Risk {
  id: number;
  clause_id: number;
  risk_level: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  suggestion: string | null;
  matched_text: string | null;
  status: string;
}

const DocumentReviewPage: React.FC = () => {
  console.log('DocumentReviewPage mounted');
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  console.log('Route params:', { projectId, documentId });
  const { token } = useAuth();
  console.log('Token available:', !!token);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [risksByClause, setRisksByClause] = useState<Map<number, Risk[]>>(new Map());
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [annotationCounts, setAnnotationCounts] = useState<Map<number, number>>(new Map());

  // 对照修订模式相关状态
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [latestVersion, setLatestVersion] = useState<any>(null);
  const [versionClauses, setVersionClauses] = useState<Clause[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 對照版本選擇相關
  const [versionList, setVersionList] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [versionClausesLoading, setVersionClausesLoading] = useState(false);

  // 儲存版本 Modal 相關狀態
  const [showSaveVersionModal, setShowSaveVersionModal] = useState(false);
  const [saveVersionSummary, setSaveVersionSummary] = useState('');

  // 滚动同步相关
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (documentId && token) {
      loadDocument();
      loadClauses();
      loadRisks();
    }
  }, [documentId, token]);

  const loadDocument = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      console.log('Loading document:', { documentId, userId });
      const response = await window.electronAPI.document.get(
        parseInt(documentId),
        userId
      );

      if (response.success && response.data) {
        setDocument(response.data);
      } else {
        console.error('Failed to load document:', response.message);
        message.error(response.message || '獲取文檔失敗');
      }
    } catch (error) {
      console.error('加載文檔失敗:', error);
      message.error('加載文檔失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadClauses = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      console.log('Loading clauses for documentId:', documentId);
      const response = await window.electronAPI.clause.getByDocument(
        parseInt(documentId),
        userId,
        1,
        100
      );

      console.log('Clauses response:', response);

      if (response.success && response.data) {
        const clausesList = response.data.items || [];
        console.log('Loaded clauses:', clausesList.length, clausesList);
        setClauses(clausesList);

        // 批次載入批注計數
        const countMap = new Map<number, number>();
        await Promise.all(
          clausesList
            .filter((c: any) => c.level > 0)
            .map(async (c: any) => {
              try {
                const res = await window.electronAPI.annotation.getByClause(c.id, userId);
                const count = res.success && res.data?.items ? res.data.items.length : 0;
                countMap.set(c.id, count);
              } catch {
                countMap.set(c.id, 0);
              }
            })
        );
        setAnnotationCounts(countMap);
      }
    } catch (error) {
      console.error('加載條款失敗:', error);
    }
  };

  const loadRisks = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      console.log('Loading risks for documentId:', documentId);

      const response = await window.electronAPI.risk.list(
        parseInt(documentId),
        userId,
        1,
        100
      );

      console.log('Risk list response:', response);

      if (response.success && response.data) {
        const allRisks = response.data.items || [];
        console.log('Loaded risks:', allRisks.length, allRisks);
        setRisks(allRisks);

        // 按條款ID分組風險
        const riskMap = new Map<number, Risk[]>();
        allRisks.forEach((risk: Risk) => {
          if (!riskMap.has(risk.clause_id)) {
            riskMap.set(risk.clause_id, []);
          }
          riskMap.get(risk.clause_id)!.push(risk);
        });
        setRisksByClause(riskMap);
        console.log('Risk map:', riskMap);
      }
    } catch (error) {
      console.error('加載風險失敗:', error);
    }
  };

  const handleClauseUpdate = () => {
    loadClauses();
  };

  const handleClauseClick = (clauseId: number) => {
    // 點條款卡片不再開啟批注面板，改由批注按鈕觸發
  };

  const handleCommentClick = (clauseId: number) => {
    const clause = clauses.find(c => c.id === clauseId);
    if (clause && clause.level > 0) {
      setSelectedClauseId(clauseId);
      setShowAnnotationPanel(true);
    }
  };

  const reloadAnnotationCount = async (clauseId: number) => {
    if (!token) return;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;
      const res = await window.electronAPI.annotation.getByClause(clauseId, userId);
      const count = res.success && res.data?.items ? res.data.items.length : 0;
      setAnnotationCounts(prev => new Map(prev).set(clauseId, count));
    } catch {}
  };

  const handleCloseAnnotationPanel = () => {
    setShowAnnotationPanel(false);
    if (selectedClauseId) {
      reloadAnnotationCount(selectedClauseId);
    }
    setSelectedClauseId(null);
  };

  const handleVersionManagement = () => {
    navigate(`/document/${documentId}/versions`);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleReIdentify = async () => {
    if (!token || !documentId) return;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;
      setIsIdentifying(true);
      const response = await window.electronAPI.risk.identify(parseInt(documentId), userId);
      if (response.success) {
        message.success(`風險識別完成，發現 ${response.data?.risksFound || 0} 個風險`);
        await loadRisks();
        await loadClauses();
      } else {
        message.error(response.message || '風險識別失敗');
      }
    } catch (error) {
      console.error('重新識別風險失敗:', error);
      message.error('風險識別失敗');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSaveVersion = () => {
    setShowSaveVersionModal(true);
  };

  const handleConfirmSaveVersion = async () => {
    if (!token || !documentId) return;
    if (!saveVersionSummary.trim()) {
      message.warning('請輸入變更摘要');
      return;
    }
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;
      const response = await window.electronAPI.version.create(
        parseInt(documentId),
        userId,
        saveVersionSummary.trim()
      );
      if (response.success) {
        message.success(`版本 v${response.data?.version_number} 已儲存`);
        setShowSaveVersionModal(false);
        setSaveVersionSummary('');
      } else {
        message.error(response.message || '保存版本失敗');
      }
    } catch (error) {
      console.error('保存版本失敗:', error);
      message.error('保存版本失敗');
    }
  };

  // ============= 对照修订相关函数 =============

  // 載入版本清單並設定預設對照版本（方案C）
  const loadVersionsForComparison = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      // 取得完整版本清單
      const listResponse = await window.electronAPI.version.getList(
        parseInt(documentId),
        userId
      );

      if (!listResponse.success || !listResponse.data || listResponse.data.length === 0) {
        setVersionList([]);
        setSelectedVersionId(null);
        setVersionClauses(clauses);
        return;
      }

      const versions = listResponse.data;
      setVersionList(versions);

      // 預設選次新版本（versions[1]），若只有一個版本則選 v1（versions[0]）
      const defaultVersion = versions.length >= 2 ? versions[1] : versions[0];
      setLatestVersion(defaultVersion);
      setSelectedVersionId(defaultVersion.id);

      // 載入預設版本的條款
      await loadVersionClausesById(defaultVersion.id, userId);
    } catch (error) {
      console.error('加载版本清单失败:', error);
      message.error('加载版本清单失败');
    }
  };

  // 根據版本 ID 載入條款（供選擇器切換時使用）
  const loadVersionClausesById = async (versionId: number, userIdOverride?: number) => {
    if (!token) return;
    setVersionClausesLoading(true);
    try {
      const userId = userIdOverride ?? JSON.parse(atob(token.split('.')[1])).userId;
      const clausesResponse = await window.electronAPI.version.getClauses(versionId, userId);
      if (clausesResponse.success && clausesResponse.data) {
        const clauseItems = Array.isArray(clausesResponse.data)
          ? clausesResponse.data
          : (clausesResponse.data.items || clausesResponse.data || []);
        setVersionClauses(clauseItems);
      } else {
        setVersionClauses(clauses);
      }
    } catch (error) {
      console.error('加载版本条款失败:', error);
      setVersionClauses(clauses);
    } finally {
      setVersionClausesLoading(false);
    }
  };

  // 切換對照版本（Select 選擇器 onChange）
  const handleVersionSelectChange = async (versionId: number) => {
    const selected = versionList.find(v => v.id === versionId);
    setSelectedVersionId(versionId);
    setLatestVersion(selected || null);
    await loadVersionClausesById(versionId);
  };

  // 切换对照模式
  const toggleComparisonMode = async () => {
    if (!isComparisonMode) {
      await loadVersionsForComparison();
    }
    setIsComparisonMode(!isComparisonMode);
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 同步滚动 - 左侧滚动时
  const handleLeftScroll = useCallback(() => {
    if (isSyncingRef.current || !leftRef.current || !rightRef.current) return;
    isSyncingRef.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    setTimeout(() => { isSyncingRef.current = false; }, 50);
  }, []);

  // 同步滚动 - 右侧滚动时
  const handleRightScroll = useCallback(() => {
    if (isSyncingRef.current || !leftRef.current || !rightRef.current) return;
    isSyncingRef.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    setTimeout(() => { isSyncingRef.current = false; }, 50);
  }, []);


  const getRiskLevel = (clauseId: number): 'high' | 'medium' | 'low' | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;

    if (clauseRisks.some(r => r.risk_level === 'high')) return 'high';
    if (clauseRisks.some(r => r.risk_level === 'medium')) return 'medium';
    return 'low';
  };

  const getRiskDescription = (clauseId: number): string | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;
    // RiskMatch has no 'description' field; use suggestion as the risk hint text
    const risk = clauseRisks[0];
    return (risk as any).description || risk.suggestion || null;
  };

  const getRiskSuggestion = (clauseId: number): string | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;
    // Return the first non-empty suggestion
    for (const risk of clauseRisks) {
      if (risk.suggestion) return risk.suggestion;
    }
    return null;
  };

  const getRiskMatchedText = (clauseId: number): string | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;
    for (const risk of clauseRisks) {
      if (risk.matched_text) return risk.matched_text;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout className="document-review-layout">
        <AppHeader />
        <Content className="document-review-content">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>加載中...</p>
          </div>
        </Content>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout className="document-review-layout">
        <AppHeader />
        <Content className="document-review-content">
          <Card>
            <Empty description="文檔不存在" />
          </Card>
        </Content>
      </Layout>
    );
  }

  const highRiskCount = risks.filter(r => r.risk_level === 'high').length;
  const mediumRiskCount = risks.filter(r => r.risk_level === 'medium').length;
  const lowRiskCount = risks.filter(r => r.risk_level === 'low').length;

  return (
    <Layout className="document-review-layout" style={{ height: '100vh' }}>
      <AppHeader />
      <Content 
        className="document-review-content" 
        style={{ 
          padding: '24px',
          marginRight: showAnnotationPanel ? '320px' : '0',
          transition: 'margin-right 0.3s',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>{document.name}</Title>
            <Space>
              <Button
                type="default"
                icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? '展开目录' : '收起目录'}
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                導出
              </Button>
              <Button
                type="default"
                icon={<SaveOutlined />}
                onClick={handleSaveVersion}
              >
                保存版本
              </Button>
              <Button
                type="default"
                icon={<SyncOutlined spin={isIdentifying} />}
                onClick={handleReIdentify}
                loading={isIdentifying}
              >
                重新識別風險
              </Button>
              <Button
                type={isComparisonMode ? 'primary' : 'default'}
                icon={<SwapOutlined />}
                onClick={toggleComparisonMode}
              >
                {isComparisonMode ? '退出对照' : '对照修订'}
              </Button>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={handleVersionManagement}
              >
                版本管理
              </Button>
            </Space>
          </div>
          
          <div style={{ marginBottom: 8 }}>
            <Text strong>狀態: </Text>
            <Text>{document.status}</Text>
            <Divider type="vertical" />
            <Text strong>類型: </Text>
            <Text>{document.file_type}</Text>
            <Divider type="vertical" />
            <Text strong>上傳時間: </Text>
            <Text>{new Date(document.created_at).toLocaleString()}</Text>
          </div>

          {risks.length > 0 && (
            <div style={{ marginBottom: 8, padding: '8px 16px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
              <Text strong style={{ marginRight: 16 }}>
                <WarningOutlined /> 風險統計:
              </Text>
              <Tag color="red">高風險: {highRiskCount}</Tag>
              <Tag color="orange">中風險: {mediumRiskCount}</Tag>
              <Tag color="blue">低風險: {lowRiskCount}</Tag>
              <Tag>總計: {risks.length}</Tag>
            </div>
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* 左右分栏布局：左侧目录，右侧条款内容 */}
          <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {/* 左侧目录 */}
            {!sidebarCollapsed && clauses.length > 0 && (
              <div style={{ 
                width: '280px',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
                <Title level={4} style={{ marginBottom: 16 }}>目錄</Title>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid #e8e8e8',
                  minHeight: 0
                }}>
                  {clauses.map((clause) => {
                    // 文档标题样式
                    if (clause.level === -1) {
                      return (
                        <div 
                          key={clause.id}
                          style={{ 
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '12px',
                            transition: 'background-color 0.2s',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#262626',
                            borderBottom: '2px solid #d9d9d9'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            const element = window.document.getElementById(`clause-${clause.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.style.backgroundColor = '#e6f7ff';
                              setTimeout(() => {
                                element.style.backgroundColor = '';
                              }, 2000);
                            }
                          }}
                        >
                          {clause.title}
                        </div>
                      );
                    }
                    
                    // 章节样式
                    if (clause.level === 0) {
                      return (
                        <div 
                          key={clause.id}
                          style={{ 
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            marginTop: '8px',
                            transition: 'background-color 0.2s',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            color: '#1890ff'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            const element = window.document.getElementById(`clause-${clause.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.style.backgroundColor = '#e6f7ff';
                              setTimeout(() => {
                                element.style.backgroundColor = '';
                              }, 2000);
                            }
                          }}
                        >
                          {clause.title}
                        </div>
                      );
                    }
                    
                    // 条款样式
                    return (
                      <div 
                        key={clause.id}
                        style={{ 
                          padding: '8px 12px',
                          paddingLeft: `${12 + (clause.level - 1) * 20}px`,
                          cursor: 'pointer',
                          borderRadius: '4px',
                          marginBottom: '4px',
                          transition: 'background-color 0.2s',
                          fontSize: clause.level === 1 ? '14px' : '13px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => {
                          const element = window.document.getElementById(`clause-${clause.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.style.backgroundColor = '#e6f7ff';
                            setTimeout(() => {
                              element.style.backgroundColor = '';
                            }, 2000);
                          }
                        }}
                      >
                        <Text strong style={{ color: '#1890ff' }}>
                          {clause.clause_number}
                        </Text>
                        {clause.title && (
                          <Text style={{ marginLeft: 8 }}>
                            {clause.title}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 条款内容区域 */}
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {!isComparisonMode ? (
                // ========== 单栏模式 ==========
                <div className="clauses-section" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <Title level={4}>
                    合同條款 ({clauses.filter(c => c.level > 0).length} 條)
                    {risks.length > 0 && (
                      <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '16px' }}>
                        <CheckCircleOutlined /> 已完成風險識別
                      </Text>
                    )}
                  </Title>
                  
                  {clauses.length === 0 ? (
                    <Empty 
                      description="暫無條款數據，請先解析文檔" 
                      style={{ marginTop: 40 }}
                    />
                  ) : (
                    <div className="clauses-list" style={{ marginTop: 16 }}>
                      {clauses.map((clause) => {
                        // 文档标题显示
                        if (clause.level === -1) {
                          return (
                            <div 
                              key={clause.id}
                              id={`clause-${clause.id}`}
                              style={{
                                padding: '24px 32px',
                                backgroundColor: '#fafafa',
                                borderRadius: '4px',
                                marginBottom: '24px',
                                textAlign: 'center'
                              }}
                            >
                              <Text strong style={{ fontSize: '24px', color: '#262626' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        // 章节显示
                        if (clause.level === 0) {
                          return (
                            <div 
                              key={clause.id}
                              id={`clause-${clause.id}`}
                              style={{
                                padding: '16px 24px',
                                backgroundColor: '#f0f5ff',
                                borderLeft: '4px solid #1890ff',
                                marginBottom: '16px',
                                marginTop: '32px',
                                borderRadius: '4px'
                              }}
                            >
                              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        // 条款显示
                        const riskLevel = getRiskLevel(clause.id);
                        const riskDescription = getRiskDescription(clause.id);
                        const riskSuggestion = getRiskSuggestion(clause.id);
                        const riskMatchedText = getRiskMatchedText(clause.id);
                        
                        return (
                          <div 
                            key={clause.id}
                            id={`clause-${clause.id}`}
                            style={{ 
                              transition: 'background-color 0.3s',
                              borderRadius: '4px',
                              paddingLeft: `${(clause.level - 1) * 24}px`,
                              marginBottom: '12px'
                            }}
                          >
                            <ClauseItem
                              clause={{
                                ...clause,
                                risk_level: riskLevel,
                                risk_description: riskDescription,
                                suggestion: riskSuggestion,
                                matched_text: riskMatchedText,
                                annotation: null,
                                commentCount: annotationCounts.get(clause.id) || 0
                              }}
                              onClick={() => handleClauseClick(clause.id)}
                              onUpdate={() => {
                                handleClauseUpdate();
                                reloadAnnotationCount(clause.id);
                              }}
                              editable={true}
                              showCommentButton={true}
                              onCommentClick={handleCommentClick}
                              isCommentActive={selectedClauseId === clause.id && showAnnotationPanel}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // ========== 双栏对照模式 ==========
                <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  {/* 左栏：对照版本 */}
                  <div 
                    ref={leftRef}
                    onScroll={handleLeftScroll}
                    style={{ 
                      flex: 1,
                      minWidth: 0,
                      minHeight: 0,
                      overflowY: 'auto',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      padding: '16px',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ 
                      padding: '12px 16px',
                      backgroundColor: '#f0f5ff',
                      borderRadius: '4px',
                      marginBottom: '16px',
                      borderBottom: '2px solid #1890ff'
                    }}>
                      <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                        對照基準版本
                      </Title>
                      <Select
                        style={{ width: '100%' }}
                        value={selectedVersionId}
                        onChange={handleVersionSelectChange}
                        loading={versionClausesLoading}
                        options={versionList.map(v => ({
                          value: v.id,
                          label: `v${v.version_number} · ${v.change_summary || '（無摘要）'} · ${new Date(v.created_at).toLocaleDateString()}`
                        }))}
                      />
                      {selectedVersionId && versionList.length > 0 &&
                        selectedVersionId === versionList[0]?.id && (
                        <div style={{ marginTop: 8, color: '#faad14', fontSize: '12px' }}>
                          ⚠ 此為最新保存版本，與右側當前內容相同，可能無差異可對照
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {versionClauses.map((clause) => {
                        if (clause.level === -1) {
                          return (
                            <div 
                              key={clause.id}
                              style={{
                                padding: '24px 32px',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                marginBottom: '24px',
                                textAlign: 'center'
                              }}
                            >
                              <Text strong style={{ fontSize: '24px', color: '#262626' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        if (clause.level === 0) {
                          return (
                            <div 
                              key={clause.id}
                              style={{
                                padding: '16px 24px',
                                backgroundColor: '#e6f7ff',
                                borderLeft: '4px solid #1890ff',
                                marginBottom: '16px',
                                marginTop: '32px',
                                borderRadius: '4px'
                              }}
                            >
                              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        return (
                          <div 
                            key={clause.id}
                            style={{ 
                              borderRadius: '4px',
                              paddingLeft: `${(clause.level - 1) * 24}px`,
                              marginBottom: '12px'
                            }}
                          >
                            {
                              // original_clause_id 存在時（已保存版本）用它查風險；否則直接用 clause.id
                              (() => {
                                const riskId = (clause as any).original_clause_id ?? clause.id;
                                const leftRiskLevel = getRiskLevel(riskId);
                                const leftRiskDescription = getRiskDescription(riskId);
                                const leftRiskSuggestion = getRiskSuggestion(riskId);
                                const leftRiskMatchedText = getRiskMatchedText(riskId);
                                return (
                                  <ClauseItem
                                    clause={{
                                      ...clause,
                                      risk_level: leftRiskLevel,
                                      risk_description: leftRiskDescription,
                                      suggestion: leftRiskSuggestion,
                                      matched_text: leftRiskMatchedText,
                                      annotation: null
                                    }}
                                    onClick={() => {}}
                                    onUpdate={() => {}}
                                    editable={false}
                                  />
                                );
                              })()
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 右栏：当前编辑 */}
                  <div 
                    ref={rightRef}
                    onScroll={handleRightScroll}
                    style={{ 
                      flex: 1,
                      minWidth: 0,
                      minHeight: 0,
                      overflowY: 'auto',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      padding: '16px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <div style={{ 
                      padding: '12px 16px',
                      backgroundColor: '#fff7e6',
                      borderRadius: '4px',
                      marginBottom: '16px',
                      borderBottom: '2px solid #faad14'
                    }}>
                      <Title level={4} style={{ margin: 0 }}>
                        当前编辑中
                      </Title>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        未保存的修改
                      </Text>
                    </div>
                    
                    <div>
                      {clauses.map((clause) => {
                        if (clause.level === -1) {
                          return (
                            <div 
                              key={clause.id}
                              style={{
                                padding: '24px 32px',
                                backgroundColor: '#fafafa',
                                borderRadius: '4px',
                                marginBottom: '24px',
                                textAlign: 'center'
                              }}
                            >
                              <Text strong style={{ fontSize: '24px', color: '#262626' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        if (clause.level === 0) {
                          return (
                            <div 
                              key={clause.id}
                              style={{
                                padding: '16px 24px',
                                backgroundColor: '#f0f5ff',
                                borderLeft: '4px solid #1890ff',
                                marginBottom: '16px',
                                marginTop: '32px',
                                borderRadius: '4px'
                              }}
                            >
                              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                {clause.title}
                              </Text>
                            </div>
                          );
                        }
                        
                        const riskLevel = getRiskLevel(clause.id);
                        const riskDescription = getRiskDescription(clause.id);
                        const riskSuggestion = getRiskSuggestion(clause.id);
                        const riskMatchedText = getRiskMatchedText(clause.id);
                        
                        return (
                          <div 
                            key={clause.id}
                            style={{ 
                              borderRadius: '4px',
                              paddingLeft: `${(clause.level - 1) * 24}px`,
                              marginBottom: '12px'
                            }}
                          >
                            <ClauseItem
                              clause={{
                                ...clause,
                                risk_level: riskLevel,
                                risk_description: riskDescription,
                                suggestion: riskSuggestion,
                                matched_text: riskMatchedText,
                                annotation: null,
                                commentCount: annotationCounts.get(clause.id) || 0
                              }}
                              onClick={() => handleClauseClick(clause.id)}
                              onUpdate={() => {
                                handleClauseUpdate();
                                reloadAnnotationCount(clause.id);
                              }}
                              editable={true}
                              showCommentButton={true}
                              onCommentClick={handleCommentClick}
                              isCommentActive={selectedClauseId === clause.id && showAnnotationPanel}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Content>

      {selectedClauseId && selectedClauseId > 0 && (
        <AnnotationPanel
          clauseId={selectedClauseId}
          visible={showAnnotationPanel}
          onClose={handleCloseAnnotationPanel}
        />
      )}

      {document && token && (() => {
        let userId = 0;
        try { userId = JSON.parse(atob(token.split('.')[1])).userId; } catch (_) {}
        return (
          <ExportModal
            visible={showExportModal}
            documentId={document.id}
            documentName={document.name}
            userId={userId}
            onClose={() => setShowExportModal(false)}
          />
        );
      })()}

      <Modal
        title="儲存版本"
        open={showSaveVersionModal}
        onOk={handleConfirmSaveVersion}
        onCancel={() => {
          setShowSaveVersionModal(false);
          setSaveVersionSummary('');
        }}
        okText="儲存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8 }}>
          <Text>請輸入本次版本的變更摘要：</Text>
        </div>
        <Input.TextArea
          rows={4}
          placeholder="例如：修正付款條款措辭、補充違約責任定義..."
          value={saveVersionSummary}
          onChange={(e) => setSaveVersionSummary(e.target.value)}
          maxLength={200}
          showCount
          autoFocus
        />
      </Modal>
    </Layout>
  );
};

export default DocumentReviewPage;
