// src/middleware/validation.js
// 请求验证中间件

const { body, param, query, validationResult } = require('express-validator');
const response = require('../utils/response');

// 处理验证结果的中间件
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.error(res, '请求参数验证失败', 400, errors.array());
  }
  next();
};

// ==================== 认证相关验证 ====================

exports.validateWechatLogin = [
  body('code')
    .notEmpty()
    .withMessage('微信登录凭证不能为空')
    .isString()
    .withMessage('登录凭证必须是字符串'),

  body('userInfo')
    .optional()
    .isObject()
    .withMessage('用户信息必须是对象'),

  exports.handleValidationErrors,
];

exports.validateUpdateProfile = [
  body('nickname')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('昵称长度必须在2-20字符之间'),

  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('个人简介不能超过200字符'),

  body('skills')
    .optional()
    .isArray({ max: 10 })
    .withMessage('技能标签不能超过10个'),

  body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('兴趣标签不能超过10个'),

  exports.handleValidationErrors,
];

// ==================== 话题相关验证 ====================

exports.validateCreateTopic = [
  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度必须在5-100字符之间'),

  body('content')
    .notEmpty()
    .withMessage('内容不能为空')
    .isLength({ min: 10, max: 10000 })
    .withMessage('内容长度必须在10-10000字符之间'),

  body('type')
    .notEmpty()
    .withMessage('话题类型不能为空')
    .isIn(['supply', 'demand', 'discussion'])
    .withMessage('话题类型必须是 supply、demand 或 discussion'),

  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('标签不能超过5个'),

  exports.handleValidationErrors,
];

exports.validateUpdateTopic = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度必须在5-100字符之间'),

  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('内容不能少于10个字符'),

  exports.handleValidationErrors,
];

// ==================== 评论相关验证 ====================

exports.validateCreateComment = [
  body('content')
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: 1, max: 1000 })
    .withMessage('评论长度必须在1-1000字符之间'),

  body('parentId')
    .optional()
    .isUUID()
    .withMessage('父评论ID格式无效'),

  exports.handleValidationErrors,
];

// ==================== 通用验证 ====================

exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),

  exports.handleValidationErrors,
];

exports.validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} 必须是有效的UUID`),

  exports.handleValidationErrors,
];

exports.validateQuickAction = [
  body('actionType')
    .notEmpty()
    .withMessage('操作类型不能为空')
    .isIn(['interested', 'can_help', 'want_collab'])
    .withMessage('操作类型无效'),

  exports.handleValidationErrors,
];

exports.validateLinkPreview = [
  body('url')
    .notEmpty()
    .withMessage('链接地址不能为空')
    .isURL()
    .withMessage('链接地址格式无效'),

  exports.handleValidationErrors,
];