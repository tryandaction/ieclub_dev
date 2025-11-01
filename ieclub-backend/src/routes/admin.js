// ieclub-backend/src/routes/admin.js
// 管理后台路由

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, logAdminAction } = require('../middleware/adminAuth');

// 所有管理后台路由都需要认证和管理员权限
router.use(authenticate);
// 使用新的RBAC权限系统或旧的管理员验证
// 优先使用新的权限系统，如果没有配置权限则fallback到旧系统
router.use(async (req, res, next) => {
  try {
    // 尝试使用RBAC系统
    const rbacService = require('../services/rbacService');
    const hasAdminAccess = await rbacService.userHasPermission(req.user.id, 'admin.access');
    
    if (hasAdminAccess) {
      return next();
    }
    
    // Fallback到旧的管理员验证
    requireAdmin(req, res, next);
  } catch (error) {
    // 如果RBAC系统出错，使用旧系统
    requireAdmin(req, res, next);
  }
});

// ==================== 概览 ====================
/**
 * @route   GET /api/admin/dashboard
 * @desc    获取管理后台概览数据
 * @access  Admin
 */
router.get('/dashboard', adminController.getDashboardOverview);

// ==================== 用户管理 ====================
/**
 * @route   GET /api/admin/users
 * @desc    获取用户列表
 * @access  Admin
 */
router.get('/users', adminController.getUsers);

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    更新用户状态
 * @access  Admin
 */
router.put(
  '/users/:userId/status',
  logAdminAction('update_user_status'),
  adminController.updateUserStatus
);

/**
 * @route   POST /api/admin/users/batch
 * @desc    批量操作用户
 * @access  SuperAdmin
 */
router.post(
  '/users/batch',
  requireSuperAdmin,
  logAdminAction('batch_update_users'),
  adminController.batchUpdateUsers
);

// ==================== 内容管理 ====================
/**
 * @route   GET /api/admin/contents
 * @desc    获取内容列表（帖子/评论）
 * @access  Admin
 */
router.get('/contents', adminController.getContents);

/**
 * @route   PUT /api/admin/contents/:type/:contentId/status
 * @desc    更新内容状态
 * @access  Admin
 */
router.put(
  '/contents/:type/:contentId/status',
  logAdminAction('update_content_status'),
  adminController.updateContentStatus
);

// ==================== 活动管理 ====================
/**
 * @route   GET /api/admin/activities
 * @desc    获取活动列表
 * @access  Admin
 */
router.get('/activities', adminController.getActivities);

// ==================== 举报管理 ====================
/**
 * @route   GET /api/admin/reports
 * @desc    获取举报列表
 * @access  Admin
 */
router.get('/reports', adminController.getReports);

/**
 * @route   PUT /api/admin/reports/:reportId/handle
 * @desc    处理举报
 * @access  Admin
 */
router.put(
  '/reports/:reportId/handle',
  logAdminAction('handle_report'),
  adminController.handleReport
);

// ==================== 系统统计 ====================
/**
 * @route   GET /api/admin/stats/system
 * @desc    获取系统统计数据
 * @access  Admin
 */
router.get('/stats/system', adminController.getSystemStats);

// ==================== 公告管理 ====================
/**
 * @route   POST /api/admin/announcements
 * @desc    发送系统公告
 * @access  Admin
 */
router.post(
  '/announcements',
  logAdminAction('send_announcement'),
  adminController.sendAnnouncement
);

// ==================== RBAC 角色权限管理 ====================
const adminRBACController = require('../controllers/adminRBACController');

/**
 * @route   GET /api/admin/rbac/overview
 * @desc    获取角色权限管理概览
 * @access  Admin
 */
router.get('/rbac/overview', adminRBACController.getOverview);

/**
 * @route   GET /api/admin/rbac/users/:userId/details
 * @desc    获取用户角色权限详情
 * @access  Admin
 */
router.get('/rbac/users/:userId/details', adminRBACController.getUserRoleDetails);

/**
 * @route   GET /api/admin/rbac/permission-matrix
 * @desc    获取权限矩阵
 * @access  Admin
 */
router.get('/rbac/permission-matrix', adminRBACController.getPermissionMatrix);

/**
 * @route   GET /api/admin/rbac/search-users
 * @desc    搜索用户（用于分配角色）
 * @access  Admin
 */
router.get('/rbac/search-users', adminRBACController.searchUsers);

/**
 * @route   POST /api/admin/rbac/batch-assign
 * @desc    批量分配角色
 * @access  Admin
 */
router.post(
  '/rbac/batch-assign',
  logAdminAction('batch_assign_roles'),
  adminRBACController.batchAssignRoles
);

/**
 * @route   POST /api/admin/rbac/batch-remove
 * @desc    批量移除角色
 * @access  Admin
 */
router.post(
  '/rbac/batch-remove',
  logAdminAction('batch_remove_roles'),
  adminRBACController.batchRemoveRoles
);

// ==================== 数据导出 ====================
/**
 * @route   GET /api/admin/export
 * @desc    导出数据
 * @access  SuperAdmin
 */
router.get('/export', requireSuperAdmin, adminController.exportData);

module.exports = router;

