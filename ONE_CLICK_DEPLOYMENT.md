# IEClub 一键部署系统 🚀

## 概述

完全自动化的一键部署系统，无需手动干预，自动完成代码提交、构建、上传、部署全流程。

## 特性

✅ **完全自动化** - 无需按 Enter，一键执行到底
✅ **智能错误处理** - 自动跳过非关键错误
✅ **Git 自动提交** - 自动 commit 和 push
✅ **双平台支持** - Web + 小程序 + 后端
✅ **服务器自动部署** - 自动重启 Nginx 和 PM2

## 使用方法

### 基本命令

```powershell
# 部署所有（Web + 小程序 + 后端）
.\Deploy.ps1 -Target "all"

# 仅部署 Web
.\Deploy.ps1 -Target "web"

# 仅部署后端
.\Deploy.ps1 -Target "backend"

# 仅构建小程序
.\Deploy.ps1 -Target "weapp"

# 自定义提交信息
.\Deploy.ps1 -Target "all" -Message "Feature: Add new login page"
```

### 部署流程

```
开始
  ↓
Git Commit & Push ✅
  ↓
构建 Web 前端 ✅
  ↓
上传到服务器 ✅
  ↓
服务器端部署 ✅
  ↓
重启 Nginx ✅
  ↓
构建小程序 ✅
  ↓
上传后端代码 ✅
  ↓
重启 PM2 服务 ✅
  ↓
完成 🎉
```

## 部署目标说明

### 1. Web 前端 (`-Target "web"`)

**执行步骤：**
1. 安装依赖 (`npm install`)
2. 构建生产版本 (`npm run build`)
3. 验证构建产物
4. 打包为 zip
5. 上传到服务器
6. 解压到 `/root/IEclub_dev/ieclub-web/dist`
7. 重启 Nginx

**部署后访问：** https://ieclub.online

### 2. 小程序 (`-Target "weapp"`)

**执行步骤：**
1. 检测原生微信小程序项目
2. 验证 `app.json` 配置
3. 提示使用微信开发者工具上传

**后续操作：**
- 打开微信开发者工具
- 加载项目目录：`ieclub-frontend`
- 点击"上传"按钮
- 提交审核

### 3. 后端 (`-Target "backend"`)

**执行步骤：**
1. 打包后端代码（排除 node_modules）
2. 上传到服务器
3. 解压代码
4. 安装依赖 (`npm install`)
5. 执行数据库迁移 (`prisma migrate deploy`)
6. 重启 PM2 服务
7. 执行健康检查

**API 地址：** https://ieclub.online/api

## 服务器配置

### 服务器信息

```
主机：ieclub.online
端口：22
用户：root
```

### 部署路径

```
项目根目录：/root/IEclub_dev/
Web 前端：   /root/IEclub_dev/ieclub-web/
后端：       /root/IEclub_dev/ieclub-backend/
部署脚本：   /root/IEclub_dev/Deploy_server.sh
```

### Nginx 配置

- 配置文件：`/etc/nginx/sites-available/ieclub.conf`
- Web 根目录：`/root/IEclub_dev/ieclub-web/dist`
- API 反向代理：`http://127.0.0.1:3000`

### PM2 服务

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs ieclub-backend

# 重启服务
pm2 restart ieclub-backend

# 停止服务
pm2 stop ieclub-backend
```

## 常见问题

### 1. 部署后看不到更新？

**解决方案：**
- 按 `Ctrl + F5` 强制刷新浏览器缓存
- 清除浏览器缓存
- 使用无痕模式访问

### 2. API 返回 502 错误？

**检查步骤：**
```bash
# SSH 登录服务器
ssh root@ieclub.online

# 检查 PM2 状态
pm2 status

# 查看后端日志
pm2 logs ieclub-backend --lines 50

# 检查数据库连接
cd /root/IEclub_dev/ieclub-backend
node scripts/check-db.js

# 重启服务
pm2 restart ieclub-backend
```

### 3. Redis 连接失败？

**检查 Redis 服务：**
```bash
# 检查 Redis 状态
redis-cli ping

# 重启 Redis（Docker）
docker restart ieclub-redis

# 查看 Redis 日志
docker logs ieclub-redis
```

### 4. 数据库迁移失败？

**手动执行迁移：**
```bash
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Nginx 报错？

**检查 Nginx 配置：**
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log

# 重启 Nginx
systemctl restart nginx
```

## 部署验证

### 自动验证

脚本会自动执行以下验证：

1. ✅ 检查 `index.html` 是否存在
2. ✅ 验证构建产物完整性
3. ✅ 测试 Nginx 配置
4. ✅ 检查 PM2 进程状态
5. ✅ 执行 API 健康检查

### 手动验证

**Web 前端：**
```bash
# 访问首页
curl -I https://ieclub.online

# 检查资源
curl -I https://ieclub.online/assets/index-*.js
```

**后端 API：**
```bash
# 健康检查
curl https://ieclub.online/api/health

# 测试登录接口
curl -X POST https://ieclub.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 文件结构

```
IEclub_dev/
├── Deploy.ps1                    # Windows 本地部署脚本
├── Deploy_server.sh              # Linux 服务器部署脚本
├── ieclub-web/                   # Web 前端
│   ├── src/                      # 源代码
│   ├── dist/                     # 构建产物
│   └── package.json
├── ieclub-frontend/              # 微信小程序
│   ├── pages/
│   ├── app.json
│   └── app.js
└── ieclub-backend/               # 后端 API
    ├── src/
    ├── prisma/
    └── package.json
```

## 性能优化

### 构建优化

- Vite 生产构建
- 代码压缩和 Tree Shaking
- Gzip 压缩（Nginx）
- 静态资源缓存

### 服务器优化

- PM2 集群模式
- Nginx 反向代理缓存
- Redis 缓存
- 数据库连接池

## 安全措施

1. ✅ HTTPS 加密传输
2. ✅ JWT 身份验证
3. ✅ 环境变量保护
4. ✅ SQL 注入防护
5. ✅ XSS 防护
6. ✅ CORS 配置

## 监控和日志

### 日志位置

**Nginx 日志：**
```
访问日志：/var/log/nginx/access.log
错误日志：/var/log/nginx/error.log
```

**应用日志：**
```
PM2 日志：~/.pm2/logs/
应用日志：/root/IEclub_dev/ieclub-backend/logs/
```

### 日志轮转

- Nginx：logrotate 自动轮转
- 应用：Winston + 日期轮转
- 保留周期：30 天

## 备份策略

### 数据库备份

```bash
# 手动备份
docker exec ieclub-mysql mysqldump -u root -p ieclub_db > backup.sql

# 自动备份（建议设置 cron）
0 2 * * * /root/backup-db.sh
```

### 代码备份

- Git 仓库：GitHub
- 服务器：自动部署备份

## 回滚策略

### 快速回滚

```bash
# 1. SSH 登录服务器
ssh root@ieclub.online

# 2. 切换到项目目录
cd /root/IEclub_dev

# 3. Git 回滚
git log --oneline -10
git reset --hard <commit-hash>

# 4. 重新部署
bash Deploy_server.sh all
```

## 更新日志

### v2.0 (当前版本)
- ✅ 完全自动化部署
- ✅ Git 自动提交推送
- ✅ 智能错误处理
- ✅ 非阻塞式验证
- ✅ 详细的日志输出

### v1.0
- 基础部署功能
- 手动确认步骤
- 简单错误处理

## 技术支持

### 问题反馈

- GitHub Issues：https://github.com/tryandaction/ieclub_dev/issues
- 邮箱：support@ieclub.online

### 文档

- 部署指南：`Deployment_guide.md`
- API 文档：`API_DOCUMENTATION.md`
- 项目概览：`PROJECT_OVERVIEW.md`

## 许可证

MIT License

---

**最后更新：** 2025-10-30
**维护者：** IEClub 开发团队
**版本：** 2.0.0

