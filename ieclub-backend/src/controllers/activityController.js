// src/controllers/activityController.js
// 活动控制器 - 小红书式活动功能

const { PrismaClient } = require('@prisma/client');
const response = require('../utils/response');
const logger = require('../utils/logger');
const WechatService = require('../services/wechatService');

const prisma = new PrismaClient();

class ActivityController {
  /**
   * 获取活动列表（瀑布流布局）
   * GET /api/activities
   */
  static async getActivities(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        sortBy = 'latest', // latest, hot, popular
        search,
        status = 'upcoming' // upcoming, ongoing, ended
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // 构建查询条件
      const where = {
        status: 'published'
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { tags: { contains: search } }
        ];
      }

      // 根据状态筛选
      const now = new Date();
      if (status === 'upcoming') {
        where.startTime = { gt: now };
      } else if (status === 'ongoing') {
        where.startTime = { lte: now };
        where.endTime = { gte: now };
      } else if (status === 'ended') {
        where.endTime = { lt: now };
      }

      // 构建排序
      let orderBy = {};
      switch (sortBy) {
        case 'hot':
          orderBy = [
            { participantsCount: 'desc' },
            { likesCount: 'desc' },
            { createdAt: 'desc' }
          ];
          break;
        case 'popular':
          orderBy = [
            { likesCount: 'desc' },
            { participantsCount: 'desc' },
            { createdAt: 'desc' }
          ];
          break;
        case 'latest':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }

      // 查询活动
      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
                isCertified: true
              }
            },
            _count: {
              select: {
                participants: true,
                likes: true,
                comments: true
              }
            }
          }
        }),
        prisma.activity.count({ where })
      ]);

      // 格式化返回数据
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        cover: activity.cover,
        images: activity.images ? JSON.parse(activity.images) : [],
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime,
        maxParticipants: activity.maxParticipants,
        category: activity.category,
        tags: activity.tags ? JSON.parse(activity.tags) : [],
        author: activity.author,
        participantsCount: activity._count.participants,
        likesCount: activity._count.likes,
        commentsCount: activity._count.comments,
        isLiked: false, // 需要根据当前用户状态设置
        isParticipated: false, // 需要根据当前用户状态设置
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      }));

      return response.paginated(res, formattedActivities, {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + take < total
      });
    } catch (error) {
      logger.error('获取活动列表失败:', error);
      return response.serverError(res, '获取活动列表失败');
    }
  }

  /**
   * 获取活动详情
   * GET /api/activities/:id
   */
  static async getActivityDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const activity = await prisma.activity.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              isCertified: true,
              _count: {
                select: {
                  activities: true,
                  followers: true
                }
              }
            }
          },
          participants: {
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              participants: true,
              likes: true,
              comments: true
            }
          }
        }
      });

      if (!activity) {
        return response.notFound(res, '活动不存在');
      }

      // 检查用户是否已点赞和参与
      let isLiked = false;
      let isParticipated = false;

      if (userId) {
        const [like, participation] = await Promise.all([
          prisma.activityLike.findUnique({
            where: {
              userId_activityId: {
                userId,
                activityId: id
              }
            }
          }),
          prisma.activityParticipant.findUnique({
            where: {
              userId_activityId: {
                userId,
                activityId: id
              }
            }
          })
        ]);

        isLiked = !!like;
        isParticipated = !!participation;
      }

      // 格式化返回数据
      const formattedActivity = {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        cover: activity.cover,
        images: activity.images ? JSON.parse(activity.images) : [],
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime,
        maxParticipants: activity.maxParticipants,
        category: activity.category,
        tags: activity.tags ? JSON.parse(activity.tags) : [],
        author: {
          ...activity.author,
          activitiesCount: activity.author._count.activities,
          followersCount: activity.author._count.followers
        },
        participants: activity.participants.map(p => p.user),
        participantsCount: activity._count.participants,
        likesCount: activity._count.likes,
        commentsCount: activity._count.comments,
        isLiked,
        isParticipated,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt
      };

      return response.success(res, formattedActivity);
    } catch (error) {
      logger.error('获取活动详情失败:', error);
      return response.serverError(res, '获取活动详情失败');
    }
  }

  /**
   * 创建活动
   * POST /api/activities
   */
  static async createActivity(req, res) {
    try {
      const userId = req.userId;
      const {
        title,
        description,
        location,
        startTime,
        endTime,
        maxParticipants,
        category,
        tags = [],
        images = []
      } = req.body;

      // 验证必填字段
      if (!title || !description || !location || !startTime || !category) {
        return response.error(res, '请填写完整的活动信息');
      }

      // 验证时间
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : null;

      if (start <= new Date()) {
        return response.error(res, '活动开始时间不能早于当前时间');
      }

      if (end && end <= start) {
        return response.error(res, '活动结束时间不能早于开始时间');
      }

      // 内容安全检查
      try {
        const textCheck = await WechatService.msgSecCheck(`${title} ${description}`);
        if (!textCheck.pass) {
          return response.error(res, '活动内容包含违规信息');
        }
      } catch (error) {
        logger.warn('内容安全检查失败:', error.message);
      }

      // 创建活动
      const activity = await prisma.activity.create({
        data: {
          title,
          description,
          location,
          startTime: start,
          endTime: end,
          maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
          category,
          tags: JSON.stringify(tags),
          images: JSON.stringify(images),
          cover: images.length > 0 ? images[0] : null,
          authorId: userId,
          status: 'published'
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isCertified: true
            }
          }
        }
      });

      logger.info('活动创建成功:', {
        activityId: activity.id,
        userId,
        title
      });

      return response.success(res, {
        id: activity.id,
        title: activity.title,
        author: activity.author,
        createdAt: activity.createdAt
      }, '活动创建成功');
    } catch (error) {
      logger.error('创建活动失败:', error);
      return response.serverError(res, '创建活动失败');
    }
  }

  /**
   * 更新活动
   * PUT /api/activities/:id
   */
  static async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const updateData = req.body;

      // 检查活动是否存在且用户有权限修改
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { authorId: true, status: true }
      });

      if (!activity) {
        return response.notFound(res, '活动不存在');
      }

      if (activity.authorId !== userId) {
        return response.forbidden(res, '无权限修改此活动');
      }

      if (activity.status !== 'published') {
        return response.error(res, '只能修改已发布的活动');
      }

      // 处理特殊字段
      if (updateData.tags) {
        updateData.tags = JSON.stringify(updateData.tags);
      }
      if (updateData.images) {
        updateData.images = JSON.stringify(updateData.images);
        updateData.cover = updateData.images.length > 0 ? updateData.images[0] : null;
      }

      // 更新时间
      if (updateData.startTime) {
        updateData.startTime = new Date(updateData.startTime);
      }
      if (updateData.endTime) {
        updateData.endTime = new Date(updateData.endTime);
      }

      // 更新活动
      const updatedActivity = await prisma.activity.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      logger.info('活动更新成功:', {
        activityId: id,
        userId
      });

      return response.success(res, updatedActivity, '活动更新成功');
    } catch (error) {
      logger.error('更新活动失败:', error);
      return response.serverError(res, '更新活动失败');
    }
  }

  /**
   * 删除活动
   * DELETE /api/activities/:id
   */
  static async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // 检查活动是否存在且用户有权限删除
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { authorId: true }
      });

      if (!activity) {
        return response.notFound(res, '活动不存在');
      }

      if (activity.authorId !== userId) {
        return response.forbidden(res, '无权限删除此活动');
      }

      // 软删除活动
      await prisma.activity.update({
        where: { id },
        data: { status: 'deleted' }
      });

      logger.info('活动删除成功:', {
        activityId: id,
        userId
      });

      return response.success(res, null, '活动删除成功');
    } catch (error) {
      logger.error('删除活动失败:', error);
      return response.serverError(res, '删除活动失败');
    }
  }

  /**
   * 点赞/取消点赞活动
   * POST /api/activities/:id/like
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // 检查活动是否存在
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!activity) {
        return response.notFound(res, '活动不存在');
      }

      // 检查是否已点赞
      const existingLike = await prisma.activityLike.findUnique({
        where: {
          userId_activityId: {
            userId,
            activityId: id
          }
        }
      });

      let isLiked;

      if (existingLike) {
        // 取消点赞
        await prisma.activityLike.delete({
          where: {
            userId_activityId: {
              userId,
              activityId: id
            }
          }
        });
        isLiked = false;
      } else {
        // 点赞
        await prisma.activityLike.create({
          data: {
            userId,
            activityId: id
          }
        });
        isLiked = true;
      }

      // 获取最新点赞数
      const likesCount = await prisma.activityLike.count({
        where: { activityId: id }
      });

      return response.success(res, {
        isLiked,
        likesCount
      }, isLiked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      logger.error('点赞操作失败:', error);
      return response.serverError(res, '操作失败');
    }
  }

  /**
   * 参与/取消参与活动
   * POST /api/activities/:id/participate
   */
  static async toggleParticipation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      // 检查活动是否存在
      const activity = await prisma.activity.findUnique({
        where: { id },
        select: { 
          id: true, 
          maxParticipants: true,
          startTime: true,
          endTime: true
        }
      });

      if (!activity) {
        return response.notFound(res, '活动不存在');
      }

      // 检查活动是否已开始
      if (new Date() >= activity.startTime) {
        return response.error(res, '活动已开始，无法参与');
      }

      // 检查是否已参与
      const existingParticipation = await prisma.activityParticipant.findUnique({
        where: {
          userId_activityId: {
            userId,
            activityId: id
          }
        }
      });

      let isParticipated;

      if (existingParticipation) {
        // 取消参与
        await prisma.activityParticipant.delete({
          where: {
            userId_activityId: {
              userId,
              activityId: id
            }
          }
        });
        isParticipated = false;
      } else {
        // 检查参与人数限制
        if (activity.maxParticipants) {
          const currentParticipants = await prisma.activityParticipant.count({
            where: { activityId: id }
          });

          if (currentParticipants >= activity.maxParticipants) {
            return response.error(res, '活动参与人数已满');
          }
        }

        // 参与活动
        await prisma.activityParticipant.create({
          data: {
            userId,
            activityId: id
          }
        });
        isParticipated = true;
      }

      // 获取最新参与人数
      const participantsCount = await prisma.activityParticipant.count({
        where: { activityId: id }
      });

      return response.success(res, {
        isParticipated,
        participantsCount
      }, isParticipated ? '参与成功' : '已取消参与');
    } catch (error) {
      logger.error('参与操作失败:', error);
      return response.serverError(res, '操作失败');
    }
  }

  /**
   * 获取活动分类列表
   * GET /api/activities/categories
   */
  static async getCategories(req, res) {
    try {
      const categories = [
        { key: 'academic', label: '学术讲座', icon: '🎓' },
        { key: 'tech', label: '技术分享', icon: '💻' },
        { key: 'social', label: '社交活动', icon: '👥' },
        { key: 'sports', label: '体育运动', icon: '⚽' },
        { key: 'culture', label: '文艺表演', icon: '🎭' },
        { key: 'volunteer', label: '志愿服务', icon: '❤️' },
        { key: 'other', label: '其他', icon: '🔖' }
      ];

      return response.success(res, categories);
    } catch (error) {
      logger.error('获取活动分类失败:', error);
      return response.serverError(res, '获取活动分类失败');
    }
  }
}

module.exports = ActivityController;
