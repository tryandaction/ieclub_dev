// ieclub-backend/src/controllers/BaseController.js
// 控制器基类 - 提供统一的错误处理和响应格式

const { ErrorHandler, asyncHandler } = require('../utils/errorHandler');
const { validatePagination, buildPaginationResponse } = require('../utils/common');
const logger = require('../utils/logger');

/**
 * 控制器基类
 */
class BaseController {
  /**
   * 成功响应
   * @param {Object} res - 响应对象
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @param {number} statusCode - 状态码
   */
  static success(res, data = null, message = '操作成功', statusCode = 200) {
    const response = {
      success: true,
      message
    };
    
    if (data !== null) {
      response.data = data;
    }
    
    res.status(statusCode).json(response);
  }
  
  /**
   * 分页响应
   * @param {Object} res - 响应对象
   * @param {Array} items - 数据项
   * @param {number} page - 页码
   * @param {number} pageSize - 每页大小
   * @param {number} total - 总数
   * @param {string} message - 消息
   */
  static successWithPagination(res, items, page, pageSize, total, message = '查询成功') {
    const response = buildPaginationResponse(items, page, pageSize, total);
    this.success(res, response, message);
  }
  
  /**
   * 创建成功响应
   * @param {Object} res - 响应对象
   * @param {*} data - 数据
   * @param {string} message - 消息
   */
  static created(res, data, message = '创建成功') {
    this.success(res, data, message, 201);
  }
  
  /**
   * 无内容响应
   * @param {Object} res - 响应对象
   * @param {string} message - 消息
   */
  static noContent(res, message = '操作成功') {
    res.status(204).send();
  }
  
  /**
   * 错误响应
   * @param {Object} res - 响应对象
   * @param {Error} error - 错误对象
   * @param {Object} req - 请求对象
   * @param {Object} context - 上下文
   */
  static error(res, error, req, context = {}) {
    ErrorHandler.handle(error, req, res, context);
  }
  
  /**
   * 包装异步处理器
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  static wrap(fn) {
    return asyncHandler(fn);
  }
  
  /**
   * 验证分页参数
   * @param {Object} query - 查询参数
   * @param {number} maxPageSize - 最大每页大小
   * @returns {Object} 验证后的分页参数
   */
  static validatePagination(query, maxPageSize = 100) {
    return validatePagination(
      query.page,
      query.pageSize || query.limit,
      maxPageSize
    );
  }
  
  /**
   * 获取用户ID
   * @param {Object} req - 请求对象
   * @returns {string} 用户ID
   * @throws {Error} 如果用户未认证
   */
  static getUserId(req) {
    if (!req.user || !req.user.id) {
      throw new Error('用户未认证');
    }
    return req.user.id;
  }
  
  /**
   * 记录操作日志
   * @param {string} action - 操作名称
   * @param {Object} req - 请求对象
   * @param {Object} data - 额外数据
   */
  static logAction(action, req, data = {}) {
    logger.info(`控制器操作: ${action}`, {
      action,
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl || req.url,
      params: req.params,
      query: req.query,
      ...data
    });
  }
  
  /**
   * 检查权限
   * @param {Object} req - 请求对象
   * @param {Function} condition - 权限条件函数
   * @param {string} message - 错误消息
   * @throws {Error} 如果权限不足
   */
  static checkPermission(req, condition, message = '权限不足') {
    if (!condition(req)) {
      throw new Error(message);
    }
  }
  
  /**
   * 检查资源所有权
   * @param {Object} req - 请求对象
   * @param {string} resourceOwnerId - 资源所有者ID
   * @param {string} message - 错误消息
   * @throws {Error} 如果不是资源所有者
   */
  static checkOwnership(req, resourceOwnerId, message = '无权操作此资源') {
    const userId = this.getUserId(req);
    
    if (userId !== resourceOwnerId && !req.user?.isAdmin) {
      throw new Error(message);
    }
  }
  
  /**
   * 提取请求参数
   * @param {Object} req - 请求对象
   * @param {Array<string>} fields - 字段列表
   * @returns {Object} 提取的参数
   */
  static extractParams(req, fields) {
    const params = {};
    const source = { ...req.body, ...req.query, ...req.params };
    
    for (const field of fields) {
      if (source[field] !== undefined) {
        params[field] = source[field];
      }
    }
    
    return params;
  }
  
  /**
   * 验证必需参数
   * @param {Object} params - 参数对象
   * @param {Array<string>} requiredFields - 必需字段
   * @throws {Error} 如果缺少必需字段
   */
  static validateRequired(params, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`缺少必需参数: ${missing.join(', ')}`);
    }
  }
  
  /**
   * 安全的整数转换
   * @param {*} value - 值
   * @param {number} defaultValue - 默认值
   * @returns {number} 整数
   */
  static toInt(value, defaultValue = 0) {
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }
  
  /**
   * 安全的布尔转换
   * @param {*} value - 值
   * @param {boolean} defaultValue - 默认值
   * @returns {boolean} 布尔值
   */
  static toBool(value, defaultValue = false) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    
    return Boolean(value);
  }
  
  /**
   * 构建查询条件
   * @param {Object} filters - 过滤条件
   * @returns {Object} Prisma 查询条件
   */
  static buildWhereClause(filters) {
    const where = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        where[key] = value;
      }
    }
    
    return where;
  }
  
  /**
   * 构建排序条件
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序顺序
   * @param {string} defaultSortBy - 默认排序字段
   * @returns {Object} Prisma 排序条件
   */
  static buildOrderByClause(sortBy, sortOrder, defaultSortBy = 'createdAt') {
    const field = sortBy || defaultSortBy;
    const order = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    return { [field]: order };
  }
}

module.exports = BaseController;

