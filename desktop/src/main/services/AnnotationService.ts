// @ts-nocheck
/**
 * Annotation Service
 * 處理備註相關的業務邏輯
 */

import { 
  clauseRepository, 
  documentRepository, 
  projectRepository,
  userRepository 
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

// Mention 接口
interface Mention {
  id: number;
  annotation_id: number;
  mentioned_user_id: number;
  status: 'pending' | 'read' | 'resolved';
  created_at: string;
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

      // 創建備註
      const stmt = getDb().prepare(`
        INSERT INTO annotations (clause_id, user_id, content, type, status)
        VALUES (?, ?, ?, ?, 'active')
      `);
      
      const result = stmt.run(clauseId, userId, content, type);
      const annotationId = result.lastInsertRowid as number;

      console.log('Annotation created with ID:', annotationId);

      // 處理 @mentions
      const mentions = this.extractMentions(content);
      if (mentions.length > 0) {
        await this.createMentions(annotationId, mentions, document.project_id);
      }

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

      // 獲取備註列表（包含用戶信息）
      const stmt = getDb().prepare(`
        SELECT 
          a.*,
          u.username,
          u.email
        FROM annotations a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.clause_id = ? AND a.status != 'deleted'
        ORDER BY a.created_at DESC
      `);
      
      const annotations = stmt.all(clauseId) as any[];

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
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 檢查是否為批註作者
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to update this annotation'
        };
      }

      // 更新備註
      const updateStmt = getDb().prepare(`
        UPDATE annotations 
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateStmt.run(content, annotationId);

      // 更新處理 @mentions
      const mentions = this.extractMentions(content);
      if (mentions.length > 0) {
        // 刪除舊的 mentions
        const deleteMentionsStmt = getDb().prepare('DELETE FROM mentions WHERE annotation_id = ?');
        deleteMentionsStmt.run(annotationId);

        // 創建新的 mentions
        const clause = clauseRepository.findById(annotation.clause_id);
        if (clause) {
          const document = documentRepository.findById(clause.document_id);
          if (document) {
            await this.createMentions(annotationId, mentions, document.project_id);
          }
        }
      }

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
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 檢查是否為批註作者
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to delete this annotation'
        };
      }

      // 軟刪除批註
      const updateStmt = getDb().prepare(`
        UPDATE annotations 
        SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateStmt.run(annotationId);

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
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 更新狀態為 resolved
      const updateStmt = getDb().prepare(`
        UPDATE annotations 
        SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateStmt.run(annotationId);

      // 更新相關 mentions 狀態
      const updateMentionsStmt = getDb().prepare(`
        UPDATE mentions 
        SET status = 'resolved'
        WHERE annotation_id = ?
      `);
      
      updateMentionsStmt.run(annotationId);

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
   */
  async getUserMentions(
    userId: number,
    projectId: number
  ): Promise<{ mentions: any[]; total: number }> {
    try {
      // 參數驗證
      validatePositiveInteger(userId, 'User ID');
      validatePositiveInteger(projectId, 'Project ID');

      // 檢查項目權限
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          mentions: [],
          total: 0
        };
      }

      // 獲取待確認的 mentions
      const stmt = getDb().prepare(`
        SELECT 
          m.*,
          a.content as annotation_content,
          a.type as annotation_type,
          a.created_at as annotation_created_at,
          c.clause_number,
          c.title as clause_title,
          c.content as clause_content,
          d.name as document_name,
          u.username as author_username
        FROM mentions m
        LEFT JOIN annotations a ON m.annotation_id = a.id
        LEFT JOIN clauses c ON a.clause_id = c.id
        LEFT JOIN documents d ON c.document_id = d.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE m.mentioned_user_id = ? 
          AND m.status = 'pending'
          AND d.project_id = ?
        ORDER BY m.created_at DESC
      `);
      
      const mentions = stmt.all(userId, projectId) as any[];

      return {
        mentions,
        total: mentions.length
      };
    } catch (error) {
      console.error('Get user mentions failed:', error);
      return {
        mentions: [],
        total: 0
      };
    }
  }

  /**
   * 標記 mention 為已讀
   */
  async markMentionAsRead(
    mentionId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 參數驗證
      validatePositiveInteger(mentionId, 'Mention ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查 mention 是否存在
      const stmt = getDb().prepare('SELECT * FROM mentions WHERE id = ?');
      const mention = stmt.get(mentionId) as Mention | undefined;
      
      if (!mention) {
        return {
          success: false,
          message: 'Mention not found'
        };
      }

      // 檢查是否為被 @ 的用戶
      if (mention.mentioned_user_id !== userId) {
        return {
          success: false,
          message: 'No permission to mark this mention'
        };
      }

      // 更新狀態為 read
      const updateStmt = getDb().prepare(`
        UPDATE mentions 
        SET status = 'read'
        WHERE id = ?
      `);
      
      updateStmt.run(mentionId);

      return {
        success: true,
        message: 'Mention marked as read'
      };
    } catch (error) {
      console.error('Mark mention as read failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Mark mention as read failed'
      };
    }
  }

  /**
   * 從批註內容中提取 @mentions
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // 去重
  }

  /**
   * 創建 mentions 記錄
   */
  private async createMentions(
    annotationId: number,
    usernames: string[],
    projectId: number
  ): Promise<void> {
    try {
      const stmt = getDb().prepare(`
        INSERT INTO mentions (annotation_id, mentioned_user_id, status)
        VALUES (?, ?, 'pending')
      `);

      for (const username of usernames) {
        // 查找用戶
        const user = userRepository.findByUsername(username);
        
        if (user) {
          // 檢查用戶是否屬於該項目
          if (projectRepository.isOwnedByUser(projectId, user.id)) {
            stmt.run(annotationId, user.id);
          }
        }
      }
    } catch (error) {
      console.error('Create mentions failed:', error);
    }
  }
}

// 導出實例
export const annotationService = new AnnotationService();
