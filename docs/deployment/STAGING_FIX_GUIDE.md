# 测试环境修复指南

**日期**: 2025-11-06  
**状态**: ✅ 修复完成  
**版本**: v1.0

---

## 📋 问题总结

测试环境存在 **7个关键问题** 导致无法正常部署和运行。详细分析见 [STAGING_ISSUES_ANALYSIS.md](./STAGING_ISSUES_ANALYSIS.md)

---

## ✅ 已修复的问题

### 1. PM2 配置文件错误
**文件**: `docs/deployment/ecosystem.staging.config.js`

**修复内容**:
- ✅ 修正启动脚本路径: `server-simple.js` → `src/server-staging.js`
- ✅ 添加环境变量文件加载: `env_file` 配置
- ✅ 增强进程管理配置: 内存限制、重启策略等
- ✅ 添加详细的配置说明和注释

```javascript
// 修复前
script: 'server-simple.js',  // ❌ 文件不存在

// 修复后
script: 'src/server-staging.js',  // ✅ 正确路径
env_file: '/root/IEclub_dev_staging/ieclub-backend/.env.staging',
```

---

### 2. 启动脚本环境变量加载
**文件**: `ieclub-backend/src/server-staging.js`

**修复内容**:
- ✅ 智能环境变量文件查找
- ✅ 支持多种文件名: `.env.staging`, `.env`, 自定义路径
- ✅ 详细的加载日志和错误提示
- ✅ 降级到系统环境变量

```javascript
// 修复前: 硬编码单一路径
require('dotenv').config({ path: '../.env.staging' });

// 修复后: 智能查找多个可能的路径
const possibleEnvFiles = [
  path.resolve(__dirname, '../.env.staging'),
  path.resolve(__dirname, '../.env'),
  process.env.ENV_FILE
].filter(Boolean);

// 循环查找第一个存在的文件
for (const envFile of possibleEnvFiles) {
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
    console.log(`✅ 已加载: ${envFile}`);
    break;
  }
}
```

---

### 3. 完整的部署脚本
**文件**: `scripts/deployment/Deploy-Staging-Complete.ps1` (新建)

**功能**:
- ✅ 本地代码打包
- ✅ SSH 上传到服务器
- ✅ 远程自动部署
- ✅ 依赖安装和数据库迁移
- ✅ PM2 进程管理
- ✅ 健康检查和验证

**使用方法**:
```powershell
# 完整部署后端
.\scripts\deployment\Deploy-Staging-Complete.ps1

# 跳过构建（使用现有文件）
.\scripts\deployment\Deploy-Staging-Complete.ps1 -SkipBuild

# 仅远程部署（不上传）
.\scripts\deployment\Deploy-Staging-Complete.ps1 -SkipUpload
```

---

### 4. Nginx 测试环境配置
**文件**: `docs/deployment/nginx-staging-addon.conf` (新建)

**功能**:
- ✅ 测试环境独立路由: `/api/staging/`
- ✅ 健康检查端点: `/health/staging`
- ✅ 上传文件访问: `/uploads/staging/`
- ✅ 环境标识响应头

**路由规则**:
```nginx
# 生产环境
https://ieclub.online/api/* → 127.0.0.1:3000

# 测试环境
https://ieclub.online/api/staging/* → 127.0.0.1:3001
```

---

### 5. 环境变量配置模板
**文件**: `ieclub-backend/.env.staging.template` (新建)

**内容**:
- ✅ 完整的环境变量列表
- ✅ 详细的配置说明
- ✅ 安全最佳实践提示
- ✅ 测试环境专用配置

**使用方法**:
```bash
# 在服务器上创建实际配置
cd /root/IEclub_dev_staging/ieclub-backend
cp .env.staging.template .env.staging
nano .env.staging  # 填入实际值
```

---

## 🚀 部署步骤

### 方案 A: 使用自动部署脚本（推荐）

```powershell
# 1. 在本地执行
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging-Complete.ps1
```

脚本会自动完成:
1. 打包后端代码
2. 上传到服务器
3. 安装依赖
4. 数据库迁移
5. 启动 PM2 服务
6. 健康检查

---

### 方案 B: 手动部署（SSH 不稳定时）

#### 步骤 1: 本地准备代码包

```powershell
# 创建临时目录
$temp = "$env:TEMP\staging-backend"
New-Item -ItemType Directory -Path $temp -Force

# 复制必要文件
cd C:\universe\GitHub_try\IEclub_dev\ieclub-backend
Copy-Item src, prisma, scripts, package.json, package-lock.json, healthcheck.js $temp -Recurse

# 创建压缩包
Compress-Archive -Path "$temp\*" -DestinationPath staging-backend.zip -Force
```

#### 步骤 2: 通过其他方式上传

- 使用 WinSCP / FileZilla
- 使用云盘中转
- 使用 VNC 直接操作

#### 步骤 3: 在服务器上部署

```bash
# SSH 登录或 VNC 连接
ssh root@ieclub.online

# 进入部署目录
cd /root/IEclub_dev_staging/ieclub-backend

# 备份当前版本
tar -czf ../backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# 解压新代码
unzip -o /path/to/staging-backend.zip

# 创建环境变量文件
cp .env.staging.template .env.staging
nano .env.staging  # 填入配置

# 安装依赖
npm install --production

# 生成 Prisma Client
npx prisma generate

# 数据库迁移
npx prisma migrate deploy

# 启动服务
pm2 delete staging-backend || true
pm2 start ecosystem.staging.config.js
pm2 save

# 查看状态
pm2 status staging-backend
pm2 logs staging-backend --lines 50
```

---

## 🔍 验证部署

### 1. 检查服务状态

```bash
# PM2 状态
pm2 status staging-backend

# 服务日志
pm2 logs staging-backend --lines 100

# 进程信息
pm2 info staging-backend
```

### 2. 健康检查

```bash
# 本地检查
curl http://localhost:3001/health

# 外网检查（需先配置 Nginx）
curl https://ieclub.online/health/staging
```

**预期响应**:
```json
{
  "status": "ok",
  "environment": "staging",
  "timestamp": "2025-11-06T...",
  "database": "connected",
  "redis": "connected"
}
```

### 3. API 测试

```bash
# 测试公开接口
curl https://ieclub.online/api/staging/test

# 测试认证接口
curl -X POST https://ieclub.online/api/staging/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📝 环境变量配置清单

### 必需配置项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 环境标识 | `staging` |
| `PORT` | 服务端口 | `3001` |
| `DATABASE_URL` | 数据库连接 | `mysql://user:pass@localhost:3306/ieclub_staging` |
| `JWT_SECRET` | JWT 密钥 | 64位随机字符串 |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 | 64位随机字符串 |

### 可选配置项

- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis 配置
- `EMAIL_*` - 邮件服务配置
- `FRONTEND_URL` - 前端地址
- `LOG_LEVEL` - 日志级别

完整配置见: `.env.staging.template`

---

## 🔧 Nginx 配置更新

### 步骤 1: 编辑 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/ieclub
```

### 步骤 2: 添加测试环境配置

在 `server` 块内添加 `nginx-staging-addon.conf` 的内容，或使用 `include` 指令:

```nginx
server {
    # ... 现有配置 ...
    
    # 包含测试环境配置
    include /root/IEclub_dev_staging/docs/deployment/nginx-staging-addon.conf;
}
```

### 步骤 3: 测试并重启

```bash
# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl reload nginx
```

---

## 🐛 常见问题解决

### 问题 1: PM2 启动失败

**症状**: `pm2 start` 报错或服务立即退出

**排查**:
```bash
# 查看详细错误日志
pm2 logs staging-backend --err --lines 100

# 检查环境变量文件
cat .env.staging

# 手动启动查看错误
node src/server-staging.js
```

**可能原因**:
- `.env.staging` 不存在或配置错误
- 数据库连接失败
- 端口 3001 被占用
- 缺少依赖包

---

### 问题 2: 数据库连接失败

**症状**: 日志显示 `Can't connect to MySQL server`

**检查**:
```bash
# 测试 MySQL 连接
mysql -h localhost -u ieclub -p ieclub_staging

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES LIKE 'ieclub_staging';"

# 创建数据库（如不存在）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ieclub_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### 问题 3: Nginx 返回 502 错误

**症状**: 访问 `/api/staging/` 返回 502 Bad Gateway

**排查**:
```bash
# 检查后端服务是否运行
pm2 status staging-backend

# 检查端口是否监听
netstat -tlnp | grep 3001

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

---

### 问题 4: SSH 连接超时

**症状**: 部署脚本执行到一半 SSH 断开

**解决方案**:
1. 使用手动部署方案（方案 B）
2. 或使用 VNC 直接操作服务器
3. 配置 SSH keep-alive:
   ```bash
   # 在本地 ~/.ssh/config 添加
   Host ieclub.online
       ServerAliveInterval 60
       ServerAliveCountMax 10
   ```

---

## 📊 部署检查清单

在部署完成后，请逐项确认：

- [ ] PM2 服务运行正常 (`pm2 status`)
- [ ] 日志没有严重错误 (`pm2 logs`)
- [ ] 健康检查接口返回正常 (`curl localhost:3001/health`)
- [ ] 数据库连接成功（日志中有确认信息）
- [ ] Redis 连接成功（如配置了 Redis）
- [ ] Nginx 配置已更新并重启
- [ ] 外网可以访问 API (`curl https://ieclub.online/api/staging/test`)
- [ ] 测试账号可以登录
- [ ] 文件上传功能正常
- [ ] 邮件发送功能正常（如配置了邮件）

---

## 📚 相关文档

- [完整问题分析](./STAGING_ISSUES_ANALYSIS.md) - 所有问题的详细分析
- [部署指南](./Deployment_guide.md) - 完整的部署文档
- [配置模板](../../ieclub-backend/.env.staging.template) - 环境变量模板

---

## 🎯 下一步

部署完成后建议：

1. **测试关键功能**
   - 用户注册 / 登录
   - 数据增删改查
   - 文件上传下载

2. **配置监控**
   ```bash
   # PM2 Web 监控
   pm2 install pm2-server-monit
   
   # 查看实时监控
   pm2 monit
   ```

3. **设置定期备份**
   ```bash
   # 数据库备份脚本
   mysqldump -u ieclub -p ieclub_staging > backup-$(date +%Y%m%d).sql
   ```

4. **文档同步**
   - 更新团队 Wiki
   - 通知相关开发人员

---

**修复完成时间**: 2025-11-06  
**预计稳定性**: ⭐⭐⭐⭐⭐  
**建议重新评估时间**: 1周后

