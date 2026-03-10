import { BaseRepository } from './BaseRepository';
import type { Project } from '@shared/types';
import bcrypt from 'bcryptjs';

/**
 * 項目 Repository
 * 處理項目相關的數據訪問
 */
export class ProjectRepository extends BaseRepository<Project> {
  constructor() {
    super('projects');
  }

  /**
   * 創建項目
   * @param name 項目名稱
   * @param userId 用戶 ID
   * @param description 項目描述
   * @param password 項目密碼（可選）
   * @returns 項目 ID
   */
  createProject(
    name: string,
    userId: number,
    description?: string,
    password?: string
  ): number {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

    return this.insert({
      name,
      description: description || null,
      user_id: userId,
      password_hash: passwordHash,
    } as Partial<Project>);
  }

  /**
   * 根據用戶 ID 查詢項目列表（不包含已刪除）
   */
  findByUserId(userId: number): Project[] {
    return this.findByCondition('user_id = ? AND deleted_at IS NULL', [userId]);
  }

  /**
   * 分頁查詢用戶的項目
   */
  findByUserIdWithPagination(
    userId: number,
    page: number,
    pageSize: number
  ): {
    list: Project[];
    total: number;
    page: number;
    pageSize: number;
  } {
    return this.findWithPagination(page, pageSize, 'user_id = ? AND deleted_at IS NULL', [
      userId,
    ]);
  }

  /**
   * 驗證項目密碼
   * @param projectId 項目 ID
   * @param password 密碼
   * @returns true 表示驗證成功
   */
  verifyPassword(projectId: number, password: string): boolean {
    const project = this.findById(projectId);
    if (!project) return false;

    // 如果項目沒有設置密碼，直接返回 true
    if (!project.password_hash) return true;

    // 驗證密碼
    return bcrypt.compareSync(password, project.password_hash);
  }

  /**
   * 設置項目密碼
   * @param projectId 項目 ID
   * @param password 新密碼（傳入 null 表示移除密碼）
   */
  setPassword(projectId: number, password: string | null): void {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
    this.update(projectId, { password_hash: passwordHash } as Partial<Project>);
  }

  /**
   * 檢查項目是否有密碼保護
   */
  hasPassword(projectId: number): boolean {
    const project = this.findById(projectId);
    return !!(project && project.password_hash);
  }

  /**
   * 更新項目信息
   */
  updateProject(projectId: number, name?: string, description?: string): void {
    const updateData: Partial<Project> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length > 0) {
      this.update(projectId, updateData);
    }
  }

  /**
   * 軟刪除項目
   */
  deleteProject(projectId: number): void {
    this.softDelete(projectId);
  }

  /**
   * 恢復已刪除的項目
   */
  restoreProject(projectId: number): void {
    this.update(projectId, { deleted_at: null } as Partial<Project>);
  }

  /**
   * 檢查項目是否屬於指定用戶
   */
  isOwnedByUser(projectId: number, userId: number): boolean {
    const project = this.findById(projectId);
    return !!(project && project.user_id === userId);
  }

  /**
   * 獲取用戶的項目數量
   */
  countByUserId(userId: number): number {
    return this.count('user_id = ? AND deleted_at IS NULL', [userId]);
  }

  /**
   * 搜索項目（按名稱）
   */
  searchByName(userId: number, keyword: string): Project[] {
    return this.findByCondition(
      'user_id = ? AND deleted_at IS NULL AND name LIKE ?',
      [userId, `%${keyword}%`]
    );
  }

  /**
   * 獲取最近訪問的項目
   */
  findRecentProjects(userId: number, limit: number): Project[] {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT ?
    `;
    return this.executeRawQuery<Project>(sql, [userId, limit]);
  }

  /**
   * 查詢用戶可以存取的所有專案（擁有者或成員）
   */
  findAccessibleByUserIdWithPagination(
    userId: number,
    page: number,
    pageSize: number
  ): { list: Project[]; total: number; page: number; pageSize: number } {
    const offset = (page - 1) * pageSize;
    const sql = `
      SELECT DISTINCT p.* FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.user_id = ? OR pm.user_id = ?)
        AND p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `;
    const list = this.executeRawQuery<Project>(sql, [userId, userId, pageSize, offset]);
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as cnt FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.user_id = ? OR pm.user_id = ?)
        AND p.deleted_at IS NULL
    `;
    const countResult = this.executeRawQueryOne<{ cnt: number }>(countSql, [userId, userId]);
    const total = countResult ? countResult.cnt : 0;
    return { list, total, page, pageSize };
  }

  /**
   * 新增專案成員（被 @ 時自動加入）
   */
  addMember(projectId: number, userId: number, invitedBy: number): void {
    this.db.run(
      'INSERT OR IGNORE INTO project_members (project_id, user_id, invited_by) VALUES (?, ?, ?)',
      [projectId, userId, invitedBy]
    );
  }

  /**
   * 檢查用戶是否為專案擁有者或成員
   */
  isMemberOrOwner(projectId: number, userId: number): boolean {
    const project = this.findById(projectId);
    if (!project) return false;
    if ((project as any).user_id === userId) return true;
    const result = this.executeRawQueryOne<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return !!(result && result.cnt > 0);
  }
}

// 導出單例實例
export const projectRepository = new ProjectRepository();
