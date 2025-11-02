# ⚡ 快速参考卡片

## 🚀 启动命令

### 一键启动（推荐）
```powershell
.\Start-Services.ps1
```
在两个独立窗口中启动前端和后端。

### 手动启动

**启动后端：**
```powershell
cd ieclub-backend
npm start
```

**启动前端：**
```powershell
cd ieclub-web
npm run dev
```

**启动数据库（Docker）：**
```powershell
cd ieclub-backend
docker-compose up -d mysql redis
```

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | React Web 应用 |
| 后端 | http://localhost:3000 | API 服务器 |
| 健康检查 | http://localhost:3000/health | 服务状态 |
| Prisma Studio | http://localhost:5555 | 数据库管理 |
| MySQL | localhost:3306 | 数据库 |
| Redis | localhost:6379 | 缓存 |

---

## 📦 常用命令

### 后端命令
```powershell
cd ieclub-backend

npm start              # 启动服务器
npm run dev            # 开发模式（自动重启）
npm run migrate        # 运行数据库迁移
npm run init:rbac      # 初始化权限系统
npm run seed           # 填充示例数据
npm run prisma:studio  # 打开数据库管理界面
npm test               # 运行测试
```

### 前端命令
```powershell
cd ieclub-web

npm run dev            # 启动开发服务器
npm run build          # 构建生产版本
npm run preview        # 预览生产版本
npm run lint           # 代码检查
```

### Docker 命令
```powershell
cd ieclub-backend

docker-compose up -d mysql redis    # 启动数据库
docker-compose ps                   # 查看容器状态
docker-compose logs -f              # 查看日志
docker-compose down                 # 停止容器
docker-compose down -v              # 停止并删除数据
```

---

## 🔧 故障排除

### 数据库连接失败
```powershell
# 启动数据库
cd ieclub-backend
docker-compose up -d mysql redis
Start-Sleep -Seconds 15

# 检查状态
docker-compose ps
```

### 端口被占用
```powershell
# 查找占用进程
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 停止进程（管理员权限）
taskkill /PID <进程ID> /F
```

### 清理重装
```powershell
# 后端
cd ieclub-backend
rm -rf node_modules package-lock.json
npm install

# 前端
cd ieclub-web
rm -rf node_modules package-lock.json
npm install
```

### PowerShell 语法
```powershell
# ❌ 错误（Bash 语法）
cd ieclub-web && npm run dev

# ✅ 正确（PowerShell 语法）
cd ieclub-web; npm run dev
```

---

## 📁 项目结构

```
IEclub_dev/
├── ieclub-web/          # React 前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 通用组件
│   │   └── api/         # API 调用
│   └── package.json
│
├── ieclub-backend/      # Node.js 后端
│   ├── src/
│   │   ├── routes/      # 路由
│   │   ├── controllers/ # 控制器
│   │   └── middleware/  # 中间件
│   ├── prisma/          # 数据库模型
│   └── package.json
│
├── ieclub-frontend/     # 微信小程序
│   ├── pages/           # 小程序页面
│   ├── app.js           # 入口文件
│   └── app.json         # 配置文件
│
└── docs/                # 文档
```

---

## 🔑 环境变量

### 后端 (.env)
```env
# 数据库
DATABASE_URL="mysql://ieclub_user:ieclub_user_pass@localhost:3306/ieclub"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""

# 服务器
PORT=3000
NODE_ENV=development
```

### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 🎯 开发流程

### 1. 首次设置
```powershell
# 1. 克隆项目
git clone <repository>
cd IEclub_dev

# 2. 安装依赖
cd ieclub-backend && npm install
cd ../ieclub-web && npm install

# 3. 配置环境
cd ../ieclub-backend
cp .env.example .env
# 编辑 .env 文件

# 4. 启动数据库
docker-compose up -d mysql redis
Start-Sleep -Seconds 15

# 5. 初始化数据库
npm run migrate
npm run init:rbac
npm run seed

# 6. 启动服务
cd ..
.\Start-Services.ps1
```

### 2. 日常开发
```powershell
# 启动服务
.\Start-Services.ps1

# 开发...

# 提交代码
git add .
git commit -m "feat: 添加新功能"
git push
```

### 3. 数据库更新
```powershell
cd ieclub-backend

# 修改 prisma/schema.prisma

# 创建迁移
npx prisma migrate dev --name <迁移名称>

# 生成客户端
npx prisma generate
```

---

## 📚 文档链接

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目总览 |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | 数据库设置 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 故障排除 |
| [docs/api/](docs/api/) | API 文档 |
| [docs/deployment/](docs/deployment/) | 部署指南 |

---

## 🆘 获取帮助

遇到问题？

1. 查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. 检查日志：`ieclub-backend/logs/`
3. 浏览器控制台（F12）
4. 提交 GitHub Issue

---

**提示**: 将此文件保存为书签，方便快速查阅！

**最后更新**: 2025-11-01

