// @ts-nocheck
import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as bcrypt from 'bcryptjs';

let db: Database | null = null;
let dbPath: string;

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized.');
  return db;
}

export async function initDatabase(): Promise<void> {
  try {
    const SQL = await initSqlJs({
      locateFile: (file) => {
        if (app.isPackaged) return path.join(process.resourcesPath, 'sql-wasm.wasm');
        return path.join(__dirname, '../../../node_modules/sql.js/dist', file);
      },
    });
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'contract_risk.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log(`Database loaded from: ${dbPath}`);
    } else {
      db = new SQL.Database();
      console.log('New database created in memory');
    }
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA encoding = "UTF-8"');
    createTables();
    migrateDatabase();
    initializeDefaultData();
    saveDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function createTables(): void {
  if (!db) throw new Error('Database not initialized');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, description TEXT, password_hash TEXT,
    failed_attempts INTEGER DEFAULT 0, locked_until DATETIME,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, deleted_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL, original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL, file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, deleted_at DATETIME
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS clauses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    clause_number TEXT NOT NULL, title TEXT, content TEXT NOT NULL,
    level INTEGER DEFAULT 1, parent_id INTEGER REFERENCES clauses(id),
    order_index INTEGER DEFAULT 0, page_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS risk_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '其他',
    description TEXT,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('high','medium','low')),
    keywords TEXT NOT NULL DEFAULT '[]',
    pattern TEXT,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS risk_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clause_id INTEGER NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    rule_id INTEGER NOT NULL REFERENCES risk_rules(id),
    risk_level TEXT NOT NULL CHECK(risk_level IN ('high','medium','low')),
    matched_text TEXT NOT NULL, suggestion TEXT,
    user_adjusted_level TEXT CHECK(user_adjusted_level IN ('high','medium','low')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clause_id INTEGER NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('comment','suggestion','question','issue')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','resolved','deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    change_summary TEXT,
    is_current INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version_number)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS version_clauses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id INTEGER NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
    clause_number TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    original_clause_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL, resource_type TEXT NOT NULL,
    resource_id INTEGER, details TEXT, ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.run('CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clauses_document ON clauses(document_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_risk_matches_clause ON risk_matches(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_risk_matches_level ON risk_matches(risk_level)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_clause ON annotations(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_user ON annotations(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_status ON annotations(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
  // clause_templates
  db.run(`CREATE TABLE IF NOT EXISTS clause_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    template_type TEXT NOT NULL DEFAULT 'clause' CHECK(template_type IN ('clause','annotation')),
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_templates_category ON clause_templates(category)');
  db.run('CREATE INDEX IF NOT EXISTS idx_templates_type ON clause_templates(template_type)');

  // project_members 表
  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)');

  // annotation_mentions 表
  db.run(`CREATE TABLE IF NOT EXISTS annotation_mentions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    annotation_id     INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    mentioned_user_id INTEGER NOT NULL REFERENCES users(id),
    status            TEXT DEFAULT 'pending' CHECK(status IN ('pending','read','resolved')),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(annotation_id, mentioned_user_id)
  )`);
  db.run('CREATE INDEX IF NOT EXISTS idx_annotation_mentions_user ON annotation_mentions(mentioned_user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotation_mentions_annotation ON annotation_mentions(annotation_id)');
}

function initializeDefaultData(): void {
  if (!db) throw new Error('Database not initialized');

  const aC = db.exec('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!(aC.length > 0 && aC[0].values.length > 0)) {
    const h = bcrypt.hashSync('Admin@123', 10);
    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,
      ['admin', h, '系統管理員', 'admin']);
    console.log('Default admin user created (username: admin, password: Admin@123)');
  }

  const u1C = db.exec('SELECT id FROM users WHERE username = ?', ['user1']);
  if (!(u1C.length > 0 && u1C[0].values.length > 0)) {
    const h = bcrypt.hashSync('User@123', 10);
    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,
      ['user1', h, '普通用戶', 'user']);
    console.log('Default user1 created (username: user1, password: User@123)');
  }

  const tC = db.exec('SELECT id FROM users WHERE username = ?', ['test']);
  if (!(tC.length > 0 && tC[0].values.length > 0)) {
    const h = bcrypt.hashSync('Test@123', 10);
    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,
      ['test', h, '測試用戶', 'user']);
    console.log('Default test user created (username: test, password: Test@123)');
  }

  const rC = db.exec('SELECT COUNT(*) FROM risk_rules');
  const cnt = rC.length > 0 && rC[0].values.length > 0 ? rC[0].values[0][0] : 0;
  if (cnt === 0) {
    type R = {name:string;category:string;description:string;risk_level:string;keywords:string;pattern:string};
    const rules: R[] = [
      {name:'付款期限過長',category:'付款條件',description:'付款期限超過60天，存在資金風險',risk_level:'high',keywords:'["付款","支付","結算"]',pattern:'付款|支付|結算|賬期|帳期'},
      {name:'違約金比例過高',category:'違約責任',description:'違約金超過30%，存在過高賠償風險',risk_level:'high',keywords:'["違約金","賠償金","罰款"]',pattern:'違約金|賠償金|罰款|違約責任'},
      {name:'管轄地不利',category:'管轄地',description:'爭議管轄地對我方不利',risk_level:'medium',keywords:'["管轄","仲裁","訴訟"]',pattern:'管轄|仲裁|訴訟|爭議解決'},
      {name:'保密期限過長',category:'保密期限',description:'保密期限超過5年，存在商業風險',risk_level:'medium',keywords:'["保密","商業秘密"]',pattern:'保密|商業秘密|保密義務|保密期限'},
      {name:'自動續約條款',category:'自動續約',description:'含有自動續約條款，可能造成意外延續',risk_level:'high',keywords:'["自動續約","自動延期"]',pattern:'自動續約|自動延期|自動展期|自動更新'},
      {name:'無限責任條款',category:'責任限制',description:'未設定責任上限，存在無限賠償風險',risk_level:'high',keywords:'["無限責任","不限責任"]',pattern:'無限責任|不限責任|全部責任|無上限'},
      {name:'單方解除權',category:'合同解除',description:'對方享有單方任意解除合同的權利',risk_level:'medium',keywords:'["單方解除","任意解除"]',pattern:'單方解除|任意解除|單方終止|單方取消'},
      {name:'知識產權歸屬不明',category:'知識產權',description:'未明確約定知識產權歸屬',risk_level:'high',keywords:'["知識產權","著作權","專利權"]',pattern:'知識產權|著作權|專利權|版權|所有權'},
      {name:'不可抗力條款',category:'不可抗力',description:'不可抗力範圍過寬或定義模糊',risk_level:'medium',keywords:'["不可抗力","force majeure"]',pattern:'不可抗力|force majeure'},
      {name:'競業禁止',category:'競業限制',description:'競業禁止範圍或期限過寬',risk_level:'medium',keywords:'["競業","同業競爭","競業禁止"]',pattern:'競業禁止|競業限制|同業競爭'},
    ];
    for (const rule of rules) {
      db.run(
        `INSERT INTO risk_rules (name,category,description,risk_level,keywords,pattern) VALUES (?,?,?,?,?,?)`,
        [rule.name,rule.category,rule.description,rule.risk_level,rule.keywords,rule.pattern]
      );
    }
    console.log(`${rules.length} default risk rules created`);
  }

  // 預設條款模板
  const tmplCount = db.exec('SELECT COUNT(*) as c FROM clause_templates');
  const tc = tmplCount.length > 0 && tmplCount[0].values.length > 0 ? tmplCount[0].values[0][0] : 0;
  if (tc === 0) {
    const adminR = db.exec("SELECT id FROM users WHERE username = 'admin'");
    const adminId = adminR.length > 0 && adminR[0].values.length > 0 ? adminR[0].values[0][0] : 1;
    type T = { name: string; category: string; title: string | null; content: string; template_type: string; description: string };
    const templates: T[] = [
      {
        name: '標準付款條款',
        category: '付款條件',
        title: '付款義務',
        content: '甲方應在收到乙方開具的合規發票並完成驗收後 30 日內完成付款。',
        template_type: 'clause',
        description: '標準 30 天賬期付款條款'
      },
      {
        name: '保密條款',
        category: '保密義務',
        title: '保密義務',
        content: '雙方對因履行本合同而知悉的對方商業秘密負有保密義務，保密期限為 3 年。',
        template_type: 'clause',
        description: '標準 3 年保密條款'
      },
      {
        name: '違約責任條款',
        category: '違約責任',
        title: '違約責任',
        content: '任何一方違反本合同約定，應向守約方支付違約金，違約金金額為合同總額的10%。',
        template_type: 'clause',
        description: '標準 10% 違約金條款'
      },
      {
        name: '爭議解決條款',
        category: '爭議解決',
        title: '爭議解決',
        content: '因本合同引起的或與本合同有關的任何爭議，雙方應友好協商解決；協商不成的，任何一方均可向甲方所在地人民法院提起訴訟。',
        template_type: 'clause',
        description: '標準爭議解決條款'
      },
      {
        name: '請確認合規性',
        category: '合規審查',
        title: null,
        content: '請確認此條款是否符合相關法規要求，如有疑問請反饋法務團隊。',
        template_type: 'annotation',
        description: '合規性審查批注模板'
      },
      {
        name: '建議修改表述',
        category: '內容修改',
        title: null,
        content: '此處表述不夠明確，建議修改為更具體的文字，避免往後產生爭議。',
        template_type: 'annotation',
        description: '內容修改建議批注'
      },
      {
        name: '有疑問待確認',
        category: '疑問標記',
        title: null,
        content: '此條款有疑問，需進一步確認它方的意圖和展示效果再行決定。',
        template_type: 'annotation',
        description: '有疑問需確認批注'
      },
    ];
    for (const t of templates) {
      db.run(
        `INSERT INTO clause_templates (name, category, title, content, template_type, description, created_by) VALUES (?,?,?,?,?,?,?)`,
        [t.name, t.category, t.title, t.content, t.template_type, t.description, adminId]
      );
    }
    console.log(`${templates.length} default templates created`);
  }
}

export function saveDatabase(): void {
  if (!db) throw new Error('Database not initialized');
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`Database saved to: ${dbPath}`);
  } catch (error) {
    console.error('Failed to save database:', error);
    throw error;
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

export function getDatabasePath(): string {
  return dbPath;
}

function migrateDatabase(): void {
  if (!db) throw new Error('Database not initialized');
  try {
    const info = db.exec("PRAGMA table_info(clauses)");
    if (info.length > 0) {
      const cols = info[0].values.map((r: any) => r[1]);
      if (!cols.includes('updated_at')) {
        db.run("ALTER TABLE clauses ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        console.log('Migration: added updated_at to clauses');
      }
    }
    const rInfo = db.exec("PRAGMA table_info(risk_rules)");
    if (rInfo.length > 0) {
      const cols = rInfo[0].values.map((r: any) => r[1]);
      if (!cols.includes('category')) {
        db.run("ALTER TABLE risk_rules ADD COLUMN category TEXT NOT NULL DEFAULT '其他'");
        console.log('Migration: added category to risk_rules');
      }
    }
    // document_versions migration: add change_summary, is_current if missing
    const dvInfo = db.exec("PRAGMA table_info(document_versions)");
    if (dvInfo.length > 0) {
      const dvCols = dvInfo[0].values.map((r: any) => r[1]);
      if (dvCols.includes('content') && !dvCols.includes('change_summary')) {
        // Old schema: drop and recreate (safe since versions are re-created on use)
        db.run('DROP TABLE IF EXISTS version_clauses');
        db.run('DROP TABLE IF EXISTS document_versions');
        db.run(`CREATE TABLE IF NOT EXISTS document_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          version_number INTEGER NOT NULL,
          created_by INTEGER NOT NULL REFERENCES users(id),
          change_summary TEXT,
          is_current INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(document_id, version_number)
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id)');
        console.log('Migration: recreated document_versions with new schema');
      }
    }
    // version_clauses migration
    const vcCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='version_clauses'");
    if (vcCheck.length === 0 || vcCheck[0].values.length === 0) {
      db.run(`CREATE TABLE IF NOT EXISTS version_clauses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version_id INTEGER NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
        clause_number TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        original_clause_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run('CREATE INDEX IF NOT EXISTS idx_version_clauses_version ON version_clauses(version_id)');
      console.log('Migration: created version_clauses table');
    }
    // clause_templates migration
    const tblCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='clause_templates'");
    if (tblCheck.length === 0 || tblCheck[0].values.length === 0) {
      db.run(`CREATE TABLE IF NOT EXISTS clause_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        template_type TEXT NOT NULL DEFAULT 'clause' CHECK(template_type IN ('clause','annotation')),
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run('CREATE INDEX IF NOT EXISTS idx_templates_category ON clause_templates(category)');
      db.run('CREATE INDEX IF NOT EXISTS idx_templates_type ON clause_templates(template_type)');
      console.log('Migration: created clause_templates table');
    }

    // project_members migration
    const pmCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='project_members'");
    if (pmCheck.length === 0 || pmCheck[0].values.length === 0) {
      db.run(`CREATE TABLE IF NOT EXISTS project_members (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invited_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      )`);
      db.run('CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)');
      console.log('Migration: 建立 project_members 表');
    }

    // annotation_mentions migration
    const amCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='annotation_mentions'");
    if (amCheck.length === 0 || amCheck[0].values.length === 0) {
      db.run(`CREATE TABLE IF NOT EXISTS annotation_mentions (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        annotation_id     INTEGER NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
        mentioned_user_id INTEGER NOT NULL REFERENCES users(id),
        status            TEXT DEFAULT 'pending' CHECK(status IN ('pending','read','resolved')),
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(annotation_id, mentioned_user_id)
      )`);
      db.run('CREATE INDEX IF NOT EXISTS idx_annotation_mentions_user ON annotation_mentions(mentioned_user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_annotation_mentions_annotation ON annotation_mentions(annotation_id)');
      console.log('Migration: 建立 annotation_mentions 表');
    }
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}
