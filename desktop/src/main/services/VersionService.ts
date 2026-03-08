/**
 * Version Service
 * 處理文檔版本管理相關業務邏輯
 */

import { getDb, saveDatabase } from '../database/connection';

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  content: string;
  created_by: number;
  comment?: string;
  created_at: string;
  creator_name?: string;
}

export interface VersionCompareResult {
  version1: DocumentVersion;
  version2: DocumentVersion;
  differences: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export class VersionService {
  /**
   * 保存文檔版本
   */
  static async saveVersion(
    documentId: number,
    content: string,
    userId: number,
    comment?: string
  ): Promise<DocumentVersion> {
    const db = getDb();

    try {
      // 獲取當前最大版本號
      const versionResult = db.exec(
        `SELECT COALESCE(MAX(version_number), 0) as max_version 
         FROM document_versions 
         WHERE document_id = ?`,
        [documentId]
      );

      const maxVersion =
        versionResult.length > 0 && versionResult[0].values.length > 0
          ? (versionResult[0].values[0][0] as number)
          : 0;

      const newVersionNumber = maxVersion + 1;

      // 插入新版本
      db.run(
        `INSERT INTO document_versions (document_id, version_number, content, created_by, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [documentId, newVersionNumber, content, userId, comment || null]
      );

      // 獲取插入的版本ID
      const idResult = db.exec('SELECT last_insert_rowid() as id');
      const versionId =
        idResult.length > 0 && idResult[0].values.length > 0
          ? (idResult[0].values[0][0] as number)
          : 0;

      saveDatabase();

      // 返回完整的版本信息
      return this.getVersionById(versionId);
    } catch (error) {
      console.error('Error saving version:', error);
      throw new Error('保存版本失敗');
    }
  }

  /**
   * 獲取文檔的所有版本
   */
  static async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    const db = getDb();

    try {
      const result = db.exec(
        `SELECT 
          v.id,
          v.document_id,
          v.version_number,
          v.content,
          v.created_by,
          v.comment,
          v.created_at,
          u.display_name as creator_name
         FROM document_versions v
         LEFT JOIN users u ON v.created_by = u.id
         WHERE v.document_id = ?
         ORDER BY v.version_number DESC`,
        [documentId]
      );

      if (result.length === 0 || result[0].values.length === 0) {
        return [];
      }

      const columns = result[0].columns;
      return result[0].values.map((row) => {
        const version: any = {};
        columns.forEach((col, index) => {
          version[col] = row[index];
        });
        return version as DocumentVersion;
      });
    } catch (error) {
      console.error('Error getting document versions:', error);
      throw new Error('獲取版本列表失敗');
    }
  }

  /**
   * 根據ID獲取版本
   */
  static async getVersionById(versionId: number): Promise<DocumentVersion> {
    const db = getDb();

    try {
      const result = db.exec(
        `SELECT 
          v.id,
          v.document_id,
          v.version_number,
          v.content,
          v.created_by,
          v.comment,
          v.created_at,
          u.display_name as creator_name
         FROM document_versions v
         LEFT JOIN users u ON v.created_by = u.id
         WHERE v.id = ?`,
        [versionId]
      );

      if (result.length === 0 || result[0].values.length === 0) {
        throw new Error('版本不存在');
      }

      const columns = result[0].columns;
      const row = result[0].values[0];
      const version: any = {};
      columns.forEach((col, index) => {
        version[col] = row[index];
      });

      return version as DocumentVersion;
    } catch (error) {
      console.error('Error getting version by id:', error);
      throw new Error('獲取版本信息失敗');
    }
  }

  /**
   * 比較兩個版本
   */
  static async compareVersions(
    versionId1: number,
    versionId2: number
  ): Promise<VersionCompareResult> {
    try {
      const version1 = await this.getVersionById(versionId1);
      const version2 = await this.getVersionById(versionId2);

      if (version1.document_id !== version2.document_id) {
        throw new Error('無法比較不同文檔的版本');
      }

      // 簡單的文本差異比較
      const lines1 = version1.content.split('\n');
      const lines2 = version2.content.split('\n');

      const added: string[] = [];
      const removed: string[] = [];
      const modified: string[] = [];

      // 找出新增和修改的行
      lines2.forEach((line, index) => {
        if (index >= lines1.length) {
          added.push(line);
        } else if (line !== lines1[index]) {
          modified.push(`行 ${index + 1}: "${lines1[index]}" → "${line}"`);
        }
      });

      // 找出刪除的行
      if (lines1.length > lines2.length) {
        for (let i = lines2.length; i < lines1.length; i++) {
          removed.push(lines1[i]);
        }
      }

      return {
        version1,
        version2,
        differences: {
          added,
          removed,
          modified,
        },
      };
    } catch (error) {
      console.error('Error comparing versions:', error);
      throw new Error('比較版本失敗');
    }
  }

  /**
   * 回滾到指定版本
   */
  static async rollbackToVersion(
    versionId: number,
    userId: number,
    comment?: string
  ): Promise<DocumentVersion> {
    try {
      const targetVersion = await this.getVersionById(versionId);

      // 創建新版本（內容為目標版本的內容）
      const rollbackComment = comment
        ? `回滾到版本 ${targetVersion.version_number}: ${comment}`
        : `回滾到版本 ${targetVersion.version_number}`;

      return await this.saveVersion(
        targetVersion.document_id,
        targetVersion.content,
        userId,
        rollbackComment
      );
    } catch (error) {
      console.error('Error rolling back version:', error);
      throw new Error('回滾版本失敗');
    }
  }

  /**
   * 刪除版本
   */
  static async deleteVersion(versionId: number): Promise<void> {
    const db = getDb();

    try {
      // 檢查版本是否存在
      const version = await this.getVersionById(versionId);

      // 檢查是否為最後一個版本
      const versionsResult = db.exec(
        `SELECT COUNT(*) as count 
         FROM document_versions 
         WHERE document_id = ?`,
        [version.document_id]
      );

      const versionCount =
        versionsResult.length > 0 && versionsResult[0].values.length > 0
          ? (versionsResult[0].values[0][0] as number)
          : 0;

      if (versionCount <= 1) {
        throw new Error('無法刪除最後一個版本');
      }

      // 刪除版本
      db.run('DELETE FROM document_versions WHERE id = ?', [versionId]);

      saveDatabase();
    } catch (error) {
      console.error('Error deleting version:', error);
      throw new Error('刪除版本失敗');
    }
  }

  /**
   * 獲取版本統計信息
   */
  static async getVersionStats(documentId: number): Promise<{
    total_versions: number;
    latest_version: number;
    first_created: string;
    last_created: string;
  }> {
    const db = getDb();

    try {
      const result = db.exec(
        `SELECT 
          COUNT(*) as total_versions,
          MAX(version_number) as latest_version,
          MIN(created_at) as first_created,
          MAX(created_at) as last_created
         FROM document_versions
         WHERE document_id = ?`,
        [documentId]
      );

      if (result.length === 0 || result[0].values.length === 0) {
        return {
          total_versions: 0,
          latest_version: 0,
          first_created: '',
          last_created: '',
        };
      }

      const row = result[0].values[0];
      return {
        total_versions: row[0] as number,
        latest_version: row[1] as number,
        first_created: row[2] as string,
        last_created: row[3] as string,
      };
    } catch (error) {
      console.error('Error getting version stats:', error);
      throw new Error('獲取版本統計失敗');
    }
  }
}
