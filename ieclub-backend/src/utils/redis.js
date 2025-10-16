// src/utils/redis.js
// Redis 工具类

const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

// 创建 Redis 客户端
let redis = null;

/**
 * 初始化 Redis 连接
 */
function initRedis() {
  if (redis) {
    return redis;
  }

  try {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis 连接成功');
    });

    redis.on('error', (error) => {
      logger.error('Redis 连接错误:', error);
    });

    return redis;
  } catch (error) {
    logger.error('Redis 初始化失败:', error);
    throw error;
  }
}

/**
 * 获取 Redis 客户端实例
 */
function getRedis() {
  if (!redis) {
    return initRedis();
  }
  return redis;
}

/**
 * 缓存管理器类
 */
class CacheManager {
  constructor() {
    this.redis = getRedis();
  }

  /**
   * 生成缓存键
   */
  static makeKey(...parts) {
    return `ieclub:${parts.join(':')}`;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   */
  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET 错误:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET 错误:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Redis DEL 错误:', error);
    }
  }

  /**
   * 删除匹配的缓存
   * @param {string} pattern - 模式
   */
  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      logger.error('Redis DEL 模式错误:', error);
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   */
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS 错误:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 过期时间（秒）
   */
  async expire(key, ttl) {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error('Redis EXPIRE 错误:', error);
    }
  }

  /**
   * 获取剩余过期时间
   * @param {string} key - 缓存键
   */
  async ttl(key) {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Redis TTL 错误:', error);
      return -1;
    }
  }
}

// 创建全局缓存管理器实例
const cacheManager = new CacheManager();

module.exports = {
  getRedis,
  CacheManager,
  cacheManager: cacheManager,
};