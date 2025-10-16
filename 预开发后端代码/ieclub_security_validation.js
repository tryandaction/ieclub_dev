// src/middleware/validation.js
// 输入验证中间件（使用 express-validator）

const { body, param, query, validationResult } = require('express-validator');
const response = require('../utils/response');
const config = require('../config');

/**
 * 验证结果处理中间件
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return response.error(res, '参数验证失败', 400, errors.array());
  }
  next();
};

/**
 * 微信登录验证
 */
exports.validateWechatLogin = [
  body('code')
    .notEmpty()
    .withMessage('code 不能为空')
    .isString()
    .withMessage('code 必须是字符串'),
  body('userInfo')
    .optional()
    .isObject()
    .withMessage('userInfo 必须是对象'),
  exports.validate,
];

/**
 * 创建话题验证
 */
exports.validateCreateTopic = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: config.business.topic.titleMinLength })
    .withMessage(`标题至少 ${config.business.topic.titleMinLength} 个字符`)
    .isLength({ max: config.business.topic.titleMaxLength })
    .withMessage(`标题最多 ${config.business.topic.titleMaxLength} 个字符`)
    .escape(), // 防止 XSS
  body('content')
    .trim()
    .notEmpty()
    .withMessage('内容不能为空')
    .isLength({ min: config.business.topic.contentMinLength })
    .withMessage(`内容至少 ${config.business.topic.contentMinLength} 个字符`)
    .isLength({ max: config.business.topic.contentMaxLength })
    .withMessage(`内容最多 ${config.business.topic.contentMaxLength} 个字符`),
  body('category')
    .notEmpty()
    .withMessage('分类不能为空')
    .isIn(['学术', '技术', '兴趣', '活动', '项目', '其他'])
    .withMessage('无效的分类'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => tags.length <= config.business.topic.maxTags)
    .withMessage(`标签最多 ${config.business.topic.maxTags} 个`),
  body('topicType')
    .optional()
    .isIn(['discussion', 'demand', 'supply', 'question', 'activity', 'collaboration'])
    .withMessage('无效的话题类型'),
  body('images')
    .optional()
    .isArray()
    .withMessage('images 必须是数组')
    .custom((images) => images.length <= config.business.topic.maxImages)
    .withMessage(`图片最多 ${config.business.topic.maxImages} 张`),
  body('documents')
    .optional()
    .isArray()
    .withMessage('documents 必须是数组')
    .custom((docs) => docs.length <= config.business.topic.maxDocuments)
    .withMessage(`文档最多 ${config.business.topic.maxDocuments} 个`),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('deadline 必须是有效的日期'),
  exports.validate,
];

/**
 * 更新话题验证
 */
exports.validateUpdateTopic = [
  param('id')
    .isUUID()
    .withMessage('无效的话题 ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: config.business.topic.titleMinLength, max: config.business.topic.titleMaxLength })
    .withMessage(`标题长度必须在 ${config.business.topic.titleMinLength}-${config.business.topic.titleMaxLength} 之间`)
    .escape(),
  body('content')
    .optional()
    .trim()
    .isLength({ min: config.business.topic.contentMinLength, max: config.business.topic.contentMaxLength })
    .withMessage(`内容长度必须在 ${config.business.topic.contentMinLength}-${config.business.topic.contentMaxLength} 之间`),
  exports.validate,
];

/**
 * 创建评论验证
 */
exports.validateCreateComment = [
  param('topicId')
    .isUUID()
    .withMessage('无效的话题 ID'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('评论内容不能为空')
    .isLength({ min: config.business.comment.minLength })
    .withMessage(`评论至少 ${config.business.comment.minLength} 个字符`)
    .isLength({ max: config.business.comment.maxLength })
    .withMessage(`评论最多 ${config.business.comment.maxLength} 个字符`),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('无效的父评论 ID'),
  body('images')
    .optional()
    .isArray()
    .withMessage('images 必须是数组')
    .custom((images) => images.length <= config.business.comment.maxImages)
    .withMessage(`图片最多 ${config.business.comment.maxImages} 张`),
  exports.validate,
];

/**
 * 更新个人信息验证
 */
exports.validateUpdateProfile = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('昵称长度必须在 2-20 之间')
    .matches(/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/)
    .withMessage('昵称只能包含中文、英文、数字和下划线')
    .escape(),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('个人简介最多 200 个字符'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('无效的邮箱地址')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('无效的手机号码'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('skills 必须是数组')
    .custom((skills) => skills.length <= 10)
    .withMessage('技能标签最多 10 个'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('interests 必须是数组')
    .custom((interests) => interests.length <= 10)
    .withMessage('兴趣标签最多 10 个'),
  exports.validate,
];

/**
 * 快速操作验证
 */
exports.validateQuickAction = [
  param('id')
    .isUUID()
    .withMessage('无效的话题 ID'),
  body('actionType')
    .notEmpty()
    .withMessage('actionType 不能为空')
    .isIn(['interested', 'can_help', 'want_collab'])
    .withMessage('无效的操作类型'),
  exports.validate,
];

/**
 * 链接预览验证
 */
exports.validateLinkPreview = [
  body('url')
    .notEmpty()
    .withMessage('url 不能为空')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('无效的 URL'),
  exports.validate,
];

/**
 * 分页参数验证
 */
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page 必须是大于 0 的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit 必须是 1-100 之间的整数'),
  exports.validate,
];

/**
 * UUID 参数验证
 */
exports.validateUUID = (paramName = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`无效的 ${paramName}`),
  exports.validate,
];

/**
 * 自定义验证器：检查数组元素是否为 URL
 */
exports.isArrayOfUrls = (value) => {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    try {
      new URL(item);
      return true;
    } catch {
      return false;
    }
  });
};

/**
 * 自定义验证器：检查 JSON 对象大小
 */
exports.isValidJsonSize = (maxSize = 10000) => {
  return (value) => {
    const jsonString = JSON.stringify(value);
    return jsonString.length <= maxSize;
  };
};
