// src/config/database.js
// Prisma 客户端单例实例（优化版）

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// 创建 Prisma 客户端实例，添加连接池优化
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
  // 连接池优化配置
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // 查询引擎优化
  errorFormat: 'minimal',
});

// 连接成功日志
prisma.$connect()
  .then(() => {
    logger.info('✅ 数据库连接成功');
  })
  .catch((error) => {
    logger.error('❌ 数据库连接失败:', error);
    process.exit(1);
  });

// 优雅关闭 - 支持多种退出信号
const gracefulShutdown = async (signal) => {
  logger.info(`收到 ${signal} 信号，正在关闭数据库连接...`);
  try {
    await prisma.$disconnect();
    logger.info('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    logger.error('关闭数据库连接时出错:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

