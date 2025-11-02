// src/utils/startupCheck.js
// 应用启动前的环境检查

const logger = require('./logger');

/**
 * 必需的环境变量列表
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PORT'
];

/**
 * 推荐的环境变量列表
 */
const RECOMMENDED_ENV_VARS = [
  'REDIS_HOST',
  'REDIS_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'WECHAT_APPID',
  'WECHAT_SECRET'
];

/**
 * 验证启动环境
 */
function validateStartup() {
  logger.info('🔍 开始环境检查...');
  
  const errors = [];
  const warnings = [];
  
  // 检查必需的环境变量
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`缺少必需的环境变量: ${envVar}`);
    }
  }
  
  // 检查推荐的环境变量
  for (const envVar of RECOMMENDED_ENV_VARS) {
    if (!process.env[envVar]) {
      warnings.push(`缺少推荐的环境变量: ${envVar} (某些功能可能不可用)`);
    }
  }
  
  // JWT_SECRET 长度检查
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET 长度不足 32 字符，存在安全风险');
  }
  
  // JWT_REFRESH_SECRET 长度检查
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET 长度不足 32 字符，存在安全风险');
  }
  
  // JWT_SECRET 和 JWT_REFRESH_SECRET 不应相同
  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      errors.push('JWT_SECRET 和 JWT_REFRESH_SECRET 不应相同');
    }
  }
  
  // 检查 DATABASE_URL 格式
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('mysql://') && 
        !process.env.DATABASE_URL.startsWith('postgresql://')) {
      warnings.push('DATABASE_URL 格式可能不正确');
    }
  }
  
  // 检查端口号
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`PORT 值无效: ${process.env.PORT}`);
    }
  }
  
  // 生产环境额外检查
  if (process.env.NODE_ENV === 'production') {
    // 生产环境必须配置 Redis
    if (!process.env.REDIS_HOST) {
      errors.push('生产环境必须配置 Redis');
    }
    
    // 生产环境不应使用默认密钥
    const defaultSecrets = [
      'your-secret-key',
      'change-this',
      'secret',
      '123456'
    ];
    
    if (process.env.JWT_SECRET) {
      const lowerSecret = process.env.JWT_SECRET.toLowerCase();
      for (const defaultSecret of defaultSecrets) {
        if (lowerSecret.includes(defaultSecret)) {
          errors.push('生产环境不应使用默认或简单的 JWT_SECRET');
          break;
        }
      }
    }
    
    // 检查 CORS 配置
    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push('生产环境建议配置 ALLOWED_ORIGINS 限制跨域访问');
    }
  }
  
  // 输出检查结果
  if (errors.length > 0) {
    logger.error('❌ 环境检查失败:');
    errors.forEach(error => {
      logger.error(`   - ${error}`);
    });
    logger.error('\n请检查 .env 文件配置，或参考 .env.example 模板');
    logger.error('提示: 如果缺少 .env 文件，请复制 .env.example 并重命名为 .env\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    logger.warn('⚠️  环境检查警告:');
    warnings.forEach(warning => {
      logger.warn(`   - ${warning}`);
    });
    logger.warn('');
  }
  
  logger.info('✅ 环境检查通过');
  
  // 打印配置摘要
  printConfigSummary();
}

/**
 * 打印配置摘要
 */
function printConfigSummary() {
  logger.info('📋 配置摘要:');
  logger.info(`   - 环境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   - 端口: ${process.env.PORT || 3000}`);
  logger.info(`   - 数据库: ${maskConnectionString(process.env.DATABASE_URL)}`);
  logger.info(`   - Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  logger.info(`   - JWT 过期: ${process.env.JWT_EXPIRES_IN || '7d'}`);
  
  // 可选功能
  const optionalFeatures = [];
  if (process.env.EMAIL_USER) optionalFeatures.push('邮件服务');
  if (process.env.WECHAT_APPID) optionalFeatures.push('微信小程序');
  if (process.env.OSS_BUCKET) optionalFeatures.push('OSS 存储');
  if (process.env.SENTRY_DSN) optionalFeatures.push('Sentry 监控');
  
  if (optionalFeatures.length > 0) {
    logger.info(`   - 可选功能: ${optionalFeatures.join(', ')}`);
  }
  
  logger.info('');
}

/**
 * 掩码敏感信息（用于日志）
 */
function maskConnectionString(url) {
  if (!url) return 'Not configured';
  
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString().replace(/\?.+/, '?***');
  } catch {
    return 'Invalid URL';
  }
}

/**
 * 检查数据库连接
 */
async function checkDatabaseConnection() {
  logger.info('🔍 检查数据库连接...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    logger.info('✅ 数据库连接正常');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    logger.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

/**
 * 检查 Redis 连接
 */
async function checkRedisConnection() {
  logger.info('🔍 检查 Redis 连接...');
  
  try {
    const { getRedis } = require('./redis');
    const redis = getRedis();
    
    await redis.ping();
    logger.info('✅ Redis 连接正常');
    return true;
  } catch (error) {
    logger.warn('⚠️  Redis 连接失败:', error.message);
    logger.warn('   某些功能（缓存、会话）可能不可用');
    return false;
  }
}

/**
 * 完整的启动检查
 */
async function fullStartupCheck() {
  try {
    // 1. 环境变量检查
    validateStartup();
    
    // 2. 数据库连接检查
    const dbOk = await checkDatabaseConnection();
    if (!dbOk) {
      logger.error('数据库连接失败，应用无法启动');
      process.exit(1);
    }
    
    // 3. Redis 连接检查（可选）
    await checkRedisConnection();
    
    logger.info('🚀 所有启动检查完成\n');
  } catch (error) {
    logger.error('启动检查失败:', error);
    process.exit(1);
  }
}

module.exports = {
  validateStartup,
  checkDatabaseConnection,
  checkRedisConnection,
  fullStartupCheck
};

