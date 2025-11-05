# IEClub Deployment Guide

> **✅ DEPLOYMENT STATUS: SUCCESSFUL** (Last Updated: 2025-11-02)
> 
> **Production**: https://ieclub.online (端口 3000)
> **Staging**: https://test.ieclub.online (端口 3001)
> **Server**: 39.108.160.112  
> **PM2**: Backend running (ieclub-backend, ieclub-backend-staging)  
> **SSL**: Active (Let's Encrypt)
>
> **Recent Updates** (2025-11-02):
> - ✅ **三环境部署系统完成** - 本地开发、测试环境、生产环境
> - ✅ 自动化部署脚本 (scripts\deployment\Deploy-Staging.ps1, scripts\deployment\Deploy-Production.ps1)
> - ✅ 环境配置模板系统 (.env.staging.template, .env.production.template)
> - ✅ 修复 alertSystem.js 的 undefined.toFixed() 错误
> - ✅ 测试环境独立数据库和端口配置
> - ✅ 生产环境安全确认机制

---

## 🎯 三种部署环境

### 1️⃣ 本地开发环境 (Development) - 最常用 ⚡

**用途**: 日常开发和调试

```powershell
# 快速启动
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\QUICK_START.ps1

# 或手动启动
cd C:\universe\GitHub_try\IEclub_dev\ieclub-backend
npm run dev  # 后端: http://localhost:3000

cd C:\universe\GitHub_try\IEclub_dev\ieclub-web
npm run dev  # 前端: http://localhost:5173
```

**特点**:
- ✅ 热重载，修改即生效
- ✅ 详细的调试信息
- ✅ 使用本地数据库
- ✅ 无需部署，立即测试

---

### 2️⃣ 测试环境 (Staging) - 第2常用 🧪

**用途**: 内部测试，不影响线上用户

```powershell
# 部署全部
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试"

# 仅部署前端
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target web

# 仅部署后端
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
```

**访问地址**: https://test.ieclub.online

**配置特点**:
- 📍 后端端口: **3001**
- 📦 数据库: **ieclub_staging** (独立)
- 🔧 PM2 进程: **ieclub-backend-staging**
- 🌐 域名: **test.ieclub.online**
- ⚡ 自动从模板创建 .env 文件
- ✅ 完全独立，不影响生产环境

---

### 3️⃣ 生产环境 (Production) - 第3常用 🚀

**用途**: 正式上线，所有用户访问

```powershell
# 部署全部（需要输入 YES 确认）
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"

# 仅部署前端
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target web

# 仅部署后端
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target backend
```

**访问地址**: https://ieclub.online

**配置特点**:
- 📍 后端端口: **3000**
- 📦 数据库: **ieclub** (生产)
- 🔧 PM2 进程: **ieclub-backend**
- 🌐 域名: **ieclub.online**
- ⚠️ 需要输入 'YES' 确认
- ✅ 自动备份和验证

---

## 📌 快速部署命令

### ⚠️ 部署前必读

**在执行任何部署前，请先运行部署就绪检查**：
```powershell
.\scripts\health-check\Check-Deploy-Ready.ps1
```

这个脚本会检查：
- Git 状态（是否有未提交更改）
- 源代码新鲜度
- 构建产物时效性
- 是否存在旧的打包文件

**只有通过所有检查后才能部署！**

---

### 本地开发
```powershell
.\scripts\QUICK_START.ps1
```

### 测试环境部署
```powershell
# 1. 检查代码状态
.\scripts\health-check\Check-Deploy-Ready.ps1

# 2. 部署测试环境
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"
```

### 生产环境部署
```powershell
# 1. 检查代码状态（必须通过）
.\scripts\health-check\Check-Deploy-Ready.ps1

# 2. 部署生产环境
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"
```

### 小程序编译
```powershell
# 使用旧的 Deploy.ps1（仅用于小程序）
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy.ps1 -Target weapp
```
然后用微信开发者工具打开 `ieclub-frontend` 目录

---

## 🎯 Quick Operations Guide

### Local Development
```powershell
# Start web development server
cd ieclub-web
npm run dev
# Visit http://localhost:5173

# Start backend server
cd ieclub-backend
npm run dev
# API: http://localhost:3000/api
```

### Mini Program Development
```
1. Open WeChat DevTools
2. Import project → Select ieclub-frontend directory
3. Click compile and preview
```

---

## 📋 Deployment Script Reference

### Deploy.ps1 (Main Deployment Script)

**Syntax**:
```powershell
.\Deploy.ps1 -Target <target> [-Message <message>]
```

**Parameters**:
- `-Target`: Deployment target
  - `web`: Deploy web frontend
  - `weapp`: Build mini program
  - `backend`: Deploy backend
  - `all`: Deploy everything
- `-Message`: Optional commit message (default: "Deploy update")

**Examples**:
```powershell
# Deploy web
.\Deploy.ps1 -Target "web" -Message "Update home page"

# Build mini program
.\Deploy.ps1 -Target "weapp"

# Deploy all
.\Deploy.ps1 -Target "all" -Message "Version 2.0 release"
```

---

## 🚀 Detailed Deployment Steps

### Web Deployment

#### Local Build
```powershell
cd ieclub-web
npm run build
# Output: ieclub-web/dist/
```

#### Upload to Server
```powershell
# Method 1: Use deployment script
.\Deploy.ps1 -Target "web"

# Method 2: Manual upload
cd ieclub-web
npm run build
scp -r dist root@ieclub.online:/var/www/ieclub/web/
```

#### Verify Deployment
```
Visit: https://ieclub.online
Check: Console for errors
Test: Login and basic functions
```

### Mini Program Deployment

#### Local Build
```powershell
cd ieclub-frontend
# Native mini program, no build needed
# Files are ready to use
```

#### Upload via WeChat DevTools
```
1. Open WeChat DevTools
2. Project → Import → Select ieclub-frontend
3. Click "Upload" button
4. Enter version number and description
5. Submit for review
```

### Backend Deployment

#### Local Test
```powershell
cd ieclub-backend
npm run dev
# Visit http://localhost:3000/api/health
```

#### Deploy to Server
```powershell
# Method 1: Use deployment script
.\Deploy.ps1 -Target "backend"

# Method 2: SSH manual deployment
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend
git pull
npm install
pm2 restart ieclub-backend
```

#### Verify Backend
```bash
# Check service status
pm2 status

# Check logs
pm2 logs ieclub-backend --lines 20

# Test API Health
curl https://ieclub.online/api/health
# Expected: {"status":"ok","timestamp":"...","uptime":...}

# Test API Connectivity
curl https://ieclub.online/api/test
# Expected: {"message":"IEClub API is running","timestamp":"..."}
```

---

## 🔧 Environment Configuration

### 配置文件系统

项目使用**模板文件**管理环境配置，部署脚本会自动从模板创建 `.env` 文件。

**配置文件位置**:
```
ieclub-web/
  ├── .env.development        # 本地开发（手动创建）
  ├── env.staging.template    # 测试环境模板 ✅
  └── env.production.template # 生产环境模板 ✅

ieclub-backend/
  ├── .env                    # 本地开发（手动创建）
  ├── env.staging.template    # 测试环境模板 ✅
  └── env.production.template # 生产环境模板 ✅
```

### 1️⃣ 本地开发环境配置

**前端 (.env.development)**:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

**后端 (.env)**:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://ieclub_user:your_password@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_dev_secret_key_here
JWT_REFRESH_SECRET=your_dev_refresh_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 可选配置
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
```

### 2️⃣ 测试环境配置 (Staging)

**前端 (env.staging.template → .env.staging)**:
```env
VITE_API_BASE_URL=https://test.ieclub.online/api
VITE_APP_ENV=staging
```

**后端 (env.staging.template → .env)**:
```env
NODE_ENV=staging
PORT=3001  # ⚠️ 测试环境使用 3001 端口
DATABASE_URL=mysql://ieclub_user:PASSWORD_HERE@localhost:3306/ieclub_staging
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_THIS_IN_SERVER
JWT_REFRESH_SECRET=CHANGE_THIS_IN_SERVER
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 可选配置
EMAIL_USER=
EMAIL_PASSWORD=
WECHAT_APPID=
WECHAT_SECRET=
```

**⚠️ 首次部署后需要手动配置**:
```bash
# SSH 到服务器
ssh root@ieclub.online

# 编辑测试环境配置
cd /root/IEclub_dev_staging/ieclub-backend
nano .env

# 修改以下内容：
# - DATABASE_URL 中的密码
# - JWT_SECRET 和 JWT_REFRESH_SECRET
# - 邮箱和微信配置（如需要）
```

### 3️⃣ 生产环境配置 (Production)

**前端 (env.production.template → .env.production)**:
```env
VITE_API_BASE_URL=https://ieclub.online/api
VITE_APP_ENV=production
```

**后端 (env.production.template → .env)**:
```env
NODE_ENV=production
PORT=3000  # ⚠️ 生产环境使用 3000 端口
DATABASE_URL=mysql://ieclub_user:PASSWORD_HERE@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_THIS_IN_SERVER
JWT_REFRESH_SECRET=CHANGE_THIS_IN_SERVER
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 可选配置
EMAIL_USER=
EMAIL_PASSWORD=
WECHAT_APPID=
WECHAT_SECRET=
```

**⚠️ 首次部署后需要手动配置**:
```bash
# SSH 到服务器
ssh root@ieclub.online

# 编辑生产环境配置
cd /root/IEclub_dev/ieclub-backend
nano .env

# 修改以下内容：
# - DATABASE_URL 中的密码
# - JWT_SECRET 和 JWT_REFRESH_SECRET
# - 邮箱和微信配置（如需要）
```

### 配置说明

**关键差异**:
| 配置项 | 本地开发 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| 端口 | 3000 | **3001** | 3000 |
| 数据库 | ieclub | **ieclub_staging** | ieclub |
| PM2 进程名 | - | **ieclub-backend-staging** | ieclub-backend |
| 域名 | localhost | **test.ieclub.online** | ieclub.online |
| 自动创建 | ❌ 手动 | ✅ 自动 | ✅ 自动 |

---

## 🚀 首次部署配置

### 1. 创建测试数据库

测试环境需要独立的数据库：

```bash
# SSH 到服务器
ssh root@ieclub.online

# 登录 MySQL
mysql -u root -p

# 创建测试数据库
CREATE DATABASE ieclub_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 授权（如果需要）
GRANT ALL PRIVILEGES ON ieclub_staging.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
exit;
```

### 2. 配置 Nginx（测试环境）

创建测试环境的 Nginx 配置：

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/test.ieclub.online
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name test.ieclub.online;
    
    # 前端静态文件
    location / {
        root /var/www/test.ieclub.online;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端 API（端口 3001）
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/test.ieclub.online /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 3. 配置 SSL（可选）

为测试环境添加 SSL 证书：

```bash
# 使用 Certbot
sudo certbot --nginx -d test.ieclub.online

# 或手动配置 SSL
# 编辑 Nginx 配置，添加 SSL 相关设置
```

### 4. 创建部署目录

```bash
# 测试环境目录
sudo mkdir -p /var/www/test.ieclub.online
sudo mkdir -p /root/IEclub_dev_staging

# 设置权限
sudo chown -R root:root /var/www/test.ieclub.online
sudo chown -R root:root /root/IEclub_dev_staging
```

### 5. 首次部署

```powershell
# 在本地执行
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "首次部署测试环境"
```

### 6. 配置敏感信息

首次部署后，需要在服务器上配置敏感信息：

```bash
# 测试环境
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend
nano .env

# 修改：
# - DATABASE_URL=mysql://ieclub_user:你的密码@localhost:3306/ieclub_staging
# - JWT_SECRET=生成一个随机密钥
# - JWT_REFRESH_SECRET=生成另一个随机密钥
# - 其他敏感配置...

# 重启服务
pm2 restart ieclub-backend-staging
```

```bash
# 生产环境（如果需要）
cd /root/IEclub_dev/ieclub-backend
nano .env

# 修改相同的配置项
pm2 restart ieclub-backend
```

### 7. 验证部署

```bash
# 检查 PM2 状态
pm2 status

# 应该看到两个进程：
# - ieclub-backend (端口 3000)
# - ieclub-backend-staging (端口 3001)

# 测试测试环境
curl https://test.ieclub.online/api/health

# 测试生产环境
curl https://ieclub.online/api/health
```

---

## 🔄 推荐工作流程

```
1. 本地开发
   ↓ 功能完成，代码提交
   
2. 部署到测试环境
   ↓ scripts\deployment\Deploy-Staging.ps1
   
3. 测试环境验证
   ↓ 访问 test.ieclub.online 测试
   
4. 测试通过
   ↓ 合并到 main 分支
   
5. 部署到生产环境
   ↓ scripts\deployment\Deploy-Production.ps1 (需要输入 YES 确认)
   
6. 生产环境监控
   ↓ 访问 ieclub.online 验证
   
7. 完成 ✅
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 0. 依赖缺失错误（express-validator, express-rate-limit等）
```bash
# Symptom
Error: Cannot find module 'express-validator'
Error: Cannot find module 'express-rate-limit'

# Root Cause
服务器上的package.json版本过旧，缺少新增的依赖

# Solution - 方法1：使用部署脚本（推荐）
.\Deploy.ps1 -Target "backend"
# 此命令会自动上传最新的package.json并安装所有依赖

# Solution - 方法2：手动修复
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend

# 拉取最新代码（包括package.json）
git pull

# 安装所有依赖
npm install

# 重启服务
pm2 restart ieclub-backend

# 检查日志
pm2 logs ieclub-backend --lines 30
```

**关键依赖列表** (确保这些都在package.json中):
- `express-validator@^7.0.1` - 请求参数验证
- `express-rate-limit@^7.5.1` - API限流
- `@prisma/client@^5.8.0` - 数据库ORM
- `ioredis@^5.8.2` - Redis客户端
- `winston@^3.11.0` - 日志管理

#### 1. API 404 Not Found

**测试环境**:
```bash
# 检查状态
ssh root@ieclub.online
pm2 status  # 检查 ieclub-backend-staging 是否运行
curl http://localhost:3001/api/health  # 测试测试环境 API（端口 3001）

# 解决方案
pm2 restart ieclub-backend-staging
pm2 logs ieclub-backend-staging --lines 20

# 如果仍然失败
cd /root/IEclub_dev_staging/ieclub-backend
npm install
pm2 restart ieclub-backend-staging
```

**生产环境**:
```bash
# 检查状态
ssh root@ieclub.online
pm2 status  # 检查 ieclub-backend 是否运行
curl http://localhost:3000/api/health  # 测试生产环境 API（端口 3000）

# 解决方案
pm2 restart ieclub-backend
pm2 logs ieclub-backend --lines 20

# 如果仍然失败
cd /root/IEclub_dev/ieclub-backend
git pull
npm install
pm2 restart ieclub-backend
```

#### 2. Web Build Failed
```bash
Error: Cannot find module 'vite'
Solution: npm install
```

#### 3. Backend Start Failed
```bash
Error: Cannot connect to MySQL
Solution: Check MySQL service and connection string
```

#### 4. Mini Program Upload Failed
```
Error: WeChat DevTools not logged in
Solution: Scan QR code to login
```

#### 5. Server Connection Timeout
```bash
Error: ssh: connect to host ieclub.online port 22: Connection timed out
Solution: Check VPN or network connection
```

### Log Files

**测试环境日志**:
```bash
# PM2 日志
pm2 logs ieclub-backend-staging

# 应用日志
tail -f /root/IEclub_dev_staging/ieclub-backend/logs/combined.log
tail -f /root/IEclub_dev_staging/ieclub-backend/logs/error.log

# Nginx 日志
tail -f /var/log/nginx/access.log | grep test.ieclub.online
tail -f /var/log/nginx/error.log | grep test.ieclub.online
```

**生产环境日志**:
```bash
# PM2 日志
pm2 logs ieclub-backend

# 应用日志
tail -f /root/IEclub_dev/ieclub-backend/logs/combined.log
tail -f /root/IEclub_dev/ieclub-backend/logs/error.log

# Nginx 日志
tail -f /var/log/nginx/access.log | grep ieclub.online
tail -f /var/log/nginx/error.log | grep ieclub.online
```

**查看所有 PM2 进程**:
```bash
pm2 list
pm2 monit  # 实时监控
```

---

## 📦 Deployment Checklist

### 测试环境部署检查清单

**部署前**:
- [ ] 代码已在本地测试通过
- [ ] 代码已提交到 Git
- [ ] 测试数据库已创建（ieclub_staging）
- [ ] Nginx 配置已添加（test.ieclub.online）
- [ ] DNS 已配置（test.ieclub.online）

**部署中**:
- [ ] 运行 `.\scripts\deployment\Deploy-Staging.ps1 -Target all`
- [ ] 前端构建成功
- [ ] 后端打包成功
- [ ] 文件上传完成
- [ ] PM2 进程启动（ieclub-backend-staging）

**部署后**:
- [ ] 访问 https://test.ieclub.online 正常
- [ ] API 健康检查通过（/api/health）
- [ ] 登录功能正常
- [ ] 核心功能测试通过
- [ ] PM2 日志无错误

### 生产环境部署检查清单

**部署前**:
- [ ] 功能已在测试环境验证通过
- [ ] 代码已合并到 main 分支
- [ ] 所有更改已提交
- [ ] 数据库备份已完成
- [ ] 团队成员已通知
- [ ] 准备好回滚方案

**部署中**:
- [ ] 运行 `.\scripts\deployment\Deploy-Production.ps1 -Target all`
- [ ] 输入 'YES' 确认部署
- [ ] 前端构建成功
- [ ] 后端打包成功
- [ ] 文件上传完成
- [ ] PM2 进程重启（ieclub-backend）
- [ ] 自动验证通过

**部署后**:
- [ ] 访问 https://ieclub.online 正常
- [ ] API 健康检查通过（/api/health）
- [ ] 登录功能正常
- [ ] 核心功能正常
- [ ] 性能指标正常
- [ ] PM2 日志无错误
- [ ] 监控系统正常

---

## 🔐 Security Notes

1. **Never commit sensitive data**:
   - API keys
   - Database passwords
   - JWT secrets

2. **Use environment variables**:
   - Store in `.env` files
   - Add `.env` to `.gitignore`

3. **HTTPS only in production**:
   - SSL certificates
   - Redirect HTTP to HTTPS

4. **Regular updates**:
   - Dependencies
   - Security patches
   - System updates

---

## 🔧 故障排除 (Troubleshooting)

### 问题 1: 后端启动失败 - 缺少依赖

**症状**:
```
Error: Cannot find module 'express-validator'
Error: Cannot find module 'express-rate-limit'
```

**原因**: 
- 部署脚本在解压代码包时可能覆盖了 `package.json`
- `npm install` 在旧的 `package.json` 上执行，导致新依赖未安装

**解决方案**:
```bash
# 方法1: 手动安装缺失的依赖
ssh -p 22 root@39.108.160.112 "cd /root/IEclub_dev/ieclub-backend && npm install express-validator express-rate-limit winston --save"
pm2 restart ieclub-backend

# 方法2: 重新部署（已修复的脚本会自动处理）
.\Deploy.ps1 -Target "backend"
```

**预防措施**:
- 部署脚本已更新，现在会在解压后再次上传 `package.json`
- 服务器端脚本会验证关键依赖是否安装

### 问题 2: PM2 进程频繁重启

**检查方法**:
```bash
ssh -p 22 root@39.108.160.112 "pm2 list"
ssh -p 22 root@39.108.160.112 "pm2 logs ieclub-backend --lines 50"
```

**常见原因**:
- 依赖缺失
- 环境变量配置错误
- 数据库连接失败
- Redis 连接失败

**解决方案**:
1. 检查 `.env` 文件是否存在且配置正确
2. 验证数据库和 Redis 服务是否运行
3. 查看详细日志找出具体错误

### 问题 3: API 返回 404

**检查 Nginx 配置**:
```bash
ssh -p 22 root@39.108.160.112 "nginx -t"
ssh -p 22 root@39.108.160.112 "cat /etc/nginx/sites-available/ieclub"
```

**验证后端服务**:
```bash
ssh -p 22 root@39.108.160.112 "curl http://127.0.0.1:3000/health"
```

### 问题 4: 数据库表缺失 - "The table does not exist"

**症状**:
```
The table `login_logs` does not exist in the current database.
The table `verification_codes` does not exist in the current database.
```

**原因**: 
- 数据库迁移文件存在，但未被实际执行
- Prisma 迁移状态显示"up to date"，但表实际不存在

**解决方案**:
```bash
# 手动执行迁移 SQL
ssh -p 22 root@39.108.160.112 "cd /root/IEclub_dev/ieclub-backend && npx prisma db execute --file prisma/migrations/20251029234240_add_auth_tables/migration.sql"

# 重启服务
ssh -p 22 root@39.108.160.112 "pm2 restart ieclub-backend"

# 验证服务状态
ssh -p 22 root@39.108.160.112 "pm2 list"
```

**验证修复**:
```bash
# 测试认证 API
curl -X POST https://ieclub.online/api/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","type":"register"}'
```

### 问题 5: 网页显示旧版本

**解决方案**:
1. 清除浏览器缓存 (Ctrl+F5)
2. 检查 Nginx 是否正确重启
3. 验证文件是否正确部署到 `/root/IEclub_dev/ieclub-web/dist`

---

## 🔍 部署后检测与验证

### 一键检测脚本（推荐）

部署完成后，运行以下命令进行全面检测：

```bash
# SSH到服务器
ssh root@ieclub.online

# 下载并运行检测脚本
curl -o check-deployment.sh https://raw.githubusercontent.com/yourusername/ieclub/main/scripts/check-deployment.sh
chmod +x check-deployment.sh
./check-deployment.sh staging  # 检测测试环境
./check-deployment.sh production  # 检测生产环境
```

**检测内容**：
- ✅ PM2进程状态
- ✅ 端口监听情况
- ✅ 数据库连接
- ✅ Redis连接
- ✅ API健康检查
- ✅ 前端文件部署
- ✅ Nginx配置
- ✅ SSL证书状态
- ✅ 磁盘空间
- ✅ 内存使用

---

### 手动检测步骤（详细）

#### 1️⃣ 基础服务检测

```bash
# 连接服务器
ssh root@ieclub.online

# 检查PM2状态
pm2 status
# 应该看到：
# - ieclub-backend-staging: online, restart < 5
# - ieclub-backend: online, restart < 5

# 检查进程详情
pm2 describe ieclub-backend-staging
pm2 describe ieclub-backend

# 查看最近日志
pm2 logs ieclub-backend-staging --lines 50 --nostream
pm2 logs ieclub-backend --lines 50 --nostream
```

**正常输出**：
- Status: `online`
- Restart: 小于5次
- Uptime: 持续增加
- CPU: 0-5%
- Memory: < 200MB

**异常情况**：
- Status: `errored` / `stopped` / `launching`
- Restart: 持续增加
- 日志中有Error/Exception

#### 2️⃣ 端口和网络检测

```bash
# 检查端口监听
netstat -tulpn | grep :3000  # 生产环境
netstat -tulpn | grep :3001  # 测试环境
netstat -tulpn | grep :80    # HTTP
netstat -tulpn | grep :443   # HTTPS

# 或使用lsof
lsof -i :3000
lsof -i :3001

# 测试本地API访问
curl -v http://localhost:3000/api/health  # 生产
curl -v http://localhost:3001/api/health  # 测试

# 测试外部API访问
curl -v https://ieclub.online/api/health  # 生产
curl -v https://test.ieclub.online/api/health  # 测试
```

**正常输出**：
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production"  // 或 "staging"
}
```

**异常情况**：
- Connection refused → 服务未启动
- 404 Not Found → Nginx配置错误
- 502 Bad Gateway → 后端服务异常
- 超时 → 防火墙或网络问题

#### 3️⃣ 数据库连接检测

```bash
# 检查MySQL服务
systemctl status mysql
# 应该显示 active (running)

# 测试数据库连接
mysql -u ieclub_user -p -e "SHOW DATABASES;"
# 应该看到 ieclub 和 ieclub_staging

# 检查表结构
mysql -u ieclub_user -p ieclub -e "SHOW TABLES;"
mysql -u ieclub_user -p ieclub_staging -e "SHOW TABLES;"

# 测试Prisma连接（在后端目录）
cd /root/IEclub_dev/ieclub-backend
npx prisma db pull

cd /root/IEclub_dev_staging/ieclub-backend
npx prisma db pull
```

**正常输出**：
- MySQL服务运行正常
- 能够连接数据库
- 所有必需的表都存在

**异常情况**：
- MySQL未运行 → `systemctl start mysql`
- Access denied → 检查.env中的密码
- Table doesn't exist → 执行迁移

#### 4️⃣ Redis连接检测

```bash
# 检查Redis服务
systemctl status redis
# 应该显示 active (running)

# 测试Redis连接
redis-cli ping
# 应该返回 PONG

# 检查Redis连接数
redis-cli info clients

# 测试读写
redis-cli set test "hello"
redis-cli get test
redis-cli del test
```

**正常输出**：
- Redis服务运行正常
- PING返回PONG
- 可以正常读写

**异常情况**：
- Redis未运行 → `systemctl start redis`
- Connection refused → 检查配置
- 未安装 → `apt install redis-server`

#### 5️⃣ Nginx配置检测

```bash
# 测试Nginx配置
nginx -t
# 应该显示 syntax is ok, test is successful

# 查看Nginx状态
systemctl status nginx
# 应该显示 active (running)

# 查看配置文件
cat /etc/nginx/sites-available/ieclub
cat /etc/nginx/sites-available/test.ieclub.online

# 检查软链接
ls -la /etc/nginx/sites-enabled/

# 查看Nginx日志
tail -50 /var/log/nginx/access.log
tail -50 /var/log/nginx/error.log
```

**正常输出**：
- 配置文件语法正确
- Nginx运行正常
- 软链接存在
- 日志无明显错误

**异常情况**：
- Syntax error → 修复配置文件
- Nginx stopped → `systemctl start nginx`
- 404错误 → 检查root路径

#### 6️⃣ SSL证书检测

```bash
# 检查证书文件
ls -la /etc/letsencrypt/live/ieclub.online/
ls -la /etc/letsencrypt/live/test.ieclub.online/

# 查看证书有效期
certbot certificates

# 测试SSL连接
openssl s_client -connect ieclub.online:443 -servername ieclub.online < /dev/null
openssl s_client -connect test.ieclub.online:443 -servername test.ieclub.online < /dev/null

# 在线检测（可选）
# 浏览器访问: https://www.ssllabs.com/ssltest/
```

**正常输出**：
- 证书文件存在
- 有效期 > 30天
- SSL握手成功

**异常情况**：
- 证书不存在 → 重新申请
- 即将过期 → `certbot renew`
- SSL错误 → 检查Nginx配置

#### 7️⃣ 前端文件检测

```bash
# 检查前端文件
ls -lh /var/www/ieclub/  # 生产环境
ls -lh /var/www/test.ieclub.online/  # 测试环境

# 检查index.html
cat /var/www/ieclub/index.html | head -20
cat /var/www/test.ieclub.online/index.html | head -20

# 检查文件权限
ls -la /var/www/ieclub/
ls -la /var/www/test.ieclub.online/

# 检查文件更新时间
stat /var/www/ieclub/index.html
stat /var/www/test.ieclub.online/index.html
```

**正常输出**：
- 文件存在且完整
- 权限正确（755目录，644文件）
- 更新时间与部署时间一致

**异常情况**：
- 文件不存在 → 重新部署
- 权限错误 → `chmod -R 755 /var/www/ieclub/`
- 旧版本 → 清除缓存重新部署

#### 8️⃣ 系统资源检测

```bash
# 检查磁盘空间
df -h
# 确保 / 和 /var 分区有足够空间（至少20%空闲）

# 检查内存使用
free -h
# 确保有足够的可用内存

# 检查CPU负载
uptime
top -n 1

# 检查系统日志
journalctl -xe --no-pager | tail -50
dmesg | tail -50
```

**正常输出**：
- 磁盘空间 > 20%
- 内存使用 < 80%
- CPU负载正常（< CPU核心数）

**异常情况**：
- 磁盘满 → 清理日志和临时文件
- 内存不足 → 重启或升级服务器
- CPU过高 → 检查异常进程

#### 9️⃣ 功能测试

**API测试**：
```bash
# 健康检查
curl https://ieclub.online/api/health
curl https://test.ieclub.online/api/health

# 测试认证API
curl -X POST https://ieclub.online/api/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","type":"register"}'

# 测试活动列表API
curl https://ieclub.online/api/activities

# 测试用户API（需要token）
curl https://ieclub.online/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**前端测试**：
```bash
# 在本地浏览器访问
https://ieclub.online
https://test.ieclub.online

# 检查项：
# - 页面能正常加载
# - 样式正确显示
# - 图片能正常加载
# - API请求成功
# - 控制台无错误
```

**数据库测试**：
```bash
# 测试写入
mysql -u ieclub_user -p ieclub -e "INSERT INTO test_table VALUES (1, 'test');"

# 测试读取
mysql -u ieclub_user -p ieclub -e "SELECT * FROM users LIMIT 5;"

# 测试Redis
redis-cli set test_key "test_value"
redis-cli get test_key
```

#### 🔟 日志监控

```bash
# 实时监控PM2日志
pm2 logs

# 监控特定服务
pm2 logs ieclub-backend-staging
pm2 logs ieclub-backend

# 监控Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 监控系统日志
journalctl -f

# 监控应用日志
tail -f /root/IEclub_dev/ieclub-backend/logs/combined.log
tail -f /root/IEclub_dev/ieclub-backend/logs/error.log
tail -f /root/IEclub_dev_staging/ieclub-backend/logs/combined.log
```

---

### 快速检测命令（一键复制）

**测试环境全面检测**：
```bash
ssh root@ieclub.online << 'EOF'
echo "=== PM2状态 ==="
pm2 status
echo ""
echo "=== 端口监听 ==="
netstat -tulpn | grep -E ":(3001|80|443)"
echo ""
echo "=== 本地API ==="
curl -s http://localhost:3001/api/health | jq .
echo ""
echo "=== 外部API ==="
curl -s https://test.ieclub.online/api/health | jq .
echo ""
echo "=== 数据库 ==="
systemctl status mysql | grep Active
echo ""
echo "=== Redis ==="
redis-cli ping
echo ""
echo "=== Nginx ==="
nginx -t
echo ""
echo "=== 磁盘空间 ==="
df -h | grep -E "(Filesystem|/dev/vda)"
echo ""
echo "=== 内存 ==="
free -h
echo ""
echo "=== 最近错误 ==="
pm2 logs ieclub-backend-staging --lines 10 --nostream --err
EOF
```

**生产环境全面检测**：
```bash
ssh root@ieclub.online << 'EOF'
echo "=== PM2状态 ==="
pm2 status
echo ""
echo "=== 端口监听 ==="
netstat -tulpn | grep -E ":(3000|80|443)"
echo ""
echo "=== 本地API ==="
curl -s http://localhost:3000/api/health | jq .
echo ""
echo "=== 外部API ==="
curl -s https://ieclub.online/api/health | jq .
echo ""
echo "=== 数据库 ==="
systemctl status mysql | grep Active
echo ""
echo "=== Redis ==="
redis-cli ping
echo ""
echo "=== Nginx ==="
nginx -t
echo ""
echo "=== 磁盘空间 ==="
df -h | grep -E "(Filesystem|/dev/vda)"
echo ""
echo "=== 内存 ==="
free -h
echo ""
echo "=== 最近错误 ==="
pm2 logs ieclub-backend --lines 10 --nostream --err
EOF
```

---

### 检测结果判断标准

#### ✅ 部署成功标准

**必须满足**：
- [ ] PM2进程status为`online`
- [ ] 重启次数 < 5
- [ ] API健康检查返回`{"status":"ok"}`
- [ ] 前端页面能正常访问
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] Nginx配置测试通过
- [ ] 无明显错误日志

**可选检查**：
- [ ] SSL证书有效
- [ ] 磁盘空间充足（> 20%）
- [ ] 内存使用正常（< 80%）
- [ ] CPU负载正常
- [ ] 日志无警告

#### ⚠️ 需要关注

- PM2重启次数 5-20次 → 可能有间歇性错误
- 内存使用 > 80% → 考虑优化或升级
- 磁盘空间 < 20% → 清理日志和临时文件
- SSL证书 < 30天 → 计划更新

#### ❌ 部署失败标准

**立即修复**：
- PM2进程status为`errored`或`stopped`
- 重启次数 > 50次
- API返回502/503/504
- 前端页面无法访问
- 数据库或Redis连接失败
- Nginx配置测试失败
- 持续的错误日志

---

### 常见问题快速诊断

#### 问题：服务疯狂重启

**诊断**：
```bash
pm2 status  # 查看restart次数
pm2 logs ieclub-backend-staging --lines 100 --nostream  # 查看错误
```

**可能原因**：
1. 端口被占用 → 检查端口
2. 数据库连接失败 → 检查MySQL
3. 依赖缺失 → `npm install`
4. 环境变量错误 → 检查.env
5. 内存不足 → 检查系统资源

#### 问题：API返回502

**诊断**：
```bash
curl http://localhost:3001/api/health  # 测试本地
pm2 status  # 检查服务状态
nginx -t  # 测试Nginx配置
```

**可能原因**：
1. 后端服务未启动
2. Nginx配置错误
3. 端口号不匹配
4. 防火墙阻止

#### 问题：前端显示旧版本

**诊断**：
```bash
ls -lht /var/www/test.ieclub.online/ | head -10  # 检查文件时间
cat /var/www/test.ieclub.online/index.html | grep -i "version\|timestamp"
```

**解决方案**：
1. 清除浏览器缓存（Ctrl+F5）
2. 检查Nginx缓存配置
3. 确认文件已正确部署
4. 检查CDN缓存（如果有）

#### 问题：数据库表不存在

**诊断**：
```bash
cd /root/IEclub_dev_staging/ieclub-backend
mysql -u ieclub_user -p ieclub_staging -e "SHOW TABLES;"
npx prisma migrate status
```

**解决方案**：
```bash
npx prisma generate
npx prisma migrate deploy
# 或
npx prisma db push
```

---

## 🧪 功能测试

### 创建测试用户

在新部署的环境中，需要先创建测试用户才能测试登录功能：

```bash
# 方法1: 直接上传到后端目录运行 (推荐)
scp scripts/health-check/create-test-user-simple.js root@ieclub.online:/root/IEclub_dev/ieclub-backend/
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node create-test-user-simple.js'

# 方法2: 使用原始脚本
cd scripts/health-check
scp create-test-user.js root@ieclub.online:/root/IEclub_dev/ieclub-backend/
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node create-test-user.js'
```

**输出示例**：
```
=== 创建测试用户 ===
Email: admin@sustech.edu.cn
Nickname: Admin

✅ 用户创建成功:
{
  id: 'cmhlqzbcd000087r20tlbclpz',
  email: 'admin@sustech.edu.cn',
  nickname: 'Admin',
  status: 'active'
}

您现在可以使用以下凭据登录:
Email: admin@sustech.edu.cn
Password: Test123456
```

### 测试登录功能

创建测试用户后，可以测试登录API：

```bash
# 方法1: 使用测试脚本
cd scripts/health-check
chmod +x test-login.sh

# 测试生产环境
scp test-login.sh root@ieclub.online:/tmp/
ssh root@ieclub.online 'bash /tmp/test-login.sh'

# 方法2: 直接curl测试
ssh root@ieclub.online 'curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@sustech.edu.cn\",\"password\":\"Test123456\"}"'
```

**成功响应示例**：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cmhlqzbcd000087r20tlbclpz",
      "email": "admin@sustech.edu.cn",
      "nickname": "Admin",
      "avatar": "",
      "level": 1,
      "isCertified": false
    }
  }
}
```

### 测试其他API端点

**健康检查**：
```bash
curl http://localhost:3000/health
# 应返回: {"status":"ok","timestamp":"...","environment":"production","uptime":...}
```

**获取用户信息**（需要token）：
```bash
TOKEN="your_jwt_token_here"
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**发送验证码**：
```bash
curl -X POST http://localhost:3000/api/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@sustech.edu.cn","type":"register"}'
```

### 注意事项

⚠️ **重要**: 在通过SSH执行curl命令时，必须注意：

1. **Content-Type必须设置**: 必须包含 `-H "Content-Type: application/json"`，否则后端无法解析JSON body
2. **使用文件或脚本**: 对于复杂的JSON数据，建议使用脚本文件避免引号转义问题
3. **检查响应**: 注意区分以下错误：
   - `请使用南科大邮箱`: 邮箱格式验证失败（可能是Content-Type未设置导致body为空）
   - `邮箱或密码错误`: 用户不存在或密码错误（body解析正常）
   - `CSRF Token验证失败`: 需要先获取CSRF token（部分端点需要）

---

## 📞 Support

- **Documentation**: See README.md in project root
- **Issues**: Create issue on GitHub
- **Emergency**: Contact team lead
- **Quick Help**: Check REMIND.md for common solutions

---

## 📚 相关文档

- **快速启动**: 查看根目录 `REMIND.md`
- **环境变量**: 查看配置模板文件（.template）
- **部署脚本**: `scripts\deployment\Deploy-Staging.ps1` / `scripts\deployment\Deploy-Production.ps1`
- **本地开发**: `scripts\QUICK_START.ps1`

---

**Last Updated**: 2025-11-05

**Changelog**:
- 2025-11-05: 添加功能测试章节（登录测试、用户创建）
- 2025-11-05: 添加测试工具脚本（create-test-user.js、test-login.sh）
- 2025-11-05: 修复SSH curl命令中JSON解析问题的文档说明
- 2025-11-02: 添加三环境部署系统（本地、测试、生产）
- 2025-11-02: 添加自动化部署脚本和配置模板系统
- 2025-11-02: 修复 alertSystem.js bug
- 2025-10-31: 积分系统上线
- 2025-10-31: 数据库迁移和API测试完成

