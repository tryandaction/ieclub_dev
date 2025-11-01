// ieclub-backend/src/middleware/auditLog.js
// 安全审计日志中间件

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * 需要审计的操作类型
 */
const AUDIT_ACTIONS = {
  // 用户操作
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // 权限操作
  ROLE_ASSIGN: 'role_assign',
  ROLE_REVOKE: 'role_revoke',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_REVOKE: 'permission_revoke',
  
  // 内容操作
  POST_CREATE: 'post_create',
  POST_UPDATE: 'post_update',
  POST_DELETE: 'post_delete',
  COMMENT_CREATE: 'comment_create',
  COMMENT_DELETE: 'comment_delete',
  
  // 活动操作
  ACTIVITY_CREATE: 'activity_create',
  ACTIVITY_UPDATE: 'activity_update',
  ACTIVITY_DELETE: 'activity_delete',
  ACTIVITY_CHECKIN: 'activity_checkin',
  
  // 管理操作
  ADMIN_ACTION: 'admin_action',
  CONTENT_MODERATE: 'content_moderate',
  USER_BAN: 'user_ban',
  USER_UNBAN: 'user_unban',
  
  // 系统操作
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore',
  CONFIG_CHANGE: 'config_change',
  
  // 安全事件
  LOGIN_FAILED: 'login_failed',
  ACCESS_DENIED: 'access_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};

/**
 * 创建审计日志表（如果不存在）
 * 在数据库迁移中执行：
 * 
 * CREATE TABLE IF NOT EXISTS audit_logs (
 *   id VARCHAR(191) PRIMARY KEY,
 *   action VARCHAR(50) NOT NULL,
 *   userId VARCHAR(191),
 *   targetType VARCHAR(50),
 *   targetId VARCHAR(191),
 *   details JSON,
 *   ipAddress VARCHAR(45),
 *   userAgent TEXT,
 *   status VARCHAR(20),
 *   createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 *   INDEX idx_action (action),
 *   INDEX idx_userId (userId),
 *   INDEX idx_createdAt (createdAt),
 *   INDEX idx_status (status)
 * );
 */

/**
 * 记录审计日志
 */
async function logAudit({
  action,
  userId = null,
  targetType = null,
  targetId = null,
  details = {},
  ipAddress = null,
  userAgent = null,
  status = 'success'
}) {
  try {
    // 记录到数据库
    await prisma.$executeRaw`
      INSERT INTO audit_logs (
        id, action, userId, targetType, targetId, 
        details, ipAddress, userAgent, status, createdAt
      ) VALUES (
        UUID(), ${action}, ${userId}, ${targetType}, ${targetId},
        ${JSON.stringify(details)}, ${ipAddress}, ${userAgent}, ${status}, NOW()
      )
    `;
    
    // 同时记录到日志文件
    logger.info('Audit Log', {
      action,
      userId,
      targetType,
      targetId,
      status,
      ipAddress
    });
    
  } catch (error) {
    // 审计日志失败不应该影响主流程
    logger.error('Failed to create audit log:', error);
  }
}

/**
 * 审计日志中间件
 * 自动记录需要审计的操作
 */
function auditMiddleware(action, options = {}) {
  return async (req, res, next) => {
    // 保存原始的 json 方法
    const originalJson = res.json.bind(res);
    
    // 重写 json 方法以在响应后记录审计日志
    res.json = function(data) {
      // 确定操作状态
      const status = data.success !== false ? 'success' : 'failure';
      
      // 提取目标信息
      const targetType = options.targetType || req.params.type;
      const targetId = options.targetId || req.params.id || data.data?.id;
      
      // 构建详细信息
      const details = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: sanitizeBody(req.body),
        response: sanitizeResponse(data)
      };
      
      // 记录审计日志（异步，不阻塞响应）
      logAudit({
        action,
        userId: req.user?.id,
        targetType,
        targetId,
        details,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status
      }).catch(error => {
        logger.error('Audit log error:', error);
      });
      
      // 调用原始方法
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * 清理敏感信息
 */
function sanitizeBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

function sanitizeResponse(response) {
  if (!response || !response.data) return null;
  
  // 只保留关键信息，避免日志过大
  return {
    success: response.success,
    message: response.message,
    dataKeys: response.data ? Object.keys(response.data) : []
  };
}

/**
 * 查询审计日志
 */
async function getAuditLogs(filters = {}) {
  const {
    action,
    userId,
    startDate,
    endDate,
    status,
    page = 1,
    limit = 50
  } = filters;
  
  const conditions = [];
  const params = [];
  
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  
  if (userId) {
    conditions.push('userId = ?');
    params.push(userId);
  }
  
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  
  if (startDate) {
    conditions.push('createdAt >= ?');
    params.push(startDate);
  }
  
  if (endDate) {
    conditions.push('createdAt <= ?');
    params.push(endDate);
  }
  
  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ')
    : '';
  
  const offset = (page - 1) * limit;
  
  const logs = await prisma.$queryRawUnsafe(`
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ${limit} OFFSET ${offset}
  `, ...params);
  
  const totalResult = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as total FROM audit_logs
    ${whereClause}
  `, ...params);
  
  return {
    logs,
    total: totalResult[0].total,
    page,
    limit,
    totalPages: Math.ceil(totalResult[0].total / limit)
  };
}

/**
 * 获取审计日志统计
 */
async function getAuditStats(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await prisma.$queryRaw`
    SELECT 
      action,
      status,
      COUNT(*) as count,
      DATE(createdAt) as date
    FROM audit_logs
    WHERE createdAt >= ${startDate}
    GROUP BY action, status, DATE(createdAt)
    ORDER BY date DESC, count DESC
  `;
  
  return stats;
}

/**
 * 清理旧的审计日志
 */
async function cleanupOldLogs(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.$executeRaw`
    DELETE FROM audit_logs
    WHERE createdAt < ${cutoffDate}
  `;
  
  logger.info(`Cleaned up ${result} old audit logs`);
  return result;
}

module.exports = {
  AUDIT_ACTIONS,
  logAudit,
  auditMiddleware,
  getAuditLogs,
  getAuditStats,
  cleanupOldLogs
};

