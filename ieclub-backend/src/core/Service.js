// ieclub-backend/src/core/Service.js
// 服务基类 - 提供通用功能

const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * 服务基类
 * 所有服务都应该继承此类
 */
class Service {
  constructor() {
    this.logger = logger;
    this.initialized = false;
  }

  /**
   * 初始化服务（子类可重写）
   */
  async initialize() {
    this.initialized = true;
    this.logger.debug(`${this.constructor.name} 初始化完成`);
  }

  /**
   * 检查服务是否已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new AppError(
        `服务 ${this.constructor.name} 未初始化`,
        500,
        'SERVICE_NOT_INITIALIZED'
      );
    }
  }

  /**
   * 记录操作日志
   * @param {string} action - 操作名称
   * @param {Object} data - 数据
   */
  logAction(action, data = {}) {
    this.logger.info(`[${this.constructor.name}] ${action}`, data);
  }

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   */
  logError(error, context = {}) {
    this.logger.error(`[${this.constructor.name}] 错误`, {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  /**
   * 处理业务错误
   * @param {string} message - 错误消息
   * @param {number} statusCode - 状态码
   * @param {string} code - 错误代码
   */
  throwBusinessError(message, statusCode = 400, code = 'BUSINESS_ERROR') {
    throw new AppError(message, statusCode, code);
  }

  /**
   * 验证必需参数
   * @param {Object} params - 参数对象
   * @param {Array<string>} requiredFields - 必需字段
   */
  validateRequired(params, requiredFields) {
    const missing = requiredFields.filter(field => {
      const value = params[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      this.throwBusinessError(
        `缺少必需参数: ${missing.join(', ')}`,
        400,
        'MISSING_REQUIRED_FIELD'
      );
    }
  }
}

module.exports = Service;

