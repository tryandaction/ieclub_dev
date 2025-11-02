// middleware/cache.js - Redis 缓存中间件
const { CacheManager } = require('../utils/redis');
const logger = require('../utils/logger');

/**
 * Redis 缓存中间件
 * 用于缓存 API 响应，提升性能
 * 
 * @param {Object} options - 缓存配置
 * @param {number} options.ttl - 缓存过期时间（秒）
 * @param {Function} options.keyGenerator - 缓存键生成函数
 * @param {Function} options.shouldCache - 是否应该缓存的判断函数
 */
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 默认5分钟
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    shouldCache = (req, res) => req.method === 'GET' && res.statusCode === 200,
  } = options;

  return async (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      
      // 尝试从缓存获取
      const cachedData = await CacheManager.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`缓存命中: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // 缓存未命中，继续处理请求
      logger.debug(`缓存未命中: ${cacheKey}`);

      // 劫持 res.json 方法，在响应时缓存数据
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // 检查是否应该缓存
        if (shouldCache(req, res)) {
          CacheManager.set(cacheKey, JSON.stringify(data), ttl)
            .catch(err => logger.error('缓存写入失败:', err));
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('缓存中间件错误:', error);
      // 缓存失败不影响正常请求
      next();
    }
  };
}

/**
 * 话题列表缓存中间件
 * 根据查询参数生成不同的缓存键
 */
function topicListCache() {
  return cacheMiddleware({
    ttl: 180, // 3分钟
    keyGenerator: (req) => {
      const { page = 1, limit = 20, category, topicType, sortBy, tags, search } = req.query;
      const userId = req.userId || 'guest';
      return `topics:list:${userId}:${page}:${limit}:${category || 'all'}:${topicType || 'all'}:${sortBy || 'hot'}:${tags || ''}:${search || ''}`;
    },
  });
}

/**
 * 活动列表缓存中间件
 */
function activityListCache() {
  return cacheMiddleware({
    ttl: 180, // 3分钟
    keyGenerator: (req) => {
      const { page = 1, limit = 20, category, sortBy, search, status } = req.query;
      const userId = req.userId || 'guest';
      return `activities:list:${userId}:${page}:${limit}:${category || 'all'}:${sortBy || 'latest'}:${search || ''}:${status || 'upcoming'}`;
    },
  });
}

/**
 * 话题详情缓存中间件
 */
function topicDetailCache() {
  return cacheMiddleware({
    ttl: 300, // 5分钟
    keyGenerator: (req) => {
      const userId = req.userId || 'guest';
      return `topics:detail:${req.params.id}:${userId}`;
    },
  });
}

/**
 * 活动详情缓存中间件
 */
function activityDetailCache() {
  return cacheMiddleware({
    ttl: 300, // 5分钟
    keyGenerator: (req) => {
      const userId = req.userId || 'guest';
      return `activities:detail:${req.params.id}:${userId}`;
    },
  });
}

/**
 * 用户资料缓存中间件
 */
function userProfileCache() {
  return cacheMiddleware({
    ttl: 600, // 10分钟
    keyGenerator: (req) => {
      return `users:profile:${req.params.id || req.userId}`;
    },
  });
}

/**
 * 清除缓存的辅助函数
 */
async function clearCache(pattern) {
  try {
    await CacheManager.delPattern(pattern);
    logger.info(`缓存已清除: ${pattern}`);
  } catch (error) {
    logger.error('清除缓存失败:', error);
  }
}

/**
 * 清除话题相关缓存
 */
async function clearTopicCache(topicId) {
  await Promise.all([
    clearCache(`topics:list:*`),
    clearCache(`topics:detail:${topicId}:*`),
    clearCache(`topics:recommend:*`),
  ]);
}

/**
 * 清除活动相关缓存
 */
async function clearActivityCache(activityId) {
  await Promise.all([
    clearCache(`activities:list:*`),
    clearCache(`activities:detail:${activityId}:*`),
  ]);
}

/**
 * 清除用户相关缓存
 */
async function clearUserCache(userId) {
  await Promise.all([
    clearCache(`users:profile:${userId}`),
    clearCache(`users:topics:${userId}:*`),
    clearCache(`users:activities:${userId}:*`),
  ]);
}

module.exports = {
  cacheMiddleware,
  topicListCache,
  activityListCache,
  topicDetailCache,
  activityDetailCache,
  userProfileCache,
  clearCache,
  clearTopicCache,
  clearActivityCache,
  clearUserCache,
};

