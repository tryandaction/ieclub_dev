#!/usr/bin/env node
/**
 * 验证管理员邮箱脚本
 * 用于验证指定邮箱是否已正确设置为管理员
 */

// 尝试加载测试环境配置
const path = require('path');
const fs = require('fs');
const stagingEnvPath = path.resolve(__dirname, '../.env.staging');
const defaultEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(stagingEnvPath)) {
  require('dotenv').config({ path: stagingEnvPath });
} else if (fs.existsSync(defaultEnvPath)) {
  require('dotenv').config({ path: defaultEnvPath });
} else {
  require('dotenv').config();
}

const { PrismaClient } = require('@prisma/client');
const { ADMIN_ROLES } = require('../src/utils/adminAuth');

const prisma = new PrismaClient();
const TARGET_EMAIL = '12310203@mail.sustech.edu.cn';

async function verify() {
  try {
    console.log('\n🔍 验证管理员邮箱状态...\n');
    console.log(`目标邮箱: ${TARGET_EMAIL}\n`);
    console.log('='.repeat(60));

    let allPassed = true;

    // 1. 检查数据库连接
    console.log('\n1️⃣  检查数据库连接...');
    try {
      await prisma.$connect();
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      allPassed = false;
      process.exit(1);
    }

    // 2. 检查管理员状态
    console.log('\n2️⃣  检查管理员状态...');
    const admin = await prisma.admin.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (!admin) {
      console.log('❌ 该邮箱不是管理员');
      console.log('   请运行: node scripts/setup-admin-email.js');
      allPassed = false;
    } else {
      console.log('✅ 该邮箱是管理员');
      console.log(`   用户名: ${admin.username}`);
      console.log(`   角色: ${admin.role}`);
      console.log(`   状态: ${admin.status}`);

      // 检查角色
      if (admin.role !== 'super_admin') {
        console.log('⚠️  警告: 角色不是超级管理员');
        console.log(`   当前角色: ${admin.role}`);
        console.log('   建议运行: node scripts/manage-admin.js change-role ' + TARGET_EMAIL + ' super_admin');
        allPassed = false;
      } else {
        console.log('✅ 角色正确: 超级管理员');
      }

      // 检查状态
      if (admin.status !== 'active') {
        console.log('⚠️  警告: 管理员状态不是 active');
        console.log(`   当前状态: ${admin.status}`);
        allPassed = false;
      } else {
        console.log('✅ 状态正确: active');
      }
    }

    // 3. 检查用户账号
    console.log('\n3️⃣  检查用户账号状态...');
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (user) {
      console.log('✅ 该邮箱已注册为用户');
      console.log(`   用户ID: ${user.id}`);
      console.log(`   昵称: ${user.nickname}`);
      console.log(`   状态: ${user.status}`);
    } else {
      console.log('ℹ️  该邮箱尚未注册为用户（可以正常注册）');
    }

    // 4. 检查白名单（学校邮箱不需要）
    console.log('\n4️⃣  检查邮箱白名单状态...');
    if (TARGET_EMAIL.includes('mail.sustech.edu.cn') || TARGET_EMAIL.includes('sustech.edu.cn')) {
      console.log('✅ 学校邮箱，无需白名单');
    } else {
      const whitelist = await prisma.emailWhitelist.findUnique({
        where: { email: TARGET_EMAIL.toLowerCase() },
      });

      if (whitelist && whitelist.status === 'approved') {
        console.log('✅ 邮箱在白名单中且已批准');
      } else if (whitelist) {
        console.log(`⚠️  邮箱在白名单中但状态为: ${whitelist.status}`);
        console.log('   需要批准: node scripts/manage-email-whitelist.js approve ' + TARGET_EMAIL);
        allPassed = false;
      } else {
        console.log('⚠️  邮箱不在白名单中（非学校邮箱需要白名单）');
        allPassed = false;
      }
    }

    // 总结
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('\n✅ 验证通过！所有检查项都正常\n');
      console.log('📋 登录信息:');
      console.log(`   管理后台: https://test.ieclub.online/admin`);
      console.log(`   邮箱: ${TARGET_EMAIL}`);
      console.log('');
    } else {
      console.log('\n⚠️  验证未完全通过，请检查上述警告\n');
      console.log('💡 建议操作:');
      console.log('   运行: node scripts/setup-admin-email.js');
      console.log('');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    if (error.stack) {
      console.error('\n详细错误:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();

