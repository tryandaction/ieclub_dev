// ieclub-backend/src/utils/common.js
// 通用工具函数集合

const crypto = require('crypto');
const logger = require('./logger');

/**
 * ==================== 分页工具 ====================
 */

/**
 * 验证并标准化分页参数
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @param {number} maxPageSize - 最大每页大小（默认100）
 * @returns {Object} 标准化的分页参数
 */
function validatePagination(page, pageSize, maxPageSize = 100) {
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const validPageSize = Math.min(
    Math.max(1, parseInt(pageSize, 10) || 20),
    maxPageSize
  );

  return {
    page: validPage,
    pageSize: validPageSize,
    skip: (validPage - 1) * validPageSize,
    take: validPageSize
  };
}

/**
 * 构建分页响应对象
 * @param {Array} items - 数据项
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页大小
 * @param {number} total - 总数量
 * @returns {Object} 分页响应对象
 */
function buildPaginationResponse(items, page, pageSize, total) {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * 计算分页偏移量
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @returns {number} 偏移量
 */
function calculateOffset(page, pageSize) {
  return (Math.max(1, page) - 1) * pageSize;
}

/**
 * ==================== 参数验证工具 ====================
 */

/**
 * 验证必需参数
 * @param {Object} params - 参数对象
 * @param {Array<string>} requiredFields - 必需字段列表
 * @throws {Error} 如果缺少必需字段
 */
function validateRequiredFields(params, requiredFields) {
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
 * 验证字符串长度
 * @param {string} value - 字符串值
 * @param {number} minLength - 最小长度
 * @param {number} maxLength - 最大长度
 * @param {string} fieldName - 字段名称
 * @throws {Error} 如果长度不符合要求
 */
function validateStringLength(value, minLength, maxLength, fieldName = '字段') {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName}必须是字符串`);
  }
  
  const length = value.trim().length;
  
  if (length < minLength) {
    throw new Error(`${fieldName}长度不能少于${minLength}个字符`);
  }
  
  if (length > maxLength) {
    throw new Error(`${fieldName}长度不能超过${maxLength}个字符`);
  }
}

/**
 * 验证枚举值
 * @param {*} value - 值
 * @param {Array} allowedValues - 允许的值列表
 * @param {string} fieldName - 字段名称
 * @throws {Error} 如果值不在允许列表中
 */
function validateEnum(value, allowedValues, fieldName = '字段') {
  if (!allowedValues.includes(value)) {
    throw new Error(
      `${fieldName}的值必须是以下之一: ${allowedValues.join(', ')}`
    );
  }
}

/**
 * 验证数字范围
 * @param {number} value - 数字值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {string} fieldName - 字段名称
 * @throws {Error} 如果值不在范围内
 */
function validateNumberRange(value, min, max, fieldName = '字段') {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`${fieldName}必须是数字`);
  }
  
  if (num < min || num > max) {
    throw new Error(`${fieldName}必须在${min}到${max}之间`);
  }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 邮箱格式是否正确
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @throws {Error} 如果手机号格式不正确
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  
  if (!phoneRegex.test(phone)) {
    throw new Error('手机号格式不正确');
  }
}

/**
 * ==================== 缓存键生成工具 ====================
 */

/**
 * 生成缓存键
 * @param {string} prefix - 前缀
 * @param {...any} parts - 键的组成部分
 * @returns {string} 缓存键
 */
function generateCacheKey(prefix, ...parts) {
  const sanitizedParts = parts.map(part => {
    if (part === null || part === undefined) {
      return 'null';
    }
    if (typeof part === 'object') {
      return JSON.stringify(part);
    }
    return String(part);
  });
  
  return `${prefix}:${sanitizedParts.join(':')}`;
}

/**
 * 生成分页缓存键
 * @param {string} prefix - 前缀
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @param {Object} filters - 过滤条件
 * @returns {string} 缓存键
 */
function generatePaginationCacheKey(prefix, page, pageSize, filters = {}) {
  const filterStr = Object.keys(filters)
    .sort()
    .map(key => `${key}=${filters[key]}`)
    .join('&');
  
  return generateCacheKey(prefix, page, pageSize, filterStr);
}

/**
 * ==================== 数据处理工具 ====================
 */

/**
 * 安全的 JSON 解析
 * @param {string} str - JSON 字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析结果或默认值
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    logger.warn('JSON解析失败', { str, error: error.message });
    return defaultValue;
  }
}

/**
 * 安全的 JSON 字符串化
 * @param {*} obj - 对象
 * @param {string} defaultValue - 默认值
 * @returns {string} JSON 字符串或默认值
 */
function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    logger.warn('JSON字符串化失败', { error: error.message });
    return defaultValue;
  }
}

/**
 * 深度克隆对象
 * @param {*} obj - 对象
 * @returns {*} 克隆的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * 移除对象中的空值
 * @param {Object} obj - 对象
 * @returns {Object} 清理后的对象
 */
function removeEmptyValues(obj) {
  const cleaned = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * 从对象中选择指定字段
 * @param {Object} obj - 对象
 * @param {Array<string>} fields - 字段列表
 * @returns {Object} 选择后的对象
 */
function pickFields(obj, fields) {
  const picked = {};
  
  for (const field of fields) {
    if (obj.hasOwnProperty(field)) {
      picked[field] = obj[field];
    }
  }
  
  return picked;
}

/**
 * 从对象中排除指定字段
 * @param {Object} obj - 对象
 * @param {Array<string>} fields - 字段列表
 * @returns {Object} 排除后的对象
 */
function omitFields(obj, fields) {
  const omitted = { ...obj };
  
  for (const field of fields) {
    delete omitted[field];
  }
  
  return omitted;
}

/**
 * ==================== 字符串处理工具 ====================
 */

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 32, charset = 'alphanumeric') {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    numeric: '0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    hex: '0123456789abcdef'
  };
  
  const chars = charsets[charset] || charsets.alphanumeric;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateUniqueId() {
  return `${Date.now()}-${generateRandomString(8, 'hex')}`;
}

/**
 * 截断字符串
 * @param {string} str - 字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的字符串
 */
function truncateString(str, maxLength, suffix = '...') {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 转换为驼峰命名
 * @param {string} str - 字符串
 * @returns {string} 驼峰命名字符串
 */
function toCamelCase(str) {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

/**
 * 转换为蛇形命名
 * @param {string} str - 字符串
 * @returns {string} 蛇形命名字符串
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * ==================== 时间处理工具 ====================
 */

/**
 * 格式化时间差
 * @param {Date} date - 日期
 * @returns {string} 格式化的时间差
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  if (seconds > 0) return `${seconds}秒前`;
  return '刚刚';
}

/**
 * 格式化日期
 * @param {Date} date - 日期
 * @param {string} format - 格式
 * @returns {string} 格式化的日期
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * ==================== 安全工具 ====================
 */

/**
 * 生成哈希
 * @param {string} str - 字符串
 * @param {string} algorithm - 算法
 * @returns {string} 哈希值
 */
function generateHash(str, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(str).digest('hex');
}

/**
 * 脱敏处理
 * @param {string} str - 字符串
 * @param {number} start - 开始位置
 * @param {number} end - 结束位置
 * @param {string} mask - 掩码字符
 * @returns {string} 脱敏后的字符串
 */
function maskString(str, start = 3, end = 4, mask = '*') {
  if (!str || str.length <= start + end) {
    return str;
  }
  
  const maskLength = str.length - start - end;
  return str.substring(0, start) + mask.repeat(maskLength) + str.substring(str.length - end);
}

/**
 * 脱敏邮箱
 * @param {string} email - 邮箱
 * @returns {string} 脱敏后的邮箱
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) {
    return email;
  }
  
  const [username, domain] = email.split('@');
  const maskedUsername = maskString(username, 2, 1);
  return `${maskedUsername}@${domain}`;
}

/**
 * 脱敏手机号
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号
 */
function maskPhone(phone) {
  if (!phone || phone.length !== 11) {
    return phone;
  }
  
  return maskString(phone, 3, 4);
}

/**
 * ==================== 批量处理工具 ====================
 */

/**
 * 批量处理（分批）
 * @param {Array} items - 项目列表
 * @param {number} batchSize - 批次大小
 * @param {Function} processor - 处理函数
 * @returns {Promise<Array>} 处理结果
 */
async function processBatch(items, batchSize, processor) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 并发控制
 * @param {Array} tasks - 任务列表
 * @param {number} concurrency - 并发数
 * @returns {Promise<Array>} 执行结果
 */
async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  const executing = [];
  
  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task());
    results.push(promise);
    
    if (concurrency <= tasks.length) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

/**
 * 延迟执行
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试机制
 * @param {Function} fn - 函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delayMs - 延迟时间
 * @returns {Promise<*>} 执行结果
 */
async function retry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        logger.warn(`重试 ${i + 1}/${maxRetries}`, { error: error.message });
        await delay(delayMs * (i + 1)); // 指数退避
      }
    }
  }
  
  throw lastError;
}

/**
 * ==================== 导出 ====================
 */

module.exports = {
  // 分页工具
  validatePagination,
  buildPaginationResponse,
  calculateOffset,
  
  // 参数验证工具
  validateRequiredFields,
  validateStringLength,
  validateEnum,
  validateNumberRange,
  validateEmail,
  validatePhone,
  
  // 缓存键生成工具
  generateCacheKey,
  generatePaginationCacheKey,
  
  // 数据处理工具
  safeJsonParse,
  safeJsonStringify,
  deepClone,
  removeEmptyValues,
  pickFields,
  omitFields,
  
  // 字符串处理工具
  generateRandomString,
  generateUniqueId,
  truncateString,
  toCamelCase,
  toSnakeCase,
  
  // 时间处理工具
  formatTimeAgo,
  formatDate,
  
  // 安全工具
  generateHash,
  maskString,
  maskEmail,
  maskPhone,
  
  // 批量处理工具
  processBatch,
  runWithConcurrency,
  delay,
  retry
};

