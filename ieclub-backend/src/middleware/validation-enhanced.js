// ieclub-backend/src/middleware/validation-enhanced.js
// 增强的验证中间件

const { body, query, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * 验证结果处理中间件
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('验证失败', {
      path: req.path,
      errors: formattedErrors,
      requestId: req.requestId
    });

    return res.status(400).json({
      success: false,
      code: 400,
      message: '参数验证失败',
      error: {
        code: 'VALIDATION_ERROR',
        details: formattedErrors
      },
      meta: {
        timestamp: Date.now(),
        requestId: req.requestId
      }
    });
  }

  next();
}

/**
 * 分页验证规则
 */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页大小必须在1-100之间'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页大小必须在1-100之间')
];

/**
 * 排序验证规则
 */
const sortRules = [
  query('sortBy')
    .optional()
    .isString()
    .withMessage('排序字段必须是字符串'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须是asc或desc')
];

/**
 * ID验证规则
 */
const idRules = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('ID不能为空')
];

/**
 * 邮箱验证规则
 */
const emailRules = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('邮箱格式不正确')
];

/**
 * 密码验证规则
 */
const passwordRules = [
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('密码长度必须在6-50个字符之间')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字')
];

/**
 * 字符串长度验证规则
 * @param {string} field - 字段名
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 */
function stringLengthRules(field, min, max) {
  return [
    body(field)
      .isLength({ min, max })
      .withMessage(`${field}长度必须在${min}-${max}个字符之间`)
  ];
}

/**
 * 可选字符串验证规则
 * @param {string} field - 字段名
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 */
function optionalStringLengthRules(field, min, max) {
  return [
    body(field)
      .optional()
      .isLength({ min, max })
      .withMessage(`${field}长度必须在${min}-${max}个字符之间`)
  ];
}

/**
 * 数字范围验证规则
 * @param {string} field - 字段名
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 */
function numberRangeRules(field, min, max) {
  return [
    body(field)
      .isInt({ min, max })
      .withMessage(`${field}必须在${min}-${max}之间`)
  ];
}

/**
 * 枚举值验证规则
 * @param {string} field - 字段名
 * @param {Array} allowedValues - 允许的值
 */
function enumRules(field, allowedValues) {
  return [
    body(field)
      .isIn(allowedValues)
      .withMessage(`${field}必须是以下值之一: ${allowedValues.join(', ')}`)
  ];
}

/**
 * 创建验证中间件
 * @param {Array} rules - 验证规则数组
 * @returns {Array} 中间件数组
 */
function validate(rules) {
  return [...rules, handleValidationErrors];
}

module.exports = {
  handleValidationErrors,
  validate,
  paginationRules,
  sortRules,
  idRules,
  emailRules,
  passwordRules,
  stringLengthRules,
  optionalStringLengthRules,
  numberRangeRules,
  enumRules
};

