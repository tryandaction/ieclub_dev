// ieclub-backend/src/core/services.js
// 服务注册和初始化

const container = require('./Container');
const logger = require('../utils/logger');

// 注册核心服务
function registerServices() {
  // 注册数据库服务
  container.instance('prisma', require('../config/database'));

  // 注册Redis服务
  container.singleton('redis', () => {
    const { getRedis } = require('../utils/redis');
    return getRedis();
  });

  // 注册缓存服务
  container.singleton('cacheService', () => {
    return require('../services/cacheService');
  });

  // 注册日志服务
  container.instance('logger', logger);

  // 注册邮件服务
  container.singleton('emailService', () => {
    return require('../services/emailService');
  });

  // 注册短信服务
  container.singleton('smsService', () => {
    return require('../services/smsService');
  });

  // 注册搜索服务
  container.singleton('searchService', () => {
    return require('../services/searchService');
  });

  // 注册WebSocket服务
  container.singleton('websocketService', () => {
    return require('../services/websocketService');
  });

  logger.info('✅ 核心服务注册完成');
}

// 初始化服务
async function initializeServices() {
  try {
    const services = container.getRegisteredServices();
    
    for (const serviceName of services) {
      try {
        const service = container.resolve(serviceName);
        
        // 如果服务有initialize方法，调用它
        if (service && typeof service.initialize === 'function') {
          await service.initialize();
        }
      } catch (error) {
        logger.warn(`服务 ${serviceName} 初始化失败:`, error.message);
      }
    }

    logger.info('✅ 服务初始化完成');
  } catch (error) {
    logger.error('❌ 服务初始化失败:', error);
    throw error;
  }
}

module.exports = {
  registerServices,
  initializeServices,
  container
};

