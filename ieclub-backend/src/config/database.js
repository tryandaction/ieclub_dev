// src/config/database.js
// Prisma 客户端单例实例

const { PrismaClient } = require('@prisma/client');

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

