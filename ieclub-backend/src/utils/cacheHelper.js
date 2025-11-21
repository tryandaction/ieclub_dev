/**
 * 缓存辅助工具
 * 减少重复的缓存操作代码
 */

const CacheManager = require('../config/cache');
const logger = require('./logger');

/**
 * 带缓存的数据获取
 * @param {string} key - 缓存键
 * @param {number} ttl - 过期时间（秒）
 * @param {Function} fetchFn - 数据获取函数
 * @returns {Promise<any>} 数据
 */
async function withCache(key, ttl, fetchFn) {
  try {
    // 尝试从缓存获取
    const cached = await CacheManager.get(key);
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`);
      try {
        return JSON.parse(cached);
      } catch {
        return cached;
      }
    }
    
    logger.debug(`Cache miss: ${key}`);
    
    // 缓存未命中，执行数据获取函数
    const data = await fetchFn();
    
    // 存入缓存
    if (data !== null && data !== undefined) {
      await CacheManager.set(key, JSON.stringify(data), ttl);
    }
    
    return data;
  } catch (error) {
    logger.error('Cache operation error:', { key, error: error.message });
    // 缓存错误不应影响业务，直接执行数据获取
    return await fetchFn();
  }
}

/**
 * 批量删除缓存（支持模式匹配）
 * @param {string} pattern - 缓存键模式
 */
async function deletePattern(pattern) {
  try {
    const keys = await CacheManager.keys(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => CacheManager.del(key)));
      logger.debug(`Deleted cache pattern: ${pattern}, count: ${keys.length}`);
    }
  } catch (error) {
    logger.error('Delete cache pattern error:', { pattern, error: error.message });
  }
}

/**
 * 缓存装饰器（用于类方法）
 * @param {string} keyPrefix - 缓存键前缀
 * @param {number} ttl - 过期时间（秒）
 * @param {Function} keyGenerator - 键生成函数
 */
function cacheDecorator(keyPrefix, ttl, keyGenerator = null) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = keyGenerator 
        ? `${keyPrefix}:${keyGenerator(...args)}`
        : `${keyPrefix}:${JSON.stringify(args)}`;
        
      return await withCache(cacheKey, ttl, () => originalMethod.apply(this, args));
    };
    
    return descriptor;
  };
}

/**
 * 构建缓存键
 * @param {string} prefix - 前缀
 * @param {...any} parts - 键的各部分
 * @returns {string} 缓存键
 */
function buildKey(prefix, ...parts) {
  return `${prefix}:${parts.filter(p => p !== null && p !== undefined).join(':')}`;
}

module.exports = {
  withCache,
  deletePattern,
  cacheDecorator,
  buildKey
};
