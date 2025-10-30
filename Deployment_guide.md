# IEClub Deployment Guide

> **✅ DEPLOYMENT STATUS: SUCCESSFUL** (Last Updated: 2025-10-30)
> 
> **Live Site**: https://ieclub.online  
> **API Status**: ✅ Running (15/18 tests passing)  
> **Server**: 39.108.160.112  
> **PM2**: Both frontend and backend running  
> **SSL**: Active (Let's Encrypt)
>
> **Recent Updates**:
> - ✅ 完善前端UI和用户体验
> - ✅ 添加全局加载和错误处理
> - ✅ 优化评论列表空状态显示
> - ✅ 改进骨架屏加载效果
> - ✅ 添加消息提示工具
> - ✅ 修复API路由配置和小程序路径

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
pm2 logs ieclub-backend

# Test API
curl https://ieclub.online/api/health
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

#### 1. Web Build Failed
```bash
Error: Cannot find module 'vite'
Solution: npm install
```

#### 2. Backend Start Failed
```bash
Error: Cannot connect to MySQL
Solution: Check MySQL service and connection string
```

#### 3. Mini Program Upload Failed
```
Error: WeChat DevTools not logged in
Solution: Scan QR code to login
```

#### 4. Server Connection Timeout
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

## 📞 Support

- **Documentation**: See README.md in project root
- **Issues**: Create issue on GitHub
- **Emergency**: Contact team lead

---

**Last Updated**: 2025-10-30

