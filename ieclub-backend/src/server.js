// src/server.js
// 服务器启动文件
require('dotenv').config();
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { getRedis } = require('./utils/redis');

// 启动服务器
async function startServer() {
  try {
    // 测试 Redis 连接
    const redis = getRedis();
    await redis.ping();
    logger.info('Redis 连接正常');

    // 启动 HTTP 服务器
    const server = app.listen(config.port, () => {
      logger.info(`🚀 IEclub 后端服务已启动`);
      logger.info(`📍 监听端口: ${config.port}`);
      logger.info(`🌍 环境: ${config.env}`);
      logger.info(`🔗 API 地址: http://localhost:${config.port}/api`);
      logger.info(`💊 健康检查: http://localhost:${config.port}/health`);
    });

    // 启动WebSocket服务
    const websocketService = require('./services/websocketService');
    websocketService.start(server);
    logger.info(`🔌 WebSocket 服务已启动: ws://localhost:${config.port}/ws`);

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

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();