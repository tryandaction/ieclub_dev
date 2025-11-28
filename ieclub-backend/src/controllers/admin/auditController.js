// 审计日志控制器
const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');

class AuditController {
  /**
   * 获取审计日志列表
   */
  static async getLogs(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        action,
        level,
        startDate,
        endDate,
        keyword,
        adminId
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      // 构建查询条件
      const where = {};
      
      if (action) {
        where.action = action;
      }
      
      if (level) {
        where.level = level;
      }
      
      if (adminId) {
        where.adminId = adminId;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }
      
      if (keyword) {
        where.OR = [
          { ipAddress: { contains: keyword } },
          { description: { contains: keyword } },
          { admin: { username: { contains: keyword } } },
          { admin: { realName: { contains: keyword } } }
        ];
      }

      // 查询审计日志列表
      const [logs, total] = await Promise.all([
        prisma.adminAuditLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true
              }
            }
          }
        }),
        prisma.adminAuditLog.count({ where })
      ]);

      res.json(successResponse({
        list: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / take)
        }
      }, '获取审计日志成功'));
    } catch (error) {
      console.error('获取审计日志失败:', error);
      res.status(500).json(errorResponse('获取审计日志失败'));
    }
  }

  /**
   * 获取日志详情
   */
  static async getLogDetail(req, res) {
    try {
      const { id } = req.params;

      const log = await prisma.adminAuditLog.findUnique({
        where: { id },
        include: {
          admin: {
            select: {
              id: true,
              username: true,
              realName: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      if (!log) {
        return res.status(404).json(errorResponse('日志不存在'));
      }

      res.json(successResponse(log, '获取日志详情成功'));
    } catch (error) {
      console.error('获取日志详情失败:', error);
      res.status(500).json(errorResponse('获取日志详情失败'));
    }
  }

  /**
   * 获取审计统计
   */
  static async getStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [total, todayCount, weekCount, byAction, byLevel] = await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.count({
          where: { createdAt: { gte: today } }
        }),
        prisma.adminAuditLog.count({
          where: { createdAt: { gte: weekAgo } }
        }),
        prisma.adminAuditLog.groupBy({
          by: ['action'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),
        prisma.adminAuditLog.groupBy({
          by: ['level'],
          _count: { id: true }
        })
      ]);

      // 获取活跃管理员
      const activeAdmins = await prisma.adminAuditLog.groupBy({
        by: ['adminId'],
        _count: { id: true },
        where: { createdAt: { gte: weekAgo } },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      });

      // 获取管理员详情
      const adminIds = activeAdmins.map(a => a.adminId);
      const admins = await prisma.admin.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, username: true, realName: true }
      });

      const adminMap = new Map(admins.map(a => [a.id, a]));

      res.json(successResponse({
        total,
        todayCount,
        weekCount,
        byAction: byAction.map(item => ({
          action: item.action,
          count: item._count.id
        })),
        byLevel: byLevel.map(item => ({
          level: item.level,
          count: item._count.id
        })),
        activeAdmins: activeAdmins.map(item => ({
          admin: adminMap.get(item.adminId),
          count: item._count.id
        }))
      }, '获取统计成功'));
    } catch (error) {
      console.error('获取审计统计失败:', error);
      res.status(500).json(errorResponse('获取审计统计失败'));
    }
  }

  /**
   * 导出审计日志
   */
  static async exportLogs(req, res) {
    try {
      const {
        action,
        level,
        startDate,
        endDate,
        adminId
      } = req.query;

      // 构建查询条件
      const where = {};
      
      if (action) where.action = action;
      if (level) where.level = level;
      if (adminId) where.adminId = adminId;
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const logs = await prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000, // 最多导出1万条
        include: {
          admin: {
            select: {
              username: true,
              realName: true
            }
          }
        }
      });

      // 生成 CSV
      const headers = ['ID', '操作者', '操作类型', '资源类型', '资源ID', '级别', 'IP地址', '描述', '时间'];
      const rows = logs.map(log => [
        log.id,
        log.admin?.realName || log.admin?.username || '',
        log.action,
        log.resourceType || '',
        log.resourceId || '',
        log.level || 'info',
        log.ipAddress || '',
        log.description || '',
        log.createdAt.toISOString()
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      res.send('\ufeff' + csv); // BOM for Excel UTF-8
    } catch (error) {
      console.error('导出审计日志失败:', error);
      res.status(500).json(errorResponse('导出审计日志失败'));
    }
  }
}

module.exports = AuditController;
