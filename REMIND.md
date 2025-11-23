# 🎯 IEClub 快速操作指南

## ⚠️ 核心开发原则

### 🔄 双端同步开发（必须遵守！）
**任何功能开发必须同时在网页和小程序实现**

- **网页端**：`ieclub-web/` - React 应用（必须响应式设计）
- **小程序端**：`ieclub-frontend/` - 微信小程序

**开发流程**：后端 API → 网页端实现 → 小程序端实现 → 双端测试验证

详见：[`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md)

---

##  日常开发流程（精简版）

### 1️⃣ 本地开发 + 测试
```powershell
# 后端
cd ieclub-backend
npm run dev          # http://localhost:3000

# 前端
cd ieclub-web
npm run dev          # http://localhost:5173

# 小程序（微信开发者工具）
# 1. 导入项目：ieclub-frontend
# 2. 详情 -> 本地设置 -> 不校验合法域名
# 3. 编译 -> 查看效果（Ctrl+R刷新）
# ⚠️ 如遇域名错误：确保 app.js 中 apiBase 为 https://www.ieclub.online/api（带www）

# 测试通过后提交
git add .
git commit -m "功能描述"
git push origin develop
```

### 2️⃣ 部署到生产环境

**⚠️ 当前建议：手动部署**
```powershell
# 1. 更新代码
ssh root@ieclub.online "cd /root/IEclub_dev && git pull origin main"

# 2. 重启服务
ssh root@ieclub.online "pm2 restart ieclub-backend && pm2 save"

# 3. 检查状态
ssh root@ieclub.online "pm2 status && pm2 logs ieclub-backend --lines 20"
```

**自动化部署脚本（谨慎使用）**

**⭐ 推荐方式 - 使用极简安全检查（避免断网）**:
```powershell
# 使用极简健康检查（只检查内存和磁盘，不会触发网络安全策略）
cd scripts\deployment
.\Deploy-Production.ps1 -Target all -Message "更新说明" -MinimalHealthCheck -SkipGitPush
```

**备选方式 - 完全跳过健康检查**:
```powershell
# 适用于紧急部署或已确认服务器状态良好的情况
cd scripts\deployment
.\Deploy-Production.ps1 -Target all -Message "更新说明" -SkipHealthCheck -SkipGitPush


### 3️⃣ 调试500错误

**当前Auth/Topics等API返回500错误**：
```powershell
# 查看详细错误日志
ssh root@ieclub.online "pm2 logs ieclub-backend --lines 100 | grep -i error"

# 测试数据库连接
ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && npx prisma db pull"

# 检查表结构
ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && npx prisma studio"
```

### 4️⃣ 查看服务器状态
```powershell
# 登录服务器
ssh root@ieclub.online

# 查看进程
pm2 list

# 查看日志（最近50行）
pm2 logs ieclub-backend --lines 50

# 查看资源
free -h && df -h
```

### ⚠️ 关于测试环境
- **状态**：已永久关闭
- **原因**：2GB服务器无法同时运行生产+测试环境
- **测试方式**：本地开发环境充分测试 → 谨慎部署生产
- **未来**：服务器升级4GB或独立测试服务器后再启用

## 重要文档

- **README.md** - 项目总览和快速开始
- **本文档(REMIND.md)** - 常用操作快速参考
- **docs/DEPLOYMENT_GUIDE.md** - 完整部署指南（必读）
- **DEVELOPMENT_ROADMAP.md** - 开发路线图
- **PROJECT_FOR_AI.md** - AI开发指南

## ⚠️ 重要提醒

1. **部署流程（新）**
   - 本地开发 → 本地充分测试 → 提交代码 → 直接部署生产
   - ⚠️ 不再使用测试环境，务必本地测试彻底
   - 建议：每次改动小，部署快，降低风险

2. **当前环境**
   - 生产环境：✅ https://ieclub.online （正常运行）
   - 测试环境：❌ 已永久关闭（资源限制）

3. **生产环境配置**
   - 只允许学校邮箱注册（@sustech.edu.cn）
   - 数据库：MySQL ieclub_production
   - Redis：DB 0

## 🔗 访问地址

- **生产环境**：https://ieclub.online ✅ 正常运行
- ~~测试环境~~：https://test.ieclub.online ❌ 已关闭
- 管理后台：/admin

---

## 🚨 故障恢复

如果服务器出问题或部署失败：
```powershell
# 自动恢复脚本
cd scripts\deployment
.\Server-Recovery.ps1
```

**详细故障处理**: 见 docs/DEPLOYMENT_GUIDE.md

---

**最后更新**: 2025-11-22 14:05  
**当前状态**: 生产环境正常，测试环境已关闭（资源限制）
