const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// 安全中间件
app.use(helmet());

// CORS 配置 - 整合开发代码中的改进
app.use(cors({
  origin: [
    'http://localhost:10086',
    'http://localhost:3000',
    'https://ieclub.online',
    'https://api.ieclub.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求日志
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API 路由
try {
  const routes = require('./routes');
  app.use('/api', routes);
} catch (error) {
  logger.error('路由加载失败:', error);
}

// 404 处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

module.exports = app;