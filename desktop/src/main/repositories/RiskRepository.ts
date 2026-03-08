// @ts-nocheck
import { BaseRepository } from './BaseRepository';
import type { RiskRule, RiskMatch, RiskLevel } from '@shared/types';

/**
 * ???? Repository
 * ?????????????
 */
export class RiskRuleRepository extends BaseRepository<RiskRule> {
  constructor() {
    super('risk_rules');
  }

  /**
   * ??????
   */
  createRule(
    name: string,
    description: string,
    keywords: string[],
    riskLevel: RiskLevel,
    pattern?: string
  ): number {
    return this.insert({
      name,
      description,
      keywords: JSON.stringify(keywords),
      pattern: pattern || null,
      risk_level: riskLevel,
      is_enabled: 1,
    } as Partial<RiskRule>);
  }

  /**
   * ?????????
   */
  findEnabledRules(): RiskRule[] {
    const rules = this.findByCondition('is_enabled = ?', [1]);
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * ??????????
   */
  findByRiskLevel(riskLevel: RiskLevel): RiskRule[] {
    const rules = this.findByCondition('risk_level = ? AND is_enabled = ?', [riskLevel, 1]);
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * ??/????
   */
  toggleRule(ruleId: number, enabled: boolean): void {
    this.update(ruleId, { is_enabled: enabled ? 1 : 0 } as Partial<RiskRule>);
  }

  /**
   * ????
   */
  updateRule(
    ruleId: number,
    data: {
      name?: string;
      description?: string;
      keywords?: string[];
      pattern?: string;
      riskLevel?: RiskLevel;
    }
  ): void {
    const updateData: Partial<RiskRule> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.keywords !== undefined) updateData.keywords = JSON.stringify(data.keywords);
    if (data.pattern !== undefined) updateData.pattern = data.pattern;
    if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;

    if (Object.keys(updateData).length > 0) {
      this.update(ruleId, updateData);
    }
  }

  /**
   * ?????? JSON ????????????????
   */
  private parseRule(rule: RiskRule): RiskRule {
    let keywords: string[];
    
    if (typeof rule.keywords === 'string') {
      // ????? JSON
      try {
        keywords = JSON.parse(rule.keywords);
      } catch (e) {
        // ???? JSON???????
        keywords = rule.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      }
    } else {
      keywords = rule.keywords;
    }
    
    return {
      ...rule,
      keywords
    };
  }

  /**
   * ?? ID ?????????
   */
  findByIdParsed(id: number): RiskRule | null {
    const rule = this.findById(id);
    return rule ? this.parseRule(rule) : null;
  }

  /**
   * ???????????
   */
  findAllParsed(): RiskRule[] {
    const rules = this.findAll();
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * ????????????
   */
  countByRiskLevel(): { risk_level: RiskLevel; count: number }[] {
    const sql = `
      SELECT risk_level, COUNT(*) as count
      FROM ${this.tableName}
      WHERE is_enabled = 1
      GROUP BY risk_level
    `;
    return this.executeRawQuery<{ risk_level: RiskLevel; count: number }>(sql);
  }
}

/**
 * ???? Repository
 * ?????????????
 */
export class RiskMatchRepository extends BaseRepository<RiskMatch> {
  constructor() {
    super('risk_matches');
  }

  /**
   * ????????
   */
  createMatch(
    clauseId: number,
    ruleId: number,
    riskLevel: RiskLevel,
    matchedText: string,
    suggestion: string
  ): number {
    return this.insert({
      clause_id: clauseId,
      rule_id: ruleId,
      risk_level: riskLevel,
      matched_text: matchedText,
      suggestion,
      user_adjusted_level: null,
    } as Partial<RiskMatch>);
  }

  /**
   * ???? ID ??????
   */
  findByClauseId(clauseId: number): RiskMatch[] {
    return this.findByCondition('clause_id = ?', [clauseId]);
  }

  /**
   * ???? ID ????????
   */
  findByDocumentId(documentId: number): RiskMatch[] {
    const sql = `
      SELECT rm.*
      FROM ${this.tableName} rm
      INNER JOIN clauses c ON rm.clause_id = c.id
      WHERE c.document_id = ?
      ORDER BY 
        CASE rm.risk_level
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        c.order_index ASC
    `;
    return this.executeRawQuery<RiskMatch>(sql, [documentId]);
  }

  /**
   * ??????????
   */
  findByRiskLevel(documentId: number, riskLevel: RiskLevel): RiskMatch[] {
    const sql = `
      SELECT rm.*
      FROM ${this.tableName} rm
      INNER JOIN clauses c ON rm.clause_id = c.id
      WHERE c.document_id = ? AND rm.risk_level = ?
      ORDER BY c.order_index ASC
    `;
    return this.executeRawQuery<RiskMatch>(sql, [documentId, riskLevel]);
  }

  /**
   * ????????
   */
  adjustRiskLevel(matchId: number, newLevel: RiskLevel): void {
    this.update(matchId, { user_adjusted_level: newLevel } as Partial<RiskMatch>);
  }

  /**
   * ???????????
   */
  deleteByClauseId(clauseId: number): number {
    return this.deleteByCondition('clause_id = ?', [clauseId]);
  }

  /**
   * ???????????
   */
  deleteByDocumentId(documentId: number): number {
    const sql = `
      DELETE FROM ${this.tableName}
      WHERE clause_id IN (
        SELECT id FROM clauses WHERE document_id = ?
      )
    `;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(documentId);
    return result.changes;
  }

  /**
   * ??????????????
   */
  countByRiskLevel(documentId: number): { risk_level: RiskLevel; count: number }[] {
    const sql = `
      SELECT rm.risk_level, COUNT(*) as count
      FROM ${this.tableName} rm
      INNER JOIN clauses c ON rm.clause_id = c.id
      WHERE c.document_id = ?
      GROUP BY rm.risk_level
    `;
    return this.executeRawQuery<{ risk_level: RiskLevel; count: number }>(sql, [documentId]);
  }

  /**
   * ????????????
   */
  countHighRiskClauses(documentId: number): number {
    const sql = `
      SELECT COUNT(DISTINCT rm.clause_id) as count
      FROM ${this.tableName} rm
      INNER JOIN clauses c ON rm.clause_id = c.id
      WHERE c.document_id = ? AND rm.risk_level = 'high'
    `;
    const result = this.executeRawQueryOne<{ count: number }>(sql, [documentId]);
    return result?.count || 0;
  }

  /**
   * ???????????
   */
  getHighestRiskLevel(clauseId: number): RiskLevel | null {
    const sql = `
      SELECT risk_level
      FROM ${this.tableName}
      WHERE clause_id = ?
      ORDER BY 
        CASE risk_level
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END
      LIMIT 1
    `;
    const result = this.executeRawQueryOne<{ risk_level: RiskLevel }>(sql, [clauseId]);
    return result?.risk_level || null;
  }

  /**
   * ????????
   */
  batchCreateMatches(
    matches: Array<{
      clauseId: number;
      ruleId: number;
      riskLevel: RiskLevel;
      matchedText: string;
      suggestion: string;
    }>
  ): number {
    const data = matches.map((match) => ({
      clause_id: match.clauseId,
      rule_id: match.ruleId,
      risk_level: match.riskLevel,
      matched_text: match.matchedText,
      suggestion: match.suggestion,
      user_adjusted_level: null,
    }));

    return this.batchInsert(data as Partial<RiskMatch>[]);
  }
}

// ??????
export const riskRuleRepository = new RiskRuleRepository();
export const riskMatchRepository = new RiskMatchRepository();
