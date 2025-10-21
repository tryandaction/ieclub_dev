# IEClub Taro 小程序

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动后端服务器
确保你的后端服务器正在运行，默认地址是 `http://localhost:3000`

如果你修改了后端服务器端口，请编辑 `src/pages/square/index.tsx` 文件中的 `API_CONFIG`：

```typescript
const API_CONFIG = {
  development: 'http://your-server-address:port/api',
  production: 'https://your-production-server.com/api'
};
```

### 3. 编译运行
```bash
# 微信小程序
npm run dev:weapp

# H5版本
npm run dev:h5
```

## 📱 微信开发者工具配置

1. 打开微信开发者工具
2. 导入项目：选择 `ieclub-taro` 目录
3. 确认基础库版本：建议使用 2.10.0 及以上版本
4. 点击编译运行

## 🔧 常见问题解决

### 连接后端服务器失败
- 确认后端服务器已启动
- 检查服务器地址和端口配置
- 查看微信开发者工具的网络安全配置

### 图标显示异常
- 项目已配置纯CSS绘制的专业图标
- 无需外部图片文件或字体库
- 如有显示问题，请检查CSS样式是否正确加载

### TabBar导航错误
- 项目已正确配置TabBar页面和非TabBar页面
- 搜索页面是非TabBar页面，使用 `navigateTo` 跳转
- 其他TabBar页面之间使用 `switchTab` 切换

## 📁 项目结构

```
ieclub-taro/
├── src/
│   ├── components/          # 公共组件
│   │   ├── CustomIcons/     # 图标组件（纯CSS实现）
│   │   └── ...
│   ├── custom-tab-bar/      # 自定义TabBar组件
│   ├── pages/              # 页面组件
│   └── ...
├── config/                 # 构建配置
└── package.json
```

## 🎨 图标系统

项目使用纯CSS绘制的图标，无需外部依赖：

- 🏠 广场 - 网格布局图标
- 🔍 搜索 - 放大镜图标
- ➕ 发布 - 渐变圆形加号
- 🔔 通知 - 铃铛图标（带红点提示）
- 👤 我的 - 用户头像图标

所有图标均为代码实现，无需图片文件。