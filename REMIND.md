# ⚠️ IEClub 项目重要提醒

> 📌 **最后更新**: 2025-11-04  
> 📌 **项目状态**: ✅ 测试环境和生产环境均正常运行
> ⚠️ **重要**: 测试环境需配置真实邮件服务，详见[邮件服务配置](#邮件服务配置)

---

## 📋 快速导航

- [服务状态](#服务状态)
- [邮件服务配置](#邮件服务配置)
- [常用命令](#常用命令)
- [部署指南](#部署指南)
- [故障排查](#故障排查)
- [重要配置](#重要配置)

---

## 🎯 服务状态

### 生产环境 (Production)
- **Web访问**: https://ieclub.online
- **API地址**: https://ieclub.online/api
- **健康检查**: https://ieclub.online/api/health
- **服务器端口**: 3000 (内部)
- **PM2进程名**: ieclub-backend
- **部署路径**: `/root/IEclub_dev/ieclub-backend`

### 测试环境 (Staging)
- **Web访问**: https://test.ieclub.online
- **API地址**: https://test.ieclub.online/api
- **健康检查**: https://test.ieclub.online/api/health
- **服务器端口**: 3001 (内部)
- **PM2进程名**: staging-backend
- **部署路径**: `/root/IEclub_dev_staging/ieclub-backend`

### 小程序
- **AppID**: wx5c959d4b00c7f61b
- **生产API**: https://ieclub.online/api
- **测试API**: https://test.ieclub.online/api

---

## 📧 邮件服务配置

### ⚠️ 重要：测试环境需配置真实邮件服务

**当前问题**：
- 测试环境使用的是 Ethereal Email（模拟邮件服务）
- ❌ 邮件不会真实发送
- ❌ 用户无法收到验证码
- ❌ 无法测试真实用户注册流程

**解决方案**：配置真实邮件服务

### 方案一：SendGrid（推荐，5分钟配置）

**优势**：
- ✅ 免费版每天 100 封邮件
- ✅ 配置简单，无需域名
- ✅ 稳定可靠

**快速配置**：

```bash
# 1. 运行配置脚本
./configure-sendgrid.sh

# 2. 按提示操作：
#    - 注册 SendGrid 账号（https://signup.sendgrid.com/）
#    - 创建 API Key
#    - 验证发件人邮箱
#    - 输入配置信息

# 3. 测试邮件功能
./test-email-service.sh
```

**详细文档**：查看 `CONFIGURE_REAL_EMAIL.md`

### 方案二：腾讯企业邮箱（国内推荐）

**优势**：
- ✅ 国内服务，速度快
- ✅ 免费版支持50个账号
- ✅ 稳定可靠

**前置要求**：
- 需要有自己的域名
- 需要配置域名 MX 记录

**快速配置**：

```bash
# 运行配置脚本
./configure-tencent-email.sh
```

### 测试邮件功能

配置完成后，运行测试脚本验证：

```bash
./test-email-service.sh
```

测试内容：
1. 发送注册验证码
2. 完整注册流程
3. 找回密码验证码

### 手动测试

```bash
# 发送验证码
curl -X POST https://test.ieclub.online/api/auth/send-verification-code \
  -H 'Content-Type: application/json' \
  -d '{"email": "your-email@example.com", "type": "register"}'

# 检查邮箱是否收到验证码
```

### 查看日志

```bash
# 查看邮件发送日志
ssh root@ieclub.online "pm2 logs ieclub-staging --lines 100 | grep -i email"

# 查看当前邮件配置
ssh root@ieclub.online "cat /root/IEclub_dev_staging/ieclub-backend/.env | grep EMAIL_"
```

### 常见问题

**Q: 邮件进垃圾箱怎么办？**
A: 
- 完成 SendGrid 的 Domain Authentication
- 配置 SPF 和 DKIM 记录
- 添加退订链接

**Q: SendGrid 免费版够用吗？**
A: 测试环境完全够用，每天 100 封邮件足够测试需求

**Q: 生产环境也用 SendGrid？**
A: 可以，但建议根据邮件量选择合适的付费方案

---

## 🚀 常用命令

### 本地开发

```powershell
# 一键启动所有服务（推荐）
.\scripts\QUICK_START.ps1

# 或者分别启动
cd ieclub-backend && npm run dev
cd ieclub-web && npm run dev
```

### 部署

```powershell
# 部署到测试环境（建议先测试）
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "功能描述"

# 部署到生产环境（谨慎操作）
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "版本说明"

# 只部署后端
.\scripts\deployment\Deploy-Staging.ps1 -Target backend

# 只部署Web前端
.\scripts\deployment\Deploy-Staging.ps1 -Target web
```

### 服务器管理

```powershell
# SSH登录服务器
ssh root@ieclub.online

# 查看PM2服务状态
ssh root@ieclub.online "pm2 status"

# 查看日志（生产）
ssh root@ieclub.online "pm2 logs ieclub-backend --lines 50"

# 查看日志（测试）
ssh root@ieclub.online "pm2 logs staging-backend --lines 50"

# 重启服务
ssh root@ieclub.online "pm2 restart ieclub-backend"
ssh root@ieclub.online "pm2 restart staging-backend"

# 健康检查诊断
.\scripts\health-check\Check-Backend-Health.ps1 -Environment staging
.\scripts\health-check\Check-Backend-Health.ps1 -Environment production
```

### 数据库操作

```bash
# 进入服务器后

# 连接生产数据库
mysql -u ieclub_user -p ieclub_production

# 连接测试数据库
mysql -u ieclub_user -p ieclub_staging

# 运行数据库迁移
cd /root/IEclub_dev/ieclub-backend
npx prisma migrate deploy

# 初始化RBAC权限
npm run init-rbac

# 数据库备份
./scripts/backup-database.sh

# 数据库恢复
./scripts/restore-database.sh backup_file.sql
```

---

## 📦 部署指南

### 部署流程

1. **本地测试**
   ```powershell
   # 确保本地运行正常
   cd ieclub-backend && npm test
   cd ieclub-web && npm run build
   ```

2. **部署到测试环境**
   ```powershell
   .\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"
   ```

3. **测试环境验证**
   - 访问 https://test.ieclub.online
   - 检查功能是否正常
   - 查看日志是否有错误

4. **部署到生产环境**
   ```powershell
   .\scripts\deployment\Deploy-Production.ps1 -Target all -Message "v1.x.x 正式发布"
   ```

### 部署检查清单

部署前运行：
```powershell
.\scripts\health-check\Check-Deploy-Ready.ps1
```

手动检查：
- [ ] 代码已提交到Git仓库
- [ ] 已在测试环境验证
- [ ] 数据库迁移已准备（如需要）
- [ ] 环境变量配置正确
- [ ] 确认没有破坏性更改

---

## 🔍 故障排查

### 后端健康检查失败

**快速诊断**：
```powershell
.\scripts\health-check\Check-Backend-Health.ps1 -Environment staging
```

**常见原因**：
1. **数据库连接失败**
   - 检查 `.env.staging` 或 `.env.production` 中的 `DATABASE_URL`
   - 测试数据库连接：`mysql -u ieclub_user -p`

2. **Redis连接失败**
   - 检查Redis服务：`systemctl status redis-server`
   - 测试连接：`redis-cli ping`

3. **端口被占用**
   - 检查端口：`lsof -i :3000` 或 `lsof -i :3001`
   - 重启PM2：`pm2 restart staging-backend`

4. **代码错误**
   - 查看日志：`pm2 logs staging-backend --lines 100`
   - 检查启动文件：`server-staging.js` 或 `server.js`

### Git代理问题

如果遇到 `Failed to connect to 127.0.0.1 port 7890`：

```powershell
# 移除Git代理配置
git config --global --unset http.proxy
git config --global --unset https.proxy
```

详见：[Git代理配置指南](./docs/GIT_PROXY_SETUP.md)

### PM2进程崩溃

```bash
# 查看崩溃原因
pm2 logs staging-backend --err --lines 50

# 查看进程详情
pm2 show staging-backend

# 重启服务
pm2 restart staging-backend

# 保存PM2配置
pm2 save
```

### Nginx配置问题

```bash
# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 查看Nginx日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## ⚙️ 重要配置

### 环境变量配置

#### 后端环境变量

**测试环境** (`.env.staging`)：
```env
NODE_ENV=staging
PORT=3001
DATABASE_URL=mysql://ieclub_user:your_password@localhost:3306/ieclub_staging
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

**生产环境** (`.env.production`)：
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://ieclub_user:your_password@localhost:3306/ieclub_production
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

#### Web前端环境变量

**测试环境** (`.env.staging`)：
```env
VITE_API_BASE_URL=https://test.ieclub.online/api
VITE_APP_ENV=staging
```

**生产环境** (`.env.production`)：
```env
VITE_API_BASE_URL=https://ieclub.online/api
VITE_APP_ENV=production
```

### PM2配置

**测试环境** (`ecosystem.staging.config.js`)：
```javascript
module.exports = {
  apps: [{
    name: 'staging-backend',
    script: './src/server-staging.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    }
  }]
}
```

**生产环境** (`ecosystem.config.js`)：
```javascript
module.exports = {
  apps: [{
    name: 'ieclub-backend',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Nginx配置

位置：`/etc/nginx/sites-available/ieclub`

关键配置：
```nginx
# 生产环境
server {
    server_name ieclub.online;
    location /api {
        proxy_pass http://localhost:3000;
    }
}

# 测试环境
server {
    server_name test.ieclub.online;
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

---

## 📚 更多文档

- [项目README](./README.md) - 项目总体介绍
- [文档索引](./docs/README.md) - 所有文档导航
- [部署详细指南](./docs/deployment/Deployment_guide.md) - 完整部署流程
- [后端快速开始](./ieclub-backend/QUICK_START.md) - 后端开发指南
- [Git代理配置](./docs/GIT_PROXY_SETUP.md) - 网络问题解决

---

## 🔧 服务器信息

### 服务器登录
- **主机**: ieclub.online
- **用户**: root
- **SSH端口**: 22
- **登录**: `ssh root@ieclub.online`

### 目录结构
```
/root/
├── IEclub_dev/                    # 生产环境
│   └── ieclub-backend/
│       ├── .env.production        # 生产配置
│       ├── src/
│       └── ecosystem.config.js
│
└── IEclub_dev_staging/            # 测试环境
    └── ieclub-backend/
        ├── .env.staging           # 测试配置
        ├── src/
        └── ecosystem.staging.config.js
```

### 服务管理
```bash
# PM2进程
pm2 status                    # 查看所有进程
pm2 logs                      # 查看所有日志
pm2 restart all               # 重启所有服务

# 数据库
systemctl status mysql        # MySQL状态
mysql -u root -p             # 登录MySQL

# Redis
systemctl status redis-server # Redis状态
redis-cli                     # Redis命令行

# Nginx
systemctl status nginx        # Nginx状态
nginx -t                      # 测试配置
systemctl restart nginx       # 重启Nginx
```

---

## 📞 紧急联系

### 服务异常处理流程

1. **快速诊断**
   ```powershell
   .\scripts\health-check\Check-Backend-Health.ps1 -Environment production
   ```

2. **查看日志**
   ```bash
   ssh root@ieclub.online "pm2 logs ieclub-backend --lines 100"
   ```

3. **回滚（如必要）**
   - 测试环境：`.\scripts\deployment\Deploy-Staging.ps1` 会提示回滚选项
   - 生产环境：谨慎操作，联系技术负责人

4. **临时修复**
   ```bash
   # 重启服务
   pm2 restart ieclub-backend
   
   # 清除缓存
   redis-cli FLUSHDB
   ```

---

## 📝 更新日志

### 2025-11-04
- ✅ 修复测试环境部署问题
- ✅ 添加详细的健康检查诊断
- ✅ 优化部署脚本中文显示
- ✅ 创建后端健康检查工具
- ✅ 整理文档结构

### 历史记录
详见：[后端CHANGELOG](./ieclub-backend/CHANGELOG.md)

---

**📌 重要提示**: 
- 生产环境操作前务必先在测试环境验证
- 定期备份数据库
- 保持文档更新
- 遇到问题先查看日志和诊断工具
