// 简化的服务器启动文件（测试环境）
const fs = require('fs');
const path = require('path');

// 确保使用.env.staging
const stagingEnv = path.join(__dirname, '.env.staging');
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(stagingEnv)) {
  fs.copyFileSync(stagingEnv, envFile);
  console.log('✓ 已加载 .env.staging 配置');
}

require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { getRedis } = require('./src/utils/redis');
const { fullStartupCheck } = require('./src/utils/startupCheck');

async function startServer() {
  try {
    await fullStartupCheck();
    
    const redis = getRedis();
    await redis.ping();
    logger.info('Redis 连接正常');

    const server = app.listen(config.port, () => {
      logger.info(`🚀 IEclub 测试环境后端服务已启动`);
      logger.info(`📍 监听端口: ${config.port}`);
      logger.info(`🌍 环境: ${config.env}`);
      logger.info(`🔗 API 地址: http://localhost:${config.port}/api`);
      logger.info(`💊 健康检查: http://localhost:${config.port}/health`);
    });

    // 注意：测试环境暂时禁用WebSocket和定时任务
    logger.info('⚠️  WebSocket和定时任务在测试环境中已禁用');

    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.port === 'string'
        ? 'Pipe ' + config.port
        : 'Port ' + config.port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} 需要管理员权限`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} 已被占用`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号,开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('HTTP 服务器已关闭');
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          await prisma.$disconnect();
          logger.info('数据库连接已关闭');

          await redis.quit();
          logger.info('Redis 连接已关闭');

          process.exit(0);
        } catch (error) {
          logger.error('关闭连接时出错:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

