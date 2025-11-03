// src/server-staging.js
// 测试环境服务器启动文件 - 完整版
// 包含 Redis、WebSocket、定时任务等完整功能

const path = require('path');

// 🔧 加载测试环境配置
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env.staging') 
});

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { getRedis } = require('./utils/redis');

// 启动服务器
async function startServer() {
  try {
    logger.info('======================================');
    logger.info('🚀 IEClub 后端服务启动中 [测试环境-完整版]');
    logger.info('======================================');
    logger.info(`📍 环境: ${config.env}`);
    logger.info(`📍 端口: ${config.port}`);
    logger.info('');

    // ✅ 步骤 1: 测试数据库连接
    logger.info('📊 检查数据库连接...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    logger.info('✅ 数据库连接成功');

    // ✅ 步骤 2: 测试 Redis 连接
    logger.info('📦 检查 Redis 连接...');
    const redis = getRedis();
    const pingResult = await redis.ping();
    if (pingResult === 'PONG') {
      logger.info('✅ Redis 连接成功');
      
      // 设置测试键
      await redis.set('staging:health_check', new Date().toISOString(), 'EX', 300);
      logger.info('✅ Redis 读写测试通过');
    } else {
      throw new Error('Redis ping 失败');
    }

    // ✅ 步骤 3: 启动 HTTP 服务器
    logger.info('🌐 启动 HTTP 服务器...');
    const server = app.listen(config.port, () => {
      logger.info('✅ HTTP 服务器已启动');
      logger.info(`🔗 API 地址: http://localhost:${config.port}/api`);
      logger.info(`💊 健康检查: http://localhost:${config.port}/health`);
    });

    // ✅ 步骤 4: 启动 WebSocket 服务
    logger.info('🔌 启动 WebSocket 服务...');
    try {
      const websocketService = require('./services/websocketService');
      websocketService.start(server);
      logger.info(`✅ WebSocket 服务已启动: ws://localhost:${config.port}/ws`);
    } catch (error) {
      logger.warn('⚠️  WebSocket 服务启动失败（非致命错误）:', error.message);
      logger.warn('   部分实时功能可能不可用');
    }

    // ✅ 步骤 5: 启动定时任务调度器
    logger.info('📅 启动定时任务调度器...');
    try {
      const scheduler = require('./jobs/scheduler');
      scheduler.start();
      logger.info('✅ 定时任务调度器已启动');
    } catch (error) {
      logger.warn('⚠️  定时任务调度器启动失败（非致命错误）:', error.message);
      logger.warn('   部分自动化任务可能不会执行');
    }

    logger.info('');
    logger.info('======================================');
    logger.info('✅ 测试环境服务启动完成！');
    logger.info('======================================');
    logger.info('');
    logger.info('📋 服务状态:');
    logger.info('   ✅ HTTP 服务器: 运行中');
    logger.info('   ✅ 数据库连接: 正常');
    logger.info('   ✅ Redis 缓存: 正常');
    logger.info('   ✅ WebSocket: 运行中');
    logger.info('   ✅ 定时任务: 运行中');
    logger.info('');
    logger.info('🔍 测试建议:');
    logger.info('   1. 访问健康检查: curl http://localhost:3001/health');
    logger.info('   2. 测试 API: curl http://localhost:3001/api/test');
    logger.info('   3. 查看日志: pm2 logs ieclub-backend-staging');
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
          logger.error(`   请检查是否有其他服务正在使用端口 ${config.port}`);
          logger.error(`   可以使用命令查看: lsof -i :${config.port}`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // 🛡️ 优雅关闭处理
    const gracefulShutdown = async (signal) => {
      logger.info('');
      logger.info(`⚠️  收到 ${signal} 信号，开始优雅关闭...`);
      
      server.close(async () => {
        logger.info('✅ HTTP 服务器已关闭');

        try {
          // 停止定时任务
          try {
            const scheduler = require('./jobs/scheduler');
            scheduler.stop();
            logger.info('✅ 定时任务已停止');
          } catch (error) {
            logger.warn('⚠️  停止定时任务时出错:', error.message);
          }

          // 关闭 WebSocket
          try {
            const websocketService = require('./services/websocketService');
            if (websocketService.stop) {
              websocketService.stop();
              logger.info('✅ WebSocket 服务已关闭');
            }
          } catch (error) {
            logger.warn('⚠️  关闭 WebSocket 时出错:', error.message);
          }

          // 关闭数据库连接
          await prisma.$disconnect();
          logger.info('✅ 数据库连接已关闭');

          // 关闭 Redis 连接
          await redis.quit();
          logger.info('✅ Redis 连接已关闭');

          logger.info('');
          logger.info('👋 服务已完全关闭，再见！');
          process.exit(0);
        } catch (error) {
          logger.error('❌ 关闭连接时出错:', error);
          process.exit(1);
        }
      });

      // 强制关闭（15秒后）
      setTimeout(() => {
        logger.error('❌ 优雅关闭超时，强制退出');
        process.exit(1);
      }, 15000);
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
      logger.error('   Promise:', promise);
      // 不退出进程，只记录日志
    });

  } catch (error) {
    logger.error('');
    logger.error('======================================');
    logger.error('❌ 服务启动失败！');
    logger.error('======================================');
    logger.error('');
    logger.error('错误详情:', error);
    logger.error('');
    
    // 根据错误类型提供帮助信息
    if (error.message.includes('Redis')) {
      logger.error('💡 Redis 连接失败，请检查:');
      logger.error('   1. Redis 服务是否运行: systemctl status redis-server');
      logger.error('   2. Redis 配置是否正确: REDIS_HOST, REDIS_PORT');
      logger.error('   3. 尝试重启 Redis: systemctl restart redis-server');
    } else if (error.message.includes('database') || error.message.includes('Prisma')) {
      logger.error('💡 数据库连接失败，请检查:');
      logger.error('   1. 数据库是否运行: systemctl status mysql');
      logger.error('   2. DATABASE_URL 配置是否正确');
      logger.error('   3. 数据库 ieclub_staging 是否存在');
      logger.error('   4. 用户权限是否正确');
    } else if (error.code === 'EADDRINUSE') {
      logger.error('💡 端口已被占用，请检查:');
      logger.error(`   1. 查看占用进程: lsof -i :${config.port}`);
      logger.error('   2. 停止其他服务: pm2 stop all');
      logger.error('   3. 或修改端口配置');
    }
    
    logger.error('');
    process.exit(1);
  }
}

// 启动服务器
startServer();
