// @ts-nocheck
/**
 * Risk Identification Service
 * Handles risk rule matching, risk assessment, and management
 */

import { riskRuleRepository, riskMatchRepository, clauseRepository, projectRepository, documentRepository } from '@main/repositories';
import type { RiskMatch, RiskRule } from '@shared/types';
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
  risks?: RiskMatch[];
}

// Risk list response
interface RiskListResponse {
  risks: RiskMatch[];
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

      // Get document to check project permission
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // Check project permission
      const projectId = document.project_id;
      if (!projectRepository.isOwnedByUser(projectId, userId)) {
        return {
          success: false,
          message: 'No permission to access this document'
        };
      }

      // Get all clauses in document
      const clauses = clauseRepository.findByDocumentId(documentId);
      
      if (clauses.length === 0) {
        return {
          success: false,
          message: 'No clauses found in document, please extract clauses first'
        };
      }

      // Get all active risk rules
      const rules = riskRuleRepository.findEnabledRules();
      
      if (rules.length === 0) {
        return {
          success: false,
          message: 'No active risk rules available'
        };
      }

      // Perform risk identification on each clause
      let risksFound = 0;
      const identifiedRisks: RiskMatch[] = [];

      for (const clause of clauses) {
        for (const rule of rules) {
          // Check if rule has pattern
          if (!rule.pattern) {
            continue;
          }

          // Use regex for matching
          try {
            const regex = new RegExp(rule.pattern, 'i');
            
            if (regex.test(clause.content)) {
              // Create risk match record
              const matchId = riskMatchRepository.createMatch(
                clause.id,
                rule.id,
                rule.risk_level,
                clause.content.substring(0, 200), // Take first 200 chars as matched text
                rule.suggestion
              );

              risksFound++;

              // Get created match
              const match = riskMatchRepository.findById(matchId);
              if (match) {
                identifiedRisks.push(match);
              }
            }
          } catch (error) {
            console.error(`Invalid regex pattern for rule ${rule.id}:`, error);
            continue;
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
   * Get document risks
   */
  async getDocumentRisks(
    documentId: number,
    userId: number
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      // Get document to check permission
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          risks: [],
          total: 0
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const risks = riskMatchRepository.findByDocumentId(documentId);

      return {
        risks,
        total: risks.length
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
   * Get risks by level for a document
   */
  async getRisksByLevel(
    documentId: number,
    userId: number,
    level: 'high' | 'medium' | 'low'
  ): Promise<RiskListResponse> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');
      validateEnum(level, 'Risk level', RISK_LEVELS);

      // Get document to check permission
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return {
          risks: [],
          total: 0
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          risks: [],
          total: 0
        };
      }

      const risks = riskMatchRepository.findByRiskLevel(documentId, level);

      return {
        risks,
        total: risks.length
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
   * Adjust risk level
   */
  async adjustRiskLevel(
    matchId: number,
    userId: number,
    newLevel: 'high' | 'medium' | 'low'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(matchId, 'Match ID');
      validatePositiveInteger(userId, 'User ID');
      validateEnum(newLevel, 'Risk level', RISK_LEVELS);

      const match = riskMatchRepository.findById(matchId);
      
      if (!match) {
        return {
          success: false,
          message: 'Risk match not found'
        };
      }

      // Get clause to check permission
      const clause = clauseRepository.findById(match.clause_id);
      if (!clause) {
        return {
          success: false,
          message: 'Clause not found'
        };
      }

      // Get document to check permission
      const document = documentRepository.findById(clause.document_id);
      if (!document) {
        return {
          success: false,
          message: 'Document not found'
        };
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return {
          success: false,
          message: 'No permission to modify this risk'
        };
      }

      riskMatchRepository.adjustRiskLevel(matchId, newLevel);

      return {
        success: true,
        message: 'Risk level adjusted successfully'
      };
    } catch (error) {
      console.error('Adjust risk level failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Adjust risk level failed'
      };
    }
  }

  /**
   * Get document risk statistics
   */
  async getDocumentRiskStatistics(
    documentId: number,
    userId: number
  ): Promise<RiskStatistics | null> {
    try {
      // Parameter validation
      validatePositiveInteger(documentId, 'Document ID');
      validatePositiveInteger(userId, 'User ID');

      // Get document to check permission
      const document = documentRepository.findById(documentId);
      
      if (!document) {
        return null;
      }

      // Check project permission
      if (!projectRepository.isOwnedByUser(document.project_id, userId)) {
        return null;
      }

      const stats = riskMatchRepository.countByRiskLevel(documentId);
      
      const result: RiskStatistics = {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        byCategory: {}
      };

      for (const stat of stats) {
        result.total += stat.count;
        result[stat.risk_level] = stat.count;
      }

      return result;
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
      return riskRuleRepository.findAllParsed();
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
      return riskRuleRepository.findEnabledRules();
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
    description: string,
    keywords: string[],
    pattern: string,
    riskLevel: 'high' | 'medium' | 'low'
  ): Promise<{ success: boolean; message: string; ruleId?: number }> {
    try {
      // Parameter validation
      validateRequiredString(name, 'Rule name', 1, 100);
      validateRequiredString(description, 'Rule description', 1, 500);
      validateRegex(pattern, 'Matching pattern');
      validateEnum(riskLevel, 'Risk level', RISK_LEVELS);

      const ruleId = riskRuleRepository.createRule(
        name,
        description,
        keywords,
        riskLevel,
        pattern
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
      description?: string;
      keywords?: string[];
      pattern?: string;
      riskLevel?: 'high' | 'medium' | 'low';
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
      
      if (data.riskLevel !== undefined) {
        validateEnum(data.riskLevel, 'Risk level', RISK_LEVELS);
      }
      
      if (data.description !== undefined) {
        validateRequiredString(data.description, 'Rule description', 1, 500);
      }

      riskRuleRepository.updateRule(ruleId, data);

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
   * Toggle risk rule (enable/disable)
   */
  async toggleRule(
    ruleId: number,
    enabled: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parameter validation
      validatePositiveInteger(ruleId, 'Rule ID');

      riskRuleRepository.toggleRule(ruleId, enabled);

      return {
        success: true,
        message: `Risk rule ${enabled ? 'enabled' : 'disabled'} successfully`
      };
    } catch (error) {
      console.error('Toggle risk rule failed:', error);
      
      if (error instanceof Error && error.message) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Toggle risk rule failed'
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

      riskRuleRepository.softDelete(ruleId);

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
