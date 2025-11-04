// src/server-staging.js
// 测试环境服务器启动文件 - 优化版
// 包含简化的启动检查，适合测试环境快速部署

const path = require('path');

// 🔧 加载测试环境配置
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env.staging') 
});

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

// 启动服务器
async function startServer() {
  try {
    logger.info('======================================');
    logger.info('🚀 IEClub 测试环境启动中');
    logger.info('======================================');
    logger.info(`📍 环境: ${config.env}`);
    logger.info(`📍 端口: ${config.port}`);
    logger.info('');

    // ✅ 步骤 1: 测试数据库连接（可选）
    logger.info('📊 检查数据库连接...');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 5000))
      ]);
      logger.info('✅ 数据库连接成功');
      await prisma.$disconnect();
    } catch (error) {
      logger.warn('⚠️  数据库连接失败（继续启动）:', error.message);
      logger.warn('   部分功能可能受限，请检查数据库配置');
    }

    // ✅ 步骤 2: 测试 Redis 连接（可选）
    logger.info('📦 检查 Redis 连接...');
    try {
      const { getRedis } = require('./utils/redis');
      const redis = getRedis();
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 3000))
      ]);
      logger.info('✅ Redis 连接成功');
      
      // 设置测试键
      await redis.set('staging:startup_check', new Date().toISOString(), 'EX', 300);
      logger.info('✅ Redis 读写测试通过');
    } catch (error) {
      logger.warn('⚠️  Redis 连接失败（继续启动）:', error.message);
      logger.warn('   部分缓存功能可能受限');
    }

    // ✅ 步骤 3: 启动 HTTP 服务器
    logger.info('🌐 启动 HTTP 服务器...');
    const server = app.listen(config.port, () => {
      logger.info('✅ HTTP 服务器已启动');
      logger.info(`🔗 API 地址: http://localhost:${config.port}/api`);
      logger.info(`💊 健康检查: http://localhost:${config.port}/health`);
    });

    // ✅ 步骤 4: 启动 WebSocket 服务（可选）
    logger.info('🔌 启动 WebSocket 服务...');
    try {
      const websocketService = require('./services/websocketService');
      websocketService.start(server);
      logger.info(`✅ WebSocket 服务已启动: ws://localhost:${config.port}/ws`);
    } catch (error) {
      logger.warn('⚠️  WebSocket 服务启动失败（非致命）:', error.message);
    }

    // ✅ 步骤 5: 启动定时任务调度器（可选）
    logger.info('📅 启动定时任务调度器...');
    try {
      const scheduler = require('./jobs/scheduler');
      scheduler.start();
      logger.info('✅ 定时任务调度器已启动');
    } catch (error) {
      logger.warn('⚠️  定时任务调度器启动失败（非致命）:', error.message);
    }

    logger.info('');
    logger.info('======================================');
    logger.info('✅ 测试环境启动完成！');
    logger.info('======================================');
    logger.info('');
    logger.info('🔍 快速测试:');
    logger.info(`   curl http://localhost:${config.port}/health`);
    logger.info('');

    // 🛡️ 处理服务器错误
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.port === 'string'
        ? 'Pipe ' + config.port
        : 'Port ' + config.port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`❌ ${bind} 需要管理员权限`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`❌ ${bind} 已被占用`);
          logger.error(`   请检查: lsof -i :${config.port}`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // 🛡️ 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      logger.info(`⚠️  收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('✅ HTTP 服务器已关闭');

        try {
          // 停止定时任务
          try {
            const scheduler = require('./jobs/scheduler');
            if (scheduler.stop) scheduler.stop();
            logger.info('✅ 定时任务已停止');
          } catch (error) {
            // 静默失败
          }

          // 关闭 WebSocket
          try {
            const websocketService = require('./services/websocketService');
            if (websocketService.stop) websocketService.stop();
            logger.info('✅ WebSocket 服务已关闭');
          } catch (error) {
            // 静默失败
          }

          // 关闭数据库连接
          try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            await prisma.$disconnect();
            logger.info('✅ 数据库连接已关闭');
          } catch (error) {
            // 静默失败
          }

          // 关闭 Redis 连接
          try {
            const { getRedis } = require('./utils/redis');
            const redis = getRedis();
            await redis.quit();
            logger.info('✅ Redis 连接已关闭');
          } catch (error) {
            // 静默失败
          }

          logger.info('👋 服务已完全关闭');
          process.exit(0);
        } catch (error) {
          logger.error('❌ 关闭连接时出错:', error);
          process.exit(1);
        }
      });

      // 强制关闭（10秒后）
      setTimeout(() => {
        logger.error('❌ 优雅关闭超时，强制退出');
        process.exit(1);
      }, 10000);
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 🛡️ 未捕获异常处理
    process.on('uncaughtException', (error) => {
      logger.error('❌ 未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ 未处理的 Promise 拒绝:', reason);
      // 不退出进程，只记录日志
    });

    return server;

  } catch (error) {
    logger.error('');
    logger.error('======================================');
    logger.error('❌ 服务启动失败！');
    logger.error('======================================');
    logger.error('错误详情:', error);
    logger.error('');
    
    // 根据错误类型提供帮助
    if (error.message.includes('Redis')) {
      logger.error('💡 Redis 问题: systemctl status redis-server');
    } else if (error.message.includes('database') || error.message.includes('Prisma')) {
      logger.error('💡 数据库问题: systemctl status mysql');
    } else if (error.code === 'EADDRINUSE') {
      logger.error(`💡 端口占用: lsof -i :${config.port}`);
    }
    
    logger.error('');
    process.exit(1);
  }
}

// 启动服务器
if (require.main === module) {
  startServer();
}

module.exports = startServer;
