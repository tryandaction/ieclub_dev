# IEClub 开发者指南

> **版本**: v1.0  
> **更新日期**: 2025-11-07  
> **适用对象**: 全体开发团队成员

---

## 📚 目录

1. [环境概述](#环境概述)
2. [开发者工作流程](#开发者工作流程)
3. [管理员操作指南](#管理员操作指南)
4. [环境配置详解](#环境配置详解)
5. [部署操作详解](#部署操作详解)
6. [常见问题与故障排除](#常见问题与故障排除)
7. [最佳实践](#最佳实践)

---

## 🌍 环境概述

### 三环境架构

IEClub 项目采用**三环境架构**，确保开发、测试、生产环境的隔离和一致性：

| 环境 | 域名 | 后端端口 | 数据库 | 用途 | 访问权限 |
|------|------|---------|--------|------|---------|
| **开发环境** | localhost | 3000 | `ieclub` | 本地开发调试 | 开发者本地 |
| **测试环境** | test.ieclub.online | 3001 | `ieclub_staging` | 内部测试验证 | 开发团队 |
| **生产环境** | ieclub.online | 3000 | `ieclub` | 正式上线服务 | 所有用户 |

### ⚠️ 重要原则：测试环境 = 生产环境的镜像

**核心原则**：测试环境应该完美反映生产环境，唯一的区别是 URL 多了一个 `test.` 前缀。

#### ✅ 测试环境必须与生产环境保持一致：

1. **代码版本一致**
   - 测试环境部署的代码应该与即将发布到生产环境的代码相同
   - 使用相同的 Git 分支和提交

2. **配置结构一致**
   - 使用相同的环境变量结构
   - 相同的数据库表结构
   - 相同的 API 端点

3. **功能行为一致**
   - 所有功能在测试环境的行为应该与生产环境完全一致
   - 相同的业务逻辑
   - 相同的验证规则

4. **唯一差异**
   - **域名**：`test.ieclub.online` vs `ieclub.online`
   - **端口**：`3001` vs `3000`（仅后端）
   - **数据库**：`ieclub_staging` vs `ieclub`（数据隔离）
   - **PM2 进程名**：`ieclub-backend-staging` vs `ieclub-backend`

#### 🎯 测试环境的作用

- ✅ **功能验证**：在发布前验证新功能是否正常工作
- ✅ **回归测试**：确保新代码不会破坏现有功能
- ✅ **性能测试**：在接近生产环境的环境中测试性能
- ✅ **安全测试**：验证安全配置是否正确
- ✅ **团队协作**：让团队成员可以预览和测试即将发布的功能

#### ⚠️ 测试环境注意事项

- ❌ **不要**在测试环境使用生产数据
- ❌ **不要**在测试环境测试破坏性操作（除非是专门测试）
- ✅ **应该**在测试环境完全验证后再部署到生产环境
- ✅ **应该**定期同步测试环境与生产环境的配置

---

## 👨‍💻 开发者工作流程

### 1. 本地开发环境

#### 1.1 环境准备

**前置要求**：
- Node.js >= 18.0.0
- MySQL >= 8.0（或 Docker）
- Redis >= 7.0（或 Docker）
- Git

**快速启动**：
```powershell
# 在项目根目录
.\scripts\QUICK_START.ps1
```

这会自动启动：
- 后端服务：http://localhost:3000
- 前端服务：http://localhost:5173

#### 1.2 手动启动（可选）

**启动后端**：
```powershell
cd ieclub-backend
npm install          # 首次需要
npm run dev          # 开发模式（热重载）
```

**启动前端**：
```powershell
cd ieclub-web
npm install          # 首次需要
npm run dev          # 开发模式（热重载）
```

**启动管理后台**：
```powershell
cd admin-web
npm install          # 首次需要
npm run dev          # 开发模式（热重载）
# 访问: http://localhost:5174
```

#### 1.3 数据库设置

**创建本地数据库**：
```sql
CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**运行数据库迁移**：
```powershell
cd ieclub-backend
npx prisma migrate dev
```

**生成 Prisma Client**：
```powershell
npx prisma generate
```

#### 1.4 环境变量配置

**后端 `.env` 文件**（`ieclub-backend/.env`）：
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://ieclub_user:your_password@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_dev_secret_key_here
JWT_REFRESH_SECRET=your_dev_refresh_secret_here
```

**前端 `.env.development` 文件**（`ieclub-web/.env.development`）：
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

### 2. 开发工作流

#### 2.1 标准开发流程

```
1. 从 develop 分支创建功能分支
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name

2. 本地开发
   - 编写代码
   - 本地测试
   - 提交代码

3. 推送到远程
   git push origin feature/your-feature-name

4. 创建 Pull Request
   - 在 GitHub 上创建 PR
   - 代码审查
   - 合并到 develop 分支

5. 部署到测试环境
   .\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "功能描述"

6. 测试环境验证
   - 访问 https://test.ieclub.online
   - 完整功能测试
   - 性能测试

7. 部署到生产环境（测试通过后）
   .\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"
```

#### 2.2 Git 分支策略

- **`main`**：生产环境代码，稳定版本
- **`develop`**：开发主分支，最新开发代码
- **`feature/*`**：功能分支，从 develop 创建
- **`hotfix/*`**：紧急修复分支，从 main 创建

#### 2.3 代码提交规范

**提交信息格式**：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型（type）**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：
```
feat(auth): 添加邮箱验证功能

- 实现邮箱验证码发送
- 添加验证码验证逻辑
- 更新相关文档

Closes #123
```

### 3. 测试环境部署

#### 3.1 部署前检查

**运行部署就绪检查**：
```powershell
.\scripts\health-check\Check-Deploy-Ready.ps1
```

这个脚本会检查：
- ✅ Git 状态（是否有未提交更改）
- ✅ 源代码新鲜度
- ✅ 构建产物时效性
- ✅ 是否存在旧的打包文件

**只有通过所有检查后才能部署！**

#### 3.2 部署到测试环境

**部署全部**：
```powershell
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"
```

**仅部署前端**：
```powershell
.\scripts\deployment\Deploy-Staging.ps1 -Target web -Message "更新前端UI"
```

**仅部署后端**：
```powershell
.\scripts\deployment\Deploy-Staging.ps1 -Target backend -Message "修复API bug"
```

**仅部署管理后台**：
```powershell
.\scripts\deployment\Deploy-Staging.ps1 -Target admin -Message "更新管理功能"
```

#### 3.3 测试环境验证

**访问地址**：
- 用户前端：https://test.ieclub.online
- 管理后台：https://test.ieclub.online/admin
- API 文档：https://test.ieclub.online/api-docs
- 健康检查：https://test.ieclub.online/api/health

**验证清单**：
- [ ] 页面能正常加载
- [ ] API 请求成功
- [ ] 登录功能正常
- [ ] 核心功能测试通过
- [ ] 无控制台错误
- [ ] 性能指标正常

#### 3.4 测试环境故障排除

**检查服务状态**：
```bash
ssh root@ieclub.online
pm2 status                    # 查看 PM2 进程
pm2 logs ieclub-backend-staging --lines 50  # 查看日志
```

**重启服务**：
```bash
pm2 restart ieclub-backend-staging
```

**查看 Nginx 日志**：
```bash
tail -f /var/log/nginx/error.log | grep test.ieclub.online
```

### 4. 生产环境部署

#### 4.1 部署前准备

**必须满足的条件**：
- ✅ 功能已在测试环境验证通过
- ✅ 代码已合并到 `main` 分支
- ✅ 所有更改已提交并推送
- ✅ 数据库备份已完成
- ✅ 团队成员已通知

**运行部署就绪检查**：
```powershell
.\scripts\health-check\Check-Deploy-Ready.ps1
```

#### 4.2 部署到生产环境

**⚠️ 重要**：生产部署需要输入 `YES` 确认！

**部署全部**：
```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"
```

脚本会自动执行：
1. 检查当前分支（如果在 develop，会先推送到远程）
2. 切换到 `main` 分支
3. 合并 `develop → main`（--no-ff）
4. 推送到远程 GitHub
5. 部署到生产服务器
6. 自动验证部署结果

**仅部署前端**：
```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target web -Message "更新前端"
```

**仅部署后端**：
```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target backend -Message "修复bug"
```

#### 4.3 生产环境验证

**访问地址**：
- 用户前端：https://ieclub.online
- 管理后台：https://ieclub.online/admin
- API 文档：https://ieclub.online/api-docs
- 健康检查：https://ieclub.online/api/health

**验证清单**：
- [ ] 页面能正常加载
- [ ] API 请求成功
- [ ] 登录功能正常
- [ ] 核心功能正常
- [ ] 性能指标正常
- [ ] PM2 日志无错误

#### 4.4 生产环境监控

**实时监控**：
```bash
ssh root@ieclub.online
pm2 monit                    # 实时监控面板
pm2 logs ieclub-backend      # 实时日志
```

**检查服务状态**：
```bash
pm2 status
curl https://ieclub.online/api/health
```

---

## 👨‍💼 管理员操作指南

### 1. 管理员系统概述

IEClub 管理员系统提供完整的后台管理功能，包括：
- 用户管理（查看、禁用、删除）
- 内容审核（帖子、评论）
- 活动管理
- 公告管理
- 数据统计与可视化
- 系统设置

### 2. 初始化管理员账号

#### 2.1 本地开发环境

**使用初始化脚本**：
```powershell
cd ieclub-backend
npm run init:admin
```

**交互式输入**：
```
请输入超级管理员信息：

用户名: admin
邮箱: admin@ieclub.com
密码: Admin@123456
真实姓名（可选）: 张三
```

**输出示例**：
```
✅ 超级管理员创建成功！

==================================================
ID: clxxx...
用户名: admin
邮箱: admin@ieclub.com
角色: 超级管理员
权限数量: 27
==================================================

请使用以下信息登录管理后台：
  邮箱: admin@ieclub.com
  密码: [您刚才输入的密码]
```

#### 2.2 测试/生产环境

**SSH 到服务器**：
```bash
ssh root@ieclub.online
```

**进入后端目录**：
```bash
# 测试环境
cd /root/IEclub_dev_staging/ieclub-backend

# 生产环境
cd /root/IEclub_dev/ieclub-backend
```

**运行初始化脚本**：
```bash
node scripts/init-admin.js
```

**按提示输入管理员信息**（与本地相同）

### 3. 管理员账号管理

#### 3.1 列出所有管理员

```bash
cd ieclub-backend
node scripts/manage-admin.js list
```

**输出示例**：
```
📋 管理员列表 (共 3 个)

┌─────────────────────────────────────────────────────────────┐
│ ID        │ 用户名  │ 邮箱              │ 角色        │ 状态  │
├─────────────────────────────────────────────────────────────┤
│ clxxx...  │ admin   │ admin@ieclub.com │ super_admin │ ✅   │
│ clyyy...  │ mod1    │ mod1@ieclub.com │ moderator   │ ✅   │
│ clzzz...  │ viewer1 │ v1@ieclub.com   │ viewer      │ ❌   │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2 添加新管理员

```bash
node scripts/manage-admin.js add
```

**交互式输入**：
- 用户名
- 邮箱
- 密码（至少8位，包含大小写字母、数字和特殊字符）
- 角色（super_admin / admin / moderator / viewer）
- 真实姓名（可选）

#### 3.3 删除管理员

```bash
node scripts/manage-admin.js remove admin@example.com
```

**⚠️ 注意**：删除前会要求确认，至少保留一个活跃的超级管理员。

#### 3.4 重置管理员密码

```bash
node scripts/manage-admin.js reset admin@example.com
```

**交互式输入新密码**。

#### 3.5 修改管理员角色

```bash
node scripts/manage-admin.js change-role admin@example.com super_admin
```

**可用角色**：
- `super_admin`：超级管理员（所有权限）
- `admin`：普通管理员（大部分权限）
- `moderator`：协调员（审核内容）
- `viewer`：查看者（只读权限）

#### 3.6 启用/禁用管理员

```bash
node scripts/manage-admin.js toggle admin@example.com
```

### 4. 登录管理后台

#### 4.1 Web 端登录

**访问地址**：
- 测试环境：https://test.ieclub.online/admin
- 生产环境：https://ieclub.online/admin

**登录步骤**：
1. 打开管理后台地址
2. 输入管理员邮箱和密码
3. 点击登录
4. 首次登录后建议修改密码

#### 4.2 本地开发环境

**启动管理后台**：
```powershell
cd admin-web
npm run dev
# 访问: http://localhost:5174
```

**或使用快速启动脚本**：
```powershell
.\scripts\admin\START_ADMIN_NOW.ps1
```

### 5. 管理员功能使用

#### 5.1 用户管理

**功能**：
- 查看用户列表
- 搜索用户
- 查看用户详情
- 禁用/启用用户
- 删除用户
- 查看用户活动记录

**操作步骤**：
1. 登录管理后台
2. 导航到"用户管理"
3. 使用搜索框查找用户
4. 点击用户查看详情
5. 执行相应操作（禁用/删除等）

#### 5.2 内容审核

**功能**：
- 审核帖子
- 审核评论
- 标记违规内容
- 删除内容
- 查看举报

**操作步骤**：
1. 导航到"内容审核"
2. 查看待审核内容列表
3. 点击内容查看详情
4. 选择操作（通过/拒绝/删除）

#### 5.3 活动管理

**功能**：
- 创建活动
- 编辑活动
- 查看活动详情
- 管理报名
- 签到管理
- 活动统计

**操作步骤**：
1. 导航到"活动管理"
2. 点击"创建活动"
3. 填写活动信息
4. 保存并发布

#### 5.4 公告管理

**功能**：
- 创建公告
- 编辑公告
- 发布/撤回公告
- 查看公告列表

**操作步骤**：
1. 导航到"公告管理"
2. 点击"创建公告"
3. 填写公告内容
4. 选择发布范围
5. 保存并发布

#### 5.5 数据统计

**功能**：
- 用户统计
- 内容统计
- 活动统计
- 访问统计
- 数据可视化

**查看方式**：
1. 导航到"数据统计"
2. 选择统计类型
3. 查看图表和数据

### 6. 管理员安全最佳实践

#### 6.1 密码安全

- ✅ 使用强密码（至少12位，包含大小写字母、数字和特殊字符）
- ✅ 定期更换密码（建议每3个月）
- ✅ 不要在多个系统使用相同密码
- ✅ 启用双因素认证（2FA）

#### 6.2 账号安全

- ✅ 使用最小权限原则（只授予必要的权限）
- ✅ 定期审查管理员列表
- ✅ 及时删除不再需要的管理员账号
- ✅ 监控异常登录活动

#### 6.3 操作安全

- ✅ 重要操作前先备份数据
- ✅ 谨慎执行删除操作
- ✅ 记录重要操作的日志
- ✅ 定期查看审计日志

---

## ⚙️ 环境配置详解

### 1. 环境变量配置

#### 1.1 后端环境变量

**开发环境**（`ieclub-backend/.env`）：
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://ieclub_user:password@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret_key_here
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**测试环境**（`ieclub-backend/env.staging.template`）：
```env
NODE_ENV=staging
PORT=3001
DATABASE_URL=mysql://ieclub_user:PASSWORD_HERE@localhost:3306/ieclub_staging
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_THIS_IN_SERVER
JWT_REFRESH_SECRET=CHANGE_THIS_IN_SERVER
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**生产环境**（`ieclub-backend/env.production.template`）：
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://ieclub_user:PASSWORD_HERE@localhost:3306/ieclub
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_THIS_IN_SERVER
JWT_REFRESH_SECRET=CHANGE_THIS_IN_SERVER
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

#### 1.2 前端环境变量

**开发环境**（`ieclub-web/.env.development`）：
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

**测试环境**（`ieclub-web/env.staging.template`）：
```env
VITE_API_BASE_URL=https://test.ieclub.online/api
VITE_APP_ENV=staging
```

**生产环境**（`ieclub-web/env.production.template`）：
```env
VITE_API_BASE_URL=https://ieclub.online/api
VITE_APP_ENV=production
```

### 2. 配置差异对照表

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **后端端口** | 3000 | 3001 | 3000 |
| **数据库名** | ieclub | ieclub_staging | ieclub |
| **PM2 进程名** | - | ieclub-backend-staging | ieclub-backend |
| **域名** | localhost | test.ieclub.online | ieclub.online |
| **NODE_ENV** | development | staging | production |
| **Redis DB** | 0 | 1 | 0 |

### 3. 首次部署配置

#### 3.1 创建测试数据库

```bash
ssh root@ieclub.online
mysql -u root -p

CREATE DATABASE ieclub_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ieclub_staging.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;
exit;
```

#### 3.2 配置服务器环境变量

**测试环境**：
```bash
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend
nano .env

# 修改以下内容：
# - DATABASE_URL 中的密码
# - JWT_SECRET 和 JWT_REFRESH_SECRET（生成强随机密钥）
# - 邮箱和微信配置（如需要）
```

**生产环境**：
```bash
cd /root/IEclub_dev/ieclub-backend
nano .env

# 修改相同的配置项
```

#### 3.3 生成 JWT 密钥

**使用 Node.js 生成**：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**或使用 OpenSSL**：
```bash
openssl rand -hex 32
```

---

## 🚀 部署操作详解

### 1. 部署脚本说明

#### 1.1 测试环境部署脚本

**脚本位置**：`scripts/deployment/Deploy-Staging.ps1`

**功能**：
- 自动构建前端/后端
- 上传文件到服务器
- 配置环境变量
- 重启服务
- 健康检查

**使用方法**：
```powershell
.\scripts\deployment\Deploy-Staging.ps1 -Target <web|admin|backend|all> [-Message "提交信息"]
```

#### 1.2 生产环境部署脚本

**脚本位置**：`scripts/deployment/Deploy-Production.ps1`

**功能**：
- 自动 Git 工作流（develop → main）
- 自动构建和部署
- 安全确认机制
- 自动验证

**使用方法**：
```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target <web|admin|backend|all> [-Message "提交信息"]
```

### 2. 部署流程详解

#### 2.1 测试环境部署流程

```
1. 检查部署就绪
   ↓
2. 构建前端/后端
   ↓
3. 打包文件
   ↓
4. 上传到服务器
   ↓
5. 解压文件
   ↓
6. 配置环境变量（从模板）
   ↓
7. 安装依赖（npm install）
   ↓
8. 运行数据库迁移
   ↓
9. 重启 PM2 服务
   ↓
10. 健康检查
    ↓
11. 完成 ✅
```

#### 2.2 生产环境部署流程

```
1. 检查部署就绪
   ↓
2. 确认部署（输入 YES）
   ↓
3. Git 工作流
   - 检查当前分支
   - 推送到远程（如果在 develop）
   - 切换到 main
   - 合并 develop → main
   - 推送到 GitHub
   ↓
4. 构建前端/后端
   ↓
5. 打包文件
   ↓
6. 上传到服务器
   ↓
7. 解压文件
   ↓
8. 配置环境变量（从模板）
   ↓
9. 安装依赖（npm install）
   ↓
10. 运行数据库迁移
    ↓
11. 重启 PM2 服务
    ↓
12. 健康检查
    ↓
13. 完成 ✅
```

### 3. 部署后验证

#### 3.1 自动验证

部署脚本会自动执行健康检查：
- API 健康检查端点
- 服务状态检查
- 端口监听检查

#### 3.2 手动验证

**检查服务状态**：
```bash
ssh root@ieclub.online
pm2 status
```

**测试 API**：
```bash
curl https://test.ieclub.online/api/health
curl https://ieclub.online/api/health
```

**检查日志**：
```bash
pm2 logs ieclub-backend-staging --lines 50
pm2 logs ieclub-backend --lines 50
```

---

## 🔧 常见问题与故障排除

### 1. 部署相关问题

#### 问题 1：部署脚本执行失败

**症状**：
- 脚本报错退出
- 文件上传失败
- SSH 连接失败

**解决方案**：
1. 检查网络连接
2. 检查 SSH 密钥配置
3. 检查服务器磁盘空间
4. 查看详细错误信息

#### 问题 2：服务启动失败

**症状**：
- PM2 进程状态为 `errored`
- 服务频繁重启

**解决方案**：
```bash
ssh root@ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend  # 或生产环境路径
pm2 logs ieclub-backend-staging --lines 100  # 查看详细错误
npm install                                    # 重新安装依赖
pm2 restart ieclub-backend-staging            # 重启服务
```

#### 问题 3：API 返回 502/503

**症状**：
- 前端无法访问 API
- Nginx 返回 502 Bad Gateway

**解决方案**：
```bash
# 检查后端服务是否运行
pm2 status

# 检查端口监听
netstat -tulpn | grep :3001  # 测试环境
netstat -tulpn | grep :3000  # 生产环境

# 检查 Nginx 配置
nginx -t
systemctl reload nginx
```

### 2. 环境配置问题

#### 问题 4：环境变量未生效

**症状**：
- 配置了环境变量但未生效
- 服务使用默认配置

**解决方案**：
1. 确认 `.env` 文件位置正确
2. 确认文件格式正确（无多余空格）
3. 重启服务：`pm2 restart ieclub-backend-staging`
4. 检查环境变量：`pm2 env ieclub-backend-staging`

#### 问题 5：数据库连接失败

**症状**：
- 服务启动失败
- 日志显示数据库连接错误

**解决方案**：
```bash
# 检查 MySQL 服务
systemctl status mysql

# 测试数据库连接
mysql -u ieclub_user -p -e "SELECT 1"

# 检查环境变量中的数据库 URL
cat .env | grep DATABASE_URL

# 检查数据库是否存在
mysql -u root -p -e "SHOW DATABASES;"
```

### 3. 管理员相关问题

#### 问题 6：无法登录管理后台

**症状**：
- 输入正确密码仍无法登录
- 提示"账号不存在"

**解决方案**：
1. 确认管理员账号已创建
2. 检查账号状态（是否被禁用）
3. 重置密码：`node scripts/manage-admin.js reset <email>`
4. 检查数据库中的管理员记录

#### 问题 7：管理员权限不足

**症状**：
- 某些功能无法访问
- 提示"权限不足"

**解决方案**：
1. 检查管理员角色
2. 升级角色：`node scripts/manage-admin.js change-role <email> super_admin`
3. 检查权限配置

### 4. 性能问题

#### 问题 8：服务响应慢

**症状**：
- API 响应时间长
- 页面加载慢

**解决方案**：
```bash
# 检查系统资源
free -h
df -h
top

# 检查 PM2 进程
pm2 monit

# 检查数据库性能
npm run check:performance
```

#### 问题 9：内存占用过高

**症状**：
- 服务器内存不足
- 服务频繁重启

**解决方案**：
1. 检查内存使用：`free -h`
2. 优化代码（减少内存泄漏）
3. 增加服务器内存
4. 配置 PM2 内存限制

---

## 💡 最佳实践

### 1. 开发最佳实践

#### 1.1 代码规范

- ✅ 遵循项目代码规范
- ✅ 使用 ESLint 检查代码
- ✅ 编写清晰的注释
- ✅ 使用有意义的变量名

#### 1.2 Git 使用

- ✅ 频繁提交（小步快跑）
- ✅ 使用清晰的提交信息
- ✅ 定期同步远程分支
- ✅ 使用 Pull Request 进行代码审查

#### 1.3 测试

- ✅ 本地充分测试后再提交
- ✅ 在测试环境完整验证
- ✅ 编写单元测试
- ✅ 进行回归测试

### 2. 部署最佳实践

#### 2.1 部署前

- ✅ 运行部署就绪检查
- ✅ 确认代码已测试通过
- ✅ 备份数据库（生产环境）
- ✅ 通知团队成员

#### 2.2 部署中

- ✅ 使用自动化脚本
- ✅ 监控部署过程
- ✅ 记录部署日志
- ✅ 保持沟通

#### 2.3 部署后

- ✅ 立即验证部署结果
- ✅ 监控服务状态
- ✅ 检查错误日志
- ✅ 收集用户反馈

### 3. 安全最佳实践

#### 3.1 代码安全

- ✅ 不要提交敏感信息（密码、密钥等）
- ✅ 使用环境变量存储配置
- ✅ 定期更新依赖包
- ✅ 进行安全审计

#### 3.2 服务器安全

- ✅ 使用强密码
- ✅ 定期更新系统
- ✅ 配置防火墙
- ✅ 启用日志监控

#### 3.3 数据安全

- ✅ 定期备份数据库
- ✅ 加密敏感数据
- ✅ 限制数据库访问
- ✅ 监控异常访问

### 4. 监控与维护

#### 4.1 日常监控

- ✅ 检查服务状态（每天）
- ✅ 查看错误日志（每天）
- ✅ 监控系统资源（每天）
- ✅ 检查备份状态（每周）

#### 4.2 定期维护

- ✅ 更新依赖包（每月）
- ✅ 优化数据库（每月）
- ✅ 清理日志文件（每月）
- ✅ 安全审计（每季度）

---

## 📞 获取帮助

### 文档资源

- **快速参考**：[REMIND.md](../../REMIND.md)
- **文档索引**：[docs/INDEX.md](INDEX.md)
- **部署指南**：[docs/deployment/Deployment_guide.md](deployment/Deployment_guide.md)
- **环境配置**：[docs/configuration/ENVIRONMENT_CONFIG.md](configuration/ENVIRONMENT_CONFIG.md)

### 联系方式

- **GitHub Issues**：报告 bug 或提出功能请求
- **团队沟通**：通过团队沟通渠道联系
- **紧急问题**：联系团队负责人

---

## 📝 更新记录

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-07 | v1.0 | 创建开发者指南文档 |

---

**维护人**：开发团队  
**最后更新**：2025-11-07

