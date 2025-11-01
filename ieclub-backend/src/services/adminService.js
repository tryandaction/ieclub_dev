// ieclub-backend/src/services/adminService.js
// 管理后台服务

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const redis = require('../utils/redis');

const prisma = new PrismaClient();

class AdminService {
  /**
   * 获取平台概览数据
   */
  async getDashboardOverview() {
    try {
      // 尝试从缓存获取
      const cacheKey = 'admin:dashboard:overview';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

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
            lastLoginAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // 今日新注册用户
        prisma.users.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        // 总帖子数
        prisma.community_posts.count({
          where: { status: { not: 'deleted' } }
        }),
        
        // 今日新帖子
        prisma.community_posts.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
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
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            },
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
          newToday: newUsersToday
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
      await redis.setex(cacheKey, 300, JSON.stringify(overview));

      return overview;
    } catch (error) {
      logger.error('获取管理后台概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户列表
   */
  async getUsers({ page = 1, pageSize = 20, status, keyword, sortBy = 'createdAt', order = 'desc' }) {
    try {
      const skip = (page - 1) * pageSize;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (keyword) {
        where.OR = [
          { nickname: { contains: keyword } },
          { email: { contains: keyword } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: order },
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
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId, status) {
    try {
      const user = await prisma.users.update({
        where: { id: userId },
        data: { status }
      });

      logger.info(`管理员更新用户状态: ${userId} -> ${status}`);
      
      return user;
    } catch (error) {
      logger.error('更新用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取内容列表（帖子/评论）
   */
  async getContents({ type = 'post', page = 1, pageSize = 20, status, keyword }) {
    try {
      const skip = (page - 1) * pageSize;
      
      if (type === 'post') {
        const where = {};
        
        if (status) {
          where.status = status;
        }
        
        if (keyword) {
          where.OR = [
            { title: { contains: keyword } },
            { content: { contains: keyword } }
          ];
        }

        const [posts, total] = await Promise.all([
          prisma.community_posts.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
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
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        };
      } else {
        // 评论列表
        const where = {};
        
        if (status) {
          where.status = status;
        }
        
        if (keyword) {
          where.content = { contains: keyword };
        }

        const [comments, total] = await Promise.all([
          prisma.comments.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
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
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        };
      }
    } catch (error) {
      logger.error('获取内容列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新内容状态
   */
  async updateContentStatus(type, contentId, status) {
    try {
      const model = type === 'post' ? prisma.community_posts : prisma.comments;
      
      const content = await model.update({
        where: { id: contentId },
        data: { status }
      });

      logger.info(`管理员更新${type}状态: ${contentId} -> ${status}`);
      
      return content;
    } catch (error) {
      logger.error('更新内容状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取活动列表
   */
  async getActivities({ page = 1, pageSize = 20, status, keyword }) {
    try {
      const skip = (page - 1) * pageSize;
      
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { description: { contains: keyword } }
        ];
      }

      const [activities, total] = await Promise.all([
        prisma.activities.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
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
        items: activities,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取活动列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取举报列表
   */
  async getReports({ page = 1, pageSize = 20, status, type }) {
    try {
      const skip = (page - 1) * pageSize;
      
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
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
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
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      logger.error('获取举报列表失败:', error);
      throw error;
    }
  }

  /**
   * 处理举报
   */
  async handleReport(reportId, action, adminNote) {
    try {
      const report = await prisma.error_reports.update({
        where: { id: reportId },
        data: {
          status: action === 'approve' ? 'resolved' : 'rejected',
          adminNote,
          handledAt: new Date()
        }
      });

      logger.info(`管理员处理举报: ${reportId} -> ${action}`);
      
      return report;
    } catch (error) {
      logger.error('处理举报失败:', error);
      throw error;
    }
  }

  /**
   * 获取系统统计数据
   */
  async getSystemStats({ startDate, endDate }) {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // 用户增长
      const userGrowth = await prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM users
        WHERE createdAt BETWEEN ${start} AND ${end}
        GROUP BY DATE(createdAt)
        ORDER BY date
      `;

      // 内容增长
      const postGrowth = await prisma.$queryRaw`
        SELECT DATE(createdAt) as date, COUNT(*) as count
        FROM community_posts
        WHERE createdAt BETWEEN ${start} AND ${end}
        AND status != 'deleted'
        GROUP BY DATE(createdAt)
        ORDER BY date
      `;

      // 活跃度统计
      const activityStats = await prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          SUM(viewCount) as views,
          SUM(likeCount) as likes,
          SUM(commentCount) as comments
        FROM community_posts
        WHERE createdAt BETWEEN ${start} AND ${end}
        GROUP BY DATE(createdAt)
        ORDER BY date
      `;

      return {
        userGrowth,
        postGrowth,
        activityStats,
        period: { start, end }
      };
    } catch (error) {
      logger.error('获取系统统计失败:', error);
      throw error;
    }
  }

  /**
   * 发送系统公告
   */
  async sendAnnouncement({ title, content, type, targetUsers = 'all' }) {
    try {
      // 创建公告
      const announcement = await prisma.announcements.create({
        data: {
          title,
          content,
          type,
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
      } else {
        users = targetUsers.map(id => ({ id }));
      }

      // 批量创建通知
      const notifications = users.map(user => ({
        userId: user.id,
        type: 'system',
        title,
        content,
        relatedType: 'announcement',
        relatedId: announcement.id
      }));

      await prisma.notifications.createMany({
        data: notifications
      });

      logger.info(`发送系统公告: ${title}, 接收人数: ${users.length}`);

      return { announcement, recipientCount: users.length };
    } catch (error) {
      logger.error('发送系统公告失败:', error);
      throw error;
    }
  }

  /**
   * 批量操作用户
   */
  async batchUpdateUsers(userIds, action, value) {
    try {
      const updateData = {};
      
      switch (action) {
        case 'status':
          updateData.status = value;
          break;
        case 'level':
          updateData.level = value;
          break;
        case 'credits':
          // 对于积分，需要单独处理每个用户
          for (const userId of userIds) {
            await prisma.users.update({
              where: { id: userId },
              data: { credits: { increment: value } }
            });
          }
          logger.info(`批量调整用户积分: ${userIds.length}人, ${value}积分`);
          return { count: userIds.length };
        default:
          throw new Error('不支持的操作类型');
      }

      const result = await prisma.users.updateMany({
        where: { id: { in: userIds } },
        data: updateData
      });

      logger.info(`批量更新用户: ${action}, ${result.count}人`);

      return result;
    } catch (error) {
      logger.error('批量更新用户失败:', error);
      throw error;
    }
  }
}

module.exports = new AdminService();

