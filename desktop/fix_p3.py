# -*- coding: utf-8 -*-
out = open(r'C:\Users\fortu\Desktop\Project\Demo\desktop\src\main\database\connection.ts', 'a', encoding='utf-8')

out.write('function initializeDefaultData(): void {\n')
out.write("  if (!db) throw new Error('Database not initialized');\n\n")

# admin user
out.write("  const aC = db.exec('SELECT id FROM users WHERE username = ?', ['admin']);\n")
out.write('  if (!(aC.length > 0 && aC[0].values.length > 0)) {\n')
out.write("    const h = bcrypt.hashSync('Admin@123', 10);\n")
out.write('    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,\n')
out.write("      ['admin', h, '" + '\u7cfb\u7d71\u7ba1\u7406\u54e1' + "', 'admin']);\n")
out.write("    console.log('Default admin user created (username: admin, password: Admin@123)');\n")
out.write('  }\n\n')

# user1
out.write("  const u1C = db.exec('SELECT id FROM users WHERE username = ?', ['user1']);\n")
out.write('  if (!(u1C.length > 0 && u1C[0].values.length > 0)) {\n')
out.write("    const h = bcrypt.hashSync('User@123', 10);\n")
out.write('    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,\n')
out.write("      ['user1', h, '" + '\u666e\u901a\u7528\u6236' + "', 'user']);\n")
out.write("    console.log('Default user1 created (username: user1, password: User@123)');\n")
out.write('  }\n\n')

# test user
out.write("  const tC = db.exec('SELECT id FROM users WHERE username = ?', ['test']);\n")
out.write('  if (!(tC.length > 0 && tC[0].values.length > 0)) {\n')
out.write("    const h = bcrypt.hashSync('Test@123', 10);\n")
out.write('    db.run(`INSERT INTO users (username,password_hash,display_name,role) VALUES (?,?,?,?)`,\n')
out.write("      ['test', h, '" + '\u6e2c\u8a66\u7528\u6236' + "', 'user']);\n")
out.write("    console.log('Default test user created (username: test, password: Test@123)');\n")
out.write('  }\n\n')

# risk rules
out.write("  const rC = db.exec('SELECT COUNT(*) FROM risk_rules');\n")
out.write('  const cnt = rC.length > 0 && rC[0].values.length > 0 ? rC[0].values[0][0] : 0;\n')
out.write('  if (cnt === 0) {\n')
out.write('    type R = {name:string;category:string;description:string;risk_level:string;keywords:string;pattern:string};\n')
out.write('    const rules: R[] = [\n')

rules = [
    ('\u4ed8\u6b3e\u671f\u9650\u904e\u9577', '\u4ed8\u6b3e\u689d\u4ef6', '\u4ed8\u6b3e\u671f\u9650\u8d85\u904e60\u5929\uff0c\u5b58\u5728\u8cc7\u91d1\u98a8\u96aa', 'high', '["\u4ed8\u6b3e","\u652f\u4ed8","\u7d50\u7b97"]', ''),
    ('\u9055\u7d04\u91d1\u6bd4\u4f8b\u904e\u9ad8', '\u9055\u7d04\u8cac\u4efb', '\u9055\u7d04\u91d1\u8d85\u904e30%', 'high', '["\u9055\u7d04\u91d1","\u8ce0\u511f\u91d1","\u7f70\u6b3e"]', ''),
    ('\u7ba1\u8f44\u5730\u4e0d\u5229', '\u7ba1\u8f44\u5730', '\u722d\u8b70\u7ba1\u8f44\u5730\u5c0d\u6211\u65b9\u4e0d\u5229', 'medium', '["\u7ba1\u8f44","\u4ed2\u88c1","\u8a34\u8a1f"]', ''),
    ('\u4fdd\u5bc6\u671f\u9650\u904e\u9577', '\u4fdd\u5bc6\u671f\u9650', '\u4fdd\u5bc6\u671f\u9650\u8d85\u90045\u5e74', 'medium', '["\u4fdd\u5bc6","\u5546\u696d\u79d8\u5bc6"]', ''),
    ('\u81ea\u52d5\u7e8c\u7d04\u689d\u6b3e', '\u81ea\u52d5\u7e8c\u7d04', '\u542b\u6709\u81ea\u52d5\u7e8c\u7d04\u689d\u6b3e', 'high', '["\u81ea\u52d5\u7e8c\u7d04","\u81ea\u52d5\u5ef6\u671f"]', ''),
    ('\u7121\u9650\u8cac\u4efb\u689d\u6b3e', '\u8cac\u4efb\u9650\u5236', '\u672a\u8a2d\u8cac\u4efb\u4e0a\u9650', 'high', '["\u7121\u9650\u8cac\u4efb","\u4e0d\u9650\u8cac\u4efb"]', ''),
    ('\u55ae\u65b9\u89e3\u9664\u6b0a', '\u5408\u540c\u89e3\u9664', '\u55ae\u65b9\u4efb\u610f\u89e3\u9664', 'medium', '["\u55ae\u65b9\u89e3\u9664","\u4efb\u610f\u89e3\u9664"]', ''),
    ('\u77e5\u8b58\u7522\u6b0a\u6b78\u5c6c\u4e0d\u660e', '\u77e5\u8b58\u7522\u6b0a', '\u672a\u660e\u78ba\u77e5\u8b58\u7522\u6b0a\u6b78\u5c6c', 'high', '["\u77e5\u8b58\u7522\u6b0a","\u8457\u4f5c\u6b0a","\u5c08\u5229\u6b0a"]', ''),
]

for r in rules:
    out.write("      {name:'%s',category:'%s',description:'%s',risk_level:'%s',keywords:'%s',pattern:'%s'},\n" % r)

out.write('    ];\n')
out.write('    for (const rule of rules) {\n')
out.write('      db.run(\n')
out.write('        `INSERT INTO risk_rules (name,category,description,risk_level,keywords,pattern) VALUES (?,?,?,?,?,?)`,\n')
out.write('        [rule.name,rule.category,rule.description,rule.risk_level,rule.keywords,rule.pattern]\n')
out.write('      );\n')
out.write('    }\n')
out.write('    console.log(`${rules.length} default risk rules created`);\n')
out.write('  }\n')
out.write('}\n\n')

# saveDatabase
out.write('export function saveDatabase(): void {\n')
out.write("  if (!db) throw new Error('Database not initialized');\n")
out.write('  try {\n')
out.write('    const data = db.export();\n')
out.write('    const buffer = Buffer.from(data);\n')
out.write('    fs.writeFileSync(dbPath, buffer);\n')
out.write('    console.log(`Database saved to: ${dbPath}`);\n')
out.write('  } catch (error) {\n')
out.write("    console.error('Failed to save database:', error);\n")
out.write('    throw error;\n')
out.write('  }\n')
out.write('}\n\n')

# closeDatabase
out.write('export function closeDatabase(): void {\n')
out.write('  if (db) {\n')
out.write('    saveDatabase();\n')
out.write('    db.close();\n')
out.write('    db = null;\n')
out.write("    console.log('Database connection closed');\n")
out.write('  }\n')
out.write('}\n\n')

# getDatabasePath
out.write('export function getDatabasePath(): string {\n')
out.write('  return dbPath;\n')
out.write('}\n\n')

# migrateDatabase
out.write('function migrateDatabase(): void {\n')
out.write("  if (!db) throw new Error('Database not initialized');\n")
out.write('  try {\n')
out.write('    const info = db.exec("PRAGMA table_info(clauses)");\n')
out.write('    if (info.length > 0) {\n')
out.write('      const cols = info[0].values.map((r: any) => r[1]);\n')
out.write("      if (!cols.includes('updated_at')) {\n")
out.write('        db.run("ALTER TABLE clauses ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");\n')
out.write("        console.log('Migration: added updated_at to clauses');\n")
out.write('      }\n')
out.write('    }\n')
out.write('    const rInfo = db.exec("PRAGMA table_info(risk_rules)");\n')
out.write('    if (rInfo.length > 0) {\n')
out.write('      const cols = rInfo[0].values.map((r: any) => r[1]);\n')
out.write("      if (!cols.includes('category')) {\n")
out.write("        db.run(\"ALTER TABLE risk_rules ADD COLUMN category TEXT NOT NULL DEFAULT '" + '\u5176\u4ed6' + "'\");\n")
out.write("        console.log('Migration: added category to risk_rules');\n")
out.write('      }\n')
out.write('    }\n')
out.write('  } catch (error) {\n')
out.write("    console.error('Database migration failed:', error);\n")
out.write('  }\n')
out.write('}\n')

out.close()
print('part3 done')
