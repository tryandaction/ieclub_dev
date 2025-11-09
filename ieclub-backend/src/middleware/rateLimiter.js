// ieclub-backend/src/middleware/rateLimiter.js
// 速率限制中间件（优化版）

const { getRedis } = require('../utils/redis-enhanced');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * 速率限制配置
 */
const RATE_LIMIT_CONFIGS = {
  // 严格限制（登录、注册等敏感操作）
  strict: {
    points: 5,           // 5次请求
    duration: 60,        // 60秒内
    blockDuration: 300   // 封禁5分钟
  },
  // 中等限制（API调用）
  moderate: {
    points: 30,
    duration: 60,
    blockDuration: 60
  },
  // 宽松限制（读取操作）
  relaxed: {
    points: 100,
    duration: 60,
    blockDuration: 30
  },
  // 自定义限制
  custom: {
    points: 10,
    duration: 60,
    blockDuration: 60
  }
};

/**
 * 速率限制中间件工厂
 * @param {Object} options - 配置选项
 * @param {string} options.keyPrefix - Redis键前缀
 * @param {string} options.level - 限制级别 (strict|moderate|relaxed|custom)
 * @param {number} options.points - 自定义点数
 * @param {number} options.duration - 自定义时长（秒）
 * @param {Function} options.keyGenerator - 自定义键生成函数
 * @param {Function} options.skipCondition - 跳过条件函数
 */
function createRateLimiter(options = {}) {
  const {
    keyPrefix = 'rate_limit',
    level = 'moderate',
    points,
    duration,
    blockDuration,
    keyGenerator,
    skipCondition,
    onLimitReached
  } = options;

  // 获取配置
  const config = RATE_LIMIT_CONFIGS[level] || RATE_LIMIT_CONFIGS.moderate;
  const finalPoints = points || config.points;
  const finalDuration = duration || config.duration;
  const finalBlockDuration = blockDuration || config.blockDuration;

  return async (req, res, next) => {
    try {
      // 检查是否跳过限制
      if (skipCondition && await skipCondition(req)) {
        return next();
      }

      const redis = getRedis();
      if (!redis) {
        logger.warn('Redis未连接，跳过速率限制');
        return next();
      }

      // 生成唯一键
      const key = keyGenerator
        ? await keyGenerator(req)
        : generateDefaultKey(req, keyPrefix);

      // 检查是否被封禁
      const blockKey = `${key}:blocked`;
      const isBlocked = await redis.get(blockKey);
      
      if (isBlocked) {
        const ttl = await redis.ttl(blockKey);
        logger.warn('请求被速率限制封禁', { key, ttl });
        
        if (onLimitReached) {
          await onLimitReached(req, res, { ttl, reason: 'blocked' });
        }
        
        throw new AppError(
          `请求过于频繁，请在${ttl}秒后重试`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // 获取当前计数
      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= finalPoints) {
        // 达到限制，设置封禁
        await redis.setex(blockKey, finalBlockDuration, '1');
        
        logger.warn('触发速率限制', {
          key,
          count,
          limit: finalPoints,
          blockDuration: finalBlockDuration
        });
        
        if (onLimitReached) {
          await onLimitReached(req, res, { 
            count, 
            limit: finalPoints,
            reason: 'exceeded'
          });
        }
        
        throw new AppError(
          `请求过于频繁，已被封禁${finalBlockDuration}秒`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // 增加计数
      if (count === 0) {
        // 首次请求，设置过期时间
        await redis.setex(key, finalDuration, '1');
      } else {
        // 递增计数
        await redis.incr(key);
      }

      // 获取剩余次数和重置时间
      const remaining = finalPoints - count - 1;
      const ttl = await redis.ttl(key);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', finalPoints);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        logger.error('速率限制中间件错误:', error);
        // 发生错误时不阻止请求
        next();
      }
    }
  };
}

/**
 * 生成默认的限制键
 * @private
 */
function generateDefaultKey(req, prefix) {
  // 优先使用用户ID，其次使用IP
  const identifier = req.user?.id || req.ip || 'anonymous';
  const path = req.path.replace(/\//g, '_');
  return `${prefix}:${identifier}:${path}`;
}

/**
 * 预定义的速率限制器
 */
const rateLimiters = {
  // 认证相关（严格限制）
  auth: createRateLimiter({
    keyPrefix: 'auth',
    level: 'strict',
    keyGenerator: (req) => `auth:${req.ip}`,
    onLimitReached: async (req, res, info) => {
      logger.warn('认证速率限制触发', {
        ip: req.ip,
        path: req.path,
        ...info
      });
    }
  }),

  // API调用（中等限制）
  api: createRateLimiter({
    keyPrefix: 'api',
    level: 'moderate',
    skipCondition: (req) => {
      // 管理员跳过限制
      return req.user?.isAdmin === true;
    }
  }),

  // 搜索操作（宽松限制）
  search: createRateLimiter({
    keyPrefix: 'search',
    level: 'relaxed',
    keyGenerator: (req) => {
      const userId = req.user?.id || req.ip;
      return `search:${userId}`;
    }
  }),

  // 上传操作（严格限制）
  upload: createRateLimiter({
    keyPrefix: 'upload',
    points: 10,
    duration: 300, // 5分钟10次
    blockDuration: 600,
    keyGenerator: (req) => {
      const userId = req.user?.id || req.ip;
      return `upload:${userId}`;
    }
  }),

  // 评论/发帖（防止刷屏）
  content: createRateLimiter({
    keyPrefix: 'content',
    points: 20,
    duration: 300, // 5分钟20次
    blockDuration: 300,
    keyGenerator: (req) => `content:${req.user?.id || req.ip}`
  }),

  // 点赞/收藏（防止刷赞）
  interaction: createRateLimiter({
    keyPrefix: 'interaction',
    points: 50,
    duration: 60,
    blockDuration: 120,
    keyGenerator: (req) => `interaction:${req.user?.id || req.ip}`
  }),

  // 发送验证码（基于邮箱，更宽松的限制）
  sendVerifyCode: createRateLimiter({
    keyPrefix: 'send_verify_code',
    points: 10,        // 10次发送
    duration: 300,     // 5分钟内
    blockDuration: 300, // 封禁5分钟
    keyGenerator: (req) => {
      // 基于邮箱限流，而不是IP
      const email = req.body?.email || req.query?.email || 'unknown';
      return `send_verify_code:${email}`;
    },
    onLimitReached: async (req, res, info) => {
      logger.warn('发送验证码速率限制触发', {
        email: req.body?.email,
        ip: req.ip,
        path: req.path,
        ...info
      });
    }
  }),

  // 验证码验证（基于邮箱，允许更多尝试次数）
  verifyCode: createRateLimiter({
    keyPrefix: 'verify_code',
    points: 20,        // 20次尝试（增加尝试次数）
    duration: 300,    // 5分钟内
    blockDuration: 300,  // 封禁5分钟
    keyGenerator: (req) => {
      // 基于邮箱限流，而不是IP
      const email = req.body?.email || req.query?.email || 'unknown';
      return `verify_code:${email}`;
    },
    onLimitReached: async (req, res, info) => {
      logger.warn('验证码验证速率限制触发', {
        email: req.body?.email,
        ip: req.ip,
        path: req.path,
        ...info
      });
    }
  })
};

/**
 * 清除用户的速率限制记录
 * @param {string} userId - 用户ID
 * @param {string} prefix - 键前缀
 */
async function clearUserRateLimit(userId, prefix = '*') {
  try {
    const redis = getRedis();
    if (!redis) return;

    const pattern = `${prefix}:${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('清除用户速率限制', { userId, count: keys.length });
    }
  } catch (error) {
    logger.error('清除速率限制失败:', error);
  }
}

/**
 * 获取用户的速率限制状态
 * @param {string} userId - 用户ID
 * @param {string} prefix - 键前缀
 */
async function getUserRateLimitStatus(userId, prefix = 'api') {
  try {
    const redis = getRedis();
    if (!redis) return null;

    const pattern = `${prefix}:${userId}:*`;
    const keys = await redis.keys(pattern);
    
    const status = {};
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      status[key] = { count: parseInt(value, 10), ttl };
    }
    
    return status;
  } catch (error) {
    logger.error('获取速率限制状态失败:', error);
    return null;
  }
}

module.exports = {
  createRateLimiter,
  rateLimiters,
  clearUserRateLimit,
  getUserRateLimitStatus,
  RATE_LIMIT_CONFIGS
};

