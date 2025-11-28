// 管理后台 - 内容管理控制器
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const response = require('../../utils/response');

class ContentController {
  /**
   * 获取话题列表（管理后台）
   */
  static async getTopics(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        keyword,
        category,
        topicType,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      // 构建查询条件
      const where = {};

      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { content: { contains: keyword } }
        ];
      }

      if (category) {
        where.category = category;
      }

      if (topicType) {
        where.topicType = topicType;
      }

      if (status) {
        switch (status) {
          case 'published':
            where.publishedAt = { not: null };
            where.deletedAt = null;
            break;
          case 'draft':
            where.publishedAt = null;
            where.deletedAt = null;
            break;
          case 'deleted':
            where.deletedAt = { not: null };
            break;
        }
      }

      // 获取话题列表
      const [topics, total] = await Promise.all([
        prisma.topic.findMany({
          where,
          skip,
          take,
          orderBy: { [sortBy]: sortOrder },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                email: true
              }
            }
          }
        }),
        prisma.topic.count({ where })
      ]);

      // 格式化数据
      const formattedTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        content: topic.content?.substring(0, 200) + '...',
        category: topic.category,
        topicType: topic.topicType,
        author: topic.author,
        viewsCount: topic.viewsCount || 0,
        likesCount: topic.likesCount || 0,
        commentsCount: topic.commentsCount || 0,
        status: topic.deletedAt ? 'deleted' : topic.publishedAt ? 'published' : 'draft',
        createdAt: topic.createdAt,
        publishedAt: topic.publishedAt
      }));

      return response.success(res, {
        list: formattedTopics,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } catch (error) {
      console.error('获取话题列表失败:', error);
      return response.error(res, '获取话题列表失败');
    }
  }

  /**
   * 获取话题详情
   */
  static async getTopicDetail(req, res) {
    try {
      const { id } = req.params;

      const topic = await prisma.topic.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              email: true
            }
          }
        }
      });

      if (!topic) {
        return response.error(res, '话题不存在', 404);
      }

      return response.success(res, topic);
    } catch (error) {
      console.error('获取话题详情失败:', error);
      return response.error(res, '获取话题详情失败');
    }
  }

  /**
   * 删除话题（软删除）
   */
  static async deleteTopic(req, res) {
    try {
      const { id } = req.params;

      const topic = await prisma.topic.findUnique({ where: { id } });
      if (!topic) {
        return response.error(res, '话题不存在', 404);
      }

      await prisma.topic.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      return response.success(res, null, '删除成功');
    } catch (error) {
      console.error('删除话题失败:', error);
      return response.error(res, '删除话题失败');
    }
  }

  /**
   * 锁定/解锁话题
   */
  static async toggleTopicLock(req, res) {
    try {
      const { id } = req.params;
      const { locked } = req.body;

      const topic = await prisma.topic.findUnique({ where: { id } });
      if (!topic) {
        return response.error(res, '话题不存在', 404);
      }

      // 使用 status 字段来表示锁定状态
      await prisma.topic.update({
        where: { id },
        data: { status: locked ? 'locked' : 'collecting' }
      });

      return response.success(res, null, locked ? '已锁定' : '已解锁');
    } catch (error) {
      console.error('操作失败:', error);
      return response.error(res, '操作失败');
    }
  }

  /**
   * 获取内容统计
   */
  static async getContentStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalTopics,
        todayTopics,
        publishedTopics,
        deletedTopics,
        totalActivities,
        todayActivities
      ] = await Promise.all([
        prisma.topic.count({ where: { deletedAt: null } }),
        prisma.topic.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
        prisma.topic.count({ where: { publishedAt: { not: null }, deletedAt: null } }),
        prisma.topic.count({ where: { deletedAt: { not: null } } }),
        prisma.activity.count(),
        prisma.activity.count({ where: { createdAt: { gte: today } } })
      ]);

      return response.success(res, {
        topics: {
          total: totalTopics,
          today: todayTopics,
          published: publishedTopics,
          deleted: deletedTopics
        },
        activities: {
          total: totalActivities,
          today: todayActivities
        }
      });
    } catch (error) {
      console.error('获取内容统计失败:', error);
      return response.error(res, '获取内容统计失败');
    }
  }

  /**
   * 获取活动列表（管理后台）
   */
  static async getActivities(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        keyword,
        status,
        category
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const where = {};
      const now = new Date();

      if (keyword) {
        where.OR = [
          { title: { contains: keyword } },
          { description: { contains: keyword } }
        ];
      }

      if (category) {
        where.category = category;
      }

      // 状态筛选
      if (status === 'upcoming') {
        where.startTime = { gt: now };
      } else if (status === 'ongoing') {
        where.startTime = { lte: now };
        where.endTime = { gte: now };
      } else if (status === 'ended') {
        where.endTime = { lt: now };
      }

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            organizer: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            }
          }
        }),
        prisma.activity.count({ where })
      ]);

      const formattedActivities = activities.map(activity => ({
        ...activity,
        status: now < new Date(activity.startTime) 
          ? 'upcoming' 
          : now <= new Date(activity.endTime) 
            ? 'ongoing' 
            : 'ended'
      }));

      return response.success(res, {
        list: formattedActivities,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } catch (error) {
      console.error('获取活动列表失败:', error);
      return response.error(res, '获取活动列表失败');
    }
  }

  /**
   * 删除活动
   */
  static async deleteActivity(req, res) {
    try {
      const { id } = req.params;

      const activity = await prisma.activity.findUnique({ where: { id } });
      if (!activity) {
        return response.error(res, '活动不存在', 404);
      }

      await prisma.activity.delete({ where: { id } });

      return response.success(res, null, '删除成功');
    } catch (error) {
      console.error('删除活动失败:', error);
      return response.error(res, '删除活动失败');
    }
  }
}

module.exports = ContentController;
