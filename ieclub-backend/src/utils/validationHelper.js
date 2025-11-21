/**
 * 验证辅助工具
 * 统一常用验证逻辑
 */

const { AppError, ERROR_TYPES } = require('./AppError');

/**
 * 验证必填字段
 * @param {Object} data - 数据对象
 * @param {string[]} requiredFields - 必填字段列表
 * @param {string} errorMessage - 错误消息前缀
 * @throws {AppError}
 */
function validateRequired(data, requiredFields, errorMessage = '缺少必填字段') {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    throw new AppError(
      `${errorMessage}: ${missingFields.join(', ')}`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证字符串长度
 * @param {string} value - 值
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} fieldName - 字段名称
 * @throws {AppError}
 */
function validateLength(value, min, max, fieldName = '字段') {
  if (typeof value !== 'string') {
    throw new AppError(
      `${fieldName}必须是字符串`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  const length = value.trim().length;
  
  if (length < min) {
    throw new AppError(
      `${fieldName}长度不能少于${min}个字符`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (length > max) {
    throw new AppError(
      `${fieldName}长度不能超过${max}个字符`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @throws {AppError}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new AppError(
      '邮箱地址不能为空',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new AppError(
      '邮箱格式不正确',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @throws {AppError}
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    throw new AppError(
      '手机号不能为空',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    throw new AppError(
      '手机号格式不正确',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {Object} options - 选项
 * @throws {AppError}
 */
function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    maxLength = 32,
    requireNumber = true,
    requireLetter = true,
    requireSpecial = false
  } = options;
  
  if (!password || typeof password !== 'string') {
    throw new AppError(
      '密码不能为空',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (password.length < minLength) {
    throw new AppError(
      `密码长度不能少于${minLength}位`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (password.length > maxLength) {
    throw new AppError(
      `密码长度不能超过${maxLength}位`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (requireNumber && !/\d/.test(password)) {
    throw new AppError(
      '密码必须包含数字',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (requireLetter && !/[a-zA-Z]/.test(password)) {
    throw new AppError(
      '密码必须包含字母',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new AppError(
      '密码必须包含特殊字符',
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证数组长度
 * @param {Array} arr - 数组
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @param {string} fieldName - 字段名称
 * @throws {AppError}
 */
function validateArrayLength(arr, min, max, fieldName = '数组') {
  if (!Array.isArray(arr)) {
    throw new AppError(
      `${fieldName}必须是数组`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (arr.length < min) {
    throw new AppError(
      `${fieldName}至少需要${min}个元素`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  if (arr.length > max) {
    throw new AppError(
      `${fieldName}最多${max}个元素`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证ID格式
 * @param {string} id - ID
 * @param {string} fieldName - 字段名称
 * @throws {AppError}
 */
function validateId(id, fieldName = 'ID') {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new AppError(
      `${fieldName}不能为空`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
  
  // CUID格式验证（Prisma默认使用CUID）
  if (!/^c[a-z0-9]{24}$/.test(id)) {
    throw new AppError(
      `${fieldName}格式不正确`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证枚举值
 * @param {any} value - 值
 * @param {Array} allowedValues - 允许的值列表
 * @param {string} fieldName - 字段名称
 * @throws {AppError}
 */
function validateEnum(value, allowedValues, fieldName = '字段') {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`,
      400,
      ERROR_TYPES.VALIDATION_ERROR
    );
  }
}

/**
 * 验证分页参数
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {number} maxPageSize - 最大每页数量
 * @returns {{page: number, pageSize: number}}
 */
function validatePagination(page, pageSize, maxPageSize = 100) {
  const validPage = Math.max(1, parseInt(page) || 1);
  let validPageSize = Math.max(1, parseInt(pageSize) || 10);
  
  if (validPageSize > maxPageSize) {
    validPageSize = maxPageSize;
  }
  
  return { page: validPage, pageSize: validPageSize };
}

/**
 * 验证排序参数
 * @param {string} sortBy - 排序字段
 * @param {string} order - 排序方向
 * @param {string[]} allowedFields - 允许的排序字段
 * @returns {{sortBy: string, order: string}}
 */
function validateSort(sortBy, order, allowedFields = []) {
  let validSortBy = sortBy || 'createdAt';
  let validOrder = (order || 'desc').toLowerCase();
  
  if (allowedFields.length > 0 && !allowedFields.includes(validSortBy)) {
    validSortBy = allowedFields[0];
  }
  
  if (!['asc', 'desc'].includes(validOrder)) {
    validOrder = 'desc';
  }
  
  return { sortBy: validSortBy, order: validOrder };
}

module.exports = {
  validateRequired,
  validateLength,
  validateEmail,
  validatePhone,
  validatePassword,
  validateArrayLength,
  validateId,
  validateEnum,
  validatePagination,
  validateSort
};
