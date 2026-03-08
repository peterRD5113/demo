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
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const { token } = useAuth();
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

      const response = await window.api.document.get(
        parseInt(documentId),
        userId
      );

      if (response.success && response.data) {
        setDocument(response.data);
      } else {
        message.error(response.message || '??????');
      }
    } catch (error) {
      console.error('??????:', error);
      message.error('??????');
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

      if (response.success && response.data) {
        setClauses(response.data.items || []);
      }
    } catch (error) {
      console.error('??????:', error);
    }
  };

  const loadRisks = async () => {
    if (!token || !documentId) return;

    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      const response = await window.api.risk.list(
        parseInt(documentId),  // 使用 documentId 而不是 projectId
        userId,
        1,
        100
      );

      if (response.success && response.data) {
        const allRisks = response.data.items || [];
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
      }
    } catch (error) {
      console.error('加載風險失敗:', error);
    }
  };

  const handleClauseUpdate = () => {
    // ????????
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

    // ????????
    if (clauseRisks.some(r => r.risk_level === 'high')) return 'high';
    if (clauseRisks.some(r => r.risk_level === 'medium')) return 'medium';
    return 'low';
  };

  const getRiskDescription = (clauseId: number): string | null => {
    const clauseRisks = risksByClause.get(clauseId);
    if (!clauseRisks || clauseRisks.length === 0) return null;

    // ??????????
    return clauseRisks[0].description;
  };

  if (loading) {
    return (
      <Layout className="document-review-layout">
        <AppHeader />
        <Content className="document-review-content">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>???...</p>
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
            <Empty description="?????" />
          </Card>
        </Content>
      </Layout>
    );
  }

  // ??????
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
                ??
              </Button>
              <Button
                type="primary"
                icon={<HistoryOutlined />}
                onClick={handleVersionManagement}
              >
                ????
              </Button>
            </Space>
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <Text strong>??: </Text>
            <Text>{document.status}</Text>
            <Divider type="vertical" />
            <Text strong>??: </Text>
            <Text>{document.file_type}</Text>
            <Divider type="vertical" />
            <Text strong>????: </Text>
            <Text>{new Date(document.created_at).toLocaleString()}</Text>
          </div>

          {/* ???? */}
          {risks.length > 0 && (
            <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#fafafa', borderRadius: '4px' }}>
              <Text strong style={{ marginRight: 16 }}>
                <WarningOutlined /> ????:
              </Text>
              <Tag color="red">???: {highRiskCount}</Tag>
              <Tag color="orange">???: {mediumRiskCount}</Tag>
              <Tag color="blue">???: {lowRiskCount}</Tag>
              <Tag>??: {risks.length}</Tag>
            </div>
          )}

          <Divider />

          <div className="clauses-section">
            <Title level={4}>
              ???? ({clauses.length} ???)
              {risks.length > 0 && (
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '16px' }}>
                  <CheckCircleOutlined /> ???????
                </Text>
              )}
            </Title>
            
            {clauses.length === 0 ? (
              <Empty 
                description="???????????????" 
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

      {/* ???? */}
      {selectedClauseId && (
        <AnnotationPanel
          clauseId={selectedClauseId}
          visible={showAnnotationPanel}
          onClose={handleCloseAnnotationPanel}
        />
      )}

      {/* ????? */}
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

