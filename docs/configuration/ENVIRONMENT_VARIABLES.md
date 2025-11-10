# 环境变量配置说明

## 🔒 安全说明

**重要提示**：
- ✅ `.env` 文件已在 `.gitignore` 中，**不会被提交到 Git**
- ✅ 你的密码和敏感信息只会保存在本地的 `.env` 文件中
- ✅ 只有你自己能看到 `.env` 文件的内容
- ⚠️  永远不要将包含真实密码的文件提交到 Git
- ⚠️  不要将 `.env` 文件分享给他人

## 📁 文件结构

```
ieclub-backend/
├── .env.example          # 配置模板（可以提交到 Git）
├── .env                  # 实际配置文件（不会提交到 Git）
└── .gitignore            # 已包含 .env，确保不会被提交
```

## 🚀 快速开始

### 1. 创建环境变量文件

```bash
# 进入后端目录
cd ieclub-backend

# 复制模板文件
cp .env.example .env

# 编辑 .env 文件，填入你的真实配置
# Windows: notepad .env
# Linux/Mac: nano .env
```

### 2. 配置必需的环境变量

至少需要配置以下变量：

```env
# 数据库配置
DATABASE_URL="mysql://用户名:密码@主机:端口/数据库名"

# JWT 密钥（必须使用强随机密钥）
JWT_SECRET=你的JWT密钥（至少64字符）
JWT_REFRESH_SECRET=你的刷新令牌密钥（至少64字符）

# 邮件配置
EMAIL_HOST=smtp.qq.com
EMAIL_USER=your_email@qq.com
EMAIL_PASSWORD=your_email_password
```

## 📋 环境变量列表

### 基础配置

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `NODE_ENV` | 运行环境 | 否 | `development` |
| `PORT` | 服务端口 | 否 | `3000` |
| `API_VERSION` | API 版本 | 否 | `v1` |

### 数据库配置

| 变量名 | 说明 | 必需 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | ✅ | `mysql://user:pass@localhost:3306/ieclub` |

### Redis 配置

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `REDIS_HOST` | Redis 主机 | 否 | `localhost` |
| `REDIS_PORT` | Redis 端口 | 否 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | 否 | 空 |
| `REDIS_DB` | Redis 数据库编号 | 否 | `0` |

### JWT 配置

| 变量名 | 说明 | 必需 | 说明 |
|--------|------|------|------|
| `JWT_SECRET` | JWT 密钥 | ✅ | 至少 64 字符，使用强随机值 |
| `JWT_EXPIRES_IN` | Token 过期时间 | 否 | `7d` |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | ✅ | 至少 64 字符，使用强随机值 |
| `JWT_REFRESH_EXPIRES_IN` | 刷新令牌过期时间 | 否 | `30d` |

**生成强密钥的方法**：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 邮件配置

| 变量名 | 说明 | 必需 | 说明 |
|--------|------|------|------|
| `EMAIL_HOST` | SMTP 服务器 | ✅ | 如 `smtp.qq.com` |
| `EMAIL_PORT` | SMTP 端口 | 否 | `587` |
| `EMAIL_SECURE` | 是否使用 SSL | 否 | `false` |
| `EMAIL_USER` | 发件人邮箱 | ✅ | 完整邮箱地址 |
| `EMAIL_PASSWORD` | 邮箱密码/授权码 | ✅ | QQ 邮箱使用授权码 |
| `EMAIL_FROM` | 发件人显示名称 | 否 | 默认使用 `EMAIL_USER` |
| `ALLOWED_EMAIL_DOMAINS` | 允许的邮箱域名 | 否 | 逗号分隔，留空不限制 |

**详细配置说明**：请查看 [邮件服务配置指南](./EMAIL_SETUP_GUIDE.md)

### 微信小程序配置（可选）

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `WECHAT_APPID` | 微信小程序 AppID | 否 |
| `WECHAT_SECRET` | 微信小程序 Secret | 否 |

### OSS 配置（可选）

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `OSS_REGION` | OSS 区域 | 否 |
| `OSS_ACCESS_KEY_ID` | OSS Access Key ID | 否 |
| `OSS_ACCESS_KEY_SECRET` | OSS Access Key Secret | 否 |
| `OSS_BUCKET` | OSS 存储桶名称 | 否 |
| `OSS_ENDPOINT` | OSS 端点 | 否 |
| `OSS_CDN_DOMAIN` | OSS CDN 域名 | 否 |

### CORS 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CORS_ORIGIN` | 允许的源（逗号分隔） | `http://localhost:3000,https://ieclub.online` |

### 限流配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RATE_LIMIT_WINDOW_MS` | 限流时间窗口（毫秒） | `900000` (15分钟) |
| `RATE_LIMIT_MAX_REQUESTS` | 最大请求数 | `100` |

### 文件上传限制

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MAX_IMAGE_SIZE` | 最大图片大小（字节） | `5242880` (5MB) |
| `MAX_DOCUMENT_SIZE` | 最大文档大小（字节） | `20971520` (20MB) |
| `MAX_VIDEO_SIZE` | 最大视频大小（字节） | `104857600` (100MB) |
| `ALLOWED_IMAGE_TYPES` | 允许的图片类型 | `image/jpeg,image/png,image/gif,image/webp` |
| `ALLOWED_DOCUMENT_TYPES` | 允许的文档类型 | `application/pdf,application/msword` |

### 日志配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `LOG_LEVEL` | 日志级别 | `info` |
| `LOG_MAX_SIZE` | 单个日志文件最大大小 | `20m` |
| `LOG_MAX_FILES` | 保留的日志文件数量 | `14d` |

### Sentry 配置（可选）

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `SENTRY_DSN` | Sentry DSN | 否 |

### 推送配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PUSH_ENABLED` | 是否启用推送 | `true` |
| `PUSH_BATCH_SIZE` | 推送批次大小 | `100` |
| `PUSH_RETRY_TIMES` | 推送重试次数 | `3` |

### 缓存配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CACHE_TTL_SHORT` | 短期缓存 TTL（秒） | `300` (5分钟) |
| `CACHE_TTL_MEDIUM` | 中期缓存 TTL（秒） | `3600` (1小时) |
| `CACHE_TTL_LONG` | 长期缓存 TTL（秒） | `86400` (1天) |

## 🔐 安全最佳实践

### 1. 保护敏感信息

- ✅ 使用 `.env` 文件存储敏感信息
- ✅ 确保 `.env` 文件在 `.gitignore` 中
- ✅ 不要将 `.env` 文件提交到 Git
- ✅ 不要将 `.env` 文件分享给他人

### 2. 使用强密钥

- ✅ JWT 密钥至少 64 字符
- ✅ 使用随机生成的密钥
- ✅ 不同环境使用不同的密钥
- ✅ 定期更换密钥

### 3. 环境隔离

- ✅ 开发、测试、生产环境使用不同的配置
- ✅ 使用不同的数据库和 Redis
- ✅ 使用不同的 JWT 密钥

### 4. 权限控制

- ✅ 限制 `.env` 文件的访问权限
- ✅ 使用最小权限原则
- ✅ 定期审查环境变量

## 📝 配置示例

### 开发环境配置

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/ieclub_dev"
JWT_SECRET=dev_jwt_secret_at_least_64_characters_long_for_development
JWT_REFRESH_SECRET=dev_refresh_secret_at_least_64_characters_long
EMAIL_HOST=smtp.qq.com
EMAIL_USER=your_email@qq.com
EMAIL_PASSWORD=your_email_password
```

### 生产环境配置

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="mysql://user:strong_password@db_host:3306/ieclub"
JWT_SECRET=production_jwt_secret_at_least_64_characters_long_use_random
JWT_REFRESH_SECRET=production_refresh_secret_at_least_64_characters_long
EMAIL_HOST=smtp.qq.com
EMAIL_USER=your_email@qq.com
EMAIL_PASSWORD=your_email_password
```

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
# 检查环境变量
cd ieclub-backend
node -e "require('dotenv').config(); console.log('✅ 环境变量已加载')"

# 测试邮件服务
node scripts/test-email-service.js your_test_email@example.com
```

## 📚 相关文档

- [邮件服务配置指南](./EMAIL_SETUP_GUIDE.md)
- [部署指南](../deployment/Deployment_guide.md)
- [邮件服务修复报告](../debugging/EMAIL_SERVICE_FIX_COMPLETE.md)

## 🆘 需要帮助？

如果遇到问题：
1. 检查 `.env` 文件是否存在
2. 确认环境变量名称拼写正确
3. 查看后端日志：`pm2 logs ieclub-backend`
4. 运行诊断脚本：`node scripts/test-email-service.js`

