// ieclub-backend/src/services/adminService.js
// 管理后台服务（优化版）

const logger = require('../utils/logger');
const { cacheGet, cacheSet, cacheDelete } = require('../utils/redis-enhanced');
const prisma = require('../config/database');

/**
 * 管理服务配置
 */
const ADMIN_CONFIG = {
  cache: {
    overview: 300,      // 概览缓存5分钟
    list: 60,           // 列表缓存1分钟
    stats: 600          // 统计缓存10分钟
  },
  pagination: {
    default: 20,
    max: 100
  },
  batch: {
    maxSize: 1000       // 批量操作最大数量
  }
};

class AdminService {
  /**
   * 获取平台概览数据（优化版）
   */
  async getDashboardOverview() {
    const cacheKey = 'admin:dashboard:overview';
    
    try {
      // 尝试从缓存获取
      const cached = await cacheGet(cacheKey);
      if (cached) {
        logger.debug('管理后台概览命中缓存');
        return cached;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // 并行查询所有数据
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        totalPosts,
        newPostsToday,
        totalActivities,
        upcomingActivities,
        totalComments,
        newCommentsToday,
        totalCredits
      ] = await Promise.all([
        // 总用户数
        prisma.users.count(),
        
        // 活跃用户（最近7天有活动）
        prisma.users.count({
          where: {
            lastLoginAt: { gte: sevenDaysAgo }
          }
        }),
        
        // 今日新注册用户
        prisma.users.count({
          where: {
            createdAt: { gte: today }
          }
        }),
        
        // 总帖子数
        prisma.community_posts.count({
          where: { status: { not: 'deleted' } }
        }),
        
        // 今日新帖子
        prisma.community_posts.count({
          where: {
            createdAt: { gte: today },
            status: { not: 'deleted' }
          }
        }),
        
        // 总活动数
        prisma.activities.count({
          where: { status: { not: 'cancelled' } }
        }),
        
        // 即将开始的活动
        prisma.activities.count({
          where: {
            startTime: {
              gte: new Date(),
              lte: nextWeek
            },
            status: 'published'
          }
        }),
        
        // 总评论数
        prisma.comments.count({
          where: { status: { not: 'deleted' } }
        }),
        
        // 今日新评论
        prisma.comments.count({
          where: {
            createdAt: { gte: today },
            status: { not: 'deleted' }
          }
        }),
        
        // 总积分数
        prisma.credit_transactions.aggregate({
          _sum: { credits: true },
          where: { type: 'earn' }
        })
      ]);

      const overview = {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          activeRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
        },
        posts: {
          total: totalPosts,
          newToday: newPostsToday
        },
        activities: {
          total: totalActivities,
          upcoming: upcomingActivities
        },
        comments: {
          total: totalComments,
          newToday: newCommentsToday
        },
        credits: {
          total: totalCredits._sum.credits || 0
        },
        timestamp: new Date()
      };

      // 缓存5分钟
      await cacheSet(cacheKey, overview, ADMIN_CONFIG.cache.overview);

      return overview;
    } catch (error) {
      logger.error('获取管理后台概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表（优化版）
   */
  async getUsers(params) {
    const {
      page = 1,
      pageSize = ADMIN_CONFIG.pagination.default,
      status,
      keyword,
      sortBy = 'createdAt',
      order = 'desc'
    } = params;

    try {
      // 验证分页参数
      const validPage = Math.max(1, page);
      const validPageSize = Math.min(Math.max(1, pageSize), ADMIN_CONFIG.pagination.max);
      const skip = (validPage - 1) * validPageSize;
      
      // 构建查询条件
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (keyword) {
        where.OR = [
          { nickname: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } }
        ];
      }

      // 验证排序字段
      const allowedSortFields = ['createdAt', 'lastLoginAt', 'level', 'credits'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const validOrder = order === 'asc' ? 'asc' : 'desc';

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          where,
          skip,
          take: validPageSize,
          orderBy: { [validSortBy]: validOrder },
          select: {
            id: true,
            email: true,
            nickname: true,
            avatar: true,
            status: true,
            level: true,
            credits: true,
            isCertified: true,
            isVip: true,
            lastLoginAt: true,
            createdAt: true
          }
        }),
        prisma.users.count({ where })
      ]);

      return {
        items: users,
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          total,
          totalPages: Math.ceil(total / validPageSize),
          hasMore: skip + validPageSize < total
        }
      };
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户状态（优化版）
   */
  async updateUserStatus(userId, status, adminId) {
    try {
      // 验证状态值
      const allowedStatuses = ['active', 'suspended', 'banned', 'inactive'];
      if (!allowedStatuses.includes(status)) {
        throw new Error(`无效的状态值: ${status}`);
      }

      const user = await prisma.users.update({
        where: { id: userId },
        data: { 
          status,
          updatedAt: new Date()
        }
      });

      // 记录管理员操作日志
      await this._logAdminAction(adminId, 'update_user_status', {
        userId,
        status,
        timestamp: new Date()
      });

      // 清除相关缓存
      await cacheDelete(`user:${userId}:*`);

      logger.info('管理员更新用户状态', { userId, status, adminId });
      
      return user;
    } catch (error) {
      logger.error('更新用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容列表（帖子/评论）（优化版）
   */
  async getContents(params) {
    const {
      type = 'post',
      page = 1,
      pageSize = ADMIN_CONFIG.pagination.default,
      status,
      keyword
    } = params;

    try {
      const validPage = Math.max(1, page);
      const validPageSize = Math.min(Math.max(1, pageSize), ADMIN_CONFIG.pagination.max);
      const skip = (validPage - 1) * validPageSize;
      
      if (type === 'post') {
        const where = {};
        
        if (status) {
          where.status = status;
        }
        
        if (keyword) {
          where.OR = [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } }
          ];
        }

        const [posts, total] = await Promise.all([
          prisma.community_posts.findMany({
            where,
            skip,
            take: validPageSize,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              content: true,
              status: true,
              viewCount: true,
              likeCount: true,
              commentCount: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              }
            }
          }),
          prisma.community_posts.count({ where })
        ]);

        return {
          items: posts,
          pagination: {
            page: validPage,
            pageSize: validPageSize,
            total,
            totalPages: Math.ceil(total / validPageSize),
            hasMore: skip + validPageSize < total
          }
        };
      } else {
        // 评论列表
        const where = {};
        
        if (status) {
          where.status = status;
        }
        
        if (keyword) {
          where.content = { contains: keyword, mode: 'insensitive' };
        }

        const [comments, total] = await Promise.all([
          prisma.comments.findMany({
            where,
            skip,
            take: validPageSize,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              status: true,
              likeCount: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              }
            }
          }),
          prisma.comments.count({ where })
        ]);

        return {
          items: comments,
          pagination: {
            page: validPage,
            pageSize: validPageSize,
            total,
            totalPages: Math.ceil(total / validPageSize),
            hasMore: skip + validPageSize < total
          }
        };
      }
    } catch (error) {
      logger.error('获取内容列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容状态（优化版）
   */
  async updateContentStatus(type, contentId, status, adminId) {
    try {
      // 验证类型和状态
      if (!['post', 'comment'].includes(type)) {
        throw new Error(`无效的内容类型: ${type}`);
      }

      const allowedStatuses = ['published', 'draft', 'deleted', 'reviewing'];
      if (!allowedStatuses.includes(status)) {
        throw new Error(`无效的状态值: ${status}`);
      }

      const model = type === 'post' ? prisma.community_posts : prisma.comments;
      
      const content = await model.update({
        where: { id: contentId },
        data: { 
          status,
          updatedAt: new Date()
        }
      });

      // 记录管理员操作日志
      await this._logAdminAction(adminId, `update_${type}_status`, {
        contentId,
        status,
        timestamp: new Date()
      });

      // 清除相关缓存
      await cacheDelete(`${type}:${contentId}:*`);

      logger.info(`管理员更新${type}状态`, { contentId, status, adminId });
      
      return content;
    } catch (error) {
      logger.error('更新内容状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取活动列表（优化版）
   */
  async getActivities(params) {
    const {
      page = 1,
      pageSize = ADMIN_CONFIG.pagination.default,
      status,
      keyword
    } = params;

    try {
      const validPage = Math.max(1, page);
      const validPageSize = Math.min(Math.max(1, pageSize), ADMIN_CONFIG.pagination.max);
      const skip = (validPage - 1) * validPageSize;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } }
        ];
      }

      const [activities, total] = await Promise.all([
        prisma.activities.findMany({
          where,
          skip,
          take: validPageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            startTime: true,
            endTime: true,
            location: true,
            maxParticipants: true,
            createdAt: true,
            organizer: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: true
              }
            }
          }
        }),
        prisma.activities.count({ where })
      ]);

      return {
        items: activities.map(activity => ({
          ...activity,
          participantsCount: activity._count.participants
        })),
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          total,
          totalPages: Math.ceil(total / validPageSize),
          hasMore: skip + validPageSize < total
        }
      };
    } catch (error) {
      logger.error('获取活动列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取举报列表（优化版）
   */
  async getReports(params) {
    const {
      page = 1,
      pageSize = ADMIN_CONFIG.pagination.default,
      status,
      type
    } = params;

    try {
      const validPage = Math.max(1, page);
      const validPageSize = Math.min(Math.max(1, pageSize), ADMIN_CONFIG.pagination.max);
      const skip = (validPage - 1) * validPageSize;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }

      const [reports, total] = await Promise.all([
        prisma.error_reports.findMany({
          where,
          skip,
          take: validPageSize,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            status: true,
            adminNote: true,
            createdAt: true,
            handledAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                email: true
              }
            }
          }
        }),
        prisma.error_reports.count({ where })
      ]);

      return {
        items: reports,
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          total,
          totalPages: Math.ceil(total / validPageSize),
          hasMore: skip + validPageSize < total
        }
      };
    } catch (error) {
      logger.error('获取举报列表失败:', error);
      throw error;
    }
  }

  /**
   * 处理举报（优化版）
   */
  async handleReport(reportId, action, adminNote, adminId) {
    try {
      // 验证操作类型
      if (!['approve', 'reject'].includes(action)) {
        throw new Error(`无效的操作类型: ${action}`);
      }

      const report = await prisma.error_reports.update({
        where: { id: reportId },
        data: {
          status: action === 'approve' ? 'resolved' : 'rejected',
          adminNote: adminNote || '',
          handledAt: new Date()
        }
      });

      // 记录管理员操作日志
      await this._logAdminAction(adminId, 'handle_report', {
        reportId,
        action,
        timestamp: new Date()
      });

      logger.info('管理员处理举报', { reportId, action, adminId });
      
      return report;
    } catch (error) {
      logger.error('处理举报失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统统计数据（优化版）
   */
  async getSystemStats(params) {
    const {
      startDate,
      endDate
    } = params;

    const cacheKey = `admin:stats:${startDate}:${endDate}`;
    
    try {
      // 尝试从缓存获取
      const cached = await cacheGet(cacheKey);
      if (cached) {
        logger.debug('系统统计命中缓存');
        return cached;
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // 并行查询统计数据
      const [userGrowth, postGrowth, activityStats] = await Promise.all([
        // 用户增长
        prisma.$queryRaw`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM users
          WHERE createdAt BETWEEN ${start} AND ${end}
          GROUP BY DATE(createdAt)
          ORDER BY date
        `,
        // 内容增长
        prisma.$queryRaw`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM community_posts
          WHERE createdAt BETWEEN ${start} AND ${end}
          AND status != 'deleted'
          GROUP BY DATE(createdAt)
          ORDER BY date
        `,
        // 活跃度统计
        prisma.$queryRaw`
          SELECT 
            DATE(createdAt) as date,
            SUM(viewCount) as views,
            SUM(likeCount) as likes,
            SUM(commentCount) as comments
          FROM community_posts
          WHERE createdAt BETWEEN ${start} AND ${end}
          GROUP BY DATE(createdAt)
          ORDER BY date
        `
      ]);

      const stats = {
        userGrowth,
        postGrowth,
        activityStats,
        period: { start, end }
      };

      // 缓存10分钟
      await cacheSet(cacheKey, stats, ADMIN_CONFIG.cache.stats);

      return stats;
    } catch (error) {
      logger.error('获取系统统计失败:', error);
      throw error;
    }
  }

  /**
   * 发送系统公告（优化版）
   */
  async sendAnnouncement(params, adminId) {
    const {
      title,
      content,
      type,
      targetUsers = 'all'
    } = params;

    try {
      // 验证参数
      if (!title || !content) {
        throw new Error('标题和内容不能为空');
      }

      // 创建公告
      const announcement = await prisma.announcements.create({
        data: {
          title,
          content,
          type: type || 'info',
          publishedAt: new Date()
        }
      });

      // 获取目标用户
      let users;
      if (targetUsers === 'all') {
        users = await prisma.users.findMany({
          where: { status: 'active' },
          select: { id: true }
        });
      } else if (Array.isArray(targetUsers)) {
        users = targetUsers.map(id => ({ id }));
      } else {
        throw new Error('无效的目标用户参数');
      }

      // 批量创建通知（分批处理，避免一次性插入过多）
      const BATCH_SIZE = 1000;
      let totalCreated = 0;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const notifications = batch.map(user => ({
          userId: user.id,
          type: 'system',
          title,
          content,
          relatedType: 'announcement',
          relatedId: announcement.id
        }));

        await prisma.notifications.createMany({
          data: notifications,
          skipDuplicates: true
        });

        totalCreated += batch.length;
      }

      // 记录管理员操作日志
      await this._logAdminAction(adminId, 'send_announcement', {
        announcementId: announcement.id,
        recipientCount: totalCreated,
        timestamp: new Date()
      });

      logger.info('发送系统公告', { 
        title, 
        recipientCount: totalCreated,
        adminId 
      });

      return { 
        announcement, 
        recipientCount: totalCreated 
      };
    } catch (error) {
      logger.error('发送系统公告失败:', error);
      throw error;
    }
  }

  /**
   * 批量操作用户（优化版）
   */
  async batchUpdateUsers(userIds, action, value, adminId) {
    try {
      // 验证参数
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('用户ID列表不能为空');
      }

      if (userIds.length > ADMIN_CONFIG.batch.maxSize) {
        throw new Error(`批量操作数量不能超过${ADMIN_CONFIG.batch.maxSize}`);
      }

      let result;
      const updateData = {};
      
      switch (action) {
        case 'status':
          const allowedStatuses = ['active', 'suspended', 'banned', 'inactive'];
          if (!allowedStatuses.includes(value)) {
            throw new Error(`无效的状态值: ${value}`);
          }
          updateData.status = value;
          result = await prisma.users.updateMany({
            where: { id: { in: userIds } },
            data: updateData
          });
          break;

        case 'level':
          if (typeof value !== 'number' || value < 1) {
            throw new Error('无效的等级值');
          }
          updateData.level = value;
          result = await prisma.users.updateMany({
            where: { id: { in: userIds } },
            data: updateData
          });
          break;

        case 'credits':
          if (typeof value !== 'number') {
            throw new Error('无效的积分值');
          }
          // 对于积分，需要单独处理每个用户（使用事务）
          result = await prisma.$transaction(
            userIds.map(userId =>
              prisma.users.update({
                where: { id: userId },
                data: { credits: { increment: value } }
              })
            )
          );
          result = { count: result.length };
          break;

        default:
          throw new Error(`不支持的操作类型: ${action}`);
      }

      // 清除相关缓存
      for (const userId of userIds) {
        await cacheDelete(`user:${userId}:*`);
      }

      // 记录管理员操作日志
      await this._logAdminAction(adminId, 'batch_update_users', {
        action,
        value,
        userCount: result.count,
        timestamp: new Date()
      });

      logger.info('批量更新用户', { 
        action, 
        count: result.count,
        adminId 
      });

      return result;
    } catch (error) {
      logger.error('批量更新用户失败:', error);
      throw error;
    }
  }

  /**
   * 记录管理员操作日志（私有方法）
   * @private
   */
  async _logAdminAction(adminId, action, details) {
    try {
      await prisma.adminLogs.create({
        data: {
          adminId,
          action,
          details: JSON.stringify(details),
          createdAt: new Date()
        }
      });
    } catch (error) {
      // 日志记录失败不应该影响主流程
      logger.error('记录管理员操作日志失败:', error);
    }
  }
}

module.exports = new AdminService();
