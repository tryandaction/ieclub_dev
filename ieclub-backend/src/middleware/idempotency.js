// src/middleware/idempotency.js
// 幂等性保证中间件

const { CacheManager } = require('../utils/redis');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * 幂等性中间件
 * 防止重复提交，确保相同请求只执行一次
 * 
 * 使用方法:
 * 1. 客户端在请求头中添加 Idempotency-Key (UUID)
 * 2. 服务器检查该 Key 是否已处理
 * 3. 如果已处理，返回缓存的响应
 * 4. 如果未处理，执行请求并缓存响应
 * 
 * @param {Object} options - 配置选项
 * @param {number} options.ttl - 缓存时间（秒），默认 86400 (24小时)
 * @param {boolean} options.required - 是否必须提供 Idempotency-Key，默认 false
 * @param {Array<string>} options.methods - 需要幂等性保证的 HTTP 方法，默认 ['POST', 'PUT', 'PATCH']
 * @returns {Function} Express 中间件
 */
const idempotencyMiddleware = (options = {}) => {
  const {
    ttl = 86400,  // 24小时
    required = false,
    methods = ['POST', 'PUT', 'PATCH']
  } = options;

  return async (req, res, next) => {
    // 只对指定的 HTTP 方法应用幂等性检查
    if (!methods.includes(req.method)) {
      return next();
    }

    // 获取幂等性键
    const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

    // 如果没有提供幂等性键
    if (!idempotencyKey) {
      if (required) {
        return next(AppError.BadRequest('缺少 Idempotency-Key 请求头'));
      }
      return next();
    }

    // 验证幂等性键格式（应该是 UUID）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      return next(AppError.BadRequest('Idempotency-Key 格式无效（应为 UUID）'));
    }

    // 构建缓存键
    const cacheKey = `idempotency:${req.user?.id || 'anonymous'}:${idempotencyKey}`;

    try {
      // 检查是否已处理过该请求
      const cachedResponse = await CacheManager.get(cacheKey);

      if (cachedResponse) {
        logger.info(`幂等性检查: 返回缓存响应`, { 
          key: idempotencyKey, 
          userId: req.user?.id 
        });

        // 返回缓存的响应
        const response = JSON.parse(cachedResponse);
        return res.status(response.statusCode || 200).json(response.body);
      }

      // 标记请求正在处理中（防止并发重复请求）
      const processingKey = `${cacheKey}:processing`;
      const isProcessing = await CacheManager.get(processingKey);

      if (isProcessing) {
        logger.warn(`幂等性检查: 请求正在处理中`, { 
          key: idempotencyKey, 
          userId: req.user?.id 
        });
        return next(AppError.TooManyRequests('请求正在处理中，请勿重复提交'));
      }

      // 设置处理中标记（30秒过期）
      await CacheManager.set(processingKey, '1', 30);

      // 劫持 res.json 方法，缓存响应
      const originalJson = res.json.bind(res);
      res.json = function(body) {
        // 缓存响应（只缓存成功的响应）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            statusCode: res.statusCode,
            body
          };

          CacheManager.set(cacheKey, JSON.stringify(responseToCache), ttl)
            .then(() => {
              logger.info(`幂等性缓存: 已缓存响应`, { 
                key: idempotencyKey, 
                userId: req.user?.id,
                ttl 
              });
            })
            .catch(err => {
              logger.error(`幂等性缓存失败:`, err);
            })
            .finally(() => {
              // 删除处理中标记
              CacheManager.del(processingKey).catch(() => {});
            });
        } else {
          // 失败的请求也要删除处理中标记
          CacheManager.del(processingKey).catch(() => {});
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error(`幂等性检查异常:`, error);
      // 幂等性检查失败不应该阻塞请求
      next();
    }
  };
};

/**
 * 清除幂等性缓存
 * 
 * @param {string} idempotencyKey - 幂等性键
 * @param {string} userId - 用户ID（可选）
 * @returns {Promise<boolean>} 是否清除成功
 */
const clearIdempotencyCache = async (idempotencyKey, userId = 'anonymous') => {
  try {
    const cacheKey = `idempotency:${userId}:${idempotencyKey}`;
    await CacheManager.del(cacheKey);
    logger.info(`清除幂等性缓存:`, { key: idempotencyKey, userId });
    return true;
  } catch (error) {
    logger.error(`清除幂等性缓存失败:`, error);
    return false;
  }
};

module.exports = {
  idempotencyMiddleware,
  clearIdempotencyCache
};

