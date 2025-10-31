# IEClub Deployment Guide

> **✅ DEPLOYMENT STATUS: SUCCESSFUL** (Last Updated: 2025-10-31)
> 
> **Live Site**: https://ieclub.online  
> **API Status**: ✅ Running & Healthy  
> **Server**: 39.108.160.112  
> **PM2**: Backend running (ieclub-backend)  
> **SSL**: Active (Let's Encrypt)
>
> **Recent Updates** (2025-10-31):
> - ✅ 修复依赖安装问题 (express-validator, express-rate-limit, winston)
> - ✅ 改进部署脚本，确保 package.json 在解压后上传
> - ✅ 增强服务器端依赖验证和错误处理
> - ✅ 后端服务成功启动，所有API正常工作
> - ✅ Redis 和 WebSocket 服务正常运行
> - ✅ 健康检查端点返回正常状态

---

> **Quick Start** - 3 commands to deploy everything!

---

## 📌 部署命令（直接复制运行）

### 1️⃣ 部署全部（网页+后端） - 最常用
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy.ps1 -Target "all"
```
**这条命令会**:
- ✅ 构建并部署网页
- ✅ 打包并部署后端
- ✅ 重启所有服务
- ✅ 自动提交Git

### 2️⃣ 只部署网页
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy.ps1 -Target "web"
```

### 3️⃣ 只部署后端
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy.ps1 -Target "backend"
```

### 4️⃣ 编译小程序（本地开发）
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy.ps1 -Target "weapp"
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

### Local Environment

**Web (.env.development)**:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

**Backend (.env)**:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

### Production Environment

**Web (.env.production)**:
```
VITE_API_BASE_URL=https://ieclub.online/api
VITE_APP_ENV=production
```

**Backend (.env)**:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_production_secret
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
```bash
# Symptom
Network requests return 404, browser console shows API errors

# Diagnosis
ssh root@ieclub.online
pm2 status  # Check if backend is running
curl http://localhost:3000/api/health  # Test local API
curl http://localhost:3000/api/test    # Test connectivity

# Solution
pm2 restart ieclub-backend
pm2 logs ieclub-backend --lines 20

# If still fails
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

**Backend Logs**:
```bash
# PM2 logs
pm2 logs ieclub-backend

# Application logs
tail -f /root/IEclub_dev/ieclub-backend/logs/combined.log
```

**Web Logs**:
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## 📦 Deployment Checklist

### Before Deployment
- [ ] Code tested locally
- [ ] All tests passed
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Git committed and pushed

### During Deployment
- [ ] Build successful
- [ ] Upload complete
- [ ] Service restarted
- [ ] No errors in logs

### After Deployment
- [ ] Website accessible
- [ ] API responding
- [ ] Functions working
- [ ] Performance normal
- [ ] Monitoring active

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

### 问题 4: 网页显示旧版本

**解决方案**:
1. 清除浏览器缓存 (Ctrl+F5)
2. 检查 Nginx 是否正确重启
3. 验证文件是否正确部署到 `/root/IEclub_dev/ieclub-web/dist`

---

## 📞 Support

- **Documentation**: See README.md in project root
- **Issues**: Create issue on GitHub
- **Emergency**: Contact team lead

---

**Last Updated**: 2025-10-31

