// @ts-nocheck
import { BaseRepository } from './BaseRepository';
import type { User, UserResponse } from '@shared/types';
import bcrypt from 'bcryptjs';

/**
 * User Repository
 * Handles user data access operations
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Find user by username
   */
  findByUsername(username: string): User | null {
    return this.findOneByCondition('username = ?', [username]);
  }

  /**
   * Create new user
   * @param username Username
   * @param password Plain password
   * @param role User role
   * @returns User ID
   */
  createUser(username: string, password: string, role: 'admin' | 'user' | 'viewer'): number {
    // Hash password using bcrypt
    const passwordHash = bcrypt.hashSync(password, 10);

    return this.insert({
      username,
      password_hash: passwordHash,
      role,
      login_attempts: 0,
      locked_until: null,
    } as Partial<User>);
  }

  /**
   * Verify user password
   * @param username Username
   * @param password Plain password
   * @returns User object if valid, null if invalid
   */
  verifyPassword(username: string, password: string): User | null {
    const user = this.findByUsername(username);
    if (!user) return null;

    // Verify password
    const isValid = bcrypt.compareSync(password, user.password_hash);
    return isValid ? user : null;
  }

  /**
   * Change password
   * @param userId User ID
   * @param newPassword New plain password
   */
  changePassword(userId: number, newPassword: string): void {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    this.update(userId, { password_hash: passwordHash } as Partial<User>);
  }

  /**
   * Increment login attempt count
   * @param userId User ID
   * @returns New attempt count
   */
  incrementLoginAttempts(userId: number): number {
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    const newAttempts = user.login_attempts + 1;
    this.update(userId, { login_attempts: newAttempts } as Partial<User>);
    return newAttempts;
  }

  /**
   * Reset login attempt count
   */
  resetLoginAttempts(userId: number): void {
    this.update(userId, { login_attempts: 0, locked_until: null } as Partial<User>);
  }

  /**
   * Lock user account
   * @param userId User ID
   * @param lockDurationSeconds Lock duration in seconds
   */
  lockAccount(userId: number, lockDurationSeconds: number): void {
    const lockedUntil = new Date(Date.now() + lockDurationSeconds * 1000).toISOString();
    this.update(userId, { locked_until: lockedUntil } as Partial<User>);
  }

  /**
   * Check if account is locked
   * @param userId User ID
   * @returns true if locked, false if not locked
   */
  isAccountLocked(userId: number): boolean {
    const user = this.findById(userId);
    if (!user || !user.locked_until) return false;

    const lockedUntil = new Date(user.locked_until);
    const now = new Date();

    // Auto-unlock if lock period has expired
    if (now > lockedUntil) {
      this.resetLoginAttempts(userId);
      return false;
    }

    return true;
  }

  /**
   * Get user response object (without password)
   */
  getUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
    };
  }

  /**
   * Find users by role
   */
  findByRole(role: 'admin' | 'user' | 'viewer'): User[] {
    return this.findByCondition('role = ?', [role]);
  }

  /**
   * Check if username exists
   */
  usernameExists(username: string): boolean {
    return this.existsByCondition('username = ?', [username]);
  }

  /**
   * Update user role
   */
  updateRole(userId: number, role: 'admin' | 'user' | 'viewer'): void {
    this.update(userId, { role } as Partial<User>);
  }

  /**
   * Get all users without password
   */
  getAllUsersWithoutPassword(): UserResponse[] {
    const users = this.findAll();
    return users.map((user) => this.getUserResponse(user));
  }

  /**
   * Find users with pagination (without password)
   */
  findUsersWithPagination(
    page: number,
    pageSize: number,
    role?: 'admin' | 'user' | 'viewer'
  ): {
    list: UserResponse[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const where = role ? 'role = ?' : undefined;
    const params = role ? [role] : undefined;

    const result = this.findWithPagination(page, pageSize, where, params);

    return {
      ...result,
      list: result.list.map((user) => this.getUserResponse(user)),
    };
  }
  
  /**
   * Update last login time
   */
  updateLastLogin(userId: number): void {
    const now = new Date().toISOString();
    this.update(userId, { last_login: now } as Partial<User>);
  }

  /**
   * Update password
   */
  updatePassword(userId: number, newPassword: string): void {
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    this.update(userId, { password_hash: passwordHash } as Partial<User>);
  }
}

// Export singleton instance
export const userRepository = new UserRepository();

