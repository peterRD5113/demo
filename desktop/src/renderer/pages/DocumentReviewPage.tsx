// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Layout, Card, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import '../styles/DocumentReviewPage.css';

const { Content } = Layout;

interface Document {
  id: number;
  name: string;
  file_path: string;
  status: string;
}

interface Risk {
  id: number;
  description: string;
  risk_level: string;
  category: string;
}

const DocumentReviewPage: React.FC = () => {
  const { projectId, documentId } = useParams<{ projectId: string; documentId: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<Document | null>(null);
  const [risks, setRisks] = useState<Risk[]>([]);

  useEffect(() => {
    loadDocument();
    loadRisks();
  }, [documentId]);

  const loadDocument = async () => {
    if (!token || !documentId) return;

    try {
      const response = await window.electronAPI.document.getDocument({
        token,
        documentId: parseInt(documentId),
      });

      if (response.success && response.data) {
        setDocument(response.data);
      } else {
        message.error(response.message || 'Failed to load document');
      }
    } catch (error) {
      message.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadRisks = async () => {
    if (!token || !documentId) return;

    try {
      const response = await window.electronAPI.risk.getDocumentRisks({
        token,
        documentId: parseInt(documentId),
        page: 1,
        pageSize: 50,
      });

      if (response.success && response.data) {
        setRisks(response.data.risks || []);
      }
    } catch (error) {
      console.error('Failed to load risks:', error);
    }
  };

  if (loading) {
    return (
      <Layout className="document-review-layout">
        <AppHeader />
        <Content className="document-review-content">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 20 }}>Loading document...</p>
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
            <p>Document not found</p>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="document-review-layout">
      <AppHeader />
      <Content className="document-review-content">
        <Card title={document.name} bordered={false}>
          <div className="document-info">
            <p><strong>Status:</strong> {document.status}</p>
            <p><strong>File Path:</strong> {document.file_path}</p>
          </div>

          <div className="risks-section" style={{ marginTop: 24 }}>
            <h3>Identified Risks ({risks.length})</h3>
            {risks.length === 0 ? (
              <p>No risks identified yet</p>
            ) : (
              <div className="risks-list">
                {risks.map((risk) => (
                  <Card
                    key={risk.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    className={`risk-card risk-${risk.risk_level}`}
                  >
                    <p><strong>Level:</strong> {risk.risk_level}</p>
                    <p><strong>Category:</strong> {risk.category}</p>
                    <p><strong>Description:</strong> {risk.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default DocumentReviewPage;
