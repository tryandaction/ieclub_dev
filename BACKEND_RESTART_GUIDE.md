# 🚀 后端服务重启指南

## ⚠️ 重要提示

**修改后端代码后，必须重启后端服务才能生效！**

当前问题：虽然已修复代码中的数据库连接问题，但服务器仍在运行旧代码，导致：
- ❌ `/api/activities` 返回 500 错误
- ❌ `/api/topics` 返回 500 错误
- ❌ 数据库连接池仍然耗尽

---

## 📋 重启步骤

### 方法 1: 使用 PM2 重启（推荐）

```bash
# 1. SSH 登录服务器
ssh user@ieclub.online

# 2. 进入项目目录
cd /path/to/ieclub-backend

# 3. 拉取最新代码
git pull origin main

# 4. 安装依赖（如果有新依赖）
npm install

# 5. 重启服务
pm2 restart ieclub-backend

# 6. 查看日志
pm2 logs ieclub-backend --lines 50

# 7. 检查状态
pm2 status
```

### 方法 2: 完全重启

```bash
# 1. 停止服务
pm2 stop ieclub-backend

# 2. 删除旧进程
pm2 delete ieclub-backend

# 3. 启动新服务
cd /path/to/ieclub-backend
pm2 start npm --name "ieclub-backend" -- run start

# 4. 保存 PM2 配置
pm2 save
```

### 方法 3: 使用 npm 脚本

```bash
# 如果项目有重启脚本
cd ieclub-backend
npm run restart

# 或者
npm run stop
npm run start
```

---

## 🔍 验证服务是否正常

### 1. 检查 PM2 状态

```bash
pm2 status
```

应该看到：
```
┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ mode        │ ↺       │ status  │ cpu      │
├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ ieclub-backend     │ fork        │ 0       │ online  │ 0%       │
└─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### 2. 检查日志

```bash
# 实时查看日志
pm2 logs ieclub-backend

# 查看最近 100 行
pm2 logs ieclub-backend --lines 100

# 只看错误日志
pm2 logs ieclub-backend --err
```

应该看到：
```
✅ 数据库连接成功
✅ 服务器运行在端口 3000
```

### 3. 测试 API 接口

```bash
# 测试健康检查
curl https://ieclub.online/api/health

# 测试活动列表
curl https://ieclub.online/api/activities

# 测试话题列表
curl https://ieclub.online/api/topics
```

应该返回正常的 JSON 数据，而不是 500 错误。

### 4. 检查数据库连接

```bash
# 查看数据库连接数
pm2 logs ieclub-backend | grep "PrismaClient"
```

应该只看到 **1 个** PrismaClient 实例被创建。

---

## 🐛 常见问题

### 问题 1: PM2 找不到进程

```bash
# 查看所有进程
pm2 list

# 如果没有 ieclub-backend，需要重新启动
cd /path/to/ieclub-backend
pm2 start npm --name "ieclub-backend" -- run start
pm2 save
```

### 问题 2: 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 或
netstat -tulpn | grep 3000

# 杀死进程
kill -9 <PID>

# 然后重启服务
pm2 restart ieclub-backend
```

### 问题 3: 数据库连接失败

```bash
# 检查数据库服务
systemctl status mysql
# 或
systemctl status postgresql

# 检查环境变量
cat /path/to/ieclub-backend/.env | grep DATABASE_URL

# 测试数据库连接
cd /path/to/ieclub-backend
npx prisma db pull
```

### 问题 4: 代码没有更新

```bash
# 强制拉取最新代码
cd /path/to/ieclub-backend
git fetch --all
git reset --hard origin/main

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启服务
pm2 restart ieclub-backend
```

---

## 📊 监控服务状态

### 使用 PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show ieclub-backend

# 查看资源使用
pm2 status
```

### 查看系统资源

```bash
# 查看内存使用
free -h

# 查看 CPU 使用
top

# 查看磁盘使用
df -h
```

---

## ✅ 验证修复是否生效

### 1. 网页端测试

打开浏览器控制台，访问 `https://ieclub.online`，应该看到：

```
📡 生产环境，自动配置 API 地址: https://ieclub.online/api
🚀 [GET] https://ieclub.online/api/activities
✅ [GET] /activities (234ms)
```

**不应该再看到 500 错误！**

### 2. 检查数据库连接数

```bash
# 查看日志中的 PrismaClient 创建记录
pm2 logs ieclub-backend | grep "PrismaClient" | wc -l
```

应该只有 **1 行**，表示只创建了 1 个实例。

### 3. 性能测试

```bash
# 使用 ab 进行压力测试
ab -n 100 -c 10 https://ieclub.online/api/activities

# 或使用 curl 测试响应时间
time curl https://ieclub.online/api/activities
```

响应时间应该在 **200-500ms** 之间。

---

## 🎯 完整重启流程（推荐）

```bash
#!/bin/bash

echo "🚀 开始重启 IEClub 后端服务..."

# 1. 进入项目目录
cd /path/to/ieclub-backend || exit 1

# 2. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 3. 安装依赖
echo "📦 安装依赖..."
npm install

# 4. 运行数据库迁移（如果需要）
# echo "🗄️ 运行数据库迁移..."
# npx prisma migrate deploy

# 5. 重启 PM2 服务
echo "🔄 重启服务..."
pm2 restart ieclub-backend

# 6. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 7. 检查服务状态
echo "🔍 检查服务状态..."
pm2 status ieclub-backend

# 8. 查看最近日志
echo "📋 查看最近日志..."
pm2 logs ieclub-backend --lines 20 --nostream

# 9. 测试 API
echo "🧪 测试 API..."
curl -f https://ieclub.online/api/health && echo "✅ 健康检查通过" || echo "❌ 健康检查失败"

echo "✅ 重启完成！"
```

保存为 `restart.sh`，然后：

```bash
chmod +x restart.sh
./restart.sh
```

---

## 📞 需要帮助？

如果重启后仍有问题：

1. 查看完整日志：`pm2 logs ieclub-backend --lines 500`
2. 检查错误日志：`pm2 logs ieclub-backend --err --lines 100`
3. 查看系统日志：`journalctl -u ieclub-backend -n 100`
4. 检查数据库日志：`tail -f /var/log/mysql/error.log`

---

**记住：修改代码后必须重启服务！** 🔄

