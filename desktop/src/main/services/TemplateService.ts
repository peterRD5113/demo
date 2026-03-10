import { templateRepository } from '@main/repositories';
import type { ClauseTemplate } from '@shared/types';

class TemplateService {
  /**
   * 取得模板列表（可依類型篩選）
   */
  async getTemplates(type?: 'clause' | 'annotation'): Promise<{ templates: ClauseTemplate[]; total: number }> {
    try {
      const templates = type
        ? templateRepository.findByType(type)
        : templateRepository.findAll();
      return { templates, total: templates.length };
    } catch (error) {
      console.error('getTemplates failed:', error);
      return { templates: [], total: 0 };
    }
  }

  /**
   * 建立模板
   */
  async createTemplate(
    name: string,
    category: string,
    content: string,
    templateType: 'clause' | 'annotation',
    userId: number,
    title?: string | null,
    description?: string | null
  ): Promise<{ success: boolean; message: string; templateId?: number }> {
    try {
      if (!name || !name.trim()) return { success: false, message: '模板名稱不能為空' };
      if (!category || !category.trim()) return { success: false, message: '模板分類不能為空' };
      if (!content || !content.trim()) return { success: false, message: '模板內容不能為空' };
      if (templateType === 'clause' && (!title || !title.trim())) {
        return { success: false, message: '條款模板標題不能為空' };
      }

      const templateId = templateRepository.createTemplate(
        name.trim(),
        category.trim(),
        content.trim(),
        templateType,
        userId,
        title ? title.trim() : null,
        description ? description.trim() : null
      );

      return { success: true, message: '模板建立成功', templateId };
    } catch (error) {
      console.error('createTemplate failed:', error);
      return { success: false, message: error instanceof Error ? error.message : '建立模板失敗' };
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    templateId: number,
    userId: number,
    data: {
      name?: string;
      category?: string;
      title?: string | null;
      content?: string;
      description?: string | null;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existing = templateRepository.findById(templateId);
      if (!existing) return { success: false, message: '模板不存在' };

      const updateData: Partial<ClauseTemplate> = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.category !== undefined) updateData.category = data.category.trim();
      if (data.title !== undefined) updateData.title = data.title ? data.title.trim() : null;
      if (data.content !== undefined) updateData.content = data.content.trim();
      if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;

      templateRepository.update(templateId, updateData);
      return { success: true, message: '模板更新成功' };
    } catch (error) {
      console.error('updateTemplate failed:', error);
      return { success: false, message: error instanceof Error ? error.message : '更新模板失敗' };
    }
  }

  /**
   * 刪除模板
   */
  async deleteTemplate(
    templateId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const existing = templateRepository.findById(templateId);
      if (!existing) return { success: false, message: '模板不存在' };

      templateRepository.delete(templateId);
      return { success: true, message: '模板刪除成功' };
    } catch (error) {
      console.error('deleteTemplate failed:', error);
      return { success: false, message: error instanceof Error ? error.message : '刪除模板失敗' };
    }
  }
}

export const templateService = new TemplateService();

