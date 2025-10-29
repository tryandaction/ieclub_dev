# IEClub Taro 小程序

基于 Taro 框架开发的 IEClub 小程序，支持微信小程序和 H5 多端运行。

## 项目介绍

IEClub 小程序是为校园创新创业俱乐部打造的多端应用，提供话题广场、社区交流、活动管理和个人中心等功能，帮助学生更好地参与创新创业活动。

### 主要功能

- **话题广场**：浏览和发布创新创业相关话题，支持分类查看和互动
- **社区交流**：用户可以分享经验、提问讨论，促进社区互动
- **活动管理**：查看和报名参加各类创新创业活动
- **个人中心**：管理个人信息、查看发布历史和收藏内容

## 技术栈

- **框架**：Taro v4.1.7
- **UI 组件**：Taro 内置组件
- **状态管理**：Zustand
- **样式**：SCSS
- **构建工具**：Webpack

## 项目结构

```
ieclub-taro/
├── config/               # Taro 配置文件
├── src/
│   ├── app.config.js     # 应用配置
│   ├── app.js            # 应用入口
│   ├── app.scss          # 全局样式
│   ├── pages/            # 页面组件
│   │   ├── plaza/        # 话题广场
│   │   ├── community/    # 社区
│   │   ├── activities/   # 活动
│   │   └── profile/      # 个人中心
│   ├── store/            # 状态管理
│   │   ├── topicStore.js # 话题状态
│   │   ├── communityStore.js # 社区状态
│   │   ├── activityStore.js # 活动状态
│   │   └── userStore.js  # 用户状态
│   └── components/       # 公共组件
└── package.json          # 项目依赖
```

## 开发指南

### 环境准备

确保已安装以下工具：
- Node.js (>= 12.0.0)
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn
```

### 运行项目

```bash
# 开发 H5
npm run dev:h5
# 或
yarn dev:h5

# 开发微信小程序
npm run dev:weapp
# 或
yarn dev:weapp
```

### 构建项目

```bash
# 构建 H5
npm run build:h5
# 或
yarn build:h5

# 构建微信小程序
npm run build:weapp
# 或
yarn build:weapp
```

## 状态管理

项目使用 Zustand 进行状态管理，主要包括：

- `topicStore`: 管理话题广场的状态和操作
- `communityStore`: 管理社区页面的状态和操作
- `activityStore`: 管理活动页面的状态和操作
- `userStore`: 管理用户信息和登录状态

## 设计风格

项目采用类小红书风格的卡片式布局，UI 设计简洁现代，注重用户体验。主要特点：

- 卡片式布局，信息展示清晰
- 统一的导航栏和标签栏设计
- 响应式设计，适配不同设备
- 简约而现代的色彩方案

## 后续开发计划

- 接入真实后端 API，替换模拟数据
- 完善用户登录注册功能
- 添加消息通知系统
- 优化性能和用户体验
- 增加更多交互动画效果

## 预览

H5 预览地址：http://localhost:10086/
