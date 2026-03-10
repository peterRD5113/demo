import { Database } from 'sql.js';
import { getDb } from '../database/connection';

/**
 * Base Repository Class
 * Provides common CRUD operations
 */
export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get database instance (lazy loading)
   */
  protected get db(): Database {
    return getDb();
  }

  /**
   * Execute query and return results
   * sql.js exec() returns format: [{ columns: [...], values: [[...]] }]
   */
  private execQuery(sql: string, params?: unknown[]): unknown[] {
    const results = this.db.exec(sql, params as any[]);
    if (results.length === 0) return [];
    
    const { columns, values } = results[0];
    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }

  /**
   * Execute query and return single result
   */
  private execQueryOne(sql: string, params?: unknown[]): unknown | null {
    const results = this.execQuery(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find by ID
   */
  findById(id: number): T | null {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const result = this.execQueryOne(sql, [id]);
      return result ? (result as T) : null;
    } catch (error) {
      console.error(`Query ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Find all records
   */
  findAll(): T[] {
    try {
      const sql = `SELECT * FROM ${this.tableName}`;
      return this.execQuery(sql) as T[];
    } catch (error) {
      console.error(`Query ${this.tableName} list failed:`, error);
      throw error;
    }
  }

  /**
   * Find by condition
   */
  findByCondition(where: string, params: unknown[]): T[] {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE ${where}`;
      return this.execQuery(sql, params) as T[];
    } catch (error) {
      console.error(`Conditional query ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Find one by condition
   */
  findOneByCondition(where: string, params: unknown[]): T | null {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`;
      const result = this.execQueryOne(sql, params);
      return result ? (result as T) : null;
    } catch (error) {
      console.error(`Conditional query one ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  findWithPagination(page: number, pageSize: number, where?: string, params?: unknown[]): {
    list: T[];
    total: number;
    page: number;
    pageSize: number;
  } {
    try {
      const countSql = where
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const countResult = this.execQueryOne(countSql, params) as { count: number };
      const total = countResult.count;

      const offset = (page - 1) * pageSize;
      const dataSql = where
        ? `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT ? OFFSET ?`
        : `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`;
      const dataParams = where && params ? [...params, pageSize, offset] : [pageSize, offset];
      const list = this.execQuery(dataSql, dataParams) as T[];

      return { list, total, page, pageSize };
    } catch (error) {
      console.error(`Paginated query ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Insert record
   */
  insert(data: Partial<T>): number {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      const columns = keys.join(', ');

      const sql = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      this.db.run(sql, values as any[]);
      
      const result = this.execQueryOne('SELECT last_insert_rowid() as id') as { id: number };
      return result.id;
    } catch (error) {
      console.error(`Insert ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Update record
   */
  update(id: number, data: Partial<T>): number {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key) => `${key} = ?`).join(', ');

      const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = datetime('now', 'localtime') WHERE id = ?`;
      this.db.run(sql, [...values, id] as any[]);
      
      const result = this.execQueryOne('SELECT changes() as changes') as { changes: number };
      return result.changes;
    } catch (error) {
      console.error(`Update ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Delete record (physical delete)
   */
  delete(id: number): number {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      this.db.run(sql, [id]);
      
      const result = this.execQueryOne('SELECT changes() as changes') as { changes: number };
      return result.changes;
    } catch (error) {
      console.error(`Delete ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Delete records by condition
   */
  deleteByCondition(where: string, params: unknown[]): number {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE ${where}`;
      this.db.run(sql, params as any[]);
      const result = this.execQueryOne('SELECT changes() as changes') as { changes: number };
      return result.changes;
    } catch (error) {
      console.error(`Delete by condition ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Soft delete (set deleted_at field)
   */
  softDelete(id: number): number {
    try {
      const sql = `UPDATE ${this.tableName} SET deleted_at = datetime('now', 'localtime') WHERE id = ?`;
      this.db.run(sql, [id]);
      
      const result = this.execQueryOne('SELECT changes() as changes') as { changes: number };
      return result.changes;
    } catch (error) {
      console.error(`Soft delete ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Count records
   */
  count(where?: string, params?: unknown[]): number {
    try {
      const sql = where
        ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${where}`
        : `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const result = this.execQueryOne(sql, params) as { count: number };
      return result.count;
    } catch (error) {
      console.error(`Count ${this.tableName} failed:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  exists(id: number): boolean {
    try {
      const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? LIMIT 1`;
      const result = this.execQueryOne(sql, [id]);
      return !!result;
    } catch (error) {
      console.error(`Check ${this.tableName} existence failed:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists by condition
   */
  existsByCondition(where: string, params: unknown[]): boolean {
    try {
      const sql = `SELECT 1 FROM ${this.tableName} WHERE ${where} LIMIT 1`;
      const result = this.execQueryOne(sql, params);
      return !!result;
    } catch (error) {
      console.error(`Check ${this.tableName} existence by condition failed:`, error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query
   */
  protected executeRawQuery<R = unknown>(sql: string, params?: unknown[]): R[] {
    try {
      return this.execQuery(sql, params) as R[];
    } catch (error) {
      console.error('Execute raw query failed:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query (single record)
   */
  protected executeRawQueryOne<R = unknown>(sql: string, params?: unknown[]): R | null {
    try {
      const result = this.execQueryOne(sql, params);
      return result ? (result as R) : null;
    } catch (error) {
      console.error('Execute raw query failed:', error);
      throw error;
    }
  }
}
