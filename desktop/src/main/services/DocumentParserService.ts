// @ts-nocheck
/**
 * Document Parser Service
 * 處理文檔解析，提取條款內容
 */

import * as fs from 'fs';
import * as path from 'path';
import { clauseRepository } from '@main/repositories';

// 解析後的條款結構
interface ParsedClause {
  clauseNumber: string;    // "1", "1.1", "1.2.1"
  title: string | null;    // 條款標題
  content: string;         // 條款內容
  level: number;           // 層級 (-1: 文档标题, 0: 章节, 1: 条款, 2: 款, 3: 项)
  parentId: number | null; // 父條款 ID（數據庫 ID）
  orderIndex: number;      // 排序索引
}

// 條款編號狀態（用於追蹤當前編號）
interface NumberingState {
  level1: number;  // 第X條
  level2: number;  // 第X款
  level3: number;  // 第X項
  currentLevel1Id: number | null;  // 當前一級條款的數據庫 ID
  currentLevel2Id: number | null;  // 當前二級條款的數據庫 ID
}

class DocumentParserService {
  /**
   * 解析文檔並存入數據庫
   */
  async parseDocument(documentId: number, filePath: string, fileType: string): Promise<{ success: boolean; message: string; clauseCount?: number }> {
    try {
      console.log(`開始解析文檔: ${filePath}, 類型: ${fileType}`);

      // 根據文件類型選擇解析器
      let clauses: ParsedClause[] = [];
      
      switch (fileType) {
        case 'txt':
          clauses = await this.parseTxtFile(filePath);
          break;
        case 'docx':
          clauses = await this.parseDocxFile(filePath);
          break;
        case 'pdf':
          clauses = await this.parsePdfFile(filePath);
          break;
        default:
          return {
            success: false,
            message: `不支持的文件類型: ${fileType}`
          };
      }

      if (clauses.length === 0) {
        return {
          success: false,
          message: '未能從文檔中提取到條款'
        };
      }

      // 存入數據庫
      const savedCount = await this.saveClauses(documentId, clauses);

      console.log(`文檔解析完成，共提取 ${savedCount} 個條款`);

      return {
        success: true,
        message: '文檔解析成功',
        clauseCount: savedCount
      };
    } catch (error) {
      console.error('文檔解析失敗:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '文檔解析失敗'
      };
    }
  }

  /**
   * 解析 TXT 文件
   */
  private async parseTxtFile(filePath: string): Promise<ParsedClause[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return this.parseLines(lines);
  }

  /**
   * 解析 DOCX 文件
   */
  private async parseDocxFile(filePath: string): Promise<ParsedClause[]> {
    const mammoth = require('mammoth');
    
    // 使用 mammoth 提取文本
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    
    console.log(`DOCX 文本提取完成，長度: ${text.length}`);
    
    // 將文本按行分割
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return this.parseLines(lines);
  }

  /**
   * 解析 PDF 文件
   */
  private async parsePdfFile(filePath: string): Promise<ParsedClause[]> {
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    
    // 讀取 PDF 文件
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF 頁數: ${pdf.numPages}`);
    
    // 提取所有頁面的文本
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // 改進文本提取：保留換行符
      let pageText = '';
      let lastY = -1;
      
      for (const item of textContent.items) {
        const currentY = item.transform[5];
        
        // 如果 Y 坐標變化較大，說明是新的一行
        if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        }
        
        pageText += item.str + ' ';
        lastY = currentY;
      }
      
      fullText += pageText + '\n\n';
    }
    
    console.log(`PDF 文本提取完成，長度: ${fullText.length}`);
    console.log(`PDF 文本前 500 字符:`, fullText.substring(0, 500));
    
    // 將文本按行分割
    const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`PDF 共 ${lines.length} 行文本`);
    console.log(`前 10 行:`, lines.slice(0, 10));
    
    return this.parseLines(lines);
  }

  /**
   * 解析文本行（通用方法）
   */
  private parseLines(lines: string[]): ParsedClause[] {
    const clauses: ParsedClause[] = [];
    const state: NumberingState = {
      level1: 0,
      level2: 0,
      level3: 0,
      currentLevel1Id: null,
      currentLevel2Id: null
    };

    let orderIndex = 0;
    let currentContent: string[] = [];
    let currentTitle: string | null = null;
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 檢測條款標題
      const clauseInfo = this.detectClauseTitle(line);

      if (clauseInfo) {
        // 保存之前累積的內容（包括文档标题和章節）
        if (currentLevel >= -1 && (currentContent.length > 0 || currentLevel <= 0)) {
          clauses.push({
            clauseNumber: currentLevel <= 0 ? '' : this.generateClauseNumber(state, currentLevel),
            title: currentTitle,
            content: currentContent.join('\n'),
            level: currentLevel,
            parentId: this.getParentId(state, currentLevel),
            orderIndex: orderIndex++
          });
          currentContent = [];
        }

        // 更新狀態
        currentTitle = clauseInfo.title;
        currentLevel = clauseInfo.level;
        
        // 只有非章节和非文档标题才更新编号
        if (!clauseInfo.isChapter && !clauseInfo.isDocTitle && clauseInfo.level > 0) {
          this.updateNumberingState(state, clauseInfo.level);
        }
      } else if (currentLevel > 0) {
        // 累積內容
        currentContent.push(line);
      }
    }

    // 保存最後一個條款（包括文档标题和章節）
    if (currentLevel >= -1 && (currentContent.length > 0 || currentLevel <= 0)) {
      clauses.push({
        clauseNumber: currentLevel <= 0 ? '' : this.generateClauseNumber(state, currentLevel),
        title: currentTitle,
        content: currentContent.join('\n'),
        level: currentLevel,
        parentId: this.getParentId(state, currentLevel),
        orderIndex: orderIndex++
      });
    }

    console.log(`解析完成，共提取 ${clauses.length} 個條款`);

    return clauses;
  }

  /**
   * 檢測條款標題
   * 識別 "第X條"、"第X款"、"第X項" 等格式
   */
  private detectClauseTitle(line: string): { level: number; title: string; isChapter?: boolean; isDocTitle?: boolean } | null {
    // 匹配文档标题 "# 标题" (单独的一级标题，不含"第X章"或"第X條")
    const docTitleMatch = line.match(/^#\s+([^第].+)$/);
    if (docTitleMatch) {
      return {
        level: -1,
        title: docTitleMatch[1],
        isDocTitle: true
      };
    }

    // 匹配章節標題 "第X章" (可以有或没有 #)
    const chapterMatch = line.match(/^#{0,2}\s*第\s*([一二三四五六七八九十百]+)\s*章\s+(.+)$/);
    if (chapterMatch) {
      return {
        level: 0,
        title: line.replace(/^#{0,2}\s*/, ''),
        isChapter: true
      };
    }

    // 匹配 "第X條" 或 "### 第X條"
    const level1Match = line.match(/^#{0,3}\s*第\s*(\d+|[一二三四五六七八九十百]+)\s*條\s+(.+)$/);
    if (level1Match) {
      return {
        level: 1,
        title: line.replace(/^#{0,3}\s*/, '')
      };
    }

    // 匹配 "### 第X款" 或 "第X款"
    const level2Match = line.match(/^#{0,3}\s*第\s*(\d+|[一二三四五六七八九十百]+)\s*款\s+(.+)$/);
    if (level2Match) {
      return {
        level: 2,
        title: line.replace(/^#{0,3}\s*/, '')
      };
    }

    return null;
  }

  /**
   * 更新編號狀態
   */
  private updateNumberingState(state: NumberingState, level: number): void {
    if (level === 1) {
      state.level1++;
      state.level2 = 0;
      state.level3 = 0;
    } else if (level === 2) {
      state.level2++;
      state.level3 = 0;
    } else if (level === 3) {
      state.level3++;
    }
  }

  /**
   * 生成條款編號
   */
  private generateClauseNumber(state: NumberingState, level: number): string {
    if (level === 1) {
      return `${state.level1}`;
    } else if (level === 2) {
      return `${state.level1}.${state.level2}`;
    } else if (level === 3) {
      return `${state.level1}.${state.level2}.${state.level3}`;
    }
    return '0';
  }

  /**
   * 獲取父條款 ID（暫時返回 null，後續在保存時處理）
   */
  private getParentId(state: NumberingState, level: number): number | null {
    // 這裡暫時返回 null，實際的父 ID 會在保存時設置
    return null;
  }

  /**
   * 保存條款到數據庫
   */
  private async saveClauses(documentId: number, clauses: ParsedClause[]): Promise<number> {
    // 用於追蹤已保存條款的 ID
    const savedIds: Map<string, number> = new Map();

    for (const clause of clauses) {
      // 確定父條款 ID
      let parentId: number | null = null;
      
      if (clause.level === 2) {
        // 二級條款的父條款是對應的一級條款
        const parentNumber = clause.clauseNumber.split('.')[0];
        parentId = savedIds.get(parentNumber) || null;
      } else if (clause.level === 3) {
        // 三級條款的父條款是對應的二級條款
        const parts = clause.clauseNumber.split('.');
        const parentNumber = `${parts[0]}.${parts[1]}`;
        parentId = savedIds.get(parentNumber) || null;
      }

      // 保存條款
      const clauseId = clauseRepository.createClause(
        documentId,
        clause.clauseNumber,
        clause.content,
        clause.level,
        clause.orderIndex,
        clause.title,
        parentId
      );

      // 記錄已保存的條款 ID
      savedIds.set(clause.clauseNumber, clauseId);
    }

    return clauses.length;
  }
}

// 導出單例
export const documentParserService = new DocumentParserService();
