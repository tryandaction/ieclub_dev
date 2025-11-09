// ieclub-backend/src/middleware/requestContext.js
// 请求上下文中间件 - 为每个请求添加唯一ID和元数据

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * 请求上下文中间件
 * 为每个请求添加唯一ID、开始时间等元数据
 */
function requestContext(req, res, next) {
  // 生成请求ID
  const requestId = uuidv4();
  
  // 设置请求开始时间
  const startTime = Date.now();

  // 将元数据添加到响应对象
  res.locals.requestId = requestId;
  res.locals.startTime = startTime;

  // 将请求ID添加到请求对象
  req.requestId = requestId;

  // 设置响应头
  res.setHeader('X-Request-ID', requestId);

  // 记录请求开始
  logger.debug('请求开始', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // 在响应结束时记录请求完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // 记录用户信息（如果有）
    if (req.user) {
      logData.userId = req.user.id;
    }

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('请求完成（服务器错误）', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('请求完成（客户端错误）', logData);
    } else {
      logger.debug('请求完成', logData);
    }

    // 记录慢请求
    if (duration > 1000) {
      logger.warn('慢请求检测', {
        ...logData,
        threshold: '1000ms'
      });
    }
  });

  next();
}

module.exports = requestContext;

