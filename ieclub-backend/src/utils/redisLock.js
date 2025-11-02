// src/utils/redisLock.js
// Redis 分布式锁实现

const { CacheManager } = require('./redis');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Redis 分布式锁类
 * 用于防止并发操作导致的数据不一致
 */
class RedisLock {
  /**
   * 获取锁
   * 
   * @param {string} key - 锁的键名
   * @param {number} ttl - 锁的过期时间（毫秒），默认 5000ms
   * @param {number} retryTimes - 重试次数，默认 3 次
   * @param {number} retryDelay - 重试延迟（毫秒），默认 100ms
   * @returns {Promise<Lock|null>} 锁对象或 null
   */
  static async acquire(key, ttl = 5000, retryTimes = 3, retryDelay = 100) {
    const lockKey = `lock:${key}`;
    const lockValue = uuidv4(); // 唯一标识，用于释放锁时验证
    const expireAt = Date.now() + ttl;

    for (let i = 0; i <= retryTimes; i++) {
      try {
        // 尝试获取锁（SET key value NX PX ttl）
        const acquired = await CacheManager.set(lockKey, lockValue, ttl / 1000);

        if (acquired) {
          logger.debug(`获取锁成功: ${lockKey}`);
          
          return {
            key: lockKey,
            value: lockValue,
            expireAt,
            
            /**
             * 释放锁
             * 使用 Lua 脚本确保原子性
             */
            release: async () => {
              try {
                // Lua 脚本：只有持有锁的客户端才能释放
                const script = `
                  if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                  else
                    return 0
                  end
                `;
                
                const result = await CacheManager.eval(script, [lockKey], [lockValue]);
                
                if (result === 1) {
                  logger.debug(`释放锁成功: ${lockKey}`);
                  return true;
                } else {
                  logger.warn(`释放锁失败（锁已过期或被其他客户端持有）: ${lockKey}`);
                  return false;
                }
              } catch (error) {
                logger.error(`释放锁异常: ${lockKey}`, error);
                return false;
              }
            },
            
            /**
             * 延长锁的过期时间
             * 
             * @param {number} additionalTtl - 额外的过期时间（毫秒）
             */
            extend: async (additionalTtl) => {
              try {
                // Lua 脚本：只有持有锁的客户端才能延长
                const script = `
                  if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("pexpire", KEYS[1], ARGV[2])
                  else
                    return 0
                  end
                `;
                
                const result = await CacheManager.eval(
                  script, 
                  [lockKey], 
                  [lockValue, additionalTtl]
                );
                
                if (result === 1) {
                  logger.debug(`延长锁成功: ${lockKey}, +${additionalTtl}ms`);
                  return true;
                } else {
                  logger.warn(`延长锁失败: ${lockKey}`);
                  return false;
                }
              } catch (error) {
                logger.error(`延长锁异常: ${lockKey}`, error);
                return false;
              }
            }
          };
        }

        // 获取锁失败，等待后重试
        if (i < retryTimes) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        logger.error(`获取锁异常: ${lockKey}`, error);
        
        if (i === retryTimes) {
          throw error;
        }
      }
    }

    logger.warn(`获取锁失败（已重试 ${retryTimes} 次）: ${lockKey}`);
    return null;
  }

  /**
   * 使用锁执行操作
   * 自动获取和释放锁
   * 
   * @param {string} key - 锁的键名
   * @param {Function} fn - 要执行的函数
   * @param {Object} options - 选项
   * @param {number} options.ttl - 锁的过期时间（毫秒）
   * @param {number} options.retryTimes - 重试次数
   * @param {number} options.retryDelay - 重试延迟（毫秒）
   * @returns {Promise<*>} 函数执行结果
   */
  static async withLock(key, fn, options = {}) {
    const {
      ttl = 5000,
      retryTimes = 3,
      retryDelay = 100
    } = options;

    const lock = await this.acquire(key, ttl, retryTimes, retryDelay);

    if (!lock) {
      throw new Error(`无法获取锁: ${key}`);
    }

    try {
      // 执行业务逻辑
      const result = await fn();
      return result;
    } finally {
      // 确保释放锁
      await lock.release();
    }
  }

  /**
   * 检查锁是否存在
   * 
   * @param {string} key - 锁的键名
   * @returns {Promise<boolean>} 是否存在
   */
  static async exists(key) {
    const lockKey = `lock:${key}`;
    try {
      const value = await CacheManager.get(lockKey);
      return value !== null;
    } catch (error) {
      logger.error(`检查锁异常: ${lockKey}`, error);
      return false;
    }
  }

  /**
   * 强制删除锁（谨慎使用）
   * 
   * @param {string} key - 锁的键名
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async forceRelease(key) {
    const lockKey = `lock:${key}`;
    try {
      await CacheManager.del(lockKey);
      logger.warn(`强制释放锁: ${lockKey}`);
      return true;
    } catch (error) {
      logger.error(`强制释放锁异常: ${lockKey}`, error);
      return false;
    }
  }
}

module.exports = RedisLock;

