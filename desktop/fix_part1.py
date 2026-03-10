# -*- coding: utf-8 -*-
# Part 1: Write connection.ts header + createTables
f = open(r'C:\Users\fortu\Desktop\Project\Demo\desktop\src\main\database\connection.ts', 'w', encoding='utf-8')

part1 = """
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
    version_number INTEGER NOT NULL, content TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    comment TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(document_id, version_number)
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
  db.run('CREATE INDEX IF NOT EXISTS idx_clauses_document ON clauses(document_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_risk_matches_clause ON risk_matches(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_annotations_clause ON annotations(clause_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id)');
}
""".lstrip()

f.write(part1)
f.close()
print('Part1 written:', len(part1), 'chars')
