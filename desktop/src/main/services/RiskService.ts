// @ts-nocheck
/**
 * Risk Identification Service
 * Handles risk rule matching, risk assessment, and management
 */

import { riskRepository, clauseRepository, projectRepository } from '@main/repositories';
import type { Risk, RiskRule } from '@shared/types';
import {
  validateRequiredString,
  validateOptionalString,
  validatePositiveInteger,
  validatePagination,
  validateEnum,
  validateRegex
} from '@main/utils/validation';

// Risk identification result
interface RiskIdentificationResult {
  success: boolean;
  message: string;
  risksFound?: number;
  risks?: Risk[];
}

// Risk list response
interface RiskListResponse {
  risks: Risk[];
  total: number;
}

// Risk statistics
interface RiskStatistics {
  total: number;
  high: number;
  medium: number;
  low: number;
  byCategory: Record<string, number>;
}

// Risk level constants
const RISK_LEVELS = ['high', 'medium', 'low'] as const;
const RISK_STATUS = ['pending', 'reviewing', 'resolved', 'ignored'] as const;

class RiskService {
  /**
   * Identify risks in document
   * Iterate through all clauses and use risk rules for matching
   */
  async identifyRisks(
    documentId: number,
    userId: number
  ): Promise<RiskIdentificationResult> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      // Get all clauses in document
      const clauses = clauseRepository.findByDocumentId(documentId);
      
      if (clauses.length === 0) {
        return {
          success: false,
          message: 'No clauses found in document, please extract clauses first'
        };
      }

      // Check project permission
      const firstClause = clauses[0];
      if (!projectRepository.isOwnedByUser(firstClause.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to access this document'
        };
      }

      // Get all active risk rules
      const rules = riskRepository.findActiveRules();
      
      if (rules.length === 0) {
        return {
          success: false,
          message: 'No active risk rules available'
        };
      }

      // Perform risk identification on each clause
      let risksFound = 0;
      const identifiedRisks: Risk[] = [];

      for (const clause of clauses) {
        for (const rule of rules) {
          // Use regex for matching
          const regex = new RegExp(rule.pattern, 'i');
          
          if (regex.test(clause.content)) {
            // Create risk record
            const riskId = riskRepository.createRisk(
              clause.project_id,
              documentId,
              clause.id,
              rule.id,
              rule.risk_level,
              rule.category,
              rule.description,
              clause.content.substring(0, 200) // Take first 200 chars as context
            );

            risksFound++;

            // Get created risk
            const risk = riskRepository.findById(riskId);
            if (risk) {
              identifiedRisks.push(risk);
            }
          }
        }
      }

      return {
        success: true,
        message: `Risk identification completed, found ${risksFound} risks`,
        risksFound,
        risks: identifiedRisks
      };
    } catch (error) {
      console.error('Risk identification failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Risk identification failed'
      };
    }
  }

  /**
   * Get project risks
   */
  async getProjectRisks(
    projectId: number,
    userId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const risks = riskRepository.findByProjectId(projectId, page, pageSize);
      const total = riskRepository.countByProjectId(projectId);

      return {
        risks,
        total
      };
    } catch (error) {
      console.error('Get risks list failed:', error);
      return {
        risks: [],
        total: 0
      };
    }
  }

  /**
   * Get document risks
   */
  async getDocumentRisks(
    documentId: number,
    userId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');
      validatePagination(page, pageSize);

      const risks = riskRepository.findByDocumentId(documentId, page, pageSize);
      
      if (risks.length === 0) {
        return {
          risks: [],
          total: 0
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(risks[0].project_id, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const total = riskRepository.countByDocumentId(documentId);

      return {
        risks,
        total
      };
    } catch (error) {
      console.error('Get risks list failed:', error);
      return {
        risks: [],
        total: 0
      };
    }
  }

  /**
   * Get risks by level
   */
  async getRisksByLevel(
    projectId: number,
    userId: number,
    level: 'high' | 'medium' | 'low',
    page: number = 1,
    pageSize: number = 50
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validateEnum(level, 'Risk level', RISK_LEVELS);
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const risks = riskRepository.findByRiskLevel(projectId, level, page, pageSize);
      const total = riskRepository.countByProjectId(projectId);

      return {
        risks,
        total
      };
    } catch (error) {
      console.error('Get risks list failed:', error);
      return {
        risks: [],
        total: 0
      };
    }
  }

  /**
   * Get risks by category
   */
  async getRisksByCategory(
    projectId: number,
    userId: number,
    category: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');
      validateRequiredString(category, 'Risk category', 1, 50);
      validatePagination(page, pageSize);

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const risks = riskRepository.findByCategory(projectId, category, page, pageSize);
      const total = riskRepository.countByProjectId(projectId);

      return {
        risks,
        total
      };
    } catch (error) {
      console.error('Get risks list failed:', error);
      return {
        risks: [],
        total: 0
      };
    }
  }

  /**
   * Update risk status
   */
  async updateRiskStatus(
    riskId: number,
    userId: number,
    status: 'pending' | 'reviewing' | 'resolved' | 'ignored'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(riskId, 'Risk ID');
      validatePositiveInteger(userId, 'User ID');
      validateEnum(status, 'Risk status', RISK_STATUS);

      const risk = riskRepository.findById(riskId);
      
      if (!risk) {
        return {
          success: false,
          message: 'Risk not found'
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(risk.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to modify this risk'
        };
      }

      riskRepository.updateStatus(riskId, status);

      return {
        success: true,
        message: 'Risk status updated successfully'
      };
    } catch (error) {
      console.error('Update risk status failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update risk status failed'
      };
    }
  }

  /**
   * Get project risk statistics
   */
  async getProjectRiskStatistics(
    projectId: number,
    userId: number
  ): Promise<RiskStatistics | null> {
    try {
      // Parameter validation
      validatePositiveInteger(projectId, 'Project ID');
      validatePositiveInteger(userId, 'User ID');

      // Check project permission
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return null;
      }

      const stats = riskRepository.getProjectRiskStats(projectId);
      return stats;
    } catch (error) {
      console.error('Get risk statistics failed:', error);
      return null;
    }
  }

  /**
   * Get all risk rules
   */
  async getAllRules(): Promise<RiskRule[]> {
    try {
      return riskRepository.findAllRules();
    } catch (error) {
      console.error('Get risk rules failed:', error);
      return [];
    }
  }

  /**
   * Get active risk rules
   */
  async getActiveRules(): Promise<RiskRule[]> {
    try {
      return riskRepository.findActiveRules();
    } catch (error) {
      console.error('Get risk rules failed:', error);
      return [];
    }
  }

  /**
   * Create custom risk rule
   */
  async createRule(
    name: string,
    pattern: string,
    riskLevel: 'high' | 'medium' | 'low',
    category: string,
    description: string
  ): Promise<{ success: boolean; message: string; ruleId?: number }> {
    try {
      // Parameter validation
      validateRequiredString(name, 'Rule name', 1, 100);
      validateRegex(pattern, 'Matching pattern');
      validateEnum(riskLevel, 'Risk level', RISK_LEVELS);
      validateRequiredString(category, 'Risk category', 1, 50);
      validateRequiredString(description, 'Rule description', 1, 500);

      const ruleId = riskRepository.createRule(
        name,
        pattern,
        riskLevel,
        category,
        description
      );

      return {
        success: true,
        message: 'Risk rule created successfully',
        ruleId
      };
    } catch (error) {
      console.error('Create risk rule failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Create risk rule failed'
      };
    }
  }

  /**
   * Update risk rule
   */
  async updateRule(
    ruleId: number,
    data: {
      name?: string;
      pattern?: string;
      risk_level?: 'high' | 'medium' | 'low';
      category?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(ruleId, 'Rule ID');
      
      if (data.name !== undefined) {
        validateRequiredString(data.name, 'Rule name', 1, 100);
      }
      
      if (data.pattern !== undefined) {
        validateRegex(data.pattern, 'Matching pattern');
      }
      
      if (data.risk_level !== undefined) {
        validateEnum(data.risk_level, 'Risk level', RISK_LEVELS);
      }
      
      if (data.category !== undefined) {
        validateRequiredString(data.category, 'Risk category', 1, 50);
      }
      
      if (data.description !== undefined) {
        validateRequiredString(data.description, 'Rule description', 1, 500);
      }

      riskRepository.updateRule(ruleId, data);

      return {
        success: true,
        message: 'Risk rule updated successfully'
      };
    } catch (error) {
      console.error('Update risk rule failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Update risk rule failed'
      };
    }
  }

  /**
   * Delete risk rule (soft delete)
   */
  async deleteRule(ruleId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(ruleId, 'Rule ID');

      riskRepository.softDeleteRule(ruleId);

      return {
        success: true,
        message: 'Risk rule deleted successfully'
      };
    } catch (error) {
      console.error('Delete risk rule failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Delete risk rule failed'
      };
    }
  }
}

// Export singleton
export const riskService = new RiskService();
