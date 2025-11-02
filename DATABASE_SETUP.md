# 🗄️ 数据库启动指南

## 问题诊断

后端启动时出现错误：
```
❌ 数据库连接失败: Can't reach database server at `127.0.0.1:3306`
```

这表示 MySQL 数据库未运行。

---

## 🚀 解决方案

### 方案 1：使用 Docker（推荐）

#### 1.1 安装 Docker Desktop
- 下载地址：https://www.docker.com/products/docker-desktop/
- 安装后重启电脑
- 确保 Docker Desktop 正在运行

#### 1.2 启动数据库
```powershell
# 进入后端目录
cd ieclub-backend

# 启动 MySQL 和 Redis
docker-compose up -d mysql redis

# 等待数据库启动（约15秒）
Start-Sleep -Seconds 15

# 检查容器状态
docker-compose ps
```

#### 1.3 初始化数据库
```powershell
# 运行数据库迁移
npm run migrate

# 初始化 RBAC 权限系统
npm run init:rbac

# （可选）填充示例数据
npm run seed
```

---

### 方案 2：使用本地 MySQL

#### 2.1 安装 MySQL
- 下载地址：https://dev.mysql.com/downloads/mysql/
- 安装时记住 root 密码
- 确保 MySQL 服务正在运行

#### 2.2 创建数据库
```sql
-- 使用 MySQL Workbench 或命令行
CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ieclub_user'@'localhost' IDENTIFIED BY 'ieclub_user_pass';
GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2.3 配置环境变量
编辑 `ieclub-backend/.env`：
```env
# 数据库配置
DATABASE_URL="mysql://ieclub_user:ieclub_user_pass@localhost:3306/ieclub"
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=ieclub_user
MYSQL_PASSWORD=ieclub_user_pass
MYSQL_DATABASE=ieclub
```

#### 2.4 初始化数据库
```powershell
cd ieclub-backend
npm run migrate
npm run init:rbac
npm run seed  # 可选
```

---

### 方案 3：使用 SQLite（开发测试）

如果只是想快速测试，可以临时使用 SQLite：

#### 3.1 修改 Prisma 配置
编辑 `ieclub-backend/prisma/schema.prisma`：
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

#### 3.2 更新环境变量
编辑 `ieclub-backend/.env`：
```env
DATABASE_URL="file:./dev.db"
```

#### 3.3 初始化数据库
```powershell
cd ieclub-backend
npx prisma generate
npx prisma migrate dev --name init
npm run init:rbac
npm run seed
```

---

## ✅ 验证数据库连接

### 方法 1：使用健康检查
```powershell
# 启动后端
cd ieclub-backend
npm start

# 在另一个终端检查健康状态
curl http://localhost:3000/health
```

### 方法 2：使用 Prisma Studio
```powershell
cd ieclub-backend
npm run prisma:studio
# 浏览器会自动打开 http://localhost:5555
```

---

## 🔧 常见问题

### 问题 1：端口 3306 被占用
```powershell
# 查找占用端口的进程
netstat -ano | findstr :3306

# 停止进程（使用管理员权限）
taskkill /PID <进程ID> /F
```

### 问题 2：Docker 启动失败
```powershell
# 清理 Docker 容器
docker-compose down -v

# 重新启动
docker-compose up -d mysql redis
```

### 问题 3：数据库迁移失败
```powershell
# 重置数据库（⚠️ 会删除所有数据）
npm run migrate:reset

# 重新初始化
npm run init:rbac
npm run seed
```

---

## 📝 完整启动流程

```powershell
# 1. 启动数据库（Docker）
cd ieclub-backend
docker-compose up -d mysql redis
Start-Sleep -Seconds 15

# 2. 初始化数据库（首次运行）
npm run migrate
npm run init:rbac
npm run seed

# 3. 启动后端
npm start

# 4. 在新终端启动前端
cd ../ieclub-web
npm run dev
```

---

## 🎯 下一步

数据库启动后：
1. ✅ 后端应该显示：`🚀 IEclub 后端服务已启动`
2. ✅ 前端应该能够正常访问：http://localhost:5173
3. ✅ 可以注册/登录测试账号

如果仍有问题，请查看：
- `ieclub-backend/logs/` - 后端日志
- 浏览器控制台 - 前端错误
- `docker-compose logs -f` - Docker 日志

