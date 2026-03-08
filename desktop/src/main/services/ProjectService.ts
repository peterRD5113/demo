/**
 * ????
 * ????? CRUD ???????
 */

import { projectRepository } from '@main/repositories';
import type { Project } from '@shared/types';
import {
  validateRequiredString,
  validateOptionalString,
  validatePositiveInteger,
  validatePagination
} from '@main/utils/validation';

// ??????
interface CreateProjectRequest {
  name: string;
  description?: string;
  userId: number;
  password?: string;
}

// ??????
interface UpdateProjectRequest {
  name?: string;
  description?: string;
  password?: string;
}

// ??????
interface ProjectListResponse {
  projects: Project[];
  total: number;
}

class ProjectService {
  /**
   * ????
   */
  async createProject(data: CreateProjectRequest): Promise<{ success: boolean; message: string; projectId?: number }> {
    try {
      // ????
      validateRequiredString(data.name, 'Project Name', 1, 100);
      validateOptionalString(data.description, 'Project Description', 500);
      validatePositiveInteger(data.userId, 'User ID');
      
      if (data.password) {
        validateOptionalString(data.password, 'Project Password', 50);
      }

      const projectId = projectRepository.createProject(
        data.name,
        data.userId,
        data.description,
        data.password
      );

      return {
        success: true,
        message: 'Project created successfully',
        projectId
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Failed to create project'
      };
    }
  }

  /**
   * ??????
   */
  async getProject(projectId: number, userId: number): Promise<Project | null> {
    try {
      // ????
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');

      // ????
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        console.error('No permission to access this project');
        return null;
      }

      return projectRepository.findById(projectId);
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  /**
   * ?????????
   */
  async getUserProjects(
    userId: number,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProjectListResponse> {
    try {
      // ????
      validatePositiveInteger(userId, 'User ID');
      validatePagination(page, pageSize);

      const result = projectRepository.findByUserIdWithPagination(userId, page, pageSize);

      return {
        projects: result.list,
        total: result.total
      };
    } catch (error) {
      console.error('Failed to get user projects:', error);
      return {
        projects: [],
        total: 0
      };
    }
  }

  /**
   * ????
   */
  async updateProject(
    projectId: number,
    userId: number,
    data: UpdateProjectRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ????
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      
      if (data.name !== undefined) {
        validateRequiredString(data.name, 'Project Name', 1, 100);
      }
      
      if (data.description !== undefined) {
        validateOptionalString(data.description, 'Project Description', 500);
      }
      
      if (data.password !== undefined) {
        validateOptionalString(data.password, 'Project Password', 50);
      }

      // ????
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          success: false,
          message: 'No permission to modify this project'
        };
      }

      // ???????? Repository API
      projectRepository.updateProject(projectId, data.name, data.description);
      
      // ?????????????
      if (data.password !== undefined) {
        projectRepository.setPassword(projectId, data.password);
      }

      return {
        success: true,
        message: 'Project updated successfully'
      };
    } catch (error) {
      console.error('Failed to update project:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Failed to update project'
      };
    }
  }

  /**
   * ?????????
   */
  async deleteProject(
    projectId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ????
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');

      // ????
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          success: false,
          message: 'No permission to delete this project'
        };
      }

      projectRepository.softDelete(projectId);

      return {
        success: true,
        message: 'Project deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete project:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Failed to delete project'
      };
    }
  }

  /**
   * ??????
   */
  async verifyProjectPassword(
    projectId: number,
    userId: number,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // ????
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(password, 'Password', 1, 50);

      // ????
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          success: false,
          message: 'No permission to access this project'
        };
      }

      const isValid = projectRepository.verifyPassword(projectId, password);

      if (!isValid) {
        return {
          success: false,
          message: 'Incorrect password'
        };
      }

      return {
        success: true,
        message: 'Password verified successfully'
      };
    } catch (error) {
      console.error('Failed to verify project password:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Verification failed'
      };
    }
  }

  /**
   * ????
   */
  async searchProjects(
    userId: number,
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ProjectListResponse> {
    try {
      // ????
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(keyword, 'Search Keyword', 1, 100);
      validatePagination(page, pageSize);

      // ???searchByName ???????
      const allProjects = projectRepository.searchByName(userId, keyword);
      
      // ??????
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const projects = allProjects.slice(startIndex, endIndex);

      return {
        projects,
        total: allProjects.length
      };
    } catch (error) {
      console.error('Failed to search projects:', error);
      return {
        projects: [],
        total: 0
      };
    }
  }
}

// ????
export const projectService = new ProjectService();
