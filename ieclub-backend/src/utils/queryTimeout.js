// ieclub-backend/src/utils/queryTimeout.js
// 数据库查询超时控制

const logger = require('./logger');

/**
 * 查询超时配置
 */
const TIMEOUT_CONFIG = {
  // 默认超时时间（毫秒）
  default: 10000, // 10秒
  
  // 不同操作类型的超时时间
  read: 5000,     // 读操作 5秒
  write: 10000,   // 写操作 10秒
  complex: 30000, // 复杂查询 30秒
  
  // 是否启用超时
  enabled: process.env.QUERY_TIMEOUT_ENABLED !== 'false'
};

/**
 * 创建带超时的 Promise
 * @param {Promise} promise - 原始 Promise
 * @param {number} timeout - 超时时间（毫秒）
 * @param {string} operationName - 操作名称
 * @returns {Promise} 带超时的 Promise
 */
function withTimeout(promise, timeout, operationName = '数据库操作') {
  if (!TIMEOUT_CONFIG.enabled) {
    return promise;
  }
  
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`${operationName}超时（${timeout}ms）`);
        error.code = 'QUERY_TIMEOUT';
        error.timeout = timeout;
        reject(error);
      }, timeout);
    })
  ]);
}

/**
 * 查询超时包装器
 * @param {Function} queryFn - 查询函数
 * @param {Object} options - 选项
 * @returns {Promise} 查询结果
 */
async function withQueryTimeout(queryFn, options = {}) {
  const {
    timeout = TIMEOUT_CONFIG.default,
    operationName = '数据库查询',
    onTimeout,
    retries = 0
  } = options;
  
  let lastError;
  
  // 重试机制
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      
      // 执行查询（带超时）
      const result = await withTimeout(
        queryFn(),
        timeout,
        operationName
      );
      
      const duration = Date.now() - startTime;
      
      // 记录慢查询
      if (duration > timeout * 0.8) {
        logger.warn('慢查询警告', {
          operationName,
          duration: `${duration}ms`,
          threshold: `${timeout}ms`,
          attempt: attempt + 1
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // 超时错误
      if (error.code === 'QUERY_TIMEOUT') {
        logger.error('查询超时', {
          operationName,
          timeout: `${timeout}ms`,
          attempt: attempt + 1,
          maxAttempts: retries + 1
        });
        
        // 调用超时回调
        if (onTimeout) {
          await onTimeout(error, attempt);
        }
        
        // 如果还有重试次数，继续重试
        if (attempt < retries) {
          logger.info('重试查询', {
            operationName,
            attempt: attempt + 2,
            maxAttempts: retries + 1
          });
          continue;
        }
      }
      
      // 其他错误直接抛出
      throw error;
    }
  }
  
  // 所有重试都失败
  throw lastError;
}

/**
 * Prisma 查询超时中间件
 * @param {Object} prisma - Prisma 客户端
 * @param {number} timeout - 超时时间
 */
function createPrismaTimeoutMiddleware(timeout = TIMEOUT_CONFIG.default) {
  return async (params, next) => {
    const startTime = Date.now();
    
    try {
      // 执行查询（带超时）
      const result = await withTimeout(
        next(params),
        timeout,
        `Prisma ${params.model}.${params.action}`
      );
      
      const duration = Date.now() - startTime;
      
      // 记录慢查询
      if (duration > timeout * 0.8) {
        logger.warn('Prisma 慢查询', {
          model: params.model,
          action: params.action,
          duration: `${duration}ms`,
          threshold: `${timeout}ms`
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.code === 'QUERY_TIMEOUT') {
        logger.error('Prisma 查询超时', {
          model: params.model,
          action: params.action,
          timeout: `${timeout}ms`,
          duration: `${duration}ms`
        });
      }
      
      throw error;
    }
  };
}

/**
 * 批量查询超时控制
 * @param {Array<Function>} queryFns - 查询函数数组
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 查询结果数组
 */
async function withBatchQueryTimeout(queryFns, options = {}) {
  const {
    timeout = TIMEOUT_CONFIG.default,
    operationName = '批量查询',
    failFast = false
  } = options;
  
  const startTime = Date.now();
  
  try {
    // 执行所有查询（带超时）
    const promises = queryFns.map((fn, index) =>
      withTimeout(
        fn(),
        timeout,
        `${operationName}[${index}]`
      )
    );
    
    // 根据 failFast 决定使用 Promise.all 还是 Promise.allSettled
    const results = failFast
      ? await Promise.all(promises)
      : await Promise.allSettled(promises);
    
    const duration = Date.now() - startTime;
    
    // 记录批量查询信息
    logger.info('批量查询完成', {
      operationName,
      count: queryFns.length,
      duration: `${duration}ms`,
      avgDuration: `${Math.round(duration / queryFns.length)}ms`
    });
    
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('批量查询失败', {
      operationName,
      count: queryFns.length,
      duration: `${duration}ms`,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * 查询性能监控装饰器
 * @param {Function} fn - 查询函数
 * @param {string} name - 函数名称
 * @returns {Function} 包装后的函数
 */
function monitorQueryPerformance(fn, name) {
  return async function(...args) {
    const startTime = Date.now();
    
    try {
      const result = await fn.apply(this, args);
      const duration = Date.now() - startTime;
      
      // 记录查询性能
      logger.debug('查询性能', {
        function: name,
        duration: `${duration}ms`,
        args: args.length
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('查询失败', {
        function: name,
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  };
}

/**
 * 获取超时配置
 * @param {string} type - 操作类型
 * @returns {number} 超时时间
 */
function getTimeout(type = 'default') {
  return TIMEOUT_CONFIG[type] || TIMEOUT_CONFIG.default;
}

/**
 * 设置超时配置
 * @param {string} type - 操作类型
 * @param {number} timeout - 超时时间
 */
function setTimeout(type, timeout) {
  TIMEOUT_CONFIG[type] = timeout;
  logger.info('更新超时配置', { type, timeout: `${timeout}ms` });
}

/**
 * 启用/禁用超时
 * @param {boolean} enabled - 是否启用
 */
function setTimeoutEnabled(enabled) {
  TIMEOUT_CONFIG.enabled = enabled;
  logger.info(`查询超时${enabled ? '已启用' : '已禁用'}`);
}

module.exports = {
  withTimeout,
  withQueryTimeout,
  withBatchQueryTimeout,
  createPrismaTimeoutMiddleware,
  monitorQueryPerformance,
  getTimeout,
  setTimeout,
  setTimeoutEnabled,
  TIMEOUT_CONFIG
};

