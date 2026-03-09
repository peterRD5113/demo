const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'Contract Risk Management', 'contract_risk.db');

async function fixRiskRules() {
  const SQL = await initSqlJs();
  
  // 檢查資料庫是否存在
  if (!fs.existsSync(dbPath)) {
    console.log('Database does not exist yet. Please start the app first to create it.');
    return;
  }
  
  const db = new SQL.Database(fs.readFileSync(dbPath));
  
  // 刪除舊的風險規則
  db.run('DELETE FROM risk_rules');
  
  // 插入支持繁體、簡體、英文的風險規則
  const rules = [
    {
      name: '違約金條款',
      description: '檢測涉及違約金、懲罰性賠償的高風險條款',
      risk_level: 'high',
      keywords: JSON.stringify(['違約金', '违约金', 'penalty', 'liquidated damages']),
      pattern: '(違約金|违约金|懲罰|惩罚|賠償.*損失|赔偿.*损失|penalty|liquidated damages|punitive)'
    },
    {
      name: '解除合同權',
      description: '檢測單方解除合同權利的高風險條款',
      risk_level: 'high',
      keywords: JSON.stringify(['解除合同', '解除合同', 'terminate', 'termination']),
      pattern: '(解除合同|解除合同|終止|终止|暫停.*開發|暂停.*开发|terminate|termination|suspend)'
    },
    {
      name: '知識產權歸屬',
      description: '檢測知識產權歸屬相關的中風險條款',
      risk_level: 'medium',
      keywords: JSON.stringify(['知識產權', '知识产权', 'intellectual property', 'IP']),
      pattern: '(知識產權|知识产权|版權|版权|專利|专利|著作權|著作权|intellectual property|copyright|patent|IP rights)'
    },
    {
      name: '保密義務',
      description: '檢測保密義務相關的中風險條款',
      risk_level: 'medium',
      keywords: JSON.stringify(['保密', 'confidential', 'NDA']),
      pattern: '(保密|商業秘密|商业秘密|技術秘密|技术秘密|confidential|trade secret|proprietary|NDA)'
    },
    {
      name: '爭議解決',
      description: '檢測爭議解決機制的中風險條款',
      risk_level: 'medium',
      keywords: JSON.stringify(['仲裁', '仲裁', 'arbitration', 'dispute']),
      pattern: '(仲裁|訴訟|诉讼|管轄|管辖|爭議.*解決|争议.*解决|arbitration|litigation|jurisdiction|dispute resolution)'
    },
    {
      name: '付款條款',
      description: '檢測付款方式、期限相關的中風險條款',
      risk_level: 'medium',
      keywords: JSON.stringify(['付款', '支付', 'payment']),
      pattern: '(付款|支付|預付款|预付款|尾款|payment|prepayment|milestone)'
    },
    {
      name: '不可抗力',
      description: '檢測不可抗力相關的低風險條款',
      risk_level: 'low',
      keywords: JSON.stringify(['不可抗力', 'force majeure']),
      pattern: '(不可抗力|天災|天灾|戰爭|战争|疫情|force majeure|act of god|pandemic)'
    },
    {
      name: '合同目的與定義',
      description: '檢測合同目的、總則、定義等低風險條款',
      risk_level: 'low',
      keywords: JSON.stringify(['合同目的', '总则', 'purpose', 'definitions']),
      pattern: '(合同目的|總則|总则|定義|定义|本合同旨在|purpose|definitions|whereas|recitals)'
    }
  ];
  
  for (const rule of rules) {
    db.run(
      `INSERT INTO risk_rules (name, description, risk_level, keywords, pattern, is_enabled)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [rule.name, rule.description, rule.risk_level, rule.keywords, rule.pattern]
    );
  }
  
  // 保存資料庫
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  
  console.log('✅ Risk rules fixed successfully!');
  console.log(`Inserted ${rules.length} rules (支持繁體/簡體/英文):`);
  rules.forEach(r => console.log(`  - ${r.name} (${r.risk_level})`));
  
  db.close();
}

fixRiskRules().catch(console.error);
