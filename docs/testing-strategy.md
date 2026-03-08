# 測試策略文檔

## 1. 測試概述

### 1.1 測試目標

- 確保功能正確性
- 驗證性能指標
- 保證代碼質量
- 提高系統穩定性

### 1.2 測試原則

- **測試先行**: 編寫代碼前先寫測試
- **全面覆蓋**: 覆蓋核心業務邏輯
- **自動化**: 自動化執行測試
- **持續集成**: 每次提交都運行測試

### 1.3 測試類型

| 測試類型 | 目的 | 工具 | 覆蓋率目標 |
|---------|------|------|-----------|
| 單元測試 | 測試單個函數/類 | Vitest | ≥ 80% |
| 集成測試 | 測試模塊間交互 | Vitest | ≥ 60% |
| 端到端測試 | 測試完整流程 | Playwright | 核心流程 |
| 性能測試 | 測試性能指標 | 自定義腳本 | 關鍵指標 |

## 2. 單元測試

### 2.1 測試框架

使用 Vitest 作為測試框架：
- 快速執行
- 與 Vite 集成
- 兼容 Jest API
- 支持 TypeScript

### 2.2 測試結構

```
unit_tests/
├── services/
│   ├── DocumentService.test.ts
│   ├── RuleService.test.ts
│   ├── VersionService.test.ts
│   └── AuthService.test.ts
├── dao/
│   ├── DocumentDAO.test.ts
│   ├── ClauseDAO.test.ts
│   └── UserDAO.test.ts
├── utils/
│   ├── parser.test.ts
│   ├── encryption.test.ts
│   └── validation.test.ts
└── README.md
```

### 2.3 測試示例

#### 2.3.1 服務層測試

```typescript
// unit_tests/services/DocumentService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentService } from '@/main/services/DocumentService';
import { DocumentDAO } from '@/main/dao/DocumentDAO';

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockDocumentDAO: DocumentDAO;
  
  beforeEach(() => {
    // 創建 mock 對象
    mockDocumentDAO = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    } as any;
    
    documentService = new DocumentService(mockDocumentDAO);
  });
  
  describe('importDocument', () => {
    it('應該成功導入 docx 文檔', async () => {
      const filePath = '/path/to/test.docx';
      const mockDocument = {
        id: 'doc-1',
        name: 'test.docx',
        content: '測試內容'
      };
      
      mockDocumentDAO.create.mockResolvedValue(mockDocument);
      
      const result = await documentService.importDocument(filePath);
      
      expect(result).toEqual(mockDocument);
      expect(mockDocumentDAO.create).toHaveBeenCalledTimes(1);
    });
    
    it('應該拋出錯誤當文件不存在', async () => {
      const filePath = '/path/to/nonexistent.docx';
      
      await expect(
        documentService.importDocument(filePath)
      ).rejects.toThrow('文件不存在');
    });
    
    it('應該拋出錯誤當文件格式不支持', async () => {
      const filePath = '/path/to/test.exe';
      
      await expect(
        documentService.importDocument(filePath)
      ).rejects.toThrow('不支持的文件格式');
    });
  });
  
  describe('getDocument', () => {
    it('應該返回文檔', async () => {
      const documentId = 'doc-1';
      const mockDocument = {
        id: documentId,
        name: 'test.docx'
      };
      
      mockDocumentDAO.findById.mockResolvedValue(mockDocument);
      
      const result = await documentService.getDocument(documentId);
      
      expect(result).toEqual(mockDocument);
    });
    
    it('應該返回 null 當文檔不存在', async () => {
      const documentId = 'nonexistent';
      
      mockDocumentDAO.findById.mockResolvedValue(null);
      
      const result = await documentService.getDocument(documentId);
      
      expect(result).toBeNull();
    });
  });
});
```

#### 2.3.2 DAO 層測試

```typescript
// unit_tests/dao/DocumentDAO.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { DocumentDAO } from '@/main/dao/DocumentDAO';

describe('DocumentDAO', () => {
  let db: Database.Database;
  let documentDAO: DocumentDAO;
  
  beforeEach(() => {
    // 使用內存數據庫
    db = new Database(':memory:');
    
    // 創建表
    db.exec(`
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    documentDAO = new DocumentDAO(db);
  });
  
  afterEach(() => {
    db.close();
  });
  
  describe('create', () => {
    it('應該創建文檔', () => {
      const data = {
        id: 'doc-1',
        name: 'test.docx',
        content: '測試內容',
        userId: 'user-1'
      };
      
      const result = documentDAO.create(data);
      
      expect(result.id).toBe(data.id);
      expect(result.name).toBe(data.name);
    });
  });
  
  describe('findById', () => {
    it('應該查詢文檔', () => {
      // 插入測試數據
      db.prepare(`
        INSERT INTO documents (id, name, content, user_id)
        VALUES (?, ?, ?, ?)
      `).run('doc-1', 'test.docx', '測試內容', 'user-1');
      
      const result = documentDAO.findById('doc-1');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('test.docx');
    });
    
    it('應該返回 null 當文檔不存在', () => {
      const result = documentDAO.findById('nonexistent');
      
      expect(result).toBeNull();
    });
  });
});
```

#### 2.3.3 工具函數測試

```typescript
// unit_tests/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validatePassword, validateEmail } from '@/shared/utils/validation';

describe('validation', () => {
  describe('validatePassword', () => {
    it('應該接受有效密碼', () => {
      expect(validatePassword('Abc12345')).toBe(true);
      expect(validatePassword('Test@123')).toBe(true);
    });
    
    it('應該拒絕過短的密碼', () => {
      expect(validatePassword('Abc123')).toBe(false);
    });
    
    it('應該拒絕沒有大寫字母的密碼', () => {
      expect(validatePassword('abc12345')).toBe(false);
    });
    
    it('應該拒絕沒有小寫字母的密碼', () => {
      expect(validatePassword('ABC12345')).toBe(false);
    });
    
    it('應該拒絕沒有數字的密碼', () => {
      expect(validatePassword('Abcdefgh')).toBe(false);
    });
  });
  
  describe('validateEmail', () => {
    it('應該接受有效郵箱', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });
    
    it('應該拒絕無效郵箱', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});
```

### 2.4 測試覆蓋率

```bash
# 運行測試並生成覆蓋率報告
npm run test:coverage

# 查看覆蓋率報告
open coverage/index.html
```

**覆蓋率目標**:
- 語句覆蓋率: ≥ 80%
- 分支覆蓋率: ≥ 75%
- 函數覆蓋率: ≥ 80%
- 行覆蓋率: ≥ 80%

## 3. 集成測試

### 3.1 測試結構

```
API_tests/
├── document/
│   ├── import.test.ts
│   ├── edit.test.ts
│   └── export.test.ts
├── risk/
│   ├── match.test.ts
│   └── adjust.test.ts
├── version/
│   ├── save.test.ts
│   ├── compare.test.ts
│   └── rollback.test.ts
└── README.md
```

### 3.2 測試示例

```typescript
// API_tests/document/import.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from 'electron';
import path from 'path';

describe('文檔導入集成測試', () => {
  beforeAll(async () => {
    // 初始化應用
    await app.whenReady();
  });
  
  afterAll(() => {
    // 清理
    app.quit();
  });
  
  it('應該成功導入 docx 文檔', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'test.docx');
    
    // 調用 IPC
    const result = await ipcRenderer.invoke('document:import', testFile);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id');
    expect(result.data.name).toBe('test.docx');
  });
  
  it('應該自動提取條款', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'test.docx');
    
    const document = await ipcRenderer.invoke('document:import', testFile);
    const clauses = await ipcRenderer.invoke('clause:list', document.data.id);
    
    expect(clauses.success).toBe(true);
    expect(clauses.data.length).toBeGreaterThan(0);
  });
  
  it('應該自動匹配風險', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'test.docx');
    
    const document = await ipcRenderer.invoke('document:import', testFile);
    const clauses = await ipcRenderer.invoke('clause:list', document.data.id);
    
    // 檢查是否有風險匹配
    const firstClause = clauses.data[0];
    const risks = await ipcRenderer.invoke('rule:match', firstClause.id);
    
    expect(risks.success).toBe(true);
    expect(Array.isArray(risks.data)).toBe(true);
  });
});
```

## 4. 端到端測試

### 4.1 測試工具

使用 Playwright 進行端到端測試：
- 支持多瀏覽器
- 自動等待
- 截圖和錄屏
- 調試工具

### 4.2 測試場景

```typescript
// e2e/document-review.spec.ts
import { test, expect } from '@playwright/test';

test.describe('文檔審閱流程', () => {
  test.beforeEach(async ({ page }) => {
    // 登錄
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'Admin@123');
    await page.click('[data-testid="login-button"]');
    
    // 等待跳轉到主頁
    await page.waitForURL('**/dashboard');
  });
  
  test('完整的文檔審閱流程', async ({ page }) => {
    // 1. 導入文檔
    await page.click('[data-testid="import-button"]');
    await page.setInputFiles(
      '[data-testid="file-input"]',
      'tests/fixtures/test.docx'
    );
    
    // 等待導入完成
    await expect(page.locator('[data-testid="document-name"]')).toBeVisible();
    
    // 2. 查看風險標註
    const riskClauses = page.locator('[data-risk-level="high"]');
    await expect(riskClauses).toHaveCount(5);
    
    // 3. 添加批註
    await riskClauses.first().click();
    await page.click('[data-testid="add-comment-button"]');
    await page.fill('[data-testid="comment-input"]', '此條款需要修改');
    await page.click('[data-testid="submit-comment-button"]');
    
    // 驗證批註已添加
    await expect(
      page.locator('[data-testid="comment-list"]').locator('text=此條款需要修改')
    ).toBeVisible();
    
    // 4. 保存版本
    await page.click('[data-testid="save-version-button"]');
    await page.fill('[data-testid="version-summary"]', '初次審閱');
    await page.click('[data-testid="confirm-save-button"]');
    
    // 驗證版本已保存
    await expect(
      page.locator('[data-testid="version-number"]')
    ).toHaveText('版本 1');
    
    // 5. 導出報告
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-report"]');
    
    // 等待下載
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('審閱報告');
  });
  
  test('版本回滾流程', async ({ page }) => {
    // 打開文檔
    await page.click('[data-testid="document-list"]').first();
    
    // 打開版本歷史
    await page.click('[data-testid="version-history-button"]');
    
    // 選擇歷史版本
    await page.click('[data-testid="version-item"]').nth(1);
    
    // 點擊回滾
    await page.click('[data-testid="rollback-button"]');
    await page.click('[data-testid="confirm-rollback-button"]');
    
    // 驗證回滾成功
    await expect(
      page.locator('[data-testid="success-message"]')
    ).toContainText('回滾成功');
  });
});
```

## 5. 性能測試

### 5.1 性能指標

| 指標 | 目標值 | 測試方法 |
|-----|--------|---------|
| 首次啟動時間 | < 5 秒 | 計時測試 |
| 10MB 文檔打開 | < 8 秒 | 計時測試 |
| 風險匹配 | < 2 秒 (1000 條款) | 計時測試 |
| 版本保存 | < 1 秒 | 計時測試 |
| 導出 PDF | < 5 秒 (100 頁) | 計時測試 |

### 5.2 性能測試腳本

```typescript
// performance/document-import.perf.ts
import { performance } from 'perf_hooks';

async function testDocumentImport() {
  const testFiles = [
    { name: '1MB.docx', size: 1 * 1024 * 1024 },
    { name: '5MB.docx', size: 5 * 1024 * 1024 },
    { name: '10MB.docx', size: 10 * 1024 * 1024 }
  ];
  
  for (const file of testFiles) {
    const start = performance.now();
    
    await documentService.importDocument(file.name);
    
    const duration = performance.now() - start;
    
    console.log(`${file.name}: ${duration.toFixed(2)}ms`);
    
    // 驗證性能指標
    if (file.size === 10 * 1024 * 1024) {
      expect(duration).toBeLessThan(8000); // 8 秒
    }
  }
}
```

### 5.3 內存測試

```typescript
// performance/memory.perf.ts
async function testMemoryUsage() {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // 導入大文檔
  await documentService.importDocument('large.docx');
  
  const afterImportMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = afterImportMemory - initialMemory;
  
  console.log(`內存增長: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  
  // 驗證內存增長在合理範圍內
  expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
}
```

## 6. 測試數據

### 6.1 測試夾具

```
tests/fixtures/
├── documents/
│   ├── simple.docx          # 簡單文檔
│   ├── complex.docx         # 複雜文檔
│   ├── large.docx           # 大文檔 (10MB)
│   └── invalid.txt          # 無效文檔
├── users/
│   └── test-users.json      # 測試用戶數據
└── rules/
    └── test-rules.json      # 測試規則數據
```

### 6.2 測試數據生成

```typescript
// tests/helpers/fixtures.ts
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-' + Math.random(),
    username: 'testuser',
    displayName: '測試用戶',
    role: 'user',
    ...overrides
  };
}

export function createTestDocument(overrides?: Partial<Document>): Document {
  return {
    id: 'test-doc-' + Math.random(),
    name: 'test.docx',
    content: '測試內容',
    userId: 'test-user-1',
    ...overrides
  };
}
```

## 7. 測試執行

### 7.1 運行測試

```bash
# 運行所有測試
npm test

# 運行單元測試
npm run test:unit

# 運行集成測試
npm run test:integration

# 運行端到端測試
npm run test:e2e

# 運行性能測試
npm run test:performance

# 監聽模式
npm run test:watch
```

### 7.2 測試腳本

```bash
#!/bin/bash
# run_tests.sh

set -e

echo "=========================================="
echo "  運行單元測試"
echo "=========================================="
cd unit_tests
npm run test 2>&1 | tee ../test_results_unit.log
cd ..

echo ""
echo "=========================================="
echo "  運行集成測試"
echo "=========================================="
cd API_tests
npm run test 2>&1 | tee ../test_results_api.log
cd ..

echo ""
echo "=========================================="
echo "  測試摘要"
echo "=========================================="
echo "單元測試: $(grep -E 'passed|failed' test_results_unit.log | tail -1)"
echo "集成測試: $(grep -E 'passed|failed' test_results_api.log | tail -1)"

# 檢查是否有失敗的測試
if grep -q "failed" test_results_unit.log || grep -q "failed" test_results_api.log; then
  echo ""
  echo "❌ 測試失敗"
  exit 1
else
  echo ""
  echo "✅ 所有測試通過"
  exit 0
fi
```

## 8. 持續集成

### 8.1 CI 配置

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
```

## 9. 測試最佳實踐

### 9.1 編寫測試

- **測試命名清晰**: 描述測試的目的
- **一個測試一個斷言**: 保持測試簡單
- **使用 AAA 模式**: Arrange, Act, Assert
- **避免測試實現細節**: 測試行為而非實現

### 9.2 測試維護

- **定期運行測試**: 每次提交都運行
- **及時修復失敗測試**: 不要累積失敗測試
- **重構測試代碼**: 保持測試代碼質量
- **更新測試文檔**: 記錄測試策略和方法

### 9.3 測試調試

```typescript
// 使用 .only 運行單個測試
it.only('應該測試某個功能', () => {
  // ...
});

// 使用 .skip 跳過測試
it.skip('暫時跳過的測試', () => {
  // ...
});

// 使用 console.log 調試
it('調試測試', () => {
  const result = someFunction();
  console.log('result:', result);
  expect(result).toBe(expected);
});
```

## 10. 測試報告

### 10.1 測試結果

```
測試摘要
========================================
單元測試:
  總數: 150
  通過: 148
  失敗: 2
  跳過: 0
  覆蓋率: 82%

集成測試:
  總數: 45
  通過: 45
  失敗: 0
  跳過: 0

端到端測試:
  總數: 12
  通過: 12
  失敗: 0
  跳過: 0

性能測試:
  首次啟動: 4.2s ✅
  10MB 文檔打開: 7.5s ✅
  風險匹配: 1.8s ✅
  版本保存: 0.8s ✅
  導出 PDF: 4.3s ✅
```

### 10.2 覆蓋率報告

```
文件                    語句    分支    函數    行
========================================
services/
  DocumentService.ts    95%     90%     100%    95%
  RuleService.ts        88%     85%     90%     88%
  VersionService.ts     92%     88%     95%     92%
dao/
  DocumentDAO.ts        100%    100%    100%    100%
  ClauseDAO.ts          98%     95%     100%    98%
utils/
  parser.ts             85%     80%     85%     85%
  validation.ts         100%    100%    100%    100%
========================================
總計                    91%     88%     94%     91%
```

## 11. 測試檢查清單

### 11.1 功能測試

- [ ] 文檔導入功能
- [ ] 條款提取功能
- [ ] 風險匹配功能
- [ ] 批註功能
- [ ] 版本管理功能
- [ ] 導出功能
- [ ] 用戶認證功能
- [ ] 權限控制功能

### 11.2 性能測試

- [ ] 首次啟動時間
- [ ] 文檔打開時間
- [ ] 風險匹配時間
- [ ] 版本保存時間
- [ ] 導出時間
- [ ] 內存使用
- [ ] CPU 使用

### 11.3 安全測試

- [ ] 密碼強度驗證
- [ ] 登錄失敗鎖定
- [ ] SQL 注入防護
- [ ] XSS 防護
- [ ] 文件上傳驗證
- [ ] 權限檢查

### 11.4 兼容性測試

- [ ] Windows 10+
- [ ] macOS 10.15+
- [ ] Linux (Ubuntu 20.04+)
- [ ] 不同屏幕分辨率
- [ ] 不同文檔格式
