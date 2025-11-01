// ieclub-backend/src/controllers/moderationController.js
// 内容审核控制器

const moderationService = require('../services/moderationService');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/response');

/**
 * 检查文本内容
 */
exports.checkText = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json(error('内容不能为空'));
  }

  const result = moderationService.checkText(content);

  res.json(success(result));
});

/**
 * 审核帖子
 */
exports.moderatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const result = await moderationService.moderatePost(postId);

  res.json(success(result));
});

/**
 * 审核评论
 */
exports.moderateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const result = await moderationService.moderateComment(commentId);

  res.json(success(result));
});

/**
 * 批量审核
 */
exports.batchModerate = asyncHandler(async (req, res) => {
  const { type, ids } = req.body;

  if (!type || !ids || !Array.isArray(ids)) {
    return res.status(400).json(error('参数错误'));
  }

  const results = await moderationService.batchModerate(type, ids);

  res.json(success(results));
});

/**
 * 获取待审核内容列表
 */
exports.getPendingContents = asyncHandler(async (req, res) => {
  const { type, page, pageSize } = req.query;

  const result = await moderationService.getPendingContents({
    type: type || 'post',
    page: parseInt(page) || 1,
    pageSize: parseInt(pageSize) || 20
  });

  res.json(success(result));
});

/**
 * 人工审核
 */
exports.manualReview = asyncHandler(async (req, res) => {
  const { type, contentId } = req.params;
  const { action, reviewNote } = req.body;
  const reviewerId = req.user.id;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json(error('无效的审核操作'));
  }

  const result = await moderationService.manualReview(
    type,
    contentId,
    action,
    reviewNote,
    reviewerId
  );

  res.json(success(result, '审核完成'));
});

/**
 * 获取用户违规历史
 */
exports.getUserViolations = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await moderationService.getUserViolations(userId);

  res.json(success(result));
});

