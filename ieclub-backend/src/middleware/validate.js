// src/middleware/validate.js
// 统一的输入验证中间件

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * 验证中间件
 * 执行 express-validator 验证规则并处理错误
 * 
 * @param {Array} validations - express-validator 验证规则数组
 * @returns {Function} Express 中间件函数
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 并行执行所有验证规则
    await Promise.all(validations.map(validation => validation.run(req)));

    // 获取验证结果
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // 格式化错误信息
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    // 返回验证错误
    return next(AppError.ValidationError('输入验证失败', formattedErrors));
  };
};

/**
 * 单个验证规则的快捷方法
 * 
 * @param {Function} validation - 单个 express-validator 验证规则
 * @returns {Function} Express 中间件函数
 */
const validateSingle = (validation) => {
  return validate([validation]);
};

/**
 * 条件验证
 * 只在满足条件时执行验证
 * 
 * @param {Function} condition - 条件函数，返回 boolean
 * @param {Array} validations - 验证规则数组
 * @returns {Function} Express 中间件函数
 */
const validateIf = (condition, validations) => {
  return async (req, res, next) => {
    if (condition(req)) {
      return validate(validations)(req, res, next);
    }
    next();
  };
};

/**
 * 自定义验证函数
 * 用于复杂的业务逻辑验证
 * 
 * @param {Function} validator - 验证函数，返回 Promise<boolean> 或 boolean
 * @param {string} errorMessage - 错误消息
 * @returns {Function} Express 中间件函数
 */
const customValidate = (validator, errorMessage) => {
  return async (req, res, next) => {
    try {
      const isValid = await validator(req);
      if (isValid) {
        return next();
      }
      return next(AppError.ValidationError(errorMessage));
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = {
  validate,
  validateSingle,
  validateIf,
  customValidate
};

