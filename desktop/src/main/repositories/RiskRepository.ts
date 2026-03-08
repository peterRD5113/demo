// @ts-nocheck
import { BaseRepository } from './BaseRepository';
import type { RiskRule, RiskMatch, RiskLevel } from '@shared/types';

/**
 * é¢¨éšªè¦å? Repository
 * ?•ç?é¢¨éšªè¦å??¸é??„æ•¸?šè¨ª??
 */
export class RiskRuleRepository extends BaseRepository<RiskRule> {
  constructor() {
    super('risk_rules');
  }

  /**
   * ?µå»ºé¢¨éšªè¦å?
   */
  createRule(
    name: string,
    description: string,
    keywords: string[],
    riskLevel: RiskLevel,
    suggestion: string,
    pattern?: string
  ): number {
    return this.insert({
      name,
      description,
      keywords: JSON.stringify(keywords),
      pattern: pattern || null,
      risk_level: riskLevel,
      suggestion,
      enabled: 1,
    } as Partial<RiskRule>);
  }

  /**
   * ?²å??€?‰å??¨ç?è¦å?
   */
  findEnabledRules(): RiskRule[] {
    const rules = this.findByCondition('enabled = ?', [1]);
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * ?¹æ?é¢¨éšªç­‰ç??¥è©¢è¦å?
   */
  findByRiskLevel(riskLevel: RiskLevel): RiskRule[] {
    const rules = this.findByCondition('risk_level = ? AND enabled = ?', [riskLevel, 1]);
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * ?Ÿç”¨/ç¦ç”¨è¦å?
   */
  toggleRule(ruleId: number, enabled: boolean): void {
    this.update(ruleId, { enabled: enabled ? 1 : 0 } as Partial<RiskRule>);
  }

  /**
   * ?´æ–°è¦å?
   */
  updateRule(
    ruleId: number,
    data: {
      name?: string;
      description?: string;
      keywords?: string[];
      pattern?: string;
      riskLevel?: RiskLevel;
      suggestion?: string;
    }
  ): void {
    const updateData: Partial<RiskRule> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.keywords !== undefined) updateData.keywords = JSON.stringify(data.keywords);
    if (data.pattern !== undefined) updateData.pattern = data.pattern;
    if (data.riskLevel !== undefined) updateData.risk_level = data.riskLevel;
    if (data.suggestion !== undefined) updateData.suggestion = data.suggestion;

    if (Object.keys(updateData).length > 0) {
      this.update(ruleId, updateData);
    }
  }

  /**
   * è§??è¦å?ï¼ˆå? JSON å­—ç¬¦ä¸²è??ºæ•¸çµ„ï?
   */
  private parseRule(rule: RiskRule): RiskRule {
    return {
      ...rule,
      keywords: typeof rule.keywords === 'string' ? JSON.parse(rule.keywords) : rule.keywords,
    };
  }

  /**
   * ?¹æ? ID ?¥è©¢è¦å?ï¼ˆè§£?å?ï¼?
   */
  findByIdParsed(id: number): RiskRule | null {
    const rule = this.findById(id);
    return rule ? this.parseRule(rule) : null;
  }

  /**
   * ?²å??€?‰è??‡ï?è§??å¾Œï?
   */
  findAllParsed(): RiskRule[] {
    const rules = this.findAll();
    return rules.map((rule) => this.parseRule(rule));
  }

  /**
   * çµ±è??„é¢¨?ªç?ç´šç?è¦å??¸é?
   */
  countByRiskLevel(): { risk_level: RiskLevel; count: number }[] {
    const sql = `
      SELECT risk_level, COUNT(*) as count
      FROM ${this.tableName}
      WHERE enabled = 1
      GROUP BY risk_level
    `;
    return this.executeRawQuery<{ risk_level: RiskLevel; count: number }>(sql);
  }
}

/**
 * é¢¨éšª?¹é? Repository
 * ?•ç?é¢¨éšª?¹é?è¨˜é??„æ•¸?šè¨ª??
 */
export class RiskMatchRepository extends BaseRepository<RiskMatch> {
  constructor() {
    super('risk_matches');
  }

  /**
   * ?µå»ºé¢¨éšª?¹é?è¨˜é?
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
   * ?¹æ?æ¢æ¬¾ ID ?¥è©¢é¢¨éšª?¹é?
   */
  findByClauseId(clauseId: number): RiskMatch[] {
    return this.findByCondition('clause_id = ?', [clauseId]);
  }

  /**
   * ?¹æ??‡æ? ID ?¥è©¢?€?‰é¢¨?ªåŒ¹??
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
   * ?¹æ?é¢¨éšªç­‰ç??¥è©¢?¹é?
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
   * ?¨æˆ¶èª¿æ•´é¢¨éšªç­‰ç?
   */
  adjustRiskLevel(matchId: number, newLevel: RiskLevel): void {
    this.update(matchId, { user_adjusted_level: newLevel } as Partial<RiskMatch>);
  }

  /**
   * ?ªé™¤æ¢æ¬¾?„æ??‰é¢¨?ªåŒ¹??
   */
  deleteByClauseId(clauseId: number): number {
    return this.deleteByCondition('clause_id = ?', [clauseId]);
  }

  /**
   * ?ªé™¤?‡æ??„æ??‰é¢¨?ªåŒ¹??
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
   * çµ±è??‡æ??„é¢¨?ªæ•¸?ï??‰ç?ç´šï?
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
   * ?²å??‡æ??„é?é¢¨éšªæ¢æ¬¾?¸é?
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
   * ?²å?æ¢æ¬¾?„æ?é«˜é¢¨?ªç?ç´?
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
   * ?¹é??µå»ºé¢¨éšª?¹é?
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

// å°å‡º?®ä?å¯¦ä?
export const riskRuleRepository = new RiskRuleRepository();
export const riskMatchRepository = new RiskMatchRepository();
