# 测试环境快速部署 - 速查表

> 5分钟快速部署测试环境

---

## 🚀 方式一：自动部署（推荐）

```powershell
# 在本地 PowerShell 执行
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging-Complete.ps1
```

**完成！** 脚本会自动完成所有步骤。

---

## 🔧 方式二：手动部署

### 1️⃣ 在服务器上准备

```bash
# SSH 登录
ssh root@ieclub.online

# 创建目录
mkdir -p /root/IEclub_dev_staging/ieclub-backend
cd /root/IEclub_dev_staging/ieclub-backend

# 上传代码（使用 WinSCP 或 scp）
```

### 2️⃣ 配置环境变量

```bash
# 复制模板
cp env.staging.template .env.staging

# 编辑配置
nano .env.staging
```

**必填项**:
- `DATABASE_URL` - 数据库连接
- `JWT_SECRET` - JWT密钥（64位随机）
- `JWT_REFRESH_SECRET` - 刷新令牌密钥

### 3️⃣ 安装和启动

```bash
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
```

### 4️⃣ 验证

```bash
# 查看状态
pm2 status staging-backend

# 查看日志
pm2 logs staging-backend

# 健康检查
curl http://localhost:3001/health
```

---

## ✅ 验证清单

- [ ] PM2 显示 `online` 状态
- [ ] 日志无严重错误
- [ ] `curl localhost:3001/health` 返回 OK
- [ ] `curl https://ieclub.online/health/staging` 正常（需先配置 Nginx）

---

## 🔍 常用命令

```bash
# 查看状态
pm2 status staging-backend

# 查看日志
pm2 logs staging-backend --lines 100

# 重启服务
pm2 restart staging-backend

# 停止服务
pm2 stop staging-backend

# 删除进程
pm2 delete staging-backend
```

---

## ❌ 遇到问题？

### 启动失败

```bash
# 查看详细错误
pm2 logs staging-backend --err --lines 50

# 手动启动查看错误
node src/server-staging.js
```

### 数据库连接失败

```bash
# 测试连接
mysql -h localhost -u ieclub -p ieclub_staging

# 检查配置
cat .env.staging | grep DATABASE_URL
```

### 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 3001

# 杀掉占用进程
kill -9 <PID>
```

---

## 📚 完整文档

- [问题分析](./STAGING_ISSUES_ANALYSIS.md) - 所有问题详情
- [修复指南](./STAGING_FIX_GUIDE.md) - 详细部署手册
- [修复总结](./STAGING_FIX_SUMMARY.md) - 修复内容汇总

---

**更新**: 2025-11-06  
**适用**: IEClub 测试环境部署

