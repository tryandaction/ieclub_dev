const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { errorMiddleware } = require('./utils/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');
const { getCsrfToken, refreshCsrfToken } = require('./middleware/csrf');
const { monitor } = require('./utils/performanceMonitor');
const requestContext = require('./middleware/requestContext');

const app = express();

// 信任代理（Nginx反向代理）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  xPoweredBy: false,
  hsts: { maxAge: 31536000 }
}));

// HTTP参数污染保护
app.use(hpp());

// CORS配置
// 支持 ALLOWED_ORIGINS 和 CORS_ORIGIN 两种环境变量名称
const corsOriginEnv = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map(origin => origin.trim())
  : [
      'http://localhost:10086', 
      'http://localhost:3000', 
      'http://localhost:8080',
      'http://127.0.0.1:10086',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080',
      'https://ieclub.online',
      'https://www.ieclub.online',
      'https://test.ieclub.online'  // 测试环境域名
    ];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin:', origin);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token', 'X-XSRF-Token'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// 压缩响应
app.use(compression());

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 启动性能监控
monitor.start();

// 请求上下文中间件（必须在最前面，为每个请求添加唯一ID）
app.use(requestContext);

// Cookie 解析
app.use(cookieParser());

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'ieclub-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  }
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ==================== 系统端点（在限流之前）====================

// CSRF Token 端点（在限流之前，允许任何人获取）
app.get('/csrf-token', getCsrfToken);
app.post('/csrf-token/refresh', refreshCsrfToken);

// 健康检查（不需要缓存控制，保证实时性）
app.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// 性能报告（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  app.get('/performance', async (req, res) => {
    try {
      const report = await monitor.getPerformanceReport(24);
      const realtime = monitor.getRealTimeMetrics();
      res.json({
        success: true,
        realtime,
        report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IEClub API Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: 'https://ieclub.online/docs'
    },
    status: 'running'
  });
});

// ==================== API限流配置 ====================

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 429,
    message: '请求过于频繁，请稍后再试'
  }
});

// 应用限流到API路由
app.use('/api', apiLimiter);

// ==================== API中间件 ====================

// API缓存控制
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300');
  } else {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// API 测试端点（用于快速诊断）
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'IEClub API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API 路由
try {
  const routes = require('./routes');
  app.use('/api', routes);
  logger.info('✅ 路由加载成功');
} catch (error) {
  logger.error('❌ 路由加载失败:', error);
  process.exit(1); // 路由加载失败应该退出
}

// 404 处理
app.use(notFoundHandler);

// 统一错误处理（使用新的错误处理器）
app.use(errorMiddleware());

module.exports = app;
