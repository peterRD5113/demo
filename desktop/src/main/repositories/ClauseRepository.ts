import { BaseRepository } from './BaseRepository';
import type { Clause } from '@shared/types';

/**
 * 條款 Repository
 * 處理條款相關的數據訪問
 */
export class ClauseRepository extends BaseRepository<Clause> {
  constructor() {
    super('clauses');
  }

  /**
   * 創建條款
   */
  createClause(
    documentId: number,
    clauseNumber: string,
    content: string,
    level: number,
    orderIndex: number,
    title?: string,
    parentId?: number
  ): number {
    return this.insert({
      document_id: documentId,
      clause_number: clauseNumber,
      title: title || null,
      content,
      level,
      parent_id: parentId || null,
      order_index: orderIndex,
    } as Partial<Clause>);
  }

  /**
   * 根據文檔 ID 查詢所有條款（按順序）
   */
  findByDocumentId(documentId: number): Clause[] {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE document_id = ?
      ORDER BY order_index ASC
    `;
    return this.executeRawQuery<Clause>(sql, [documentId]);
  }

  /**
   * 根據父條款 ID 查詢子條款
   */
  findByParentId(parentId: number): Clause[] {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE parent_id = ?
      ORDER BY order_index ASC
    `;
    return this.executeRawQuery<Clause>(sql, [parentId]);
  }

  /**
   * 獲取文檔的頂級條款（level = 1）
   */
  findTopLevelClauses(documentId: number): Clause[] {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE document_id = ? AND level = 1
      ORDER BY order_index ASC
    `;
    return this.executeRawQuery<Clause>(sql, [documentId]);
  }

  /**
   * 根據條款編號查詢
   */
  findByClauseNumber(documentId: number, clauseNumber: string): Clause | null {
    return this.findOneByCondition('document_id = ? AND clause_number = ?', [
      documentId,
      clauseNumber,
    ]);
  }

  /**
   * 更新條款內容
   */
  updateContent(clauseId: number, content: string): void {
    this.update(clauseId, { content } as Partial<Clause>);
  }

  /**
   * 更新條款標題
   */
  updateTitle(clauseId: number, title: string): void {
    this.update(clauseId, { title } as Partial<Clause>);
  }

  /**
   * 批量創建條款
   */
  batchCreateClauses(clauses: Omit<Clause, 'id' | 'created_at'>[]): number {
    let count = 0; for (const clause of clauses) { this.insert(clause as Partial<Clause>); count++; } return count;
  }

  /**
   * 刪除文檔的所有條款
   */
  deleteByDocumentId(documentId: number): number {
    const clauses = this.findByDocumentId(documentId); for (const clause of clauses) { this.softDelete(clause.id); } return clauses.length;
  }

  /**
   * 獲取文檔的條款數量
   */
  countByDocumentId(documentId: number): number {
    return this.count('document_id = ?', [documentId]);
  }

  /**
   * 根據層級統計條款數量
   */
  countByLevel(documentId: number): { level: number; count: number }[] {
    const sql = `
      SELECT level, COUNT(*) as count
      FROM ${this.tableName}
      WHERE document_id = ?
      GROUP BY level
      ORDER BY level ASC
    `;
    return this.executeRawQuery<{ level: number; count: number }>(sql, [documentId]);
  }

  /**
   * 搜索條款（按內容）
   */
  searchByContent(documentId: number, keyword: string): Clause[] {
    return this.findByCondition('document_id = ? AND content LIKE ?', [
      documentId,
      `%${keyword}%`,
    ]);
  }

  /**
   * 搜索條款（按標題）
   */
  searchByTitle(documentId: number, keyword: string): Clause[] {
    return this.findByCondition('document_id = ? AND title LIKE ?', [documentId, `%${keyword}%`]);
  }

  /**
   * 獲取條款的完整路徑（從根到當前條款）
   */
  getClausePath(clauseId: number): Clause[] {
    const path: Clause[] = [];
    let currentClause = this.findById(clauseId);

    while (currentClause) {
      path.unshift(currentClause);
      if (currentClause.parent_id) {
        currentClause = this.findById(currentClause.parent_id);
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * 檢查條款是否屬於指定文檔
   */
  belongsToDocument(clauseId: number, documentId: number): boolean {
    const clause = this.findById(clauseId);
    return !!(clause && clause.document_id === documentId);
  }

  /**
   * 分頁查詢文檔的條款
   */
  findByDocumentIdWithPagination(
    documentId: number,
    page: number,
    pageSize: number
  ): {
    list: Clause[];
    total: number;
    page: number;
    pageSize: number;
  } {
    // 使用自定義 SQL 以保持排序
    const offset = (page - 1) * pageSize;
    const total = this.countByDocumentId(documentId);

    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE document_id = ?
      ORDER BY order_index ASC
      LIMIT ? OFFSET ?
    `;
    const list = this.executeRawQuery<Clause>(sql, [documentId, pageSize, offset]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }
}

// 導出單例實例
export const clauseRepository = new ClauseRepository();
