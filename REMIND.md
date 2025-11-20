# ⚠️ IEClub 项目重要提醒

> 📌 **最后更新**: 2025-11-09  
> 📌 **项目状态**: ✅ 生产环境和测试环境运行正常  
> 🎉 **最新**: 
> - ✅ 邮箱验证功能完善：生产环境只允许学校邮箱，测试环境支持白名单管理
> - ✅ 测试环境邮件服务修复：与生产环境行为一致，必须真实发送
> - ✅ 完成项目清理和文档精简，脚本系统优化完成

---

## 📋 快速导航

- [服务状态](#服务状态)
- [常用命令](#常用命令)
- [部署流程](#部署流程)
- [故障排查](#故障排查)
- [管理员系统](#管理员系统)
- [邮箱白名单管理](#邮箱白名单管理测试环境)

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
- **API**: https://ieclub.online/api/staging
- **健康检查**: https://ieclub.online/health/staging
- **PM2进程**: staging-backend (端口3001)
- **部署路径**: `/root/IEclub_dev_staging/ieclub-backend`

### 管理员后台
- **访问地址**: https://ieclub.online/admin
- **本地开发**: http://localhost:5174
- **快速启动**: `.\scripts\admin\START_ADMIN_NOW.ps1`

### 小程序
- **AppID**: 略！！！！
- **生产API**: https://ieclub.online/api
- **测试API**: https://test.ieclub.online/api

---

## 🚀 常用命令

### 本地开发

```powershell
# 一键启动后端+Web前端
.\scripts\QUICK_START.ps1

# 启动管理员后台
.\scripts\admin\START_ADMIN_NOW.ps1
```

---

## 👨‍💼 管理员系统

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

### 邮箱白名单管理（测试环境）

**环境行为**：
- **生产环境（production）**: 只允许学校邮箱注册（sustech.edu.cn, mail.sustech.edu.cn）
- **测试环境（staging）**: 学校邮箱可直接注册，其他邮箱需要管理员同意（白名单）
- **开发环境（development）**: 不限制（允许所有邮箱）

**一键操作**：

```bash
# SSH登录服务器
ssh root@ieclub.online

# 进入测试环境项目目录
cd /root/IEclub_dev_staging/ieclub-backend

# === 查看白名单 ===
node scripts/manage-email-whitelist.js list                    # 列出所有白名单
node scripts/manage-email-whitelist.js pending                 # 查看待处理列表

# === 添加邮箱到白名单 ===
node scripts/manage-email-whitelist.js add test@example.com "测试账号"    # 添加（状态: 待处理）
node scripts/manage-email-whitelist.js approve test@example.com          # 批准邮箱
node scripts/manage-email-whitelist.js reject test@example.com "不符合要求"  # 拒绝邮箱
node scripts/manage-email-whitelist.js remove test@example.com           # 移除邮箱

# === 查看帮助 ===
node scripts/manage-email-whitelist.js help
```

**快速操作流程**：
1. 用户尝试用非学校邮箱注册 → 系统提示需要管理员同意
2. 管理员添加邮箱到白名单：`node scripts/manage-email-whitelist.js add user@example.com "用户说明"`
3. 管理员批准邮箱：`node scripts/manage-email-whitelist.js approve user@example.com`
4. 用户现在可以注册了 ✅

**注意事项**：
- 只有测试环境（staging）需要白名单管理
- 生产环境强制要求学校邮箱，无法绕过
- 学校邮箱（sustech.edu.cn, mail.sustech.edu.cn）在测试环境可直接注册，无需白名单

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
# 部署前检查（推荐）
.\scripts\health-check\Check-Deploy-Ready.ps1
```

### 测试环境故障修复

```powershell
# 诊断测试环境（不修复，仅查看）
.\scripts\deployment\Diagnose-Staging.ps1

# 一键修复测试环境所有问题
.\scripts\deployment\Fix-Staging-All.ps1

# 自动修复（跳过确认）
.\scripts\deployment\Fix-Staging-All.ps1 -AutoFix

# 修复后重新部署
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
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

### 测试环境问题

```powershell
# 一键修复测试环境
.\scripts\deployment\Fix-Staging-All.ps1

# 然后重新部署
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
```

### 常见问题

#### 1. SSH连接超时（Clash代理干扰）

如遇到SSH连接问题，通常是代理软件干扰。

**快速解决**：
1. 完全退出Clash（不是关闭系统代理）
2. 重启PowerShell
3. 重新运行部署脚本

📚 **详细指南**: 查看 [Clash代理配置文档](./docs/configuration/CLASH_PROXY_SETUP.md)

#### 2. 服务无法访问
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

#### 3. 数据库连接失败
```bash
# 检查数据库服务
systemctl status mysql

# 测试连接
mysql -u ieclub_user -p

# 检查环境变量
cat .env.production | grep DATABASE_URL
```

#### 4. Nginx问题
```bash
# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 查看日志
tail -f /var/log/nginx/error.log
```

#### 5. PM2进程崩溃
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
