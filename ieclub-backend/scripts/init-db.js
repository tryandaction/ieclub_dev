// ieclub-backend/scripts/init-db.js - 数据库初始化脚本
const { PrismaClient } = require('@prisma/client');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🔄 开始初始化数据库...');

    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 检查数据库中是否有表
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${process.env.DB_NAME || 'ieclub'}
    `;

    console.log(`📋 发现 ${tables.length} 个表`);

    // 如果没有表，提示用户运行迁移
    if (tables.length === 0) {
      console.log('⚠️ 数据库中没有表，请先运行迁移脚本：');
      console.log('npm run db:migrate');
      console.log('或者使用 Sequelize CLI：');
      console.log('npx sequelize-cli db:migrate');
    } else {
      console.log('✅ 数据库表已存在');
    }

    console.log('✅ 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();