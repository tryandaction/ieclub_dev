# IEclub 开发规范

## 🎯 核心原则

### 双端同步开发
**关键要求**：任何功能的开发必须同时在网页和小程序实现

- **网页端**：`ieclub-web/` - React + Vite
- **小程序端**：`ieclub-frontend/` - 微信小程序原生

### 响应式设计
**网页端必须支持响应式布局**：
- 桌面端（≥1024px）
- 平板端（768px - 1023px）
- 移动端（<768px）

当前已有响应式代码基础，新功能需保持一致。

---

## 📂 项目结构

```
IEclub_dev/
├── ieclub-backend/          # Node.js + Express + Prisma
├── ieclub-web/              # React 网页应用
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── contexts/        # React Context
│   │   ├── utils/           # 工具函数（request.js）
│   │   └── api/             # API 接口
│   └── ...
└── ieclub-frontend/         # 微信小程序
    ├── pages/               # 小程序页面
    ├── components/          # 小程序组件
    ├── utils/               # 工具函数（request.js）
    ├── api/                 # API 接口
    └── app.js               # 小程序入口
```

---

## 🔄 开发工作流

### 1. 需求分析
- 确认功能在网页和小程序的实现方式
- 考虑平台差异（如支付、分享、定位等）

### 2. 后端开发
```bash
cd ieclub-backend
# 开发 API 接口
npm run dev
```

### 3. 网页端开发
```bash
cd ieclub-web
npm run dev
```

**关键文件**：
- 页面：`src/pages/`
- API 调用：`src/api/`
- 请求工具：`src/utils/request.js`
- 状态管理：`src/contexts/`

### 4. 小程序端开发
使用微信开发者工具打开 `ieclub-frontend/`

**关键文件**：
- 页面：`pages/`
- API 调用：`api/`
- 请求工具：`utils/request.js`

### 5. 同步检查清单
- [ ] 后端 API 已完成
- [ ] 网页端功能已实现
- [ ] 小程序功能已实现
- [ ] 两端 UI 保持一致（符合各自平台规范）
- [ ] 两端交互逻辑一致
- [ ] 错误处理一致
- [ ] 已测试验证

---

## 🎨 UI/UX 规范

### 网页端
- 使用 Tailwind CSS
- 遵循 Material Design / 现代扁平化设计
- 必须响应式设计
- 支持深色模式（可选）

### 小程序端
- 遵循微信小程序设计规范
- 使用 WXSS
- 组件化开发
- 适配不同屏幕尺寸

---

## 🔐 认证系统

### Token 机制（已实现）
两端统一使用双 Token 机制：

**Access Token**：
- 有效期：2 小时
- 存储：localStorage (网页) / Storage (小程序)
- 用途：API 请求认证

**Refresh Token**：
- 有效期：30 天
- 存储：localStorage (网页) / Storage (小程序)
- 用途：刷新 Access Token

### 实现要点
1. **请求拦截器**（`utils/request.js`）
   - 自动添加 Authorization header
   - 401 错误自动刷新 Token
   - 防并发刷新机制

2. **登录/注册**
   - 保存 `accessToken` 和 `refreshToken`
   - 兼容旧格式 `token`

3. **登出**
   - 清除两个 Token
   - 调用后端撤销接口

---

## 📡 API 调用规范

### 网页端（`ieclub-web/src/utils/request.js`）
```javascript
import request from '@/utils/request'

// GET 请求
const data = await request.get('/api/users')

// POST 请求
const result = await request.post('/api/users', { name: 'test' })
```

### 小程序端（`ieclub-frontend/utils/request.js`）
```javascript
import request from '../../utils/request'

// 请求
const data = await request('/users', {
  method: 'POST',
  data: { name: 'test' }
})
```

### 统一错误处理
- 网络错误：显示重试提示
- 401：自动刷新 Token
- 403：权限不足提示
- 404：接口不存在提示
- 500：服务器错误提示

---

## 🧪 测试规范

### 功能测试
1. **网页端**
   - Chrome DevTools 响应式模式
   - 测试桌面/平板/移动端布局

2. **小程序端**
   - 微信开发者工具
   - 真机预览测试

### 兼容性测试
- **网页**：Chrome, Safari, Firefox, Edge
- **小程序**：iOS, Android

---

## 📝 提交规范

### Commit Message 格式
```
<type>: <description>

[optional body]
```

**Type 类型**：
- `feat`: 新功能（网页和小程序都要标注）
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/配置相关

**示例**：
```bash
# 单端修改
git commit -m "feat(web): 添加用户个人资料页面"

# 双端同步
git commit -m "feat: 实现 Token 自动刷新

- 网页端实现自动刷新逻辑
- 小程序端实现自动刷新逻辑
- 后端添加刷新接口"
```

---

## ⚠️ 常见问题

### 1. 只实现了网页端，忘记小程序
**解决**：每次完成网页功能后，立即实现小程序对应功能

### 2. 两端 API 调用不一致
**解决**：统一封装 API 接口，两端调用相同的接口函数

### 3. 响应式布局遗漏
**解决**：使用 Tailwind 响应式类名，开发时用 DevTools 验证

---

## 📋 开发检查清单

### 新功能开发
- [ ] 后端 API 设计
- [ ] 数据库 Schema 更新（如需要）
- [ ] 后端接口实现
- [ ] 后端单元测试
- [ ] **网页端功能实现**
- [ ] **网页端响应式验证**
- [ ] **小程序端功能实现**
- [ ] **小程序端真机测试**
- [ ] 文档更新
- [ ] 代码审查
- [ ] 合并到 develop 分支

### 部署前检查
- [ ] 后端环境变量配置
- [ ] 数据库迁移
- [ ] 后端服务重启
- [ ] 网页构建部署
- [ ] 小程序提审（如需要）
- [ ] 功能验证

---

## 🚀 当前已实现功能

### ✅ Token 刷新机制
- [x] 后端 API（`/auth/refresh`, `/auth/logout`, `/auth/logout-all`）
- [x] 网页端自动刷新
- [x] 小程序端自动刷新
- [x] 防并发刷新
- [x] 两端功能一致

### 🚧 进行中
参考 `AUTH_SYSTEM_PLAN.md` 查看认证系统开发计划

---

## 📖 参考文档

- **后端**：[Prisma 文档](https://www.prisma.io/docs)
- **网页**：[React 文档](https://react.dev) | [Tailwind CSS](https://tailwindcss.com)
- **小程序**：[微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

---

**记住**：网页和小程序必须同步开发，缺一不可！
