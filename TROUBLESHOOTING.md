# 🔧 故障排除指南

## 常见问题及解决方案

### 1. 数据库连接失败

#### 错误信息
```
❌ 数据库连接失败: Can't reach database server at `127.0.0.1:3306`
```

#### 解决方案

**A. 使用 Docker（推荐）**
```powershell
cd ieclub-backend
docker-compose up -d mysql redis
Start-Sleep -Seconds 15  # 等待启动
```

**B. 检查本地 MySQL**
```powershell
# 检查端口是否开放
Test-NetConnection -ComputerName localhost -Port 3306

# 如果失败，启动 MySQL 服务
net start MySQL80  # 或你的 MySQL 服务名
```

**C. 详细指南**
查看 [DATABASE_SETUP.md](DATABASE_SETUP.md) 获取完整的数据库设置指南。

---

### 2. PowerShell 命令语法错误

#### 错误信息
```
错误："&&"不是此版本中的有效语句分隔符
```

#### 原因
PowerShell 不支持 `&&` 操作符（这是 Bash 语法）。

#### 解决方案

**错误写法：**
```powershell
cd ieclub-web && npm run dev  # ❌ 不支持
```

**正确写法：**
```powershell
# 方法1：使用分号
cd ieclub-web; npm run dev

# 方法2：分两行
cd ieclub-web
npm run dev

# 方法3：使用启动脚本
.\Start-Services.ps1  # ✅ 推荐
```

---

### 3. 前端语法错误

#### 错误信息
```
Expected ")" but found "useEffect"
```

#### 解决方案

这通常是文件末尾有多余空行或格式问题。已修复，请拉取最新代码：

```powershell
git pull origin main
```

如果问题仍然存在：
```powershell
cd ieclub-web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### 4. Docker 未安装或未启动

#### 错误信息
```
docker: 无法将"docker"识别为 cmdlet
```

#### 解决方案

**A. 安装 Docker Desktop**
1. 下载：https://www.docker.com/products/docker-desktop/
2. 安装并重启电脑
3. 启动 Docker Desktop
4. 等待 Docker 引擎启动（右下角图标变绿）

**B. 使用本地数据库**
如果不想安装 Docker，可以使用本地 MySQL。参考 [DATABASE_SETUP.md](DATABASE_SETUP.md) 的方案2。

---

### 5. 端口被占用

#### 错误信息
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解决方案

**查找占用端口的进程：**
```powershell
# 查找端口 3000
netstat -ano | findstr :3000

# 查找端口 5173
netstat -ano | findstr :5173
```

**停止进程：**
```powershell
# 使用管理员权限
taskkill /PID <进程ID> /F
```

---

### 6. npm 依赖安装失败

#### 错误信息
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

#### 解决方案

```powershell
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 如果仍然失败，使用 --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### 7. Prisma 相关错误

#### 错误信息
```
PrismaClientInitializationError
```

#### 解决方案

```powershell
cd ieclub-backend

# 重新生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 如果需要重置数据库
npx prisma migrate reset  # ⚠️ 会删除所有数据
```

---

### 8. 环境变量未配置

#### 错误信息
```
Missing environment variable: DATABASE_URL
```

#### 解决方案

```powershell
cd ieclub-backend

# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填写正确的配置
notepad .env
```

必需的环境变量：
```env
DATABASE_URL="mysql://ieclub_user:ieclub_user_pass@localhost:3306/ieclub"
JWT_SECRET="your-secret-key"
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

### 9. Redis 连接失败

#### 错误信息
```
Redis connection failed
```

#### 解决方案

**A. 使用 Docker**
```powershell
cd ieclub-backend
docker-compose up -d redis
```

**B. 安装本地 Redis**
Windows 用户可以使用 WSL2 或下载 Redis for Windows：
- https://github.com/microsoftarchive/redis/releases

**C. 临时禁用 Redis**
如果只是测试，可以在 `.env` 中设置：
```env
REDIS_ENABLED=false
```

---

### 10. 微信开发者工具相关

#### 问题：小程序编译失败

**解决方案：**
1. 确保使用最新版本的微信开发者工具
2. 检查 `project.config.json` 配置
3. 清除缓存：工具 -> 清除缓存 -> 全部清除
4. 重新编译

#### 问题：网络请求失败

**解决方案：**
1. 在开发者工具中：详情 -> 本地设置 -> 勾选"不校验合法域名"
2. 确保后端服务正在运行（http://localhost:3000）
3. 检查 `app.js` 中的 `apiBaseUrl` 配置

---

## 🆘 获取帮助

如果以上方案都无法解决问题：

1. **查看日志**
   - 后端日志：`ieclub-backend/logs/`
   - 浏览器控制台（F12）
   - Docker 日志：`docker-compose logs -f`

2. **检查系统要求**
   - Node.js >= 18.0.0
   - MySQL >= 8.0
   - Redis >= 7.0
   - 足够的磁盘空间（>2GB）

3. **重新安装**
   ```powershell
   # 完全清理
   rm -rf node_modules package-lock.json
   
   # 重新安装依赖
   npm install
   ```

4. **联系开发团队**
   - 提交 Issue 到 GitHub
   - 提供错误日志和系统信息
   - 描述复现步骤

---

## 📚 相关文档

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - 数据库设置详细指南
- [README.md](README.md) - 项目总览
- [docs/deployment/](docs/deployment/) - 部署文档
- [docs/api/](docs/api/) - API 文档

---

## 🔍 调试技巧

### 后端调试
```powershell
# 启用详细日志
$env:LOG_LEVEL="debug"
npm start

# 使用 nodemon 自动重启
npm run dev
```

### 前端调试
```javascript
// 在浏览器控制台
localStorage.setItem('debug', 'true')

// 查看 API 请求
// 打开 Network 标签页
```

### 数据库调试
```powershell
# 使用 Prisma Studio
cd ieclub-backend
npm run prisma:studio

# 直接连接 MySQL
mysql -u ieclub_user -p ieclub
```

---

**最后更新**: 2025-11-01

