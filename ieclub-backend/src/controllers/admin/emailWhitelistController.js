/**
 * 邮箱白名单管理控制器（测试环境）
 * 用于管理员通过API管理邮箱注册白名单
 */

const prisma = require('../../config/database');
const logger = require('../../utils/logger');

class EmailWhitelistController {
  /**
   * 获取白名单列表
   */
  static async getWhitelist(req, res, next) {
    try {
      const { page = 1, pageSize = 20, status, keyword } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      // 构建查询条件
      const where = {};
      if (status) {
        where.status = status;
      }
      if (keyword) {
        where.email = {
          contains: keyword.toLowerCase()
        };
      }

      // 查询总数
      const total = await prisma.emailWhitelist.count({ where });

      // 查询列表
      const entries = await prisma.emailWhitelist.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          entries,
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      });
    } catch (error) {
      logger.error('获取白名单列表失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 获取待处理列表
   */
  static async getPending(req, res, next) {
    try {
      const entries = await prisma.emailWhitelist.findMany({
        where: {
          status: 'pending'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          entries,
          total: entries.length
        }
      });
    } catch (error) {
      logger.error('获取待处理列表失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 添加邮箱到白名单
   */
  static async addToWhitelist(req, res, next) {
    try {
      const { email, reason } = req.body;
      const adminId = req.admin?.id;

      if (!email) {
        return res.status(400).json({
          code: 400,
          message: '邮箱地址不能为空'
        });
      }

      // 验证邮箱格式
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          code: 400,
          message: '邮箱格式不正确'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // 检查是否已存在
      const existing = await prisma.emailWhitelist.findUnique({
        where: { email: normalizedEmail }
      });

      if (existing) {
        if (existing.status === 'approved') {
          return res.status(400).json({
            code: 400,
            message: '该邮箱已在白名单中（已批准）'
          });
        } else if (existing.status === 'pending') {
          return res.status(400).json({
            code: 400,
            message: '该邮箱已在白名单中（待处理）'
          });
        } else {
          // 如果之前被拒绝，更新为待处理
          await prisma.emailWhitelist.update({
            where: { id: existing.id },
            data: {
              status: 'pending',
              reason: reason || existing.reason,
              updatedAt: new Date()
            }
          });

          return res.json({
            code: 200,
            message: '已重新添加到白名单（待处理）',
            data: { entry: existing }
          });
        }
      }

      // 创建新记录
      const entry = await prisma.emailWhitelist.create({
        data: {
          email: normalizedEmail,
          status: 'pending',
          reason: reason || null
        }
      });

      logger.info('管理员添加邮箱到白名单:', { 
        adminId, 
        email: normalizedEmail, 
        entryId: entry.id 
      });

      res.json({
        code: 200,
        message: '已添加邮箱到白名单（待处理）',
        data: { entry }
      });
    } catch (error) {
      logger.error('添加邮箱到白名单失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 批准邮箱
   */
  static async approveEmail(req, res, next) {
    try {
      const { email } = req.params;
      const adminId = req.admin?.id;

      if (!email) {
        return res.status(400).json({
          code: 400,
          message: '邮箱地址不能为空'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // 查找记录
      const entry = await prisma.emailWhitelist.findUnique({
        where: { email: normalizedEmail }
      });

      if (!entry) {
        return res.status(404).json({
          code: 404,
          message: '该邮箱不在白名单中'
        });
      }

      if (entry.status === 'approved') {
        return res.status(400).json({
          code: 400,
          message: '该邮箱已批准'
        });
      }

      // 更新状态
      const updated = await prisma.emailWhitelist.update({
        where: { id: entry.id },
        data: {
          status: 'approved',
          approvedBy: adminId,
          approvedAt: new Date()
        }
      });

      logger.info('管理员批准邮箱:', { 
        adminId, 
        email: normalizedEmail, 
        entryId: entry.id 
      });

      res.json({
        code: 200,
        message: '邮箱已批准',
        data: { entry: updated }
      });
    } catch (error) {
      logger.error('批准邮箱失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 拒绝邮箱
   */
  static async rejectEmail(req, res, next) {
    try {
      const { email } = req.params;
      const { note } = req.body;
      const adminId = req.admin?.id;

      if (!email) {
        return res.status(400).json({
          code: 400,
          message: '邮箱地址不能为空'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // 查找记录
      const entry = await prisma.emailWhitelist.findUnique({
        where: { email: normalizedEmail }
      });

      if (!entry) {
        return res.status(404).json({
          code: 404,
          message: '该邮箱不在白名单中'
        });
      }

      if (entry.status === 'rejected') {
        return res.status(400).json({
          code: 400,
          message: '该邮箱已拒绝'
        });
      }

      // 更新状态
      const updated = await prisma.emailWhitelist.update({
        where: { id: entry.id },
        data: {
          status: 'rejected',
          rejectedBy: adminId,
          rejectedAt: new Date(),
          note: note || entry.note
        }
      });

      logger.info('管理员拒绝邮箱:', { 
        adminId, 
        email: normalizedEmail, 
        entryId: entry.id,
        note 
      });

      res.json({
        code: 200,
        message: '邮箱已拒绝',
        data: { entry: updated }
      });
    } catch (error) {
      logger.error('拒绝邮箱失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 移除邮箱
   */
  static async removeEmail(req, res, next) {
    try {
      const { email } = req.params;
      const adminId = req.admin?.id;

      if (!email) {
        return res.status(400).json({
          code: 400,
          message: '邮箱地址不能为空'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // 查找记录
      const entry = await prisma.emailWhitelist.findUnique({
        where: { email: normalizedEmail }
      });

      if (!entry) {
        return res.status(404).json({
          code: 404,
          message: '该邮箱不在白名单中'
        });
      }

      // 删除记录
      await prisma.emailWhitelist.delete({
        where: { id: entry.id }
      });

      logger.info('管理员移除邮箱:', { 
        adminId, 
        email: normalizedEmail, 
        entryId: entry.id 
      });

      res.json({
        code: 200,
        message: '邮箱已移除'
      });
    } catch (error) {
      logger.error('移除邮箱失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }

  /**
   * 批量批准
   */
  static async batchApprove(req, res, next) {
    try {
      const { emails } = req.body;
      const adminId = req.admin?.id;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供邮箱列表'
        });
      }

      const normalizedEmails = emails.map(e => e.toLowerCase());
      const now = new Date();

      // 批量更新
      const result = await prisma.emailWhitelist.updateMany({
        where: {
          email: { in: normalizedEmails },
          status: { not: 'approved' }
        },
        data: {
          status: 'approved',
          approvedBy: adminId,
          approvedAt: now
        }
      });

      logger.info('管理员批量批准邮箱:', { 
        adminId, 
        count: result.count,
        emails: normalizedEmails 
      });

      res.json({
        code: 200,
        message: `已批准 ${result.count} 个邮箱`,
        data: { count: result.count }
      });
    } catch (error) {
      logger.error('批量批准失败:', { error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = EmailWhitelistController;

