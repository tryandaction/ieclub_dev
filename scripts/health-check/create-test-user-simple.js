#!/usr/bin/env node
/**
 * 创建测试用户脚本 (简化版)
 * 用途: 在服务器后端目录中创建初始测试用户
 * 使用: 将此文件复制到 ieclub-backend 目录，然后运行 node create-test-user-simple.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('\n=== 创建测试用户 ===');
  
  const email = 'admin@sustech.edu.cn';
  const password = 'Test123456';
  const nickname = 'Admin';

  console.log(`Email: ${email}`);
  console.log(`Nickname: ${nickname}`);
  console.log();

  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  用户已存在，跳过创建');
      console.log('用户信息:', {
        id: existingUser.id,
        email: existingUser.email,
        nickname: existingUser.nickname,
        status: existingUser.status
      });
      console.log('\n您可以使用以下凭据登录:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      await prisma.$disconnect();
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
        avatar: '',
        level: 1,
        points: 0,
        isCertified: false,
        status: 'active',
        role: 'USER'
      }
    });

    console.log('✅ 用户创建成功:');
    console.log({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      status: user.status
    });

    console.log('\n您现在可以使用以下凭据登录:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ 创建用户失败:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n💡 提示: 用户可能已存在，请检查数据库');
    } else if (error.code === 'P2003') {
      console.log('\n💡 提示: 数据库关联错误，请检查schema');
    } else {
      console.log('\n详细错误:', error);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
createTestUser()
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

