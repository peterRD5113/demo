// @ts-nocheck
import React from 'react';
import { Card, Tag, Space } from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import '../styles/ClauseItem.css';

interface Clause {
  id: number;
  clause_number: string;
  content: string;
  risk_level: string | null;
  risk_description: string | null;
  annotation: string | null;
}

interface ClauseItemProps {
  clause: Clause;
  onClick: () => void;
}

const ClauseItem: React.FC<ClauseItemProps> = ({ clause, onClick }) => {
  const getRiskIcon = (level: string | null) => {
    if (!level) return null;

    const iconMap: Record<string, React.ReactNode> = {
      high: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      medium: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      low: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
    };

    return iconMap[level];
  };

  const getRiskTag = (level: string | null) => {
    if (!level) return null;

    const tagMap: Record<string, { color: string; text: string }> = {
      high: { color: 'error', text: '高風?? },
      medium: { color: 'warning', text: '中風?? },
      low: { color: 'processing', text: '低風?? },
    };

    const config = tagMap[level];
    return config ? (
      <Tag color={config.color} icon={getRiskIcon(level)}>
        {config.text}
      </Tag>
    ) : null;
  };

  return (
    <Card
      className={`clause-item ${clause.risk_level ? `risk-${clause.risk_level}` : ''}`}
      hoverable
      onClick={onClick}
    >
      <div className="clause-header">
        <Space>
          <span className="clause-number">{clause.clause_number}</span>
          {getRiskTag(clause.risk_level)}
          {clause.annotation && (
            <Tag icon={<CommentOutlined />} color="blue">
              ?�批�?
            </Tag>
          )}
        </Space>
      </div>

      <div className="clause-content">
        {clause.content}
      </div>

      {clause.risk_description && (
        <div className="clause-risk-hint">
          <WarningOutlined /> {clause.risk_description}
        </div>
      )}
    </Card>
  );
};

export default ClauseItem;
