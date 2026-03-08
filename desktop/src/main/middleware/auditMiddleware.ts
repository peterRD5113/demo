// @ts-nocheck
/**
 * 審�??��?中�?�?
 * 記�??�戶?��?作�???
 */

import type { IpcMainInvokeEvent } from 'electron';
import type { TokenPayload } from '@main/ipc/types';
import { getDb } from '../database/connection';

/**
 * 審�??��?類�?
 */
export enum AuditAction {
  // 認�??��?
  LOGIN = 'login',
  LOGOUT = 'logout',
  CHANGE_PASSWORD = 'change_password',

  // ?�目?��?
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',

  // ?��??��?
  CREATE_DOCUMENT = 'create_document',
  UPDATE_DOCUMENT = 'update_document',
  DELETE_DOCUMENT = 'delete_document',

  // 條款?��?
  CREATE_CLAUSE = 'create_clause',
  UPDATE_CLAUSE = 'update_clause',
  DELETE_CLAUSE = 'delete_clause',

  // 風險?��?
  IDENTIFY_RISK = 'identify_risk',
  UPDATE_RISK_STATUS = 'update_risk_status',
  CREATE_RISK_RULE = 'create_risk_rule',
  UPDATE_RISK_RULE = 'update_risk_rule',
  DELETE_RISK_RULE = 'delete_risk_rule'
}

/**
 * 記�?審�??��?
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
    const db = getDb();
    
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(userId, action, resourceType, resourceId, details, ipAddress);
  } catch (error) {
    console.error('記�?審�??��?失�?:', error);
  }
}

/**
 * 審�?中�?�?
 * 記�??�?��?�?
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
        // ?��??��??��???
        response = await handler(event, ...args);
      } catch (err) {
        error = err;
        throw err;
      } finally {
        // 記�?審�??��?
        try {
          const userId = currentUser?.userId || null;
          const resourceId = getResourceId ? getResourceId(request) : null;
          const details = getDetails ? getDetails(request, response) : null;
          const ipAddress = null; // Electron ?�用中無法獲??IP

          logAudit(userId, action, resourceType, resourceId, details, ipAddress);
        } catch (auditError) {
          console.error('審�??��?記�?失�?:', auditError);
        }
      }

      return response;
    };
  };
}

/**
 * 簡�??�審計中?�件
 * ?��??��?作�??��??�戶
 */
export function simpleAudit(action: AuditAction, resourceType: string) {
  return auditMiddleware(action, resourceType);
}

/**
 * 詳細審�?中�?�?
 * 記�?完整?��?作信??
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
 * ?��??��?審�?
 * 記�??��??��??�數??
 */
export function batchAudit(action: AuditAction, resourceType: string) {
  return auditMiddleware(
    action,
    resourceType,
    null,
    (request: any, response: any) => {
      if (response?.data?.items) {
        return `?��??��?: ${response.data.items.length} ?�`;
      }
      return null;
    }
  );
}

/**
 * ?��??��?審�?
 * 記�??��??��?（�??�除?�修?��?碼�?�?
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

