#!/usr/bin/env node
/**
 * 设置管理员邮箱脚本
 * 用于确保指定邮箱在测试环境可用且为管理员
 */

// 尝试加载测试环境配置，如果不存在则使用默认 .env
const path = require('path');
const fs = require('fs');
const stagingEnvPath = path.resolve(__dirname, '../.env.staging');
const defaultEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(stagingEnvPath)) {
  require('dotenv').config({ path: stagingEnvPath });
  console.log('📋 使用测试环境配置: .env.staging');
} else if (fs.existsSync(defaultEnvPath)) {
  require('dotenv').config({ path: defaultEnvPath });
  console.log('📋 使用默认配置: .env');
} else {
  require('dotenv').config();
  console.log('📋 使用系统环境变量');
}

const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  getRolePermissions,
  ADMIN_ROLES,
} = require('../src/utils/adminAuth');

let prisma = new PrismaClient();

const TARGET_EMAIL = '12310203@mail.sustech.edu.cn';

async function main() {
  try {
    console.log('\n🔧 开始设置管理员邮箱...\n');
    console.log(`目标邮箱: ${TARGET_EMAIL}\n`);
    console.log('='.repeat(60));

    // 1. 检查数据库连接
    console.log('\n1️⃣  检查数据库连接...');
    try {
      await prisma.$connect();
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      process.exit(1);
    }

    // 2. 检查 EmailWhitelist 表是否存在
    console.log('\n2️⃣  检查 EmailWhitelist 表...');
    try {
      // 检查 Prisma 客户端是否有 emailWhitelist 模型
      if (!prisma.emailWhitelist) {
        console.log('⚠️  Prisma 客户端中未找到 emailWhitelist 模型');
        console.log('   可用的模型:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')).join(', '));
        console.log('   尝试重新生成 Prisma 客户端...');
        const { execSync } = require('child_process');
        execSync('npx prisma generate', { 
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '..')
        });
        // 重新加载 Prisma 客户端
        delete require.cache[require.resolve('@prisma/client')];
        const { PrismaClient: NewPrismaClient } = require('@prisma/client');
        const newPrisma = new NewPrismaClient();
        await newPrisma.$connect();
        prisma = newPrisma;
      }
      await prisma.emailWhitelist.findFirst();
      console.log('✅ EmailWhitelist 表存在');
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist') || error.message.includes('Unknown table')) {
        console.log('⚠️  EmailWhitelist 表不存在，需要运行数据库迁移');
        console.log('   正在尝试自动创建表...');
        try {
          // 尝试使用 db push 创建表
          const { execSync } = require('child_process');
          execSync('npx prisma db push --accept-data-loss', { 
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '..')
          });
          console.log('✅ 数据库迁移完成，EmailWhitelist 表已创建');
        } catch (pushError) {
          console.log('❌ 自动迁移失败，请手动运行:');
          console.log('   npx prisma db push');
          console.log('   或: npx prisma migrate dev');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    // 3. 检查该邮箱是否已经是管理员
    console.log('\n3️⃣  检查管理员状态...');
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (existingAdmin) {
      console.log('✅ 该邮箱已经是管理员');
      console.log(`   用户名: ${existingAdmin.username}`);
      console.log(`   角色: ${existingAdmin.role}`);
      console.log(`   状态: ${existingAdmin.status}`);

      // 确保是超级管理员
      if (existingAdmin.role !== 'super_admin') {
        console.log('\n⚠️  当前角色不是超级管理员，正在升级...');
        const permissions = getRolePermissions('super_admin');
        await prisma.admin.update({
          where: { email: TARGET_EMAIL },
          data: {
            role: 'super_admin',
            permissions: JSON.stringify(permissions),
            status: 'active',
          },
        });
        console.log('✅ 已升级为超级管理员');
      } else {
        console.log('✅ 已经是超级管理员');
      }

      // 确保状态是 active
      if (existingAdmin.status !== 'active') {
        console.log('\n⚠️  管理员状态不是 active，正在激活...');
        await prisma.admin.update({
          where: { email: TARGET_EMAIL },
          data: { status: 'active' },
        });
        console.log('✅ 已激活管理员账号');
      }
    } else {
      console.log('⚠️  该邮箱还不是管理员，正在创建...');

      // 创建管理员账号
      const username = TARGET_EMAIL.split('@')[0]; // 使用邮箱前缀作为用户名
      const defaultPassword = 'Admin@123456'; // 默认密码，建议首次登录后修改

      // 检查用户名是否已存在
      let finalUsername = username;
      let counter = 1;
      while (await prisma.admin.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      const hashedPassword = await hashPassword(defaultPassword);
      const permissions = getRolePermissions('super_admin');

      const newAdmin = await prisma.admin.create({
        data: {
          username: finalUsername,
          email: TARGET_EMAIL,
          password: hashedPassword,
          role: 'super_admin',
          permissions: JSON.stringify(permissions),
          status: 'active',
        },
      });

      console.log('✅ 管理员创建成功！');
      console.log(`   用户名: ${newAdmin.username}`);
      console.log(`   邮箱: ${newAdmin.email}`);
      console.log(`   角色: ${newAdmin.role}`);
      console.log(`   默认密码: ${defaultPassword}`);
      console.log('\n⚠️  请尽快登录并修改默认密码！');
    }

    // 4. 检查该邮箱是否在用户表中（用于测试环境注册）
    console.log('\n4️⃣  检查用户账号状态...');
    const existingUser = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (existingUser) {
      console.log('✅ 该邮箱已注册为用户');
      console.log(`   用户ID: ${existingUser.id}`);
      console.log(`   昵称: ${existingUser.nickname}`);
      console.log(`   状态: ${existingUser.status}`);
    } else {
      console.log('ℹ️  该邮箱尚未注册为用户');
      console.log('   可以在测试环境使用该邮箱注册');
      console.log('   学校邮箱（mail.sustech.edu.cn）可以直接注册，无需白名单');
    }

    // 5. 检查白名单状态（虽然学校邮箱不需要，但可以确认）
    console.log('\n5️⃣  检查邮箱白名单状态...');
    const whitelistEntry = await prisma.emailWhitelist.findUnique({
      where: { email: TARGET_EMAIL.toLowerCase() },
    });

    if (whitelistEntry) {
      console.log('ℹ️  该邮箱在白名单中');
      console.log(`   状态: ${whitelistEntry.status}`);
    } else {
      console.log('ℹ️  该邮箱不在白名单中（学校邮箱不需要白名单）');
    }

    // 6. 总结
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ 设置完成！\n');
    console.log('📋 总结:');
    console.log(`   ✅ 邮箱 ${TARGET_EMAIL} 已设置为超级管理员`);
    console.log(`   ✅ 可以在测试环境使用该邮箱登录管理后台`);
    console.log(`   ✅ 学校邮箱可以直接注册，无需白名单`);
    console.log('\n🔗 登录信息:');
    console.log(`   管理后台: https://test.ieclub.online/admin`);
    console.log(`   邮箱: ${TARGET_EMAIL}`);
    if (!existingAdmin) {
      console.log(`   默认密码: Admin@123456`);
      console.log(`   ⚠️  请尽快登录并修改密码！`);
    } else {
      console.log(`   密码: [使用您之前设置的密码]`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ 设置失败:', error.message);
    if (error.stack) {
      console.error('\n详细错误:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

