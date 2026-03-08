/**
 * ???? IPC ???
 */

import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import { authService } from '../../services';
import { AUTH_CHANNELS } from '../channels';
import type {
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  VerifyTokenRequest,
  IPCResponse,
  LoginResponse,
  TokenPayload
} from '../types';

class AuthHandlers {
  /**
   * ????????? IPC ???
   */
  register(ipcMain: IpcMain): void {
    // ??
    ipcMain.handle(
      AUTH_CHANNELS.LOGIN,
      async (_event: IpcMainInvokeEvent, request: LoginRequest): Promise<IPCResponse<LoginResponse>> => {
        try {
          const result = await authService.login(request.username, request.password);
          
          if (result.success && result.data) {
            return {
              success: true,
              message: '????',
              data: result.data
            };
          }

          return {
            success: false,
            message: result.message || '????'
          };
        } catch (error) {
          console.error('????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????'
          };
        }
      }
    );

    // ??
    ipcMain.handle(
      AUTH_CHANNELS.LOGOUT,
      async (_event: IpcMainInvokeEvent): Promise<IPCResponse<void>> => {
        try {
          // ??????
          return {
            success: true,
            message: '????'
          };
        } catch (error) {
          console.error('????:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : '????'
          };
        }
      }
    );

    // ????
    ipcMain.handle(
      AUTH_CHANNELS.REFRESH_TOKEN,
      async (_event: IpcMainInvokeEvent, request: RefreshTokenRequest): Promise<IPCResponse<{ token: string }>> => {
        try {
          const result = await authService.refreshToken(request.refreshToken);
          
          if (result.success && result.data) {
            return {
              success: true,
              message: '??????',
              data: { token: result.data.token }
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
      AUTH_CHANNELS.CHANGE_PASSWORD,
      async (_event: IpcMainInvokeEvent, request: ChangePasswordRequest): Promise<IPCResponse<void>> => {
        try {
          const result = await authService.changePassword(
            request.userId,
            request.oldPassword,
            request.newPassword
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

    // ????????
    ipcMain.handle(
      AUTH_CHANNELS.GET_CURRENT_USER,
      async (_event: IpcMainInvokeEvent, userId: number): Promise<IPCResponse<any>> => {
        try {
          const userInfo = await authService.getCurrentUser(userId);
          
          if (userInfo) {
            return {
              success: true,
              message: '????????',
              data: userInfo
            };
          }

          return {
            success: false,
            message: '?????'
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
      AUTH_CHANNELS.VERIFY_TOKEN,
      async (_event: IpcMainInvokeEvent, request: VerifyTokenRequest): Promise<IPCResponse<TokenPayload>> => {
        try {
          const payload = authService.verifyToken(request.token);
          
          if (payload) {
            return {
              success: true,
              message: '??????',
              data: payload
            };
          }

          return {
            success: false,
            message: '??????'
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

export const authHandlers = new AuthHandlers();
