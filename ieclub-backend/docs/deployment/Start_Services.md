# 🚀 IEClub 服务启动指南

## 📋 前置条件检查

### 1. 检查数据库状态

```powershell
# 检查 MySQL 服务
Get-Service -Name "*mysql*"

# 或者检查端口
netstat -ano | findstr ":3306"
```

### 2. 启动 MySQL 数据库

#### 方式 1: 使用 Windows 服务
```powershell
# 启动 MySQL 服务
Start-Service MySQL80  # 或者你的 MySQL 服务名

# 验证服务状态
Get-Service MySQL80
```

#### 方式 2: 使用 MySQL 命令行
```bash
# 如果使用 MySQL 安装目录
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
.\mysqld.exe
```

#### 方式 3: 使用 Docker（推荐）
```bash
# 启动 MySQL 容器
docker-compose up -d mysql

# 查看容器状态
docker ps
```

### 3. 检查 Redis 状态

```powershell
# 检查 Redis 端口
netstat -ano | findstr ":6379"
```

#### 启动 Redis

**Windows (使用 WSL 或 Docker):**
```bash
# 使用 Docker
docker run -d -p 6379:6379 redis:latest

# 或使用 WSL
wsl redis-server
```

**Linux/Mac:**
```bash
redis-server
```

## 🚀 启动服务

### 步骤 1: 启动数据库和 Redis

```bash
# 使用 Docker Compose（推荐）
docker-compose up -d

# 验证服务
docker ps
```

### 步骤 2: 应用数据库优化

```powershell
# Windows
cd ieclub-backend
.\apply-optimizations.ps1

# Linux/Mac
cd ieclub-backend
chmod +x apply-optimizations.sh
./apply-optimizations.sh
```

### 步骤 3: 启动后端服务

```bash
cd ieclub-backend

# 开发模式
npm run dev

# 生产模式
npm start
```

### 步骤 4: 启动前端服务

```bash
cd ieclub-web

# 开发模式
npm run dev

# 生产模式
npm run build
npm run preview
```

## 🔍 验证服务

### 1. 检查后端健康状态

```bash
# 健康检查
curl http://localhost:3000/health

# 性能监控
curl http://localhost:3000/performance
```

### 2. 检查前端

访问: http://localhost:10086

### 3. 检查数据库连接

```bash
cd ieclub-backend
node scripts/check-db.js
```

## 🐛 常见问题

### 问题 1: 数据库连接失败

**错误**: `Can't reach database server at 127.0.0.1:3306`

**解决方案**:
1. 确认 MySQL 服务已启动
2. 检查 `.env` 文件中的数据库配置
3. 验证数据库用户名和密码

```bash
# 测试数据库连接
mysql -u root -p -h 127.0.0.1 -P 3306
```

### 问题 2: Redis 连接失败

**错误**: `Redis connection failed`

**解决方案**:
1. 启动 Redis 服务
2. 检查 `.env` 文件中的 Redis 配置
3. 验证 Redis 端口

```bash
# 测试 Redis 连接
redis-cli ping
```

### 问题 3: 端口被占用

**错误**: `Port 3000 is already in use`

**解决方案**:
```powershell
# Windows - 查找占用端口的进程
netstat -ano | findstr ":3000"

# 杀死进程（替换 PID）
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### 问题 4: 依赖安装失败

**解决方案**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 📊 快速启动脚本

### Windows PowerShell 脚本

创建 `start-all.ps1`:

```powershell
# 启动所有服务
Write-Host "🚀 启动 IEClub 服务..." -ForegroundColor Green

# 1. 启动 Docker 服务
Write-Host "`n📦 启动 Docker 容器..." -ForegroundColor Yellow
docker-compose up -d

# 等待服务启动
Start-Sleep -Seconds 5

# 2. 检查数据库
Write-Host "`n🔍 检查数据库连接..." -ForegroundColor Yellow
cd ieclub-backend
node scripts/check-db.js

# 3. 应用优化
Write-Host "`n⚡ 应用优化..." -ForegroundColor Yellow
.\apply-optimizations.ps1

# 4. 启动后端
Write-Host "`n🚀 启动后端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ieclub-backend; npm run dev"

# 5. 启动前端
Write-Host "`n🎨 启动前端服务..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ieclub-web; npm run dev"

Write-Host "`n✅ 所有服务启动完成！" -ForegroundColor Green
Write-Host "前端: http://localhost:10086" -ForegroundColor Cyan
Write-Host "后端: http://localhost:3000" -ForegroundColor Cyan
Write-Host "性能监控: http://localhost:3000/performance" -ForegroundColor Cyan
```

使用方式:
```powershell
.\start-all.ps1
```

### Linux/Mac Bash 脚本

创建 `start-all.sh`:

```bash
#!/bin/bash

echo "🚀 启动 IEClub 服务..."

# 1. 启动 Docker 服务
echo -e "\n📦 启动 Docker 容器..."
docker-compose up -d

# 等待服务启动
sleep 5

# 2. 检查数据库
echo -e "\n🔍 检查数据库连接..."
cd ieclub-backend
node scripts/check-db.js

# 3. 应用优化
echo -e "\n⚡ 应用优化..."
./apply-optimizations.sh

# 4. 启动后端
echo -e "\n🚀 启动后端服务..."
gnome-terminal -- bash -c "cd ieclub-backend && npm run dev; exec bash"

# 5. 启动前端
echo -e "\n🎨 启动前端服务..."
gnome-terminal -- bash -c "cd ieclub-web && npm run dev; exec bash"

echo -e "\n✅ 所有服务启动完成！"
echo "前端: http://localhost:10086"
echo "后端: http://localhost:3000"
echo "性能监控: http://localhost:3000/performance"
```

使用方式:
```bash
chmod +x start-all.sh
./start-all.sh
```

## 🛑 停止服务

### 停止所有服务

```bash
# 停止 Docker 容器
docker-compose down

# 停止 Node.js 进程
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -f node
```

## 📝 环境变量配置

确保 `ieclub-backend/.env` 文件配置正确:

```env
# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/ieclub_db"

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 其他配置...
```

## 🎯 下一步

1. ✅ 访问 http://localhost:3000/health 验证后端
2. ✅ 访问 http://localhost:3000/performance 查看性能
3. ✅ 访问 http://localhost:10086 使用前端
4. ✅ 查看日志文件了解运行状态

---

**最后更新**: 2025-11-02
**版本**: v2.0.0

