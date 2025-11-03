// server-staging-simple.js - 简化版测试环境服务器
const path = require('path');

// 加载环境变量
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env.staging') 
});

const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

console.log('======================================');
console.log('Starting IEClub Staging Server (Simple Mode)');
console.log('======================================');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('');

// 健康检查
app.get('/health', (req, res) => {
  res.send('healthy');
});

// API 健康检查
app.get('/api/health', async (req, res) => {
  try {
    // 测试数据库
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    // 测试 Redis
    const { getRedis } = require('./utils/redis');
    const redis = getRedis();
    await redis.ping();
    
    res.json({
      status: 'healthy',
      environment: 'staging',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        redis: 'ok'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log('');
  console.log('======================================');
  console.log('Server Started Successfully!');
  console.log('======================================');
  console.log(`HTTP: http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`API Health: http://localhost:${port}/api/health`);
  console.log('');
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

