# ⚠️ 重要提醒 - 需要你做的事情

## 🌐 环境说明

IEClub 项目支持三种环境：

| 环境 | 用途 | 访问地址 | 部署方式 |
|------|------|----------|----------|
| **开发环境** | 本地开发调试 | http://localhost:5173 | `npm run dev` |
| **测试环境** | 内部测试验证 | https://test.ieclub.online | `Deploy-Staging.ps1` ⚡ |
| **生产环境** | 正式线上服务 | https://ieclub.online | `Deploy-Production.ps1` 🚀 |

### 部署脚本说明

- **Deploy-Staging.ps1** ⚡ - 测试环境部署
  - 用于内部测试，不影响线上用户
  - 使用独立的测试数据库
  - 执行后团队内部可访问测试版本

- **Deploy-Production.ps1** 🚀 - 生产环境部署
  - 正式发布，所有用户可见
  - 执行后 ieclub.online 和小程序都会更新
  - ⚠️ 需要先在测试环境验证通过

**详细说明**：查看 [环境配置指南](ENVIRONMENT_GUIDE.md) 和 [完整部署指南](docs/deployment/DEPLOYMENT_COMPLETE_GUIDE.md)

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
