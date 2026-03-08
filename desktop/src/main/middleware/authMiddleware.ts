/**
 * ?????
 * ???????????
 */

import { authService } from '../services';
import type { TokenPayload } from '../ipc/types';

/**
 * ???????
 * @param token JWT ??
 * @returns ????? null
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = authService.verifyToken(token);
    return payload;
  } catch (error) {
    console.error('??????:', error);
    return null;
  }
}

/**
 * ?????????????
 * @param userId ?? ID
 * @param resourceOwnerId ????? ID
 * @param userRole ????
 * @returns ?????
 */
export function checkPermission(
  userId: number,
  resourceOwnerId: number,
  userRole: 'admin' | 'user'
): boolean {
  // ???????????
  if (userRole === 'admin') {
    return true;
  }
  
  // ?????????????
  return userId === resourceOwnerId;
}

/**
 * ??????????
 * @param userRole ????
 * @returns ??????
 */
export function isAdmin(userRole: 'admin' | 'user'): boolean {
  return userRole === 'admin';
}

/**
 * ???????????
 * @param token JWT ??
 * @param resourceOwnerId ????? ID????
 * @returns ????? null
 */
export async function authenticate(
  token: string,
  resourceOwnerId?: number
): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  // ?????????? ID?????
  if (resourceOwnerId !== undefined) {
    const hasPermission = checkPermission(
      payload.userId,
      resourceOwnerId,
      payload.role
    );
    
    if (!hasPermission) {
      return null;
    }
  }
  
  return payload;
}

/**
 * ???????
 * @param token JWT ??
 * @returns ????? null
 */
export async function authenticateAdmin(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  if (!isAdmin(payload.role)) {
    return null;
  }
  
  return payload;
}
