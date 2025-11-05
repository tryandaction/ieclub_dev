# ⚠️ IEClub 项目重要提醒

> 📌 **最后更新**: 2025-11-05  
> 📌 **项目状态**: ✅ 测试环境和生产环境均正常运行

---

## 📋 快速导航

- [服务状态](#服务状态)
- [常用命令](#常用命令)
- [部署流程](#部署流程)
- [故障排查](#故障排查)

---

## 🎯 服务状态

### 生产环境
- **访问地址**: https://ieclub.online
- **管理后台**: https://ieclub.online/admin
- **API**: https://ieclub.online/api
- **健康检查**: https://ieclub.online/api/health
- **PM2进程**: ieclub-backend (端口3000)
- **部署路径**: `/root/IEclub_dev/ieclub-backend`

### 测试环境
- **访问地址**: https://test.ieclub.online
- **管理后台**: https://test.ieclub.online/admin
- **API**: https://test.ieclub.online/api
- **健康检查**: https://test.ieclub.online/api/health
- **PM2进程**: staging-backend (端口3001)
- **部署路径**: `/root/IEclub_dev_staging/ieclub-backend`

### 小程序
- **AppID**: wx5c959d4b00c7f61b
- **生产API**: https://ieclub.online/api
- **测试API**: https://test.ieclub.online/api

---

## 🚀 常用命令

### 本地开发

```powershell
# 一键启动所有服务
.\scripts\QUICK_START.ps1
```

### 管理员账号管理

```bash
# SSH登录服务器
ssh root@ieclub.online

# 进入项目目录（选择环境）
cd /root/IEclub_dev/ieclub-backend              # 生产环境
cd /root/IEclub_dev_staging/ieclub-backend      # 测试环境

# === 首次使用：初始化超级管理员 ===
node scripts/init-admin.js

# === 日常操作 ===
node scripts/manage-admin.js list                           # 列出所有管理员
node scripts/manage-admin.js add                            # 添加管理员（交互式）
node scripts/manage-admin.js remove admin@example.com       # 删除管理员
node scripts/manage-admin.js reset admin@example.com        # 重置密码
node scripts/manage-admin.js change-role user@email super_admin  # 修改角色
node scripts/manage-admin.js toggle admin@example.com       # 启用/禁用
node scripts/manage-admin.js help                           # 查看帮助
```

**角色说明**：
- `super_admin` - 超级管理员（所有权限）
- `admin` - 普通管理员（大部分权限）
- `moderator` - 协调员（审核内容）
- `viewer` - 查看者（只读）

### 部署

```powershell
# 部署到测试环境（建议先测试）
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "功能描述"

# 部署到生产环境（谨慎操作）
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "版本说明"

# 只部署后端或前端
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
.\scripts\deployment\Deploy-Staging.ps1 -Target web
```

### 服务器管理

```bash
# SSH登录
ssh root@ieclub.online

# 查看服务状态
pm2 status
pm2 logs ieclub-backend --lines 50      # 生产环境日志
pm2 logs staging-backend --lines 50     # 测试环境日志

# 重启服务
pm2 restart ieclub-backend
pm2 restart staging-backend

# 数据库
mysql -u ieclub_user -p ieclub_production    # 生产数据库
mysql -u ieclub_user -p ieclub_staging       # 测试数据库
```

### 健康检查

```powershell
# 从本地检查服务器健康状态
.\scripts\health-check\Check-Backend-Health.ps1 -Environment production
.\scripts\health-check\Check-Backend-Health.ps1 -Environment staging

# 部署前检查
.\scripts\health-check\Check-Deploy-Ready.ps1
```

---

## 📦 部署流程

### 标准部署步骤

1. **本地测试** → 确保本地运行正常
2. **部署测试环境** → `.\scripts\deployment\Deploy-Staging.ps1 -Target all`
3. **测试环境验证** → 访问 https://test.ieclub.online 测试功能
4. **部署生产环境** → `.\scripts\deployment\Deploy-Production.ps1 -Target all`

### 部署前检查

```powershell
# 运行自动检查
.\scripts\health-check\Check-Deploy-Ready.ps1
```

**手动确认**：
- [ ] 代码已提交到Git
- [ ] 已在测试环境验证
- [ ] 数据库迁移已准备（如需要）
- [ ] 环境变量配置正确

---

## 🔍 故障排查

### 快速诊断

```powershell
# 健康检查
.\scripts\health-check\Check-Backend-Health.ps1 -Environment production
```

### 常见问题

#### 1. 服务无法访问
```bash
# 检查PM2进程
pm2 status
pm2 logs <进程名> --lines 100

# 检查端口
lsof -i :3000    # 生产环境
lsof -i :3001    # 测试环境

# 重启服务
pm2 restart <进程名>
```

#### 2. 数据库连接失败
```bash
# 检查数据库服务
systemctl status mysql

# 测试连接
mysql -u ieclub_user -p

# 检查环境变量
cat .env.production | grep DATABASE_URL
```

#### 3. Nginx问题
```bash
# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 查看日志
tail -f /var/log/nginx/error.log
```

#### 4. PM2进程崩溃
```bash
# 查看错误日志
pm2 logs <进程名> --err --lines 50

# 查看详情
pm2 show <进程名>

# 重启并保存
pm2 restart <进程名>
pm2 save
```

### 紧急恢复

```bash
# 1. 查看日志找问题
pm2 logs ieclub-backend --lines 100

# 2. 重启服务
pm2 restart ieclub-backend

# 3. 如仍有问题，清除缓存
redis-cli FLUSHDB

# 4. 回滚代码（如必要）
cd /root/IEclub_dev/ieclub-backend
git log --oneline -10          # 查看最近提交
git checkout <commit-hash>     # 回滚到指定版本
pm2 restart ieclub-backend
```

---

## ⚙️ 关键配置

### 环境变量

服务器上的环境变量文件：
- 生产环境: `/root/IEclub_dev/ieclub-backend/.env.production`
- 测试环境: `/root/IEclub_dev_staging/ieclub-backend/.env.staging`

关键配置项：
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://ieclub_user:password@localhost:3306/ieclub_production
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

### 目录结构

```
/root/
├── IEclub_dev/                    # 生产环境
│   └── ieclub-backend/
│       ├── .env.production
│       └── ecosystem.config.js
│
└── IEclub_dev_staging/            # 测试环境
    └── ieclub-backend/
        ├── .env.staging
        └── ecosystem.staging.config.js
```

---

## 📚 更多文档

- [文档索引](./docs/INDEX.md) - 所有文档导航
- [部署详细指南](./docs/deployment/Deployment_guide.md) - 完整部署流程
- [邮件配置指南](./docs/configuration/CONFIGURE_REAL_EMAIL.md) - 邮件服务配置

---

**📌 重要提示**: 
- 生产环境操作前务必先在测试环境验证
- 定期备份数据库
- 遇到问题先查看日志和健康检查
