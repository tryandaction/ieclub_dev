// ieclub-backend/src/routes/moderation.js
// 内容审核路由

const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, logAdminAction } = require('../middleware/adminAuth');

// ==================== 公共接口 ====================
/**
 * @route   POST /api/moderation/check
 * @desc    检查文本内容（用于实时检查）
 * @access  Public
 */
router.post('/check', moderationController.checkText);

// ==================== 管理员接口 ====================
// 需要管理员权限
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/moderation/pending
 * @desc    获取待审核内容列表
 * @access  Admin
 */
router.get('/pending', moderationController.getPendingContents);

/**
 * @route   POST /api/moderation/post/:postId
 * @desc    审核帖子
 * @access  Admin
 */
router.post(
  '/post/:postId',
  logAdminAction('moderate_post'),
  moderationController.moderatePost
);

/**
 * @route   POST /api/moderation/comment/:commentId
 * @desc    审核评论
 * @access  Admin
 */
router.post(
  '/comment/:commentId',
  logAdminAction('moderate_comment'),
  moderationController.moderateComment
);

/**
 * @route   POST /api/moderation/batch
 * @desc    批量审核
 * @access  Admin
 */
router.post(
  '/batch',
  logAdminAction('batch_moderate'),
  moderationController.batchModerate
);

/**
 * @route   PUT /api/moderation/:type/:contentId/review
 * @desc    人工审核
 * @access  Admin
 */
router.put(
  '/:type/:contentId/review',
  logAdminAction('manual_review'),
  moderationController.manualReview
);

/**
 * @route   GET /api/moderation/users/:userId/violations
 * @desc    获取用户违规历史
 * @access  Admin
 */
router.get('/users/:userId/violations', moderationController.getUserViolations);

module.exports = router;

