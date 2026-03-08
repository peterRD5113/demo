// @ts-nocheck
/**
 * Annotation Service
 * ?��??�註?��??�業?��?�?
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

// ?�註類�?
const ANNOTATION_TYPES = ['comment', 'suggestion', 'question', 'issue'] as const;
type AnnotationType = typeof ANNOTATION_TYPES[number];

// ?�註?�??
const ANNOTATION_STATUS = ['active', 'resolved', 'deleted'] as const;
type AnnotationStatus = typeof ANNOTATION_STATUS[number];

// ?�註?�口
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

// Mention ?�口
interface Mention {
  id: number;
  annotation_id: number;
  mentioned_user_id: number;
  status: 'pending' | 'read' | 'resolved';
  created_at: string;
}

// ?�註?�表?��?
interface AnnotationListResponse {
  annotations: Annotation[];
  total: number;
}

class AnnotationService {
  /**
   * ?�建?�註
   */
  async createAnnotation(
    clauseId: number,
    userId: number,
    content: string,
    type: AnnotationType = 'comment'
  ): Promise<{ success: boolean; message: string; annotationId?: number }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(content, 'Annotation content', 1, 2000);
      validateEnum(type, 'Annotation type', ANNOTATION_TYPES);

      // 檢查條款?�否存在
      const clause = clauseRepository.findById(clauseId);
      if (!clause) {
        return {
          success: false,
          message: 'Clause not found'
        };
      }

      // 檢查?��?權�?
      const document = documentRepository.findById(clause.document_id);
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // 檢查?�目權�?
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to annotate this clause'
        };
      }

      // ?�建?�註
      const stmt = getDb().prepare(`
        INSERT INTO annotations (clause_id, user_id, content, type, status)
        VALUES (?, ?, ?, ?, 'active')
      `);
      
      const result = stmt.run(clauseId, userId, content, type);
      const annotationId = result.lastInsertRowid as number;

      // �?? @mentions
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
   * ?��?條款?��??�批�?
   */
  async getClauseAnnotations(
    clauseId: number,
    userId: number
  ): Promise<AnnotationListResponse> {
    try {
      // ?�數驗�?
      validatePositiveInteger(clauseId, 'Clause ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查條款?�否存在
      const clause = clauseRepository.findById(clauseId);
      if (!clause) {
        return {
          annotations: [],
          total: 0
        };
      }

      // 檢查?��?權�?
      const document = documentRepository.findById(clause.document_id);
      if (!document) {
        return {
          annotations: [],
          total: 0
        };
      }

      // 檢查?�目權�?
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          annotations: [],
          total: 0
        };
      }

      // ?��??�註?�表（�??�用?�信?��?
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
   * ?�新?�註
   */
  async updateAnnotation(
    annotationId: number,
    userId: number,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(content, 'Annotation content', 1, 2000);

      // 檢查?�註?�否存在
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 檢查?�否?�批註�???
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to update this annotation'
        };
      }

      // ?�新?�註
      const updateStmt = getDb().prepare(`
        UPDATE annotations 
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateStmt.run(content, annotationId);

      // ?�新�?? @mentions
      const mentions = this.extractMentions(content);
      if (mentions.length > 0) {
        // ?�除?��? mentions
        const deleteMentionsStmt = getDb().prepare('DELETE FROM mentions WHERE annotation_id = ?');
        deleteMentionsStmt.run(annotationId);

        // ?�建?��? mentions
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
   * ?�除?�註（�??�除�?
   */
  async deleteAnnotation(
    annotationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查?�註?�否存在
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // 檢查?�否?�批註�???
      if (annotation.user_id !== userId) {
        return {
          success: false,
          message: 'No permission to delete this annotation'
        };
      }

      // 軟刪?�批�?
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
   * �?��?�註
   */
  async resolveAnnotation(
    annotationId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(annotationId, 'Annotation ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查?�註?�否存在
      const stmt = getDb().prepare('SELECT * FROM annotations WHERE id = ?');
      const annotation = stmt.get(annotationId) as Annotation | undefined;
      
      if (!annotation) {
        return {
          success: false,
          message: 'Annotation not found'
        };
      }

      // ?�新?�?�為 resolved
      const updateStmt = getDb().prepare(`
        UPDATE annotations 
        SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      updateStmt.run(annotationId);

      // ?�新?��? mentions ?�??
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
   * ?��??�戶?��?確�??�表（被 @ ?�批註�?
   */
  async getUserMentions(
    userId: number,
    projectId: number
  ): Promise<{ mentions: any[]; total: number }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(userId, 'User ID');
      validatePositiveInteger(projectId, 'Project ID');

      // 檢查?�目權�?
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          mentions: [],
          total: 0
        };
      }

      // ?��?待確認�? mentions
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
   * 標�? mention ?�已讀
   */
  async markMentionAsRead(
    mentionId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ?�數驗�?
      validatePositiveInteger(mentionId, 'Mention ID');
      validatePositiveInteger(userId, 'User ID');

      // 檢查 mention ?�否存在
      const stmt = getDb().prepare('SELECT * FROM mentions WHERE id = ?');
      const mention = stmt.get(mentionId) as Mention | undefined;
      
      if (!mention) {
        return {
          success: false,
          message: 'Mention not found'
        };
      }

      // 檢查?�否?�被 @ ?�用??
      if (mention.mentioned_user_id !== userId) {
        return {
          success: false,
          message: 'No permission to mark this mention'
        };
      }

      // ?�新?�?�為 read
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
   * 從批註內容中?��? @mentions
   */
  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // ?��?
  }

  /**
   * ?�建 mentions 記�?
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
        // ?�找?�戶
        const user = userRepository.findByUsername(username);
        
        if (user) {
          // 檢查?�戶?�否?��??��???
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

// 導出?��?
export const annotationService = new AnnotationService();

