// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import LoginPage from './pages/LoginPage';
import ProjectListPage from './pages/ProjectListPage';
import DocumentReviewPage from './pages/DocumentReviewPage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';
import './styles/App.css';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if Electron API is available
    if (!window.electronAPI) {
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
    <BrowserRouter>
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
              path="/project/:projectId/document/:documentId"
              element={
                <PrivateRoute>
                  <DocumentReviewPage />
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
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
