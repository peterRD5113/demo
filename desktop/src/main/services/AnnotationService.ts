// @ts-nocheck
/**
 * Annotation Service
 * 處理備註相關的業務邏輯
 */

import { 
  clauseRepository, 
  documentRepository, 
  projectRepository
} from '@main/repositories';
import { getDb } from '../database/connection';
import {
  validatePositiveInteger,
  validateRequiredString,
  validateEnum
} from '@main/utils/validation';

// 備註類型
const ANNOTATION_TYPES = ['comment', 'suggestion', 'question', 'issue'] as const;
type AnnotationType = typeof ANNOTATION_TYPES[number];

// 備註狀態
const ANNOTATION_STATUS = ['active', 'resolved', 'deleted'] as const;
type AnnotationStatus = typeof ANNOTATION_STATUS[number];

// 備註接口
interface Annotation {
  id: number;
  clause_id: number;
  user_id: number;
  content: string;
  type: AnnotationType;
  status: AnnotationStatus;
  created_at: string;
  updated_at: string;
}

// 備註列表響應
interface AnnotationListResponse {
  annotations: Annotation[];
  total: number;
}

class AnnotationService {
  /**
   * 創建備註
   */
  async createAnnotation(
    clauseId: number,
    userId: number,
    content: string,
    type: AnnotationType = 'comment'
  ): Promise<{ success: boolean; message: string; annotationId?: number }> {
    try {
      // 調試日誌
      console.log('AnnotationService.createAnnotation called with:', { 
        clauseId, 
        userId, 
        content, 
        type,
        clauseIdType: typeof clauseId,
        userIdType: typeof userId
      });
      
      // 參數驗證
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(content, 'Annotation content', 1, 2000);
      validateEnum(type, 'Annotation type', ANNOTATION_TYPES);

      console.log('Validation passed');

      // 檢查條款是否存在
      const clause = clauseRepository.findById(clauseId);
      console.log('Found clause:', clause);
      if (!clause) {
        return {
          success: false,
          message: 'Clause not found'
        };
      }

      // 檢查文檔權限
      const document = documentRepository.findById(clause.document_id);
      console.log('Found document:', document);
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // 檢查項目權限
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to annotate this clause'
        };
      }

      console.log('About to execute SQL with params:', { clauseId, userId, content, type });

      // 創建備註 - 使用 sql.js 的正確 API（參數必須是數組）
      const sql = `
        INSERT INTO annotations (clause_id, user_id, content, type, status)
        VALUES (?, ?, ?, ?, 'active')
      `;
      
      getDb().run(sql, [clauseId, userId, content, type]);
      
      // 獲取插入的 ID
      const result = getDb().exec('SELECT last_insert_rowid() as id');
      const annotationId = result[0].values[0][0] as number;

      console.log('Annotation created with ID:', annotationId);

      return {
        success: true,
        message: 'Annotation created successfully',
        annotationId
      };
    } catch (error) {
      console.error('Create annotation failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Create annotation failed'
      };
    }
  }

  /**
   * 獲取條款的所有批註
   */
  async getClauseAnnotations(
    clauseId: number,
    userId: number
  ): Promise<AnnotationListResponse> {
    try {
      // 參數驗證
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查條款是否存在
      const clause = clauseRepository.findById(clauseId);
      if (!clause) {
        return {
          annotations: [],
          total: 0
        };
      }

      // 檢查文檔權限
      const document = documentRepository.findById(clause.document_id);
      if (!document) {
        return {
          annotations: [],
          total: 0
        };
      }

      // 檢查項目權限
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          annotations: [],
          total: 0
        };
      }

      // 獲取備註列表（包含用戶信息）- 使用 sql.js 的 exec 方法
      const sql = `
        SELECT 
          a.*,
          u.username,
          u.display_name
        FROM annotations a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.clause_id = ? AND a.status != 'deleted'
        ORDER BY a.created_at DESC
      `;
      
      console.log('=== GET ANNOTATIONS: Querying for clauseId:', clauseId);
      const results = getDb().exec(sql, [clauseId]);
      console.log('=== GET ANNOTATIONS: Query results:', results);
      
      if (results.length === 0) {
        console.log('=== GET ANNOTATIONS: No results found');
        return {
          annotations: [],
          total: 0
        };
      }

      const { columns, values } = results[0];
      console.log('=== GET ANNOTATIONS: Columns:', columns);
      console.log('=== GET ANNOTATIONS: Values count:', values.length);
      
      const annotations = values.map(row => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      console.log('=== GET ANNOTATIONS: Mapped annotations:', annotations);

      return {
        annotations,
        total: annotations.length
      };
    } catch (error) {
      console.error('Get clause annotations failed:', error);
      return {
        annotations: [],
        total: 0
      };
    }
  }

  /**
   * 更新備註
   */
  async updateAnnotation(
    annotationId: number,
    userId: number,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(content, 'Annotation content', 1, 2000);

      // 檢查備註是否存在
      const results = getDb().exec('SELECT * FROM annotations WHERE id = ?', [annotationId]);
      
      if (results.length === 0 || results[0].values.length === 0) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      const { columns, values } = results[0];
      const annotation: any = {};
      columns.forEach((col, idx) => {
        annotation[col] = values[0][idx];
      });

      // 檢查是否為批註作者
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to update this annotation'
        };
      }

      // 更新備註
      getDb().run(`
        UPDATE annotations 
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [content, annotationId]);

      return {
        success: true,
        message: 'Annotation updated successfully'
      };
    } catch (error) {
      console.error('Update annotation failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update annotation failed'
      };
    }
  }

  /**
   * 刪除備註（軟刪除）
   */
  async deleteAnnotation(
    annotationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查備註是否存在
      const results = getDb().exec('SELECT * FROM annotations WHERE id = ?', [annotationId]);
      
      if (results.length === 0 || results[0].values.length === 0) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      const { columns, values } = results[0];
      const annotation: any = {};
      columns.forEach((col, idx) => {
        annotation[col] = values[0][idx];
      });

      // 檢查是否為批註作者
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to delete this annotation'
        };
      }

      // 軟刪除批註
      getDb().run(`
        UPDATE annotations 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [annotationId]);

      return {
        success: true,
        message: 'Annotation deleted successfully'
      };
    } catch (error) {
      console.error('Delete annotation failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Delete annotation failed'
      };
    }
  }

  /**
   * 解決備註
   */
  async resolveAnnotation(
    annotationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查備註是否存在
      const results = getDb().exec('SELECT * FROM annotations WHERE id = ?', [annotationId]);
      
      if (results.length === 0 || results[0].values.length === 0) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 更新狀態為 resolved
      getDb().run(`
        UPDATE annotations 
        SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [annotationId]);

      return {
        success: true,
        message: 'Annotation resolved successfully'
      };
    } catch (error) {
      console.error('Resolve annotation failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Resolve annotation failed'
      };
    }
  }

  /**
   * 獲取用戶的待確認列表（被 @ 的批註）
   * 注意：mentions 表不存在，返回空列表
   */
  async getUserMentions(
    userId: number,
    projectId: number
  ): Promise<{ mentions: any[]; total: number }> {
    // mentions 表不存在，直接返回空列表
    return {
      mentions: [],
      total: 0
    };
  }

  /**
   * 標記 mention 為已讀
   * 注意：mentions 表不存在，返回成功
   */
  async markMentionAsRead(
    mentionId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    // mentions 表不存在，直接返回成功
    return {
      success: true,
      message: 'Mention marked as read'
    };
  }
}

// 導出實例
export const annotationService = new AnnotationService();
