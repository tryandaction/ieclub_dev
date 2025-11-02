# IE Club 后端服务

> 高性能、可扩展的校园社区后端系统

## 🎉 最新更新

**2025-11-02**: 完成核心性能优化
- ⚡ API响应速度提升 75%
- 📊 数据库查询优化 60%
- 💾 缓存命中率达到 76%
- 🚀 并发能力提升 3倍

详细信息请查看: [优化总结](./docs/optimization/Optimization_Summary.md)

---

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd ieclub-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 运行数据库迁移
npx prisma migrate deploy

# 启动开发服务器
npm run dev
```

详细启动指南: [QUICK_START.md](./QUICK_START.md)

---

## 📁 项目结构

```
ieclub-backend/
├── src/
│   ├── controllers/     # 控制器层
│   ├── services/        # 业务逻辑层（已优化）
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── utils/           # 工具函数
│   └── config/          # 配置文件
├── prisma/
│   ├── schema.prisma    # 数据库模型
│   └── migrations/      # 数据库迁移
├── scripts/             # 脚本工具
├── tests/               # 测试文件
├── docs/                # 文档目录
│   ├── api/            # API文档
│   ├── guides/         # 使用指南
│   ├── optimization/   # 优化报告
│   ├── deployment/     # 部署文档
│   └── monitoring/     # 监控文档
└── logs/                # 日志文件
```

---

## ✨ 核心功能

### 用户系统
- ✅ 用户注册/登录
- ✅ 个人资料管理
- ✅ 权限控制 (RBAC)
- ✅ 积分系统

### 社区功能
- ✅ 帖子发布/浏览
- ✅ 评论互动
- ✅ 点赞收藏
- ✅ 热门推荐（已优化）

### 活动管理
- ✅ 活动发布/管理
- ✅ 活动报名/签到
- ✅ 活动统计（已优化）

### 系统功能
- ✅ 通知系统
- ✅ 搜索功能
- ✅ 文件上传
- ✅ 数据统计（已优化）
- ✅ 性能监控
- ✅ 智能缓存

---

## 🎯 性能优化

### 已优化模块

| 模块 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 活动列表 | 200ms | 80ms | 60% |
| 活动详情 | 150ms | 50ms | 67% |
| 热门帖子 | 250ms | 75ms | 70% |
| 用户统计 | 300ms | 50ms | 83% |
| 平台统计 | 500ms | 100ms | 80% |
| 排行榜 | 350ms | 70ms | 80% |

### 缓存策略

```javascript
// 智能分层缓存
活动列表: 5分钟
活动详情: 10分钟
热门帖子: 10分钟
最新帖子: 2分钟
用户统计: 15分钟
平台统计: 30分钟
```

### 查询优化

- ✅ 使用 `select` 代替 `include`
- ✅ 批量查询避免 N+1 问题
- ✅ 使用冗余字段代替实时聚合
- ✅ 优化数据库索引

---

## 📊 API 文档

### 健康检查
```bash
GET /api/health
```

### 活动相关
```bash
GET    /api/activities          # 获取活动列表（已优化）
GET    /api/activities/:id      # 获取活动详情（已优化）
POST   /api/activities          # 创建活动
PUT    /api/activities/:id      # 更新活动
DELETE /api/activities/:id      # 删除活动
```

### 社区相关
```bash
GET    /api/posts               # 获取帖子列表（已优化）
GET    /api/posts/:id           # 获取帖子详情
POST   /api/posts               # 发布帖子
PUT    /api/posts/:id           # 更新帖子
DELETE /api/posts/:id           # 删除帖子
```

### 统计相关
```bash
GET /api/stats/platform          # 平台统计（已优化）
GET /api/stats/user/:id          # 用户统计（已优化）
GET /api/stats/hot               # 热门内容（已优化）
GET /api/stats/leaderboard       # 排行榜（已优化）
```

完整 API 文档: [API_Quick_Reference.md](./docs/api/API_Quick_Reference.md)

---

## 🔧 开发指南

### 运行测试
```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage
```

### 代码规范
```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 数据库操作
```bash
# 创建新迁移
npx prisma migrate dev --name <migration-name>

# 应用迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate
```

---

## 📈 监控和日志

### 性能监控
```bash
# 查看实时性能指标
curl http://localhost:3000/api/monitoring/performance

# 访问监控面板
http://localhost:3000/api/admin/monitoring/performance
```

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log

# 查看访问日志
tail -f logs/access.log
```

### 缓存监控
```bash
# 连接 Redis
redis-cli

# 查看缓存键
KEYS *

# 查看缓存命中率
INFO stats
```

---

## 🚀 部署

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t ieclub-backend .

# 运行容器
docker-compose up -d
```

详细部署指南: [Deployment_guide.md](../docs/deployment/Deployment_guide.md)

---

## 📚 文档

### 核心文档
- [快速启动指南](./QUICK_START.md)
- [API 参考](./docs/api/API_Quick_Reference.md)
- [管理员指南](./docs/admin/Admin_guide.md)

### 优化文档
- [优化总结](./docs/optimization/Optimization_Summary.md)
- [完整优化报告](./docs/optimization/Optimization_Complete_Report.md)
- [深度优化报告](./docs/optimization/Deep_Optimization_Report.md)

### 功能指南
- [RBAC 权限系统](./docs/guides/RBAC_Guide.md)
- [备份指南](./docs/guides/Backup_guide.md)
- [告警设置](./docs/monitoring/Alert_Setup_Guide.md)

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的版本更新历史。

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

## 💬 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]
- 文档: [Documentation]

---

**最后更新**: 2025-11-02  
**版本**: v1.0.0  
**状态**: ✅ 生产就绪

