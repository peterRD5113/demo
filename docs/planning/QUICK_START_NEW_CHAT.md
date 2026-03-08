# 新對話窗快速開始指南

> 📋 這是一份簡短的指南，幫助您在新對話窗快速繼續開發

---

## 🎯 當前狀態

- ✅ **Phase 1 完成**: 項目初始化與基礎架構
- 📝 **下一步**: Phase 2 - 數據庫設計與初始化
- 📍 **項目位置**: `c:\Users\fortu\Desktop\Project\Demo`

---

## 📖 必讀文檔（按順序）

1. **HANDOVER_DOCUMENT.md** - 完整交接文檔（本目錄）
2. **desktop/PHASE1_COMPLETION_REPORT.md** - Phase 1 完成報告
3. **docs/database-schema.md** - 數據庫設計（Phase 2 需要）
4. **questions.md** - 業務邏輯疑問（13 個）

---

## 🚀 在新對話窗中說什麼

複製以下內容到新對話窗：

```
我正在開發「律影合同審閱與條款風險標註桌面工作台」項目。

當前狀態：
- Phase 1（項目初始化）已完成 ✅
- 準備開始 Phase 2（數據庫設計與初始化）📝

項目位置：c:\Users\fortu\Desktop\Project\Demo

請先閱讀以下文檔：
1. HANDOVER_DOCUMENT.md（交接文檔）
2. desktop/PHASE1_COMPLETION_REPORT.md（Phase 1 報告）
3. docs/database-schema.md（數據庫設計）

然後開始 Phase 2 的開發：
1. 創建數據庫 schema.sql（10 張表）
2. 實現數據庫初始化腳本
3. 創建 Repository 層
4. 每完成一部分就檢查規範符合度

請按照「分段開發、逐步檢查」的原則進行。
```

---

## 📝 Phase 2 開發清單

### 2.1 創建數據庫結構 ✅
**文件**: `desktop/src/main/database/schema.sql`
- [ ] users 表
- [ ] projects 表
- [ ] documents 表
- [ ] document_versions 表
- [ ] clauses 表
- [ ] risk_rules 表
- [ ] risk_matches 表
- [ ] annotations 表
- [ ] mentions 表
- [ ] clause_templates 表

### 2.2 數據庫初始化 ✅
**文件**: `desktop/src/main/database/init.ts`
- [ ] 連接 SQLite
- [ ] 執行建表 SQL
- [ ] 插入初始數據
- [ ] 錯誤處理

### 2.3 Repository 層 ✅
**目錄**: `desktop/src/main/repositories/`
- [ ] UserRepository.ts
- [ ] ProjectRepository.ts
- [ ] DocumentRepository.ts
- [ ] ClauseRepository.ts
- [ ] RiskRepository.ts
- [ ] VersionRepository.ts
- [ ] AnnotationRepository.ts

### 2.4 檢查規範 ✅
- [ ] 無語法錯誤
- [ ] 無類型錯誤
- [ ] 符合安全規範
- [ ] 代碼可維護

---

## ⚠️ 重要提醒

1. **分段開發**: 不要一次做完全部
2. **逐步檢查**: 每完成一部分就檢查
3. **參考文檔**: 遇到疑問查看 docs/ 和 questions.md
4. **遵守規範**: 所有代碼必須符合 .cursor/rules/ 中的規範

---

## 📚 關鍵文檔位置

```
Demo/
├── HANDOVER_DOCUMENT.md           ← 完整交接文檔
├── desktop/
│   ├── PHASE1_COMPLETION_REPORT.md ← Phase 1 報告
│   ├── src/shared/                ← 已完成的共享代碼
│   └── package.json               ← 依賴配置
├── docs/
│   ├── database-schema.md         ← 數據庫設計（重要！）
│   ├── design.md                  ← 系統設計
│   └── api-spec.md                ← API 規格
├── questions.md                   ← 業務邏輯疑問
└── .cursor/rules/                 ← 規範文檔
```

---

## ✅ 準備就緒

所有文檔已準備完畢，可以在新對話窗繼續開發！

**祝開發順利！** 🎉
