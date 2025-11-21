# 🎯 IEClub 快速操作指南

## 📌 核心配置

### 测试环境白名单控制

测试环境支持两种邮箱验证模式，通过环境变量切换：

#### 模式1：白名单模式（开启白名单）
```bash
# 在服务器上设置环境变量
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend

# 编辑.env.staging文件
nano .env.staging

# 添加或修改以下行
USE_EMAIL_WHITELIST=true

# 重启服务
pm2 restart staging-backend
```

**特点**：
- ✅ 只允许白名单内的邮箱注册
- ✅ 白名单邮箱可以是任何邮箱（包括非学校邮箱）
- ✅ 适合邀请特定测试人员

#### 模式2：学校邮箱模式（关闭白名单）
```bash
# 在服务器上设置
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend

# 编辑.env.staging文件
nano .env.staging

# 添加或修改以下行
USE_EMAIL_WHITELIST=false
# 或者直接注释掉/删除这一行

# 重启服务
pm2 restart staging-backend
```

**特点**：
- ✅ 只允许学校邮箱注册（sustech.edu.cn, mail.sustech.edu.cn）
- ✅ 与生产环境行为一致
- ✅ 适合模拟真实环境测试

### 管理白名单邮箱

当开启白名单模式时，需要在数据库中添加允许的邮箱：

```bash
# SSH登录服务器
ssh root@ieclub.online

# 进入测试环境目录
cd /root/IEclub_dev_staging/ieclub-backend

# 使用Prisma Studio管理（推荐）
NODE_ENV=staging npx prisma studio

# 或使用SQL直接添加
psql -U postgres -d ieclub_staging
INSERT INTO "EmailWhitelist" (email, status, "createdAt", "updatedAt")
VALUES ('test@example.com', 'approved', NOW(), NOW());
```

## 🚀 常用操作

### 本地开发
```powershell
# 启动后端
cd ieclub-backend
npm run dev          # http://localhost:3000

# 启动前端
cd ieclub-web
npm run dev          # http://localhost:5173
```

### 部署到测试环境
```powershell
# 部署后端
.\scripts\deployment\Deploy-Staging.ps1 -Target backend -Message "更新说明"

# 部署前端
.\scripts\deployment\Deploy-Staging.ps1 -Target web -Message "更新说明"

# 部署全部
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "更新说明"
```

### 部署到生产环境
```powershell
# 需要输入YES确认
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "发布v1.0"
```

### 查看日志
```powershell
# SSH登录服务器
ssh root@ieclub.online

# 查看测试环境日志
pm2 logs staging-backend

# 查看生产环境日志
pm2 logs ieclub-backend

# 查看进程状态
pm2 status
```

## 📖 重要文档

- **README.md** - 项目总览和快速开始
- **DEVELOPMENT_ROADMAP.md** - 开发路线图和功能规划
- **本文档(REMIND.md)** - 常用操作和配置说明

## ⚠️ 注意事项

1. **测试环境白名单**
   - 默认关闭（USE_EMAIL_WHITELIST=false）
   - 修改后需要重启服务才能生效
   - 白名单数据存储在EmailWhitelist表中

2. **环境区别**
   - 开发环境（development）：不限制邮箱
   - 测试环境（staging）：可选白名单或学校邮箱
   - 生产环境（production）：只允许学校邮箱

3. **部署流程**
   - 本地开发 → 本地测试 → 提交代码
   - 部署测试环境 → 测试验证
   - 确认无误 → 部署生产环境

4. **数据库**
   - 测试环境：ieclub_staging（独立）
   - 生产环境：ieclub_production
   - 不会互相影响

## 🔗 访问地址

- 测试环境：https://test.ieclub.online
- 生产环境：https://ieclub.online
- 管理后台：/admin

---

**最后更新**: 2025-11-21 15:18
