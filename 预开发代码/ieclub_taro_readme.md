# 🎓 IEClub Taro 跨平台版本

> 一套代码，多端运行 - 基于 Taro + React + TypeScript 的企业级跨学科交流平台

## 📋 项目简介

IEClub Taro 版本是使用 Taro 框架开发的跨平台应用，支持编译到微信小程序、H5、App 等多个平台。采用 React 18 + TypeScript + Zustand 技术栈，提供完整的话题交流、评论互动、用户管理等功能。

## ✨ 已完成功能

### 🔐 用户系统
- ✅ 用户注册/登录
- ✅ JWT Token 认证
- ✅ 用户信息管理
- ✅ 自动登录状态检查
- ✅ 个人主页展示
- ✅ 用户统计数据

### 📝 话题系统
- ✅ 话题列表（分页加载）
- ✅ 话题详情页
- ✅ 创建话题（标题、内容、分类、标签、图片）
- ✅ 话题筛选（分类、排序）
- ✅ 点赞/收藏功能
- ✅ 搜索话题
- ✅ 热门话题推荐

### 💬 评论系统
- ✅ 评论列表展示
- ✅ 发表评论
- ✅ 回复评论
- ✅ 评论点赞
- ✅ 评论分页加载

### 🔔 通知系统
- ✅ 通知列表
- ✅ 未读消息提醒
- ✅ 标记已读/全部已读
- ✅ 通知类型分类（点赞、评论、关注等）

### 📱 通用功能
- ✅ 下拉刷新
- ✅ 上拉加载更多
- ✅ 图片上传（单张/多张）
- ✅ 图片预览
- ✅ 空状态展示
- ✅ 加载状态
- ✅ 错误处理
- ✅ Toast 提示

## 🏗️ 技术架构

### 核心技术栈

```
├── Taro 3.6+              # 跨平台框架
├── React 18               # UI 框架
├── TypeScript             # 类型安全
├── Zustand                # 状态管理（轻量级）
├── Sass                   # CSS 预处理器
└── Dayjs                  # 时间处理
```

### 支持平台

- ✅ **微信小程序** - 主要目标平台
- ✅ **H5 网站** - 移动端 Web
- ✅ **React Native** - iOS/Android App
- ✅ **其他小程序** - 支付宝、百度、字节跳动等

## 📂 项目结构

```
ieclub-taro/
├── src/
│   ├── pages/                    # 页面
│   │   ├── topics/              # 话题广场
│   │   ├── topic-detail/        # 话题详情
│   │   ├── create-topic/        # 创建话题
│   │   ├── login/               # 登录注册
│   │   ├── profile/             # 个人中心
│   │   └── notifications/       # 通知中心
│   │
│   ├── components/              # 通用组件
│   │   ├── TopicCard/          # 话题卡片
│   │   ├── TopicFilters/       # 话题筛选器
│   │   ├── CommentList/        # 评论列表
│   │   ├── CommentInput/       # 评论输入
│   │   ├── EmptyState/         # 空状态
│   │   └── LoadingSpinner/     # 加载动画
│   │
│   ├── services/               # API 服务层
│   │   ├── request.ts          # HTTP 请求封装
│   │   ├── user.ts             # 用户相关 API
│   │   ├── topic.ts            # 话题相关 API
│   │   ├── comment.ts          # 评论相关 API
│   │   ├── upload.ts           # 文件上传 API
│   │   └── notification.ts     # 通知相关 API
│   │
│   ├── store/                  # 状态管理
│   │   ├── user.ts            # 用户状态
│   │   ├── topic.ts           # 话题状态
│   │   ├── comment.ts         # 评论状态
│   │   └── notification.ts    # 通知状态
│   │
│   ├── types/                 # TypeScript 类型定义
│   │   └── index.ts          # 全局类型
│   │
│   ├── utils/                # 工具函数
│   │   ├── format.ts        # 格式化函数
│   │   └── validate.ts      # 验证函数
│   │
│   ├── styles/               # 全局样式
│   │   ├── variables.scss   # 样式变量
│   │   └── mixins.scss      # 样式混入
│   │
│   ├── app.tsx              # 应用入口
│   ├── app.config.ts        # 应用配置
│   └── app.scss             # 全局样式
│
├── config/                  # 构建配置
│   ├── index.js            # 基础配置
│   ├── dev.js              # 开发环境
│   └── prod.js             # 生产环境
│
├── project.config.json     # 小程序项目配置
├── package.json            # 项目依赖
└── tsconfig.json          # TypeScript 配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
TARO_APP_API_URL=https://api.ieclub.com
```

### 3. 开发模式

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5

# React Native
npm run dev:rn
```

### 4. 生产构建

```bash
# 微信小程序
npm run build:weapp

# H5
npm run build:h5

# React Native
npm run build:rn
```

## 📱 小程序开发

### 使用微信开发者工具

1. 下载并安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 运行 `npm run dev:weapp`
3. 在微信开发者工具中导入项目目录 `dist`
4. 开始调试

### 配置小程序信息

修改 `project.config.json`：

```json
{
  "miniprogramRoot": "dist/",
  "projectname": "ieclub",
  "appid": "your-appid",
  "setting": {
    "es6": false,
    "postcss": false,
    "minified": false
  }
}
```

## 🎨 设计规范

### 颜色系统

```scss
$primary-color: #667eea;          // 主色调
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$success-color: #10b981;          // 成功
$warning-color: #f59e0b;          // 警告
$error-color: #ef4444;            // 错误
```

### 间距系统

```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 20px;
$spacing-xxl: 24px;
```

### 字体系统

```scss
$font-xs: 12px;
$font-sm: 13px;
$font-md: 14px;
$font-lg: 16px;
$font-xl: 18px;
$font-xxl: 20px;
```

## 🔌 API 接口

### 基础配置

所有 API 请求都会自动添加：
- `Authorization` 头部（JWT Token）
- `X-Platform` 头部（平台标识）
- 统一的错误处理
- 自动 Token 过期处理

### 主要接口

```typescript
// 用户相关
login(params: LoginParams)              // 登录
register(params: RegisterParams)        // 注册
getUserProfile()                        // 获取用户信息
updateUserProfile(data)                 // 更新用户信息

// 话题相关
getTopicList(params)                    // 获取话题列表
getTopicDetail(topicId)                 // 获取话题详情
createTopic(data)                       // 创建话题
likeTopic(topicId)                      // 点赞话题

// 评论相关
getCommentList(topicId, page, limit)    // 获取评论列表
createComment(data)                     // 创建评论
likeComment(commentId)                  // 点赞评论

// 文件上传
uploadImage(filePath)                   // 上传单张图片
uploadImages(filePaths)                 // 批量上传图片

// 通知相关
getNotifications(page, limit)           // 获取通知列表
markAllNotificationsRead()              // 全部标记已读
```

## 📊 状态管理

使用 Zustand 进行状态管理，主要 Store：

### UserStore
```typescript
- token: 用户令牌
- userInfo: 用户信息
- isLogin: 登录状态
- login(): 登录方法
- logout(): 登出方法
- checkLoginStatus(): 检查登录状态
```

### TopicStore
```typescript
- topics: 话题列表
- currentTopic: 当前话题
- filters: 筛选条件
- fetchTopics(): 获取话题列表
- createTopic(): 创建话题
- likeTopic(): 点赞话题
```

### CommentStore
```typescript
- comments: 评论列表
- replyingTo: 正在回复的评论
- fetchComments(): 获取评论
- createComment(): 创建评论
```

### NotificationStore
```typescript
- notifications: 通知列表
- unreadCount: 未读数量
- fetchNotifications(): 获取通知
- markAllRead(): 全部已读
```

## 🎯 核心功能实现

### 下拉刷新 + 上拉加载

```tsx
<ScrollView
  scrollY
  refresherEnabled
  refresherTriggered={refreshing}
  onRefresherRefresh={onRefresh}
  onScrollToLower={onLoadMore}
  lowerThreshold={100}
>
  {/* 内容 */}
</ScrollView>
```

### 图片上传

```typescript
// 选择图片
const res = await Taro.chooseImage({
  count: 9,
  sizeType: ['compressed'],
  sourceType: ['album', 'camera']
})

// 批量上传
const urls = await uploadImages(res.tempFilePaths)
```

### 状态持久化

```typescript
// 自动保存到本地存储
Taro.setStorageSync('token', token)
Taro.setStorageSync('userInfo', userInfo)

// 应用启动时恢复
const token = Taro.getStorageSync('token')
const userInfo = Taro.getStorageSync('userInfo')
```

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面目录
2. 创建 `index.tsx`、`index.config.ts`、`index.scss`
3. 在 `src/app.config.ts` 注册页面路由

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/topics/index',
    'pages/your-new-page/index'  // 添加新页面
  ]
})
```

### 添加新组件

```tsx
// src/components/YourComponent/index.tsx
import { View, Text } from '@tarojs/components'
import './index.scss'

interface YourComponentProps {
  title: string
}

export default function YourComponent({ title }: YourComponentProps) {
  return (
    <View className='your-component'>
      <Text>{title}</Text>
    </View>
  )
}
```

### 添加新 API

```typescript
// src/services/your-service.ts
import { request } from './request'

export function yourApi(params: any) {
  return request({
    url: '/api/your-endpoint',
    method: 'POST',
    data: params
  })
}
```

### 添加新 Store

```typescript
// src/store/your-store.ts
import { create } from 'zustand'

interface YourState {
  data: any[]
  loading: boolean
  fetchData: () => Promise<void>
}

export const useYourStore = create<YourState>((set, get) => ({
  data: [],
  loading: false,
  
  fetchData: async () => {
    set({ loading: true })
    try {
      // 调用 API
      const res = await yourApi()
      set({ data: res.data })
    } finally {
      set({ loading: false })
    }
  }
}))
```

## 🎨 样式开发

### 使用样式变量

```scss
.your-component {
  color: $text-primary;
  font-size: $font-md;
  padding: $spacing-lg;
  border-radius: $radius-md;
  background: $primary-gradient;
}
```

### 使用样式混入

```scss
.your-text {
  @include text-ellipsis(2);  // 2行省略
}

.your-flex {
  @include flex-between;  // flex 两端对齐
}
```

### 响应式设计

```scss
.your-component {
  width: 100%;
  
  @include responsive(mobile) {
    font-size: 14px;
  }
  
  @include responsive(tablet) {
    font-size: 16px;
  }
}
```

## 📝 代码规范

### TypeScript 规范

```typescript
// ✅ 好的做法
interface User {
  id: string
  nickname: string
  avatar: string
}

function getUserInfo(userId: string): Promise<User> {
  return request<User>({
    url: `/api/users/${userId}`
  })
}

// ❌ 避免使用 any
function badFunction(data: any) { }
```

### 命名规范

- **组件名**: PascalCase (TopicCard, CommentList)
- **文件名**: kebab-case (topic-card.tsx, comment-list.tsx)
- **函数名**: camelCase (getUserInfo, createTopic)
- **常量名**: UPPER_SNAKE_CASE (BASE_URL, MAX_SIZE)
- **样式类名**: kebab-case (topic-card, comment-item)

### 组件规范

```tsx
// ✅ 推荐的组件结构
import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface ComponentProps {
  title: string
  onAction?: () => void
}

export default function Component({ title, onAction }: ComponentProps) {
  const [state, setState] = useState('')
  
  const handleClick = () => {
    onAction?.()
  }
  
  return (
    <View className='component'>
      <Text>{title}</Text>
    </View>
  )
}
```

## 🐛 调试技巧

### 小程序调试

```typescript
// 使用 console
console.log('Debug info:', data)
console.error('Error:', error)

// 使用 Taro.showModal 调试
Taro.showModal({
  title: 'Debug',
  content: JSON.stringify(data, null, 2)
})
```

### 网络请求调试

```typescript
// request.ts 中已包含完整日志
try {
  const response = await Taro.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header
  })
  console.log('API Response:', response)
} catch (error) {
  console.error('API Error:', error)
}
```

### React DevTools

H5 模式下可以使用 React DevTools：

```bash
npm run dev:h5
# 在浏览器中打开 http://localhost:10086
# 使用 React DevTools 插件调试
```

## 🚀 性能优化

### 1. 列表优化

```tsx
// 使用虚拟列表（长列表）
import { VirtualList } from '@tarojs/components'

<VirtualList
  height={500}
  itemData={topics}
  itemCount={topics.length}
  itemSize={100}
  item={TopicCard}
/>
```

### 2. 图片优化

```tsx
// 使用懒加载
<Image 
  src={url}
  lazyLoad
  mode='aspectFill'
/>

// 使用缩略图
<Image 
  src={`${url}?x-oss-process=image/resize,w_200`}
/>
```

### 3. 状态优化

```typescript
// 使用 selector 避免不必要的重渲染
const topics = useTopicStore(state => state.topics)

// 避免在组件中使用整个 store
// ❌ const store = useTopicStore()
// ✅ const { topics, fetchTopics } = useTopicStore()
```

### 4. 代码分割

```typescript
// 路由懒加载
const TopicDetail = lazy(() => import('./pages/topic-detail'))
```

## 📦 打包部署

### 微信小程序部署

1. **构建生产版本**
```bash
npm run build:weapp
```

2. **在微信开发者工具中上传**
   - 打开微信开发者工具
   - 导入 `dist` 目录
   - 点击"上传"按钮
   - 填写版本号和项目备注

3. **提交审核**
   - 登录[微信公众平台](https://mp.weixin.qq.com/)
   - 进入"版本管理"
   - 提交审核

### H5 部署

1. **构建生产版本**
```bash
npm run build:h5
```

2. **上传到服务器**
```bash
# 上传 dist/h5 目录到服务器
scp -r dist/h5/* user@server:/var/www/html/
```

3. **配置 Nginx**
```nginx
server {
  listen 80;
  server_name your-domain.com;
  
  location / {
    root /var/www/html;
    try_files $uri $uri/ /index.html;
  }
}
```

## 🔒 安全建议

### 1. Token 安全

```typescript
// 不要在代码中硬编码敏感信息
// ❌ const API_KEY = 'your-api-key'

// ✅ 使用环境变量
const API_URL = process.env.TARO_APP_API_URL
```

### 2. 输入验证

```typescript
// 前端验证
if (!title.trim() || title.length > 100) {
  Taro.showToast({ title: '标题长度为1-100字符', icon: 'none' })
  return
}

// 后端也必须验证
```

### 3. XSS 防护

```tsx
// React 默认会转义内容
<Text>{userInput}</Text>  // 安全

// 如果必须渲染 HTML，使用 dangerouslySetInnerHTML 要特别小心
```

## 📊 监控与分析

### 错误监控

```typescript
// 全局错误处理
Taro.onError((error) => {
  console.error('Global Error:', error)
  // 上报到错误监控平台
  reportError(error)
})
```

### 性能监控

```typescript
// 页面加载时间
const startTime = Date.now()

useEffect(() => {
  const loadTime = Date.now() - startTime
  console.log('Page load time:', loadTime)
}, [])
```

### 用户行为分析

```typescript
// 埋点示例
Taro.reportAnalytics('topic_view', {
  topic_id: topicId,
  user_id: userInfo?.id
})
```

## 🤝 贡献指南

### 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 添加话题搜索功能
fix: 修复评论无法加载的问题
docs: 更新 README 文档
style: 优化话题卡片样式
refactor: 重构用户状态管理
perf: 优化图片加载性能
test: 添加话题列表单元测试
chore: 更新依赖版本
```

### 分支管理

```bash
main          # 生产分支
develop       # 开发分支
feature/*     # 功能分支
bugfix/*      # 修复分支
hotfix/*      # 紧急修复分支
```

### Pull Request

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request
5. 等待代码审查

## 📞 技术支持

### 常见问题

**Q: 如何切换 API 环境？**
```bash
# 修改 .env 文件
TARO_APP_API_URL=https://api-dev.ieclub.com  # 开发环境
TARO_APP_API_URL=https://api.ieclub.com      # 生产环境
```

**Q: 如何调试网络请求？**
```typescript
// 在 request.ts 中添加日志
console.log('Request:', url, method, data)
console.log('Response:', response)
```

**Q: 如何适配不同平台？**
```typescript
import Taro from '@tarojs/taro'

if (process.env.TARO_ENV === 'weapp') {
  // 微信小程序特殊处理
} else if (process.env.TARO_ENV === 'h5') {
  // H5 特殊处理
}
```

### 联系方式

- 📧 Email: dev@ieclub.com
- 💬 微信群: 扫码加入开发者群
- 🐛 Bug 反馈: [GitHub Issues](https://github.com/ieclub/ieclub-taro/issues)

## 📄 开源协议

MIT License

Copyright (c) 2025 IEClub

---

## 🎉 项目亮点总结

### ✅ 已实现的核心功能

1. **完整的用户系统** - 注册、登录、个人中心、统计数据
2. **完善的话题系统** - 发布、浏览、筛选、搜索、点赞、收藏
3. **强大的评论系统** - 评论、回复、点赞、分页
4. **实时通知系统** - 消息推送、未读提醒、分类管理
5. **优秀的交互体验** - 下拉刷新、上拉加载、图片预览
6. **企业级代码质量** - TypeScript、模块化、组件化

### 🚀 技术优势

- **跨平台兼容** - 一套代码编译到微信小程序、H5、App
- **类型安全** - 完整的 TypeScript 类型定义
- **状态管理** - 轻量级 Zustand，性能优秀
- **模块化设计** - 清晰的目录结构，易于维护
- **开发体验** - 热更新、类型提示、代码规范

### 💪 生产就绪

- ✅ 完整的错误处理
- ✅ 统一的 API 封装
- ✅ 自动 Token 刷新
- ✅ 网络状态检测
- ✅ 加载状态管理
- ✅ 空状态处理
- ✅ 图片压缩上传
- ✅ 本地数据持久化

---

**🎊 恭喜！IEClub Taro 跨平台版本开发完成！**

现在您可以：
1. 运行 `npm run dev:weapp` 在微信开发者工具中预览
2. 运行 `npm run dev:h5` 在浏览器中查看 H5 版本
3. 根据需求继续扩展功能
4. 部署到生产环境

**祝您的项目顺利上线！** 🚀✨