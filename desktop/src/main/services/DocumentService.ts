// @ts-nocheck
/**
 * Document Service
 * Handles document upload, parsing, and management
 */

import { documentRepository, projectRepository } from '@main/repositories';
import type { Document } from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateRequiredString,
  validateOptionalString,
  validatePositiveInteger,
  validatePagination,
  validateEnum,
  validateFilePath
} from '@main/utils/validation';

// Create document request
interface CreateDocumentRequest {
  projectId: number;
  userId: number;
  name: string;
  filePath: string;
  fileType: 'pdf' | 'docx' | 'txt';
}

// Update document request
interface UpdateDocumentRequest {
  name?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

// Document list response
interface DocumentListResponse {
  documents: Document[];
  total: number;
}

// Document status constants
const DOCUMENT_STATUS = ['pending', 'processing', 'completed', 'failed'] as const;
const FILE_TYPES = ['pdf', 'docx', 'txt'] as const;

class DocumentService {
  /**
   * Create document
   */
  async createDocument(data: CreateDocumentRequest): Promise<{ success: boolean; message: string; documentId?: number }> {
    try {
      // Parameter validation
      validatePositiveInteger(data.projectId, 'Project ID');
      validatePositiveInteger(data.userId, 'User ID');
      validateRequiredString(data.name, 'Document name', 1, 200);
      validateFilePath(data.filePath);
      validateEnum(data.fileType, 'File type', FILE_TYPES);

      // Check project permission
      if (!projectRepository.isOwnedByUser(data.projectId, data.userId)) {
        return {
          success: false,
          message: 'No permission to create document in this project'
        };
      }

      // Check if file exists
      if (!fs.existsSync(data.filePath)) {
        return {
          success: false,
          message: 'File not found'
        };
      }

      // Get file size
      const stats = fs.statSync(data.filePath);
      const fileSize = stats.size;

      // Check file size (max 100MB)
      const MAX_FILE_SIZE = 100 * 1024 * 1024;
      if (fileSize > MAX_FILE_SIZE) {
        return {
          success: false,
          message: 'File size cannot exceed 100MB'
        };
      }

      // Create document record
      const documentId = documentRepository.createDocument(
        data.projectId,
        data.name,
        data.filePath,
        data.fileType,
        fileSize
      );

      return {
        success: true,
        message: 'Document created successfully',
        documentId
      };
    } catch (error) {
      console.error('Create document failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Create document failed'
      };
    }
  }

  /**
   * Get document details
   */
  async getDocument(documentId: number, userId: number): Promise<Document | null> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return null;
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        console.error('No permission to access this document');
        return null;
      }

      return document;
    } catch (error) {
      console.error('Get document failed:', error);
      return null;
    }
  }

  /**
   * Get project documents list
   */
  async getProjectDocuments(
    projectId: number,
    userId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<DocumentListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          documents: [],
          total: 0
        };
      }

      const documents = documentRepository.findByProjectId(projectId, page, pageSize);
      const total = documentRepository.countByProjectId(projectId);

      return {
        documents,
        total
      };
    } catch (error) {
      console.error('Get documents list failed:', error);
      return {
        documents: [],
        total: 0
      };
    }
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: number,
    userId: number,
    data: UpdateDocumentRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');
      
      if (data.name !== undefined) {
        validateRequiredString(data.name, 'Document name', 1, 200);
      }
      
      if (data.status !== undefined) {
        validateEnum(data.status, 'Document status', DOCUMENT_STATUS);
      }

      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to modify this document'
        };
      }

      documentRepository.updateDocument(documentId, data);

      return {
        success: true,
        message: 'Document updated successfully'
      };
    } catch (error) {
      console.error('Update document failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update document failed'
      };
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(
    documentId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to delete this document'
        };
      }

      documentRepository.softDelete(documentId);

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error('Delete document failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Delete document failed'
      };
    }
  }

  /**
   * Update document processing status
   */
  async updateDocumentStatus(
    documentId: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validateEnum(status, 'Document status', DOCUMENT_STATUS);
      
      if (errorMessage !== undefined) {
        validateOptionalString(errorMessage, 'Error message', 500);
      }

      documentRepository.updateStatus(documentId, status, errorMessage);

      return {
        success: true,
        message: 'Status updated successfully'
      };
    } catch (error) {
      console.error('Update document status failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update status failed'
      };
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(
    projectId: number,
    userId: number,
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<DocumentListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(keyword, 'Search keyword', 1, 100);
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          documents: [],
          total: 0
        };
      }

      const documents = documentRepository.searchByName(projectId, keyword, page, pageSize);
      const total = documentRepository.countByProjectId(projectId);

      return {
        documents,
        total
      };
    } catch (error) {
      console.error('Search documents failed:', error);
      return {
        documents: [],
        total: 0
      };
    }
  }

  /**
   * Get documents by status
   */
  async getDocumentsByStatus(
    projectId: number,
    userId: number,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    page: number = 1,
    pageSize: number = 20
  ): Promise<DocumentListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validateEnum(status, 'Document status', DOCUMENT_STATUS);
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          documents: [],
          total: 0
        };
      }

      const documents = documentRepository.findByStatus(projectId, status, page, pageSize);
      const total = documentRepository.countByProjectId(projectId);

      return {
        documents,
        total
      };
    } catch (error) {
      console.error('Get documents failed:', error);
      return {
        documents: [],
        total: 0
      };
    }
  }

  /**
   * Get document file path
   */
  async getDocumentFilePath(documentId: number, userId: number): Promise<string | null> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return null;
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        console.error('No permission to access this document');
        return null;
      }

      return document.file_path;
    } catch (error) {
      console.error('Get document path failed:', error);
      return null;
    }
  }
}

// Export singleton
export const documentService = new DocumentService();
