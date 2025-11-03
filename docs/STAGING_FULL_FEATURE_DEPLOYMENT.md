# 测试环境完整功能部署指南

## 📋 概述

本文档说明如何在测试环境中启用 Redis、WebSocket 和定时任务等完整功能。

## ✅ 已完成的工作

### 1. Redis 安装和配置 ✅

Redis 已成功安装并配置在测试服务器上：

- **版本**: Redis 7.0.15
- **配置**: 已优化用于生产环境
- **持久化**: RDB + AOF 双重持久化
- **内存限制**: 256MB，使用 LRU 策略

#### 验证 Redis 状态

```bash
ssh root@39.108.160.112 "systemctl status redis-server"
ssh root@39.108.160.112 "redis-cli ping"  # 应返回 PONG
```

### 2. 完整版服务器文件 ✅

已创建 `ieclub-backend/src/server-staging.js`，包含：
- ✅ Redis 连接和测试
- ✅ WebSocket 服务启动
- ✅ 定时任务调度器
- ✅ 完整的错误处理
- ✅ 优雅关闭机制

### 3. 部署脚本 ✅

**PowerShell 脚本**: `scripts/Deploy-Staging-Full.ps1`
- 自动安装 Redis
- 上传完整版服务器文件
- 配置并启动服务

**Shell 脚本**: `scripts/deploy-staging-full.sh`
- 服务器端部署脚本
- 自动化配置和启动

## 🔧 当前状态

### 运行中的版本
- **服务器文件**: `src/server-minimal.js` (简化版)
- **功能**: 仅核心 API
- **状态**: ✅ 稳定运行

### 原因
完整版 `server-staging.js` 在启动时遇到一些依赖问题，暂时使用简化版保证服务稳定性。

## 🚀 启用完整功能的步骤

### 方法一：修复依赖问题（推荐）

1. **检查缺失的依赖**
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && npm ls"
```

2. **安装可能缺失的模块**
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && npm install ioredis ws node-cron"
```

3. **检查 WebSocket 服务模块**
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && ls -la src/services/websocketService.js"
```

4. **检查定时任务模块**
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && ls -la src/jobs/scheduler.js"
```

5. **测试启动**
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && node src/server-staging.js"
```
如果成功启动（按 Ctrl+C 停止），则可以切换到 PM2：

```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && pm2 delete ieclub-backend-staging && pm2 start src/server-staging.js --name ieclub-backend-staging --time && pm2 save"
```

### 方法二：渐进式启用功能

如果完整版启动失败，可以逐步添加功能：

#### 步骤 1: 添加 Redis 支持

在 `src/server-minimal.js` 中添加：

```javascript
// 测试 Redis 连接
try {
  const { getRedis } = require('./utils/redis');
  const redis = getRedis();
  await redis.ping();
  logger.info('✅ Redis 连接成功');
} catch (error) {
  logger.warn('⚠️  Redis 连接失败，缓存功能不可用:', error.message);
}
```

#### 步骤 2: 添加 WebSocket 支持

```javascript
// 启动 WebSocket 服务
try {
  const websocketService = require('./services/websocketService');
  websocketService.start(server);
  logger.info('✅ WebSocket 服务已启动');
} catch (error) {
  logger.warn('⚠️  WebSocket 服务启动失败:', error.message);
}
```

#### 步骤 3: 添加定时任务

```javascript
// 启动定时任务调度器
try {
  const scheduler = require('./jobs/scheduler');
  scheduler.start();
  logger.info('✅ 定时任务调度器已启动');
} catch (error) {
  logger.warn('⚠️  定时任务调度器启动失败:', error.message);
}
```

### 方法三：使用 Docker 部署（长期方案）

创建完整的 Docker 环境，包含所有依赖：

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_staging_data:/data
  
  backend:
    build: ./ieclub-backend
    environment:
      - NODE_ENV=staging
      - REDIS_HOST=redis
    ports:
      - "3001:3001"
    depends_on:
      - redis

volumes:
  redis_staging_data:
```

## 📊 功能对比

### 当前简化版 (server-minimal.js)

| 功能 | 状态 | 说明 |
|------|------|------|
| HTTP API | ✅ 可用 | 所有 REST API 正常 |
| 数据库 | ✅ 可用 | MySQL 连接正常 |
| Redis | ❌ 不可用 | 未启用缓存 |
| WebSocket | ❌ 不可用 | 无实时通信 |
| 定时任务 | ❌ 不可用 | 无自动化任务 |

### 完整版 (server-staging.js)

| 功能 | 状态 | 说明 |
|------|------|------|
| HTTP API | ✅ 可用 | 所有 REST API |
| 数据库 | ✅ 可用 | MySQL 连接 |
| Redis | ✅ 可用 | 缓存、会话管理 |
| WebSocket | ✅ 可用 | 实时通信功能 |
| 定时任务 | ✅ 可用 | 自动化任务调度 |

## 🔍 测试 Redis 功能

一旦 Redis 启用，可以这样测试：

```bash
# 1. 测试 Redis 连接
ssh root@39.108.160.112 "redis-cli ping"

# 2. 在代码中测试
curl http://localhost:3001/api/test-redis

# 3. 查看 Redis 中的数据
ssh root@39.108.160.112 "redis-cli keys '*'"
```

## 📝 环境变量配置

确保 `.env.staging` 文件包含：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# WebSocket 配置（可选）
WS_PORT=3002

# 定时任务配置（可选）
CRON_ENABLED=true
```

## ⚠️ 注意事项

### 1. WebSocket 依赖

WebSocket 功能需要以下文件存在：
- `src/services/websocketService.js`
- 相关的业务逻辑处理器

如果文件不存在，需要从生产环境同步代码。

### 2. 定时任务依赖

定时任务需要：
- `src/jobs/scheduler.js`
- `src/jobs/*.js` (各种任务文件)

### 3. 数据库迁移

完整版可能需要额外的数据库表，运行：

```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && npx prisma migrate deploy"
```

## 🎯 推荐做法

### 短期（当前）
保持简化版运行，确保服务稳定性。Redis 已安装，随时可以启用。

### 中期（1-2周）
1. 同步完整的代码库到测试环境
2. 安装所有依赖
3. 测试完整版启动
4. 切换到完整版

### 长期（1-2月）
1. 使用 Docker Compose 管理所有服务
2. 实现一键部署
3. 添加自动化测试
4. 配置监控告警

## 🔄 快速切换版本

### 切换到完整版
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && pm2 delete ieclub-backend-staging && pm2 start src/server-staging.js --name ieclub-backend-staging --time && pm2 save"
```

### 切换回简化版
```bash
ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && pm2 delete ieclub-backend-staging && pm2 start src/server-minimal.js --name ieclub-backend-staging --time && pm2 save"
```

## 📞 获取帮助

如果在启用完整功能时遇到问题：

1. **查看日志**: `ssh root@39.108.160.112 "pm2 logs ieclub-backend-staging"`
2. **检查依赖**: `ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && npm ls"`
3. **验证配置**: `ssh root@39.108.160.112 "cd /var/www/ieclub-backend-staging && cat .env.staging"`

---

**最后更新**: 2025-11-03  
**状态**: Redis ✅ | WebSocket ⏳ | 定时任务 ⏳

