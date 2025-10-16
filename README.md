<div align="center">

# 🎓 IEclub - 跨学科智能交流平台

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ieclub/ieclub/pulls)
[![CI Status](https://github.com/ieclub/ieclub/workflows/CI/badge.svg)](https://github.com/ieclub/ieclub/actions)

**一个基于 Taro + React + Node.js 的企业级跨平台智能交流平台**

[功能特色](#-核心功能) • [快速开始](#-快速开始) • [技术架构](#-技术架构) • [项目结构](#-项目结构) • [部署指南](#-部署指南) • [贡献指南](#-贡献指南)

</div>

---

## 📋 项目简介

IEclub 是一个专为学生打造的**跨学科交流与智能匹配平台**，通过先进的算法和现代化的技术栈，实现了：

- 🎯 **智能供需匹配** - 基于技能、兴趣、地点的多维度精准匹配
- 📈 **热度排序算法** - 时间衰减 + 多因素加权的动态热度计算
- 🤖 **个性化推荐** - 协同过滤 + 内容推荐的混合推荐系统
- 📱 **跨平台支持** - 一套代码，多端运行（小程序、H5、App）
- 🛡️ **内容安全** - 集成微信官方API + 敏感词过滤的多层防护
- ⚡ **高性能架构** - Redis缓存 + 数据库优化 + CDN加速

---

## 🎯 核心功能

### 用户系统
- ✅ 微信小程序一键登录（支持手机号授权）
- ✅ 用户资料管理（技能标签、兴趣标签、个人简介）
- ✅ 积分等级系统（发帖+10、评论+5、签到+2）
- ✅ 社交关系（关注、粉丝、私信）
- ✅ 个人主页展示（发布的话题、收藏、互动记录）

### 话题广场
- ✅ **多类型话题**：讨论、需求、供给、问答、活动、合作
- ✅ **富媒体内容**：
  - 📷 图片上传（最多9张，支持压缩）
  - 📄 文档上传（PDF、Word、PPT，最大20MB）
  - 📹 视频链接（B站、优酷等）
  - 🔗 公众号链接预览
- ✅ **Markdown 渲染支持**
- ✅ **供需智能匹配**：
  - 需求类型：人员、技术、资金、场地、设备、合作
  - 技能标签匹配
  - 地点范围筛选
- ✅ **热度评分与趋势检测**
- ✅ **快速操作按钮**：
  - 💡 感兴趣
  - 🤝 可以帮助
  - 🎯 想合作

### 评论系统
- ✅ 无限层级嵌套回复
- ✅ 评论排序（最热、最新）
- ✅ 图片评论支持
- ✅ @提及功能
- ✅ 楼层显示（#1、#2...）

### 内容安全
- ✅ 微信官方内容安全检测 API
- ✅ 本地敏感词过滤（DFA算法）
- ✅ 图片鉴黄（基于微信 API）
- ✅ 用户举报机制
- ✅ 管理员审核后台

### 通知系统
- ✅ 系统通知（公告、活动推送）
- ✅ 互动通知（点赞、评论、@提及）
- ✅ 私信通知
- ✅ 微信小程序订阅消息
- ✅ 消息聚合（今日有10人点赞了你）

### 搜索与推荐
- ✅ 话题全文搜索（标题、内容、标签）
- ✅ 用户搜索（昵称、技能）
- ✅ 搜索历史记录
- ✅ 热门搜索词
- ✅ 个性化推荐（基于协同过滤）
- ✅ 相似话题推荐

---

## 🏗️ 技术架构

### 前端技术栈（Taro 多端框架）

```
框架：Taro 4.x + React 18
状态管理：Zustand（轻量级、支持多端）
UI组件：Taro UI + 自定义组件
样式方案：Tailwind CSS（原子化CSS）
HTTP客户端：Taro.request（原生API）
构建工具：Webpack 5
支持平台：微信小程序、H5、支付宝小程序、字节跳动小程序、React Native（App）
```

**为什么选择 Taro？**
- ✅ 一套代码，多端运行（节省80%开发成本）
- ✅ React 开发体验，降低学习曲线
- ✅ 完善的组件库和生态
- ✅ 支持原生API调用

### 后端技术栈

```
运行环境：Node.js 18+
Web框架：Express.js 4.x
数据库：MySQL 8.0（稳定、高性能）
ORM：Prisma（类型安全、现代化）
缓存：Redis 7+（会话、队列、缓存）
文件存储：阿里云 OSS / 腾讯云 COS
实时通信：Socket.IO（可选）
定时任务：node-cron
日志系统：Winston
监控告警：Sentry
```

**为什么选择 MySQL + Prisma？**
- ✅ MySQL 在小程序场景更成熟、云服务支持好
- ✅ Prisma 自动类型推导，开发效率高
- ✅ 迁移管理简单，适合快速迭代

### 核心算法

#### 1. 热度评分算法
```javascript
热度分数 = 基础分 × 时间衰减因子 × 互动权重

基础分 = 浏览量 × 1 + 点赞数 × 5 + 评论数 × 10 + 收藏数 × 8
时间衰减 = e^(-衰减率 × 发布时长)
互动权重 = 1 + (近期互动 / 总互动) × 0.5
```

#### 2. 智能匹配算法
```javascript
匹配度 = 技能匹配度 × 0.4 + 兴趣匹配度 × 0.3 + 
         地点匹配度 × 0.2 + 活跃度 × 0.1

技能匹配度 = 交集技能数 / 需求技能数
兴趣匹配度 = 共同兴趣数 / 总兴趣数
地点匹配度 = 是否在同一城市（1或0）
活跃度 = 近7天发帖数 + 评论数
```

#### 3. 个性化推荐算法
```
协同过滤 + 内容推荐混合模型

用户行为矩阵 → ItemCF算法 → 相似话题推荐
话题标签向量 → 余弦相似度 → 兴趣推荐
```

---

## 📂 项目结构

```
ieclub/
├── ieclub-taro/                    # 前端 Taro 项目
│   ├── src/
│   │   ├── app.config.ts       # Taro 应用配置
│   │   ├── app.tsx             # 应用入口（含错误边界）
│   │   ├── pages/              # 页面目录
│   │   │   ├── index/          # 话题广场（首页）
│   │   │   │   ├── index.tsx
│   │   │   │   └── index.scss
│   │   │   ├── topic-detail/   # 话题详情
│   │   │   ├── create-topic/   # 发布话题
│   │   │   ├── login/          # 登录页
│   │   │   ├── profile/        # 个人中心
│   │   │   ├── notifications/  # 通知列表
│   │   │   └── search/         # 搜索页
│   │   ├── components/         # 组件目录
│   │   │   ├── TopicCard/      # 话题卡片
│   │   │   ├── CommentItem/    # 评论项
│   │   │   ├── CommentInput/   # 评论输入框
│   │   │   ├── CommentList/    # 评论列表
│   │   │   ├── EmptyState/     # 空状态组件
│   │   │   ├── EnhancedTopicCard/ # 增强话题卡片
│   │   │   ├── FloatingActionButton/ # 悬浮操作按钮
│   │   │   ├── LoadingSpinner/ # 加载动画
│   │   │   ├── MatchingCard/   # 匹配卡片
│   │   │   ├── ProgressiveImage/ # 渐进式图片
│   │   │   ├── SmartQuickActions/ # 智能快捷操作
│   │   │   ├── TopicFilters/   # 话题筛选器
│   │   │   ├── TrendingBar/    # 趋势栏
│   │   │   ├── VirtualTopicList/ # 虚拟话题列表
│   │   │   ├── ErrorBoundary/  # 错误边界组件
│   │   │   ├── ImageUploader/  # 图片上传
│   │   │   ├── DocumentUploader/ # 文档上传
│   │   │   ├── MarkdownViewer/ # Markdown渲染
│   │   │   ├── LinkPreview/    # 链接预览
│   │   │   └── QuickActionBtn/ # 快速操作按钮
│   │   ├── services/           # API服务层
│   │   │   ├── request.ts      # HTTP封装
│   │   │   ├── enhanced-request.ts # 增强请求
│   │   │   ├── request-cache.ts # 请求缓存
│   │   │   ├── loading.ts       # 加载管理
│   │   │   ├── offline-manager.ts # 离线管理
│   │   │   ├── push.ts          # 推送服务
│   │   │   ├── smart-push.ts    # 智能推送
│   │   │   ├── analytics.ts     # 分析服务
│   │   │   ├── api/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── topic.ts
│   │   │   │   ├── comment.ts
│   │   │   │   ├── user.ts
│   │   │   │   ├── upload.ts
│   │   │   │   ├── notification.ts
│   │   │   │   ├── matching.ts
│   │   │   │   └── trending.ts
│   │   ├── store/              # Zustand状态管理
│   │   │   ├── userStore.ts
│   │   │   ├── topicStore.ts
│   │   │   ├── commentStore.ts
│   │   │   ├── notificationStore.ts
│   │   │   ├── enhanced-topicStore.ts
│   │   │   └── optimistic-updateStore.ts
│   │   ├── hooks/              # 自定义Hooks
│   │   │   └── useAnalytics.ts
│   │   ├── utils/              # 工具函数
│   │   │   ├── time.ts         # 时间格式化
│   │   │   ├── validator.ts    # 表单验证
│   │   │   ├── storage.ts      # 本地存储
│   │   │   ├── constants.ts    # 常量配置
│   │   │   ├── format.ts       # 格式化工具
│   │   │   ├── logger.ts       # 日志工具
│   │   │   ├── sanitize.ts     # 清理工具
│   │   │   └── validation.ts   # 验证工具
│   │   ├── types/              # TypeScript类型定义
│   │   │   ├── topic.ts
│   │   │   ├── user.ts
│   │   │   ├── comment.ts
│   │   │   └── index.ts
│   │   └── styles/             # 样式文件
│   │       ├── variables.scss
│   │       └── mixins.scss
│   ├── config/                 # 配置文件
│   │   ├── index.ts            # 编译配置
│   │   ├── dev.ts              # 开发环境配置
│   │   └── prod.ts             # 生产环境配置
│   ├── .eslintrc.js            # ESLint配置
│   ├── .prettierrc             # Prettier配置
│   ├── project.config.json     # 微信小程序配置
│   ├── package.json
│   └── README.md
│
├── ieclub-backend/                     # 后端 Node.js 项目
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型定义（10个表）
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js        # 配置中心
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT认证中间件
│   │   │   ├── errorHandler.js # 全局错误处理
│   │   │   ├── upload.js       # 文件上传中间件
│   │   │   └── validation.js   # 参数验证中间件
│   │   ├── services/
│   │   │   ├── wechatService.js    # 微信小程序服务
│   │   │   ├── ossService.js       # 阿里云OSS服务
│   │   │   └── algorithmService.js # 核心算法服务
│   │   ├── controllers/
│   │   │   ├── authController.js        # 认证控制器
│   │   │   ├── topicController.js       # 话题控制器
│   │   │   ├── commentController.js     # 评论控制器
│   │   │   ├── uploadController.js      # 上传控制器
│   │   │   ├── notificationController.js # 通知控制器
│   │   │   └── userController.js        # 用户控制器
│   │   ├── routes/
│   │   │   └── index.js        # 主路由配置
│   │   ├── utils/
│   │   │   ├── logger.js       # Winston日志
│   │   │   ├── redis.js        # Redis客户端
│   │   │   └── response.js     # 统一响应格式
│   │   ├── app.js              # Express应用（含Swagger）
│   │   └── server.js           # 服务器启动
│   ├── mysql/
│   │   └── init.sql           # 数据库初始化脚本
│   ├── nginx.conf              # Nginx配置文件
│   ├── ieclub.conf             # Nginx站点配置
│   ├── .env.example            # 环境变量示例（增强版）
│   ├── .eslintrc.js            # ESLint配置
│   ├── .prettierrc             # Prettier配置
│   ├── jest.config.js          # Jest测试配置
│   ├── logrotate.conf          # 日志轮转配置
│   ├── healthcheck.js          # 健康检查脚本
│   ├── Dockerfile              # Docker构建
│   ├── package.json
│   ├── tests/                  # 测试目录
│   │   ├── unit/               # 单元测试
│   │   ├── integration/        # 集成测试
│   │   └── setup.js            # 测试环境配置
│   └── README.md
│
├── .github/                    # CI/CD工作流
│   └── workflows/
│       ├── ci.yml              # 持续集成
│       └── deploy.yml           # 自动部署
│
├── docs/                        # 项目文档
│   ├── API.md                  # API接口文档
│   ├── DATABASE.md             # 数据库设计文档
│   ├── ALGORITHM.md            # 算法说明文档
│   └── DEPLOYMENT.md           # 部署指南
│
├── .gitignore
├── .dockerignore
├── LICENSE
└── README.md                   # 项目根目录说明（本文件）
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 7.0
- **微信开发者工具**: 最新稳定版
- **pnpm**: >= 8.0（推荐）或 npm

### 1. 克隆项目

```bash
git clone https://github.com/your-org/ieclub.git
cd ieclub
```

### 2. 启动后端服务

#### 安装依赖

```bash
cd backend
npm install
# 或使用 pnpm
pnpm install
```

#### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写必要配置：

```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
DATABASE_URL="mysql://root:password@localhost:3306/ieclub"

# JWT 配置
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# 微信小程序配置
WECHAT_APPID="your-wechat-appid"
WECHAT_SECRET="your-wechat-secret"

# Redis 配置
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# OSS 配置（可选，不配置则使用本地存储）
OSS_ACCESS_KEY_ID="your-aliyun-access-key-id"
OSS_ACCESS_KEY_SECRET="your-aliyun-access-key-secret"
OSS_BUCKET="ieclub-files"
OSS_REGION="oss-cn-hangzhou"
OSS_DOMAIN="https://cdn.ieclub.online"

# Sentry 配置（可选）
SENTRY_DSN=""
```

#### 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充初始数据（可选）
npm run prisma:seed
```

#### 启动开发服务器

```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run build
npm start
```

后端服务将在 `http://localhost:3000` 启动！

#### 测试 API

```bash
# 健康检查
curl http://localhost:3000/api/v1/health

# 返回示例：
# {
#   "success": true,
#   "message": "IEclub API is running",
#   "version": "2.0.0",
#   "timestamp": "2025-10-16T12:00:00.000Z"
# }
```

### 3. 启动前端项目

#### 安装依赖

```bash
cd frontend
npm install
# 或使用 pnpm
pnpm install
```

#### 配置 API 地址

编辑 `src/utils/constants.ts`：

```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.ieclub.online'  // 生产环境
  : 'http://localhost:3000'       // 开发环境
```

#### 启动开发服务器

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5

# 支付宝小程序
npm run dev:alipay
```

#### 在微信开发者工具中预览

1. 打开微信开发者工具
2. 导入项目：选择 `frontend/dist` 目录
3. 填写 AppID（测试号或正式号）
4. 点击编译，即可预览

---

## 📊 数据库设计

### 核心表结构（10个表）

```
1. users（用户表）
   - 基本信息、技能标签、兴趣标签、积分等级

2. topics（话题表）⭐核心表
   - 标题、内容、类型、需求类型、多媒体、热度分数

3. comments（评论表）
   - 支持无限层级嵌套、点赞数

4. likes（点赞表）
   - 用户ID、目标类型（话题/评论）、目标ID

5. bookmarks（收藏表）
   - 用户ID、话题ID、收藏时间

6. follows（关注表）
   - 关注者ID、被关注者ID

7. notifications（通知表）
   - 类型、发送者、接收者、内容、是否已读

8. topic_views（浏览记录表）
   - 用户ID、话题ID、浏览时间、停留时长

9. matches（匹配记录表）
   - 需求话题ID、供给话题ID、匹配度、状态

10. admin_logs（管理日志表）
    - 管理员操作记录、审核记录
```

详细的数据库设计请查看 [DATABASE.md](docs/DATABASE.md)

---

## 🔌 核心 API 接口

### 认证相关

```
POST   /api/v1/auth/login              # 微信登录
POST   /api/v1/auth/register           # 完善用户信息
POST   /api/v1/auth/refresh            # 刷新 Token
GET    /api/v1/auth/profile            # 获取当前用户信息
PUT    /api/v1/auth/profile            # 更新用户信息
```

### 话题相关

```
GET    /api/v1/topics                  # 获取话题列表（支持筛选、排序、分页）
GET    /api/v1/topics/:id              # 获取话题详情
POST   /api/v1/topics                  # 创建话题
PUT    /api/v1/topics/:id              # 更新话题
DELETE /api/v1/topics/:id              # 删除话题
POST   /api/v1/topics/:id/like         # 点赞/取消点赞
POST   /api/v1/topics/:id/bookmark     # 收藏/取消收藏
POST   /api/v1/topics/:id/quick-action # 快速操作（感兴趣、可以帮助、想合作）
GET    /api/v1/topics/:id/matches      # 获取匹配的供需话题
```

### 评论相关

```
GET    /api/v1/topics/:topicId/comments     # 获取评论列表
POST   /api/v1/topics/:topicId/comments     # 发表评论
PUT    /api/v1/comments/:id                 # 更新评论
DELETE /api/v1/comments/:id                 # 删除评论
POST   /api/v1/comments/:id/like            # 点赞评论
```

### 文件上传

```
POST   /api/v1/upload/images            # 上传图片（最多9张）
POST   /api/v1/upload/documents         # 上传文档（PDF/Word/PPT）
POST   /api/v1/upload/avatar            # 上传头像
DELETE /api/v1/upload/:fileId           # 删除文件
```

### 搜索与推荐

```
GET    /api/v1/search/topics            # 搜索话题
GET    /api/v1/search/users             # 搜索用户
GET    /api/v1/recommend/topics         # 个性化推荐话题
GET    /api/v1/recommend/users          # 推荐关注用户
```

### 通知相关

```
GET    /api/v1/notifications            # 获取通知列表
PUT    /api/v1/notifications/:id/read   # 标记为已读
PUT    /api/v1/notifications/read-all   # 全部标记为已读
DELETE /api/v1/notifications/:id        # 删除通知
```

完整的 API 文档请查看 [API.md](docs/API.md)

---

## 🎯 核心功能实现细节

### 1. 热度排序算法实现

```javascript
// backend/src/services/algorithmService.js

calculateHotScore(topic) {
  // 基础分 = 浏览 × 1 + 点赞 × 5 + 评论 × 10 + 收藏 × 8
  const baseScore = 
    topic.viewsCount * 1 +
    topic.likesCount * 5 +
    topic.commentsCount * 10 +
    topic.bookmarksCount * 8;
  
  // 时间衰减（发布后每小时衰减）
  const hoursSinceCreated = 
    (Date.now() - topic.createdAt) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-0.05 * hoursSinceCreated);
  
  // 互动权重（近24小时互动比例）
  const recentInteractions = 
    topic.recentLikes + topic.recentComments;
  const totalInteractions = 
    topic.likesCount + topic.commentsCount;
  const interactionWeight = 
    1 + (recentInteractions / Math.max(totalInteractions, 1)) * 0.5;
  
  // 最终热度分数
  return baseScore * timeDecay * interactionWeight;
}
```

### 2. 智能匹配算法实现

```javascript
// backend/src/services/algorithmService.js

async findMatches(demandTopicId) {
  const demandTopic = await prisma.topic.findUnique({
    where: { id: demandTopicId },
    include: { author: true }
  });
  
  // 查找所有供给类型的话题
  const supplyTopics = await prisma.topic.findMany({
    where: {
      topicType: 'supply',
      demandType: demandTopic.demandType // 相同需求类型
    },
    include: { author: true }
  });
  
  // 计算每个供给话题的匹配度
  const matches = supplyTopics.map(supply => {
    // 1. 技能匹配度
    const demandSkills = new Set(demandTopic.skillsNeeded || []);
    const supplySkills = new Set(supply.skillsProvided || []);
    const matchedSkills = [...demandSkills].filter(s => supplySkills.has(s));
    const skillMatch = matchedSkills.length / demandSkills.size;
    
    // 2. 兴趣匹配度
    const demandTags = new Set(demandTopic.tags || []);
    const supplyTags = new Set(supply.tags || []);
    const matchedTags = [...demandTags].filter(t => supplyTags.has(t));
    const tagMatch = matchedTags.length / Math.max(demandTags.size, 1);
    
    // 3. 地点匹配度
    const locationMatch = 
      demandTopic.author.city === supply.author.city ? 1 : 0;
    
    // 4. 活跃度
    const activityScore = 
      (supply.author.topicsCount + supply.author.commentsCount) / 100;
    
    // 综合匹配度
    const totalScore = 
      skillMatch * 0.4 +
      tagMatch * 0.3 +
      locationMatch * 0.2 +
      Math.min(activityScore, 1) * 0.1;
    
    return {
      supplyTopicId: supply.id,
      matchScore: totalScore,
      matchedSkills,
      matchedTags
    };
  });
  
  // 按匹配度排序，返回前10个
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}
```

### 3. 个性化推荐算法实现

```javascript
// backend/src/services/algorithmService.js

async getRecommendations(userId, limit = 20) {
  // 1. 获取用户的历史行为
  const userBehaviors = await prisma.topicView.findMany({
    where: { userId },
    include: { topic: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  
  // 2. 提取用户感兴趣的标签
  const userTags = new Map();
  userBehaviors.forEach(view => {
    (view.topic.tags || []).forEach(tag => {
      userTags.set(tag, (userTags.get(tag) || 0) + 1);
    });
  });
  
  // 3. 基于协同过滤找相似用户
  const similarUsers = await this.findSimilarUsers(userId, userTags);
  
  // 4. 获取相似用户喜欢的话题
  const candidateTopics = await prisma.topic.findMany({
    where: {
      authorId: { in: similarUsers.map(u => u.id) },
      id: { notIn: userBehaviors.map(v => v.topicId) } // 排除已浏览
    },
    include: { author: true },
    orderBy: { hotScore: 'desc' },
    take: limit * 2
  });
  
  // 5. 基于内容相似度排序
  const scoredTopics = candidateTopics.map(topic => {
    // 标签匹配度
    const topicTags = new Set(topic.tags || []);
    let tagScore = 0;
    topicTags.forEach(tag => {
      tagScore += userTags.get(tag) || 0;
    });
    
    // 热度分数
    const hotScore = topic.hotScore || 0;
    
    // 时效性分数
    const daysSinceCreated = 
      (Date.now() - topic.createdAt) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 7 - daysSinceCreated);
    
    // 综合得分
    return {
      ...topic,
      recommendScore: tagScore * 0.5 + hotScore * 0.3 + freshnessScore * 0.2
    };
  });
  
  // 6. 返回得分最高的话题
  return scoredTopics
    .sort((a, b) => b.recommendScore - a.recommendScore)
    .slice(0, limit);
}
```

### 4. 内容安全检测实现

```javascript
// backend/src/services/wechatService.js

async checkContent(content, openid) {
  try {
    // 获取微信 Access Token
    const accessToken = await this.getAccessToken();
    
    // 调用微信内容安全检测 API
    const response = await axios.post(
      `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`,
      {
        version: 2,
        openid,
        scene: 2, // 2-资料，3-评论，4-论坛
        content
      }
    );
    
    // 检测结果
    if (response.data.errcode === 0) {
      const result = response.data.result;
      
      // 建议：pass-通过，review-需人工审核，risky-违规
      if (result.suggest === 'risky') {
        return {
          safe: false,
          reason: result.label // 100-正常，10001-广告，20001-时政，20002-色情等
        };
      }
      
      if (result.suggest === 'review') {
        return {
          safe: true,
          needReview: true,
          reason: result.label
        };
      }
      
      return { safe: true };
    }
    
    throw new Error('Content check failed');
  } catch (error) {
    logger.error('WeChat content check error:', error);
    // 降级方案：使用本地敏感词过滤
    return this.localSensitiveWordCheck(content);
  }
}

// 本地敏感词过滤（DFA算法）
localSensitiveWordCheck(content) {
  const sensitiveWords = this.loadSensitiveWords(); // 从文件或数据库加载
  
  // DFA字典树
  const trie = this.buildTrie(sensitiveWords);
  
  // 检测是否包含敏感词
  for (let i = 0; i < content.length; i++) {
    let node = trie;
    let j = i;
    let matchedWord = '';
    
    while (j < content.length && node[content[j]]) {
      matchedWord += content[j];
      node = node[content[j]];
      j++;
      
      if (node.isEnd) {
        return {
          safe: false,
          reason: 'local_sensitive_word',
          word: matchedWord
        };
      }
    }
  }
  
  return { safe: true };
}
```

---

## 📱 小程序配置

### 1. 在微信公众平台配置

#### 服务器域名配置
```
request合法域名：
  https://api.ieclub.online

uploadFile合法域名：
  https://api.ieclub.online

downloadFile合法域名：
  https://cdn.ieclub.online

socket合法域名：（可选，用于实时通信）
  wss://ws.ieclub.online
```

#### 业务域名配置（H5跳转）
```
https://ieclub.online
```

### 2. 小程序权限配置

在 `project.config.json` 中配置：

```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "你的位置信息将用于匹配附近的人和活动"
    },
    "scope.userInfo": {
      "desc": "需要获取你的昵称和头像"
    },
    "scope.writePhotosAlbum": {
      "desc": "需要保存图片到相册"
    }
  }
}
```

### 3. 订阅消息配置

需要在微信公众平台申请以下订阅消息模板：

```
1. 评论通知
   - 场景：有人评论了你的话题
   - 内容：{{thing1.DATA}} 评论了你：{{thing2.DATA}}

2. 点赞通知
   - 场景：有人点赞了你的话题/评论
   - 内容：{{thing1.DATA}} 觉得很赞

3. 系统通知
   - 场景：官方公告、活动通知
   - 内容：{{thing1.DATA}}

4. 匹配通知
   - 场景：找到了匹配的供需话题
   - 内容：找到了 {{number1.DATA}} 个匹配的话题
```

---

## 🚀 部署指南

### 方式一：Docker 部署（推荐）

#### 1. 构建镜像

```bash
# 构建后端镜像
cd backend
docker build -t ieclub-backend:latest .

# 构建前端镜像（可选，也可以直接用 Nginx 托管）
cd frontend
npm run build:h5
```

#### 2. 启动服务

```bash
cd backend
docker-compose up -d
```

`docker-compose.yml` 示例：

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: ieclub
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  backend:
    image: ieclub-backend:latest
    depends_on:
      - mysql
      - redis
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:your_password@mysql:3306/ieclub
      - REDIS_HOST=redis
    ports:
      - "3000:3000"
    restart: always

volumes:
  mysql_data:
  redis_data:
```

#### 3. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/ieclub

# API 服务
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# H5 前端
server {
    listen 80;
    server_name ieclub.online;
    root /var/www/ieclub/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d api.ieclub.online -d ieclub.online

# 自动续期
sudo certbot renew --dry-run
```

### 方式二：传统部署

#### 1. 安装依赖环境

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MySQL
sudo apt install mysql-server

# 安装 Redis
sudo apt install redis-server

# 安装 PM2（进程管理）
sudo npm install -g pm2
```

#### 2. 部署后端

```bash
# 克隆代码
git clone https://github.com/your-org/ieclub.git
cd ieclub/backend

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env

# 初始化数据库
npm run prisma:migrate

# 使用 PM2 启动
pm2 start src/server.js --name ieclub-backend

# 设置开机自启
pm2 startup
pm2 save
```

#### 3. 部署前端（H5）

```bash
cd ../frontend

# 构建生产版本
npm run build:h5

# 部署到 Nginx
sudo cp -r dist/* /var/www/ieclub/
```

---

## 📊 性能优化

### 1. 数据库优化

```sql
-- 为高频查询添加索引
CREATE INDEX idx_topics_hot_score ON topics(hot_score DESC, created_at DESC);
CREATE INDEX idx_topics_category ON topics(category, topic_type);
CREATE INDEX idx_topics_author ON topics(author_id, created_at DESC);
CREATE INDEX idx_comments_topic ON comments(topic_id, created_at DESC);
CREATE INDEX idx_likes_target ON likes(target_type, target_id, user_id);

-- 为标签字段添加全文索引（MySQL 8.0+）
ALTER TABLE topics ADD FULLTEXT INDEX ft_tags(tags);
```

### 2. Redis 缓存策略

```javascript
// 热门话题列表缓存（5分钟）
const cacheKey = `topics:hot:page:${page}`;
await redis.setex(cacheKey, 300, JSON.stringify(topics));

// 话题详情缓存（30分钟）
const detailKey = `topic:${topicId}`;
await redis.setex(detailKey, 1800, JSON.stringify(topic));

// 用户信息缓存（1小时）
const userKey = `user:${userId}`;
await redis.setex(userKey, 3600, JSON.stringify(user));

// 热度分数缓存（使用 Redis Sorted Set）
await redis.zadd('topics:hot', hotScore, topicId);
```

### 3. CDN 加速

#### 阿里云 OSS + CDN 配置

```javascript
// backend/src/services/ossService.js

async uploadFile(file, folder = 'images') {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;
  
  await this.ossClient.put(fileName, file.buffer, {
    headers: {
      'Cache-Control': 'max-age=31536000', // 1年缓存
      'Content-Type': file.mimetype
    }
  });
  
  // 返回 CDN 加速域名
  return `https://cdn.ieclub.online/${fileName}`;
}
```

### 4. 前端性能优化

```javascript
// 图片懒加载
import { Image } from '@tarojs/components';

<Image 
  src={imageUrl} 
  mode="aspectFill"
  lazyLoad  // 开启懒加载
/>

// 长列表虚拟滚动
import { VirtualList } from '@tarojs/components';

<VirtualList
  height={500}
  itemData={topics}
  itemCount={topics.length}
  itemSize={120}
>
  {Topic => <TopicCard topic={Topic} />}
</VirtualList>

// 防抖优化搜索
const debouncedSearch = useMemo(
  () => debounce((keyword) => {
    searchTopics(keyword);
  }, 500),
  []
);
```

---

## 🔐 安全策略

### 1. 用户认证流程

```
1. 用户在小程序点击登录
   ↓
2. 调用 wx.login() 获取临时 code
   ↓
3. 发送 code 到后端 POST /api/v1/auth/login
   ↓
4. 后端用 code 换取 openid（调用微信 API）
   ↓
5. 生成 JWT Token 返回前端
   ↓
6. 前端存储 Token，后续请求带上 Authorization: Bearer {token}
```

### 2. API 安全防护

```javascript
// 请求频率限制
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/', limiter);

// SQL 注入防护（Prisma 自动防护）
// XSS 防护
const xss = require('xss');
const sanitizedContent = xss(content);

// CSRF 防护
const csrf = require('csurf');
app.use(csrf({ cookie: true }));
```

### 3. 数据加密

```javascript
// 密码加密（bcrypt）
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// 敏感数据加密（AES-256-GCM）
const crypto = require('crypto');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
```

---

## 📈 监控与日志

### 1. Sentry 错误追踪

```javascript
// backend/src/app.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// 捕获所有未处理的错误
app.use(Sentry.Handlers.errorHandler());
```

### 2. Winston 日志系统

```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // 错误日志
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // 所有日志
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// 开发环境输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 3. 性能监控

```javascript
// backend/src/middleware/performance.js

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录慢查询（超过1秒）
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.url,
        duration,
        userId: req.user?.id
      });
    }
    
    // 上报到监控系统
    metrics.timing('http.request.duration', duration, {
      method: req.method,
      path: req.route?.path,
      status: res.statusCode
    });
  });
  
  next();
});
```

---

## 🧪 测试

### 1. 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- topicController.test.js

# 查看测试覆盖率
npm run test:coverage
```

### 2. API 测试（使用 Postman）

导入 Postman Collection：

```bash
docs/IEclub_API.postman_collection.json
```

### 3. 性能测试（使用 Apache Bench）

```bash
# 测试话题列表接口
ab -n 1000 -c 100 https://api.ieclub.online/api/v1/topics

# 测试登录接口
ab -n 500 -c 50 -p login.json -T application/json \
   https://api.ieclub.online/api/v1/auth/login
```

---

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**
2. **创建特性分支**: `git checkout -b feature/AmazingFeature`
3. **提交更改**: `git commit -m 'Add some AmazingFeature'`
4. **推送到分支**: `git push origin feature/AmazingFeature`
5. **提交 Pull Request**

### 代码规范

- **ESLint**: 遵循 Airbnb JavaScript Style Guide
- **Prettier**: 统一代码格式化
- **Commit Message**: 遵循 Conventional Commits 规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具变动
perf: 性能优化
```

### Pull Request 检查清单

- [ ] 代码通过 ESLint 检查
- [ ] 添加了必要的测试
- [ ] 测试全部通过
- [ ] 更新了相关文档
- [ ] 遵循项目的代码风格

---

## 📝 开发路线图

### v2.0（当前版本）✅
- [x] Taro 多端框架重构
- [x] 智能供需匹配系统
- [x] 热度排序算法
- [x] 个性化推荐
- [x] 内容安全检测
- [x] Markdown 支持
- [x] 文档上传功能

### v2.1（计划中）🚧
- [ ] 实时聊天功能（Socket.IO）
- [ ] 语音/视频通话
- [ ] 话题圈子功能
- [ ] 积分商城
- [ ] 活动报名系统
- [ ] 数据分析后台

### v3.0（未来规划）🔮
- [ ] AI 智能助手
- [ ] 区块链积分系统
- [ ] Web3 社区治理
- [ ] NFT 徽章系统
- [ ] 跨平台桌面应用
- [ ] 国际化多语言支持

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 👥 团队

- **项目负责人**: [@your-name](https://github.com/your-name)
- **后端开发**: [@backend-dev](https://github.com/backend-dev)
- **前端开发**: [@frontend-dev](https://github.com/frontend-dev)
- **UI/UX 设计**: [@designer](https://github.com/designer)

---

## 📞 联系我们

- **官方网站**: https://ieclub.online
- **问题反馈**: [GitHub Issues](https://github.com/your-org/ieclub/issues)
- **邮箱**: contact@ieclub.online
- **微信公众号**: IEclub官方
- **QQ交流群**: 123456789

---

## 🙏 致谢

感谢以下开源项目和服务：

- [Taro](https://taro.js.org/) - 多端统一开发框架
- [Prisma](https://www.prisma.io/) - 下一代 ORM
- [Express.js](https://expressjs.com/) - Web 框架
- [Redis](https://redis.io/) - 高性能缓存
- [微信开放平台](https://open.weixin.qq.com/) - 小程序开发支持
- [阿里云](https://www.aliyun.com/) - 云服务提供商

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！⭐**

Made with ❤️ by IEclub Team

[⬆ 回到顶部](#-ieclub---跨学科智能交流平台)

</div>