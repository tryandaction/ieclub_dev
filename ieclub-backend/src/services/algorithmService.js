// src/services/algorithmService.js
// 核心算法服务：热度计算、推荐、匹配等

const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const logger = require('../utils/logger');
const { CacheManager } = require('../utils/redis');

const prisma = require('../config/database');

class AlgorithmService {
  /**
   * 计算话题热度分数
   * @param {object} topic - 话题对象
   */
  static calculateHotScore(topic) {
    const now = Date.now();
    const createdTime = new Date(topic.createdAt).getTime();
    const ageInHours = (now - createdTime) / (1000 * 60 * 60);

    // 加权投票数
    const votes =
      topic.viewsCount * config.business.hotScore.viewWeight +
      topic.likesCount * config.business.hotScore.likeWeight +
      topic.commentsCount * config.business.hotScore.commentWeight +
      topic.bookmarksCount * config.business.hotScore.bookmarkWeight;

    // 时间衰减
    const gravity = config.business.hotScore.gravity;
    const score = votes / Math.pow(ageInHours + 2, gravity);

    return Math.round(score * 100) / 100;
  }

  /**
   * 批量更新话题热度
   */
  static async updateAllHotScores() {
    try {
      // 获取最近 7 天的话题
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const topics = await prisma.topic.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: 'published',
        },
        select: {
          id: true,
          createdAt: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          bookmarksCount: true,
        },
      });

      // 计算并更新热度
      const updates = topics.map((topic) => {
        const hotScore = this.calculateHotScore(topic);
        return prisma.topic.update({
          where: { id: topic.id },
          data: {
            hotScore,
            isHot: hotScore > 10, // 热度超过 10 标记为热门
          },
        });
      });

      await Promise.all(updates);

      logger.info(`更新了 ${topics.length} 个话题的热度分数`);
      return topics.length;
    } catch (error) {
      logger.error('更新热度分数失败:', error);
      throw error;
    }
  }

  /**
   * 计算用户兴趣标签（基于行为）
   * @param {string} userId - 用户 ID
   */
  static async calculateUserInterests(userId) {
    try {
      // 获取用户最近的行为
      const recentActions = await prisma.userAction.findMany({
        where: {
          userId,
          actionType: { in: ['view', 'like', 'comment', 'bookmark'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 最近 30 天
        },
        take: 100,
      });

      // 统计标签频率
      const tagFrequency = {};
      const categoryFrequency = {};

      for (const action of recentActions) {
        if (action.targetType === 'topic') {
          const topic = await prisma.topic.findUnique({
            where: { id: action.targetId },
            select: { tags: true, category: true },
          });

          if (topic) {
            // 统计标签
            const tags = topic.tags || [];
            tags.forEach((tag) => {
              tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
            });

            // 统计分类
            categoryFrequency[topic.category] = (categoryFrequency[topic.category] || 0) + 1;
          }
        }
      }

      // 排序并取 Top 10
      const topTags = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((item) => item[0]);

      const topCategories = Object.entries(categoryFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((item) => item[0]);

      return {
        tags: topTags,
        categories: topCategories,
      };
    } catch (error) {
      logger.error('计算用户兴趣失败:', error);
      return { tags: [], categories: [] };
    }
  }

  /**
   * 个性化推荐话题
   * @param {string} userId - 用户 ID
   * @param {number} limit - 推荐数量
   */
  static async recommendTopics(userId, limit = 20) {
    try {
      // 先从缓存获取
      const cacheKey = CacheManager.makeKey('recommend', userId);
      const cached = await CacheManager.get(cacheKey);

      if (cached) {
        return cached;
      }

      // 获取用户兴趣
      const userInterests = await this.calculateUserInterests(userId);

      // 获取用户已浏览的话题 ID
      const viewedActions = await prisma.userAction.findMany({
        where: {
          userId,
          actionType: 'view',
          targetType: 'topic',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { targetId: true },
      });

      const viewedTopicIds = viewedActions.map((action) => action.targetId);

      // 推荐策略：
      // 1. 基于用户兴趣标签的话题（60%）
      // 2. 热门话题（30%）
      // 3. 最新话题（10%）

      const interestLimit = Math.ceil(limit * 0.6);
      const hotLimit = Math.ceil(limit * 0.3);
      const newLimit = limit - interestLimit - hotLimit;

      // 1. 基于兴趣的话题
      const interestTopics = userInterests.tags.length > 0
        ? await prisma.topic.findMany({
            where: {
              status: 'published',
              id: { notIn: viewedTopicIds },
              OR: userInterests.tags.map((tag) => ({
                tags: { array_contains: tag },
              })),
            },
            orderBy: { hotScore: 'desc' },
            take: interestLimit,
            include: {
              author: {
                select: { id: true, nickname: true, avatar: true },
              },
            },
          })
        : [];

      // 2. 热门话题
      const hotTopics = await prisma.topic.findMany({
        where: {
          status: 'published',
          isHot: true,
          id: { notIn: [...viewedTopicIds, ...interestTopics.map((t) => t.id)] },
        },
        orderBy: { hotScore: 'desc' },
        take: hotLimit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 3. 最新话题
      const newTopics = await prisma.topic.findMany({
        where: {
          status: 'published',
          id: {
            notIn: [
              ...viewedTopicIds,
              ...interestTopics.map((t) => t.id),
              ...hotTopics.map((t) => t.id),
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: newLimit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 合并并打乱顺序
      const recommendedTopics = [...interestTopics, ...hotTopics, ...newTopics].sort(
        () => Math.random() - 0.5
      );

      // 缓存推荐结果（1 小时）
      await CacheManager.set(cacheKey, recommendedTopics, config.business.recommend.refreshInterval);

      return recommendedTopics;
    } catch (error) {
      logger.error('推荐话题失败:', error);
      // 失败时返回热门话题
      return await prisma.topic.findMany({
        where: { status: 'published', isHot: true },
        orderBy: { hotScore: 'desc' },
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });
    }
  }

  /**
   * 计算供需匹配分数
   * @param {object} demand - 需求话题
   * @param {object} supply - 供给话题或用户
   */
  static calculateMatchScore(demand, supply) {
    let skillsScore = 0;
    let interestsScore = 0;
    let locationScore = 0;

    // 1. 技能匹配
    const demandSkills = demand.skillsNeeded || [];
    const supplySkills = supply.skillsProvided || supply.skills || [];

    if (demandSkills.length > 0 && supplySkills.length > 0) {
      const matchedSkills = demandSkills.filter((skill) =>
        supplySkills.some((s) => s.toLowerCase() === skill.toLowerCase())
      );
      skillsScore = matchedSkills.length / demandSkills.length;
    }

    // 2. 兴趣标签匹配
    const demandTags = demand.tags || [];
    const supplyTags = supply.tags || supply.interests || [];

    if (demandTags.length > 0 && supplyTags.length > 0) {
      const matchedTags = demandTags.filter((tag) =>
        supplyTags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
      interestsScore = matchedTags.length / Math.max(demandTags.length, supplyTags.length);
    }

    // 3. 地点匹配
    if (demand.location && supply.location) {
      locationScore = demand.location === supply.location ? 1 : 0.5;
    }

    // 加权计算总分
    const totalScore =
      skillsScore * config.business.match.skillsWeight +
      interestsScore * config.business.match.interestsWeight +
      locationScore * config.business.match.locationWeight;

    return {
      score: Math.round(totalScore * 100) / 100,
      skillsScore,
      interestsScore,
      locationScore,
    };
  }

  /**
   * 供需匹配推荐
   * @param {string} topicId - 话题 ID（需求或供给）
   * @param {number} limit - 推荐数量
   */
  static async matchRecommendation(topicId, limit = 10) {
    try {
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        include: { author: true },
      });

      if (!topic) {
        return [];
      }

      // 根据话题类型确定匹配方向
      let targetTypes = [];
      if (topic.topicType === 'demand') {
        targetTypes = ['supply', 'collaboration'];
      } else if (topic.topicType === 'supply') {
        targetTypes = ['demand', 'collaboration'];
      } else {
        return [];
      }

      // 查找潜在匹配的话题
      const potentialMatches = await prisma.topic.findMany({
        where: {
          status: 'published',
          topicType: { in: targetTypes },
          id: { not: topicId },
        },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 计算匹配分数
      const matches = potentialMatches
        .map((match) => {
          const matchResult = this.calculateMatchScore(topic, match);
          return {
            topic: match,
            ...matchResult,
          };
        })
        .filter((m) => m.score >= config.business.match.minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return matches;
    } catch (error) {
      logger.error('供需匹配推荐失败:', error);
      return [];
    }
  }

  /**
   * 为用户推荐匹配的话题（我能帮助的）
   * @param {string} userId - 用户 ID
   * @param {number} limit - 推荐数量
   */
  static async matchUserToTopics(userId, limit = 10) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return [];
      }

      // 查找需求话题
      const demandTopics = await prisma.topic.findMany({
        where: {
          status: 'published',
          topicType: 'demand',
          authorId: { not: userId },
        },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 计算匹配分数
      const matches = demandTopics
        .map((topic) => {
          const matchResult = this.calculateMatchScore(topic, user);
          return {
            topic,
            ...matchResult,
            matchReasons: this.generateMatchReasons(topic, user, matchResult),
          };
        })
        .filter((m) => m.score >= config.business.match.minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return matches;
    } catch (error) {
      logger.error('用户匹配推荐失败:', error);
      return [];
    }
  }

  /**
   * 生成匹配原因说明
   * @param {object} topic - 话题
   * @param {object} user - 用户
   * @param {object} matchResult - 匹配结果
   */
  static generateMatchReasons(topic, user, matchResult) {
    const reasons = [];

    // 技能匹配
    if (matchResult.skillsScore > 0) {
      const demandSkills = topic.skillsNeeded || [];
      const userSkills = user.skills || [];
      const matched = demandSkills.filter((skill) =>
        userSkills.some((s) => s.toLowerCase() === skill.toLowerCase())
      );
      if (matched.length > 0) {
        reasons.push(`你擅长的技能：${matched.join('、')}`);
      }
    }

    // 兴趣匹配
    if (matchResult.interestsScore > 0) {
      const topicTags = topic.tags || [];
      const userInterests = user.interests || [];
      const matched = topicTags.filter((tag) =>
        userInterests.some((i) => i.toLowerCase() === tag.toLowerCase())
      );
      if (matched.length > 0) {
        reasons.push(`兴趣匹配：${matched.join('、')}`);
      }
    }

    // 地点匹配
    if (matchResult.locationScore === 1) {
      reasons.push(`同城：${topic.location}`);
    }

    // 匹配度
    const percentage = Math.round(matchResult.score * 100);
    reasons.push(`匹配度：${percentage}%`);

    return reasons;
  }

  /**
   * 趋势话题检测（最近快速增长的话题）
   */
  static async detectTrendingTopics(limit = 10) {
    try {
      // 获取最近 24 小时的话题
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const recentTopics = await prisma.topic.findMany({
        where: {
          status: 'published',
          createdAt: { gte: yesterday },
        },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      });

      // 计算趋势分数（增长速度）
      const trendingTopics = recentTopics
        .map((topic) => {
          const ageInHours = (Date.now() - new Date(topic.createdAt).getTime()) / (1000 * 60 * 60);
          const engagementRate =
            (topic.likesCount * 2 + topic.commentsCount * 3 + topic.bookmarksCount * 2) /
            Math.max(ageInHours, 1);

          return {
            ...topic,
            trendingScore: Math.round(engagementRate * 100) / 100,
          };
        })
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

      return trendingTopics;
    } catch (error) {
      logger.error('趋势话题检测失败:', error);
      return [];
    }
  }
}

module.exports = AlgorithmService;