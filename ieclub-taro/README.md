# IEClub 微信小程序

原生微信小程序版本 - 简单、稳定、高效

---

## 🎯 项目说明

这是 IEClub 的微信小程序端，使用**原生微信小程序**技术开发。

### 为什么选择原生开发？

1. ✅ **稳定可靠** - 没有跨平台框架的兼容性问题
2. ✅ **性能最优** - 零框架层开销，运行速度快
3. ✅ **调试方便** - 直接使用微信开发者工具，问题定位快
4. ✅ **官方支持** - 完整的文档和社区支持
5. ✅ **学习成本低** - 代码简单清晰，易于维护

---

## 📱 功能页面

### 1. 话题广场 (pages/plaza)
- Tab 切换（推荐、我来讲、想听、项目）
- 话题卡片展示（瀑布流布局）
- 话题类型标识
- 点击查看详情

### 2. 社区 (pages/community)
- 用户卡片展示
- 关注/取消关注
- 用户信息展示

### 3. 活动 (pages/activities)
- 活动列表展示
- 活动信息（时间、地点、人数）
- 立即报名功能

### 4. 发布 (pages/publish)
- 类型选择（我来讲、想听、项目）
- 表单输入（标题、描述）
- 发布功能

### 5. 个人中心 (pages/profile)
- 用户信息展示
- 数据统计
- 功能菜单

---

## 🚀 快速开始

### 1. 安装微信开发者工具

下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2. 打开项目

1. 启动微信开发者工具
2. 选择"导入项目"
3. 项目目录选择当前文件夹
4. AppID 选择"测试号"或输入你的 AppID
5. 点击"导入"

### 3. 开始开发

点击"编译"按钮，小程序即可运行！

---

## 📁 项目结构

```
ieclub-taro/
├── app.js                    # 小程序入口逻辑
├── app.json                  # 全局配置（页面路由、窗口样式、TabBar等）
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json             # 搜索配置
│
├── pages/                    # 页面目录
│   ├── plaza/               # 话题广场页
│   │   ├── index.js         # 页面逻辑
│   │   ├── index.wxml       # 页面结构
│   │   ├── index.wxss       # 页面样式
│   │   └── index.json       # 页面配置
│   │
│   ├── community/           # 社区页
│   ├── activities/          # 活动页
│   ├── publish/             # 发布页
│   └── profile/             # 个人中心页
│
└── assets/                  # 静态资源
    └── icons/               # 图标（TabBar等）
```

---

## 🎨 开发规范

### 页面开发流程

1. **在 app.json 注册页面**
```json
{
  "pages": [
    "pages/example/index"
  ]
}
```

2. **创建页面文件**
```bash
pages/example/
├── index.js      # 必需
├── index.wxml    # 必需
├── index.wxss    # 可选
└── index.json    # 可选
```

3. **编写页面逻辑**
```javascript
// index.js
Page({
  data: {
    message: 'Hello'
  },
  
  onLoad() {
    console.log('页面加载')
  }
})
```

4. **编写页面结构**
```xml
<!-- index.wxml -->
<view class="container">
  <text>{{message}}</text>
</view>
```

5. **编写页面样式**
```css
/* index.wxss */
.container {
  padding: 30rpx;
}
```

---

## 🔧 常用 API

### 页面跳转

```javascript
// 保留当前页，跳转到应用内某个页面
wx.navigateTo({
  url: '/pages/detail/index?id=1'
})

// 关闭当前页，跳转到应用内某个页面
wx.redirectTo({
  url: '/pages/index/index'
})

// 跳转到 tabBar 页面
wx.switchTab({
  url: '/pages/plaza/index'
})

// 返回上一页
wx.navigateBack({
  delta: 1
})
```

### 数据请求

```javascript
wx.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success(res) {
    console.log(res.data)
  },
  fail(err) {
    console.error(err)
  }
})
```

### 提示框

```javascript
// 成功提示
wx.showToast({
  title: '成功',
  icon: 'success',
  duration: 2000
})

// 加载提示
wx.showLoading({
  title: '加载中'
})
wx.hideLoading()

// 确认框
wx.showModal({
  title: '提示',
  content: '确定要删除吗？',
  success(res) {
    if (res.confirm) {
      console.log('用户点击确定')
    }
  }
})
```

### 数据存储

```javascript
// 存储
wx.setStorageSync('key', 'value')

// 读取
const value = wx.getStorageSync('key')

// 删除
wx.removeStorageSync('key')

// 清空
wx.clearStorageSync()
```

---

## 🎨 设计规范

### 颜色

- 主色: `#8b5cf6` (紫色)
- 渐变: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 文字: `#333` (主), `#666` (次), `#999` (辅)
- 背景: `#f5f5f5`

### 尺寸（rpx）

- 页面边距: `30rpx`
- 卡片内边距: `30rpx`
- 卡片圆角: `16rpx`
- 按钮圆角: `12rpx`

### 字体

- 标题: `36rpx` (粗体)
- 正文: `28rpx`
- 辅助: `24rpx`
- 小字: `22rpx`

---

## 📚 学习资源

- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [WXML 语法参考](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)
- [WXSS 语法参考](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html)
- [API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)

---

## 🐛 调试技巧

### 1. 控制台调试

在微信开发者工具中打开"调试器" → "Console"，可以查看 `console.log` 输出。

### 2. 查看数据

在"调试器" → "AppData" 中可以实时查看页面数据。

### 3. 网络请求

在"调试器" → "Network" 中可以查看所有网络请求。

### 4. 真机调试

点击工具栏的"真机调试"，可以在真实手机上调试。

---

## ⚠️ 注意事项

1. **AppID**: 首次使用请在 `project.config.json` 中填写你的 AppID
2. **域名配置**: 正式环境需要在小程序管理后台配置服务器域名
3. **体验版**: 开发完成后可以上传代码生成体验版供他人测试
4. **审核发布**: 测试通过后提交审核，审核通过即可正式发布

---

## 📝 更新日志

### v2.0.0 (2025-10-29)

- ✅ 从 Taro 迁移到原生小程序
- ✅ 重写所有5个核心页面
- ✅ 优化代码结构
- ✅ 提升运行性能
- ✅ 完善开发文档

---

Made with ❤️ by IEClub Team
