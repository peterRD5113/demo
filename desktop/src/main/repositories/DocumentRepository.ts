import { BaseRepository } from './BaseRepository';
import type { Document } from '@shared/types';

/**
 * 文檔 Repository
 * 處理文檔相關的數據訪問
 */
export class DocumentRepository extends BaseRepository<Document> {
  constructor() {
    super('documents');
  }

  /**
   * 創建文檔
   */
  createDocument(
    projectId: number,
    name: string,
    originalName: string,
    fileType: 'docx' | 'pdf' | 'txt',
    fileSize: number,
    filePath: string
  ): number {
    return this.insert({
      project_id: projectId,
      name,
      original_filename: originalName,
      file_type: fileType,
      file_size: fileSize,
      file_path: filePath,
      status: 'pending',
    } as Partial<Document>);
  }

  /**
   * 根據項目 ID 查詢文檔列表
   */
  findByProjectId(projectId: number): Document[] {
    return this.findByCondition('project_id = ?', [projectId]);
  }

  /**
   * 分頁查詢項目的文檔
   */
  findByProjectIdWithPagination(
    projectId: number,
    page: number,
    pageSize: number
  ): {
    list: Document[];
    total: number;
    page: number;
    pageSize: number;
  } {
    return this.findWithPagination(page, pageSize, 'project_id = ?', [projectId]);
  }

  /**
   * 更新文檔狀態
   */
  updateStatus(documentId: number, status: 'pending' | 'processing' | 'completed' | 'failed', errorMessage?: string): void {
    this.update(documentId, { status } as Partial<Document>);
  }

  /**
   * 更新文檔名稱
   */
  updateName(documentId: number, name: string): void {
    this.update(documentId, { name } as Partial<Document>);
  }

  /**
   * 根據狀態查詢文檔
   */
  findByStatus(status: 'pending' | 'processing' | 'completed' | 'failed'): Document[] {
    return this.findByCondition('status = ?', [status]);
  }

  /**
   * 檢查文檔是否屬於指定項目
   */
  belongsToProject(documentId: number, projectId: number): boolean {
    const document = this.findById(documentId);
    return !!(document && document.project_id === projectId);
  }

  /**
   * 獲取項目的文檔數量
   */
  countByProjectId(projectId: number): number {
    return this.count('project_id = ?', [projectId]);
  }

  /**
   * 搜索文檔（按名稱）
   */
  searchByName(projectId: number, keyword: string): Document[] {
    return this.findByCondition('project_id = ? AND name LIKE ?', [projectId, `%${keyword}%`]);
  }

  /**
   * 獲取最近更新的文檔
   */
  findRecentDocuments(projectId: number, limit: number): Document[] {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE project_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `;
    return this.executeRawQuery<Document>(sql, [projectId, limit]);
  }

  /**
   * 根據文件類型統計文檔數量
   */
  countByFileType(projectId: number): { file_type: string; count: number }[] {
    const sql = `
      SELECT file_type, COUNT(*) as count
      FROM ${this.tableName}
      WHERE project_id = ?
      GROUP BY file_type
    `;
    return this.executeRawQuery<{ file_type: string; count: number }>(sql, [projectId]);
  }

  /**
   * 獲取項目的總文件大小
   */
  getTotalFileSize(projectId: number): number {
    const sql = `
      SELECT SUM(file_size) as total_size
      FROM ${this.tableName}
      WHERE project_id = ?
    `;
    const result = this.executeRawQueryOne<{ total_size: number | null }>(sql, [projectId]);
    return result?.total_size || 0;
  }
}

// 導出單例實例
export const documentRepository = new DocumentRepository();



