// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import LoginPage from './pages/LoginPage';
import ProjectListPage from './pages/ProjectListPage';
import DocumentListPage from './pages/DocumentListPage';
import DocumentReviewPage from './pages/DocumentReviewPage';
import ReviewComparisonPage from './pages/ReviewComparisonPage';
import TemplatesPage from './pages/TemplatesPage';
import UnreadMentionsPage from './pages/UnreadMentionsPage';
import VersionManagementPage from './pages/VersionManagementPage';
import SettingsPage from './pages/SettingsPage';
import RiskRulesPage from './pages/RiskRulesPage';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Electron API is available
    if (!window.electronAPI) {
      console.error('electronAPI is not available');
      message.error('Application initialization failed, please restart');
      return;
    }

    // Mark as ready
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <ProjectListPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectId/documents"
              element={
                <PrivateRoute>
                  <DocumentListPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectId/document/:documentId"
              element={
                <PrivateRoute>
                  <DocumentReviewPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/document/:documentId/comparison"
              element={
                <PrivateRoute>
                  <ReviewComparisonPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/mentions"
              element={
                <PrivateRoute>
                  <UnreadMentionsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/document/:documentId/versions"
              element={
                <PrivateRoute>
                  <VersionManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/risk-rules"
              element={
                <PrivateRoute>
                  <RiskRulesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <PrivateRoute>
                  <TemplatesPage />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
