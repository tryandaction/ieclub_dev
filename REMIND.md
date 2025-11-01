# 🎯 IEclub 开发提醒

**更新时间**: 2025-11-01  
**项目状态**: ✅ 生产环境运行中

---

## 🚀 快速部署

### 部署到服务器 (39.108.160.112)

```powershell
# 部署全部（网页 + 后端）
.\Deploy.ps1 -Target "all" -Message "更新描述"

# 只部署网页
.\Deploy.ps1 -Target "web"

# 只部署后端
.\Deploy.ps1 -Target "backend"
```

**线上地址**:
- 🌐 网站: https://ieclub.online
- 🔌 API: https://ieclub.online/api
- 📱 小程序: 微信开发者工具打开 `ieclub-frontend/`

---

## 💻 本地开发

### 启动开发环境

```bash
# 1. 启动数据库 (Docker)
cd ieclub-backend
docker-compose up -d mysql redis

# 2. 启动后端
npm run dev

# 3. 启动前端 (新终端)
cd ieclub-web
npm run dev
```

**访问地址**:
- 前端: http://localhost:5173
- 后端: http://localhost:3000

---

## 📋 系统功能

### ✅ 已上线功能
- 用户认证系统 (注册/登录/JWT)
- 社区广场 (发帖/评论/点赞)
- 活动管理 (创建/报名/签到)
- 积分系统 (等级/勋章/签到/排行榜)
- RBAC 权限系统 (5 种角色，60+ 权限)
- 管理后台 (用户/内容/系统管理)
- 备份恢复系统 (自动备份，定时清理)
- 通知系统 (站内消息/邮件通知)

### 🔧 待优化功能
- [ ] 前端权限控制 UI 优化
- [ ] 更多路由集成权限检查
- [ ] 监控告警系统配置
- [ ] 性能优化和缓存策略

---

## 📚 文档导航

- [项目主页](README.md)
- [部署指南](docs/deployment/Deployment_guide.md)
- [API 文档](docs/API_Reference.md)
- [RBAC 指南](ieclub-backend/docs/guides/RBAC_Guide.md)
- [管理员指南](ieclub-backend/docs/admin/Admin_guide.md)
- [备份指南](ieclub-backend/docs/guides/Backup_guide.md)

---

## 🛠️ 常用命令

### 后端命令
```bash
npm run dev          # 开发模式
npm run start        # 生产模式
npm run migrate      # 运行数据库迁移
npm run init:rbac    # 初始化 RBAC 系统
npm run check:db     # 检查数据库连接
npm run lint         # 代码检查
npm test             # 运行测试
```

### 前端命令
```bash
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # 代码检查
```

---

## 🔐 环境配置

后端需要配置 `.env` 文件，参考 `ieclub-backend/.env.example`

**必需配置**:
- `DATABASE_URL` - MySQL 数据库连接
- `JWT_SECRET` - JWT 密钥
- `REDIS_URL` - Redis 连接 (可选)

---

<div align="center">

**Made with ❤️ by IEClub Team**

</div>
