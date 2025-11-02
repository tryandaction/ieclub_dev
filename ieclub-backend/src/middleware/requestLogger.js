// ieclub-backend/src/middleware/requestLogger.js
// 请求日志中间件 - 记录所有 API 请求

const logger = require('../utils/logger');
const { generateUniqueId } = require('../utils/common');

/**
 * 请求日志配置
 */
const LOG_CONFIG = {
  // 需要记录请求体的路径（敏感操作）
  logBodyPaths: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/admin',
    '/api/moderation'
  ],
  
  // 需要脱敏的字段
  sensitiveFields: [
    'password',
    'oldPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'verifyCode',
    'captcha'
  ],
  
  // 慢请求阈值（毫秒）
  slowRequestThreshold: 1000,
  
  // 超大响应阈值（字节）
  largeResponseThreshold: 1024 * 1024 // 1MB
};

/**
 * 脱敏处理
 * @private
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (LOG_CONFIG.sensitiveFields.includes(key)) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * 判断是否需要记录请求体
 * @private
 */
function shouldLogBody(path) {
  return LOG_CONFIG.logBodyPaths.some(pattern => path.startsWith(pattern));
}

/**
 * 获取客户端IP
 * @private
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

/**
 * 请求日志中间件
 */
function requestLogger(options = {}) {
  const config = { ...LOG_CONFIG, ...options };
  
  return (req, res, next) => {
    // 生成请求ID
    const requestId = generateUniqueId();
    req.requestId = requestId;
    
    // 记录请求开始时间
    const startTime = Date.now();
    
    // 获取请求信息
    const requestInfo = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query,
      ip: getClientIp(req),
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    };
    
    // 记录请求体（如果需要）
    if (shouldLogBody(req.path) && req.body) {
      requestInfo.body = sanitizeData(req.body);
    }
    
    // 记录请求开始
    logger.info('请求开始', requestInfo);
    
    // 保存原始的 res.json 和 res.send 方法
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // 响应数据
    let responseBody;
    let responseSize = 0;
    
    // 拦截 res.json
    res.json = function(data) {
      responseBody = data;
      responseSize = JSON.stringify(data).length;
      return originalJson(data);
    };
    
    // 拦截 res.send
    res.send = function(data) {
      responseBody = data;
      responseSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
      return originalSend(data);
    };
    
    // 监听响应结束
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // 构建响应日志
      const responseInfo = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        duration: `${duration}ms`,
        responseSize: `${(responseSize / 1024).toFixed(2)}KB`,
        userId: req.user?.id,
        ip: getClientIp(req)
      };
      
      // 判断日志级别
      let logLevel = 'info';
      let logMessage = '请求完成';
      
      // 错误请求
      if (statusCode >= 500) {
        logLevel = 'error';
        logMessage = '请求失败（服务器错误）';
        responseInfo.error = responseBody?.error || responseBody?.message;
      } else if (statusCode >= 400) {
        logLevel = 'warn';
        logMessage = '请求失败（客户端错误）';
        responseInfo.error = responseBody?.error || responseBody?.message;
      }
      
      // 慢请求
      if (duration > config.slowRequestThreshold) {
        logLevel = 'warn';
        logMessage = '慢请求';
        responseInfo.slow = true;
      }
      
      // 超大响应
      if (responseSize > config.largeResponseThreshold) {
        logLevel = 'warn';
        logMessage = '超大响应';
        responseInfo.large = true;
      }
      
      // 记录日志
      logger[logLevel](logMessage, responseInfo);
      
      // 设置响应头
      res.setHeader('X-Request-Id', requestId);
      res.setHeader('X-Response-Time', `${duration}ms`);
    });
    
    // 监听错误
    res.on('error', (error) => {
      logger.error('响应错误', {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        error: error.message,
        stack: error.stack
      });
    });
    
    next();
  };
}

/**
 * 简化版请求日志（仅记录基本信息）
 */
function simpleRequestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    
    next();
  };
}

/**
 * 错误请求日志（仅记录错误请求）
 */
function errorRequestLogger() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        const duration = Date.now() - startTime;
        logger.warn('错误请求', {
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.id,
          ip: getClientIp(req)
        });
      }
    });
    
    next();
  };
}

/**
 * 性能监控日志
 */
function performanceLogger(threshold = 1000) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('性能警告', {
          method: req.method,
          url: req.originalUrl || req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.id
        });
      }
    });
    
    next();
  };
}

module.exports = {
  requestLogger,
  simpleRequestLogger,
  errorRequestLogger,
  performanceLogger,
  LOG_CONFIG
};

