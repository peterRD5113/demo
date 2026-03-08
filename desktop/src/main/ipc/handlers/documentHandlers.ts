/**
 * ???? IPC ???
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { documentService } from '../../services';
import { DOCUMENT_CHANNELS } from '../channels';
import type {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  GetDocumentRequest,
  ListDocumentsRequest,
  DeleteDocumentRequest,
  SearchDocumentsRequest,
  GetDocumentsByStatusRequest,
  UpdateDocumentStatusRequest,
  IPCResponse,
  IPCListResponse
} from '../types';
import type { Document } from '@shared/types';

class DocumentHandlers {
  /**
   * ????????? IPC ???
   */
  register(ipcMain: IpcMain): void {
    // ????
    ipcMain.handle(
      DOCUMENT_CHANNELS.CREATE,
      async (_event: IpcMainInvokeEvent, request: CreateDocumentRequest): Promise<IPCResponse<{ documentId: number }>> => {
        try {
          const result = await documentService.createDocument({
            projectId: request.projectId,
            userId: request.userId,
            name: request.name,
            filePath: request.filePath,
            fileType: request.fileType
          });
          
          if (result.success && result.documentId) {
            return {
              success: true,
              message: '??????',
              data: { documentId: result.documentId }
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
      DOCUMENT_CHANNELS.GET,
      async (_event: IpcMainInvokeEvent, request: GetDocumentRequest): Promise<IPCResponse<Document>> => {
        try {
          const document = await documentService.getDocument(request.documentId, request.userId);
          
          if (document) {
            return {
              success: true,
              message: '??????',
              data: document
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
      DOCUMENT_CHANNELS.LIST,
      async (_event: IpcMainInvokeEvent, request: ListDocumentsRequest): Promise<IPCResponse<IPCListResponse<Document>>> => {
        try {
          const result = await documentService.getProjectDocuments(
            request.projectId,
            request.userId,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '????????',
            data: {
              items: result.documents,
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
      DOCUMENT_CHANNELS.UPDATE,
      async (_event: IpcMainInvokeEvent, request: UpdateDocumentRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await documentService.updateDocument(
            request.documentId,
            request.userId,
            { name: request.name, status: request.status }
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
      DOCUMENT_CHANNELS.DELETE,
      async (_event: IpcMainInvokeEvent, request: DeleteDocumentRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await documentService.deleteDocument(request.documentId, request.userId);
          
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
      DOCUMENT_CHANNELS.SEARCH,
      async (_event: IpcMainInvokeEvent, request: SearchDocumentsRequest): Promise<IPCResponse<IPCListResponse<Document>>> => {
        try {
          const result = await documentService.searchDocuments(
            request.projectId,
            request.userId,
            request.keyword,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '??????',
            data: {
              items: result.documents,
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

    // ???????
    ipcMain.handle(
      DOCUMENT_CHANNELS.GET_BY_STATUS,
      async (_event: IpcMainInvokeEvent, request: GetDocumentsByStatusRequest): Promise<IPCResponse<IPCListResponse<Document>>> => {
        try {
          const result = await documentService.getDocumentsByStatus(
            request.projectId,
            request.userId,
            request.status,
            request.page,
            request.pageSize
          );
          
          return {
            success: true,
            message: '??????',
            data: {
              items: result.documents,
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

    // ??????
    ipcMain.handle(
      DOCUMENT_CHANNELS.UPDATE_STATUS,
      async (_event: IpcMainInvokeEvent, request: UpdateDocumentStatusRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await documentService.updateDocumentStatus(
            request.documentId,
            request.status,
            request.errorMessage
          );
          
          if (result.success) {
            return {
              success: true,
              message: '????????'
            };
          }

          return {
            success: false,
            message: result.message || '????????'
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

    // ????????
    ipcMain.handle(
      DOCUMENT_CHANNELS.GET_FILE_PATH,
      async (_event: IpcMainInvokeEvent, documentId: number, userId: number): Promise<IPCResponse<string>> => {
        try {
          const filePath = await documentService.getDocumentFilePath(documentId, userId);
          
          if (filePath) {
            return {
              success: true,
              message: '????????',
              data: filePath
            };
          }

          return {
            success: false,
            message: '????????'
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
  }
}

export const documentHandlers = new DocumentHandlers();
