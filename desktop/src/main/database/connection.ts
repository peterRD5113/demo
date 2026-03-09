/**
 * Database Connection Module (sql.js)
 * �B�z SQLite ��Ʈw�s���P��l��
 */

import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import * as bcrypt from 'bcryptjs';

let db: Database | null = null;
let dbPath: string;

/**
 * �����Ʈw���
 */
export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * ��l�Ƹ�Ʈw
 */
export async function initDatabase(): Promise<void> {
  try {
    // ��l�� sql.js
    const SQL = await initSqlJs({
      locateFile: (file) => {
        // �b�Ͳ����Ҥ��Awasm ������Ӧb resources �ؿ�
        if (app.isPackaged) {
          return path.join(process.resourcesPath, 'sql-wasm.wasm');
        }
        // �}�o���Ҥ��A�q node_modules �[��
        // __dirname �b�sĶ��O dist/main/database�A�ݭn�^��ڥؿ�
        return path.join(__dirname, '../../../node_modules/sql.js/dist', file);
      },
    });

    // ��Ʈw�����|
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'contract_risk.db');

    // �T�O�ؿ��s�b
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // �[���γЫظ�Ʈw
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log(`Database loaded from: ${dbPath}`);
    } else {
      db = new SQL.Database();
      console.log('New database created in memory');
    }

    // �ҥΥ~�����
    db.run('PRAGMA foreign_keys = ON');
    
    // 設置 UTF-8 編碼
    db.run('PRAGMA encoding = "UTF-8"');

    // �Ыت����c
    createTables();

    // 執行資料庫遷移
    migrateDatabase();

    // ��l�ƹw�]���
    initializeDefaultData();

    // �O�s��Ϻ�
    saveDatabase();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * �Ыظ�Ʈw�����c
 */
function createTables(): void {
  if (!db) throw new Error('Database not initialized');

  // �Τ��
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
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
    )
  `);

  // ���ت�
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      password_hash TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    )
  `);

  // ���ɪ�
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    )
  `);

  // ���ڪ�
  db.run(`
    CREATE TABLE IF NOT EXISTS clauses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      clause_number TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      parent_id INTEGER REFERENCES clauses(id),
      order_index INTEGER DEFAULT 0,
      page_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ���I�W�h��
  db.run(`
    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
      keywords TEXT NOT NULL,
      pattern TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ���I�˴����G��
  db.run(`
    CREATE TABLE IF NOT EXISTS risk_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clause_id INTEGER NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
      rule_id INTEGER NOT NULL REFERENCES risk_rules(id),
      risk_level TEXT NOT NULL CHECK(risk_level IN ('high', 'medium', 'low')),
      matched_text TEXT NOT NULL,
      suggestion TEXT,
      user_adjusted_level TEXT CHECK(user_adjusted_level IN ('high', 'medium', 'low')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // �f�p��x��
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ���ɪ�����
  db.run(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(document_id, version_number)
    )
  `);

  // ���Ѫ�
  db.run(`
    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clause_id INTEGER NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('comment', 'suggestion', 'question', 'issue')),
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'resolved', 'deleted')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // �Ыد���
  db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
  db.run('CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_clauses_document ON clauses(document_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_risk_matches_clause ON risk_matches(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_risk_matches_level ON risk_matches(risk_level)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_clause ON annotations(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_user ON annotations(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_status ON annotations(status)');
}

/**
 * ��l�ƹw�]���
 */
function initializeDefaultData(): void {
  if (!db) throw new Error('Database not initialized');

  // �ˬd�O�_�w���޲z���Τ�
  const result = db.exec('SELECT id FROM users WHERE username = ?', ['admin']);
  const adminExists = result.length > 0 && result[0].values.length > 0;

  if (!adminExists) {
    // �Ыعw�]�޲z���b���]�K�X: Admin@123�^
    const passwordHash = bcrypt.hashSync('Admin@123', 10);

    db.run(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES (?, ?, ?, ?)`,
      ['admin', passwordHash, '�t�κ޲z��', 'admin']
    );

    console.log('Default admin user created (username: admin, password: Admin@123)');
  }

  // �ˬd�O�_�w�����q�Τ� user1
  const user1Result = db.exec('SELECT id FROM users WHERE username = ?', ['user1']);
  const user1Exists = user1Result.length > 0 && user1Result[0].values.length > 0;

  if (!user1Exists) {
    // �Ыش��մ��q�Τ�]�K�X: User@123�^
    const passwordHash = bcrypt.hashSync('User@123', 10);

    db.run(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES (?, ?, ?, ?)`,
      ['user1', passwordHash, '���եΤ�', 'user']
    );

    console.log('Default user1 created (username: user1, password: User@123)');
  }

  // �ˬd�O�_�w�����եΤ� test
  const testResult = db.exec('SELECT id FROM users WHERE username = ?', ['test']);
  const testExists = testResult.length > 0 && testResult[0].values.length > 0;

  if (!testExists) {
    // �Ыش��եΤ�]�K�X: Test@123�^
    const passwordHash = bcrypt.hashSync('Test@123', 10);

    db.run(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES (?, ?, ?, ?)`,
      ['test', passwordHash, '���եΤ�', 'user']
    );

    console.log('Default test user created (username: test, password: Test@123)');
  }

  // �ˬd�O�_�w�����I�W�h
  const rulesResult = db.exec('SELECT COUNT(*) as count FROM risk_rules');
  const rulesCount =
    rulesResult.length > 0 && rulesResult[0].values.length > 0
      ? rulesResult[0].values[0][0]
      : 0;

  if (rulesCount === 0) {
    // ���J�w�]���I�W�h
    const defaultRules = [
      {
        name: '�L���s�a�d��',
        description: '�˴��i��A�εL���s�a�d��������',
        risk_level: 'high',
        keywords: JSON.stringify(['�L���s�a', '�s�a�d��', '���i�M�P��O']),
        pattern: '(�L���s�a|�s�a�d��|���i�M�P��O)',
      },
      {
        name: '�H���g�@',
        description: '�˴��A�ιH���g�@������',
        risk_level: 'high',
        keywords: JSON.stringify(['�H����', '�g�@��', '���v�H��']),
        pattern: '(�H����|�g�@��|���v�H��)',
      },
      {
        name: '��ĳ�ѨM����',
        description: '�˴���ĳ�ѨM�����������',
        risk_level: 'medium',
        keywords: JSON.stringify(['��ĳ�ѨM', '�������', '���Ҫk�|']),
        pattern: '(��ĳ�ѨM|�������|���Ҫk�|)',
      },
      {
        name: '�X�P�פ��v',
        description: '�˴��A�ΦX�P�פ��v������',
        risk_level: 'medium',
        keywords: JSON.stringify(['�פ�X�P', '�Ѱ�', '�X�P�פ�']),
        pattern: '(�פ�X�P|�Ѱ�|�X�P�פ�)',
      },
      {
        name: '�O�K�q�Ⱦ���',
        description: '�˴��O�K�q�Ⱦ����������',
        risk_level: 'low',
        keywords: JSON.stringify(['�O�K�q��', '�O�K����', '�ӷ~���K']),
        pattern: '(�O�K�q��|�O�K����|�ӷ~���K)',
      },
    ];

    for (const rule of defaultRules) {
      db.run(
        `INSERT INTO risk_rules (name, description, risk_level, keywords, pattern)
         VALUES (?, ?, ?, ?, ?)`,
        [rule.name, rule.description, rule.risk_level, rule.keywords, rule.pattern]
      );
    }

    console.log(`${defaultRules.length} default risk rules created`);
  }
}

/**
 * �O�s��Ʈw��Ϻ�
 */
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

/**
 * ������Ʈw�s��
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * �����Ʈw���|
 */
export function getDatabasePath(): string {
  return dbPath;
}

/**
 * ��Ʈw�E���G�K�[�ʥ������
 */
function migrateDatabase(): void {
  if (!db) throw new Error('Database not initialized');

  try {
    // �ˬd clauses ��O�_�� updated_at ���
    const tableInfo = db.exec("PRAGMA table_info(clauses)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(row => row[1]); // ���W�٦b�ĤG�C
      
      if (!columns.includes('updated_at')) {
        console.log('Adding updated_at column to clauses table...');
        db.run('ALTER TABLE clauses ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        console.log('Migration completed: updated_at column added to clauses table');
      }
    }
  } catch (error) {
    console.error('Database migration failed:', error);
    // ���ߥX���~�A�������~��B��
  }
}
