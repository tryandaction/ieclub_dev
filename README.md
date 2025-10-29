# IEClub - 创造线上线下交互的无限可能

<div align="center">

![IEClub Logo](https://img.shields.io/badge/IEClub-v2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

**学习 • 科研 • 创业 | 智能匹配 • 资源对接 • 知识分享**

[功能特性](#功能特性) • [技术架构](#技术架构) • [快速开始](#快速开始) • [项目结构](#项目结构) • [开发指南](#开发指南)

</div>

---

## 📖 项目简介

IEClub 是一个面向**学习、科研、创业**的综合性智能社区平台，致力于打造线上线下的学术交流空间与分享、交流、互助的氛围。

### 🌟 我们的使命

**IEClub 不仅是一个平台，更是一个链接资源、成就想法与创造可能的地方。**

---

## ⚡ 重要更新 - 技术路径变更

**日期**: 2025-10-29  
**状态**: ✅ 已完成迁移

### 🔄 从 Taro 迁移到原生微信小程序

经过充分评估和测试，我们决定从 Taro 框架迁移到**原生微信小程序开发**。

#### 迁移原因：
1. **稳定性问题** - Taro 4.x 存在 `mount` 相关的不稳定问题
2. **编译复杂度** - 跨平台编译增加了调试难度
3. **性能优化** - 原生小程序性能更优，体验更好
4. **官方支持** - 微信官方文档和工具链更完善
5. **开发效率** - 原生开发调试更快，问题定位更准确

#### 新技术栈优势：
- ✅ **零编译问题** - 不需要 Webpack/Babel 等复杂工具链
- ✅ **性能最优** - 没有框架层开销
- ✅ **调试方便** - 直接在微信开发者工具调试
- ✅ **代码简单** - 学习成本低，维护容易
- ✅ **100%兼容** - 完全按照微信官方标准

---

## ✨ 核心功能模块

### 1️⃣ 话题广场
- 🎤 **我来讲** - 知识分享者的舞台
- 👂 **想听** - 学习需求的集结地
- 🚀 **项目宣传** - 创业项目展示橱窗
- ✨ **智能推荐** - 基于兴趣和技能的个性化推荐

### 2️⃣ 社区
- 👥 **用户发现** - 找到志同道合的伙伴
- 🏆 **排行榜** - 多维度展示优秀用户
- 🤝 **关注系统** - 建立社交连接

### 3️⃣ 活动管理
- 📅 **活动发布** - 创建线上线下活动
- 👥 **报名管理** - 便捷的报名和签到系统
- 📊 **数据统计** - 活动效果分析

### 4️⃣ 发布中心
- 📝 **多类型发布** - 支持话题、需求、项目发布
- 🏷️ **智能标签** - 自动分类和推荐
- ✍️ **富文本编辑** - 图文并茂的内容创作

### 5️⃣ 个人中心
- 📊 **数据看板** - 个人贡献和成就展示
- 🏅 **勋章系统** - 激励用户参与
- ⚙️ **设置管理** - 个性化配置

---

## 🔧 技术架构

### 🎯 双端统一架构

IEClub 采用**双端统一架构**，同时支持网页版和小程序版：

```
         用户层
    ┌──────┴──────┐
 浏览器 Web     微信小程序
    │              │
    ▼              ▼
┌────────┐    ┌────────┐
│ 网页版  │    │小程序版 │
│React   │    │ 原生   │
│Vite    │    │ WXML   │
└───┬────┘    └───┬────┘
    │             │
    └─────┬───────┘
          ▼
     统一后端 API
    (Node.js + MySQL)
```

**核心优势**：
- ✅ 数据统一 - 用户信息、论坛内容完全同步
- ✅ 功能同步 - 两端功能保持一致
- ✅ 设计统一 - 相同的 UI/UX 体验
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

#### 📱 小程序版 (ieclub-taro)

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
- **MySQL** >= 8.0
- **Redis** >= 7.0
- **微信开发者工具** - [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)（仅小程序开发需要）

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
#    - 项目目录：选择 ieclub-taro 文件夹
#    - AppID：使用测试号或你的 AppID
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
├── ieclub-taro/              # 📱 小程序版（原生）
│   ├── app.js                # 小程序入口逻辑
│   ├── app.json              # 小程序全局配置
│   ├── app.wxss              # 小程序全局样式
│   ├── pages/                # 页面目录
│   │   ├── plaza/            # 话题广场
│   │   ├── community/        # 社区
│   │   ├── activities/       # 活动
│   │   ├── publish/          # 发布
│   │   └── profile/          # 个人中心
│   └── project.config.json   # 项目配置
│
├── ieclub-backend/           # 🔧 后端服务（Node.js）
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 业务逻辑
│   │   ├── routes/           # 路由
│   │   └── middleware/       # 中间件
│   └── prisma/               # 数据库配置
│
├── ieclub_v2_demo.tsx        # 设计原型（保留）
├── 双端开发指南.md            # 📚 双端统一架构说明
├── README.md                 # 项目总览
└── 部署文档.md               # 部署指南
```

---

## 📚 开发指南

### 微信小程序开发规范

#### 1. 页面结构

每个页面必须包含 4 个文件：

```
pages/example/
├── index.js      # 页面逻辑
├── index.wxml    # 页面结构
├── index.wxss    # 页面样式
└── index.json    # 页面配置
```

#### 2. 页面生命周期

```javascript
Page({
  data: {
    // 页面数据
  },
  
  onLoad(options) {
    // 页面加载时触发
  },
  
  onShow() {
    // 页面显示时触发
  },
  
  onReady() {
    // 页面初次渲染完成
  },
  
  onHide() {
    // 页面隐藏时触发
  },
  
  onUnload() {
    // 页面卸载时触发
  }
})
```

#### 3. 数据绑定

```wxml
<!-- WXML -->
<view class="container">
  <text>{{message}}</text>
  <view wx:for="{{list}}" wx:key="id">
    {{item.name}}
  </view>
</view>
```

```javascript
// JS
Page({
  data: {
    message: 'Hello World',
    list: [{id: 1, name: 'Item 1'}]
  }
})
```

#### 4. 事件处理

```wxml
<button bindtap="handleClick">点击</button>
```

```javascript
Page({
  handleClick(e) {
    console.log('按钮被点击了')
    wx.showToast({ title: '成功', icon: 'success' })
  }
})
```

---

## 🎨 设计规范

### 色彩系统

```scss
主色调: #8b5cf6 (紫色)
渐变色: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
文字色: #333 (主), #666 (次), #999 (辅)
背景色: #f5f5f5 (页面), #fff (卡片)
```

### 尺寸规范

- 页面边距: 30rpx
- 卡片圆角: 16rpx
- 按钮圆角: 12rpx
- 标签圆角: 20rpx

---

## 📝 开发规划

### Phase 1 - 基础功能 ✅

- ✅ 原生小程序项目搭建
- ✅ 5个核心页面实现
- ✅ TabBar 导航
- ✅ 基础UI组件

### Phase 2 - 功能完善 (进行中)

- 🔄 接入后端 API
- 🔄 用户登录注册
- 🔄 数据持久化
- 🔄 分享功能

### Phase 3 - 高级功能

- ⏳ 实时通知
- ⏳ 消息系统
- ⏳ 支付功能
- ⏳ 数据统计

### Phase 4 - 优化上线

- ⏳ 性能优化
- ⏳ 代码审查
- ⏳ 提交审核
- ⏳ 正式发布

---

## 🚀 一键部署

### 快速部署所有端（网页 + 小程序 + 后端）

```powershell
.\一键部署.ps1 -Target "all"
```

### 其他部署选项

```powershell
# 仅部署网页
.\一键部署.ps1 -Target "web"

# 仅构建小程序
.\一键部署.ps1 -Target "weapp"

# 仅部署后端
.\一键部署.ps1 -Target "backend"

# 自定义提交信息
.\一键部署.ps1 -Target "all" -CommitMessage "修复登录bug"
```

### 📱 小程序发布流程

1. **构建**
   ```powershell
   .\一键部署.ps1 -Target "weapp"
   ```

2. **打开微信开发者工具**
   - 导入项目: `ieclub-taro` 目录
   - 填写你的小程序 AppID

3. **上传发布**
   - 点击「上传」→ 填写版本号
   - 微信公众平台 → 提交审核 → 发布

### 🌐 访问地址

- **网页版**: https://ieclub.online
- **API**: https://ieclub.online/api
- **健康检查**: https://ieclub.online/api/health

### 📚 详细文档

- [部署文档](部署文档.md) - 完整部署指南（最常用操作在前）
- [双端开发指南](双端开发指南.md) - 双平台开发规范
- [产品开发路线图](产品开发路线图.md) - 产品规划

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE)

---

## 🙏 致谢

感谢所有为 IEClub 项目做出贡献的开发者、使用者和支持者！

特别感谢南方科技大学为我们提供的支持与平台。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！⭐**

Made with ❤️ by IEClub Team

[官网](https://ieclub.online) • [GitHub](https://github.com/tryandaction/ieclub_dev) • [反馈](https://github.com/tryandaction/ieclub_dev/issues)

</div>
