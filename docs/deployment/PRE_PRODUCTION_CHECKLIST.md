# 生产环境部署前检查清单

**版本**: v2.0  
**更新日期**: 2025-11-08  
**重要性**: ⚠️ **必须执行** - 确保生产环境部署成功

---

## 📋 部署前必查项目

### 1. 测试环境验证 ✅

- [x] **测试环境已完成所有修复**
  - [x] API 500 错误已修复
  - [x] 前端路由问题已修复
  - [x] 资源加载问题已修复
  - [x] 注册登录功能正常

- [ ] **测试环境功能验证**
  - [ ] 用户注册流程（发送验证码 → 注册 → 登录）
  - [ ] 用户登录（密码登录 + 验证码登录）
  - [ ] 个人主页访问和编辑
  - [ ] 发布内容功能
  - [ ] 评论和点赞功能
  - [ ] 活动报名和签到

- [ ] **测试环境性能检查**
  - [ ] API 响应时间 < 500ms
  - [ ] 页面加载时间 < 3s
  - [ ] 无内存泄漏
  - [ ] 无 JavaScript 错误

---

### 2. 数据库迁移准备 ⚠️

- [ ] **备份生产数据库**
  ```bash
  ssh root@ieclub.online
  mysqldump -u root -p ieclub > /root/backups/ieclub_backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **验证迁移脚本**
  - [x] 迁移脚本已创建：`20251108_add_profile_fields`
  - [ ] 迁移脚本语法正确（已在测试环境验证）
  - [ ] 迁移脚本包含所有必需字段

- [ ] **检查数据库状态**
  ```bash
  # 检查数据库连接
  mysql -u root -p ieclub -e "SELECT 1;"
  
  # 检查磁盘空间（至少 1GB 可用）
  df -h /var/lib/mysql
  
  # 检查数据库版本
  mysql --version  # 应该是 MySQL >= 8.0
  ```

- [ ] **迁移计划**
  - [ ] 确定迁移执行时间（建议低峰期）
  - [ ] 准备回滚方案
  - [ ] 通知用户可能的短暂维护

---

### 3. 代码同步检查 📦

- [ ] **Git 分支状态**
  ```bash
  # 确保 develop 分支最新
  git checkout develop
  git pull origin develop
  
  # 确保 main 分支最新
  git checkout main
  git pull origin main
  
  # 合并 develop 到 main
  git merge develop
  ```

- [ ] **代码完整性**
  - [x] 前端代码已修复（App.jsx, Layout.jsx, Avatar.jsx）
  - [x] 后端代码已修复（profileController.js, validators.js）
  - [x] Schema 已更新（schema.prisma）
  - [x] 迁移脚本已创建

- [ ] **依赖检查**
  ```bash
  # 后端依赖
  cd ieclub-backend
  npm install
  npm audit
  
  # 前端依赖
  cd ieclub-web
  npm install
  npm audit
  ```

---

### 4. 环境配置验证 🔧

- [ ] **生产环境 .env 文件**
  ```bash
  ssh root@ieclub.online
  cd /root/IEclub_dev/ieclub-backend
  
  # 检查必需的环境变量
  cat .env | grep -E "DATABASE_URL|REDIS_HOST|JWT_SECRET|SENDGRID_API_KEY"
  ```

- [ ] **必需环境变量**
  - [ ] `DATABASE_URL` - 数据库连接
  - [ ] `REDIS_HOST` - Redis 连接
  - [ ] `JWT_SECRET` - JWT 密钥
  - [ ] `SENDGRID_API_KEY` - 邮件服务
  - [ ] `SENDGRID_FROM_EMAIL` - 发件邮箱
  - [ ] `NODE_ENV=production` - 生产环境标识

- [ ] **服务状态检查**
  ```bash
  # MySQL 服务
  systemctl status mysql
  
  # Redis 服务
  systemctl status redis
  
  # Nginx 服务
  systemctl status nginx
  
  # PM2 进程
  pm2 status
  ```

---

### 5. 部署脚本准备 🚀

- [x] **部署脚本已更新**
  - [x] `Deploy_server.sh` - 服务器端部署脚本
  - [x] `Deploy-Production.ps1` - 本地部署脚本（如有）
  - [x] `Deploy-Staging.ps1` - 测试环境部署脚本

- [ ] **脚本权限检查**
  ```bash
  ssh root@ieclub.online
  chmod +x /root/IEclub_dev/docs/deployment/Deploy_server.sh
  ```

- [ ] **部署流程确认**
  1. 备份数据库 ✅
  2. 停止后端服务
  3. 拉取最新代码
  4. 安装依赖
  5. 执行数据库迁移 ⚠️
  6. 重新生成 Prisma Client
  7. 构建前端
  8. 部署前端文件
  9. 启动后端服务
  10. 验证部署

---

### 6. 监控和回滚准备 🔍

- [ ] **监控工具准备**
  - [ ] 准备好查看后端日志：`pm2 logs ieclub-backend`
  - [ ] 准备好查看 Nginx 日志：`tail -f /var/log/nginx/error.log`
  - [ ] 准备好查看 MySQL 日志：`tail -f /var/log/mysql/error.log`

- [ ] **回滚方案**
  - [ ] 数据库备份文件路径记录
  - [ ] 回滚 SQL 脚本准备好
  - [ ] 代码回滚命令准备好：`git reset --hard <commit-hash>`

- [ ] **应急联系**
  - [ ] 技术负责人联系方式
  - [ ] 运维人员联系方式
  - [ ] 数据库管理员联系方式

---

## 🚀 部署执行步骤

### 步骤 1: 备份数据库（必须）

```bash
ssh root@ieclub.online
mysqldump -u root -p ieclub > /root/backups/ieclub_backup_$(date +%Y%m%d_%H%M%S).sql
ls -lh /root/backups/ | tail -1  # 验证备份文件
```

### 步骤 2: 执行部署

**方式 A: 使用服务器端脚本（推荐）**

```bash
ssh root@ieclub.online
cd /root/IEclub_dev
./docs/deployment/Deploy_server.sh all
```

**方式 B: 使用本地 PowerShell 脚本**

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "生产环境部署 2025-11-08"
```

### 步骤 3: 验证部署

```bash
# 1. 检查后端服务
curl -s https://ieclub.online/api/health | jq

# 2. 检查前端访问
curl -I https://ieclub.online

# 3. 检查数据库迁移状态
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend
npx prisma migrate status

# 4. 验证新字段
mysql -u root -p ieclub -e "DESCRIBE users;" | grep coverImage
mysql -u root -p ieclub -e "SHOW TABLES LIKE 'posts';"
```

### 步骤 4: 功能测试

- [ ] 访问 https://ieclub.online
- [ ] 测试用户注册
- [ ] 测试用户登录
- [ ] 测试个人主页访问
- [ ] 测试发布内容
- [ ] 测试评论和点赞

---

## ⚠️ 常见问题和解决方案

### 问题 1: 数据库迁移失败

**症状**: `npx prisma migrate deploy` 报错

**解决方案**:
```bash
# 1. 检查数据库连接
mysql -u root -p ieclub -e "SELECT 1;"

# 2. 检查迁移状态
npx prisma migrate status

# 3. 手动执行迁移 SQL
mysql -u root -p ieclub < prisma/migrations/20251108_add_profile_fields/migration.sql

# 4. 重新生成 Prisma Client
npx prisma generate
```

### 问题 2: 后端服务启动失败

**症状**: PM2 显示服务状态为 "errored"

**解决方案**:
```bash
# 1. 查看错误日志
pm2 logs ieclub-backend --lines 50

# 2. 检查 Node 版本
node --version  # 应该是 v18 或更高

# 3. 检查依赖安装
cd /root/IEclub_dev/ieclub-backend
npm install

# 4. 重启服务
pm2 restart ieclub-backend
```

### 问题 3: 前端显示旧版本

**症状**: 浏览器显示的不是最新版本

**解决方案**:
```bash
# 1. 清除浏览器缓存（Ctrl+F5）

# 2. 检查 Nginx 配置
nginx -t
systemctl reload nginx

# 3. 验证文件部署
ls -la /var/www/ieclub.online/
cat /var/www/ieclub.online/index.html | head -20
```

---

## 📊 部署后监控

### 前 30 分钟监控

```bash
# 实时查看后端日志
pm2 logs ieclub-backend --lines 100

# 实时查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 实时查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 检查系统资源
htop
```

### 性能指标

- [ ] API 响应时间 < 500ms
- [ ] CPU 使用率 < 70%
- [ ] 内存使用率 < 80%
- [ ] 磁盘使用率 < 85%
- [ ] 无 5xx 错误

---

## 🔄 回滚步骤（如需要）

### 1. 回滚数据库

```bash
ssh root@ieclub.online

# 停止后端服务
pm2 stop ieclub-backend

# 恢复数据库备份
mysql -u root -p ieclub < /root/backups/ieclub_backup_YYYYMMDD_HHMMSS.sql

# 启动后端服务
pm2 start ieclub-backend
```

### 2. 回滚代码

```bash
ssh root@ieclub.online
cd /root/IEclub_dev

# 回滚到上一个稳定版本
git log --oneline -10  # 查看提交历史
git reset --hard <commit-hash>

# 重新部署
./docs/deployment/Deploy_server.sh all
```

---

## ✅ 部署完成确认

- [ ] 所有服务正常运行
- [ ] 数据库迁移成功
- [ ] 前端页面正常访问
- [ ] API 端点正常响应
- [ ] 用户功能正常使用
- [ ] 无错误日志
- [ ] 性能指标正常
- [ ] 备份文件已保存

---

## 📝 部署记录

**部署日期**: ___________  
**部署人员**: ___________  
**部署版本**: ___________  
**部署结果**: ⬜ 成功 ⬜ 失败 ⬜ 部分成功  
**遇到的问题**: ___________  
**解决方案**: ___________  
**备注**: ___________

---

## 🔗 相关文档

- [Bug 修复报告](./BUG_FIXES_2025_11_08.md)
- [数据库迁移说明](../../ieclub-backend/prisma/migrations/20251108_add_profile_fields/README.md)
- [部署指南](./Deployment_guide.md)
- [部署验证报告](./DEPLOYMENT_VERIFICATION_REPORT.md)

---

**最后更新**: 2025-11-08  
**维护人员**: AI Assistant  
**状态**: ✅ 已完成

