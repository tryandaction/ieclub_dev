# 📋 IEClub 代码改进实施计划

**制定日期**: 2025-11-01  
**预计完成**: 2025-11-08 (第一阶段)  
**负责人**: 开发团队

---

## 🎯 改进目标

### 核心目标
1. **安全性**: 修复所有严重安全漏洞
2. **稳定性**: 提升系统可靠性到 99.9%
3. **性能**: 优化响应时间到 200ms 以内
4. **代码质量**: 提升可维护性评分到 8/10
5. **测试覆盖**: 提升到 60% 以上

---

## 📅 Phase 1: 关键修复 (本周 - 第1-3天)

### Day 1: 配置和环境 ✅

#### 1.1 创建环境变量模板
**优先级**: 🔴 Critical  
**预计时间**: 30分钟

```bash
# 创建 .env.example
touch ieclub-backend/.env.example
```

**内容**:
```env
# 应用配置
NODE_ENV=development
PORT=3000
API_VERSION=v1

# 数据库配置
DATABASE_URL="mysql://user:password@localhost:3306/ieclub"

# JWT 配置 (必须设置)
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=30d

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 微信小程序配置
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret

# OSS 配置 (可选)
OSS_REGION=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_ENDPOINT=
OSS_CDN_DOMAIN=

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# 安全配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 日志配置
LOG_LEVEL=info
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Sentry (可选)
SENTRY_DSN=
```

#### 1.2 添加启动检查脚本
**优先级**: 🔴 Critical  
**预计时间**: 1小时

创建 `ieclub-backend/src/utils/startupCheck.js`:
```javascript
// 检查必需的环境变量
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

function validateStartup() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    missing.forEach(v => console.error(`  - ${v}`));
    console.error('\n请检查 .env 文件或参考 .env.example');
    process.exit(1);
  }
  
  // 验证 JWT_SECRET 长度
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET 长度不足 32 字符');
    process.exit(1);
  }
  
  console.log('✅ 环境变量验证通过');
}

module.exports = { validateStartup };
```

在 `server.js` 中添加:
```javascript
const { validateStartup } = require('./utils/startupCheck');

// 在启动前检查
validateStartup();
```

#### 1.3 配置数据库连接池
**优先级**: 🔴 Critical  
**预计时间**: 30分钟

更新 `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  
  // 连接池配置
  relationMode = "prisma"
}
```

在 `.env` 中配置:
```env
DATABASE_URL="mysql://user:password@localhost:3306/ieclub?connection_limit=10&pool_timeout=20"
```

创建 `src/config/database.js` (如果不存在):
```javascript
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
  });
} else {
  // 开发环境启用查询日志
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });
}

// 处理连接错误
prisma.$connect()
  .then(() => {
    console.log('✅ 数据库连接成功');
  })
  .catch((error) => {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
```

---

### Day 2: 安全性修复 🔒

#### 2.1 增强文件上传安全
**优先级**: 🔴 Critical  
**预计时间**: 2小时

更新 `src/middleware/upload.js`:
```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const fileType = require('file-type');

// 文件类型白名单
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword'];

// 检查文件真实类型
async function validateFileType(buffer, allowedTypes) {
  const type = await fileType.fromBuffer(buffer);
  
  if (!type) {
    throw new Error('无法识别文件类型');
  }
  
  if (!allowedTypes.includes(type.mime)) {
    throw new Error(`不允许的文件类型: ${type.mime}`);
  }
  
  return type;
}

// 生成安全的文件名
function generateSafeFilename(originalName) {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

// 文件大小限制
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 检查扩展名
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.doc', '.docx'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`不允许的文件扩展名: ${ext}`), false);
  }
  
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型存储到不同目录
    const isImage = file.mimetype.startsWith('image/');
    const dest = isImage ? 'uploads/images' : 'uploads/documents';
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, generateSafeFilename(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多 5 个文件
  }
});

// 图片处理中间件
const processImage = async (req, res, next) => {
  if (!req.file) return next();
  
  try {
    const buffer = await fs.readFile(req.file.path);
    
    // 验证真实文件类型
    await validateFileType(buffer, ALLOWED_IMAGE_TYPES);
    
    // 压缩图片
    await sharp(buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(req.file.path + '.processed');
    
    // 替换原文件
    await fs.rename(req.file.path + '.processed', req.file.path);
    
    next();
  } catch (error) {
    // 删除上传的文件
    await fs.unlink(req.file.path).catch(() => {});
    next(error);
  }
};

module.exports = {
  upload,
  processImage
};
```

#### 2.2 优化错误处理
**优先级**: 🟠 High  
**预计时间**: 1.5小时

更新 `src/middleware/errorHandler.js`:
```javascript
const logger = require('../utils/logger');
const response = require('../utils/response');

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录错误
  logger.error('请求错误:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    userId: req.user?.id,
    ip: req.ip
  });

  // Prisma 错误处理
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, 'Token 无效');
  }

  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, 'Token 已过期');
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return response.badRequest(res, err.message);
  }

  // Multer 错误
  if (err.name === 'MulterError') {
    return handleMulterError(err, res);
  }

  // 业务错误
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.statusCode,
      message: err.message
    });
  }

  // 默认错误 - 不暴露详细信息
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : '服务器内部错误';
    
  return response.serverError(res, message);
};

// Prisma 错误处理
function handlePrismaError(err, res) {
  const code = err.code;
  
  switch (code) {
    case 'P2002':
      return response.conflict(res, '数据已存在');
    case 'P2025':
      return response.notFound(res, '数据不存在');
    case 'P2003':
      return response.badRequest(res, '关联数据不存在');
    case 'P2014':
      return response.badRequest(res, '数据冲突');
    default:
      logger.error('未处理的 Prisma 错误:', { code, message: err.message });
      return response.serverError(res, '数据库操作失败');
  }
}

// Multer 错误处理
function handleMulterError(err, res) {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return response.badRequest(res, '文件大小超过限制');
    case 'LIMIT_FILE_COUNT':
      return response.badRequest(res, '文件数量超过限制');
    case 'LIMIT_UNEXPECTED_FILE':
      return response.badRequest(res, '上传了意外的文件');
    default:
      return response.badRequest(res, '文件上传失败');
  }
}

// 404 处理
const notFoundHandler = (req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  response.notFound(res, `接口不存在: ${req.method} ${req.url}`);
};

module.exports = {
  errorHandler,
  notFoundHandler
};
```

#### 2.3 添加请求日志审计
**优先级**: 🟠 High  
**预计时间**: 1小时

创建 `src/middleware/auditLog.js` (增强版):
```javascript
const logger = require('../utils/logger');

// 敏感字段列表
const SENSITIVE_FIELDS = [
  'password',
  'passwordConfirm',
  'oldPassword',
  'newPassword',
  'token',
  'refreshToken',
  'secret',
  'apiKey'
];

// 过滤敏感信息
function sanitizeData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '***FILTERED***';
    }
  }
  
  return sanitized;
}

// 审计日志中间件
const auditLog = (req, res, next) => {
  const startTime = Date.now();
  
  // 保存原始的 res.json
  const originalJson = res.json.bind(res);
  
  // 覆盖 res.json
  res.json = function(body) {
    const duration = Date.now() - startTime;
    
    // 记录审计日志
    logger.info('API 请求', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      params: sanitizeData(req.params),
      query: sanitizeData(req.query),
      body: sanitizeData(req.body),
      // 不记录响应体（太大）
    });
    
    // 调用原始方法
    return originalJson(body);
  };
  
  next();
};

module.exports = { auditLog };
```

---

### Day 3: Redis 和 Prisma 优化 ⚡

#### 3.1 实现 Redis 重连机制
**优先级**: 🟠 High  
**预计时间**: 1.5小时

更新 `src/utils/redis.js`:
```javascript
const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;

function createRedisClient() {
  const client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis 重连中... 第 ${times} 次尝试，${delay}ms 后重试`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    autoRerun: true,
    lazyConnect: false,
    keepAlive: 30000,
    connectionName: 'ieclub-backend',
  });

  // 连接成功
  client.on('connect', () => {
    logger.info('✅ Redis 连接成功');
    isConnected = true;
  });

  // 连接就绪
  client.on('ready', () => {
    logger.info('✅ Redis 就绪');
  });

  // 连接错误
  client.on('error', (err) => {
    logger.error('❌ Redis 错误:', err);
    isConnected = false;
  });

  // 重新连接
  client.on('reconnecting', (delay) => {
    logger.warn(`🔄 Redis 重新连接中... (${delay}ms)`);
  });

  // 连接关闭
  client.on('end', () => {
    logger.warn('⚠️ Redis 连接已关闭');
    isConnected = false;
  });

  return client;
}

// 获取 Redis 实例（单例模式）
function getRedis() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// 检查连接状态
function isRedisConnected() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

// 安全的 Redis 操作包装器
async function safeRedisOperation(operation, fallback = null) {
  if (!isRedisConnected()) {
    logger.warn('⚠️ Redis 未连接，跳过缓存操作');
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    logger.error('Redis 操作失败:', error);
    return fallback;
  }
}

// 缓存辅助函数
async function cacheGet(key) {
  return safeRedisOperation(
    async () => {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    },
    null
  );
}

async function cacheSet(key, value, ttl = 300) {
  return safeRedisOperation(
    async () => {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    },
    false
  );
}

async function cacheDel(key) {
  return safeRedisOperation(
    async () => {
      await redisClient.del(key);
      return true;
    },
    false
  );
}

// 批量删除缓存（支持模式匹配）
async function cacheDelPattern(pattern) {
  return safeRedisOperation(
    async () => {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return keys.length;
    },
    0
  );
}

module.exports = {
  getRedis,
  isRedisConnected,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  safeRedisOperation
};
```

#### 3.2 优化 Prisma 使用
**优先级**: 🟠 High  
**预计时间**: 2小时

确保 `src/config/database.js` 使用单例:
```javascript
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// 全局单例
const globalForPrisma = global;

// 创建 Prisma 客户端
const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'],
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });

  // 中间件：查询性能监控
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // 记录慢查询
    if (duration > 1000) {
      logger.warn('慢查询检测', {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`
      });
    }

    return result;
  });

  return prisma;
};

// 使用全局单例（避免热重载时创建多个实例）
const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 测试连接
prisma.$connect()
  .then(() => {
    logger.info('✅ Prisma 连接成功');
  })
  .catch((error) => {
    logger.error('❌ Prisma 连接失败:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('🔌 Prisma 连接已关闭');
});

module.exports = prisma;
```

在所有 controller 中统一使用:
```javascript
// ✅ 正确
const prisma = require('../config/database');

// ❌ 错误 - 不要这样做
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

---

## 📅 Phase 2: 前端优化 (第4-5天)

### Day 4: 用户体验改进 🎨

#### 4.1 添加密码强度验证
**优先级**: 🟠 High  
**预计时间**: 2小时

创建 `ieclub-web/src/utils/passwordValidator.js`:
```javascript
/**
 * 密码强度验证
 */
export function validatePasswordStrength(password) {
  const errors = [];
  const suggestions = [];
  
  // 长度检查
  if (password.length < 8) {
    errors.push('密码至少需要 8 个字符');
  }
  
  // 包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母');
  }
  
  // 包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母');
  }
  
  // 包含数字
  if (!/[0-9]/.test(password)) {
    errors.push('密码需要包含数字');
  }
  
  // 包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码需要包含特殊字符');
  }
  
  // 计算强度分数
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
  
  // 判断强度等级
  let strength = 'weak';
  if (score >= 80) strength = 'strong';
  else if (score >= 60) strength = 'medium';
  
  // 生成建议
  if (errors.length === 0 && password.length < 12) {
    suggestions.push('建议使用 12 位以上的密码更安全');
  }
  
  return {
    valid: errors.length === 0,
    strength,
    score,
    errors,
    suggestions
  };
}

/**
 * 密码强度颜色
 */
export function getStrengthColor(strength) {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * 密码强度文本
 */
export function getStrengthText(strength) {
  switch (strength) {
    case 'weak':
      return '弱';
    case 'medium':
      return '中等';
    case 'strong':
      return '强';
    default:
      return '未知';
  }
}
```

创建密码强度组件 `ieclub-web/src/components/PasswordStrengthIndicator.jsx`:
```javascript
import { useMemo } from 'react';
import { validatePasswordStrength, getStrengthColor, getStrengthText } from '../utils/passwordValidator';

export default function PasswordStrengthIndicator({ password }) {
  const validation = useMemo(() => {
    if (!password) return null;
    return validatePasswordStrength(password);
  }, [password]);

  if (!password || !validation) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* 强度指示器 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              validation.strength === 'weak' ? 'bg-red-500' :
              validation.strength === 'medium' ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getStrengthColor(validation.strength)}`}>
          {getStrengthText(validation.strength)}
        </span>
      </div>

      {/* 错误提示 */}
      {validation.errors.length > 0 && (
        <ul className="text-sm text-red-500 space-y-1">
          {validation.errors.map((error, index) => (
            <li key={index} className="flex items-center gap-1">
              <span>✗</span>
              <span>{error}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 建议 */}
      {validation.valid && validation.suggestions.length > 0 && (
        <ul className="text-sm text-gray-500 space-y-1">
          {validation.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-center gap-1">
              <span>💡</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

在注册页面使用:
```javascript
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

// 在表单中
<div>
  <input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <PasswordStrengthIndicator password={password} />
</div>
```

#### 4.2 实现请求取消机制
**优先级**: 🟠 High  
**预计时间**: 1.5小时

更新 `ieclub-web/src/utils/request.js` 添加取消功能:
```javascript
// 请求取消管理器
const pendingRequests = new Map();

// 生成请求 key
function generateRequestKey(config) {
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&');
}

// 添加取消 token
function addCancelToken(config) {
  const requestKey = generateRequestKey(config);
  
  // 取消之前的相同请求
  if (pendingRequests.has(requestKey)) {
    const cancel = pendingRequests.get(requestKey);
    cancel('取消重复请求');
  }
  
  // 添加新的取消 token
  config.cancelToken = new axios.CancelToken((cancel) => {
    pendingRequests.set(requestKey, cancel);
  });
  
  return config;
}

// 移除取消 token
function removeCancelToken(config) {
  const requestKey = generateRequestKey(config);
  pendingRequests.delete(requestKey);
}

// 在请求拦截器中添加
request.interceptors.request.use(
  config => {
    // 添加取消 token（除非明确设置 cancelDuplicate: false）
    if (config.cancelDuplicate !== false) {
      addCancelToken(config);
    }
    
    // ... 其他逻辑
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 在响应拦截器中移除
request.interceptors.response.use(
  response => {
    removeCancelToken(response.config);
    // ... 其他逻辑
    return response;
  },
  error => {
    if (error.config) {
      removeCancelToken(error.config);
    }
    
    // 处理取消请求
    if (axios.isCancel(error)) {
      console.log('请求已取消:', error.message);
      return Promise.reject({ cancelled: true, message: error.message });
    }
    
    // ... 其他错误处理
  }
);

// 导出取消所有请求的函数
export function cancelAllRequests() {
  pendingRequests.forEach((cancel, key) => {
    cancel('路由切换，取消所有请求');
  });
  pendingRequests.clear();
}
```

在路由切换时自动取消请求:
```javascript
// src/App.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cancelAllRequests } from './utils/request';

function App() {
  const location = useLocation();
  
  useEffect(() => {
    // 路由切换时取消所有请求
    return () => {
      cancelAllRequests();
    };
  }, [location.pathname]);
  
  // ... 其他代码
}
```

---

### Day 5: 性能优化 🚀

#### 5.1 实现代码分割
**优先级**: 🟡 Medium  
**预计时间**: 2小时

更新 `ieclub-web/src/App.jsx`:
```javascript
import { lazy, Suspense } from 'react';
import Loading from './components/Loading';

// 懒加载页面组件
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Plaza = lazy(() => import('./pages/Plaza'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const Search = lazy(() => import('./pages/Search'));
const Community = lazy(() => import('./pages/Community'));
const Activities = lazy(() => import('./pages/Activities'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));
const Publish = lazy(() => import('./pages/Publish'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Feedback = lazy(() => import('./pages/Feedback'));
const MyFeedback = lazy(() => import('./pages/MyFeedback'));

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ToastContainer />
        <Suspense fallback={<Loading show text="加载中..." fullscreen />}>
          <Routes>
            {/* ... 路由配置 */}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}
```

更新 `vite.config.js`:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库单独打包
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'utils': [
            './src/utils/request.js',
            './src/utils/toast.js',
            './src/utils/logger.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

#### 5.2 实现图片懒加载
**优先级**: 🟡 Medium  
**预计时间**: 1.5小时

创建 `ieclub-web/src/components/LazyImage.jsx`:
```javascript
import { useState, useEffect, useRef } from 'react';

export default function LazyImage({ 
  src, 
  alt, 
  placeholder = '/placeholder.png',
  className = '',
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  useEffect(() => {
    // 使用 Intersection Observer 检测图片是否进入视口
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 图片进入视口，开始加载
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            
            img.onerror = () => {
              setImageSrc(placeholder);
              setIsLoading(false);
            };
            
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'animate-pulse' : ''}`}
      {...props}
    />
  );
}
```

---

## 📅 Phase 3: 性能和缓存 (第6-7天)

### Day 6: 后端性能优化

#### 6.1 优化 N+1 查询
**优先级**: 🟡 Medium  
**预计时间**: 3小时

示例：优化话题列表查询
```javascript
// ❌ 错误 - N+1 查询
async function getTopics() {
  const topics = await prisma.topic.findMany();
  
  for (const topic of topics) {
    // 每个话题都会查询一次作者
    topic.author = await prisma.user.findUnique({
      where: { id: topic.authorId }
    });
  }
  
  return topics;
}

// ✅ 正确 - 使用 include
async function getTopics() {
  return await prisma.topic.findMany({
    include: {
      author: {
        select: {
          id: true,
          nickname: true,
          avatar: true
        }
      }
    }
  });
}
```

#### 6.2 实现缓存策略
**优先级**: 🟡 Medium  
**预计时间**: 4小时

创建缓存中间件 `src/middleware/cache.js` (增强版):
```javascript
const { cacheGet, cacheSet, cacheDel } = require('../utils/redis');
const logger = require('../utils/logger');

/**
 * 缓存中间件
 * @param {string} keyPrefix - 缓存 key 前缀
 * @param {number} ttl - 缓存时间（秒）
 * @param {function} keyGenerator - 自定义 key 生成函数
 */
function cacheMiddleware(keyPrefix, ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // 生成缓存 key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : generateCacheKey(keyPrefix, req);

      // 尝试从缓存获取
      const cachedData = await cacheGet(cacheKey);

      if (cachedData) {
        logger.debug('缓存命中:', cacheKey);
        return res.json({
          success: true,
          data: cachedData,
          cached: true
        });
      }

      // 缓存未命中，继续处理请求
      logger.debug('缓存未命中:', cacheKey);

      // 覆盖 res.json 以缓存响应
      const originalJson = res.json.bind(res);
      res.json = function(body) {
        // 只缓存成功的响应
        if (body.success) {
          cacheSet(cacheKey, body.data, ttl).catch(err => {
            logger.error('缓存设置失败:', err);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('缓存中间件错误:', error);
      next(); // 缓存失败不影响正常流程
    }
  };
}

/**
 * 生成缓存 key
 */
function generateCacheKey(prefix, req) {
  const userId = req.user?.id || 'guest';
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  
  return `${prefix}:${userId}:${req.url}:${query}:${params}`;
}

/**
 * 清除缓存
 */
async function clearCache(pattern) {
  try {
    await cacheDel(pattern);
    logger.info('缓存已清除:', pattern);
  } catch (error) {
    logger.error('清除缓存失败:', error);
  }
}

module.exports = {
  cacheMiddleware,
  clearCache
};
```

使用示例:
```javascript
const { cacheMiddleware } = require('../middleware/cache');

// 在路由中使用
router.get('/topics', 
  cacheMiddleware('topics', 300), // 缓存 5 分钟
  topicController.getTopics
);

router.get('/topic/:id',
  cacheMiddleware('topic', 600, (req) => `topic:${req.params.id}`),
  topicController.getTopicById
);
```

---

## 📊 进度跟踪

### 完成度检查表

#### Phase 1: 关键修复 (Day 1-3)
- [ ] 创建 .env.example
- [ ] 添加启动检查
- [ ] 配置数据库连接池
- [ ] 增强文件上传安全
- [ ] 优化错误处理
- [ ] 添加审计日志
- [ ] 实现 Redis 重连
- [ ] 优化 Prisma 使用

#### Phase 2: 前端优化 (Day 4-5)
- [ ] 密码强度验证
- [ ] 请求取消机制
- [ ] 代码分割
- [ ] 图片懒加载

#### Phase 3: 性能优化 (Day 6-7)
- [ ] 优化 N+1 查询
- [ ] 实现缓存策略

---

## 🎯 下一阶段预告

### Phase 4: 测试覆盖 (Week 2)
1. 添加单元测试
2. 添加集成测试
3. 设置 CI/CD

### Phase 5: 高级优化 (Week 3-4)
1. 引入 TypeScript
2. 实现微前端
3. 添加监控告警
4. 性能深度优化

---

**注意事项**:
1. 每个改动都要测试
2. 提交代码前运行测试
3. 更新相关文档
4. Code Review 后再合并

**联系方式**:
- 遇到问题随时在团队群里讨论
- 关键决策需要团队投票

---

**最后更新**: 2025-11-01
**下次更新**: 每日进度回顾

