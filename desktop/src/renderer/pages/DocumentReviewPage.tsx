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
      const response = await window.api.document.get(
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
      const response = await window.api.clause.getByDocument(
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

      const response = await window.api.risk.list(
        parseInt(documentId),  // 使用 documentId 而不是 projectId
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
    // 重新加載條款
    loadClauses();
  };

  const handleClauseClick = (clauseId: number) => {
    setSelectedClauseId(clauseId);
    setShowAnnotationPanel(true);
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

    // 返回最高風險等級
    if (clauseRisks.some(r => r.risk_level === 'high')) return 'high';
    if (clauseRisks.some(r => r.risk_level === 'medium')) return 'medium';
    return 'low';
  };

  const getRiskDescription = (clauseId: number): string | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;

    // 返回第一個風險的描述
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

  // 統計風險
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

          {/* 風險統計 */}
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

          <div className="clauses-section">
            <Title level={4}>
              合同條款 ({clauses.length} 條)
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
                  const riskLevel = getRiskLevel(clause.id);
                  const riskDescription = getRiskDescription(clause.id);
                  
                  return (
                    <ClauseItem
                      key={clause.id}
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
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </Content>

      {/* 註解面板 */}
      {selectedClauseId && (
        <AnnotationPanel
          clauseId={selectedClauseId}
          visible={showAnnotationPanel}
          onClose={handleCloseAnnotationPanel}
        />
      )}

      {/* 導出模態框 */}
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

