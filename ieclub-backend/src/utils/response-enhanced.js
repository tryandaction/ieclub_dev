// ieclub-backend/src/utils/response-enhanced.js
// 增强的响应工具 - 统一响应格式和元数据

const logger = require('./logger');

/**
 * 响应元数据
 */
class ResponseMetadata {
  constructor() {
    this.requestId = null;
    this.timestamp = Date.now();
    this.duration = null;
    this.cached = false;
    this.version = '2.0.0';
  }

  setRequestId(requestId) {
    this.requestId = requestId;
    return this;
  }

  setDuration(duration) {
    this.duration = duration;
    return this;
  }

  setCached(cached) {
    this.cached = cached;
    return this;
  }

  toJSON() {
    const meta = {
      timestamp: this.timestamp,
      version: this.version
    };

    if (this.requestId) meta.requestId = this.requestId;
    if (this.duration !== null) meta.duration = `${this.duration}ms`;
    if (this.cached) meta.cached = true;

    return meta;
  }
}

/**
 * 增强的响应工具
 */
class EnhancedResponse {
  /**
   * 成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 数据
   * @param {Object} options - 选项
   * @param {string} options.message - 消息
   * @param {number} options.statusCode - 状态码
   * @param {Object} options.meta - 元数据
   */
  static success(res, data = null, options = {}) {
    const {
      message = '操作成功',
      statusCode = 200,
      meta = new ResponseMetadata()
    } = options;

    // 设置请求ID
    if (res.locals.requestId) {
      meta.setRequestId(res.locals.requestId);
    }

    // 设置响应时间
    if (res.locals.startTime) {
      const duration = Date.now() - res.locals.startTime;
      meta.setDuration(duration);
    }

    const response = {
      success: true,
      code: statusCode,
      message,
      data,
      meta: meta.toJSON()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   * @param {Object} res - Express响应对象
   * @param {Array} items - 数据项
   * @param {Object} pagination - 分页信息
   * @param {Object} options - 选项
   */
  static paginated(res, items, pagination, options = {}) {
    const {
      message = '获取成功',
      meta = new ResponseMetadata()
    } = options;

    if (res.locals.requestId) {
      meta.setRequestId(res.locals.requestId);
    }

    if (res.locals.startTime) {
      const duration = Date.now() - res.locals.startTime;
      meta.setDuration(duration);
    }

    // 检查是否来自缓存
    if (res.locals.cached) {
      meta.setCached(true);
    }

    const response = {
      success: true,
      code: 200,
      message,
      data: {
        items,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          totalPages: pagination.totalPages,
          hasMore: pagination.hasMore !== undefined ? pagination.hasMore : pagination.page < pagination.totalPages,
          hasPrev: pagination.hasPrev !== undefined ? pagination.hasPrev : pagination.page > 1
        }
      },
      meta: meta.toJSON()
    };

    return res.status(200).json(response);
  }

  /**
   * 创建成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 数据
   * @param {Object} options - 选项
   */
  static created(res, data = null, options = {}) {
    return this.success(res, data, {
      ...options,
      message: options.message || '创建成功',
      statusCode: 201
    });
  }

  /**
   * 无内容响应
   * @param {Object} res - Express响应对象
   * @param {Object} options - 选项
   */
  static noContent(res, options = {}) {
    const meta = new ResponseMetadata();
    if (res.locals.requestId) {
      meta.setRequestId(res.locals.requestId);
    }

    res.status(204).json({
      success: true,
      code: 204,
      message: options.message || '操作成功',
      meta: meta.toJSON()
    });
  }

  /**
   * 错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   * @param {Object} options - 选项
   * @param {number} options.statusCode - 状态码
   * @param {string} options.code - 错误代码
   * @param {*} options.errors - 错误详情
   */
  static error(res, message, options = {}) {
    const {
      statusCode = 400,
      code = 'ERROR',
      errors = null
    } = options;

    const meta = new ResponseMetadata();
    if (res.locals.requestId) {
      meta.setRequestId(res.locals.requestId);
    }

    if (res.locals.startTime) {
      const duration = Date.now() - res.locals.startTime;
      meta.setDuration(duration);
    }

    const response = {
      success: false,
      code: statusCode,
      message,
      error: {
        code,
        ...(errors && { details: errors })
      },
      meta: meta.toJSON()
    };

    return res.status(statusCode).json(response);
  }

  /**
   * 未授权响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static unauthorized(res, message = '未授权访问') {
    return this.error(res, message, {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }

  /**
   * 禁止访问响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, {
      statusCode: 403,
      code: 'FORBIDDEN'
    });
  }

  /**
   * 未找到响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, {
      statusCode: 404,
      code: 'NOT_FOUND'
    });
  }

  /**
   * 服务器错误响应
   * @param {Object} res - Express响应对象
   * @param {string} message - 错误消息
   */
  static serverError(res, message = '服务器内部错误') {
    return this.error(res, message, {
      statusCode: 500,
      code: 'INTERNAL_ERROR'
    });
  }

  /**
   * 速率限制响应
   * @param {Object} res - Express响应对象
   * @param {Object} options - 选项
   * @param {number} options.retryAfter - 重试时间（秒）
   */
  static rateLimit(res, options = {}) {
    const { retryAfter = 60 } = options;

    res.setHeader('Retry-After', retryAfter);

    return this.error(res, '请求过于频繁，请稍后再试', {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  /**
   * 验证错误响应
   * @param {Object} res - Express响应对象
   * @param {Object} errors - 验证错误
   */
  static validationError(res, errors) {
    return this.error(res, '参数验证失败', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors
    });
  }
}

module.exports = EnhancedResponse;
module.exports.ResponseMetadata = ResponseMetadata;

