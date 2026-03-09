// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Spin, message, Typography, Divider, Empty, Tag, Button, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { WarningOutlined, CheckCircleOutlined, HistoryOutlined, DownloadOutlined } from '@ant-design/icons';
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
    console.log('handleClauseClick called with clauseId:', clauseId);
    // 只有条款（level > 0）才能打开批注面板
    const clause = clauses.find(c => c.id === clauseId);
    console.log('Found clause:', clause);
    if (clause && clause.level > 0) {
      console.log('Setting selectedClauseId to:', clauseId);
      setSelectedClauseId(clauseId);
      setShowAnnotationPanel(true);
    } else {
      console.log('Clause not found or level <= 0');
    }
  };

  const handleCloseAnnotationPanel = () => {
    setShowAnnotationPanel(false);
    setSelectedClauseId(null);
  };

  const handleVersionManagement = () => {
    navigate(`/document/${documentId}/versions`);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

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
    return clauseRisks[0].description;
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
    <Layout className="document-review-layout">
      <AppHeader />
      <Content 
        className="document-review-content" 
        style={{ 
          padding: '24px',
          marginRight: showAnnotationPanel ? '400px' : '0',
          transition: 'margin-right 0.3s'
        }}
      >
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ margin: 0 }}>{document.name}</Title>
            <Space>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                導出
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
          
          <div style={{ marginBottom: 24 }}>
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
            <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
              <Text strong style={{ marginRight: 16 }}>
                <WarningOutlined /> 風險統計:
              </Text>
              <Tag color="red">高風險: {highRiskCount}</Tag>
              <Tag color="orange">中風險: {mediumRiskCount}</Tag>
              <Tag color="blue">低風險: {lowRiskCount}</Tag>
              <Tag>總計: {risks.length}</Tag>
            </div>
          )}

          <Divider />

          {/* 左右分栏布局：左侧目录，右侧条款内容 */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* 左侧目录 */}
            {clauses.length > 0 && (
              <div style={{ 
                width: '280px',
                flexShrink: 0
              }}>
                <Title level={4} style={{ marginBottom: 16 }}>目錄</Title>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#fafafa', 
                  borderRadius: '4px',
                  maxHeight: 'calc(100vh - 250px)',
                  overflowY: 'auto',
                  border: '1px solid #e8e8e8'
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

            {/* 右侧条款内容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="clauses-section">
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
                              annotation: null
                            }}
                            onClick={() => handleClauseClick(clause.id)}
                            onUpdate={handleClauseUpdate}
                            editable={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

      {document && (
        <ExportModal
          visible={showExportModal}
          documentId={document.id}
          documentName={document.name}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </Layout>
  );
};

export default DocumentReviewPage;
