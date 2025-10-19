// ieclub-backend/scripts/check-db.js - 数据库检查脚本
const { PrismaClient } = require('@prisma/client');
const logger = require('../src/utils/logger');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库状态...\n');

    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接正常\n');

    // 查询所有表
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${process.env.DB_NAME || 'ieclub'}
    `;

    console.log('📋 现有表格:');
    if (tables.length === 0) {
      console.log('  ❌ 没有找到任何表');
    } else {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`);
      });
    }

    // 检查必需的表
    const requiredTables = [
      'users', 'posts', 'comments', 'likes',
      'bookmarks', 'notifications', 'events',
      'event_registrations', 'user_connections'
    ];

    console.log('\n🔍 检查必需表格:');
    const existingTableNames = tables.map(t => t.table_name);

    requiredTables.forEach(tableName => {
      const exists = existingTableNames.includes(tableName);
      const status = exists ? '✅' : '❌';
      console.log(`  ${status} ${tableName}`);
    });

    // 检查索引
    console.log('\n🔍 检查重要索引:');
    const indexes = await prisma.$queryRaw`
      SELECT table_name, index_name, column_name
      FROM information_schema.statistics
      WHERE table_schema = ${process.env.DB_NAME || 'ieclub'}
      AND table_name IN ('posts', 'notifications', 'likes')
      ORDER BY table_name, index_name
    `;

    const indexesByTable = {};
    indexes.forEach(idx => {
      const tableName = idx.table_name;
      if (!indexesByTable[tableName]) {
        indexesByTable[tableName] = [];
      }
      indexesByTable[tableName].push(idx.index_name);
    });

    Object.keys(indexesByTable).forEach(tableName => {
      console.log(`  ${tableName}: ${[...new Set(indexesByTable[tableName])].length} 个索引`);
    });

    console.log('\n✅ 数据库检查完成');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库检查失败:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();