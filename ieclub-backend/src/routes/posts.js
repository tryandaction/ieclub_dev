// ieclub-backend/src/routes/posts.js
// 帖子路由

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');

// 公开路由
router.get('/', postController.getPosts);
router.get('/:postId', postController.getPostById);

// 需要认证的路由
router.post('/', authenticate, postController.createPost);
router.put('/:postId', authenticate, postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);

// 点赞和收藏
router.post('/:postId/like', authenticate, postController.toggleLikePost);
router.post('/:postId/favorite', authenticate, postController.toggleFavoritePost);

// 用户相关
router.get('/user/:userId', postController.getUserPosts);
router.get('/favorites/me', authenticate, postController.getMyFavorites);

module.exports = router;

