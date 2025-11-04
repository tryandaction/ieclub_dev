# ⚠️ 重要提醒

## ✅ 测试环境部署成功！(2025-11-04)

**状态**: 🟢 测试环境后端服务运行正常
**服务**: staging-backend (PM2管理，端口3001)
**环境**: staging环境，使用.env.staging配置
**访问**: http://ieclub.online:3001/health

### 🎯 测试环境快速指南

#### 服务管理

```bash
# 查看服务状态
ssh root@ieclub.online "pm2 status"

# 查看日志
ssh root@ieclub.online "pm2 logs staging-backend --lines 50"

# 重启服务
ssh root@ieclub.online "pm2 restart staging-backend"

# 健康检查
curl http://ieclub.online:3001/health
```

#### 部署新版本

```bash
# 从本地上传更新
scp -r ieclub-backend/src root@ieclub.online:/root/IEclub_dev_staging/ieclub-backend/

# 重启服务
ssh root@ieclub.online "pm2 restart staging-backend"
```

#### 服务配置

- **进程名**: staging-backend
- **端口**: 3001
- **环境**: staging (.env.staging)
- **PM2配置**: ecosystem.staging.config.js
- **启动脚本**: server-simple.js (直接加载.env.staging)

---

### 🔧 故障排查

如遇问题，先查看日志：

```bash
ssh root@ieclub.online "pm2 logs staging-backend --lines 50"
```

**快速自动检测修复**：

```powershell
# Windows - 一键检测并修复
.\scripts\Monitor-Staging.ps1 -AutoFix

# 详细报告
.\scripts\Monitor-Staging.ps1 -Detailed
```

**常见问题快速修复**：

```bash
# 服务无响应 → 重启
ssh root@ieclub.online "pm2 restart staging-backend"

# 数据库连接失败 → 检查MySQL
ssh root@ieclub.online "systemctl status mysql && systemctl start mysql"

# 端口占用 → 停止旧进程
ssh root@ieclub.online "pm2 delete staging-backend && pm2 start /root/IEclub_dev_staging/ieclub-backend/ecosystem.staging.config.js"
```

## 🔧 常用命令

### SSH连接
```bash
ssh root@ieclub.online
```

### 服务管理
```bash
pm2 list                          # 查看服务状态
pm2 logs staging-backend          # 查看日志
pm2 restart staging-backend       # 重启服务
```

### 数据库
```bash
mysql -u ieclub_staging -pIEClubYuQoSYpUnL57@2024
```

### DNS问题解决（如果nslookup超时）
你的本地DNS(198.18.0.2)有问题。两种解决方案：

**方案1：修改DNS服务器（推荐）**
```
1. 打开"设置" → "网络和Internet" → "以太网/WiFi"
2. 点击"编辑DNS服务器分配"
3. 选择"手动"
4. IPv4: 8.8.8.8 (Google DNS) 或 223.5.5.5 (阿里DNS)
5. 保存
```

**方案2：直接用IP测试**
```powershell
# 在 C:\Windows\System32\drivers\etc\hosts 添加
47.97.166.201 test.ieclub.online
```

---

## 🚨 首次部署需手动操作（已完成可忽略）

如首次部署，需要做以下三件事：

### 步骤 1：在阿里云添加 DNS 解析 ⚡

1. 登录阿里云控制台：https://dns.console.aliyun.com/
2. 找到域名 `ieclub.online`
3. 添加一条新的 DNS 记录：
   - **记录类型**：A
   - **主机记录**：test
   - **记录值**：39.108.160.112
   - **TTL**：10分钟（默认）
   - **线路类型**：默认

4. 点击"确认"保存

### 步骤 2：等待 DNS 生效并申请 SSL 证书 ⏳

DNS 解析通常需要 5-30 分钟生效。等待期间，你可以这样检查：

```powershell
# 在本地 PowerShell 中运行
nslookup test.ieclub.online

# 如果看到 39.108.160.112，说明 DNS 已生效
```

DNS 生效后，SSH 到服务器申请 SSL 证书：

```bash
# SSH 连接到服务器
ssh root@ieclub.online

# 申请 SSL 证书
certbot certonly --webroot -w /var/www/certbot -d test.ieclub.online

# 证书申请成功后，恢复完整的 HTTPS 配置
mv /etc/nginx/sites-available/test.ieclub.online.full /etc/nginx/sites-available/test.ieclub.online
nginx -t
systemctl reload nginx

# 退出 SSH
exit
```

### 步骤 3：配置测试环境数据库 🗄️

测试环境需要独立的数据库，SSH 到服务器执行：

```bash
# SSH 连接到服务器
ssh root@ieclub.online

# 连接 MySQL（需要你提供 root 密码）
mysql -u root -p

# 在 MySQL 中执行以下命令：
```

```sql
-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS ieclub_staging 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建测试数据库用户
DROP USER IF EXISTS 'ieclub_staging_user'@'localhost';
CREATE USER 'ieclub_staging_user'@'localhost' IDENTIFIED BY 'IEclub2024Staging!';

-- 授予权限
GRANT ALL PRIVILEGES ON ieclub_staging.* TO 'ieclub_staging_user'@'localhost';
FLUSH PRIVILEGES;

-- 验证
SHOW DATABASES LIKE 'ieclub%';

-- 退出 MySQL
EXIT;
```

然后更新测试环境后端配置：

```bash
# 进入测试环境目录
cd /opt/ieclub-staging

# 创建正确的 .env 文件
cat > .env <<'EOF'
# 测试环境配置
NODE_ENV=staging
PORT=3001

# 数据库配置
DATABASE_URL="mysql://ieclub_staging_user:IEclub2024Staging!@localhost:3306/ieclub_staging"

# JWT 配置
JWT_SECRET="ieclub-staging-jwt-secret-2024-test-environment"

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=debug

# 其他配置
CORS_ORIGIN=https://test.ieclub.online
EOF

# 运行数据库迁移
npm run prisma:migrate:deploy

# 重启测试环境后端
pm2 restart staging-backend

# 查看状态
pm2 status

# 退出 SSH
exit
```

### ✅ 完成！

完成上述三个步骤后，访问：
- **前端**：https://test.ieclub.online
- **API**：https://test.ieclub.online/api/health

如果一切正常，你会看到测试环境的页面和 API 响应。

---

## 🌐 环境说明

IEClub 项目支持三种环境：

| 环境 | 用途 | 访问地址 | 部署方式 |
|------|------|----------|----------|
| **开发环境** | 本地开发调试 | http://localhost:5173 | `npm run dev` |
| **测试环境** | 内部测试验证 | https://test.ieclub.online | `Deploy-Staging.ps1` ⚡ |
| **生产环境** | 正式线上服务 | https://ieclub.online | `Deploy-Production.ps1` 🚀 |

### 部署脚本说明

#### 测试环境部署 ⚡
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy-Staging.ps1 -Target all -Message "测试"
```
- ✅ **自动执行**，无需确认
- 用于内部测试，不影响线上用户
- 使用独立的测试数据库（端口 3001）
- 执行后团队内部可访问 https://test.ieclub.online

#### 生产环境部署 🚀
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\Deploy-Production.ps1 -Target all -Message "正式发布"
```
- ⚠️ **需要输入 'YES' 确认**（安全机制）
- 正式发布，所有用户可见
- 执行后 https://ieclub.online 和小程序都会更新
- ⚠️ 必须先在测试环境验证通过

**详细说明**：查看 [完整部署指南](docs/deployment/Deployment_guide.md)

---

## 🚀 快速启动（本地开发）

**环境已经配置完成！** 以下是启动本地开发环境的步骤：

### 1. 启动数据库服务（MySQL + Redis）

```powershell
cd C:\universe\GitHub_try\IEclub_dev\ieclub-backend
docker-compose up -d mysql redis
```

### 2. 启动后端服务

```powershell
cd C:\universe\GitHub_try\IEclub_dev\ieclub-backend
npm run dev
```

后端将运行在：http://localhost:3000

### 3. 启动前端服务

```powershell
cd C:\universe\GitHub_try\IEclub_dev\ieclub-web
npm run dev
```

前端将运行在：http://localhost:5173

### 4. 验证服务

- 后端健康检查：http://localhost:3000/api/health
- 前端页面：http://localhost:5173

---

## 🎯 原问题（已解决）

你的系统没有安装 MySQL 数据库，项目无法启动。

**✅ 已通过 Docker 解决**

---

## ✅ 解决方案

### 方案 A：使用 Docker（强烈推荐）

#### 为什么选 Docker？
- ✅ 一键搞定所有环境（MySQL + Redis + 后端）
- ✅ 零配置，不用手动设置
- ✅ 环境隔离，卸载干净
- ✅ 团队统一环境

#### 步骤

**1. 安装 Docker Desktop**

下载：https://www.docker.com/products/docker-desktop/

- 下载 Windows 版本
- 双击安装
- 重启电脑
- 打开 Docker Desktop，等图标变绿

**详细教程**：查看 `INSTALL_DOCKER.md`

**2. 启动项目**

```powershell
# 运行一键启动脚本
cd C:\universe\GitHub_try\IEclub_dev
.\QUICK_START.ps1
```

脚本会自动：
- 检测 Docker
- 配置环境
- 启动所有服务
- 验证状态

**3. 验证**

访问：http://localhost:3000/api/health

看到 `{"status":"ok"}` 就成功了！

#### 常用命令

```powershell
cd ieclub-backend

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart
```

---

### 方案 B：手动安装 MySQL 和 Redis

#### 适合谁？
- 已经安装了 XAMPP/WAMP
- 不想用 Docker
- 想要更多控制权

#### 步骤

**1. 安装 MySQL**

**选项 1：XAMPP（推荐）**

1. 下载：https://www.apachefriends.org/
2. 安装后打开 XAMPP Control Panel
3. 点击 MySQL 的 "Start" 按钮

**选项 2：MySQL 官方版**

1. 下载：https://dev.mysql.com/downloads/mysql/
2. 安装时设置 root 密码（记住它！）
3. 安装完成后 MySQL 自动启动

**2. 安装 Redis**

**选项 1：Memurai（Windows 版 Redis）**

1. 下载：https://www.memurai.com/get-memurai
2. 安装后自动启动

**选项 2：WSL2 + Redis**

```powershell
# 安装 WSL2
wsl --install

# 重启电脑后
wsl
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**3. 创建数据库**

```sql
-- 连接 MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 可选：创建专用用户
CREATE USER 'ieclub_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**4. 配置环境**

```powershell
cd ieclub-backend

# 运行配置脚本
.\setup-env.ps1

# 选择 "2" (Manual)
# 输入你的数据库信息
```

**5. 启动项目**

```powershell
# 安装依赖（首次）
npm install

# 启动服务
npm run dev
```

**6. 验证**

访问：http://localhost:3000/api/health

---

## 🎯 我的建议

| 情况 | 推荐方案 |
|------|---------|
| 什么都没装 | **方案 A（Docker）** ⭐⭐⭐ |
| 已经有 XAMPP | 方案 B（用 XAMPP） |
| 是开发者 | **方案 A（Docker）** ⭐⭐⭐ |
| 团队协作 | **方案 A（Docker）** ⭐⭐⭐ |

**90% 的情况下，Docker 是最好的选择！**

---

## 🐛 常见问题

### Docker 相关

**Q: Docker Desktop 无法启动**

A: 
1. 确保已启用 WSL 2：`wsl --install`
2. 重启电脑
3. 以管理员身份运行 Docker Desktop
4. 查看 `INSTALL_DOCKER.md` 故障排查部分

**Q: 容器启动失败**

A:
```powershell
# 查看详细日志
cd ieclub-backend
docker-compose logs

# 重新启动
docker-compose down
docker-compose up -d
```

**Q: 端口被占用**

A:
```powershell
# 找到占用端口的进程
netstat -ano | findstr ":3306"
netstat -ano | findstr ":6379"
netstat -ano | findstr ":3000"

# 结束进程
taskkill /PID <进程ID> /F
```

### MySQL 相关

**Q: 连接失败**

A:
1. 确认 MySQL 运行：`netstat -ano | findstr ":3306"`
2. 检查 `.env` 文件中的密码
3. 确认数据库 `ieclub` 已创建

**Q: 忘记 root 密码**

A: 
- XAMPP：默认没有密码，直接 `mysql -u root`
- 官方版：需要重置密码，搜索"MySQL reset root password"

### Redis 相关

**Q: Redis 连接失败**

A:
1. 确认 Redis 运行：`netstat -ano | findstr ":6379"`
2. 如果用 WSL：确保 WSL 正在运行
3. 如果没装：用 Docker 方案或安装 Memurai

---

## 📚 相关文档

- **INSTALL_DOCKER.md** - Docker 完整安装教程
- **QUICK_START.ps1** - 一键启动脚本
- **ieclub-backend/QUICK_START.md** - 后端详细文档
- **docs/STAGING_MONITORING.md** - 测试环境监控指南 ✨新增
- **docs/deployment/Deployment_guide.md** - 完整部署指南
- **STAGING_DEPLOYMENT_SUCCESS.md** - 测试环境部署成功文档
- **README.md** - 项目总览

---

## 🎉 总结

### 最简单的方式

```powershell
# 1. 安装 Docker Desktop
# https://www.docker.com/products/docker-desktop/

# 2. 运行一键启动
.\QUICK_START.ps1

# 3. 访问验证
# http://localhost:3000/api/health

# 完成！
```

### 需要帮助？

1. 先看 `INSTALL_DOCKER.md`（Docker 方案）
2. 或看上面的"方案 B"（手动安装）
3. 遇到错误看"常见问题"部分

**就这么简单！** 🚀

---

## 🔍 测试环境监控工具

为了确保测试环境稳定运行，我们提供了自动化监控脚本。

### 监控功能

监控脚本会检查以下项目：
- ✅ 后端健康检查（Health Check）
- ✅ PM2 进程状态
- ✅ 进程重启次数
- ✅ 内存和 CPU 使用情况

### 使用方法

```powershell
# Windows - 基础检查
.\scripts\Monitor-Staging.ps1

# Windows - 推荐（自动修复+持续监控）
.\scripts\Monitor-Staging.ps1 -AutoFix -Continuous

# Linux/Mac - 基础检查
./scripts/monitor-staging.sh

# Linux/Mac - 推荐
./scripts/monitor-staging.sh --auto-fix --continuous
```

或直接双击：`scripts\start-monitor.bat`

### 自动化部署

**Windows任务计划（每5分钟）**：
```
程序: powershell.exe
参数: -ExecutionPolicy Bypass -File "路径\scripts\Monitor-Staging.ps1" -AutoFix
```

**Linux Cron（每5分钟）**：
```bash
*/5 * * * * /path/to/scripts/monitor-staging.sh --auto-fix >> /var/log/staging-monitor.log 2>&1
```

### 故障排查

| 问题 | 解决方法 |
|------|---------|
| SSH连接失败 | `ssh root@ieclub.online` 测试连接 |
| 健康检查失败 | `ssh root@ieclub.online "pm2 logs staging-backend"` |
| 权限错误(Linux) | `chmod +x scripts/monitor-staging.sh` |

日志：`logs/staging-monitor.log`
