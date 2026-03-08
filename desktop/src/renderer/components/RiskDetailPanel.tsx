// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Space, Tag, Input, Button, Divider, Alert } from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import '../styles/RiskDetailPanel.css';

const { TextArea } = Input;

interface Clause {
  id: number;
  clause_number: string;
  content: string;
  risk_level: string | null;
  risk_description: string | null;
  suggestion: string | null;
  annotation: string | null;
}

interface RiskDetailPanelProps {
  clause: Clause;
  onUpdateAnnotation: (clauseId: number, annotation: string) => void;
}

const RiskDetailPanel: React.FC<RiskDetailPanelProps> = ({
  clause,
  onUpdateAnnotation,
}) => {
  const [annotation, setAnnotation] = useState(clause.annotation || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnnotation(clause.annotation || '');
  }, [clause]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateAnnotation(clause.id, annotation);
    } finally {
      setSaving(false);
    }
  };

  const getRiskIcon = (level: string | null) => {
    if (!level) return null;

    const iconMap: Record<string, React.ReactNode> = {
      high: <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />,
      medium: <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />,
      low: <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />,
    };

    return iconMap[level];
  };

  const getRiskTag = (level: string | null) => {
    if (!level) return <Tag>?�風??/Tag>;

    const tagMap: Record<string, { color: string; text: string }> = {
      high: { color: 'error', text: '高風?? },
      medium: { color: 'warning', text: '中風?? },
      low: { color: 'processing', text: '低風?? },
    };

    const config = tagMap[level];
    return (
      <Tag color={config.color} icon={getRiskIcon(level)}>
        {config.text}
      </Tag>
    );
  };

  return (
    <div className="risk-detail-panel">
      <div className="panel-section">
        <h3>條款編�?</h3>
        <p className="clause-number-large">{clause.clause_number}</p>
      </div>

      <Divider />

      <div className="panel-section">
        <h3>條款?�容</h3>
        <div className="clause-content-box">
          {clause.content}
        </div>
      </div>

      <Divider />

      <div className="panel-section">
        <h3>風險等�?</h3>
        <Space size="large">
          {getRiskTag(clause.risk_level)}
        </Space>
      </div>

      {clause.risk_description && (
        <>
          <Divider />
          <div className="panel-section">
            <h3>風險?�述</h3>
            <Alert
              message={clause.risk_description}
              type={clause.risk_level === 'high' ? 'error' : clause.risk_level === 'medium' ? 'warning' : 'info'}
              showIcon
            />
          </div>
        </>
      )}

      {clause.suggestion && (
        <>
          <Divider />
          <div className="panel-section">
            <h3>修改建議</h3>
            <Alert
              message={clause.suggestion}
              type="success"
              showIcon
            />
          </div>
        </>
      )}

      <Divider />

      <div className="panel-section">
        <h3>?�註</h3>
        <TextArea
          rows={6}
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          placeholder="?�此添�??�註..."
        />
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          style={{ marginTop: 12 }}
        >
          保�??�註
        </Button>
      </div>
    </div>
  );
};

export default RiskDetailPanel;
