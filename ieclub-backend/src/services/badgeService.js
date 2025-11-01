// ===== services/badgeService.js - 徽章服务 =====
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * 徽章类型定义
 */
const BADGE_TYPES = {
  // 等级徽章
  NEWBIE: { id: 'newbie', name: '新手上路', icon: '🌟', condition: 'Register account' },
  STUDENT: { id: 'student', name: '学霸', icon: '📚', condition: 'Publish 100 topics' },
  LECTURER: { id: 'lecturer', name: '讲师', icon: '🎓', condition: 'Complete 10 teaching sessions' },
  INNOVATOR: { id: 'innovator', name: '创新者', icon: '💡', condition: 'Publish first project' },
  
  // 社交徽章
  SOCIAL_BUTTERFLY: { id: 'social_butterfly', name: '社交达人', icon: '🤝', condition: 'Get 50 followers' },
  ACTIVE_USER: { id: 'active_user', name: '活跃分子', icon: '🔥', condition: 'Sign in for 30 consecutive days' },
  EFFICIENT: { id: 'efficient', name: '效率王', icon: '⚡', condition: 'Quick response' },
  CHAMPION: { id: 'champion', name: '竞赛冠军', icon: '🏆', condition: 'Win a competition' },
  
  // 排行榜徽章
  WEEKLY_TOP3: { id: 'weekly_top3', name: '周榜前三', icon: '🥇', condition: 'Top 3 in weekly leaderboard' },
  MONTHLY_TOP10: { id: 'monthly_top10', name: '月榜前十', icon: '🎖️', condition: 'Top 10 in monthly leaderboard' },
  YEARLY_TOP20: { id: 'yearly_top20', name: '年榜前二十', icon: '🏅', condition: 'Top 20 in yearly leaderboard' },
  
  // 贡献徽章
  CONTRIBUTOR: { id: 'contributor', name: '贡献者', icon: '🌱', condition: 'Help 10 users' },
  MENTOR: { id: 'mentor', name: '导师', icon: '👨‍🏫', condition: 'Mentor 5 students' },
  HELPER: { id: 'helper', name: '热心助手', icon: '💪', condition: 'Get 100 helpful votes' },
};

/**
 * 积分获取规则
 */
const POINTS_RULES = {
  // 日常活动
  DAILY_SIGN_IN: 5,
  COMPLETE_PROFILE: 20,
  UPLOAD_AVATAR: 10,
  
  // 内容创作
  PUBLISH_TOPIC: 10,
  TOPIC_LIKED: 2,
  TOPIC_BOOKMARKED: 5,
  TOPIC_COMMENTED: 3,
  COMPLETE_SESSION: 50,
  
  // 社交互动
  FOLLOW_USER: 1,
  GET_FOLLOWER: 5,
  REPLY_COMMENT: 2,
  POPULAR_COMMENT: 10, // 评论获得10+赞
  
  // 活动参与
  JOIN_EVENT: 5,
  COMPLETE_EVENT: 10,
  EVENT_FEEDBACK: 5,
  
  // 项目贡献
  CREATE_PROJECT: 30,
  JOIN_PROJECT: 20,
  PROJECT_MILESTONE: 50,
  
  // 排行榜奖励
  WEEKLY_TOP3: 100,
  MONTHLY_TOP10: 200,
  YEARLY_TOP20: 500,
};

class BadgeService {
  /**
   * 检查用户是否应该获得徽章
   */
  async checkAndAwardBadges(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          badges: true,
          _count: {
            select: {
              topics: true,
              comments: true,
              followers: true,
              receivedLikes: true,
            }
          }
        }
      });

      if (!user) return;

      const newBadges = [];

      // 检查各种徽章条件
      
      // 新手徽章
      if (!this.hasBadge(user, 'newbie')) {
        newBadges.push(BADGE_TYPES.NEWBIE);
      }

      // 学霸徽章
      if (user._count.topics >= 100 && !this.hasBadge(user, 'student')) {
        newBadges.push(BADGE_TYPES.STUDENT);
      }

      // 社交达人徽章
      if (user._count.followers >= 50 && !this.hasBadge(user, 'social_butterfly')) {
        newBadges.push(BADGE_TYPES.SOCIAL_BUTTERFLY);
      }

      // 授予新徽章
      for (const badge of newBadges) {
        await this.awardBadge(userId, badge);
      }

      return newBadges;
    } catch (error) {
      logger.error('检查徽章失败:', error);
      return [];
    }
  }

  /**
   * 检查用户是否已拥有某徽章
   */
  hasBadge(user, badgeId) {
    return user.badges?.some(b => b.badgeId === badgeId) || false;
  }

  /**
   * 授予徽章
   */
  async awardBadge(userId, badge) {
    try {
      // 这里假设有一个UserBadge表来存储用户的徽章
      // 由于没有看到具体的schema，这里用注释表示
      
      // await prisma.userBadge.create({
      //   data: {
      //     userId,
      //     badgeId: badge.id,
      //     badgeName: badge.name,
      //     badgeIcon: badge.icon,
      //     awardedAt: new Date()
      //   }
      // });

      // 创建通知
      await this.createBadgeNotification(userId, badge);

      logger.info(`用户 ${userId} 获得徽章: ${badge.name}`);
      return true;
    } catch (error) {
      logger.error('授予徽章失败:', error);
      return false;
    }
  }

  /**
   * 创建徽章通知
   */
  async createBadgeNotification(userId, badge) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'achievement',
          title: '🎉 恭喜获得新徽章！',
          content: `你获得了 "${badge.icon} ${badge.name}" 徽章！`,
          isRead: false
        }
      });
    } catch (error) {
      logger.error('创建徽章通知失败:', error);
    }
  }

  /**
   * 增加用户积分
   */
  async addPoints(userId, pointsType, amount = null) {
    try {
      const points = amount || POINTS_RULES[pointsType] || 0;
      
      if (points === 0) return;

      await prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: points
          }
        }
      });

      // 检查等级提升
      await this.checkLevelUp(userId);

      // 检查是否应该获得新徽章
      await this.checkAndAwardBadges(userId);

      logger.info(`用户 ${userId} 获得 ${points} 积分 (${pointsType})`);
      return points;
    } catch (error) {
      logger.error('增加积分失败:', error);
      return 0;
    }
  }

  /**
   * 检查等级提升
   */
  async checkLevelUp(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true, level: true }
      });

      if (!user) return;

      // 计算应有的等级
      const newLevel = this.calculateLevel(user.points);

      if (newLevel > user.level) {
        await prisma.user.update({
          where: { id: userId },
          data: { level: newLevel }
        });

        // 创建升级通知
        await prisma.notification.create({
          data: {
            userId,
            type: 'system',
            title: '⭐ 等级提升！',
            content: `恭喜升级到 LV${newLevel}！解锁新功能和权限。`,
            isRead: false
          }
        });

        logger.info(`用户 ${userId} 升级到 LV${newLevel}`);
      }
    } catch (error) {
      logger.error('检查等级提升失败:', error);
    }
  }

  /**
   * 根据积分计算等级
   */
  calculateLevel(points) {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    if (points < 5500) return 10;
    
    // 10级以上每1000积分升1级
    return 10 + Math.floor((points - 5500) / 1000);
  }

  /**
   * 获取用户的所有徽章
   */
  async getUserBadges(_userId) {
    // 这里假设有UserBadge表
    // const badges = await prisma.userBadge.findMany({
    //   where: { userId: _userId },
    //   orderBy: { awardedAt: 'desc' }
    // });
    // return badges;
    
    return [];
  }

  /**
   * 获取所有徽章类型
   */
  getAllBadgeTypes() {
    return Object.values(BADGE_TYPES);
  }

  /**
   * 获取积分规则
   */
  getPointsRules() {
    return POINTS_RULES;
  }
}

module.exports = new BadgeService();
module.exports.BADGE_TYPES = BADGE_TYPES;
module.exports.POINTS_RULES = POINTS_RULES;

