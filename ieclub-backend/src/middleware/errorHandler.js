const logger = require('../utils/logger');
const response = require('../utils/response');
const AppError = require('../utils/AppError');
const { Prisma } = require('@prisma/client');
const { monitor } = require('../utils/performanceMonitor');

const errorHandler = (err, req, res, _next) => {
  // 记录错误日志
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // 记录到监控服务
  try {
    monitor.recordError(err, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });
  } catch (error) {
    // 忽略监控服务错误
  }

  // 如果是自定义AppError
  if (err instanceof AppError) {
    const errorResponse = err.toJSON();
    // 如果是429错误，添加Retry-After响应头
    if (err.statusCode === 429 && err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter);
    }
    return res.status(err.statusCode).json(errorResponse);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || '字段';
      return response.error(res, `${field} 已存在`, 400);
    }
    if (err.code === 'P2025') {
      return response.notFound(res, '记录不存在');
    }
    if (err.code === 'P2003') {
      return response.error(res, '关联数据不存在', 400);
    }
    // 数据库连接错误
    if (err.code === 'P1001' || err.code === 'P1000') {
      logger.error('数据库连接失败:', err);
      return res.status(503).json({
        success: false,
        message: '服务暂时不可用，请稍后重试'
      });
    }
    return response.error(res, '数据库操作失败', 400);
  }
  
  // Prisma 客户端初始化错误
  if (err.name === 'PrismaClientInitializationError') {
    logger.error('Prisma 客户端初始化失败:', err);
    return res.status(503).json({
      success: false,
      message: '服务暂时不可用，请稍后重试'
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return response.error(res, '数据验证失败', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, '无效的认证令牌');
  }

  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, '登录已过期');
  }

  if (err.name === 'ValidationError') {
    return response.error(res, err.message, 400, err.errors);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return response.error(res, '文件大小超出限制', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return response.error(res, '文件数量超出限制', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return response.error(res, '不支持的文件类型', 400);
  }

  if (err.isBusinessError) {
    return response.error(res, err.message, err.statusCode || 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      code: statusCode,
      message,
      error: {
        message: err.message,
        stack: err.stack,
      },
      timestamp: Date.now(),
    });
  }

  return response.serverError(res, message);
};

const notFoundHandler = (req, res) => {
  logger.warn(`404 - 路由不存在: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  return response.notFound(res, `路由 ${req.method} ${req.url} 不存在`);
};

class BusinessError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.isBusinessError = true;
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  BusinessError
};