/**
 * ???? IPC ???
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { projectService } from '../../services';
import { PROJECT_CHANNELS } from '../channels';
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  GetProjectRequest,
  ListProjectsRequest,
  DeleteProjectRequest,
  SearchProjectsRequest,
  VerifyProjectPasswordRequest,
  IPCResponse,
  IPCListResponse
} from '../types';
import type { Project } from '@shared/types';

class ProjectHandlers {
  /**
   * ????????? IPC ???
   */
  register(ipcMain: IpcMain): void {
    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.CREATE,
      async (_event: IpcMainInvokeEvent, request: CreateProjectRequest): Promise<IPCResponse<{ projectId: number }>> => {
        try {
          const result = await projectService.createProject({
            name: request.name,
            userId: request.userId,
            description: request.description,
            password: request.password
          });
          
          if (result.success && result.projectId) {
            return {
              success: true,
              message: '??????',
              data: { projectId: result.projectId }
            };
          }

          return {
            success: false,
            message: result.message || '??????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.GET,
      async (_event: IpcMainInvokeEvent, request: GetProjectRequest): Promise<IPCResponse<Project>> => {
        try {
          const project = await projectService.getProject(request.projectId, request.userId);
          
          if (project) {
            return {
              success: true,
              message: '??????',
              data: project
            };
          }

          return {
            success: false,
            message: '??????????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.LIST,
      async (_event: IpcMainInvokeEvent, request: ListProjectsRequest): Promise<IPCResponse<IPCListResponse<Project>>> => {
        try {
          const result = await projectService.getUserProjects(
            request.userId,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '????????',
            data: {
              items: result.projects,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 20
            }
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.UPDATE,
      async (_event: IpcMainInvokeEvent, request: UpdateProjectRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await projectService.updateProject(
            request.projectId,
            request.userId,
            {
              name: request.name,
              description: request.description,
              password: request.password
            }
          );
          
          if (result.success) {
            return {
              success: true,
              message: '??????'
            };
          }

          return {
            success: false,
            message: result.message || '??????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.DELETE,
      async (_event: IpcMainInvokeEvent, request: DeleteProjectRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await projectService.deleteProject(request.projectId, request.userId);
          
          if (result.success) {
            return {
              success: true,
              message: '??????'
            };
          }

          return {
            success: false,
            message: result.message || '??????'
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      PROJECT_CHANNELS.SEARCH,
      async (_event: IpcMainInvokeEvent, request: SearchProjectsRequest): Promise<IPCResponse<IPCListResponse<Project>>> => {
        try {
          const result = await projectService.searchProjects(
            request.userId,
            request.keyword,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '??????',
            data: {
              items: result.projects,
              total: result.total,
              page: request.page || 1,
              pageSize: request.pageSize || 20
            }
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );

    // ???????????????
    ipcMain.handle(
      PROJECT_CHANNELS.GET_STATS,
      async (_event: IpcMainInvokeEvent, projectId: number): Promise<IPCResponse<any>> => {
        try {
          // TODO: ????????
          return {
            success: true,
            message: '????????',
            data: {
              documentCount: 0,
              clauseCount: 0,
              riskCount: 0
            }
          };
        } catch (error) {
          console.error('????????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????????'
          };
        }
      }
    );

    // ??????
    ipcMain.handle(
      PROJECT_CHANNELS.VERIFY_PASSWORD,
      async (_event: IpcMainInvokeEvent, request: VerifyProjectPasswordRequest): Promise<IPCResponse<boolean>> => {
        try {
          const result = await projectService.verifyProjectPassword(
            request.projectId,
            request.userId,
            request.password
          );
          
          return {
            success: result.success,
            message: result.message,
            data: result.success
          };
        } catch (error) {
          console.error('??????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '??????'
          };
        }
      }
    );
  }
}

export const projectHandlers = new ProjectHandlers();
