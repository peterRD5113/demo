// @ts-nocheck
/**
 * Authentication Service
 * Handles user authentication, login, and token management
 */

import jwt from 'jsonwebtoken';
import { userRepository } from '@main/repositories';
import type { User } from '@shared/types';
import {
  validateUsername,
  validatePassword,
  validatePositiveInteger
} from '@main/utils/validation';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'contract-risk-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh Token expires in 7 days

// Token Payload Interface
interface TokenPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

// Login Response Interface
interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: Omit<User, 'password_hash'>;
    token: string;
    refreshToken: string;
  };
}

class AuthService {
  /**
   * User login with failed attempt tracking
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      // Parameter validation
      validateUsername(username);
      validatePassword(password);

      // Find user by username
      const user = userRepository.findByUsername(username);
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Check if account is locked
      if (userRepository.isAccountLocked(user.id)) {
        return {
          success: false,
          message: 'Account is locked due to too many failed login attempts. Please try again in 10 minutes.'
        };
      }

      // Verify password - verifyPassword returns User | null
      const verifiedUser = userRepository.verifyPassword(username, password);
      
      if (!verifiedUser) {
        // Increment login attempts
        const attempts = userRepository.incrementLoginAttempts(user.id);
        
        // Lock account if attempts >= 5
        if (attempts >= 5) {
          userRepository.lockAccount(user.id, 600); // Lock for 10 minutes (600 seconds)
          return {
            success: false,
            message: 'Too many failed login attempts. Account locked for 10 minutes.'
          };
        }
        
        // Return remaining attempts
        const remainingAttempts = 5 - attempts;
        return {
          success: false,
          message: `Invalid username or password. ${remainingAttempts} attempt(s) remaining before account lock.`
        };
      }

      // Login successful - reset login attempts
      userRepository.resetLoginAttempts(verifiedUser.id);

      // Generate tokens
      const token = this.generateToken(verifiedUser);
      const refreshToken = this.generateRefreshToken(verifiedUser);

      // Update last login time
      userRepository.updateLastLogin(verifiedUser.id);

      // Return user info (without password)
      const userResponse = userRepository.getUserResponse(verifiedUser);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          refreshToken
        }
      };
    } catch (error) {
      console.error('Login failed:', error);
      
      // If validation error, return error message directly
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Login failed, please try again later'
      };
    }
  }

  /**
   * User logout
   */
  async logout(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(userId, 'User ID');

      // Here we can add token blacklist logic
      // For now, just return success
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Logout failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Verify token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      // Parameter validation
      if (!refreshToken || typeof refreshToken !== 'string') {
        return {
          success: false,
          message: 'Refresh token cannot be empty'
        };
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;
      
      // Get user info
      const user = userRepository.findById(decoded.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Use isAccountLocked() to dynamically check locked_until timestamp
      if (userRepository.isAccountLocked(user.id)) {
        return {
          success: false,
          message: 'Account is locked'
        };
      }

      // Generate new tokens
      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      const userResponse = userRepository.getUserResponse(user);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: userResponse,
          token: newToken,
          refreshToken: newRefreshToken
        }
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        message: 'Token refresh failed'
      };
    }
  }

  /**
   * Generate access token
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN
    });
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(userId, 'User ID');
      validatePassword(oldPassword);
      validatePassword(newPassword);

      // Get user
      const user = userRepository.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify old password
      const isValid = userRepository.verifyPassword(user.username, oldPassword);
      
      if (!isValid) {
        return {
          success: false,
          message: 'Old password is incorrect'
        };
      }

      // Update password
      userRepository.updatePassword(userId, newPassword);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Change password failed'
      };
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(userId: number): Promise<Omit<User, 'password_hash'> | null> {
    try {
      // Parameter validation
      validatePositiveInteger(userId, 'User ID');

      const user = userRepository.findById(userId);
      
      if (!user) {
        return null;
      }

      return userRepository.getUserResponse(user);
    } catch (error) {
      console.error('Get user info failed:', error);
      return null;
    }
  }
}

// Export singleton
export const authService = new AuthService();
