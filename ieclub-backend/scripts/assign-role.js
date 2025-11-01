#!/usr/bin/env node
// ieclub-backend/scripts/assign-role.js
// 为用户分配角色的命令行工具

const { PrismaClient } = require('@prisma/client');
const rbacService = require('../src/services/rbacService');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

async function assignRole() {
  try {
    // 从命令行参数获取邮箱和角色名
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('\n使用方法:');
      console.log('  node scripts/assign-role.js <user_email> <role_name>\n');
      console.log('示例:');
      console.log('  node scripts/assign-role.js admin@sustech.edu.cn super_admin');
      console.log('  node scripts/assign-role.js user@sustech.edu.cn moderator\n');
      console.log('可用角色:');
      console.log('  - super_admin  (超级管理员)');
      console.log('  - admin        (管理员)');
      console.log('  - moderator    (版主)');
      console.log('  - vip          (VIP用户)');
      console.log('  - user         (普通用户)\n');
      process.exit(1);
    }

    const [email, roleName] = args;

    console.log('\n==========================================');
    console.log('   分配角色');
    console.log('==========================================\n');

    // 查找用户
    console.log(`🔍 查找用户: ${email}...`);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ 用户不存在: ${email}\n`);
      process.exit(1);
    }

    console.log(`✅ 找到用户: ${user.nickname} (${user.id})\n`);

    // 查找角色
    console.log(`🔍 查找角色: ${roleName}...`);
    const role = await prisma.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      console.error(`❌ 角色不存在: ${roleName}`);
      console.log('\n可用角色列表:');
      const roles = await rbacService.getAllRoles();
      roles.forEach(r => {
        console.log(`  - ${r.name} (${r.displayName})`);
      });
      console.log('');
      process.exit(1);
    }

    console.log(`✅ 找到角色: ${role.displayName} (${role.id})\n`);

    // 检查用户是否已有该角色
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id
        }
      }
    });

    if (existingRole) {
      console.log(`⚠️  用户已拥有角色: ${role.displayName}\n`);
      process.exit(0);
    }

    // 分配角色
    console.log(`📝 分配角色...`);
    await rbacService.assignRoleToUser(user.id, role.id);

    console.log(`✅ 成功为用户 ${user.nickname} 分配角色: ${role.displayName}\n`);

    // 显示用户当前的所有角色
    const userRoles = await rbacService.getUserRoles(user.id);
    console.log(`用户当前角色 (${userRoles.length}):`);
    userRoles.forEach(r => {
      console.log(`  - ${r.displayName} (${r.name})`);
    });

    console.log('\n==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 分配角色失败:', error.message);
    logger.error('分配角色失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
assignRole();

