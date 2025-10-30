// src/routes/feedback.js
// 反馈路由

const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// 反馈验证规则
const validateCreateFeedback = [
  body('type')
    .notEmpty()
    .withMessage('反馈类型不能为空')
    .isIn(['bug', 'feature', 'improvement', 'other'])
    .withMessage('无效的反馈类型'),

  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ min: 5, max: 100 })
    .withMessage('标题长度必须在5-100字符之间'),

  body('content')
    .notEmpty()
    .withMessage('内容不能为空')
    .isLength({ min: 10, max: 2000 })
    .withMessage('内容长度必须在10-2000字符之间'),

  body('contact')
    .optional()
    .isLength({ max: 100 })
    .withMessage('联系方式不能超过100字符'),

  body('images')
    .optional()
    .isArray({ max: 5 })
    .withMessage('最多上传5张截图'),

  handleValidationErrors,
];

const validateReplyFeedback = [
  body('content')
    .notEmpty()
    .withMessage('回复内容不能为空')
    .isLength({ min: 5, max: 1000 })
    .withMessage('回复内容长度必须在5-1000字符之间'),

  body('status')
    .optional()
    .isIn(['pending', 'processing', 'resolved', 'closed'])
    .withMessage('无效的状态值'),

  handleValidationErrors,
];

const validateUpdateStatus = [
  body('status')
    .notEmpty()
    .withMessage('状态不能为空')
    .isIn(['pending', 'processing', 'resolved', 'closed'])
    .withMessage('无效的状态值'),

  handleValidationErrors,
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('无效的ID格式'),

  handleValidationErrors,
];

// ==================== 用户反馈路由 ====================

// 提交反馈
router.post(
  '/',
  authenticate,
  validateCreateFeedback,
  FeedbackController.createFeedback
);

// 获取我的反馈列表
router.get(
  '/my',
  authenticate,
  FeedbackController.getMyFeedback
);

// 获取反馈详情
router.get(
  '/:id',
  authenticate,
  validateUUID,
  FeedbackController.getFeedbackDetail
);

// 删除反馈
router.delete(
  '/:id',
  authenticate,
  validateUUID,
  FeedbackController.deleteFeedback
);

// ==================== 管理员反馈路由 ====================
// 注意: 这些路由需要在实际使用时添加管理员权限检查中间件

// 获取所有反馈（管理员）
router.get(
  '/admin/all',
  authenticate,
  // TODO: 添加管理员权限检查中间件
  FeedbackController.getAllFeedback
);

// 回复反馈（管理员）
router.post(
  '/admin/:id/reply',
  authenticate,
  validateUUID,
  validateReplyFeedback,
  // TODO: 添加管理员权限检查中间件
  FeedbackController.replyFeedback
);

// 更新反馈状态（管理员）
router.patch(
  '/admin/:id/status',
  authenticate,
  validateUUID,
  validateUpdateStatus,
  // TODO: 添加管理员权限检查中间件
  FeedbackController.updateFeedbackStatus
);

module.exports = router;

