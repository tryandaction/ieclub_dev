# 🚀 IEClub 启动指南

> 本指南帮助你快速启动 IEClub 开发环境

---

## ✅ 问题已修复

### 1. 前端语法错误
- ✅ 修复了 `Activities.jsx` 文件末尾的格式问题
- ✅ 移除了多余的空行

### 2. PowerShell 命令兼容性
- ✅ 创建了 `Start-Services.ps1` 脚本
- ✅ 支持在独立窗口中启动服务
- ✅ 避免了 `&&` 语法问题

### 3. 数据库连接问题
- ✅ 创建了详细的数据库设置指南
- ✅ 提供了多种解决方案（Docker/本地MySQL/SQLite）

---

## 🎯 现在可以启动了！

### 方式 1：一键启动（最简单）

```powershell
.\Start-Services.ps1
```

这会：
- 在新窗口启动后端（端口 3000）
- 在新窗口启动前端（端口 5173）
- 自动打开浏览器

### 方式 2：手动启动

**终端 1 - 后端：**
```powershell
cd ieclub-backend
npm start
```

**终端 2 - 前端：**
```powershell
cd ieclub-web
npm run dev
```

---

## ⚠️ 如果遇到数据库错误

### 错误信息
```
❌ 数据库连接失败: Can't reach database server at `127.0.0.1:3306`
```

### 快速解决

#### 选项 A：使用 Docker（推荐）

1. **安装 Docker Desktop**
   - 下载：https://www.docker.com/products/docker-desktop/
   - 安装后重启电脑
   - 启动 Docker Desktop

2. **启动数据库**
   ```powershell
   cd ieclub-backend
   docker-compose up -d mysql redis
   
   # 等待15秒让数据库启动
   Start-Sleep -Seconds 15
   
   # 初始化数据库
   npm run migrate
   npm run init:rbac
   npm run seed
   ```

3. **重新启动后端**
   ```powershell
   npm start
   ```

#### 选项 B：使用本地 MySQL

1. **安装 MySQL**
   - 下载：https://dev.mysql.com/downloads/mysql/
   - 安装时设置 root 密码

2. **创建数据库**
   ```sql
   CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'ieclub_user'@'localhost' IDENTIFIED BY 'ieclub_user_pass';
   GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **配置环境变量**
   ```powershell
   cd ieclub-backend
   cp .env.example .env
   # 编辑 .env 文件
   ```

4. **初始化数据库**
   ```powershell
   npm run migrate
   npm run init:rbac
   npm run seed
   ```

#### 选项 C：临时使用 SQLite（仅测试）

如果只是想快速测试前端，可以临时使用 SQLite：

1. **修改数据库配置**
   编辑 `ieclub-backend/prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **更新环境变量**
   编辑 `ieclub-backend/.env`：
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **初始化**
   ```powershell
   cd ieclub-backend
   npx prisma generate
   npx prisma migrate dev --name init
   npm run init:rbac
   npm run seed
   ```

---

## 📋 完整启动检查清单

### 前置条件
- [ ] Node.js >= 18.0.0 已安装
- [ ] npm 可用
- [ ] 项目依赖已安装（`npm install`）

### 数据库（选择一项）
- [ ] Docker Desktop 已安装并运行
- [ ] 或：本地 MySQL 已安装并运行
- [ ] 或：使用 SQLite（仅测试）

### 启动步骤
1. [ ] 数据库已启动
2. [ ] 数据库已初始化（migrate + seed）
3. [ ] 后端服务已启动（端口 3000）
4. [ ] 前端服务已启动（端口 5173）
5. [ ] 浏览器可以访问 http://localhost:5173

---

## 🎉 成功标志

### 后端启动成功
```
✅ 路由加载成功
✅ Redis 连接成功
✅ WebSocket服务已启动
🚀 IEclub 后端服务已启动
📍 监听端口: 3000
🌍 环境: development
🔗 API 地址: http://localhost:3000/api
💊 健康检查: http://localhost:3000/health
```

### 前端启动成功
```
VITE v5.4.21  ready in 1295 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 数据库连接成功
访问 http://localhost:3000/health 应该返回：
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

---

## 🔧 常见问题

### 1. PowerShell 不支持 `&&`
```powershell
# ❌ 错误
cd ieclub-web && npm run dev

# ✅ 正确
cd ieclub-web; npm run dev
```

### 2. 端口被占用
```powershell
# 查找占用进程
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 停止进程（管理员权限）
taskkill /PID <进程ID> /F
```

### 3. 依赖安装失败
```powershell
# 清理重装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 📚 相关文档

| 文档 | 用途 |
|------|------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 快速参考卡片 |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | 数据库详细设置 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 完整故障排除 |
| [README.md](README.md) | 项目总览 |

---

## 🆘 仍然有问题？

1. **查看详细日志**
   - 后端：`ieclub-backend/logs/`
   - 浏览器：按 F12 打开控制台
   - Docker：`docker-compose logs -f`

2. **检查环境**
   ```powershell
   node --version  # 应该 >= 18.0.0
   npm --version
   docker --version  # 如果使用 Docker
   ```

3. **完全重置**
   ```powershell
   # 停止所有服务
   # 清理依赖
   cd ieclub-backend
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../ieclub-web
   rm -rf node_modules package-lock.json
   npm install
   
   # 重新启动
   cd ..
   .\Start-Services.ps1
   ```

4. **查看故障排除指南**
   详细解决方案请查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🎯 下一步

启动成功后，你可以：

1. **访问前端**：http://localhost:5173
2. **注册账号**：创建测试用户
3. **探索功能**：话题广场、社区、活动等
4. **查看 API**：http://localhost:3000/api-docs
5. **管理数据库**：`npm run prisma:studio`

---

## 💡 开发提示

### 热重载
- 前端：保存文件后自动刷新
- 后端：使用 `npm run dev` 启用自动重启

### 调试
```javascript
// 前端调试
console.log('Debug:', data)

// 后端调试
logger.info('Debug:', data)
```

### 数据库管理
```powershell
cd ieclub-backend
npm run prisma:studio  # 打开可视化管理界面
```

---

**祝开发顺利！** 🚀

如有问题，请查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 或提交 Issue。

**最后更新**: 2025-11-01

