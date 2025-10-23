const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false, // 移除CSP以避免兼容性问题
  xContentTypeOptions: true, // 添加X-Content-Type-Options头
  server: 'IEClub/2.0', // 设置服务器名称
}));

// HTTP参数污染保护
app.use(hpp());

// CORS配置 - 修复网页端无法显示问题
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:10086', 
      'http://localhost:3000', 
      'http://localhost:8080',
      'http://127.0.0.1:10086',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'https://ieclub.online',
      'https://www.ieclub.online'
    ];

app.use(cors({
  origin: function(origin, callback) {
    // 允许没有origin的请求（如移动应用、Postman、本地开发）
    if (!origin) return callback(null, true);
    
    // 允许所有本地开发环境
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// 压缩响应
app.use(compression());

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件 - 添加缓存控制
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d', // 缓存1天
  etag: true,
  lastModified: true
}));

// 健康检查
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API缓存控制中间件
app.use('/api', (req, res, next) => {
  // 为API响应设置缓存控制
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5分钟缓存
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
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