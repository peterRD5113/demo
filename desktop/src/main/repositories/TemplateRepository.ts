import { BaseRepository } from './BaseRepository';
import type { ClauseTemplate } from '@shared/types';

/**
 * 條款模板 Repository
 */
export class TemplateRepository extends BaseRepository<ClauseTemplate> {
  constructor() {
    super('clause_templates');
  }

  /**
   * 依模板類型查詢
   */
  findByType(type: 'clause' | 'annotation'): ClauseTemplate[] {
    return this.findByCondition('template_type = ?', [type]);
  }

  /**
   * 依分類和類型查詢
   */
  findByCategory(category: string, type: 'clause' | 'annotation'): ClauseTemplate[] {
    return this.findByCondition('category = ? AND template_type = ?', [category, type]);
  }

  /**
   * 取得所有分類列表（依類型）
   */
  getCategoriesByType(type: 'clause' | 'annotation'): string[] {
    const sql = `SELECT DISTINCT category FROM clause_templates WHERE template_type = ? ORDER BY category ASC`;
    const results = this.executeRawQuery<{ category: string }>(sql, [type]);
    return results.map(r => r.category);
  }

  /**
   * 建立模板
   */
  createTemplate(
    name: string,
    category: string,
    content: string,
    templateType: 'clause' | 'annotation',
    createdBy: number,
    title?: string | null,
    description?: string | null
  ): number {
    return this.insert({
      name,
      category,
      title: title || null,
      content,
      template_type: templateType,
      description: description || null,
      created_by: createdBy,
    } as Partial<ClauseTemplate>);
  }
}

export const templateRepository = new TemplateRepository();

