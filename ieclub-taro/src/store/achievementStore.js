/**
 * 成就系统状态管理 Store
 * 管理用户成就、勋章、等级等
 */
import { create } from 'zustand';

// 勋章类别枚举
export const BadgeCategory = {
  BEGINNER: 'beginner',       // 新手
  SOCIAL: 'social',           // 社交
  CONTENT: 'content',         // 内容创作
  LEARNING: 'learning',       // 学习
  ACTIVITY: 'activity',       // 活动
  ACHIEVEMENT: 'achievement', // 成就
};

// 勋章稀有度枚举
export const BadgeRarity = {
  COMMON: 'common',           // 普通
  RARE: 'rare',               // 稀有
  EPIC: 'epic',               // 史诗
  LEGENDARY: 'legendary',     // 传说
};

export const useAchievementStore = create((set, get) => ({
  // ===== 状态 =====
  // 用户数据
  level: 1,                    // 当前等级
  experience: 0,               // 当前经验值
  nextLevelExp: 100,           // 下一级所需经验
  points: 0,                   // 积分
  
  // 勋章数据
  badges: [],                  // 已获得的勋章列表
  allBadges: [],               // 所有勋章（包括未解锁）
  recentBadges: [],            // 最近获得的勋章
  
  // 统计数据
  stats: {
    topicsPublished: 0,        // 发布话题数
    topicsLiked: 0,            // 获得点赞数
    commentsCount: 0,          // 评论数
    followersCount: 0,         // 粉丝数
    followingCount: 0,         // 关注数
    activitiesJoined: 0,       // 参与活动数
    projectsCreated: 0,        // 创建项目数
    teamFormedCount: 0,        // 成团次数
    consecutiveDays: 0,        // 连续签到天数
    totalDays: 0,              // 总签到天数
  },
  
  // 排行榜数据
  leaderboard: {
    contribution: [],          // 贡献度排行
    sharing: [],               // 知识分享排行
    popularity: [],            // 人气排行
    currentUserRank: null,     // 当前用户排名
  },
  
  isLoading: false,
  error: null,

  // ===== Actions =====
  
  /**
   * 设置用户等级和经验
   * @param {number} level - 等级
   * @param {number} experience - 经验值
   * @param {number} nextLevelExp - 下一级所需经验
   */
  setLevel: (level, experience, nextLevelExp) => {
    set({ level, experience, nextLevelExp });
  },

  /**
   * 增加经验值
   * @param {number} exp - 增加的经验值
   */
  addExperience: (exp) => {
    set((state) => {
      let newExp = state.experience + exp;
      let newLevel = state.level;
      let nextExp = state.nextLevelExp;

      // 检查是否升级
      while (newExp >= nextExp) {
        newExp -= nextExp;
        newLevel += 1;
        nextExp = Math.floor(nextExp * 1.5); // 每级所需经验递增50%
      }

      return {
        level: newLevel,
        experience: newExp,
        nextLevelExp: nextExp,
      };
    });
  },

  /**
   * 设置积分
   * @param {number} points - 积分数
   */
  setPoints: (points) => {
    set({ points });
  },

  /**
   * 增加积分
   * @param {number} amount - 增加的积分数
   */
  addPoints: (amount) => {
    set((state) => ({
      points: state.points + amount,
    }));
  },

  /**
   * 扣除积分
   * @param {number} amount - 扣除的积分数
   */
  deductPoints: (amount) => {
    set((state) => ({
      points: Math.max(0, state.points - amount),
    }));
  },

  /**
   * 设置已获得的勋章列表
   * @param {array} badges - 勋章列表
   */
  setBadges: (badges) => {
    set({ badges });
  },

  /**
   * 添加新勋章
   * @param {object} badge - 勋章对象
   */
  addBadge: (badge) => {
    set((state) => ({
      badges: [...state.badges, badge],
      recentBadges: [badge, ...state.recentBadges.slice(0, 4)], // 保留最近5个
    }));
  },

  /**
   * 设置所有勋章（包括未解锁）
   * @param {array} allBadges - 所有勋章列表
   */
  setAllBadges: (allBadges) => {
    set({ allBadges });
  },

  /**
   * 更新统计数据
   * @param {object} stats - 统计数据对象
   */
  updateStats: (stats) => {
    set((state) => ({
      stats: { ...state.stats, ...stats },
    }));
  },

  /**
   * 增加统计计数
   * @param {string} key - 统计项键名
   * @param {number} amount - 增加的数量（默认1）
   */
  incrementStat: (key, amount = 1) => {
    set((state) => ({
      stats: {
        ...state.stats,
        [key]: (state.stats[key] || 0) + amount,
      },
    }));
  },

  /**
   * 签到
   * @param {boolean} isConsecutive - 是否连续签到
   */
  checkIn: (isConsecutive = true) => {
    set((state) => ({
      stats: {
        ...state.stats,
        consecutiveDays: isConsecutive
          ? state.stats.consecutiveDays + 1
          : 1,
        totalDays: state.stats.totalDays + 1,
      },
    }));
    // 签到奖励
    get().addPoints(5);
    get().addExperience(10);
  },

  /**
   * 设置排行榜数据
   * @param {object} leaderboard - 排行榜数据
   */
  setLeaderboard: (leaderboard) => {
    set((state) => ({
      leaderboard: { ...state.leaderboard, ...leaderboard },
    }));
  },

  /**
   * 获取等级进度百分比
   * @returns {number} 进度百分比 (0-100)
   */
  getLevelProgress: () => {
    const { experience, nextLevelExp } = get();
    return Math.floor((experience / nextLevelExp) * 100);
  },

  /**
   * 获取勋章完成度
   * @returns {object} { earned, total, percentage }
   */
  getBadgeCompletion: () => {
    const { badges, allBadges } = get();
    const earned = badges.length;
    const total = allBadges.length;
    const percentage = total > 0 ? Math.floor((earned / total) * 100) : 0;
    return { earned, total, percentage };
  },

  /**
   * 设置加载状态
   * @param {boolean} isLoading
   */
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  /**
   * 设置错误信息
   * @param {string|null} error
   */
  setError: (error) => {
    set({ error });
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 重置所有状态
   */
  reset: () => {
    set({
      level: 1,
      experience: 0,
      nextLevelExp: 100,
      points: 0,
      badges: [],
      allBadges: [],
      recentBadges: [],
      stats: {
        topicsPublished: 0,
        topicsLiked: 0,
        commentsCount: 0,
        followersCount: 0,
        followingCount: 0,
        activitiesJoined: 0,
        projectsCreated: 0,
        teamFormedCount: 0,
        consecutiveDays: 0,
        totalDays: 0,
      },
      leaderboard: {
        contribution: [],
        sharing: [],
        popularity: [],
        currentUserRank: null,
      },
      isLoading: false,
      error: null,
    });
  },
}));

export default useAchievementStore;

