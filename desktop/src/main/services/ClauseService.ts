// @ts-nocheck
/**
 * Clause Service
 * 處理條款相關的業務邏輯
 */

import { clauseRepository, documentRepository, projectRepository } from '@main/repositories';
import type { Clause } from '@shared/types';
import {
  validatePositiveInteger,
  validateRequiredString,
  validatePagination
} from '@main/utils/validation';

// 條款列表響應
interface ClauseListResponse {
  clauses: Clause[];
  total: number;
}

class ClauseService {
  /**
   * 獲取文檔的所有條款
   */
  async getDocumentClauses(
    documentId: number,
    userId: number,
    page?: number,
    pageSize?: number
  ): Promise<ClauseListResponse> {
    try {
      // 參數驗證
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      // 獲取文檔信息
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          clauses: [],
          total: 0
        };
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        console.error('No permission to access this document');
        return {
          clauses: [],
          total: 0
        };
      }

      // 如果提供了分頁參數，使用分頁查詢
      if (page !== undefined && pageSize !== undefined) {
        validatePagination(page, pageSize);
        const result = clauseRepository.findByDocumentIdWithPagination(
          documentId,
          page,
          pageSize
        );
        return {
          clauses: result.list,
          total: result.total
        };
      }

      // 否則返回所有條款
      const clauses = clauseRepository.findByDocumentId(documentId);
      return {
        clauses,
        total: clauses.length
      };
    } catch (error) {
      console.error('Get document clauses failed:', error);
      return {
        clauses: [],
        total: 0
      };
    }
  }

  /**
   * 獲取單個條款詳情
   */
  async getClause(clauseId: number, userId: number): Promise<Clause | null> {
    try {
      // 參數驗證
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');

      const clause = clauseRepository.findById(clauseId);
      
      if (!clause) {
        return null;
      }

      // 獲取文檔信息以檢查權限
      const document = documentRepository.findById(clause.document_id);
      
      if (!document) {
        return null;
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        console.error('No permission to access this clause');
        return null;
      }

      return clause;
    } catch (error) {
      console.error('Get clause failed:', error);
      return null;
    }
  }

  /**
   * 更新條款內容
   */
  async updateClauseContent(
    clauseId: number,
    userId: number,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(content, 'Clause content', 1, 10000);

      const clause = clauseRepository.findById(clauseId);
      
      if (!clause) {
        return {
          success: false,
          message: 'Clause not found'
        };
      }

      // 獲取文檔信息以檢查權限
      const document = documentRepository.findById(clause.document_id);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to modify this clause'
        };
      }

      clauseRepository.updateContent(clauseId, content);

      return {
        success: true,
        message: 'Clause updated successfully'
      };
    } catch (error) {
      console.error('Update clause failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update clause failed'
      };
    }
  }

  /**
   * 更新條款標題
   */
  async updateClauseTitle(
    clauseId: number,
    userId: number,
    title: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(title, 'Clause title', 1, 200);

      const clause = clauseRepository.findById(clauseId);
      
      if (!clause) {
        return {
          success: false,
          message: 'Clause not found'
        };
      }

      // 獲取文檔信息以檢查權限
      const document = documentRepository.findById(clause.document_id);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to modify this clause'
        };
      }

      clauseRepository.updateTitle(clauseId, title);

      return {
        success: true,
        message: 'Clause title updated successfully'
      };
    } catch (error) {
      console.error('Update clause title failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update clause title failed'
      };
    }
  }

  /**
   * 搜索條款
   */
  async searchClauses(
    documentId: number,
    userId: number,
    keyword: string
  ): Promise<ClauseListResponse> {
    try {
      // 參數驗證
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(keyword, 'Search keyword', 1, 100);

      // 獲取文檔信息
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          clauses: [],
          total: 0
        };
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        console.error('No permission to search clauses in this document');
        return {
          clauses: [],
          total: 0
        };
      }

      // 搜索條款內容和標題
      const contentResults = clauseRepository.searchByContent(documentId, keyword);
      const titleResults = clauseRepository.searchByTitle(documentId, keyword);

      // 合併結果並去重
      const clauseMap = new Map<number, Clause>();
      
      for (const clause of contentResults) {
        clauseMap.set(clause.id, clause);
      }
      
      for (const clause of titleResults) {
        clauseMap.set(clause.id, clause);
      }

      const clauses = Array.from(clauseMap.values());

      return {
        clauses,
        total: clauses.length
      };
    } catch (error) {
      console.error('Search clauses failed:', error);
      return {
        clauses: [],
        total: 0
      };
    }
  }

  /**
   * 獲取條款統計信息
   */
  async getClauseStats(documentId: number, userId: number): Promise<{
    total: number;
    byLevel: { level: number; count: number }[];
  } | null> {
    try {
      // 參數驗證
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      // 獲取文檔信息
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return null;
      }

      // 檢查項目權限
      if (!projectRepository.isMemberOrOwner(document.project_id, userId)) {
        console.error('No permission to access this document');
        return null;
      }

      const total = clauseRepository.countByDocumentId(documentId);
      const byLevel = clauseRepository.countByLevel(documentId);

      return {
        total,
        byLevel
      };
    } catch (error) {
      console.error('Get clause stats failed:', error);
      return null;
    }
  }
}

// 導出單例
export const clauseService = new ClauseService();
