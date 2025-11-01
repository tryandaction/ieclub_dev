// ieclub-backend/src/routes/comments.js
// 评论路由

const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// 获取帖子的评论列表
router.get('/topic/:topicId', CommentController.getComments);

// 获取评论的回复列表
router.get('/:commentId/replies', CommentController.getReplies);

// 需要认证的路由
router.post('/', authenticate, CommentController.createComment);
router.delete('/:id', authenticate, CommentController.deleteComment);
router.post('/:id/like', authenticate, CommentController.likeComment);

module.exports = router;

