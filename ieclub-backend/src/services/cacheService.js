// src/services/cacheService.js
// 统一的缓存服务

const { CacheManager } = require('../utils/redis');
const logger = require('../utils/logger');

/**
 * 缓存服务类
 * 提供统一的缓存管理接口
 */
class CacheService {
  /**
   * 缓存键前缀
   */
  static PREFIX = {
    TOPIC: 'topic',
    TOPIC_LIST: 'topics:list',
    ACTIVITY: 'activity',
    ACTIVITY_LIST: 'activities:list',
    USER: 'user',
    USER_PROFILE: 'user:profile',
    COMMENT: 'comment',
    SEARCH: 'search',
    HOT: 'hot',
    RECOMMEND: 'recommend'
  };

  /**
   * 默认 TTL（秒）
   */
  static TTL = {
    SHORT: 60,        // 1分钟
    MEDIUM: 300,      // 5分钟
    LONG: 1800,       // 30分钟
    VERY_LONG: 3600   // 1小时
  };

  // ==================== 话题缓存 ====================

  /**
   * 缓存话题列表
   */
  static async cacheTopicList(params, data, ttl = this.TTL.MEDIUM) {
    const key = this.buildTopicListKey(params);
    try {
      await CacheManager.set(key, JSON.stringify(data), ttl);
      logger.debug(`缓存话题列表: ${key}`);
      return true;
    } catch (error) {
      logger.error(`缓存话题列表失败:`, error);
      return false;
    }
  }

  /**
   * 获取话题列表缓存
   */
  static async getTopicList(params) {
    const key = this.buildTopicListKey(params);
    try {
      const cached = await CacheManager.get(key);
      if (cached) {
        logger.debug(`话题列表缓存命中: ${key}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error(`获取话题列表缓存失败:`, error);
      return null;
    }
  }

  /**
   * 清除话题相关缓存
   */
  static async invalidateTopicCache(topicId = null) {
    try {
      const patterns = [
        `${this.PREFIX.TOPIC_LIST}:*`,
        `${this.PREFIX.HOT}:topics:*`,
        `${this.PREFIX.RECOMMEND}:topics:*`
      ];

      if (topicId) {
        patterns.push(`${this.PREFIX.TOPIC}:${topicId}:*`);
      }

      for (const pattern of patterns) {
        await CacheManager.delPattern(pattern);
      }

      logger.info(`清除话题缓存`, { topicId });
      return true;
    } catch (error) {
      logger.error(`清除话题缓存失败:`, error);
      return false;
    }
  }

  /**
   * 构建话题列表缓存键
   */
  static buildTopicListKey(params) {
    const { page = 1, limit = 20, category, topicType, sortBy, tags, search, userId } = params;
    return `${this.PREFIX.TOPIC_LIST}:${userId || 'guest'}:${page}:${limit}:${category || 'all'}:${topicType || 'all'}:${sortBy || 'hot'}:${tags || ''}:${search || ''}`;
  }

  // ==================== 活动缓存 ====================

  /**
   * 缓存活动列表
   */
  static async cacheActivityList(params, data, ttl = this.TTL.MEDIUM) {
    const key = this.buildActivityListKey(params);
    try {
      await CacheManager.set(key, JSON.stringify(data), ttl);
      logger.debug(`缓存活动列表: ${key}`);
      return true;
    } catch (error) {
      logger.error(`缓存活动列表失败:`, error);
      return false;
    }
  }

  /**
   * 获取活动列表缓存
   */
  static async getActivityList(params) {
    const key = this.buildActivityListKey(params);
    try {
      const cached = await CacheManager.get(key);
      if (cached) {
        logger.debug(`活动列表缓存命中: ${key}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error(`获取活动列表缓存失败:`, error);
      return null;
    }
  }

  /**
   * 清除活动相关缓存
   */
  static async invalidateActivityCache(activityId = null) {
    try {
      const patterns = [
        `${this.PREFIX.ACTIVITY_LIST}:*`,
        `${this.PREFIX.HOT}:activities:*`
      ];

      if (activityId) {
        patterns.push(`${this.PREFIX.ACTIVITY}:${activityId}:*`);
      }

      for (const pattern of patterns) {
        await CacheManager.delPattern(pattern);
      }

      logger.info(`清除活动缓存`, { activityId });
      return true;
    } catch (error) {
      logger.error(`清除活动缓存失败:`, error);
      return false;
    }
  }

  /**
   * 构建活动列表缓存键
   */
  static buildActivityListKey(params) {
    const { page = 1, limit = 20, category, sortBy, status, search } = params;
    return `${this.PREFIX.ACTIVITY_LIST}:${page}:${limit}:${category || 'all'}:${sortBy || 'time'}:${status || 'all'}:${search || ''}`;
  }

  // ==================== 用户缓存 ====================

  /**
   * 缓存用户信息
   */
  static async cacheUser(userId, data, ttl = this.TTL.LONG) {
    const key = `${this.PREFIX.USER}:${userId}`;
    try {
      await CacheManager.set(key, JSON.stringify(data), ttl);
      logger.debug(`缓存用户信息: ${key}`);
      return true;
    } catch (error) {
      logger.error(`缓存用户信息失败:`, error);
      return false;
    }
  }

  /**
   * 获取用户缓存
   */
  static async getUser(userId) {
    const key = `${this.PREFIX.USER}:${userId}`;
    try {
      const cached = await CacheManager.get(key);
      if (cached) {
        logger.debug(`用户缓存命中: ${key}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error(`获取用户缓存失败:`, error);
      return null;
    }
  }

  /**
   * 清除用户缓存
   */
  static async invalidateUserCache(userId) {
    try {
      const patterns = [
        `${this.PREFIX.USER}:${userId}`,
        `${this.PREFIX.USER_PROFILE}:${userId}:*`
      ];

      for (const pattern of patterns) {
        await CacheManager.delPattern(pattern);
      }

      logger.info(`清除用户缓存`, { userId });
      return true;
    } catch (error) {
      logger.error(`清除用户缓存失败:`, error);
      return false;
    }
  }

  // ==================== 搜索缓存 ====================

  /**
   * 缓存搜索结果
   */
  static async cacheSearchResult(keyword, type, data, ttl = this.TTL.SHORT) {
    const key = `${this.PREFIX.SEARCH}:${type}:${keyword}`;
    try {
      await CacheManager.set(key, JSON.stringify(data), ttl);
      logger.debug(`缓存搜索结果: ${key}`);
      return true;
    } catch (error) {
      logger.error(`缓存搜索结果失败:`, error);
      return false;
    }
  }

  /**
   * 获取搜索结果缓存
   */
  static async getSearchResult(keyword, type) {
    const key = `${this.PREFIX.SEARCH}:${type}:${keyword}`;
    try {
      const cached = await CacheManager.get(key);
      if (cached) {
        logger.debug(`搜索结果缓存命中: ${key}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error(`获取搜索结果缓存失败:`, error);
      return null;
    }
  }

  // ==================== 通用方法 ====================

  /**
   * 缓存穿透保护
   * 缓存空结果，防止频繁查询不存在的数据
   */
  static async cacheNullValue(key, ttl = 60) {
    try {
      await CacheManager.set(key, 'null', ttl);
      logger.debug(`缓存空值: ${key}`);
      return true;
    } catch (error) {
      logger.error(`缓存空值失败:`, error);
      return false;
    }
  }

  /**
   * 检查是否为空值缓存
   */
  static async isNullValue(key) {
    try {
      const value = await CacheManager.get(key);
      return value === 'null';
    } catch (error) {
      return false;
    }
  }

  /**
   * 批量删除缓存
   */
  static async deleteBatch(keys) {
    try {
      if (keys.length === 0) return true;
      await CacheManager.del(...keys);
      logger.info(`批量删除缓存`, { count: keys.length });
      return true;
    } catch (error) {
      logger.error(`批量删除缓存失败:`, error);
      return false;
    }
  }

  /**
   * 清除所有缓存（谨慎使用）
   */
  static async flushAll() {
    try {
      await CacheManager.flushAll();
      logger.warn(`清除所有缓存`);
      return true;
    } catch (error) {
      logger.error(`清除所有缓存失败:`, error);
      return false;
    }
  }
}

module.exports = CacheService;

