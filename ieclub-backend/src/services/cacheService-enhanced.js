// ieclub-backend/src/services/cacheService-enhanced.js
// 增强的缓存服务 - 支持更多缓存策略

const CacheService = require('./cacheService');
const { getRedis } = require('../utils/redis-enhanced');
const logger = require('../utils/logger');

/**
 * 缓存策略枚举
 */
const CacheStrategy = {
  // 缓存穿透保护
  NULL_OBJECT: 'null_object',
  // 缓存预热
  WARM_UP: 'warm_up',
  // 缓存降级
  FALLBACK: 'fallback',
  // 缓存更新
  UPDATE: 'update',
  // 缓存失效
  INVALIDATE: 'invalidate'
};

/**
 * 增强的缓存服务
 */
class EnhancedCacheService extends CacheService {
  /**
   * 缓存穿透保护 - 获取数据，如果不存在则调用获取函数
   * @param {string} key - 缓存键
   * @param {Function} fetchFn - 获取数据的函数
   * @param {number} ttl - 过期时间（秒）
   * @param {number} nullTtl - 空值缓存时间（秒）
   * @returns {Promise<*>} 数据
   */
  async getOrFetch(key, fetchFn, ttl = 300, nullTtl = 60) {
    try {
      // 先检查缓存
      const cached = await this.getUser(key);
      if (cached !== null) {
        // 检查是否为空值标记
        if (cached === 'null') {
          return null;
        }
        return cached;
      }

      // 缓存未命中，调用获取函数
      const data = await fetchFn();

      // 缓存结果
      if (data === null || data === undefined) {
        // 缓存空值，防止缓存穿透
        await this.cacheNullValue(key, nullTtl);
      } else {
        // 缓存实际数据
        const redis = getRedis();
        if (redis) {
          await redis.setex(key, ttl, JSON.stringify(data));
        }
      }

      return data;
    } catch (error) {
      logger.error('缓存获取失败', { key, error: error.message });
      // 发生错误时，尝试直接获取数据（降级）
      try {
        return await fetchFn();
      } catch (fetchError) {
        logger.error('数据获取失败', { key, error: fetchError.message });
        throw fetchError;
      }
    }
  }

  /**
   * 缓存预热
   * @param {Array} keys - 缓存键列表
   * @param {Function} fetchFn - 获取数据的函数
   * @param {number} ttl - 过期时间（秒）
   */
  async warmUp(keys, fetchFn, ttl = 300) {
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        try {
          const data = await fetchFn(key);
          if (data !== null && data !== undefined) {
            const redis = getRedis();
            if (redis) {
              await redis.setex(key, ttl, JSON.stringify(data));
            }
          }
          return { key, success: true };
        } catch (error) {
          logger.warn('缓存预热失败', { key, error: error.message });
          return { key, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    logger.info('缓存预热完成', {
      total: keys.length,
      success: successCount,
      failed: keys.length - successCount
    });

    return results;
  }

  /**
   * 批量获取缓存
   * @param {Array<string>} keys - 缓存键列表
   * @returns {Promise<Object>} 键值对对象
   */
  async getBatch(keys) {
    try {
      const redis = getRedis();
      if (!redis || keys.length === 0) {
        return {};
      }

      const values = await redis.mget(...keys);
      const result = {};

      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          try {
            result[keys[i]] = JSON.parse(values[i]);
          } catch {
            result[keys[i]] = values[i];
          }
        }
      }

      return result;
    } catch (error) {
      logger.error('批量获取缓存失败', { error: error.message });
      return {};
    }
  }

  /**
   * 批量设置缓存
   * @param {Object} data - 键值对对象
   * @param {number} ttl - 过期时间（秒）
   */
  async setBatch(data, ttl = 300) {
    try {
      const redis = getRedis();
      if (!redis || Object.keys(data).length === 0) {
        return false;
      }

      const pipeline = redis.pipeline();
      for (const [key, value] of Object.entries(data)) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }

      await pipeline.exec();
      logger.debug('批量设置缓存', { count: Object.keys(data).length });
      return true;
    } catch (error) {
      logger.error('批量设置缓存失败', { error: error.message });
      return false;
    }
  }

  /**
   * 缓存标签管理
   * @param {string} tag - 标签
   * @param {Array<string>} keys - 缓存键列表
   */
  async tagKeys(tag, keys) {
    try {
      const redis = getRedis();
      if (!redis) return false;

      const tagKey = `tag:${tag}`;
      await redis.sadd(tagKey, ...keys);
      logger.debug('缓存标签设置', { tag, count: keys.length });
      return true;
    } catch (error) {
      logger.error('缓存标签设置失败', { tag, error: error.message });
      return false;
    }
  }

  /**
   * 根据标签清除缓存
   * @param {string} tag - 标签
   */
  async invalidateByTag(tag) {
    try {
      const redis = getRedis();
      if (!redis) return false;

      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);

      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(tagKey);
        logger.info('根据标签清除缓存', { tag, count: keys.length });
      }

      return true;
    } catch (error) {
      logger.error('根据标签清除缓存失败', { tag, error: error.message });
      return false;
    }
  }

  /**
   * 缓存统计
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    try {
      const redis = getRedis();
      if (!redis) {
        return {
          connected: false,
          keys: 0,
          memory: null
        };
      }

      const info = await redis.info('memory');
      const keys = await redis.dbsize();

      return {
        connected: true,
        keys,
        memory: info
      };
    } catch (error) {
      logger.error('获取缓存统计失败', { error: error.message });
      return {
        connected: false,
        keys: 0,
        memory: null
      };
    }
  }
}

// 导出增强的缓存服务实例
const enhancedCacheService = new EnhancedCacheService();

module.exports = enhancedCacheService;
module.exports.CacheStrategy = CacheStrategy;

