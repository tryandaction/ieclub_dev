// src/server.js
// 服务器启动文件
require('dotenv').config();
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { getRedis } = require('./utils/redis');
const { fullStartupCheck } = require('./utils/startupCheck');
const { initActivityReminderJob } = require('./jobs/activityReminderJob');

// 启动服务器
async function startServer() {
  try {
    logger.info('🚀 开始启动 IEclub 后端服务...');
    
    // 测试 Redis 连接（带超时保护）
    try {
      const redis = getRedis();
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000))
      ]);
      logger.info('✅ Redis 连接正常');
    } catch (error) {
      logger.warn('⚠️  Redis 连接失败，但服务继续启动:', error.message);
    }

    // 启动 HTTP 服务器（监听所有网络接口）
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 IEclub 后端服务已启动`);
      logger.info(`📍 监听端口: ${config.port}`);
      logger.info(`🌍 环境: ${config.env}`);
      logger.info(`🔗 API 地址: http://localhost:${config.port}/api`);
      logger.info(`💊 健康检查: http://localhost:${config.port}/api/health`);
      console.log(`✅ Server is running on port ${config.port}`);
      
      // 初始化活动提醒定时任务
      initActivityReminderJob();
    });

    // 设置服务器超时
    server.timeout = 30000; // 30秒超时
    server.keepAliveTimeout = 65000; // 65秒 keep-alive

    // 处理服务器错误
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

    // 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号,开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('HTTP 服务器已关闭');

        try {
          // 停止定时任务
          const scheduler = require('./jobs/scheduler');
          scheduler.stop();
          logger.info('定时任务已停止');

          // 关闭数据库连接
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          await prisma.$disconnect();
          logger.info('数据库连接已关闭');

          // 关闭 Redis 连接
          await redis.quit();
          logger.info('Redis 连接已关闭');

          process.exit(0);
        } catch (error) {
          logger.error('关闭连接时出错:', error);
          process.exit(1);
        }
      });

      // 强制关闭（10秒后）
      setTimeout(() => {
        logger.error('强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    // 处理进程信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获的异常处理
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的 Promise 拒绝:', reason);
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer().catch((error) => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});