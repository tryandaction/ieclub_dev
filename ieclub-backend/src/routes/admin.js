// 管理员路由
const express = require('express');
const router = express.Router();

// 中间件
const {
  authenticateAdmin,
  requirePermission,
  requireAnyPermission,
  requireSuperAdmin,
  logAdminAction,
  checkAccountLock,
  loginRateLimiter,
} = require('../middleware/adminAuth');

const { ADMIN_PERMISSIONS } = require('../utils/adminAuth');

// Controllers
const adminAuthController = require('../controllers/adminAuthController');
const announcementController = require('../controllers/admin/announcementController');
const userManagementController = require('../controllers/admin/userManagementController');
const statsController = require('../controllers/admin/statsController');
const emailWhitelistController = require('../controllers/admin/emailWhitelistController');

// ==================== 认证路由 ====================
// 登录
router.post('/auth/login', checkAccountLock, loginRateLimiter, adminAuthController.login);

// 登出
router.post('/auth/logout', authenticateAdmin, adminAuthController.logout);

// 刷新令牌
router.post('/auth/refresh', adminAuthController.refresh);

// 获取当前管理员信息
router.get('/auth/me', authenticateAdmin, adminAuthController.getMe);

// 修改密码
router.post('/auth/change-password', authenticateAdmin, adminAuthController.changePassword);

// 2FA相关
router.post('/auth/enable-2fa', authenticateAdmin, adminAuthController.enable2FA);
router.post('/auth/verify-2fa', authenticateAdmin, adminAuthController.verify2FA);
router.post('/auth/disable-2fa', authenticateAdmin, adminAuthController.disable2FA);

// ==================== 公告管理路由 ====================
router.get(
  '/announcements',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_READ),
  announcementController.getAnnouncements
);

router.get(
  '/announcements/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_READ),
  announcementController.getAnnouncement
);

router.post(
  '/announcements',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_CREATE),
  logAdminAction('create', 'announcement'),
  announcementController.createAnnouncement
);

router.put(
  '/announcements/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_UPDATE),
  logAdminAction('update', 'announcement'),
  announcementController.updateAnnouncement
);

router.delete(
  '/announcements/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_DELETE),
  logAdminAction('delete', 'announcement'),
  announcementController.deleteAnnouncement
);

router.post(
  '/announcements/:id/publish',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_CREATE),
  logAdminAction('publish', 'announcement'),
  announcementController.publishAnnouncement
);

router.get(
  '/announcements/:id/stats',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.ANNOUNCEMENT_READ),
  announcementController.getAnnouncementStats
);

// ==================== 用户管理路由 ====================
router.get(
  '/users',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_READ),
  userManagementController.getUsers
);

router.get(
  '/users/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_READ),
  userManagementController.getUser
);

router.put(
  '/users/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('update', 'user'),
  userManagementController.updateUser
);

router.post(
  '/users/:id/warn',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('warn', 'user'),
  userManagementController.warnUser
);

router.post(
  '/users/:id/ban',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_BAN),
  logAdminAction('ban', 'user'),
  userManagementController.banUser
);

router.post(
  '/users/:id/unban',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_BAN),
  logAdminAction('unban', 'user'),
  userManagementController.unbanUser
);

router.delete(
  '/users/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_DELETE),
  logAdminAction('delete', 'user'),
  userManagementController.deleteUser
);

// ==================== 数据统计路由 ====================
router.get(
  '/stats/dashboard',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_VIEW),
  statsController.getDashboard
);

router.get(
  '/stats/users',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_VIEW),
  statsController.getUserStats
);

router.get(
  '/stats/content',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_VIEW),
  statsController.getContentStats
);

router.get(
  '/stats/engagement',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_VIEW),
  statsController.getEngagementStats
);

router.post(
  '/stats/export',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_EXPORT),
  logAdminAction('export', 'stats'),
  statsController.exportData
);

// ==================== 举报管理路由 ====================
router.get(
  '/reports',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_READ),
  async (req, res) => {
    try {
      const { page = 1, pageSize = 10, status, type } = req.query;
      
      // 这里返回空列表，实际实现需要查询数据库
      res.json({
        code: 0,
        message: '获取成功',
        data: {
          reports: [],
          total: 0,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
      });
    }
  }
);

router.get(
  '/reports/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_READ),
  async (req, res) => {
    try {
      res.json({
        code: 0,
        message: '获取成功',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
      });
    }
  }
);

router.put(
  '/reports/:id/handle',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_HANDLE),
  logAdminAction('handle', 'report'),
  async (req, res) => {
    try {
      res.json({
        code: 0,
        message: '处理成功',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
      });
    }
  }
);

// ==================== 审计日志路由 ====================
router.get(
  '/audit/logs',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_READ),
  async (req, res) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;
      
      // 这里返回空列表，实际实现需要查询数据库
      res.json({
        code: 0,
        message: '获取成功',
        data: {
          logs: [],
          total: 0,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
      });
    }
  }
);

router.get(
  '/audit/logs/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_READ),
  async (req, res) => {
    try {
      res.json({
        code: 0,
        message: '获取成功',
        data: null,
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: error.message,
      });
    }
  }
);

// ==================== 邮箱白名单管理路由（测试环境） ====================
router.get(
  '/email-whitelist',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_READ),
  emailWhitelistController.getWhitelist
);

router.get(
  '/email-whitelist/pending',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_READ),
  emailWhitelistController.getPending
);

router.post(
  '/email-whitelist',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('add', 'email_whitelist'),
  emailWhitelistController.addToWhitelist
);

router.post(
  '/email-whitelist/:email/approve',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('approve', 'email_whitelist'),
  emailWhitelistController.approveEmail
);

router.post(
  '/email-whitelist/:email/reject',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('reject', 'email_whitelist'),
  emailWhitelistController.rejectEmail
);

router.delete(
  '/email-whitelist/:email',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('remove', 'email_whitelist'),
  emailWhitelistController.removeEmail
);

router.post(
  '/email-whitelist/batch-approve',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.USER_UPDATE),
  logAdminAction('batch_approve', 'email_whitelist'),
  emailWhitelistController.batchApprove
);

module.exports = router;
