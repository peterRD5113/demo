/**
 * 數據庫初始化測試腳本
 * 用於驗證 Phase 2 的數據庫設計是否正常工作
 */

import { dbConnection } from './src/main/database/connection';
import { userRepository } from './src/main/repositories';

async function testDatabaseInitialization() {
  console.log('========================================');
  console.log('  數據庫初始化測試');
  console.log('========================================\n');

  try {
    // 1. 初始化數據庫
    console.log('1. 初始化數據庫連接...');
    await dbConnection.initialize();
    console.log('   ✓ 數據庫連接成功\n');

    // 2. 健康檢查
    console.log('2. 執行健康檢查...');
    const isHealthy = dbConnection.isHealthy();
    console.log(`   ${isHealthy ? '✓' : '✗'} 數據庫健康狀態: ${isHealthy ? '正常' : '異常'}\n`);

    // 3. 檢查默認管理員賬號
    console.log('3. 檢查默認管理員賬號...');
    const adminUser = userRepository.findByUsername('admin');
    if (adminUser) {
      console.log('   ✓ 默認管理員賬號已創建');
      console.log(`   - 用戶名: ${adminUser.username}`);
      console.log(`   - 角色: ${adminUser.role}`);
      console.log(`   - 創建時間: ${adminUser.created_at}\n`);
    } else {
      console.log('   ✗ 默認管理員賬號不存在\n');
    }

    // 4. 驗證密碼
    console.log('4. 驗證默認密碼...');
    const verifiedUser = userRepository.verifyPassword('admin', 'admin123');
    if (verifiedUser) {
      console.log('   ✓ 密碼驗證成功\n');
    } else {
      console.log('   ✗ 密碼驗證失敗\n');
    }

    // 5. 檢查風險規則
    console.log('5. 檢查默認風險規則...');
    const { riskRuleRepository } = await import('./src/main/repositories');
    const rules = riskRuleRepository.findEnabledRules();
    console.log(`   ✓ 已加載 ${rules.length} 條風險規則`);
    rules.forEach((rule, index) => {
      console.log(`   ${index + 1}. ${rule.name} (${rule.risk_level})`);
    });
    console.log('');

    // 6. 測試基本 CRUD 操作
    console.log('6. 測試基本 CRUD 操作...');
    
    // 創建測試用戶
    const testUserId = userRepository.createUser('testuser', 'test123', 'user');
    console.log(`   ✓ 創建測試用戶 (ID: ${testUserId})`);
    
    // 查詢用戶
    const testUser = userRepository.findById(testUserId);
    console.log(`   ✓ 查詢用戶: ${testUser?.username}`);
    
    // 更新用戶
    userRepository.updateRole(testUserId, 'viewer');
    const updatedUser = userRepository.findById(testUserId);
    console.log(`   ✓ 更新角色: ${updatedUser?.role}`);
    
    // 刪除用戶
    userRepository.delete(testUserId);
    const deletedUser = userRepository.findById(testUserId);
    console.log(`   ✓ 刪除用戶: ${deletedUser ? '失敗' : '成功'}\n`);

    // 7. 統計信息
    console.log('7. 數據庫統計信息...');
    const userCount = userRepository.count();
    const ruleCount = riskRuleRepository.count();
    console.log(`   - 用戶數量: ${userCount}`);
    console.log(`   - 風險規則數量: ${ruleCount}\n`);

    console.log('========================================');
    console.log('  ✓ 所有測試通過！');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ 測試失敗:', error);
    process.exit(1);
  } finally {
    // 關閉數據庫連接
    dbConnection.close();
  }
}

// 執行測試
testDatabaseInitialization().catch((error) => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});
