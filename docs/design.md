# 系統設計文檔

## 1. 系統概述

律影合同審閱工作台是一款基於 Electron 的桌面應用，為法務人員提供合同文檔審閱、風險識別、版本管理和報告生成的完整解決方案。

### 1.1 設計目標

- **高效性**: 10MB 文檔 8 秒內打開，首次啟動 5 秒內可用
- **準確性**: 精準識別風險條款，提供專業建議
- **易用性**: 中文界面，符合法務人員工作習慣
- **安全性**: 本地存儲，支持加密和訪問控制
- **可靠性**: 完整的版本管理和數據備份機制

### 1.2 技術架構

採用 Electron 多進程架構：
- **主進程**: 負責窗口管理、文件系統操作、數據庫訪問
- **渲染進程**: 負責 UI 渲染和用戶交互
- **Preload 腳本**: 提供安全的 IPC 通信橋接

## 2. 核心模塊設計

### 2.1 文檔處理模塊

#### 2.1.1 文檔解析器 (DocumentParser)

**職責**: 解析不同格式的文檔，提取結構化內容

**支持格式**:
- DOCX: 使用 mammoth.js 解析
- PDF: 使用 pdf.js 提取文本
- TXT: 直接讀取純文本

**解析流程**:
```typescript
interface ParseResult {
  content: string;           // 原始文本
  clauses: Clause[];         // 條款列表
  metadata: DocumentMetadata; // 元數據
  formatting: FormatInfo[];   // 格式信息
}

class DocumentParser {
  async parse(file: File): Promise<ParseResult> {
    // 1. 檢測文件類型
    // 2. 調用對應解析器
    // 3. 提取文本內容
    // 4. 識別文檔結構
    // 5. 生成條款列表
    // 6. 保存格式信息
  }
}
```

**性能優化**:
- 使用 Worker 線程進行解析，避免阻塞 UI
- 分段解析：先解析前 100 個條款，其餘後台加載
- 解析結果緩存到數據庫（基於文件 MD5）

#### 2.1.2 條款提取器 (ClauseExtractor)

**職責**: 從文檔中提取條款，生成結構化數據

**條款識別策略**:
1. **基於編號**: 識別 1.1.1、一、（一）、第一條等編號模式
2. **基於標題**: 識別加粗、字體大小變化的標題
3. **基於段落**: 識別空行、縮進等段落分隔符
4. **基於關鍵詞**: 識別"甲方"、"乙方"、"條款"等關鍵詞

**條款數據結構**:
```typescript
interface Clause {
  id: string;              // 唯一標識
  number: string;          // 條款編號（如 "1.1.1"）
  title: string;           // 條款標題
  content: string;         // 條款內容
  level: number;           // 層級（1-3）
  parent: string | null;   // 父條款 ID
  children: string[];      // 子條款 ID 列表
  position: {              // 在文檔中的位置
    start: number;
    end: number;
  };
  formatting: FormatInfo;  // 格式信息
}
```

#### 2.1.3 目錄生成器 (TOCGenerator)

**職責**: 基於條款結構生成目錄

**功能**:
- 自動生成多級目錄（最多 3 級）
- 支持點擊跳轉
- 支持目錄摺疊/展開
- 支持目錄搜索

### 2.2 風險識別模塊

#### 2.2.1 規則引擎 (RuleEngine)

**職責**: 根據規則庫匹配風險條款

**規則數據結構**:
```typescript
interface RiskRule {
  id: string;
  name: string;              // 規則名稱
  category: string;          // 分類（付款、違約、保密等）
  riskLevel: 'high' | 'medium' | 'low'; // 風險等級
  patterns: Pattern[];       // 匹配模式
  suggestions: string[];     // 建議措辭
  description: string;       // 規則描述
  enabled: boolean;          // 是否啟用
}

interface Pattern {
  type: 'keyword' | 'regex' | 'semantic'; // 匹配類型
  value: string;             // 匹配值
  weight: number;            // 權重（0-1）
}
```

**內置規則類別**:

1. **付款條件風險**
   - 關鍵詞: "預付款"、"全額支付"、"不可退還"
   - 風險: 資金風險、現金流壓力
   - 建議: 分期付款、設置里程碑

2. **違約責任風險**
   - 關鍵詞: "無上限"、"全部損失"、"連帶責任"
   - 風險: 無限責任、賠償過高
   - 建議: 設置責任上限、明確賠償範圍

3. **管轄地風險**
   - 關鍵詞: "對方所在地"、"仲裁"、"境外法院"
   - 風險: 訴訟不便、法律適用不利
   - 建議: 選擇己方所在地、明確適用法律

4. **保密期限風險**
   - 關鍵詞: "永久保密"、"無限期"、"終止後仍有效"
   - 風險: 過度限制、商業自由受限
   - 建議: 設置合理期限（3-5 年）

5. **自動續約風險**
   - 關鍵詞: "自動續約"、"未提前通知"、"默認延長"
   - 風險: 難以終止、被動續約
   - 建議: 明確終止條件、縮短通知期

**匹配流程**:
```typescript
class RuleEngine {
  async matchRisks(clause: Clause): Promise<RiskMatch[]> {
    const matches: RiskMatch[] = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      let score = 0;
      for (const pattern of rule.patterns) {
        if (this.matchPattern(clause.content, pattern)) {
          score += pattern.weight;
        }
      }
      
      if (score >= 0.5) { // 閾值
        matches.push({
          ruleId: rule.id,
          ruleName: rule.name,
          riskLevel: rule.riskLevel,
          score: score,
          suggestions: rule.suggestions
        });
      }
    }
    
    // 按風險等級和分數排序
    return matches.sort((a, b) => {
      const levelOrder = { high: 3, medium: 2, low: 1 };
      return levelOrder[b.riskLevel] - levelOrder[a.riskLevel] || b.score - a.score;
    });
  }
}
```

#### 2.2.2 風險標註器 (RiskAnnotator)

**職責**: 在 UI 中標註風險條款

**標註策略**:
- 高風險: 紅色背景 (#FFF1F0)，紅色邊框 (#FF4D4F)
- 中風險: 橙色背景 (#FFF7E6)，橙色邊框 (#FFA940)
- 低風險: 黃色背景 (#FFFBE6)，黃色邊框 (#FADB14)

**多規則標註**:
- 條款背景色使用最高風險等級的顏色
- 側邊欄顯示所有命中的規則
- 鼠標懸停顯示風險詳情

### 2.3 審閱功能模塊

#### 2.3.1 批註管理器 (CommentManager)

**職責**: 管理用戶添加的批註

**批註數據結構**:
```typescript
interface Comment {
  id: string;
  clauseId: string;         // 關聯的條款 ID
  userId: string;           // 批註人 ID
  content: string;          // 批註內容
  type: 'comment' | 'suggestion' | 'question'; // 批註類型
  status: 'pending' | 'resolved' | 'rejected'; // 狀態
  createdAt: Date;
  updatedAt: Date;
  replies: CommentReply[];  // 回覆列表
}
```

**功能**:
- 添加/編輯/刪除批註
- 批註回覆（支持多級回覆）
- 批註狀態管理
- 批註搜索和過濾

#### 2.3.2 模板管理器 (TemplateManager)

**職責**: 管理常用條款模板

**模板數據結構**:
```typescript
interface ClauseTemplate {
  id: string;
  title: string;            // 模板標題
  category: string;         // 分類
  content: string;          // 模板內容
  variables: Variable[];    // 變量列表
  description: string;      // 使用說明
  riskNote: string;         // 風險提示
  usageCount: number;       // 使用次數
  createdAt: Date;
}

interface Variable {
  name: string;             // 變量名（如 "甲方名稱"）
  placeholder: string;      // 佔位符（如 "{{甲方名稱}}"）
  type: 'text' | 'number' | 'date'; // 變量類型
  required: boolean;        // 是否必填
  defaultValue?: string;    // 默認值
}
```

**內置模板分類**:
1. 付款條款
2. 違約責任
3. 保密條款
4. 爭議解決
5. 終止條款
6. 知識產權
7. 不可抗力
8. 通知條款

**插入流程**:
1. 用戶選擇模板
2. 彈出變量填寫表單
3. 替換佔位符
4. 插入到指定位置
5. 自動格式化

#### 2.3.3 待確認清單 (TodoManager)

**職責**: 管理 @同事待確認事項

**待辦數據結構**:
```typescript
interface TodoItem {
  id: string;
  clauseId: string;         // 關聯的條款 ID
  assignerId: string;       // 指派人 ID
  assigneeId: string;       // 被指派人 ID
  title: string;            // 待辦標題
  description: string;      // 詳細描述
  priority: 'high' | 'medium' | 'low'; // 優先級
  status: 'pending' | 'in_progress' | 'completed'; // 狀態
  dueDate?: Date;           // 截止日期
  createdAt: Date;
  completedAt?: Date;
}
```

**功能**:
- 創建待辦事項
- @指派給同事
- 設置優先級和截止日期
- 待辦狀態追蹤
- 待辦清單視圖

### 2.4 版本管理模塊

#### 2.4.1 版本管理器 (VersionManager)

**職責**: 管理文檔版本歷史

**版本數據結構**:
```typescript
interface DocumentVersion {
  id: string;
  documentId: string;       // 文檔 ID
  versionNumber: number;    // 版本號（自動遞增）
  userId: string;           // 審閱人 ID
  summary: string;          // 變更摘要（用戶輸入）
  changes: Change[];        // 變更列表（自動生成）
  snapshot: string;         // 文檔快照（JSON）
  createdAt: Date;
}

interface Change {
  type: 'add' | 'modify' | 'delete'; // 變更類型
  clauseId: string;         // 條款 ID
  clauseNumber: string;     // 條款編號
  before?: string;          // 變更前內容
  after?: string;           // 變更後內容
}
```

**版本保存流程**:
1. 用戶點擊"保存版本"
2. 彈出變更摘要輸入框
3. 對比當前版本與上一版本
4. 生成變更列表
5. 保存文檔快照
6. 創建版本記錄

**版本回滾流程**:
1. 用戶選擇歷史版本
2. 顯示版本詳情和變更對比
3. 確認回滾
4. 恢復文檔快照
5. 創建新版本（標記為回滾）

#### 2.4.2 差異對比器 (DiffGenerator)

**職責**: 生成版本間的差異對比

**對比算法**: 使用 diff-match-patch 庫

**對比視圖**:
- 並排對比：左側舊版本，右側新版本
- 行內對比：高亮顯示變更部分
- 變更統計：新增/修改/刪除的條款數量

### 2.5 導出模塊

#### 2.5.1 PDF 導出器 (PDFExporter)

**職責**: 導出帶批註的 PDF

**導出內容**:
- 原文檔內容（保留格式）
- 風險標註（高亮顯示）
- 批註（PDF Annotations）
- 審閱意見（側邊欄）

**實現方案**:
- 使用 pdf-lib 生成 PDF
- 使用 pdf.js 渲染原文檔
- 添加批註標記（Annotations）
- 支持高亮、下劃線、刪除線

#### 2.5.2 DOCX 導出器 (DOCXExporter)

**職責**: 導出修訂痕跡的 docx

**導出內容**:
- 原文檔內容（保留格式）
- 修訂痕跡（Track Changes）
- 批註（Comments）
- 建議修改（Suggestions）

**實現方案**:
- 使用 docx 庫重建文檔
- 還原格式信息
- 添加修訂標記
- 添加批註

#### 2.5.3 報告生成器 (ReportGenerator)

**職責**: 生成審閱摘要報告

**報告內容**:
1. **基本信息**
   - 文檔名稱
   - 審閱人
   - 審閱時間
   - 版本號

2. **風險摘要**
   - 高風險條款數量和列表
   - 中風險條款數量和列表
   - 低風險條款數量和列表

3. **待確認問題**
   - 待辦事項列表
   - 優先級排序
   - 負責人分配

4. **建議修改條款**
   - 條款編號
   - 原文內容
   - 風險說明
   - 建議修改內容

5. **審閱統計**
   - 總條款數
   - 審閱條款數
   - 批註數量
   - 修改建議數量

**報告格式**: PDF（支持自定義模板）

### 2.6 安全模塊

#### 2.6.1 認證管理器 (AuthManager)

**職責**: 管理用戶認證

**用戶數據結構**:
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;     // bcrypt 加密
  role: 'admin' | 'user' | 'viewer'; // 角色
  displayName: string;
  email?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  loginAttempts: number;    // 登錄失敗次數
  lockedUntil?: Date;       // 鎖定截止時間
}
```

**登錄流程**:
1. 用戶輸入用戶名和密碼
2. 檢查賬號是否鎖定
3. 驗證密碼（bcrypt.compare）
4. 登錄成功：重置失敗次數，記錄登錄時間
5. 登錄失敗：增加失敗次數，達到 5 次則鎖定 10 分鐘

**權限控制**:
- Admin: 完整權限
- User: 審閱文檔、導出報告
- Viewer: 僅查看權限

#### 2.6.2 加密服務 (EncryptionService)

**職責**: 敏感信息脫敏

**脫敏規則**:
```typescript
interface MaskingRule {
  id: string;
  name: string;             // 規則名稱
  pattern: string;          // 正則表達式
  maskType: 'partial' | 'full' | 'replace'; // 脫敏類型
  maskChar: string;         // 替換字符（默認 *）
  keepPrefix?: number;      // 保留前 N 位
  keepSuffix?: number;      // 保留後 N 位
  replacement?: string;     // 替換文本
}
```

**內置規則**:
- 身份證號: 顯示前 3 位和後 4 位
- 銀行賬號: 顯示後 4 位
- 手機號: 顯示前 3 位和後 4 位
- 金額: 顯示為 "***元"
- 人名: 顯示姓氏
- 公司名: 顯示簡稱

**脫敏實現**:
```typescript
class EncryptionService {
  // 脫敏
  mask(text: string, rule: MaskingRule): string {
    // 應用脫敏規則
  }
  
  // 加密存儲原文
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  }
  
  // 解密還原
  decrypt(encrypted: string): string {
    return CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
  }
}
```

#### 2.6.3 項目訪問控制 (ProjectAccessControl)

**職責**: 管理項目訪問權限

**項目數據結構**:
```typescript
interface Project {
  id: string;
  name: string;
  documentId: string;
  ownerId: string;
  hasPassword: boolean;
  passwordHash?: string;
  members: ProjectMember[];
  createdAt: Date;
}

interface ProjectMember {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
}
```

**訪問控制**:
- 項目所有者可設置訪問密碼
- 首次訪問需輸入密碼
- 密碼驗證通過後，會話期間無需再次輸入
- 支持修改和移除密碼

## 3. 數據流設計

### 3.1 文檔導入流程

```
用戶選擇文件
    ↓
主進程讀取文件
    ↓
發送到 Worker 線程解析
    ↓
提取條款結構
    ↓
風險規則匹配
    ↓
保存到數據庫
    ↓
渲染進程顯示
```

### 3.2 審閱流程

```
用戶打開文檔
    ↓
加載文檔和歷史版本
    ↓
顯示風險標註
    ↓
用戶添加批註/修改內容
    ↓
實時保存草稿
    ↓
用戶保存版本
    ↓
生成變更對比
    ↓
創建版本記錄
```

### 3.3 導出流程

```
用戶選擇導出格式
    ↓
收集文檔數據
    ↓
收集批註和風險標註
    ↓
生成導出文件
    ↓
保存到用戶指定位置
```

## 4. 性能優化策略

### 4.1 文檔解析優化

- **分段加載**: 先加載前 100 個條款，其餘後台加載
- **Worker 線程**: 使用 Worker 進行解析，避免阻塞 UI
- **緩存機制**: 基於文件 MD5 緩存解析結果
- **增量解析**: 文檔修改時只重新解析變更部分

### 4.2 渲染優化

- **虛擬滾動**: 只渲染可見區域的條款（使用 react-window）
- **延遲加載**: 圖片、表格等複雜元素延遲渲染
- **增量渲染**: 分批渲染條款，避免一次性渲染卡頓
- **防抖節流**: 搜索、過濾等操作使用防抖

### 4.3 數據庫優化

- **索引優化**: 為常用查詢字段建立索引
- **批量操作**: 使用事務進行批量插入/更新
- **連接池**: 複用數據庫連接
- **定期清理**: 清理過期緩存和臨時數據

### 4.4 內存優化

- **及時釋放**: 不再使用的大對象及時釋放
- **對象池**: 複用頻繁創建的對象
- **弱引用**: 使用 WeakMap 存儲臨時數據
- **分頁加載**: 大列表分頁加載，避免一次性加載過多數據

## 5. 錯誤處理

### 5.1 錯誤分類

1. **用戶錯誤**: 輸入錯誤、操作錯誤
2. **系統錯誤**: 文件讀寫失敗、數據庫錯誤
3. **網絡錯誤**: （未來擴展）
4. **未知錯誤**: 未預期的異常

### 5.2 錯誤處理策略

- **友好提示**: 向用戶顯示易懂的錯誤信息
- **錯誤日誌**: 記錄詳細的錯誤堆棧到日誌文件
- **自動恢復**: 嘗試自動恢復（如重試、回滾）
- **降級處理**: 部分功能失敗時，其他功能仍可用

### 5.3 日誌系統

**日誌級別**:
- ERROR: 錯誤信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 調試信息

**日誌內容**:
- 時間戳
- 日誌級別
- 模塊名稱
- 錯誤信息
- 堆棧跟蹤

**日誌存儲**:
- 按日期分割日誌文件
- 保留最近 30 天的日誌
- 支持日誌搜索和過濾

## 6. 擴展性設計

### 6.1 插件系統（未來擴展）

- 支持自定義風險規則插件
- 支持自定義導出格式插件
- 支持自定義 UI 主題插件

### 6.2 API 接口（未來擴展）

- 提供 REST API 供外部系統調用
- 支持文檔批量處理
- 支持與其他系統集成

### 6.3 雲同步（未來擴展）

- 支持文檔雲端備份
- 支持多設備同步
- 支持團隊協作

## 7. 測試策略

詳見 [測試策略文檔](testing-strategy.md)

## 8. 部署方案

### 8.1 開發環境

- Node.js 18+
- npm 9+
- SQLite3

### 8.2 生產環境

- 打包成獨立應用（未來）
- 支持 Windows/macOS/Linux
- 自動更新機制（未來）

## 9. 維護計劃

### 9.1 版本規劃

- v1.0: 核心功能（當前版本）
- v1.1: 性能優化、bug 修復
- v2.0: 插件系統、API 接口
- v3.0: 雲同步、團隊協作

### 9.2 技術債務

- 定期重構代碼
- 更新依賴庫
- 優化性能瓶頸
- 改進用戶體驗

## 10. 附錄

### 10.1 相關文檔

- [架構設計](architecture.md)
- [API 規格說明](api-spec.md)
- [UI/UX 設計規範](ui-ux-design.md)
- [數據庫設計](database-schema.md)
- [安全設計](security-design.md)
- [測試策略](testing-strategy.md)

### 10.2 參考資料

- Electron 官方文檔
- React 官方文檔
- Ant Design 官方文檔
- SQLite 官方文檔
