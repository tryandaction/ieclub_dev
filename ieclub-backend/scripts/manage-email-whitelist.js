#!/usr/bin/env node
/**
 * 邮箱白名单管理脚本
 * 用于测试环境管理邮箱注册白名单
 * 
 * 使用方法:
 *   node scripts/manage-email-whitelist.js list                    # 列出所有白名单
 *   node scripts/manage-email-whitelist.js add <email> [reason]    # 添加邮箱到白名单
 *   node scripts/manage-email-whitelist.js approve <email>         # 批准邮箱
 *   node scripts/manage-email-whitelist.js reject <email> [note]   # 拒绝邮箱
 *   node scripts/manage-email-whitelist.js remove <email>          # 移除邮箱
 *   node scripts/manage-email-whitelist.js pending                 # 查看待处理列表
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.staging') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const command = process.argv[2];
const email = process.argv[3];
const extra = process.argv[4];

async function main() {
  try {
    switch (command) {
      case 'list':
        await listWhitelist();
        break;
      case 'add':
        if (!email) {
          console.error('❌ 错误: 请提供邮箱地址');
          console.log('使用方法: node scripts/manage-email-whitelist.js add <email> [reason]');
          process.exit(1);
        }
        await addToWhitelist(email, extra);
        break;
      case 'approve':
        if (!email) {
          console.error('❌ 错误: 请提供邮箱地址');
          console.log('使用方法: node scripts/manage-email-whitelist.js approve <email>');
          process.exit(1);
        }
        await approveEmail(email);
        break;
      case 'reject':
        if (!email) {
          console.error('❌ 错误: 请提供邮箱地址');
          console.log('使用方法: node scripts/manage-email-whitelist.js reject <email> [note]');
          process.exit(1);
        }
        await rejectEmail(email, extra);
        break;
      case 'remove':
        if (!email) {
          console.error('❌ 错误: 请提供邮箱地址');
          console.log('使用方法: node scripts/manage-email-whitelist.js remove <email>');
          process.exit(1);
        }
        await removeEmail(email);
        break;
      case 'pending':
        await listPending();
        break;
      default:
        console.log(`
📧 邮箱白名单管理工具

使用方法:
  node scripts/manage-email-whitelist.js <command> [options]

命令:
  list                    - 列出所有白名单条目
  add <email> [reason]    - 添加邮箱到白名单（状态: pending）
  approve <email>         - 批准邮箱（状态: approved）
  reject <email> [note]   - 拒绝邮箱（状态: rejected）
  remove <email>          - 移除邮箱（删除记录）
  pending                 - 查看待处理列表

示例:
  node scripts/manage-email-whitelist.js list
  node scripts/manage-email-whitelist.js add test@example.com "测试账号"
  node scripts/manage-email-whitelist.js approve test@example.com
  node scripts/manage-email-whitelist.js reject test@example.com "不符合要求"
  node scripts/manage-email-whitelist.js remove test@example.com
  node scripts/manage-email-whitelist.js pending
        `);
        process.exit(0);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function listWhitelist() {
  const entries = await prisma.emailWhitelist.findMany({
    orderBy: { createdAt: 'desc' }
  });

  if (entries.length === 0) {
    console.log('📭 白名单为空');
    return;
  }

  console.log(`\n📧 邮箱白名单 (共 ${entries.length} 条):\n`);
  console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ 邮箱地址                          │ 状态      │ 创建时间              │');
  console.log('├─────────────────────────────────────────────────────────────────────────────┤');

  entries.forEach(entry => {
    const statusEmoji = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌'
    };
    const statusText = {
      'pending': '待处理',
      'approved': '已批准',
      'rejected': '已拒绝'
    };
    
    const email = entry.email.padEnd(30);
    const status = `${statusEmoji[entry.status] || '❓'} ${statusText[entry.status] || entry.status}`.padEnd(10);
    const createdAt = new Date(entry.createdAt).toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    console.log(`│ ${email} │ ${status} │ ${createdAt} │`);
    
    if (entry.reason) {
      console.log(`│   理由: ${entry.reason.substring(0, 70).padEnd(70)} │`);
    }
    if (entry.note) {
      console.log(`│   备注: ${entry.note.substring(0, 70).padEnd(70)} │`);
    }
  });

  console.log('└─────────────────────────────────────────────────────────────────────────────┘');
}

async function addToWhitelist(email, reason) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // 检查是否已存在
  const existing = await prisma.emailWhitelist.findUnique({
    where: { email: normalizedEmail }
  });

  if (existing) {
    if (existing.status === 'approved') {
      console.log(`✅ 邮箱 ${normalizedEmail} 已在白名单中（已批准）`);
      return;
    }
    
    // 更新状态为pending
    await prisma.emailWhitelist.update({
      where: { email: normalizedEmail },
      data: {
        status: 'pending',
        reason: reason || existing.reason,
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ 已更新邮箱 ${normalizedEmail} 状态为待处理`);
    if (reason) {
      console.log(`   理由: ${reason}`);
    }
    return;
  }

  // 创建新记录
  await prisma.emailWhitelist.create({
    data: {
      email: normalizedEmail,
      status: 'pending',
      reason: reason || null
    }
  });

  console.log(`✅ 已添加邮箱 ${normalizedEmail} 到白名单（状态: 待处理）`);
  if (reason) {
    console.log(`   理由: ${reason}`);
  }
  console.log(`\n💡 提示: 使用 "approve ${normalizedEmail}" 命令批准该邮箱`);
}

async function approveEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  const entry = await prisma.emailWhitelist.findUnique({
    where: { email: normalizedEmail }
  });

  if (!entry) {
    console.error(`❌ 错误: 邮箱 ${normalizedEmail} 不在白名单中`);
    console.log(`💡 提示: 使用 "add ${normalizedEmail}" 命令先添加到白名单`);
    return;
  }

  if (entry.status === 'approved') {
    console.log(`✅ 邮箱 ${normalizedEmail} 已经是已批准状态`);
    return;
  }

  await prisma.emailWhitelist.update({
    where: { email: normalizedEmail },
    data: {
      status: 'approved',
      approvedAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`✅ 已批准邮箱 ${normalizedEmail}`);
  console.log(`   现在该邮箱可以在测试环境注册了`);
}

async function rejectEmail(email, note) {
  const normalizedEmail = email.toLowerCase().trim();
  
  const entry = await prisma.emailWhitelist.findUnique({
    where: { email: normalizedEmail }
  });

  if (!entry) {
    console.error(`❌ 错误: 邮箱 ${normalizedEmail} 不在白名单中`);
    return;
  }

  if (entry.status === 'rejected') {
    console.log(`✅ 邮箱 ${normalizedEmail} 已经是已拒绝状态`);
    return;
  }

  await prisma.emailWhitelist.update({
    where: { email: normalizedEmail },
    data: {
      status: 'rejected',
      note: note || entry.note,
      rejectedAt: new Date(),
      updatedAt: new Date()
    }
  });

  console.log(`❌ 已拒绝邮箱 ${normalizedEmail}`);
  if (note) {
    console.log(`   备注: ${note}`);
  }
}

async function removeEmail(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  const entry = await prisma.emailWhitelist.findUnique({
    where: { email: normalizedEmail }
  });

  if (!entry) {
    console.error(`❌ 错误: 邮箱 ${normalizedEmail} 不在白名单中`);
    return;
  }

  await prisma.emailWhitelist.delete({
    where: { email: normalizedEmail }
  });

  console.log(`✅ 已移除邮箱 ${normalizedEmail} 从白名单`);
}

async function listPending() {
  const entries = await prisma.emailWhitelist.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' }
  });

  if (entries.length === 0) {
    console.log('✅ 没有待处理的邮箱');
    return;
  }

  console.log(`\n⏳ 待处理邮箱 (共 ${entries.length} 条):\n`);
  entries.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.email}`);
    if (entry.reason) {
      console.log(`   理由: ${entry.reason}`);
    }
    console.log(`   申请时间: ${new Date(entry.createdAt).toLocaleString('zh-CN')}`);
    console.log(`   批准命令: node scripts/manage-email-whitelist.js approve ${entry.email}`);
    console.log('');
  });
}

main();

