// 举报管理控制器
const prisma = require('../../config/database');
const { successResponse, errorResponse } = require('../../utils/response');

class ReportController {
  /**
   * 获取举报列表
   */
  static async getReports(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        type,
        status,
        targetType,
        keyword
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      // 构建查询条件
      const where = {};
      
      if (type) {
        where.type = type;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (targetType) {
        where.targetType = targetType;
      }
      
      if (keyword) {
        where.reason = {
          contains: keyword
        };
      }

      // 查询举报列表
      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                email: true,
                realName: true
              }
            },
            handler: {
              select: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        }),
        prisma.report.count({ where })
      ]);

      res.json(successResponse({
        list: reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / take)
        }
      }, '获取举报列表成功'));
    } catch (error) {
      console.error('获取举报列表失败:', error);
      res.status(500).json(errorResponse('获取举报列表失败'));
    }
  }

  /**
   * 获取举报详情
   */
  static async getReportDetail(req, res) {
    try {
      const { id } = req.params;

      const report = await prisma.report.findUnique({
        where: { id },
        include: {
          reporter: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              email: true,
              realName: true
            }
          },
          handler: {
            select: {
              id: true,
              username: true,
              realName: true
            }
          }
        }
      });

      if (!report) {
        return res.status(404).json(errorResponse('举报不存在'));
      }

      // 获取被举报内容详情
      let targetContent = null;
      if (report.targetType === 'topic') {
        targetContent = await prisma.topic.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            title: true,
            content: true,
            author: {
              select: { id: true, nickname: true }
            }
          }
        });
      } else if (report.targetType === 'comment') {
        targetContent = await prisma.comment.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            content: true,
            author: {
              select: { id: true, nickname: true }
            }
          }
        });
      } else if (report.targetType === 'user') {
        targetContent = await prisma.user.findUnique({
          where: { id: report.targetId },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        });
      }

      res.json(successResponse({
        ...report,
        targetContent
      }, '获取举报详情成功'));
    } catch (error) {
      console.error('获取举报详情失败:', error);
      res.status(500).json(errorResponse('获取举报详情失败'));
    }
  }

  /**
   * 处理举报
   */
  static async handleReport(req, res) {
    try {
      const { id } = req.params;
      const { action, note } = req.body;
      const adminId = req.admin.id;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json(errorResponse('无效的处理结果'));
      }

      const report = await prisma.report.findUnique({
        where: { id }
      });

      if (!report) {
        return res.status(404).json(errorResponse('举报不存在'));
      }

      if (report.status !== 'pending') {
        return res.status(400).json(errorResponse('该举报已被处理'));
      }

      // 更新举报状态
      const updatedReport = await prisma.report.update({
        where: { id },
        data: {
          status: action === 'approve' ? 'approved' : 'rejected',
          handlerId: adminId,
          handledAt: new Date(),
          note
        },
        include: {
          reporter: {
            select: {
              id: true,
              nickname: true,
              email: true
            }
          }
        }
      });

      // 如果举报通过，对被举报内容进行处理
      if (action === 'approve') {
        await this.handleApprovedReport(report);
      }

      // 通知举报人
      await this.notifyReporter(updatedReport, action);

      res.json(successResponse(updatedReport, '处理举报成功'));
    } catch (error) {
      console.error('处理举报失败:', error);
      res.status(500).json(errorResponse('处理举报失败'));
    }
  }

  /**
   * 处理已通过的举报（对被举报内容进行处理）
   */
  static async handleApprovedReport(report) {
    try {
      if (report.targetType === 'topic') {
        // 锁定话题
        await prisma.topic.update({
          where: { id: report.targetId },
          data: { status: 'locked' }
        });
      } else if (report.targetType === 'comment') {
        // 删除评论
        await prisma.comment.update({
          where: { id: report.targetId },
          data: { deletedAt: new Date() }
        });
      } else if (report.targetType === 'user') {
        // 给用户增加警告
        await prisma.userWarning.create({
          data: {
            userId: report.targetId,
            reason: `因被举报：${report.reason}`,
            content: '您的账号因被举报已收到警告',
            level: 'minor'
          }
        });
      }
    } catch (error) {
      console.error('处理被举报内容失败:', error);
    }
  }

  /**
   * 通知举报人处理结果
   */
  static async notifyReporter(report, action) {
    try {
      const notificationService = require('../../services/notificationService');
      
      await notificationService.createNotification({
        type: 'system',
        userId: report.reporterId,
        title: '举报处理结果',
        content: action === 'approve' 
          ? '您的举报已被受理，感谢您的反馈！' 
          : '您的举报经审核后未发现违规，感谢您的参与！',
        targetType: 'report',
        targetId: report.id,
        link: null
      });
    } catch (error) {
      console.error('通知举报人失败:', error);
    }
  }

  /**
   * 获取举报统计
   */
  static async getReportStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [total, pending, approved, rejected, todayNew] = await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { status: 'pending' } }),
        prisma.report.count({ where: { status: 'approved' } }),
        prisma.report.count({ where: { status: 'rejected' } }),
        prisma.report.count({
          where: {
            createdAt: { gte: today }
          }
        })
      ]);

      // 按类型统计
      const byType = await prisma.report.groupBy({
        by: ['type'],
        _count: { id: true }
      });

      res.json(successResponse({
        total,
        pending,
        approved,
        rejected,
        todayNew,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count.id
        }))
      }, '获取统计成功'));
    } catch (error) {
      console.error('获取举报统计失败:', error);
      res.status(500).json(errorResponse('获取举报统计失败'));
    }
  }
}

module.exports = ReportController;
