#!/usr/bin/env node
// scripts/check-health.js - 后端健康检查脚本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBackend() {
  console.log('🔍 开始检查后端状态...\n');
  
  // 1. 检查数据库连接
  console.log('1️⃣  检查数据库连接...');
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('   请检查 DATABASE_URL 环境变量');
    console.error('   运行: docker-compose up -d mysql\n');
    process.exit(1);
  }
  
  // 2. 检查表是否存在
  console.log('2️⃣  检查数据库表...');
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ User 表存在，共 ${userCount} 条记录`);
    
    const topicCount = await prisma.topic.count();
    console.log(`✅ Topic 表存在，共 ${topicCount} 条记录`);
    
    const activityCount = await prisma.activity.count();
    console.log(`✅ Activity 表存在，共 ${activityCount} 条记录\n`);
  } catch (error) {
    console.error('❌ 数据库表检查失败:', error.message);
    console.error('   请运行: npm run prisma:push\n');
    process.exit(1);
  }
  
  // 3. 检查环境变量
  console.log('3️⃣  检查环境变量...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const optionalEnvVars = [
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
    'REDIS_HOST'
  ];
  
  let missingRequired = [];
  let missingOptional = [];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} 已配置`);
    } else {
      console.log(`❌ ${varName} 未配置（必需）`);
      missingRequired.push(varName);
    }
  });
  
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} 已配置`);
    } else {
      console.log(`⚠️  ${varName} 未配置（可选）`);
      missingOptional.push(varName);
    }
  });
  
  if (missingRequired.length > 0) {
    console.log(`\n❌ 缺少 ${missingRequired.length} 个必需的环境变量\n`);
    process.exit(1);
  } else if (missingOptional.length > 0) {
    console.log(`\n⚠️  缺少 ${missingOptional.length} 个可选的环境变量（某些功能可能不可用）\n`);
  } else {
    console.log('\n✅ 所有环境变量都已配置\n');
  }
  
  // 4. 测试查询
  console.log('4️⃣  测试数据库查询...');
  try {
    const activities = await prisma.activity.findMany({
      take: 1,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });
    console.log(`✅ Activity 查询成功，返回 ${activities.length} 条记录`);
    
    const topics = await prisma.topic.findMany({
      take: 1,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });
    console.log(`✅ Topic 查询成功，返回 ${topics.length} 条记录\n`);
  } catch (error) {
    console.error('❌ 数据库查询失败:', error.message);
    console.error('   错误详情:', error);
  }
  
  await prisma.$disconnect();
  console.log('🎉 后端健康检查完成！');
  console.log('\n📝 下一步:');
  console.log('   1. 启动后端: npm run dev');
  console.log('   2. 访问健康检查: http://localhost:3000/health');
  console.log('   3. 访问 API 测试: http://localhost:3000/api/test\n');
}

checkBackend().catch(error => {
  console.error('💥 检查过程出错:', error);
  process.exit(1);
});

