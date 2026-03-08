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

export class ExportService {
  /**
   * 導出為 PDF
   */
  static async exportToPDF(
    documentId: number,
    options: ExportOptions
  ): Promise<string> {
    try {
      const documentData = await this.getDocumentData(documentId, options);
      const outputPath = this.getOutputPath(documentData.name, 'pdf');

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // 標題
        doc.fontSize(20).text(documentData.name, { align: 'center' });
        doc.moveDown();

        // 風險摘要
        if (options.includeRisks && documentData.risks.length > 0) {
          doc.fontSize(16).text('風險摘要', { underline: true });
          doc.moveDown(0.5);

          const highRisks = documentData.risks.filter((r) => r.risk_level === 'high').length;
          const mediumRisks = documentData.risks.filter((r) => r.risk_level === 'medium').length;
          const lowRisks = documentData.risks.filter((r) => r.risk_level === 'low').length;

          doc.fontSize(12);
          doc.fillColor('red').text(`高風險: ${highRisks}`, { continued: true });
          doc.fillColor('orange').text(`  中風險: ${mediumRisks}`, { continued: true });
          doc.fillColor('blue').text(`  低風險: ${lowRisks}`);
          doc.fillColor('black');
          doc.moveDown();
        }

        // 條款內容
        doc.fontSize(16).text('文檔內容', { underline: true });
        doc.moveDown();

        documentData.clauses.forEach((clause, index) => {
          // 條款編號和內容
          doc.fontSize(14).fillColor('black');
          doc.text(`${clause.clause_number}`, { continued: true });
          doc.fontSize(12).text(` ${clause.content}`);

          // 風險標註
          if (options.includeRisks && clause.risk_level) {
            doc.moveDown(0.3);
            const riskColor =
              clause.risk_level === 'high'
                ? 'red'
                : clause.risk_level === 'medium'
                ? 'orange'
                : 'blue';
            doc.fontSize(10).fillColor(riskColor);
            doc.text(`⚠ 風險: ${clause.risk_description || '未知風險'}`, {
              indent: 20,
            });
            doc.fillColor('black');
          }

          // 批註
          if (options.includeAnnotations && clause.annotations && clause.annotations.length > 0) {
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('gray');
            clause.annotations.forEach((annotation) => {
              doc.text(
                `💬 ${annotation.user_name} (${annotation.type}): ${annotation.content}`,
                { indent: 20 }
              );
            });
            doc.fillColor('black');
          }

          doc.moveDown();

          // 分頁處理
          if (index < documentData.clauses.length - 1 && doc.y > 700) {
            doc.addPage();
          }
        });

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Export to PDF failed:', error);
      throw new Error('導出 PDF 失敗');
    }
  }

  /**
   * 導出為 DOCX
   */
  static async exportToDOCX(
    documentId: number,
    options: ExportOptions
  ): Promise<string> {
    try {
      const documentData = await this.getDocumentData(documentId, options);
      const outputPath = this.getOutputPath(documentData.name, 'docx');

      const sections: any[] = [];

      // 標題
      sections.push(
        new Paragraph({
          text: documentData.name,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );

      sections.push(new Paragraph({ text: '' })); // 空行

      // 風險摘要
      if (options.includeRisks && documentData.risks.length > 0) {
        sections.push(
          new Paragraph({
            text: '風險摘要',
            heading: HeadingLevel.HEADING_2,
          })
        );

        const highRisks = documentData.risks.filter((r) => r.risk_level === 'high').length;
        const mediumRisks = documentData.risks.filter((r) => r.risk_level === 'medium').length;
        const lowRisks = documentData.risks.filter((r) => r.risk_level === 'low').length;

        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `高風險: ${highRisks}  `, color: 'FF0000' }),
              new TextRun({ text: `中風險: ${mediumRisks}  `, color: 'FFA500' }),
              new TextRun({ text: `低風險: ${lowRisks}`, color: '0000FF' }),
            ],
          })
        );

        sections.push(new Paragraph({ text: '' }));
      }

      // 文檔內容
      sections.push(
        new Paragraph({
          text: '文檔內容',
          heading: HeadingLevel.HEADING_2,
        })
      );

      sections.push(new Paragraph({ text: '' }));

      // 條款
      documentData.clauses.forEach((clause) => {
        // 條款編號和內容
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${clause.clause_number} `, bold: true }),
              new TextRun({ text: clause.content }),
            ],
          })
        );

        // 風險標註
        if (options.includeRisks && clause.risk_level) {
          const riskColor =
            clause.risk_level === 'high'
              ? 'FF0000'
              : clause.risk_level === 'medium'
              ? 'FFA500'
              : '0000FF';

          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `⚠ 風險: ${clause.risk_description || '未知風險'}`,
                  color: riskColor,
                  italics: true,
                }),
              ],
              indent: { left: 720 },
            })
          );
        }

        // 批註
        if (options.includeAnnotations && clause.annotations && clause.annotations.length > 0) {
          clause.annotations.forEach((annotation) => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `💬 ${annotation.user_name} (${annotation.type}): ${annotation.content}`,
                    color: '808080',
                    italics: true,
                  }),
                ],
                indent: { left: 720 },
              })
            );
          });
        }

        sections.push(new Paragraph({ text: '' }));
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

      return outputPath;
    } catch (error) {
      console.error('Export to DOCX failed:', error);
      throw new Error('導出 DOCX 失敗');
    }
  }

  /**
   * 導出審閱報告
   */
  static async exportReport(documentId: number): Promise<string> {
    try {
      const documentData = await this.getDocumentData(documentId, {
        format: 'report',
        includeAnnotations: true,
        includeRisks: true,
      });
      const outputPath = this.getOutputPath(`${documentData.name}_審閱報告`, 'docx');

      const sections: any[] = [];

      // 報告標題
      sections.push(
        new Paragraph({
          text: `${documentData.name} - 審閱報告`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );

      sections.push(new Paragraph({ text: '' }));

      // 生成日期
      sections.push(
        new Paragraph({
          text: `生成日期: ${new Date().toLocaleString()}`,
          alignment: AlignmentType.RIGHT,
        })
      );

      sections.push(new Paragraph({ text: '' }));

      // 風險統計
      sections.push(
        new Paragraph({
          text: '一、風險統計',
          heading: HeadingLevel.HEADING_2,
        })
      );

      const highRisks = documentData.risks.filter((r) => r.risk_level === 'high');
      const mediumRisks = documentData.risks.filter((r) => r.risk_level === 'medium');
      const lowRisks = documentData.risks.filter((r) => r.risk_level === 'low');

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `總風險數: ${documentData.risks.length}`, bold: true }),
          ],
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `高風險: ${highRisks.length}`, color: 'FF0000' }),
          ],
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `中風險: ${mediumRisks.length}`, color: 'FFA500' }),
          ],
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `低風險: ${lowRisks.length}`, color: '0000FF' }),
          ],
        })
      );

      sections.push(new Paragraph({ text: '' }));

      // 高風險條款清單
      if (highRisks.length > 0) {
        sections.push(
          new Paragraph({
            text: '二、高風險條款清單',
            heading: HeadingLevel.HEADING_2,
          })
        );

        highRisks.forEach((risk, index) => {
          const clause = documentData.clauses.find((c) => c.id === risk.clause_id);
          if (clause) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. `, bold: true }),
                  new TextRun({ text: `條款 ${clause.clause_number}: `, bold: true }),
                  new TextRun({ text: risk.description, color: 'FF0000' }),
                ],
              })
            );

            sections.push(
              new Paragraph({
                text: `   內容: ${clause.content.substring(0, 100)}...`,
                indent: { left: 720 },
              })
            );

            sections.push(new Paragraph({ text: '' }));
          }
        });
      }

      // 待確認問題列表
      const allAnnotations = documentData.clauses
        .flatMap((c) => c.annotations || [])
        .filter((a) => a.type === 'question' || a.type === 'issue');

      if (allAnnotations.length > 0) {
        sections.push(
          new Paragraph({
            text: '三、待確認問題列表',
            heading: HeadingLevel.HEADING_2,
          })
        );

        allAnnotations.forEach((annotation, index) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. `, bold: true }),
                new TextRun({ text: `${annotation.user_name}: `, bold: true }),
                new TextRun({ text: annotation.content }),
              ],
            })
          );

          sections.push(new Paragraph({ text: '' }));
        });
      }

      // 建議修改條款清單
      const suggestions = documentData.clauses
        .flatMap((c) =>
          (c.annotations || [])
            .filter((a) => a.type === 'suggestion')
            .map((a) => ({ clause: c, annotation: a }))
        );

      if (suggestions.length > 0) {
        sections.push(
          new Paragraph({
            text: '四、建議修改條款清單',
            heading: HeadingLevel.HEADING_2,
          })
        );

        suggestions.forEach((item, index) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. `, bold: true }),
                new TextRun({ text: `條款 ${item.clause.clause_number}: `, bold: true }),
              ],
            })
          );

          sections.push(
            new Paragraph({
              text: `   建議: ${item.annotation.content}`,
              indent: { left: 720 },
            })
          );

          sections.push(new Paragraph({ text: '' }));
        });
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(outputPath, buffer);

      return outputPath;
    } catch (error) {
      console.error('Export report failed:', error);
      throw new Error('導出審閱報告失敗');
    }
  }

  /**
   * 獲取文檔數據
   */
  private static async getDocumentData(
    documentId: number,
    options: ExportOptions
  ): Promise<DocumentData> {
    const db = getDb();

    // 獲取文檔信息
    const docResult = db.exec('SELECT id, name FROM documents WHERE id = ?', [documentId]);

    if (docResult.length === 0 || docResult[0].values.length === 0) {
      throw new Error('文檔不存在');
    }

    const documentName = docResult[0].values[0][1] as string;

    // 獲取條款
    const clausesResult = db.exec(
      'SELECT id, clause_number, content FROM clauses WHERE document_id = ? ORDER BY id',
      [documentId]
    );

    const clauses: ClauseData[] = [];

    if (clausesResult.length > 0 && clausesResult[0].values.length > 0) {
      for (const row of clausesResult[0].values) {
        const clauseId = row[0] as number;
        const clause: ClauseData = {
          id: clauseId,
          clause_number: row[1] as string,
          content: row[2] as string,
        };

        // 獲取風險
        if (options.includeRisks) {
          const riskResult = db.exec(
            `SELECT risk_level, description 
             FROM risk_detections 
             WHERE clause_id = ? 
             ORDER BY CASE risk_level 
               WHEN 'high' THEN 1 
               WHEN 'medium' THEN 2 
               WHEN 'low' THEN 3 
             END 
             LIMIT 1`,
            [clauseId]
          );

          if (riskResult.length > 0 && riskResult[0].values.length > 0) {
            clause.risk_level = riskResult[0].values[0][0] as string;
            clause.risk_description = riskResult[0].values[0][1] as string;
          }
        }

        // 獲取批註
        if (options.includeAnnotations) {
          const annotationsResult = db.exec(
            `SELECT a.id, u.display_name, a.type, a.content, a.created_at
             FROM annotations a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.clause_id = ? AND a.status = 'active'
             ORDER BY a.created_at`,
            [clauseId]
          );

          if (annotationsResult.length > 0 && annotationsResult[0].values.length > 0) {
            clause.annotations = annotationsResult[0].values.map((row) => ({
              id: row[0] as number,
              user_name: row[1] as string,
              type: row[2] as string,
              content: row[3] as string,
              created_at: row[4] as string,
            }));
          }
        }

        clauses.push(clause);
      }
    }

    // 獲取所有風險
    const risksResult = db.exec(
      `SELECT id, clause_id, risk_level, category, description
       FROM risk_detections
       WHERE clause_id IN (SELECT id FROM clauses WHERE document_id = ?)`,
      [documentId]
    );

    const risks: RiskData[] = [];
    if (risksResult.length > 0 && risksResult[0].values.length > 0) {
      for (const row of risksResult[0].values) {
        risks.push({
          id: row[0] as number,
          clause_id: row[1] as number,
          risk_level: row[2] as string,
          category: row[3] as string,
          description: row[4] as string,
        });
      }
    }

    return {
      id: documentId,
      name: documentName,
      clauses,
      risks,
    };
  }

  /**
   * 獲取輸出路徑
   */
  private static getOutputPath(fileName: string, extension: string): string {
    const downloadsPath = app.getPath('downloads');
    const timestamp = new Date().getTime();
    const safeName = fileName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
    return path.join(downloadsPath, `${safeName}_${timestamp}.${extension}`);
  }
}
