# 🚀 IEclub 后端服务

> 企业级 Node.js + Express + Prisma + MySQL 后端服务
> 专为 Taro 多端应用（小程序 + H5）设计

## 📋 项目简介

IEclub 后端是一个功能完整、性能优秀的企业级 API 服务，支持：

- ✅ **完整的话题系统**：发布、筛选、搜索、排序
- ✅ **智能推荐算法**：基于用户兴趣的个性化推荐
- ✅ **供需匹配系统**：自动匹配需求与供给
- ✅ **实时通知系统**：点赞、评论、匹配通知
- ✅ **文件上传服务**：图片压缩、文档上传、OSS 存储
- ✅ **内容安全检测**：微信内容安全 API 集成
- ✅ **热度算法**：时间衰减的热度计算
- ✅ **趋势检测**：快速增长话题识别
- ✅ **用户系统**：微信登录、积分、等级、关注

---

## 🏗️ 技术栈

### 核心技术
- **Node.js 18+**：运行环境
- **Express 4.x**：Web 框架
- **Prisma 5.x**：现代 ORM（类型安全）
- **MySQL 8.0**：关系型数据库
- **Redis 7+**：缓存和任务队列
- **阿里云 OSS**：文件存储

### 核心依赖
```json
{
  "express": "^4.18.2",
  "@prisma/client": "^5.5.2",
  "ioredis": "^5.3.2",
  "jsonwebtoken": "^9.0.2",
  "ali-oss": "^6.18.1",
  "sharp": "^0.33.0",
  "winston": "^3.11.0",
  "bull": "^4.12.0",
  "axios": "^1.6.2"
}
```

---

## 📂 项目结构

```
ieclub-backend/
├── .env                        # 环境变量（不提交）
├── .env.example                # 环境变量示例
├── package.json                # 项目配置
├── prisma/
│   ├── schema.prisma           # 数据库模型定义
│   ├── migrations/             # 数据库迁移文件
│   └── seed.js                 # 初始数据填充
├── src/
│   ├── config/
│   │   └── index.js            # 配置中心
│   ├── controllers/            # 控制器层
│   │   ├── authController.js   # 认证控制器
│   │   ├── topicController.js  # 话题控制器
│   │   ├── commentController.js # 评论控制器
│   │   ├── uploadController.js # 上传控制器
│   │   ├── notificationController.js # 通知控制器
│   │   └── userController.js   # 用户控制器
│   ├── middleware/             # 中间件
│   │   ├── auth.js             # JWT 认证
│   │   ├── errorHandler.js     # 错误处理
│   │   └── upload.js           # 文件上传
│   ├── services/               # 服务层（业务逻辑）
│   │   ├── wechatService.js    # 微信服务
│   │   ├── ossService.js       # OSS 文件服务
│   │   └── algorithmService.js # 算法服务
│   ├── routes/
│   │   └── index.js            # 路由配置
│   ├── utils/                  # 工具函数
│   │   ├── logger.js           # 日志工具
│   │   ├── redis.js            # Redis 工具
│   │   └── response.js         # 响应格式
│   ├── app.js                  # Express 应用
│   └── server.js               # 服务器启动
├── logs/                       # 日志文件
└── uploads/                    # 本地临时文件

```

---

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 7.0
- npm >= 9.0.0

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

关键配置：
```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/ieclub"

# JWT 密钥
JWT_SECRET=your-super-secret-key

# 微信小程序
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret

# 阿里云 OSS
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret
OSS_BUCKET=ieclub-files
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 填充初始数据
npm run prisma:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 6. 验证运行

访问：`http://localhost:3000/api/v1/health`

返回：
```json
{
  "success": true,
  "message": "IEclub API is running",
  "version": "2.0.0"
}
```

---

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": { ... },
  "timestamp": 1697456789000
}
```

#### 失败响应
```json
{
  "success": false,
  "code": 400,
  "message": "错误信息",
  "errors": { ... },
  "timestamp": 1697456789000
}
```

#### 分页响应
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  },
  "timestamp": 1697456789000
}
```

---

## 🔐 认证接口

### 1. 微信登录

**POST** `/api/v1/auth/wechat-login`

```json
// 请求
{
  "code": "微信登录 code",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像 URL",
    "gender": 1
  }
}

// 响应
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "user": {
      "id": "user-id",
      "nickname": "用户昵称",
      "avatar": "头像 URL",
      "credits": 0,
      "level": 1
    }
  }
}
```

### 2. 获取当前用户信息

**GET** `/api/v1/auth/me`

**需要认证**: ✅

```json
// 响应
{
  "success": true,
  "data": {
    "id": "user-id",
    "nickname": "用户昵称",
    "avatar": "头像 URL",
    "bio": "个人简介",
    "skills": ["React", "Node.js"],
    "interests": ["技术", "创业"],
    "credits": 100,
    "level": 2,
    "topicsCount": 10,
    "commentsCount": 50
  }
}
```

### 3. 更新个人信息

**PUT** `/api/v1/auth/profile`

**需要认证**: ✅

```json
// 请求
{
  "nickname": "新昵称",
  "bio": "个人简介",
  "skills": ["React", "Node.js", "AI"],
  "interests": ["技术", "创业", "设计"]
}
```

---

## 📝 话题接口

### 1. 获取话题列表

**GET** `/api/v1/topics`

查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `category`: 分类筛选
- `topicType`: 话题类型（discussion/demand/supply/question）
- `sortBy`: 排序方式（hot/new/trending）
- `tags`: 标签筛选（逗号分隔）
- `search`: 搜索关键词

```json
// 响应
{
  "success": true,
  "data": [
    {
      "id": "topic-id",
      "title": "话题标题",
      "content": "话题内容",
      "category": "技术",
      "tags": ["React", "前端"],
      "topicType": "discussion",
      "images": [{ "url": "...", "thumbnail": "..." }],
      "viewsCount": 100,
      "likesCount": 20,
      "commentsCount": 5,
      "hotScore": 15.5,
      "author": {
        "id": "user-id",
        "nickname": "作者昵称",
        "avatar": "头像 URL"
      },
      "createdAt": "2025-10-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 2. 创建话题

**POST** `/api/v1/topics`

**需要认证**: ✅

```json
// 请求
{
  "title": "话题标题",
  "content": "话题内容（支持 Markdown）",
  "contentType": "markdown",
  "category": "技术",
  "tags": ["React", "前端"],
  "topicType": "demand",
  "demandType": "人员",
  "skillsNeeded": ["React", "TypeScript"],
  "deadline": "2025-12-31T23:59:59Z",
  "location": "深圳",
  "images": [
    { "url": "https://...", "thumbnail": "https://..." }
  ],
  "documents": [
    { "name": "项目计划.pdf", "url": "https://...", "size": 1024000 }
  ],
  "links": [
    {
      "url": "https://mp.weixin.qq.com/s/xxx",
      "title": "相关文章",
      "description": "文章简介",
      "image": "https://..."
    }
  ],
  "quickActions": [
    { "type": "interested", "label": "想听", "icon": "👂" },
    { "type": "can_help", "label": "我来分享", "icon": "🙋" }
  ]
}
```

### 3. 点赞/取消点赞

**POST** `/api/v1/topics/:id/like`

**需要认证**: ✅

```json
// 响应
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 21
  },
  "message": "点赞成功"
}
```

### 4. 快速操作

**POST** `/api/v1/topics/:id/quick-action`

**需要认证**: ✅

```json
// 请求
{
  "actionType": "interested" // interested, can_help, want_collab
}

// 响应
{
  "success": true,
  "data": {
    "actionType": "interested",
    "count": 15,
    "userAction": true
  }
}
```

### 5. 获取推荐话题

**GET** `/api/v1/topics/recommend?limit=20`

基于用户兴趣的个性化推荐

### 6. 获取供需匹配

**GET** `/api/v1/topics/:id/matches?limit=10`

返回与当前话题匹配的其他话题

```json
// 响应
{
  "success": true,
  "data": [
    {
      "topic": { ... },
      "score": 0.85,
      "skillsScore": 1.0,
      "interestsScore": 0.7,
      "locationScore": 1.0,
      "matchReasons": [
        "你擅长的技能：React、TypeScript",
        "兴趣匹配：前端、技术",
        "同城：深圳",
        "匹配度：85%"
      ]
    }
  ]
}
```

---

## 📤 文件上传接口

### 1. 上传图片

**POST** `/api/v1/upload/images`

**需要认证**: ✅

**Content-Type**: `multipart/form-data`

```
Form-data:
  - images: 文件数组（最多 9 张）
```

```json
// 响应
{
  "success": true,
  "data": [
    {
      "url": "https://cdn.ieclub.com/xxx.jpg",
      "thumbnail": "https://cdn.ieclub.com/xxx_thumb.jpg",
      "width": 1920,
      "height": 1080,
      "size": 512000
    }
  ]
}
```

### 2. 上传文档

**POST** `/api/v1/upload/documents`

**需要认证**: ✅

支持格式：PDF、Word、PPT

```json
// 响应
{
  "success": true,
  "data": [
    {
      "name": "项目计划.pdf",
      "url": "https://cdn.ieclub.com/docs/xxx.pdf",
      "size": 2048000,
      "type": "pdf"
    }
  ]
}
```

### 3. 获取链接预览

**POST** `/api/v1/upload/link-preview`

**需要认证**: ✅

```json
// 请求
{
  "url": "https://mp.weixin.qq.com/s/xxx"
}

// 响应
{
  "success": true,
  "data": {
    "title": "文章标题",
    "description": "文章简介",
    "image": "https://...",
    "siteName": "公众号名称",
    "url": "https://..."
  }
}
```

---

## 💬 评论接口

### 1. 获取评论列表

**GET** `/api/v1/topics/:topicId/comments?page=1&limit=20`

### 2. 创建评论

**POST** `/api/v1/topics/:topicId/comments`

**需要认证**: ✅

```json
// 请求
{
  "content": "评论内容",
  "parentId": "parent-comment-id", // 可选，回复评论时使用
  "images": [...]  // 可选
}
```

### 3. 点赞评论

**POST** `/api/v1/comments/:id/like`

**需要认证**: ✅

---

## 🔔 通知接口

### 1. 获取通知列表

**GET** `/api/v1/notifications?page=1&limit=20&type=like`

### 2. 获取未读数量

**GET** `/api/v1/notifications/unread-count`

```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### 3. 标记已读

**PUT** `/api/v1/notifications/:id/read`

**PUT** `/api/v1/notifications/read-all` (全部已读)

---

## 🎯 核心算法

### 1. 热度算法

```javascript
hotScore = votes / (ageInHours + 2) ^ gravity

votes = viewsCount * 1 + likesCount * 2 + commentsCount * 3 + bookmarksCount * 2
gravity = 1.8 (重力系数，控制衰减速度)
```

### 2. 供需匹配算法

```javascript
matchScore = skillsScore * 0.5 + interestsScore * 0.3 + locationScore * 0.2

// 技能匹配
skillsScore = 匹配的技能数 / 需求的技能数

// 兴趣匹配
interestsScore = 匹配的标签数 / max(需求标签数, 供给标签数)

// 地点匹配
locationScore = 同城 ? 1.0 : 0.5
```

### 3. 个性化推荐

推荐策略：
- 60% 基于用户兴趣标签
- 30% 热门话题
- 10% 最新话题

---

## ⚙️ 部署指南

### Docker 部署（推荐）

1. 构建镜像

```bash
docker build -t ieclub-backend .
```

2. 运行容器

```bash
docker-compose up -d
```

### 传统部署

1. 安装 PM2

```bash
npm install -g pm2
```

2. 启动服务

```bash
pm2 start src/server.js --name ieclub-api
```

3. 查看日志

```bash
pm2 logs ieclub-api
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.ieclub.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 开发指南

### 数据库操作

```bash
# 创建新迁移
npx prisma migrate dev --name add_new_feature

# 重置数据库
npx prisma migrate reset

# 打开 Prisma Studio
npx prisma studio
```

### 代码规范

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format
```

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

---

## 📊 性能优化

### 1. Redis 缓存

- 热门话题列表缓存：1 小时
- 用户推荐缓存：1 小时
- 话题详情缓存：5 分钟

### 2. 数据库索引

```sql
-- 关键索引
CREATE INDEX idx_topics_hot_score ON topics(hot_score DESC);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_topics_category ON topics(category);
CREATE FULLTEXT INDEX idx_topics_search ON topics(title, content);
```

### 3. 图片优化

- 自动压缩：质量 80%
- 生成缩略图：400x400
- WebP 格式支持
- CDN 加速

---

## 🐛 常见问题

### Q: 数据库连接失败？
A: 检查 `.env` 中的 `DATABASE_URL` 配置是否正确

### Q: Redis 连接失败？
A: 确保 Redis 服务已启动，端口正确

### Q: JWT Token 无效？
A: 检查 `JWT_SECRET` 是否配置，Token 是否过期

### Q: 文件上传失败？
A: 检查 OSS 配置是否正确，权限是否足够

---

## 📝 更新日志

### v2.0.0 (2025-10-16)

✨ 新功能：
- 完整的话题系统
- 智能推荐算法
- 供需匹配系统
- 文件上传服务
- 内容安全检测

🔧 优化：
- 使用 Prisma 替代 Sequelize
- 使用 MySQL 替代 PostgreSQL
- 优化热度算法
- 改进缓存策略

---

## 📄 许可证

MIT License

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

- 项目地址：https://github.com/ieclub/backend
- 官网：https://ieclub.online
- 邮箱：dev@ieclub.online

---

**🎉 感谢使用 IEclub 后端服务！**