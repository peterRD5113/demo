/**
 * Export Service
 * 處理文檔導出相關業務邏輯
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { getDb } from '../database/connection';
import { versionService } from './VersionService';

export interface ExportOptions {
  includeAnnotations?: boolean;
  includeRisks?: boolean;
  format: 'pdf' | 'docx' | 'report';
}
export interface ClauseData {
  id: number;
  clause_number: string;
  content: string;
  risk_level?: string;
  risk_description?: string;
  annotations?: AnnotationData[];
}
export interface AnnotationData {
  id: number;
  user_name: string;
  type: string;
  content: string;
  created_at: string;
}
export interface DocumentData {
  id: number;
  name: string;
  clauses: ClauseData[];
  risks: RiskData[];
}
export interface RiskData {
  id: number;
  clause_id: number;
  risk_level: string;
  category: string;
  description: string;
}
interface RevisionItem {
  clause_number: string;
  type: 'modified' | 'added' | 'deleted';
  versionContent?: string;
  currentContent?: string;
}

export class ExportService {
  private static getFontPath(): string {
    const fontFileName = 'NotoSansTC-VariableFont_wght.ttf';
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'resources', 'fonts', fontFileName);
    }
    return path.join(__dirname, '../../../resources/fonts', fontFileName);
  }

  static getSuggestedFileName(baseName: string, extension: string): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
    return `${safeName}_${timeStr}.${extension}`;
  }

  static async generatePDFBuffer(
    documentId: number,
    options: ExportOptions
  ): Promise<{ buffer: Buffer; suggestedName: string }> {
      const documentData = await this.getDocumentData(documentId, options);
    const suggestedName = this.getSuggestedFileName(documentData.name, 'pdf');
    const fontPath = this.getFontPath();
    const buffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
        doc.fontSize(20).text(documentData.name, { align: 'center' });
        doc.moveDown();
        if (options.includeRisks && documentData.risks.length > 0) {
          doc.fontSize(16).text('風險摘要', { underline: true });
          doc.moveDown(0.5);
        const h = documentData.risks.filter((r) => r.risk_level === 'high').length;
        const m = documentData.risks.filter((r) => r.risk_level === 'medium').length;
        const l = documentData.risks.filter((r) => r.risk_level === 'low').length;
          doc.fontSize(12);
        doc.fillColor('red').text(`高風險: ${h}`, { continued: true });
        doc.fillColor('orange').text(`  中風險: ${m}`, { continued: true });
        doc.fillColor('blue').text(`  低風險: ${l}`);
          doc.fillColor('black');
          doc.moveDown();
        }
        doc.fontSize(16).text('文檔內容', { underline: true });
        doc.moveDown();
        documentData.clauses.forEach((clause, index) => {
          doc.fontSize(14).fillColor('black');
          doc.text(`${clause.clause_number}`, { continued: true });
          doc.fontSize(12).text(` ${clause.content}`);
          if (options.includeRisks && clause.risk_level) {
            doc.moveDown(0.3);
          const rc = clause.risk_level === 'high' ? 'red' : clause.risk_level === 'medium' ? 'orange' : 'blue';
          doc.fontSize(10).fillColor(rc);
          doc.text(`[風險] ${clause.risk_description || '未知風險'}`, { indent: 20 });
            doc.fillColor('black');
          }
          if (options.includeAnnotations && clause.annotations && clause.annotations.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('gray');
          clause.annotations.forEach((a) => {
            doc.text(`[批註] ${a.user_name} (${a.type}): ${a.content}`, { indent: 20 });
            });
            doc.fillColor('black');
          }
          doc.moveDown();
          if (index < documentData.clauses.length - 1 && doc.y > 700) {
            doc.addPage();
          doc.font('NotoSansTC');
          }
        });
        doc.end();
      });
    return { buffer, suggestedName };
  }

  static async generateDOCXBuffer(
    documentId: number,
    options: ExportOptions,
    userId: number = 0
  ): Promise<{ buffer: Buffer; suggestedName: string }> {
      const documentData = await this.getDocumentData(documentId, options);
    const suggestedName = this.getSuggestedFileName(documentData.name, 'docx');
    const fn = 'Microsoft JhengHei';
      const sections: any[] = [];
    sections.push(new Paragraph({ text: documentData.name, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
    sections.push(new Paragraph({ text: '' }));
      if (options.includeRisks && documentData.risks.length > 0) {
      sections.push(new Paragraph({ text: '風險摘要', heading: HeadingLevel.HEADING_2 }));
      const h = documentData.risks.filter((r) => r.risk_level === 'high').length;
      const m = documentData.risks.filter((r) => r.risk_level === 'medium').length;
      const l = documentData.risks.filter((r) => r.risk_level === 'low').length;
      sections.push(new Paragraph({ children: [
        new TextRun({ text: `高風險: ${h}  `, color: 'FF0000', font: fn }),
        new TextRun({ text: `中風險: ${m}  `, color: 'FFA500', font: fn }),
        new TextRun({ text: `低風險: ${l}`, color: '0000FF', font: fn }),
      ] }));
        sections.push(new Paragraph({ text: '' }));
      }
    sections.push(new Paragraph({ text: '文檔內容', heading: HeadingLevel.HEADING_2 }));
      sections.push(new Paragraph({ text: '' }));
      documentData.clauses.forEach((clause) => {
      sections.push(new Paragraph({ children: [
        new TextRun({ text: `${clause.clause_number} `, bold: true, font: fn }),
        new TextRun({ text: clause.content, font: fn }),
      ] }));
        if (options.includeRisks && clause.risk_level) {
        const rc = clause.risk_level === 'high' ? 'FF0000' : clause.risk_level === 'medium' ? 'FFA500' : '0000FF';
        sections.push(new Paragraph({ children: [
          new TextRun({ text: `[風險] ${clause.risk_description || '未知風險'}`, color: rc, italics: true, font: fn }),
        ], indent: { left: 720 } }));
      }
        if (options.includeAnnotations && clause.annotations && clause.annotations.length > 0) {
        clause.annotations.forEach((a) => {
          sections.push(new Paragraph({ children: [
            new TextRun({ text: `[批註] ${a.user_name} (${a.type}): ${a.content}`, color: '808080', italics: true, font: fn }),
          ], indent: { left: 720 } }));
        });
      }
        sections.push(new Paragraph({ text: '' }));
      });

    // 附錄：修訂痕跡
    sections.push(new Paragraph({ text: '附錄：修訂痕跡', heading: HeadingLevel.HEADING_2 }));
    if (userId > 0) {
      try {
        const latestVersion = await versionService.getLatestVersion(documentId, userId);
        if (!latestVersion) {
          sections.push(new Paragraph({ children: [new TextRun({ text: '尚未建立版本記錄，無修訂痕跡可顯示', font: fn })] }));
        } else {
          const versionClauses = await versionService.getVersionClauses(latestVersion.id, userId);
          const db = getDb();
          const res = db.exec('SELECT id, clause_number, content FROM clauses WHERE document_id = ? ORDER BY id', [documentId]);
          const currentClauses: { id: number; clause_number: string; content: string }[] = [];
          if (res.length > 0 && res[0].values.length > 0) {
            for (const row of res[0].values) {
              currentClauses.push({ id: row[0] as number, clause_number: row[1] as string, content: row[2] as string });
            }
          }
          const currentMap = new Map(currentClauses.map((c) => [c.id, c]));
          const versionOriginalIds = new Set(
            versionClauses.filter((v) => v.original_clause_id !== null).map((v) => v.original_clause_id as number)
          );
          const docRevItems: { clause_number: string; type: 'modified'|'added'|'deleted'; versionContent?: string; currentContent?: string }[] = [];
          let docHasChanges = false;
          for (const vc of versionClauses) {
            if (vc.original_clause_id !== null) {
              const cur = currentMap.get(vc.original_clause_id);
              if (!cur) {
                docRevItems.push({ clause_number: vc.clause_number, type: 'deleted', versionContent: vc.content });
                docHasChanges = true;
              } else if (cur.content !== vc.content) {
                docRevItems.push({ clause_number: vc.clause_number, type: 'modified', versionContent: vc.content, currentContent: cur.content });
                docHasChanges = true;
              }
            } else {
              docRevItems.push({ clause_number: vc.clause_number, type: 'deleted', versionContent: vc.content });
              docHasChanges = true;
            }
          }
          for (const cur of currentClauses) {
            if (!versionOriginalIds.has(cur.id)) {
              docRevItems.push({ clause_number: cur.clause_number, type: 'added', currentContent: cur.content });
              docHasChanges = true;
            }
          }
          if (docRevItems.length === 0) {
            sections.push(new Paragraph({ children: [new TextRun({ text: `與版本 ${latestVersion.version_number} 相比，本文件無修改`, font: fn })] }));
          } else {
            docRevItems.forEach((item, index) => {
              const label = item.type === 'modified' ? '[修改]' : item.type === 'added' ? '[新增]' : '[已刪除]';
              const color = item.type === 'modified' ? 'FFA500' : item.type === 'added' ? '008000' : 'FF0000';
              sections.push(new Paragraph({ children: [
                new TextRun({ text: `${index + 1}. ${label} 條款 ${item.clause_number}`, bold: true, color, font: fn }),
              ] }));
              if (item.versionContent !== undefined) {
                sections.push(new Paragraph({ children: [
                  new TextRun({ text: `[版本 ${latestVersion.version_number}] `, bold: true, color: '888888', font: fn }),
                  new TextRun({ text: item.versionContent.substring(0, 200), color: '888888', font: fn }),
                ], indent: { left: 720 } }));
              }
              if (item.currentContent !== undefined) {
                sections.push(new Paragraph({ children: [
                  new TextRun({ text: '[現行] ', bold: true, font: fn }),
                  new TextRun({ text: item.currentContent.substring(0, 200), font: fn }),
                ], indent: { left: 720 } }));
              }
              sections.push(new Paragraph({ text: '' }));
            });
          }
        }
      } catch (_e) {
        sections.push(new Paragraph({ children: [new TextRun({ text: '修訂痕跡查詢失敗', font: fn })] }));
      }
    } else {
      sections.push(new Paragraph({ children: [new TextRun({ text: '未提供使用者資訊，無法查詢修訂痕跡', font: fn })] }));
    }

    const doc = new Document({ sections: [{ properties: {}, children: sections }] });
    const buffer = await Packer.toBuffer(doc);
    return { buffer, suggestedName };
  }

  static async generateReportBuffer(
    documentId: number,
    userId: number
  ): Promise<{ buffer: Buffer; suggestedName: string }> {
      const documentData = await this.getDocumentData(documentId, {
        format: 'report',
        includeAnnotations: true,
        includeRisks: true,
      });
    const suggestedName = this.getSuggestedFileName(`${documentData.name}_審閱報告`, 'docx');
    const fn = 'Microsoft JhengHei';
    let revisionItems: RevisionItem[] = [];
    let versionNumber: number | null = null;
    let hasVersion = false;
    try {
      const latestVersion = await versionService.getLatestVersion(documentId, userId);
      if (latestVersion) {
        hasVersion = true;
        versionNumber = latestVersion.version_number;
        const versionClauses = await versionService.getVersionClauses(latestVersion.id, userId);
        const db = getDb();
        const res = db.exec('SELECT id, clause_number, content FROM clauses WHERE document_id = ? ORDER BY id', [documentId]);
        const currentClauses: { id: number; clause_number: string; content: string }[] = [];
        if (res.length > 0 && res[0].values.length > 0) {
          for (const row of res[0].values) {
            currentClauses.push({ id: row[0] as number, clause_number: row[1] as string, content: row[2] as string });
          }
        }
        const currentMap = new Map(currentClauses.map((c) => [c.id, c]));
        const versionOriginalIds = new Set(
          versionClauses.filter((v) => v.original_clause_id !== null).map((v) => v.original_clause_id as number)
        );
        let hasChanges = false;
        for (const vc of versionClauses) {
          if (vc.original_clause_id !== null) {
            const cur = currentMap.get(vc.original_clause_id);
            if (!cur) {
              revisionItems.push({ clause_number: vc.clause_number, type: 'deleted', versionContent: vc.content });
              hasChanges = true;
            } else if (cur.content !== vc.content) {
              revisionItems.push({ clause_number: vc.clause_number, type: 'modified', versionContent: vc.content, currentContent: cur.content });
              hasChanges = true;
            }
          } else {
            revisionItems.push({ clause_number: vc.clause_number, type: 'deleted', versionContent: vc.content });
            hasChanges = true;
          }
        }
        for (const cur of currentClauses) {
          if (!versionOriginalIds.has(cur.id)) {
            revisionItems.push({ clause_number: cur.clause_number, type: 'added', currentContent: cur.content });
            hasChanges = true;
          }
        }
      }
    } catch (_e) { /* 版本查詢失敗不影響報告 */ }

      const sections: any[] = [];
    sections.push(new Paragraph({ text: `${documentData.name} - 審閱報告`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
      sections.push(new Paragraph({ text: '' }));
    sections.push(new Paragraph({ children: [new TextRun({ text: `生成日期: ${new Date().toLocaleString()}`, font: fn })], alignment: AlignmentType.RIGHT }));
      sections.push(new Paragraph({ text: '' }));

    sections.push(new Paragraph({ text: '一、風險統計', heading: HeadingLevel.HEADING_2 }));
      const highRisks = documentData.risks.filter((r) => r.risk_level === 'high');
      const mediumRisks = documentData.risks.filter((r) => r.risk_level === 'medium');
      const lowRisks = documentData.risks.filter((r) => r.risk_level === 'low');
    if (documentData.risks.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: '本文件無風險項目', font: fn })] }));
    } else {
      sections.push(new Paragraph({ children: [new TextRun({ text: `總風險數: ${documentData.risks.length}`, bold: true, font: fn })] }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `高風險: ${highRisks.length}`, color: 'FF0000', font: fn })] }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `中風險: ${mediumRisks.length}`, color: 'FFA500', font: fn })] }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `低風險: ${lowRisks.length}`, color: '0000FF', font: fn })] }));
    }
      sections.push(new Paragraph({ text: '' }));

    sections.push(new Paragraph({ text: '二、高風險條款清單', heading: HeadingLevel.HEADING_2 }));
    if (highRisks.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: '本文件無高風險條款', font: fn })] }));
    } else {
        highRisks.forEach((risk, index) => {
          const clause = documentData.clauses.find((c) => c.id === risk.clause_id);
          if (clause) {
          sections.push(new Paragraph({ children: [
            new TextRun({ text: `${index + 1}. `, bold: true, font: fn }),
            new TextRun({ text: `條款 ${clause.clause_number}: `, bold: true, font: fn }),
            new TextRun({ text: risk.description, color: 'FF0000', font: fn }),
          ] }));
          sections.push(new Paragraph({ children: [
            new TextRun({ text: `   內容: ${clause.content.substring(0, 100)}...`, font: fn }),
          ], indent: { left: 720 } }));
            sections.push(new Paragraph({ text: '' }));
          }
        });
      }

    sections.push(new Paragraph({ text: '三、待確認問題列表', heading: HeadingLevel.HEADING_2 }));
    const issueAnnotations = documentData.clauses.flatMap((c) =>
      (c.annotations || [])
        .filter((a) => a.type === 'comment' || a.type === 'question' || a.type === 'issue')
        .map((a) => ({ clause: c, annotation: a }))
    );
    if (issueAnnotations.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: '本文件無待確認問題', font: fn })] }));
    } else {
      issueAnnotations.forEach((item, index) => {
        sections.push(new Paragraph({ children: [
          new TextRun({ text: `${index + 1}. `, bold: true, font: fn }),
          new TextRun({ text: `[條款 ${item.clause.clause_number}] `, bold: true, color: '1890ff', font: fn }),
          new TextRun({ text: `${item.annotation.user_name}: `, bold: true, font: fn }),
          new TextRun({ text: item.annotation.content, font: fn }),
        ] }));
          sections.push(new Paragraph({ text: '' }));
        });
      }

    sections.push(new Paragraph({ text: '四、建議修改條款清單', heading: HeadingLevel.HEADING_2 }));
    // 來源一：風險建議措辭（risk_matches.suggestion）
    const riskSuggestions = documentData.risks
      .filter((r) => r.description && r.description.trim() !== '')
      .map((r) => {
        const clause = documentData.clauses.find((c) => c.id === r.clause_id);
        return { clause, risk: r };
      })
      .filter((item) => item.clause !== undefined);
    // 來源二：使用者建議批註（annotations.type === 'suggestion'）
    const annotationSuggestions = documentData.clauses.flatMap((c) =>
          (c.annotations || [])
            .filter((a) => a.type === 'suggestion')
            .map((a) => ({ clause: c, annotation: a }))
        );
    if (riskSuggestions.length === 0 && annotationSuggestions.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: '本文件無建議修改條款', font: fn })] }));
    } else {
      let suggestionIndex = 1;
      riskSuggestions.forEach((item) => {
        const riskColor = item.risk.risk_level === 'high' ? 'FF0000' : item.risk.risk_level === 'medium' ? 'FFA500' : '0000FF';
        const riskLabel = item.risk.risk_level === 'high' ? '高風險' : item.risk.risk_level === 'medium' ? '中風險' : '低風險';
        sections.push(new Paragraph({ children: [
          new TextRun({ text: `${suggestionIndex}. `, bold: true, font: fn }),
          new TextRun({ text: '[風險建議] ', bold: true, color: riskColor, font: fn }),
          new TextRun({ text: `條款 ${item.clause!.clause_number}（${riskLabel}）: `, bold: true, font: fn }),
          new TextRun({ text: item.risk.description, font: fn }),
        ] }));
        sections.push(new Paragraph({ text: '' }));
        suggestionIndex++;
      });
      annotationSuggestions.forEach((item) => {
        sections.push(new Paragraph({ children: [
          new TextRun({ text: `${suggestionIndex}. `, bold: true, font: fn }),
          new TextRun({ text: '[使用者建議] ', bold: true, color: '722ed1', font: fn }),
          new TextRun({ text: `條款 ${item.clause.clause_number} - ${item.annotation.user_name}: `, bold: true, font: fn }),
          new TextRun({ text: item.annotation.content, font: fn }),
        ] }));
        sections.push(new Paragraph({ text: '' }));
        suggestionIndex++;
      });
    }

    sections.push(new Paragraph({ text: '五、修訂痕跡', heading: HeadingLevel.HEADING_2 }));
    if (!hasVersion) {
      sections.push(new Paragraph({ children: [new TextRun({ text: '尚未建立版本記錄，無修訂痕跡可顯示', font: fn })] }));
    } else if (revisionItems.length === 0) {
      sections.push(new Paragraph({ children: [new TextRun({ text: `與版本 ${versionNumber} 相比，本文件無修改`, font: fn })] }));
    } else {
      revisionItems.forEach((item, index) => {
        const label = item.type === 'modified' ? '[修改]' : item.type === 'added' ? '[新增]' : '[已刪除]';
        const color = item.type === 'modified' ? 'FFA500' : item.type === 'added' ? '008000' : 'FF0000';
        sections.push(new Paragraph({ children: [
          new TextRun({ text: `${index + 1}. ${label} 條款 ${item.clause_number}`, bold: true, color, font: fn }),
        ] }));
        if (item.versionContent !== undefined) {
          sections.push(new Paragraph({ children: [
            new TextRun({ text: `[版本 ${versionNumber}] `, bold: true, color: '888888', font: fn }),
            new TextRun({ text: item.versionContent.substring(0, 200), color: '888888', font: fn }),
          ], indent: { left: 720 } }));
        }
        if (item.currentContent !== undefined) {
          sections.push(new Paragraph({ children: [
            new TextRun({ text: '[現行] ', bold: true, font: fn }),
            new TextRun({ text: item.currentContent.substring(0, 200), font: fn }),
          ], indent: { left: 720 } }));
        }
          sections.push(new Paragraph({ text: '' }));
        });
      }

    const doc = new Document({ sections: [{ properties: {}, children: sections }] });
      const buffer = await Packer.toBuffer(doc);
    return { buffer, suggestedName };
  }

  private static async getDocumentData(
    documentId: number,
    options: ExportOptions
  ): Promise<DocumentData> {
    const db = getDb();
    const docResult = db.exec('SELECT id, name FROM documents WHERE id = ?', [documentId]);
    if (docResult.length === 0 || docResult[0].values.length === 0) throw new Error('文檔不存在');
    const documentName = docResult[0].values[0][1] as string;
    const clausesResult = db.exec('SELECT id, clause_number, content FROM clauses WHERE document_id = ? ORDER BY id', [documentId]);
    const clauses: ClauseData[] = [];
    if (clausesResult.length > 0 && clausesResult[0].values.length > 0) {
      for (const row of clausesResult[0].values) {
        const clauseId = row[0] as number;
        const clause: ClauseData = { id: clauseId, clause_number: row[1] as string, content: row[2] as string };
        if (options.includeRisks) {
          const rr = db.exec(
            `SELECT rm.risk_level, rm.suggestion FROM risk_matches rm WHERE rm.clause_id = ? ORDER BY CASE rm.risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END LIMIT 1`,
            [clauseId]
          );
          if (rr.length > 0 && rr[0].values.length > 0) {
            clause.risk_level = rr[0].values[0][0] as string;
            clause.risk_description = rr[0].values[0][1] as string;
          }
        }
        if (options.includeAnnotations) {
          const ar = db.exec(
            `SELECT a.id, u.display_name, a.type, a.content, a.created_at FROM annotations a LEFT JOIN users u ON a.user_id = u.id WHERE a.clause_id = ? AND a.status = 'active' ORDER BY a.created_at`,
            [clauseId]
          );
          if (ar.length > 0 && ar[0].values.length > 0) {
            clause.annotations = ar[0].values.map((r) => ({
              id: r[0] as number, user_name: r[1] as string, type: r[2] as string, content: r[3] as string, created_at: r[4] as string,
            }));
          }
        }
        clauses.push(clause);
      }
    }
    const risksResult = db.exec(
      `SELECT rm.id, rm.clause_id, rm.risk_level, rr.category, rm.suggestion as description FROM risk_matches rm LEFT JOIN risk_rules rr ON rm.rule_id = rr.id WHERE rm.clause_id IN (SELECT id FROM clauses WHERE document_id = ?)`,
      [documentId]
    );
    const risks: RiskData[] = [];
    if (risksResult.length > 0 && risksResult[0].values.length > 0) {
      for (const row of risksResult[0].values) {
        risks.push({ id: row[0] as number, clause_id: row[1] as number, risk_level: row[2] as string, category: row[3] as string, description: row[4] as string });
      }
    }
    return { id: documentId, name: documentName, clauses, risks };
  }
}
