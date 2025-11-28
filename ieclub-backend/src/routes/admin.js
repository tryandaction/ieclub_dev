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
const contentController = require('../controllers/admin/contentController');
const reportController = require('../controllers/admin/reportController');
const auditController = require('../controllers/admin/auditController');

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
  reportController.getReports
);

router.get(
  '/reports/stats',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_READ),
  reportController.getReportStats
);

router.get(
  '/reports/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_READ),
  reportController.getReportDetail
);

router.post(
  '/reports/:id/handle',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.REPORT_HANDLE),
  logAdminAction('handle', 'report'),
  reportController.handleReport
);

// ==================== 审计日志路由 ====================
router.get(
  '/audit/logs',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_LOG_VIEW),
  auditController.getLogs
);

router.get(
  '/audit/stats',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_LOG_VIEW),
  auditController.getStats
);

router.get(
  '/audit/logs/export',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_LOG_VIEW),
  auditController.exportLogs
);

router.get(
  '/audit/logs/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.AUDIT_LOG_VIEW),
  auditController.getLogDetail
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

// ==================== 内容管理路由 ====================
// 话题列表
router.get(
  '/content/topics',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_READ),
  contentController.getTopics
);

// 话题详情
router.get(
  '/content/topics/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_READ),
  contentController.getTopicDetail
);

// 删除话题
router.delete(
  '/content/topics/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_DELETE),
  logAdminAction('delete', 'topic'),
  contentController.deleteTopic
);

// 锁定/解锁话题
router.put(
  '/content/topics/:id/lock',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_UPDATE),
  logAdminAction('lock', 'topic'),
  contentController.toggleTopicLock
);

// 活动列表
router.get(
  '/content/activities',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_READ),
  contentController.getActivities
);

// 删除活动
router.delete(
  '/content/activities/:id',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.TOPIC_DELETE),
  logAdminAction('delete', 'activity'),
  contentController.deleteActivity
);

// 内容统计
router.get(
  '/content/stats',
  authenticateAdmin,
  requirePermission(ADMIN_PERMISSIONS.STATS_VIEW),
  contentController.getContentStats
);

module.exports = router;
