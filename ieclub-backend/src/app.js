// src/app.js
// Express 应用配置

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// 导入路由
const routes = require('./routes');

const app = express();

// ==================== 安全中间件 ====================
app.use(helmet({
  contentSecurityPolicy: false, // 微信小程序需要
  crossOriginEmbedderPolicy: false,
}));

// ==================== 基础中间件 ====================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== CORS 配置 ====================
app.use(cors(config.cors));

// ==================== 日志中间件 ====================
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
}

// ==================== 静态文件服务 ====================
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ==================== 限流中间件 ====================
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 应用限流（除健康检查外）
app.use('/api/', limiter);

// ==================== API 路由 ====================
app.use('/api/v1', routes);

// ==================== 健康检查 ====================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API is running',
    version: '2.0.0',
    timestamp: Date.now(),
    env: config.env,
  });
});

// ==================== 404 处理 ====================
app.use('*', errorHandler.notFound);

// ==================== 全局错误处理 ====================
app.use(errorHandler);

// ==================== 优雅关闭 ====================
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  logger.info(`收到信号 ${signal}，开始优雅关闭...`);

  server.close(() => {
    logger.info('HTTP 服务器已关闭');
    process.exit(0);
  });

  // 强制关闭（10秒后）
  setTimeout(() => {
    logger.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
}

// 创建 HTTP 服务器
const server = require('http').createServer(app);

module.exports = { app, server };