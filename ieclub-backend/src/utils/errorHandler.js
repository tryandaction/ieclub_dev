// ieclub-backend/src/utils/errorHandler.js
// 统一错误处理工具

const logger = require('./logger');
const AppError = require('./AppError');

/**
 * 错误类型映射
 */
const ERROR_TYPES = {
  // 验证错误
  VALIDATION_ERROR: { statusCode: 400, message: '参数验证失败' },
  INVALID_INPUT: { statusCode: 400, message: '输入参数无效' },
  MISSING_REQUIRED_FIELD: { statusCode: 400, message: '缺少必需字段' },
  
  // 认证错误
  UNAUTHORIZED: { statusCode: 401, message: '未授权' },
  AUTH_TOKEN_MISSING: { statusCode: 401, message: '缺少认证令牌' },
  AUTH_TOKEN_INVALID: { statusCode: 401, message: '认证令牌无效' },
  AUTH_TOKEN_EXPIRED: { statusCode: 401, message: '认证令牌已过期' },
  AUTH_USER_NOT_FOUND: { statusCode: 401, message: '用户不存在' },
  AUTH_USER_BANNED: { statusCode: 401, message: '用户已被封禁' },
  
  // 权限错误
  FORBIDDEN: { statusCode: 403, message: '无权访问' },
  PERMISSION_DENIED: { statusCode: 403, message: '权限不足' },
  
  // 资源错误
  NOT_FOUND: { statusCode: 404, message: '资源不存在' },
  RESOURCE_NOT_FOUND: { statusCode: 404, message: '请求的资源不存在' },
  
  // 冲突错误
  CONFLICT: { statusCode: 409, message: '资源冲突' },
  DUPLICATE_ENTRY: { statusCode: 409, message: '数据已存在' },
  
  // 速率限制
  RATE_LIMIT_EXCEEDED: { statusCode: 429, message: '请求过于频繁' },
  
  // 服务器错误
  INTERNAL_ERROR: { statusCode: 500, message: '服务器内部错误' },
  DATABASE_ERROR: { statusCode: 500, message: '数据库错误' },
  EXTERNAL_SERVICE_ERROR: { statusCode: 500, message: '外部服务错误' },
  
  // 业务错误
  BUSINESS_ERROR: { statusCode: 400, message: '业务处理失败' },
  OPERATION_FAILED: { statusCode: 400, message: '操作失败' },
  
  // 超时错误
  TIMEOUT: { statusCode: 408, message: '请求超时' },
  QUERY_TIMEOUT: { statusCode: 408, message: '查询超时' }
};

/**
 * 错误处理器类
 */
class ErrorHandler {
  /**
   * 处理错误并返回标准响应
   * @param {Error} error - 错误对象
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {Object} context - 上下文信息
   */
  static handle(error, req, res, context = {}) {
    // 解析错误
    const errorInfo = this.parseError(error);
    
    // 记录错误日志
    this.logError(error, req, context, errorInfo);
    
    // 返回错误响应
    this.sendErrorResponse(res, errorInfo, context);
  }
  
  /**
   * 解析错误
   * @private
   */
  static parseError(error) {
    // AppError（自定义错误）
    if (error instanceof AppError) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode || 500,
        details: error.details
      };
    }
    
    // Prisma 错误
    if (error.code && error.code.startsWith('P')) {
      return this.parsePrismaError(error);
    }
    
    // 验证错误
    if (error.name === 'ValidationError') {
      return {
        code: 'VALIDATION_ERROR',
        message: '参数验证失败',
        statusCode: 400,
        details: error.details || error.message
      };
    }
    
    // JWT 错误
    if (error.name === 'JsonWebTokenError') {
      return {
        code: 'AUTH_TOKEN_INVALID',
        message: '认证令牌无效',
        statusCode: 401
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        code: 'AUTH_TOKEN_EXPIRED',
        message: '认证令牌已过期',
        statusCode: 401
      };
    }
    
    // 查询超时错误
    if (error.code === 'QUERY_TIMEOUT') {
      return {
        code: 'QUERY_TIMEOUT',
        message: error.message || '查询超时',
        statusCode: 408,
        details: { timeout: error.timeout }
      };
    }
    
    // 已知错误类型
    if (error.code && ERROR_TYPES[error.code]) {
      const errorType = ERROR_TYPES[error.code];
      return {
        code: error.code,
        message: error.message || errorType.message,
        statusCode: errorType.statusCode,
        details: error.details
      };
    }
    
    // 未知错误
    return {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : error.message,
      statusCode: 500,
      details: process.env.NODE_ENV === 'production' 
        ? undefined 
        : { stack: error.stack }
    };
  }
  
  /**
   * 解析 Prisma 错误
   * @private
   */
  static parsePrismaError(error) {
    const prismaErrorMap = {
      'P2002': { code: 'DUPLICATE_ENTRY', message: '数据已存在', statusCode: 409 },
      'P2025': { code: 'NOT_FOUND', message: '记录不存在', statusCode: 404 },
      'P2003': { code: 'FOREIGN_KEY_CONSTRAINT', message: '外键约束失败', statusCode: 400 },
      'P2014': { code: 'RELATION_VIOLATION', message: '关联关系冲突', statusCode: 400 }
    };
    
    const mapped = prismaErrorMap[error.code];
    
    if (mapped) {
      return {
        ...mapped,
        details: error.meta
      };
    }
    
    return {
      code: 'DATABASE_ERROR',
      message: '数据库操作失败',
      statusCode: 500,
      details: process.env.NODE_ENV === 'production' 
        ? undefined 
        : { prismaCode: error.code, meta: error.meta }
    };
  }
  
  /**
   * 记录错误日志
   * @private
   */
  static logError(error, req, context, errorInfo) {
    const logData = {
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        statusCode: errorInfo.statusCode,
        details: errorInfo.details
      },
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        params: req.params,
        query: req.query,
        body: this.sanitizeBody(req.body),
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      context,
      stack: error.stack
    };
    
    // 根据状态码选择日志级别
    if (errorInfo.statusCode >= 500) {
      logger.error('服务器错误', logData);
    } else if (errorInfo.statusCode >= 400) {
      logger.warn('客户端错误', logData);
    } else {
      logger.info('错误', logData);
    }
  }
  
  /**
   * 发送错误响应
   * @private
   */
  static sendErrorResponse(res, errorInfo, context) {
    const response = {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message
      }
    };
    
    // 添加详细信息（非生产环境）
    if (process.env.NODE_ENV !== 'production' && errorInfo.details) {
      response.error.details = errorInfo.details;
    }
    
    // 添加上下文信息
    if (context.requestId) {
      response.requestId = context.requestId;
    }
    
    res.status(errorInfo.statusCode).json(response);
  }
  
  /**
   * 脱敏请求体
   * @private
   */
  static sanitizeBody(body) {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    const sensitiveFields = [
      'password', 'oldPassword', 'newPassword',
      'token', 'accessToken', 'refreshToken',
      'verifyCode', 'captcha'
    ];
    
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
}

/**
 * 异步错误包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 创建错误
 * @param {string} code - 错误代码
 * @param {string} message - 错误消息（可选）
 * @param {*} details - 详细信息（可选）
 * @returns {AppError} 错误对象
 */
function createError(code, message, details) {
  const errorType = ERROR_TYPES[code];
  
  if (!errorType) {
    throw new Error(`未知错误代码: ${code}`);
  }
  
  return new AppError(
    message || errorType.message,
    code,
    errorType.statusCode,
    details
  );
}

/**
 * 验证错误
 * @param {string} message - 错误消息
 * @param {*} details - 详细信息
 * @returns {AppError} 错误对象
 */
function validationError(message, details) {
  return createError('VALIDATION_ERROR', message, details);
}

/**
 * 未授权错误
 * @param {string} message - 错误消息
 * @returns {AppError} 错误对象
 */
function unauthorizedError(message) {
  return createError('UNAUTHORIZED', message);
}

/**
 * 权限不足错误
 * @param {string} message - 错误消息
 * @returns {AppError} 错误对象
 */
function forbiddenError(message) {
  return createError('FORBIDDEN', message);
}

/**
 * 资源不存在错误
 * @param {string} message - 错误消息
 * @returns {AppError} 错误对象
 */
function notFoundError(message) {
  return createError('NOT_FOUND', message);
}

/**
 * 冲突错误
 * @param {string} message - 错误消息
 * @param {*} details - 详细信息
 * @returns {AppError} 错误对象
 */
function conflictError(message, details) {
  return createError('CONFLICT', message, details);
}

/**
 * 业务错误
 * @param {string} message - 错误消息
 * @param {*} details - 详细信息
 * @returns {AppError} 错误对象
 */
function businessError(message, details) {
  return createError('BUSINESS_ERROR', message, details);
}

/**
 * Express 错误处理中间件
 */
function errorMiddleware() {
  return (error, req, res, next) => {
    ErrorHandler.handle(error, req, res, {
      requestId: req.requestId
    });
  };
}

/**
 * 处理数据库连接错误
 * @param {Error} error - 数据库错误
 * @param {Object} res - 响应对象
 * @param {string} operation - 操作名称
 * @returns {boolean} 是否是连接错误（已处理）
 */
function handleDatabaseError(error, res, operation = '数据库操作') {
  // 检查是否是Prisma连接错误
  if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
    logger.error(`${operation}失败 - 数据库连接错误:`, {
      error: error.message,
      code: error.code,
      name: error.name
    });
    
    res.status(503).json({
      success: false,
      message: '服务暂时不可用，请稍后重试'
    });
    return true;
  }
  
  // 不是连接错误，返回false让调用者继续处理
  return false;
}

module.exports = {
  ErrorHandler,
  asyncHandler,
  createError,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  conflictError,
  businessError,
  errorMiddleware,
  handleDatabaseError,
  ERROR_TYPES
};

