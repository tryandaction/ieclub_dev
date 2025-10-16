# IEClub 智能话题广场

基于 Taro + React + TypeScript 开发的跨平台智能话题社区应用。

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Taro CLI >= 3.6.0

### 安装依赖
```bash
npm install
```

### 开发模式

#### 微信小程序
```bash
npm run dev:weapp
```

#### H5 版本
```bash
npm run dev:h5
```

### 生产构建

#### 微信小程序
```bash
npm run build:weapp:prod
```

#### H5 版本
```bash
npm run build:h5:prod
```

## 📁 项目结构

```
ieclub-taro/
├── src/
│   ├── components/     # 组件
│   ├── pages/         # 页面
│   ├── services/      # 服务层
│   ├── store/         # 状态管理
│   ├── hooks/         # 自定义 Hooks
│   ├── utils/         # 工具函数
│   ├── types/         # 类型定义
│   └── styles/        # 样式文件
├── config/            # 构建配置
├── dist/              # 构建产物
├── .env*              # 环境配置
└── project.config.json # 小程序配置
```

## 🔧 环境配置

### 开发环境 (.env)
```env
TARO_APP_API_URL=https://api.ieclub.online
NODE_ENV=development
```

### 生产环境 (.env.production)
```env
TARO_APP_API_URL=https://api.ieclub.online
NODE_ENV=production
TARO_APP_BUILD_ENV=production
```

### 内测环境 (.env.beta)
```env
TARO_APP_API_URL=https://api-beta.ieclub.online
NODE_ENV=production
TARO_APP_BUILD_ENV=beta
```

## 📱 功能特性

- ✅ 智能话题推荐
- ✅ 实时消息推送
- ✅ 离线数据缓存
- ✅ 渐进式图片加载
- ✅ 虚拟列表性能优化
- ✅ 跨平台支持 (微信小程序/H5)

## 🛠️ 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev:weapp` | 微信小程序开发模式 |
| `npm run dev:h5` | H5 开发模式 |
| `npm run build:weapp:prod` | 微信小程序生产构建 |
| `npm run build:h5:prod` | H5 生产构建 |
| `npm run build:weapp:beta` | 微信小程序内测构建 |
| `npm run build:h5:beta` | H5 内测构建 |
| `npm run lint` | 代码检查 |
| `npm run lint:fix` | 自动修复代码问题 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run clean` | 清理构建缓存 |
| `npm run analyze` | 构建产物分析 |

## 🚀 部署说明

### 服务器要求
- Ubuntu 20.04+ / CentOS 7+
- Node.js 18+
- Nginx
- PM2 (推荐)

### 快速部署
```bash
# 1. 克隆项目
git clone https://github.com/your-username/ieclub.git
cd ieclub/ieclub-taro

# 2. 安装依赖
npm install

# 3. 构建生产版本
npm run build:h5:prod

# 4. 配置 Nginx (见部署方案.md)
# 5. 启动服务
```

详细部署步骤请参考 [部署方案.md](./部署方案.md)

## 📋 发布清单

### 小程序发布前检查
- [ ] 更新 `project.config.json` 中的 AppID
- [ ] 配置正确的 API 地址
- [ ] 构建生产版本
- [ ] 在微信开发者工具中测试
- [ ] 提交审核并发布

### H5 发布前检查
- [ ] 配置生产环境变量
- [ ] 构建生产版本
- [ ] 配置 Nginx 和 SSL
- [ ] 测试域名访问
- [ ] 配置 CDN (可选)

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目主页: https://www.ieclub.online
- 邮箱: contact@ieclub.online

---

**IEClub** - 让智能连接更简单 🤝