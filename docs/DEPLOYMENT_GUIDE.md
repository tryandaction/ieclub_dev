# 📦 IEClub 部署完整指南

**最后更新**: 2025-11-22

---

## 🎯 快速部署

### 测试环境（轻量模式）
```powershell
# 推荐：轻量部署（无需npm install，节省资源）
cd scripts/deployment
.\Deploy-Staging-Light.ps1 -Target all -Message "更新说明"
```

### 生产环境
```powershell
cd scripts/deployment
.\Deploy-Production.ps1 -Target all -Message "发布v1.0"
# 需要输入YES确认
```

---

## 📊 环境架构

### 服务器配置
- **IP**: 39.108.160.112
- **内存**: 2GB
- **磁盘**: 40GB
- **系统**: Ubuntu 24.04

### 环境对比

| 项目 | 生产环境 | 测试环境 |
|------|----------|----------|
| **域名** | https://ieclub.online | https://test.ieclub.online |
| **后端端口** | 3000 | 3001 |
| **数据库** | ieclub (共用) | ieclub (共用) |
| **Redis DB** | 0 | 1 |
| **PM2名称** | ieclub-backend | staging-backend |
| **依赖方式** | 完整安装 | 软链接（共享生产） |
| **磁盘占用** | ~8GB | ~3GB |

---

## 🚀 部署流程详解

### 1. 测试环境轻量部署（推荐）

**特点**：
- ✅ 使用软链接共享生产环境依赖
- ✅ 无需npm install，节省60%资源
- ✅ 部署速度：30秒（vs 5分钟）

**步骤**：
```powershell
# 1. 确保代码已提交
git add .
git commit -m "更新说明"
git push origin develop

# 2. 执行轻量部署
cd scripts/deployment
.\Deploy-Staging-Light.ps1 -Target all -Message "测试更新"

# 3. 验证部署
# 访问 https://test.ieclub.online
# 测试登录、注册等核心功能
```

**脚本功能**：
- 自动拉取最新代码
- 前端：本地构建 → 上传 → 部署
- 后端：创建软链接 → 重启PM2
- 健康检查：验证API可用性

### 2. 生产环境部署

**注意**：
- ⚠️ 需要先在测试环境验证
- ⚠️ 需要手动输入YES确认
- ⚠️ 影响线上用户，谨慎操作

**步骤**：
```powershell
# 1. 测试环境验证通过后
cd scripts/deployment
.\Deploy-Production.ps1 -Target all -Message "发布v2.0"

# 2. 输入YES确认

# 3. 等待部署完成（约5分钟）

# 4. 验证部署
# 访问 https://ieclub.online
# 测试核心功能
```

### 3. 仅部署前端或后端

```powershell
# 仅部署测试环境前端
.\Deploy-Staging-Light.ps1 -Target web -Message "前端更新"

# 仅部署测试环境后端
.\Deploy-Staging-Light.ps1 -Target backend -Message "后端更新"

# 仅部署生产环境前端
.\Deploy-Production.ps1 -Target web -Message "前端更新"
```

---

## 🔧 服务器维护

### 日常检查
```powershell
# 查看服务状态
ssh root@ieclub.online "pm2 list"

# 查看资源使用
ssh root@ieclub.online "free -h && df -h | grep vda"

# 查看日志
ssh root@ieclub.online "pm2 logs ieclub-backend --lines 50"
ssh root@ieclub.online "pm2 logs staging-backend --lines 50"
```

### 重启服务
```powershell
# 重启生产环境
ssh root@ieclub.online "pm2 restart ieclub-backend"

# 重启测试环境
ssh root@ieclub.online "pm2 restart staging-backend"

# 重启所有
ssh root@ieclub.online "pm2 restart all"
```

### 资源清理
```powershell
# 使用维护脚本
cd scripts/deployment
.\Server-Maintenance.ps1 -Action clean
```

---

## ⚠️ 常见问题

### 1. 部署后端失败（重启多次）

**原因**：依赖缺失或配置错误

**解决**：
```powershell
# SSH登录服务器
ssh root@ieclub.online

# 检查日志
pm2 logs staging-backend --err --lines 50

# 如果是依赖问题，重新创建软链接
cd /root/IEclub_dev_staging/ieclub-backend
rm -rf node_modules
ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules

# 重启服务
pm2 restart staging-backend
```

### 2. 前端404 Not Found

**原因**：静态文件未正确部署

**解决**：
```powershell
# 重新部署前端
.\Deploy-Staging-Light.ps1 -Target web -Message "修复前端"

# 或手动检查
ssh root@ieclub.online "ls -la /var/www/test.ieclub.online/"
```

### 3. npm install卡住或内存不足

**原因**：2GB内存同时npm install多个项目

**解决**：
```powershell
# 使用轻量部署（测试环境）
.\Deploy-Staging-Light.ps1 -Target all

# 或临时增加swap
ssh root@ieclub.online "
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
"
```

### 4. 测试环境数据库连接失败

**原因**：.env.staging配置错误

**解决**：
```bash
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend

# 复制生产环境配置并修改
cp /root/IEclub_dev/ieclub-backend/.env .env.staging
nano .env.staging

# 确保以下配置正确
NODE_ENV=staging
PORT=3001
REDIS_DB=1

# 保存后重启
pm2 restart staging-backend
```

---

## 📋 部署检查清单

### 部署前
- [ ] 本地代码已测试
- [ ] 代码已提交到GitHub
- [ ] 依赖包已更新（package.json）
- [ ] 环境变量已配置（.env.staging）

### 部署中
- [ ] 脚本执行无错误
- [ ] PM2进程启动成功
- [ ] 健康检查通过

### 部署后
- [ ] 网页可访问（200 OK）
- [ ] API健康检查通过
- [ ] 核心功能测试（登录、注册）
- [ ] PM2进程稳定（0次重启）
- [ ] 资源使用正常（内存<80%，磁盘<70%）

---

## 🛠️ 紧急恢复

如果部署失败或服务器崩溃：

### 方案1：自动恢复（推荐）
```powershell
cd scripts/deployment
.\Server-Recovery.ps1
```

### 方案2：手动恢复
```bash
# SSH登录
ssh root@ieclub.online

# 恢复生产环境
cd /root/IEclub_dev/ieclub-backend
pm2 restart ieclub-backend || \
NODE_ENV=production PORT=3000 pm2 start src/server.js --name ieclub-backend

# 恢复测试环境
cd /root/IEclub_dev_staging/ieclub-backend
pm2 restart staging-backend || \
NODE_ENV=staging PORT=3001 pm2 start src/server-staging.js --name staging-backend

# 检查状态
pm2 list
pm2 logs --lines 20
```

### 方案3：回滚
```bash
# 如果新版本有问题，回滚到备份
ssh root@ieclub.online

# 回滚前端
cd /var/www
mv test.ieclub.online test.ieclub.online.failed
mv test.ieclub.online.backup test.ieclub.online

# 回滚后端
cd /root/IEclub_dev_staging
mv ieclub-backend ieclub-backend.failed
mv ieclub-backend.backup ieclub-backend
pm2 restart staging-backend
```

---

## 📊 性能优化

### 测试环境轻量化策略
1. **共享依赖**：使用软链接，节省~300MB
2. **按需启动**：不用时可关闭
3. **共用数据库**：节省内存和磁盘
4. **日志轮转**：自动清理旧日志

### 资源监控
```bash
# 每周检查一次
ssh root@ieclub.online "
echo '=== 内存 ===' && free -h
echo '=== 磁盘 ===' && df -h | grep vda
echo '=== PM2 ===' && pm2 list
echo '=== 日志大小 ===' && du -sh ~/.pm2/logs
"
```

---

## 🔗 相关文档

- **README.md** - 项目总览
- **REMIND.md** - 快速操作指南（本文核心内容的精简版）
- **PROJECT_FOR_AI.md** - AI开发指南
- **DEVELOPMENT_ROADMAP.md** - 功能规划

---

## 💡 最佳实践

### 部署流程
1. **本地开发** → 测试通过
2. **提交代码** → Push到GitHub
3. **部署测试** → 轻量部署脚本
4. **测试验证** → 完整功能测试
5. **部署生产** → 谨慎操作
6. **监控验证** → 检查日志和性能

### 安全原则
- ❌ 不要在生产环境直接修改代码
- ❌ 不要同时npm install多个项目
- ❌ 不要直接删除node_modules（生产环境）
- ✅ 所有改动先在测试环境验证
- ✅ 重要操作做好备份
- ✅ 定期检查服务器资源

### 故障处理
1. **保持冷静**：不要慌张
2. **查看日志**：`pm2 logs` 找到错误原因
3. **优先恢复**：先恢复服务，再分析问题
4. **使用脚本**：自动化恢复脚本已准备好
5. **记录问题**：更新文档，避免重复

---

**维护团队**: IEClub Dev Team  
**紧急联系**: 查看项目README
