// @ts-nocheck
/**
 * Version Service
 * 处理版本管理相关的业务逻辑 (sql.js compatible)
 */

import { getDb } from '@main/database/connection';
import { validatePositiveInteger } from '@main/utils/validation';
import { notFoundError } from '@main/middleware/errorHandler';

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  created_by: number;
  created_at: string;
  change_summary: string | null;
  is_current: number;
  creator_name?: string;
}

export interface VersionClause {
  id: number;
  version_id: number;
  clause_number: string;
  title: string | null;
  content: string;
  level: number;
  original_clause_id: number | null;
  created_at: string;
}

/** Run SELECT and return all rows as plain objects */
function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDb();
  const result = db.exec(sql, params);
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

/** Run SELECT and return first row or null */
function queryGet(sql: string, params: any[] = []): any | null {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/** Run INSERT/UPDATE/DELETE, return lastInsertRowid */
function run(sql: string, params: any[] = []): { lastInsertRowid: number } {
  const db = getDb();
  db.run(sql, params);
  const row = queryGet('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: row ? row.id : 0 };
}

class VersionService {
  async getDocumentVersions(documentId: number, userId: number): Promise<DocumentVersion[]> {
    validatePositiveInteger(documentId, 'Document ID');
    validatePositiveInteger(userId, 'User ID');
    return queryAll(`
      SELECT v.*, u.display_name as creator_name
      FROM document_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.document_id = ?
      ORDER BY v.version_number DESC
    `, [documentId]);
  }

  async getLatestVersion(documentId: number, userId: number): Promise<DocumentVersion | null> {
    validatePositiveInteger(documentId, 'Document ID');
    validatePositiveInteger(userId, 'User ID');
    return queryGet(`
      SELECT v.*, u.display_name as creator_name
      FROM document_versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.document_id = ?
      ORDER BY v.version_number DESC
      LIMIT 1
    `, [documentId]);
  }

  async getVersionClauses(versionId: number, userId: number): Promise<VersionClause[]> {
    validatePositiveInteger(versionId, 'Version ID');
    validatePositiveInteger(userId, 'User ID');
    return queryAll(`
      SELECT * FROM version_clauses
      WHERE version_id = ?
      ORDER BY id
    `, [versionId]);
  }

  async createVersion(
    documentId: number,
    userId: number,
    changeSummary?: string
  ): Promise<{ version_id: number; version_number: number }> {
    validatePositiveInteger(documentId, 'Document ID');
    validatePositiveInteger(userId, 'User ID');

    const db = getDb();

    const lastVersion = queryGet(`
      SELECT MAX(version_number) as max_version
      FROM document_versions WHERE document_id = ?
    `, [documentId]);
    const nextVersionNumber = ((lastVersion?.max_version) || 0) + 1;

    const { lastInsertRowid: versionId } = run(`
      INSERT INTO document_versions (document_id, version_number, created_by, change_summary, is_current)
      VALUES (?, ?, ?, ?, 1)
    `, [documentId, nextVersionNumber, userId, changeSummary || null]);

    db.run(`
      INSERT INTO version_clauses (version_id, clause_number, title, content, level, original_clause_id)
      SELECT ?, clause_number, title, content, level, id
      FROM clauses WHERE document_id = ? ORDER BY id
    `, [versionId, documentId]);

    db.run(`
      UPDATE document_versions SET is_current = 0
      WHERE document_id = ? AND id != ?
    `, [documentId, versionId]);

    return { version_id: versionId, version_number: nextVersionNumber };
  }

  async rollbackToVersion(documentId: number, versionId: number, userId: number): Promise<void> {
    validatePositiveInteger(documentId, 'Document ID');
    validatePositiveInteger(versionId, 'Version ID');
    validatePositiveInteger(userId, 'User ID');

    const db = getDb();

    const version = queryGet(`
      SELECT * FROM document_versions WHERE id = ? AND document_id = ?
    `, [versionId, documentId]);

    if (!version) throw notFoundError('版本不存在');

    db.run('DELETE FROM clauses WHERE document_id = ?', [documentId]);
    db.run(`
      INSERT INTO clauses (document_id, clause_number, title, content, level)
      SELECT ?, clause_number, title, content, level
      FROM version_clauses WHERE version_id = ? ORDER BY id
    `, [documentId, versionId]);
    db.run('UPDATE document_versions SET is_current = 0 WHERE document_id = ?', [documentId]);
    db.run('UPDATE document_versions SET is_current = 1 WHERE id = ?', [versionId]);
  }

  async getComparisonData(documentId: number, userId: number): Promise<{
    latest_version: { version_number: number; clauses: VersionClause[] } | null;
    current_editing: { clauses: any[] };
  }> {
    validatePositiveInteger(documentId, 'Document ID');
    validatePositiveInteger(userId, 'User ID');

    const latestVersion = await this.getLatestVersion(documentId, userId);
    let versionData = null;
    if (latestVersion) {
      const versionClauses = await this.getVersionClauses(latestVersion.id, userId);
      versionData = { version_number: latestVersion.version_number, clauses: versionClauses };
    }

    const currentClauses = queryAll(`
      SELECT * FROM clauses WHERE document_id = ? ORDER BY id
    `, [documentId]);

    return {
      latest_version: versionData,
      current_editing: { clauses: currentClauses }
    };
  }
}

export const versionService = new VersionService();
