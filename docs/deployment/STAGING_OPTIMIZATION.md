# 测试环境优化方案

## 🎯 目标
在有限资源下（2GB内存，40GB磁盘）运行生产和测试两套环境

---

## 📊 资源现状
- **内存**: 1.11GB / 2GB (55%)
- **CPU**: 3.07% / 2核
- **磁盘**: 16.33GB / 40GB (40%)
- **结论**: 资源充足，但需优化避免npm install时内存峰值

---

## 🔧 优化策略

### 策略1: 共享node_modules（推荐）

**测试环境直接使用生产环境的node_modules**

**优点**:
- ✅ 节省磁盘空间（每个项目node_modules约300-500MB）
- ✅ 避免npm install占用大量内存
- ✅ 部署速度快（无需安装依赖）

**实现**:
```bash
# 测试环境后端使用软链接
cd /root/IEclub_dev_staging/ieclub-backend
rm -rf node_modules
ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules
```

**注意**:
- 前提：生产和测试使用相同的代码分支（develop）
- 依赖版本必须一致

---

### 策略2: 测试环境按需启动

**不常用时关闭测试环境，需要时再启动**

```bash
# 关闭测试环境
pm2 stop staging-backend

# 启动测试环境
pm2 start staging-backend
```

**适用场景**:
- 测试环境不需要24小时运行
- 临时测试时手动启动

---

### 策略3: 最小化测试环境功能

**测试环境只部署核心功能**

- ✅ 前端静态文件
- ✅ 后端API服务
- ❌ 不需要独立数据库（使用生产数据库的测试schema）
- ❌ 不需要独立Redis（共用生产Redis，使用不同db）

---

### 策略4: 优化npm install

**使用 `--production` 和 `--prefer-offline`**

```bash
# 只安装生产依赖，不安装开发依赖
npm ci --production --prefer-offline --no-audit

# 或使用pnpm（更省内存和磁盘）
pnpm install --prod --frozen-lockfile
```

---

## 📋 推荐配置

### 生产环境
- 端口: 3000
- 数据库: ieclub_prod
- Redis: db 0
- PM2: ieclub-backend
- 磁盘: ~8GB

### 测试环境
- 端口: 3001
- 数据库: ieclub_staging (可共用生产数据库服务器)
- Redis: db 1 (共用Redis服务，不同database)
- PM2: staging-backend
- 磁盘: ~3GB (使用软链接后)

---

## 🚀 快速部署脚本（优化版）

### 测试环境轻量部署

```bash
#!/bin/bash
# 快速部署测试环境（共享依赖版）

echo "🚀 开始轻量部署测试环境..."

# 1. 更新代码
cd /root/IEclub_dev_staging/ieclub-backend
git pull origin develop

# 2. 使用生产环境的node_modules（软链接）
if [ ! -L "node_modules" ]; then
  echo "创建node_modules软链接..."
  rm -rf node_modules
  ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules
fi

# 3. 复制环境配置
cp /root/IEclub_dev/ieclub-backend/.env.staging .env.staging

# 4. 重启服务
pm2 restart staging-backend || \
  NODE_ENV=staging PORT=3001 pm2 start src/server-staging.js --name staging-backend

echo "✅ 测试环境部署完成！"
pm2 logs staging-backend --lines 20
```

---

## 💾 磁盘空间优化

### 定期清理

```bash
# 清理npm缓存
npm cache clean --force

# 清理PM2日志（保留最近100行）
pm2 flush

# 清理旧的备份文件
find /root -name "*.backup_*" -mtime +7 -delete

# 清理Git仓库
cd /root/IEclub_dev && git gc --aggressive
cd /root/IEclub_dev_staging && git gc --aggressive
```

### 日志轮转

```bash
# PM2日志自动清理
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
```

---

## 📊 预期效果

### 优化前
- 测试环境磁盘占用: ~8GB
- 部署时间: ~5分钟（npm install）
- 内存峰值: 1.5GB

### 优化后
- 测试环境磁盘占用: ~3GB (节省62%)
- 部署时间: ~30秒（无需npm install）
- 内存峰值: 0.5GB (节省66%)

---

## ⚠️ 注意事项

1. **依赖版本一致性**
   - 生产和测试必须使用相同的package.json
   - 如果需要测试新依赖，需临时安装

2. **数据隔离**
   - 测试环境使用独立的数据库schema
   - 不要在测试环境操作生产数据

3. **定期同步**
   - 每周同步一次生产数据到测试环境
   - 保证测试数据的真实性

---

## 🔄 回滚方案

如果软链接方案有问题：

```bash
# 1. 删除软链接
cd /root/IEclub_dev_staging/ieclub-backend
rm node_modules

# 2. 重新安装依赖
npm ci --production --prefer-offline

# 3. 重启服务
pm2 restart staging-backend
```
