#!/usr/bin/env node
// ieclub-backend/scripts/init-rbac.js
// 初始化 RBAC 系统：创建默认角色和权限

const rbacService = require('../src/services/rbacService');
const logger = require('../src/utils/logger');

async function initRBAC() {
  try {
    console.log('==========================================');
    console.log('   IEclub RBAC 系统初始化');
    console.log('==========================================\n');

    console.log('开始初始化默认角色和权限...\n');

    // 执行初始化
    await rbacService.initializeDefaultRolesAndPermissions();

    console.log('\n✅ RBAC 系统初始化完成！\n');

    // 显示创建的角色
    console.log('📋 已创建的角色:');
    const roles = await rbacService.getAllRoles();
    for (const role of roles) {
      console.log(`   - ${role.displayName} (${role.name}): ${role.permissions.length} 个权限`);
    }

    console.log('\n💡 使用提示:');
    console.log('   1. 为用户分配角色:');
    console.log('      POST /api/rbac/users/:userId/roles');
    console.log('      { "roleId": "<role_id>" }\n');
    
    console.log('   2. 查看所有权限:');
    console.log('      GET /api/rbac/permissions\n');
    
    console.log('   3. 创建自定义角色:');
    console.log('      POST /api/rbac/roles');
    console.log('      { "name": "custom_role", "displayName": "自定义角色", "permissions": [...] }\n');

    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    logger.error('RBAC 初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initRBAC();

