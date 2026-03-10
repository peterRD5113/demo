// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, message, Empty } from 'antd';
import {
  LeftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import ClauseItem from '../components/ClauseItem';
import CommentPanel from '../components/CommentPanel';
import '../styles/ReviewComparisonPage.css';

interface Clause {
  id: number;
  clause_number: string;
  title?: string | null;
  content: string;
  risk_level: string | null;
  risk_description: string | null;
  annotation: string | null;
  commentCount?: number;
}

const ReviewComparisonPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commentPanelVisible, setCommentPanelVisible] = useState(false);
  const [selectedClauseId, setSelectedClauseId] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refs for scroll sync
  const originalRef = useRef<HTMLDivElement>(null);
  const revisedRef = useRef<HTMLDivElement>(null);

  // 加载条款数据
  useEffect(() => {
    if (user && documentId) {
      loadClauses();
    }
  }, [documentId, user]);

  // 从 localStorage 恢复侧边栏状态
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  const loadClauses = async () => {
    if (!documentId || !user) return;

    try {
      setLoading(true);
      const result = await window.electronAPI.clause.getByDocument(
        parseInt(documentId),
        user.id,
        1,
        100
      );
      
      console.log('API result:', result);
      
      if (result.success) {
        // API 返回的数据结构是 { items: [], total: 0, page: 1, pageSize: 100 }
        const clausesData = result.data?.items || [];
        
        console.log('Clauses data:', clausesData);
        console.log('Clauses count:', clausesData.length);
        
        // TODO: 这里需要获取每个条款的批注数量
        const clausesWithComments = clausesData.map((clause: Clause) => ({
          ...clause,
          commentCount: 0, // 暂时设为0，后续需要从数据库获取
        }));
        setClauses(clausesWithComments);
      } else {
        message.error(result.message || '加载条款失败');
      }
    } catch (error) {
      console.error('加载条款失败:', error);
      message.error('加载条款失败');
    } finally {
      setLoading(false);
    }
  };

  // 同步滚动 - 原始版本滚动时
  const handleOriginalScroll = useCallback(() => {
    if (isSyncing || !originalRef.current || !revisedRef.current) return;
    
    setIsSyncing(true);
    requestAnimationFrame(() => {
      if (originalRef.current && revisedRef.current) {
        revisedRef.current.scrollTop = originalRef.current.scrollTop;
      }
      setTimeout(() => setIsSyncing(false), 50);
    });
  }, [isSyncing]);

  // 同步滚动 - 修订版本滚动时
  const handleRevisedScroll = useCallback(() => {
    if (isSyncing || !originalRef.current || !revisedRef.current) return;
    
    setIsSyncing(true);
    requestAnimationFrame(() => {
      if (originalRef.current && revisedRef.current) {
        originalRef.current.scrollTop = revisedRef.current.scrollTop;
      }
      setTimeout(() => setIsSyncing(false), 50);
    });
  }, [isSyncing]);

  // 切换侧边栏
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // 处理批注按钮点击
  const handleCommentClick = (clauseId: number) => {
    if (selectedClauseId === clauseId && commentPanelVisible) {
      // 如果点击的是同一个条款，且面板已显示，则关闭面板
      setCommentPanelVisible(false);
      setSelectedClauseId(null);
    } else {
      // 否则，显示面板并切换到该条款
      setSelectedClauseId(clauseId);
      setCommentPanelVisible(true);
    }
  };

  // 关闭批注面板
  const handleCloseCommentPanel = () => {
    setCommentPanelVisible(false);
    setSelectedClauseId(null);
  };

  // 返回文档详情页
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="review-comparison-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (clauses.length === 0) {
    return (
      <div className="review-comparison-empty">
        <Empty description="暂无条款数据" />
        <Button type="primary" onClick={handleBack}>
          返回文档详情
        </Button>
      </div>
    );
  }

  return (
    <div className="review-comparison-container">
      {/* 头部 */}
      <div className="review-comparison-header">
        <Button icon={<LeftOutlined />} onClick={handleBack}>
          返回
        </Button>
        <h2>对照修订视图</h2>
      </div>

      {/* 主体布局 */}
      <div className="review-comparison-layout">
        {/* 侧边栏收起按钮 */}
        <div className="sidebar-toggle-btn">
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
          />
        </div>

        {/* 目录侧边栏 */}
        {!sidebarCollapsed && (
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>目录</h3>
            </div>
            <div className="sidebar-content">
              {clauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`sidebar-item ${selectedClauseId === clause.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedClauseId(clause.id);
                  }}
                >
                  <span className="clause-number">{clause.clause_number}</span>
                  {clause.title && <span className="clause-title">{clause.title}</span>}
                  {clause.commentCount && clause.commentCount > 0 && (
                    <span className="comment-badge">{clause.commentCount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 原始版本 */}
        <div
          ref={originalRef}
          className="original-version scrollable"
          onScroll={handleOriginalScroll}
        >
          <div className="version-header">
            <h3>原始版本</h3>
          </div>
          <div className="version-content">
            {clauses.map((clause) => (
              <ClauseItem
                key={clause.id}
                clause={clause}
                onClick={() => {}}
                onUpdate={loadClauses}
                editable={false}
                onCommentClick={handleCommentClick}
                isCommentActive={selectedClauseId === clause.id}
                showCommentButton={true}
              />
            ))}
          </div>
        </div>

        {/* 修订版本 */}
        <div
          ref={revisedRef}
          className="revised-version scrollable"
          onScroll={handleRevisedScroll}
        >
          <div className="version-header">
            <h3>修订版本</h3>
          </div>
          <div className="version-content">
            {clauses.map((clause) => (
              <ClauseItem
                key={clause.id}
                clause={clause}
                onClick={() => {}}
                onUpdate={loadClauses}
                editable={true}
                onCommentClick={handleCommentClick}
                isCommentActive={selectedClauseId === clause.id}
                showCommentButton={true}
              />
            ))}
          </div>
        </div>

        {/* 批注面板 */}
        {commentPanelVisible && selectedClauseId && (
          <CommentPanel
            clauseId={selectedClauseId}
            onClose={handleCloseCommentPanel}
            visible={commentPanelVisible}
            onCommentAdded={loadClauses}
          />
        )}
      </div>
    </div>
  );
};

export default ReviewComparisonPage;
