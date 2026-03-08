// @ts-nocheck
/**
 * å¯©è??¥è?ä¸­é?ä»?
 * è¨˜é??¨æˆ¶?„æ?ä½œè???
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { TokenPayload } from '@main/ipc/types';
import { dbConnection } from '@main/database/connection';

/**
 * å¯©è??¥è?é¡žå?
 */
export enum AuditAction {
  // èªè??¸é?
  LOGIN = 'login',
  LOGOUT = 'logout',
  CHANGE_PASSWORD = 'change_password',

  // ?…ç›®?¸é?
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',

  // ?‡æ??¸é?
  CREATE_DOCUMENT = 'create_document',
  UPDATE_DOCUMENT = 'update_document',
  DELETE_DOCUMENT = 'delete_document',

  // æ¢æ¬¾?¸é?
  CREATE_CLAUSE = 'create_clause',
  UPDATE_CLAUSE = 'update_clause',
  DELETE_CLAUSE = 'delete_clause',

  // é¢¨éšª?¸é?
  IDENTIFY_RISK = 'identify_risk',
  UPDATE_RISK_STATUS = 'update_risk_status',
  CREATE_RISK_RULE = 'create_risk_rule',
  UPDATE_RISK_RULE = 'update_risk_rule',
  DELETE_RISK_RULE = 'delete_risk_rule'
}

/**
 * è¨˜é?å¯©è??¥è?
 */
function logAudit(
  userId: number | null,
  action: AuditAction,
  resourceType: string,
  resourceId: number | null,
  details: string | null,
  ipAddress: string | null
): void {
  try {
    const db = dbConnection.getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, action, resourceType, resourceId, details, ipAddress);
  } catch (error) {
    console.error('è¨˜é?å¯©è??¥è?å¤±æ?:', error);
  }
}

/**
 * å¯©è?ä¸­é?ä»?
 * è¨˜é??€?‰æ?ä½?
 */
export function auditMiddleware(
  action: AuditAction,
  resourceType: string,
  getResourceId?: (request: any) => number | null,
  getDetails?: (request: any, response: any) => string | null
) {
  return function (
    handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>
  ) {
    return async (event: IpcMainInvokeEvent, ...args: any[]): Promise<any> => {
      const request = args[0];
      const currentUser: TokenPayload | null = request?.currentUser;
      
      let response: any;
      let error: any = null;

      try {
        // ?·è??Ÿå??•ç???
        response = await handler(event, ...args);
      } catch (err) {
        error = err;
        throw err;
      } finally {
        // è¨˜é?å¯©è??¥è?
        try {
          const userId = currentUser?.userId || null;
          const resourceId = getResourceId ? getResourceId(request) : null;
          const details = getDetails ? getDetails(request, response) : null;
          const ipAddress = null; // Electron ?‰ç”¨ä¸­ç„¡æ³•ç²??IP

          logAudit(userId, action, resourceType, resourceId, details, ipAddress);
        } catch (auditError) {
          console.error('å¯©è??¥è?è¨˜é?å¤±æ?:', auditError);
        }
      }

      return response;
    };
  };
}

/**
 * ç°¡å??„å¯©è¨ˆä¸­?“ä»¶
 * ?ªè??„æ?ä½œé??‹å??¨æˆ¶
 */
export function simpleAudit(action: AuditAction, resourceType: string) {
  return auditMiddleware(action, resourceType);
}

/**
 * è©³ç´°å¯©è?ä¸­é?ä»?
 * è¨˜é?å®Œæ•´?„æ?ä½œä¿¡??
 */
export function detailedAudit(
  action: AuditAction,
  resourceType: string,
  getResourceId: (request: any) => number | null,
  getDetails: (request: any, response: any) => string | null
) {
  return auditMiddleware(action, resourceType, getResourceId, getDetails);
}

/**
 * ?¹é??ä?å¯©è?
 * è¨˜é??¹é??ä??„æ•¸??
 */
export function batchAudit(action: AuditAction, resourceType: string) {
  return auditMiddleware(
    action,
    resourceType,
    null,
    (request: any, response: any) => {
      if (response?.data?.items) {
        return `?¹é??ä?: ${response.data.items.length} ?…`;
      }
      return null;
    }
  );
}

/**
 * ?æ??ä?å¯©è?
 * è¨˜é??æ??ä?ï¼ˆå??ªé™¤?ä¿®?¹å?ç¢¼ç?ï¼?
 */
export function sensitiveAudit(
  action: AuditAction,
  resourceType: string,
  getResourceId: (request: any) => number | null
) {
  return auditMiddleware(
    action,
    resourceType,
    getResourceId,
    (request: any, response: any) => {
      return JSON.stringify({
        success: response?.success,
        timestamp: new Date().toISOString()
      });
    }
  );
}
