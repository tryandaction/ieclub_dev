/**
 * 积分服务
 * 负责用户积分、经验值的增减和等级计算
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

// 积分规则配置
const CREDIT_RULES = {
  // 内容创作
  topic_create: { credits: 10, exp: 15, reason: '发布话题' },
  comment_create: { credits: 3, exp: 5, reason: '发表评论' },
  
  // 社交互动
  like_received: { credits: 1, exp: 2, reason: '获得点赞' },
  like_given: { credits: 0, exp: 1, reason: '点赞他人' },
  follow_received: { credits: 2, exp: 3, reason: '获得关注' },
  bookmark_received: { credits: 2, exp: 3, reason: '内容被收藏' },
  
  // 每日活动
  daily_check_in: { credits: 5, exp: 5, reason: '每日签到' },
  continuous_check_in_7: { credits: 10, exp: 10, reason: '连续签到7天奖励' },
  continuous_check_in_30: { credits: 50, exp: 50, reason: '连续签到30天奖励' },
  
  // 个人资料完善
  profile_complete: { credits: 10, exp: 10, reason: '完善个人资料' },
  avatar_upload: { credits: 5, exp: 5, reason: '上传头像' },
  
  // 特殊事件
  topic_hot: { credits: 20, exp: 30, reason: '话题成为热门' },
  topic_featured: { credits: 50, exp: 50, reason: '话题被推荐' },
  
  // 负面行为（扣分）
  content_removed: { credits: -20, exp: -30, reason: '内容被删除' },
  violation_warning: { credits: -50, exp: -50, reason: '违规警告' },
};

class CreditService {
  /**
   * 添加积分和经验值
   * @param {string} userId - 用户ID
   * @param {string} action - 行为类型
   * @param {object} options - 额外选项 { relatedType, relatedId, metadata }
   */
  async addCredits(userId, action, options = {}) {
    try {
      const rule = CREDIT_RULES[action];
      if (!rule) {
        logger.warn(`未知的积分规则: ${action}`);
        return null;
      }

      const { credits, exp, reason } = rule;
      const { relatedType, relatedId, metadata } = options;

      // 在事务中更新用户积分和经验值，并记录日志
      const result = await prisma.$transaction(async (tx) => {
        // 更新用户积分和经验值
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            credits: { increment: credits },
            exp: { increment: exp },
          },
        });

        // 记录积分变动日志
        const creditLog = await tx.creditLog.create({
          data: {
            userId,
            action,
            amount: credits,
            reason,
            relatedType,
            relatedId,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });

        // 检查并更新等级
        const newLevel = await this.checkAndUpdateLevel(userId, user.exp, tx);

        return {
          user,
          creditLog,
          levelUp: newLevel > user.level,
          newLevel,
        };
      });

      // 如果升级了，检查是否解锁新勋章
      if (result.levelUp) {
        await this.checkLevelBadges(userId, result.newLevel);
      }

      logger.info(`用户 ${userId} ${reason}: +${credits}积分, +${exp}经验`, {
        action,
        credits: result.user.credits,
        exp: result.user.exp,
        level: result.newLevel,
      });

      return result;
    } catch (error) {
      logger.error('添加积分失败:', error);
      throw error;
    }
  }

  /**
   * 检查并更新用户等级
   * @param {string} userId - 用户ID
   * @param {number} currentExp - 当前经验值
   * @param {object} tx - Prisma事务对象
   */
  async checkAndUpdateLevel(userId, currentExp, tx = prisma) {
    try {
      // 获取所有等级配置
      const levels = await tx.userLevel.findMany({
        orderBy: { level: 'asc' },
      });

      // 根据经验值确定等级
      let targetLevel = 1;
      for (const levelConfig of levels) {
        if (currentExp >= levelConfig.minExp && currentExp <= levelConfig.maxExp) {
          targetLevel = levelConfig.level;
          break;
        }
      }

      // 更新用户等级
      await tx.user.update({
        where: { id: userId },
        data: { level: targetLevel },
      });

      return targetLevel;
    } catch (error) {
      logger.error('更新用户等级失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户积分历史
   * @param {string} userId - 用户ID
   * @param {object} options - 查询选项 { limit, offset, action }
   */
  async getCreditHistory(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, action } = options;

      const where = { userId };
      if (action) {
        where.action = action;
      }

      const [logs, total] = await Promise.all([
        prisma.creditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.creditLog.count({ where }),
      ]);

      return {
        logs,
        total,
        hasMore: offset + logs.length < total,
      };
    } catch (error) {
      logger.error('获取积分历史失败:', error);
      throw error;
    }
  }

  /**
   * 每日签到
   * @param {string} userId - 用户ID
   */
  async dailyCheckIn(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 检查今天是否已经签到
      const existingCheckIn = await prisma.dailyCheckIn.findFirst({
        where: {
          userId,
          checkInDate: today,
        },
      });

      if (existingCheckIn) {
        return {
          success: false,
          message: '今天已经签到过了',
          data: existingCheckIn,
        };
      }

      // 获取昨天的签到记录
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCheckIn = await prisma.dailyCheckIn.findFirst({
        where: {
          userId,
          checkInDate: yesterday,
        },
      });

      // 计算连续签到天数
      const consecutiveDays = yesterdayCheckIn 
        ? yesterdayCheckIn.consecutiveDays + 1 
        : 1;

      // 基础签到积分
      let totalCredits = 5;

      // 连续签到奖励
      if (consecutiveDays === 7) {
        totalCredits += 10;
      } else if (consecutiveDays === 30) {
        totalCredits += 50;
      } else if (consecutiveDays % 10 === 0) {
        totalCredits += 5; // 每10天小奖励
      }

      // 创建签到记录
      const checkIn = await prisma.dailyCheckIn.create({
        data: {
          userId,
          checkInDate: today,
          credits: totalCredits,
          consecutiveDays,
        },
      });

      // 添加积分
      await this.addCredits(userId, 'daily_check_in', {
        relatedType: 'check_in',
        relatedId: checkIn.id,
        metadata: { consecutiveDays },
      });

      // 额外奖励处理
      if (consecutiveDays === 7) {
        await this.addCredits(userId, 'continuous_check_in_7');
      } else if (consecutiveDays === 30) {
        await this.addCredits(userId, 'continuous_check_in_30');
      }

      // 检查签到相关勋章
      await this.checkCheckInBadges(userId, consecutiveDays);

      return {
        success: true,
        message: '签到成功',
        data: {
          ...checkIn,
          totalCredits,
        },
      };
    } catch (error) {
      logger.error('签到失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户签到状态
   * @param {string} userId - 用户ID
   */
  async getCheckInStatus(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCheckIn = await prisma.dailyCheckIn.findFirst({
        where: {
          userId,
          checkInDate: today,
        },
      });

      const totalCheckIns = await prisma.dailyCheckIn.count({
        where: { userId },
      });

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayCheckIn = await prisma.dailyCheckIn.findFirst({
        where: {
          userId,
          checkInDate: yesterday,
        },
      });

      return {
        checkedInToday: !!todayCheckIn,
        consecutiveDays: todayCheckIn?.consecutiveDays || yesterdayCheckIn?.consecutiveDays || 0,
        totalCheckIns,
        todayCredits: todayCheckIn?.credits || 0,
      };
    } catch (error) {
      logger.error('获取签到状态失败:', error);
      throw error;
    }
  }

  /**
   * 检查签到相关勋章
   * @param {string} userId - 用户ID
   * @param {number} consecutiveDays - 连续签到天数
   */
  async checkCheckInBadges(userId, consecutiveDays) {
    try {
      const badgesToAward = [];

      if (consecutiveDays >= 7) badgesToAward.push('weekly_visitor');
      if (consecutiveDays >= 30) badgesToAward.push('monthly_devotee');
      if (consecutiveDays >= 100) badgesToAward.push('centurion');

      for (const badgeCode of badgesToAward) {
        await this.awardBadge(userId, badgeCode);
      }
    } catch (error) {
      logger.error('检查签到勋章失败:', error);
    }
  }

  /**
   * 检查等级相关勋章
   * @param {string} userId - 用户ID
   * @param {number} level - 当前等级
   */
  async checkLevelBadges(userId, level) {
    try {
      // 根据等级授予勋章
      // 可以扩展更多基于等级的勋章
      logger.info(`用户 ${userId} 达到等级 ${level}`);
    } catch (error) {
      logger.error('检查等级勋章失败:', error);
    }
  }

  /**
   * 授予勋章
   * @param {string} userId - 用户ID
   * @param {string} badgeCode - 勋章代码
   */
  async awardBadge(userId, badgeCode) {
    try {
      // 查找勋章
      const badge = await prisma.userBadge.findUnique({
        where: { code: badgeCode },
      });

      if (!badge || !badge.isActive) {
        return null;
      }

      // 检查是否已经拥有
      const existing = await prisma.userBadgeRecord.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // 授予勋章
      const record = await prisma.userBadgeRecord.create({
        data: {
          userId,
          badgeId: badge.id,
          progress: 100,
        },
        include: {
          badge: true,
        },
      });

      logger.info(`用户 ${userId} 获得勋章: ${badge.name}`);

      // TODO: 发送通知
      // await notificationService.create({
      //   userId,
      //   type: 'badge_awarded',
      //   title: '获得新勋章',
      //   content: `恭喜你获得勋章：${badge.name}`,
      // });

      return record;
    } catch (error) {
      logger.error('授予勋章失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户勋章列表
   * @param {string} userId - 用户ID
   */
  async getUserBadges(userId) {
    try {
      const records = await prisma.userBadgeRecord.findMany({
        where: { userId },
        include: {
          badge: true,
        },
        orderBy: { awardedAt: 'desc' },
      });

      return records;
    } catch (error) {
      logger.error('获取用户勋章失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用勋章
   */
  async getAllBadges() {
    try {
      const badges = await prisma.userBadge.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { rarity: 'asc' },
        ],
      });

      return badges;
    } catch (error) {
      logger.error('获取勋章列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户等级信息
   * @param {string} userId - 用户ID
   */
  async getUserLevelInfo(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          level: true,
          exp: true,
          credits: true,
        },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 获取当前等级配置
      const currentLevelConfig = await prisma.userLevel.findUnique({
        where: { level: user.level },
      });

      // 获取下一等级配置
      const nextLevelConfig = await prisma.userLevel.findUnique({
        where: { level: user.level + 1 },
      });

      // 计算当前等级进度
      const levelProgress = currentLevelConfig
        ? ((user.exp - currentLevelConfig.minExp) / 
           (currentLevelConfig.maxExp - currentLevelConfig.minExp)) * 100
        : 0;

      return {
        user,
        currentLevel: currentLevelConfig,
        nextLevel: nextLevelConfig,
        levelProgress: Math.round(levelProgress),
        expToNextLevel: nextLevelConfig 
          ? nextLevelConfig.minExp - user.exp 
          : 0,
      };
    } catch (error) {
      logger.error('获取用户等级信息失败:', error);
      throw error;
    }
  }
}

module.exports = new CreditService();

