// src/config/index.js
// 统一的配置管理中心

require('dotenv').config();

module.exports = {
  // 基础配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET,
  },

  // OSS 配置
  oss: {
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    endpoint: process.env.OSS_ENDPOINT,
    cdnDomain: process.env.OSS_CDN_DOMAIN,
  },

  // 邮件配置
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS, // 兼容 EMAIL_PASS 和 EMAIL_PASSWORD
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS, // 允许的邮箱域名（逗号分隔），留空表示不限制
  },

  // 文件上传限制
  upload: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024, // 5MB
    maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE) || 20 * 1024 * 1024, // 20MB
    maxVideoSize: parseInt(process.env.MAX_VIDEO_SIZE) || 100 * 1024 * 1024, // 100MB
    allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
    allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,application/msword').split(','),
  },

  // CORS 配置
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000,https://ieclub.online').split(','),
    credentials: true,
  },

  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Sentry 配置
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : process.env.NODE_ENV === 'staging' ? 'info' : 'debug'),
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
  },

  // 推送配置
  push: {
    enabled: process.env.PUSH_ENABLED === 'true',
    batchSize: parseInt(process.env.PUSH_BATCH_SIZE) || 100,
    retryTimes: parseInt(process.env.PUSH_RETRY_TIMES) || 3,
  },

  // 缓存配置
  cache: {
    ttl: {
      short: parseInt(process.env.CACHE_TTL_SHORT) || 300, // 5分钟
      medium: parseInt(process.env.CACHE_TTL_MEDIUM) || 3600, // 1小时
      long: parseInt(process.env.CACHE_TTL_LONG) || 86400, // 1天
    },
  },

  // 业务配置
  business: {
    // 话题配置
    topic: {
      titleMinLength: parseInt(process.env.TOPIC_TITLE_MIN_LENGTH) || 5,
      titleMaxLength: parseInt(process.env.TOPIC_TITLE_MAX_LENGTH) || 100,
      contentMinLength: parseInt(process.env.TOPIC_CONTENT_MIN_LENGTH) || 10,
      contentMaxLength: parseInt(process.env.TOPIC_CONTENT_MAX_LENGTH) || 10000,
      maxImages: parseInt(process.env.TOPIC_MAX_IMAGES) || 9,
      maxDocuments: parseInt(process.env.TOPIC_MAX_DOCUMENTS) || 3,
      maxTags: parseInt(process.env.TOPIC_MAX_TAGS) || 5,
    },

    // 评论配置
    comment: {
      minLength: parseInt(process.env.COMMENT_MIN_LENGTH) || 1,
      maxLength: parseInt(process.env.COMMENT_MAX_LENGTH) || 1000,
      maxImages: parseInt(process.env.COMMENT_MAX_IMAGES) || 3,
    },

    // 积分配置
    credits: {
      topicCreate: parseInt(process.env.CREDITS_TOPIC_CREATE) || 10,
      commentCreate: parseInt(process.env.CREDITS_COMMENT_CREATE) || 2,
      likeReceived: parseInt(process.env.CREDITS_LIKE_RECEIVED) || 1,
      dailyLogin: parseInt(process.env.CREDITS_DAILY_LOGIN) || 5,
    },

    // 推荐配置
    recommend: {
      topicsCount: parseInt(process.env.RECOMMEND_TOPICS_COUNT) || 20,
      refreshInterval: parseInt(process.env.RECOMMEND_REFRESH_INTERVAL) || 3600,
    },

    // 热度算法配置
    hotScore: {
      gravity: parseFloat(process.env.HOT_SCORE_GRAVITY) || 1.8,
      viewWeight: parseFloat(process.env.HOT_SCORE_VIEW_WEIGHT) || 1,
      likeWeight: parseFloat(process.env.HOT_SCORE_LIKE_WEIGHT) || 2,
      commentWeight: parseFloat(process.env.HOT_SCORE_COMMENT_WEIGHT) || 3,
      bookmarkWeight: parseFloat(process.env.HOT_SCORE_BOOKMARK_WEIGHT) || 2,
    },

    // 供需匹配配置
    match: {
      skillsWeight: parseFloat(process.env.MATCH_SCORE_SKILLS_WEIGHT) || 0.5,
      interestsWeight: parseFloat(process.env.MATCH_SCORE_INTERESTS_WEIGHT) || 0.3,
      locationWeight: parseFloat(process.env.MATCH_SCORE_LOCATION_WEIGHT) || 0.2,
      minScore: parseFloat(process.env.MATCH_MIN_SCORE) || 0.6,
    },
  },
};