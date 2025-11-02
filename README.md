# IEClub - 创造线上线下交互的无限可能

<div align="center">

![IEClub Logo](https://img.shields.io/badge/IEClub-v2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

**学习 · 科研 · 项目 · 创业 | 智能匹配 · 资源对接 · 知识分享**

[功能特性](#功能特性) · [技术架构](#技术架构) · [快速开始](#快速开始) · [项目结构](#项目结构) · [开发指南](#开发指南)

</div>

---

## 📖 项目简介

**IEClub：创造线上线下交互的无限可能！**

我们现阶段将立足南科大，打造线上线下的学术交流空间与分享、交流、互助的氛围，让南科学子在遇到学业、科研、项目以及创业等方面问题的时候都能想到IEClub。

IEClub不仅是一个平台，更是一个链接资源、成就想法与创造可能的地方。我们不仅邀请一切有想法或者有需求的同学使用我们的平台，我们更致力于吸纳优秀力量，让IEClub成为你身边除课题组以外最能帮到你的那股力量。

### 🌟 核心价值

- **知识分享** - 我来讲：分享你的专业知识和技能
- **学习互助** - 想听：找到学习伙伴，共同进步
- **项目对接** - 创业/科研/竞赛项目招募与合作
- **活动组织** - 线下讲座、工作坊、组队活动
- **资源分享** - PDF/PPT/公众号/视频等优质内容
- **智能匹配** - 基于技能和兴趣的精准推荐

---

## 🎯 技术架构

**日期**: 2025-10-29  
**版本**: v2.0

### 双端原生架构

IEClub 采用**双端原生开发**策略，确保最佳性能和用户体验。

#### 架构特点

1. **网页版** - React 18 + Vite，现代化 Web 应用
2. **小程序版** - 微信原生开发，完全符合官方标准
3. **统一后端** - Node.js + MySQL，双端共享数据
4. **性能优先** - 无框架转译开销，原生性能
5. **开发友好** - 调试便捷，问题定位准确

#### 技术优势

- ✅ **零编译问题** - 原生开发，无需复杂工具链
- ✅ **性能最佳** - 无框架层开销，原生性能
- ✅ **调试方便** - 直接在开发工具调试
- ✅ **代码简洁** - 学习成本低，维护容易
- ✅ **100%兼容** - 完全符合官方标准

---

## ✨ 核心功能模块

### 1️⃣ 话题广场

- 🎤 **我来讲** - 知识分享者的舞台，分享你的专业技能
- 👂 **想听** - 学习需求的集结地，找到学习伙伴
- 🚀 **项目** - 创业/科研项目展示与招募
- 📤 **分享** - PDF/PPT/公众号/B站视频等资源分享
- ✨ **智能推荐** - 基于兴趣和技能的个性化推荐

### 2️⃣ 社区

- 👥 **用户发现** - 找到志同道合的伙伴
- 🏆 **排行榜** - 多维度展示优秀用户
- 🤝 **关注系统** - 建立社交连接
- 🎯 **智能匹配** - 基于技能和需求的精准匹配
- 💬 **私信聊天** - 一对一深度交流

### 3️⃣ 活动管理

- 📅 **活动发布** - 创建线上线下活动
- 👥 **报名管理** - 便捷的报名和审核系统
- 📊 **数据统计** - 活动效果分析
- 🎁 **积分奖励** - 参与活动获得成长值
- ✅ **签到系统** - 扫码/输入码签到

### 4️⃣ 发布中心

- 📝 **多类型发布** - 支持话题、项目、活动、资源分享
- 🏷️ **智能标签** - 自动分类和推荐
- ✍️ **富文本编辑** - Markdown支持，图文并茂
- 📎 **附件上传** - 支持PDF/PPT/代码/链接
- 💾 **草稿箱** - 自动保存未完成内容

### 5️⃣ 个人中心

- 📊 **数据看板** - 个人贡献和成就展示
- 🏅 **等级系统** - LV1-LV20成长体系
- 💎 **积分体系** - 多维度激励机制
- ⭐ **成就徽章** - 收集专属成就
- 📚 **收藏管理** - 知识管理工具
- ⚙️ **设置管理** - 个性化配置

### 6️⃣ 消息系统

- 🔔 **系统通知** - 重要公告及时推送
- ❤️ **互动消息** - 点赞、评论、@提及
- 👥 **关注动态** - 关注用户的新内容
- 📅 **活动提醒** - 活动开始前通知
- 💌 **私信聊天** - 支持文字、图片、链接

### 7️⃣ 智能搜索

- 🔍 **全局搜索** - 话题/用户/活动/标签
- 💡 **智能建议** - 实时搜索提示
- 🔥 **热门搜索** - 平台热点追踪
- 🎯 **高级筛选** - 多维度精准查找
- 📝 **搜索历史** - 快速重新搜索

---

## 🔧 技术架构详情

### 🎯 双端统一架构

```
         用户端
    ┌──────┴──────┐
浏览器Web     微信小程序
    │             │
    │             │
┌────────┐   ┌────────┐
│网页版  │   │小程序版 │
│React   │   │原生    │
│Vite    │   │WXML   │
└───┬────┘   └───┬────┘
    │            │
    └─────┬──────┘
          │
     统一后端 API
    (Node.js + MySQL)
```

**核心优势**：
- ✅ 数据统一 - 用户信息、论坛内容完全同步
- ✅ 功能同步 - 两端功能保持一致
- ✅ 设计统一 - 相同的UI/UX体验
- ✅ 开发高效 - 共用一套后端接口

### 前端技术栈

#### 🌐 网页版 (ieclub-web)

```
技术选型：React 18 + Vite
├── React 18.2.0 - UI 框架
├── React Router 6 - 路由管理
├── Tailwind CSS - 样式框架
├── Zustand - 状态管理
├── Axios - HTTP 请求
└── Vite - 构建工具
```

**核心特性**：
- 极速的开发体验
- 现代化的组件系统
- 响应式设计
- PWA 支持（规划中）

#### 📱 小程序版 (ieclub-frontend)

```
技术选型：原生微信小程序
├── WXML - 页面结构
├── WXSS - 页面样式
├── JavaScript - 页面逻辑
└── JSON - 页面配置
```

**核心特性**：
- 原生组件系统
- 双线程架构（渲染层 + 逻辑层）
- 完整的生命周期管理
- 官方 API 支持

### 后端技术栈

```json
{
  "运行时": "Node.js >= 18.0.0",
  "框架": "Express 4.18.2",
  "数据库": {
    "MySQL": "8.0+",
    "Prisma": "5.8.0",
    "Redis": "7.0+"
  },
  "认证": "JWT 9.0.2",
  "实时通信": "WebSocket",
  "文件处理": "Sharp 0.34.4"
}
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **MySQL** >= 8.0 或 Docker
- **Redis** >= 7.0 或 Docker
- **微信开发者工具** - [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（仅小程序开发需要）

### ⚡ 一键启动（推荐）

```powershell
# Windows PowerShell
.\Start-Services.ps1

# 自动在两个窗口中启动前端和后端
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

### 🗄️ 数据库设置

**如果遇到数据库连接错误**，请查看 [DATABASE_SETUP.md](DATABASE_SETUP.md) 获取详细指南。

快速方案：

```powershell
# 方案1：使用 Docker（推荐）
cd ieclub-backend
docker-compose up -d mysql redis

# 方案2：安装本地 MySQL
# 下载：https://dev.mysql.com/downloads/mysql/
# 创建数据库：ieclub
```

### 🌐 网页版开发

```bash
# 进入网页版目录
cd ieclub-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 📱 小程序开发

```bash
# 1. 打开微信开发者工具
# 2. 导入项目
#    - 项目目录：选择 ieclub-frontend 文件夹
#    - AppID：使用测试号或你的AppID
# 3. 点击"编译"按钮
# 4. 开始开发
```

### 后端开发

```bash
# 进入后端目录
cd ieclub-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
npm run db:migrate
npm run db:seed

# 启动开发服务器
npm run dev
```

### 访问地址

- **网页版**: http://localhost:5173
- **小程序预览**: 微信开发者工具 - 预览
- **后端 API**: http://localhost:3000
- **API 文档**: http://localhost:3000/api-docs

---

## 📁 项目结构

```
IEclub_dev/
├── ieclub-web/               # 🌐 网页版（React + Vite）
│   ├── src/
│   │   ├── components/       # 组件
│   │   │   └── Layout.jsx   # 布局组件
│   │   ├── pages/           # 页面
│   │   │   ├── Plaza.jsx    # 话题广场
│   │   │   ├── Community.jsx # 社区
│   │   │   ├── Activities.jsx # 活动
│   │   │   ├── Publish.jsx  # 发布
│   │   │   └── Profile.jsx  # 个人中心
│   │   ├── App.jsx          # 主应用
│   │   └── main.jsx         # 入口
│   ├── index.html           # HTML 模板
│   ├── package.json         # 依赖配置
│   └── vite.config.js       # Vite 配置
│
├── ieclub-frontend/          # 📱 小程序版（原生微信）
│   ├── app.js                # 小程序入口逻辑
│   ├── app.json              # 小程序全局配置
│   ├── app.wxss              # 小程序全局样式
│   ├── pages/                # 页面目录
│   │   ├── login/            # 登录页
│   │   ├── plaza/            # 话题广场
│   │   ├── community/        # 社区
│   │   ├── activities/       # 活动
│   │   ├── publish/          # 发布
│   │   └── profile/          # 个人中心
│   ├── utils/                # 工具函数
│   │   ├── request.js        # API请求封装
│   │   └── auth.js           # 认证工具
│   ├── api/                  # API接口
│   │   ├── auth.js           # 认证接口
│   │   ├── topic.js          # 话题接口
│   │   └── user.js           # 用户接口
│   └── project.config.json   # 项目配置
│
├── ieclub-backend/           # 🔧 后端服务（Node.js）
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 业务逻辑
│   │   ├── routes/           # 路由
│   │   ├── middleware/       # 中间件
│   │   └── utils/            # 工具函数
│   └── prisma/               # 数据库配置
│
├── docs/                     # 📚 文档中心
│   ├── deployment/           # 部署文档
│   │   └── Deployment_guide.md
│   ├── development/          # 开发文档
│   │   ├── DEVELOPMENT_PLAN.md
│   │   ├── PROJECT_ARCHITECTURE.md
│   │   └── SECURITY_AND_FUNCTIONALITY_CHECKLIST.md
│   ├── features/             # 功能文档
│   │   ├── NEW_FEATURES.md
│   │   └── CREDIT_SYSTEM_SUMMARY.md
│   └── API_REFERENCE.md      # API 参考文档
│
├── ieclub_v2_demo.tsx        # 设计原型（保留参考）
└── README.md                 # 项目总览（本文件）
```

---

## 📚 开发指南

### V1.0 开发重点

#### 阶段一：认证系统（2周）
- ✅ 南科大邮箱注册/登录
- ✅ 密码管理（找回、修改）
- ✅ 微信绑定
- ✅ 手机号绑定（可选）
- ✅ 二次验证机制

#### 阶段二：核心功能（4周）
- ✅ 话题广场（我来讲/想听/项目/分享）
- ✅ 社区功能（用户列表、个人主页、排行榜）
- ✅ 发布系统（富文本编辑、附件上传）
- ✅ 个人中心（数据看板、成就系统）

#### 阶段三：互动系统（3周）
- ✅ 消息通知系统
- ✅ 评论点赞功能
- ✅ 私信聊天
- ✅ 关注系统

#### 阶段四：活动管理（2周）
- ✅ 活动发布
- ✅ 报名管理
- ✅ 签到系统
- ✅ 活动统计

#### 阶段五：搜索与推荐（2周）
- ✅ 智能搜索
- ✅ 个性化推荐
- ✅ 热门排行
- ✅ 标签系统

#### 阶段六：测试与优化（2周）
- ✅ 性能优化
- ✅ Bug修复
- ✅ 安全加固
- ✅ 用户测试

---

## 🎨 设计规范

### 色彩系统

```scss
主色调: #8b5cf6 (紫色)
渐变色: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
文字色: #333 (深), #666 (中), #999 (浅)
背景色: #f5f5f5 (页面), #fff (卡片)
```

### 尺寸规范

- 页面边距: 30rpx
- 卡片圆角: 16rpx
- 按钮圆角: 12rpx
- 标签圆角: 20rpx

---

## 🚀 一键部署

### 快速部署所有端（网页 + 小程序 + 后端）

```powershell
.\Deploy.ps1 -Target "all"
```

### 其他部署选项

```powershell
# 仅部署网页
.\Deploy.ps1 -Target "web"

# 仅构建小程序
.\Deploy.ps1 -Target "weapp"

# 仅部署后端
.\Deploy.ps1 -Target "backend"

# 自定义提交信息
.\Deploy.ps1 -Target "all" -CommitMessage "修复登录bug"
```

### 📱 小程序发布流程

1. **构建**
   ```powershell
   .\Deploy.ps1 -Target "weapp"
   ```

2. **打开微信开发者工具**
   - 导入项目: `ieclub-frontend` 目录
   - 填写你的小程序AppID

3. **上传发布**
   - 点击「上传」→ 填写版本号
   - 微信公众平台 → 提交审核 → 发布

### 🌐 访问地址

- **网页版**: https://ieclub.online
- **API**: https://ieclub.online/api
- **健康检查**: https://ieclub.online/api/health

### 📚 详细文档

#### 核心文档
- [API 参考文档](docs/API_REFERENCE.md) - 完整的 API 接口文档
- [新功能总览](docs/features/NEW_FEATURES.md) - 最新功能介绍

#### 开发文档
- [开发规划](docs/development/DEVELOPMENT_PLAN.md) - 详细开发计划
- [系统架构](docs/development/PROJECT_ARCHITECTURE.md) - 技术架构说明
- [安全检查清单](docs/development/SECURITY_AND_FUNCTIONALITY_CHECKLIST.md) - 安全与功能检查

#### 功能文档
- [积分系统](docs/features/CREDIT_SYSTEM_SUMMARY.md) - 积分系统详解

#### 部署文档
- [部署指南](docs/deployment/Deployment_guide.md) - 完整部署流程

---

## 🎯 产品路线图

### V1.0 - 南科大专属版（当前）
- ✅ 南科大邮箱认证
- ✅ 核心功能完整
- ✅ 双端同步上线
- 🎯 100+ 活跃用户

### V1.5 - 功能增强（3个月后）
- 📸 图片OCR识别
- 🎥 短视频分享
- 👥 小组功能
- 📊 数据分析

### V2.0 - 全校覆盖（6个月后）
- 🤖 AI智能推荐
- 📱 移动端App
- 🌐 开放API
- 🎓 学分认证

### V3.0 - 粤港澳联盟（1年后）
- 🏫 多校联动
- 🌍 资源共享
- 🏆 跨校竞赛
- 💼 企业对接

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE)

---

## 🙏 致谢

感谢所有为 IEClub 项目做出贡献的开发者、使用者和支持者！

特别感谢南方科技大学为我们提供的支持与平台。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个Star！⭐**

Made with ❤️ by IEClub Team

[官网](https://ieclub.online) · [GitHub](https://github.com/tryandaction/ieclub_dev) · [反馈](https://github.com/tryandaction/ieclub_dev/issues)

</div>