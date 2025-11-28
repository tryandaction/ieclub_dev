// 小组/圈子路由
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开接口
router.get('/categories', groupController.getGroupCategories);
router.get('/hot', groupController.getHotGroups);
router.get('/', optionalAuth, groupController.getGroups);
router.get('/:id', optionalAuth, groupController.getGroupDetail);
router.get('/:id/topics', groupController.getGroupTopics);
router.get('/:id/members', groupController.getGroupMembers);

// 需要登录的接口
router.get('/me/list', authenticate, groupController.getMyGroups);
router.post('/', authenticate, groupController.createGroup);
router.put('/:id', authenticate, groupController.updateGroup);
router.post('/:id/join', authenticate, groupController.joinGroup);
router.post('/:id/leave', authenticate, groupController.leaveGroup);
router.post('/:id/topics', authenticate, groupController.createGroupTopic);
router.post('/:id/requests/:requestId/handle', authenticate, groupController.handleJoinRequest);

module.exports = router;
