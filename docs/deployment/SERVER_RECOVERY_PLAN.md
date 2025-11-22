# 🔧 IEClub 服务器完整恢复方案

## 📊 服务器配置
- **内存**: 2GB
- **CPU**: 2核
- **磁盘**: 40GB
- **系统**: Ubuntu 24.04
- **IP**: 39.108.160.112

---

## 🎯 核心策略

### 1. 生产环境优先
- ✅ 先恢复生产环境（用户可访问）
- ✅ 确保生产环境稳定运行
- ✅ 再部署测试环境

### 2. 测试环境轻量化
- ✅ 共享生产环境的node_modules（软链接）
- ✅ 节省磁盘空间 60%+
- ✅ 避免npm install占用大量内存

### 3. 资源管理
- ✅ 永远不要同时npm install多个项目
- ✅ npm install前清理缓存
- ✅ 安装完成后立即清理临时文件

---

## 🚀 恢复步骤

### 步骤1: 检查服务器状态（5分钟）

```bash
# 1.1 检查资源
free -h
df -h
uptime

# 1.2 检查关键服务
systemctl status nginx
systemctl status mysql
systemctl status redis

# 1.3 检查PM2
pm2 list
pm2 logs --lines 20
```

**预期结果**: 
- 内存可用 > 500MB
- 磁盘可用 > 20GB
- Nginx、MySQL、Redis 运行正常

---

### 步骤2: 恢复生产环境后端（10分钟）

```bash
# 2.1 进入目录
cd /root/IEclub_dev/ieclub-backend

# 2.2 确认代码完整
ls -la src/
cat package.json | head -20

# 2.3 清理并重装依赖（关键！）
rm -rf node_modules package-lock.json
npm cache clean --force

# 2.4 安装依赖（一次性完成）
npm install --loglevel=error

# 2.5 验证安装
ls node_modules | wc -l  # 应该有500+个包
ls node_modules | grep -E "express|prisma|bcrypt|jsonwebtoken|hpp"

# 2.6 启动生产服务
pm2 delete ieclub-backend 2>/dev/null || true
NODE_ENV=production PORT=3000 pm2 start src/server.js --name ieclub-backend

# 2.7 检查日志
sleep 5
pm2 logs ieclub-backend --lines 20
```

**预期结果**:
- node_modules 有 500+ 个包
- PM2 状态: online
- 无错误日志

---

### 步骤3: 恢复生产环境前端（5分钟）

```bash
# 3.1 检查前端静态文件
ls -la /var/www/ieclub.online/
du -sh /var/www/ieclub.online/

# 3.2 检查Nginx配置
nginx -t

# 3.3 重启Nginx（如需要）
systemctl restart nginx
```

**预期结果**:
- 静态文件存在
- Nginx配置正确
- https://ieclub.online 可访问

---

### 步骤4: 部署测试环境（轻量模式，5分钟）

```bash
# 4.1 更新测试环境代码
cd /root/IEclub_dev_staging/ieclub-backend
git fetch origin develop
git reset --hard origin/develop

# 4.2 创建软链接到生产环境node_modules
rm -rf node_modules
ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules

# 4.3 验证软链接
ls -la node_modules  # 应该显示为软链接
ls node_modules | wc -l  # 应该和生产环境一样

# 4.4 复制环境配置
cp /root/IEclub_dev/ieclub-backend/.env.staging .env.staging

# 4.5 启动测试服务
pm2 delete staging-backend 2>/dev/null || true
NODE_ENV=staging PORT=3001 pm2 start src/server-staging.js --name staging-backend

# 4.6 检查日志
sleep 5
pm2 logs staging-backend --lines 20
```

**预期结果**:
- 软链接创建成功
- PM2 状态: online
- 无错误日志
- 节省 ~300MB 磁盘空间

---

### 步骤5: 部署测试环境前端（本地构建，3分钟）

**在本地执行**:
```powershell
cd ieclub-web
npm run build -- --mode staging

# 打包
Compress-Archive -Path "dist\*" -DestinationPath "dist-staging.zip" -Force

# 上传
scp dist-staging.zip root@ieclub.online:/tmp/

# 部署
ssh root@ieclub.online "
cd /tmp &&
mkdir -p /var/www/test.ieclub.online.new &&
unzip -q -o dist-staging.zip -d /var/www/test.ieclub.online.new &&
rm -rf /var/www/test.ieclub.online.backup &&
mv /var/www/test.ieclub.online /var/www/test.ieclub.online.backup 2>/dev/null || true &&
mv /var/www/test.ieclub.online.new /var/www/test.ieclub.online &&
rm dist-staging.zip
"
```

---

### 步骤6: 验证和优化（5分钟）

```bash
# 6.1 验证生产环境
curl https://ieclub.online/api/health
curl https://ieclub.online -I

# 6.2 验证测试环境
curl https://test.ieclub.online/api/health
curl https://test.ieclub.online -I

# 6.3 检查资源使用
free -h
df -h
pm2 list

# 6.4 配置PM2日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5

# 6.5 保存PM2配置
pm2 save

# 6.6 清理临时文件
rm -rf /tmp/*.zip
npm cache clean --force
```

**预期结果**:
- 生产: https://ieclub.online ✅
- 测试: https://test.ieclub.online ✅
- 内存使用 < 1.5GB
- 磁盘使用 < 20GB

---

## ⚠️ 关键注意事项

### 1. 依赖安装原则
```bash
# ❌ 错误：同时安装多个项目
cd /root/IEclub_dev/ieclub-backend && npm install &
cd /root/IEclub_dev_staging/ieclub-backend && npm install &

# ✅ 正确：一次一个，测试环境用软链接
cd /root/IEclub_dev/ieclub-backend && npm install
cd /root/IEclub_dev_staging/ieclub-backend && ln -s /root/IEclub_dev/ieclub-backend/node_modules
```

### 2. 内存不足时的处理
```bash
# 如果npm install卡住：
killall npm
npm cache clean --force
# 增加交换空间（临时）
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
# 然后重试npm install
```

### 3. package.json被破坏时的恢复
```bash
# 从本地恢复
# 本地执行：
scp c:\universe\GitHub_try\IEclub_dev\ieclub-backend\package.json root@ieclub.online:/root/IEclub_dev/ieclub-backend/

# 或从Git恢复
cd /root/IEclub_dev/ieclub-backend
git checkout -- package.json
```

---

## 🎯 成功标准

### 生产环境
- [ ] https://ieclub.online 可访问
- [ ] https://ieclub.online/api/health 返回 200
- [ ] 登录/注册功能正常
- [ ] PM2 状态: online
- [ ] 无错误日志

### 测试环境
- [ ] https://test.ieclub.online 可访问
- [ ] https://test.ieclub.online/api/health 返回 200
- [ ] 登录/注册功能正常
- [ ] PM2 状态: online
- [ ] node_modules 使用软链接

### 系统资源
- [ ] 内存使用 < 1.5GB
- [ ] 磁盘使用 < 20GB
- [ ] CPU 负载 < 50%
- [ ] 无swap使用

---

## 🔧 定期维护计划

### 每周
- 清理PM2日志: `pm2 flush`
- 清理npm缓存: `npm cache clean --force`
- 检查磁盘空间: `df -h`

### 每月
- 清理旧备份: `find /root -name "*.backup_*" -mtime +30 -delete`
- 系统更新: `apt update && apt upgrade`
- Git仓库优化: `git gc --aggressive`

---

## 📞 紧急联系方案

如果服务器再次出问题：

1. **优先保证生产环境**
   ```bash
   pm2 restart ieclub-backend
   systemctl restart nginx
   ```

2. **临时关闭测试环境（释放资源）**
   ```bash
   pm2 stop staging-backend
   pm2 delete staging-backend
   ```

3. **清理资源后重试**
   ```bash
   npm cache clean --force
   pm2 flush
   rm -rf /tmp/*
   ```

---

## ✅ 验收清单

完成后确认：
- [ ] 生产环境完全正常（登录、注册、浏览话题）
- [ ] 测试环境完全正常（登录、注册、浏览话题）
- [ ] 资源使用合理（内存<1.5GB，磁盘<20GB）
- [ ] PM2配置已保存（重启后自动恢复）
- [ ] 安全修复已部署（密码不泄露到控制台）
- [ ] 文档已更新

---

**恢复时间**: 预计 30-40 分钟
**恢复人员**: AI Assistant
**恢复日期**: 2025-11-22
