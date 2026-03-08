// @ts-nocheck
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: number;
  project_id: number;
  filename: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
}

interface ProjectContextType {
  currentProject: Project | null;
  currentDocument: Document | null;
  setCurrentProject: (project: Project | null) => void;
  setCurrentDocument: (document: Document | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        currentDocument,
        setCurrentProject,
        setCurrentDocument,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
