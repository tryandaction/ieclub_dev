#!/usr/bin/env node
// ieclub-backend/scripts/quick-setup.js
// 快速设置脚本：检查环境、创建 .env、运行迁移、初始化 RBAC

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n==========================================');
console.log('   IEclub 快速设置向导');
console.log('==========================================\n');

// 1. 检查 .env 文件
console.log('📝 步骤 1/5: 检查环境变量配置...');
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  未找到 .env 文件');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 从 .env.example 创建 .env 文件...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env 文件已创建');
    console.log('\n⚠️  请编辑 .env 文件，配置数据库连接等信息');
    console.log('   特别是 DATABASE_URL 和 JWT_SECRET\n');
    process.exit(0);
  } else {
    console.error('❌ 未找到 .env.example 文件');
    process.exit(1);
  }
} else {
  console.log('✅ .env 文件已存在\n');
}

// 2. 检查数据库连接
console.log('🔍 步骤 2/5: 检查数据库连接...');
try {
  execSync('npx prisma db pull --force', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  console.log('✅ 数据库连接成功\n');
} catch (error) {
  console.error('❌ 数据库连接失败');
  console.error('   请确保：');
  console.error('   1. MySQL 服务已启动');
  console.error('   2. .env 中的 DATABASE_URL 配置正确');
  console.error('   3. 数据库已创建\n');
  console.error('错误信息:', error.message);
  process.exit(1);
}

// 3. 运行数据库迁移
console.log('🔄 步骤 3/5: 运行数据库迁移...');
try {
  execSync('npx prisma migrate deploy', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ 数据库迁移完成\n');
} catch (error) {
  console.error('❌ 数据库迁移失败');
  console.error('错误信息:', error.message);
  process.exit(1);
}

// 4. 生成 Prisma Client
console.log('⚙️  步骤 4/5: 生成 Prisma Client...');
try {
  execSync('npx prisma generate', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ Prisma Client 生成完成\n');
} catch (error) {
  console.error('❌ Prisma Client 生成失败');
  console.error('错误信息:', error.message);
  process.exit(1);
}

// 5. 初始化 RBAC
console.log('🔒 步骤 5/5: 初始化 RBAC 系统...');
try {
  execSync('node scripts/init-rbac.js', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log('✅ RBAC 系统初始化完成\n');
} catch (error) {
  console.error('❌ RBAC 初始化失败');
  console.error('错误信息:', error.message);
  process.exit(1);
}

console.log('==========================================');
console.log('   🎉 设置完成！');
console.log('==========================================\n');

console.log('📝 下一步：');
console.log('   1. 为管理员分配角色:');
console.log('      node scripts/assign-role.js your-email@sustech.edu.cn super_admin\n');
console.log('   2. 启动开发服务器:');
console.log('      npm run dev\n');
console.log('   3. 访问 API:');
console.log('      http://localhost:3000/api/v1/health\n');

process.exit(0);

