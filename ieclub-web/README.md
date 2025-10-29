# IEClub 网页�?

React + Vite 构建的现代化 Web 应用，与小程序共享统一后端数据

---

## 🎯 项目说明

这是 IEClub 的网页版，采�?**React 18 + Vite** 技术栈开发�?

### 核心特�?

- �?**快速启�?* - Vite 极速开发体�?
- 🎨 **统一设计** - 与小程序相同的设计语言
- 📱 **响应式布局** - 完美适配桌面和移动设�?
- 🔌 **统一数据** - 与小程序共用同一后端 API
- 🌈 **现代�?UI** - Tailwind CSS + 自定义组�?

---

## 📁 项目结构

```
ieclub-web/
├── src/
�?  ├── components/          # 组件
�?  �?  └── Layout.jsx      # 布局组件
�?  ├── pages/              # 页面
�?  �?  ├── Plaza.jsx       # 话题广场
�?  �?  ├── Community.jsx   # 社区
�?  �?  ├── Activities.jsx  # 活动
�?  �?  ├── Publish.jsx     # 发布
�?  �?  └── Profile.jsx     # 个人中心
�?  ├── App.jsx             # 主应�?
�?  ├── main.jsx            # 入口文件
�?  └── index.css           # 全局样式
�?
├── index.html              # HTML 模板
├── package.json            # 依赖配置
├── vite.config.js          # Vite 配置
└── tailwind.config.js      # Tailwind 配置
```

---

## 🚀 快速开�?

### 1. 安装依赖

```bash
cd ieclub-web
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

---

## 🎨 技术栈

| 技�?| 版本 | 用�?|
|------|------|------|
| React | 18.2.0 | UI 框架 |
| Vite | 5.0.8 | 构建工具 |
| React Router | 6.20.0 | 路由管理 |
| Tailwind CSS | 3.3.6 | 样式框架 |
| Zustand | 4.4.7 | 状态管�?|
| Axios | 1.6.2 | HTTP 请求 |

---

## 🌈 设计系统

### 色彩

与小程序保持一致：

- 主色: `#8b5cf6` (紫色)
- 渐变: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 文字: `#333` (�?, `#666` (�?, `#999` (�?
- 背景: `#f5f5f5`

### 组件

- **卡片**: `.card` - 白色背景，圆角阴�?
- **按钮**: `.btn-primary` - 渐变紫色
- **布局**: Flexbox / Grid 响应�?

---

## 📱 与小程序的区�?

| 对比�?| 网页�?| 小程序版 |
|--------|--------|----------|
| **框架** | React + Vite | 原生微信小程�?|
| **路由** | React Router | 小程序原生导�?|
| **样式** | Tailwind CSS | WXSS |
| **数据** | Axios | wx.request |
| **存储** | localStorage | wx.storage |

### 共同�?

�?相同�?UI 设计  
�?相同的功能模�? 
�?统一的后�?API  
�?统一的用户数�?

---

## 🔌 API 对接

### 配置

�?`vite.config.js` 中已配置代理�?

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

### 使用

```javascript
import axios from 'axios'

// 获取话题列表
const res = await axios.get('/api/topics')

// 发布话题
const res = await axios.post('/api/topics', data)
```

---

## 📦 部署

### 构建

```bash
npm run build
```

生成 `dist/` 目录

### 部署�?Nginx

```nginx
server {
  listen 80;
  server_name ieclub.online;
  
  root /var/www/ieclub-web/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://localhost:3000;
  }
}
```

---

## 🔄 开发计�?

### Phase 1: 基础框架 �?

- �?项目初始�?
- �?路由配置
- �?5 个核心页�?
- �?统一布局

### Phase 2: 数据对接 🔄

- [ ] 封装 API 工具
- [ ] 用户登录
- [ ] 实时数据展示

### Phase 3: 功能完善 �?

- [ ] 详情�?
- [ ] 搜索功能
- [ ] 消息通知

---

Made with ❤️ by IEClub Team


