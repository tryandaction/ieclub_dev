// src/utils/redis-enhanced.js
// Redis 增强工具类 - 带有重连机制和更好的错误处理

const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * 创建 Redis 客户端
 */
function createRedisClient() {
  const client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    
    // 重连策略
    retryStrategy: (times) => {
      reconnectAttempts = times;
      
      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Redis 重连失败，已尝试 ${times} 次`);
        return null; // 停止重连
      }
      
      // 指数退避策略：50ms, 100ms, 200ms, 400ms, ...
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis 重连中... 第 ${times} 次尝试，${delay}ms 后重试`);
      return delay;
    },
    
    // 连接配置
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    autoRerun: true,
    lazyConnect: false,
    keepAlive: 30000,
    connectTimeout: 10000,
    connectionName: 'ieclub-backend',
    
    // 命令超时
    commandTimeout: 5000,
    
    // 断线重连
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // 当 Redis 从节点变为主节点时重连
        return true;
      }
      return false;
    }
  });

  // 连接成功事件
  client.on('connect', () => {
    reconnectAttempts = 0;
    logger.info('✅ Redis 连接成功');
    isConnected = true;
  });

  // 连接就绪事件
  client.on('ready', () => {
    logger.info('✅ Redis 就绪');
    isConnected = true;
  });

  // 连接错误事件
  client.on('error', (err) => {
    logger.error('❌ Redis 错误:', {
      message: err.message,
      code: err.code,
      syscall: err.syscall
    });
    isConnected = false;
  });

  // 重新连接事件
  client.on('reconnecting', (delay) => {
    logger.warn(`🔄 Redis 重新连接中... (延迟 ${delay}ms, 第 ${reconnectAttempts} 次尝试)`);
    isConnected = false;
  });

  // 连接关闭事件
  client.on('end', () => {
    logger.warn('⚠️  Redis 连接已关闭');
    isConnected = false;
  });

  // 连接超时事件
  client.on('timeout', () => {
    logger.warn('⚠️  Redis 连接超时');
  });

  return client;
}

/**
 * 获取 Redis 实例（单例模式）
 */
function getRedis() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * 检查 Redis 连接状态
 */
function isRedisConnected() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

/**
 * 安全的 Redis 操作包装器
 * 如果 Redis 未连接，返回 fallback 值而不抛出错误
 */
async function safeRedisOperation(operation, fallback = null) {
  if (!isRedisConnected()) {
    logger.warn('⚠️  Redis 未连接，跳过操作');
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    logger.error('Redis 操作失败:', {
      message: error.message,
      stack: error.stack
    });
    return fallback;
  }
}

/**
 * 获取缓存（安全）
 */
async function cacheGet(key) {
  return safeRedisOperation(
    async () => {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    },
    null
  );
}

/**
 * 设置缓存（安全）
 */
async function cacheSet(key, value, ttl = 300) {
  return safeRedisOperation(
    async () => {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    },
    false
  );
}

/**
 * 删除缓存（安全）
 */
async function cacheDel(key) {
  return safeRedisOperation(
    async () => {
      await redisClient.del(key);
      return true;
    },
    false
  );
}

/**
 * 批量删除缓存（支持模式匹配）
 */
async function cacheDelPattern(pattern) {
  return safeRedisOperation(
    async () => {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`清除缓存: ${keys.length} 个 key (${pattern})`);
      }
      return keys.length;
    },
    0
  );
}

/**
 * 检查缓存是否存在
 */
async function cacheExists(key) {
  return safeRedisOperation(
    async () => {
      const result = await redisClient.exists(key);
      return result === 1;
    },
    false
  );
}

/**
 * 获取缓存剩余时间
 */
async function cacheTTL(key) {
  return safeRedisOperation(
    async () => {
      return await redisClient.ttl(key);
    },
    -1
  );
}

/**
 * 增加计数器
 */
async function cacheIncr(key, ttl = null) {
  return safeRedisOperation(
    async () => {
      const value = await redisClient.incr(key);
      if (ttl && value === 1) {
        // 第一次设置时才设置过期时间
        await redisClient.expire(key, ttl);
      }
      return value;
    },
    0
  );
}

/**
 * 减少计数器
 */
async function cacheDecr(key) {
  return safeRedisOperation(
    async () => {
      return await redisClient.decr(key);
    },
    0
  );
}

/**
 * 哈希表操作
 */
const cacheHash = {
  // 设置哈希字段
  set: async (key, field, value) => {
    return safeRedisOperation(
      async () => {
        await redisClient.hset(key, field, JSON.stringify(value));
        return true;
      },
      false
    );
  },

  // 获取哈希字段
  get: async (key, field) => {
    return safeRedisOperation(
      async () => {
        const data = await redisClient.hget(key, field);
        return data ? JSON.parse(data) : null;
      },
      null
    );
  },

  // 获取所有哈希字段
  getAll: async (key) => {
    return safeRedisOperation(
      async () => {
        const data = await redisClient.hgetall(key);
        const result = {};
        for (const [field, value] of Object.entries(data)) {
          try {
            result[field] = JSON.parse(value);
          } catch {
            result[field] = value;
          }
        }
        return result;
      },
      {}
    );
  },

  // 删除哈希字段
  del: async (key, field) => {
    return safeRedisOperation(
      async () => {
        await redisClient.hdel(key, field);
        return true;
      },
      false
    );
  }
};

/**
 * 列表操作
 */
const cacheList = {
  // 左侧推入
  lpush: async (key, ...values) => {
    return safeRedisOperation(
      async () => {
        const serialized = values.map(v => JSON.stringify(v));
        return await redisClient.lpush(key, ...serialized);
      },
      0
    );
  },

  // 右侧推入
  rpush: async (key, ...values) => {
    return safeRedisOperation(
      async () => {
        const serialized = values.map(v => JSON.stringify(v));
        return await redisClient.rpush(key, ...serialized);
      },
      0
    );
  },

  // 获取范围
  range: async (key, start = 0, end = -1) => {
    return safeRedisOperation(
      async () => {
        const data = await redisClient.lrange(key, start, end);
        return data.map(item => JSON.parse(item));
      },
      []
    );
  },

  // 获取长度
  length: async (key) => {
    return safeRedisOperation(
      async () => {
        return await redisClient.llen(key);
      },
      0
    );
  }
};

/**
 * 集合操作
 */
const setOperations = {
  // 添加成员
  add: async (key, ...members) => {
    return safeRedisOperation(
      async () => {
        const serialized = members.map(m => JSON.stringify(m));
        return await redisClient.sadd(key, ...serialized);
      },
      0
    );
  },

  // 获取所有成员
  members: async (key) => {
    return safeRedisOperation(
      async () => {
        const data = await redisClient.smembers(key);
        return data.map(item => JSON.parse(item));
      },
      []
    );
  },

  // 检查成员是否存在
  isMember: async (key, member) => {
    return safeRedisOperation(
      async () => {
        const result = await redisClient.sismember(key, JSON.stringify(member));
        return result === 1;
      },
      false
    );
  }
};

/**
 * 有序集合操作
 */
const cacheSortedSet = {
  // 添加成员
  add: async (key, score, member) => {
    return safeRedisOperation(
      async () => {
        return await redisClient.zadd(key, score, JSON.stringify(member));
      },
      0
    );
  },

  // 获取范围（按分数）
  rangeByScore: async (key, min, max, withScores = false) => {
    return safeRedisOperation(
      async () => {
        const args = [key, min, max];
        if (withScores) args.push('WITHSCORES');
        
        const data = await redisClient.zrangebyscore(...args);
        
        if (withScores) {
          const result = [];
          for (let i = 0; i < data.length; i += 2) {
            result.push({
              member: JSON.parse(data[i]),
              score: parseFloat(data[i + 1])
            });
          }
          return result;
        }
        
        return data.map(item => JSON.parse(item));
      },
      []
    );
  }
};

/**
 * 缓存管理器类（增强版）
 */
class CacheManager {
  constructor() {
    this.redis = getRedis();
    this.prefix = 'ieclub';
  }

  /**
   * 生成缓存键
   */
  makeKey(...parts) {
    return `${this.prefix}:${parts.join(':')}`;
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = null) {
    return cacheSet(this.makeKey(key), value, ttl);
  }

  /**
   * 获取缓存
   */
  async get(key) {
    return cacheGet(this.makeKey(key));
  }

  /**
   * 删除缓存
   */
  async del(key) {
    return cacheDel(this.makeKey(key));
  }

  /**
   * 清除前缀的所有缓存
   */
  async clearAll() {
    return cacheDelPattern(`${this.prefix}:*`);
  }
}

// 创建全局缓存管理器实例
const cacheManager = new CacheManager();

// 优雅关闭
process.on('SIGTERM', async () => {
  if (redisClient) {
    logger.info('关闭 Redis 连接...');
    await redisClient.quit();
    logger.info('Redis 连接已关闭');
  }
});

module.exports = {
  getRedis,
  isRedisConnected,
  safeRedisOperation,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  cacheExists,
  cacheTTL,
  cacheIncr,
  cacheDecr,
  cacheHash,
  cacheList,
  setOperations,
  cacheSortedSet,
  CacheManager,
  cacheManager
};

