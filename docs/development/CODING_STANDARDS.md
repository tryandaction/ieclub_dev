# IEClub 开发规范

> 确保代码质量，防止常见错误，提升团队协作效率

## 📋 目录

- [通用规范](#通用规范)
- [前端规范](#前端规范)
- [后端规范](#后端规范)
- [小程序规范](#小程序规范)
- [Git 规范](#git-规范)
- [错误处理规范](#错误处理规范)
- [API 设计规范](#api-设计规范)
- [测试规范](#测试规范)

---

## 通用规范

### 1. 代码风格

```javascript
// ✅ 好的命名
const userProfile = getUserProfile()
const isAuthenticated = checkAuth()
const MAX_RETRY_COUNT = 3

// ❌ 不好的命名
const data = getData()
const flag = check()
const num = 3
```

### 2. 注释规范

```javascript
/**
 * 获取用户信息
 * @param {string} userId - 用户ID
 * @param {Object} options - 选项
 * @param {boolean} options.includeProfile - 是否包含详细信息
 * @returns {Promise<User>} 用户对象
 * @throws {Error} 用户不存在时抛出错误
 */
async function getUserInfo(userId, options = {}) {
  // 实现代码...
}
```

### 3. 文件组织

```
src/
├── components/     # 可复用组件
├── pages/          # 页面组件
├── utils/          # 工具函数
├── api/            # API 接口
├── hooks/          # 自定义 Hooks
├── contexts/       # Context 上下文
└── stores/         # 状态管理
```

---

## 前端规范

### 1. React 组件规范

```jsx
// ✅ 推荐的组件结构
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * 用户卡片组件
 * 显示用户基本信息和操作按钮
 */
export default function UserCard({ user, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // 副作用逻辑
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
    onEdit?.(user)
  }

  return (
    <div className="user-card">
      {/* JSX 内容 */}
    </div>
  )
}

// PropTypes 类型检查
UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
}

// 默认属性
UserCard.defaultProps = {
  onEdit: null,
  onDelete: null
}
```

### 2. API 调用规范

```javascript
// ✅ 推荐：使用统一的响应处理
import { extractData, extractErrorMessage } from '../utils/apiResponseHandler'

async function fetchUserList() {
  try {
    const response = await api.get('/users')
    const data = extractData(response, [])
    return data
  } catch (error) {
    const message = extractErrorMessage(error)
    console.error('获取用户列表失败:', message)
    throw error
  }
}

// ❌ 不推荐：直接访问响应数据
async function fetchUserList() {
  const response = await api.get('/users')
  return response.data.data.list // 可能导致 undefined 错误
}
```

### 3. 错误处理规范

```javascript
// ✅ 推荐：完善的错误处理
async function submitForm(formData) {
  try {
    const response = await api.post('/submit', formData)
    const data = extractData(response)
    
    // 成功提示
    toast.success('提交成功')
    return data
  } catch (error) {
    // 提取错误信息
    const message = extractErrorMessage(error)
    
    // 用户友好的错误提示
    toast.error(message || '提交失败，请重试')
    
    // 记录错误日志
    logger.error('表单提交失败', error)
    
    // 重新抛出错误，让调用者处理
    throw error
  }
}
```

### 4. 状态管理规范

```javascript
// ✅ 推荐：使用 Zustand 进行状态管理
import { create } from 'zustand'

const useUserStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  
  fetchUser: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const user = await api.getUser(userId)
      set({ user, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  clearUser: () => set({ user: null, error: null })
}))
```

---

## 后端规范

### 1. 路由规范

```javascript
// ✅ 推荐：RESTful API 设计
const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { validate } = require('../middleware/validation')
const userController = require('../controllers/userController')

// 获取用户列表
router.get('/', auth, userController.getUsers)

// 获取单个用户
router.get('/:id', auth, userController.getUser)

// 创建用户
router.post('/', auth, validate.createUser, userController.createUser)

// 更新用户
router.put('/:id', auth, validate.updateUser, userController.updateUser)

// 删除用户
router.delete('/:id', auth, userController.deleteUser)

module.exports = router
```

### 2. 控制器规范

```javascript
// ✅ 推荐：使用统一的响应格式
const { success, error } = require('../utils/response')
const { asyncHandler } = require('../utils/asyncHandler')

exports.getUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  // 参数验证
  if (!id) {
    return error(res, '用户ID不能为空', 400)
  }

  // 业务逻辑
  const user = await userService.getUserById(id)

  if (!user) {
    return error(res, '用户不存在', 404)
  }

  // 返回成功响应
  return success(res, user, '获取用户成功')
})
```

### 3. 服务层规范

```javascript
// ✅ 推荐：业务逻辑放在服务层
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class UserService {
  /**
   * 根据ID获取用户
   */
  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true
        // 不返回敏感信息如密码
      }
    })

    return user
  }

  /**
   * 创建用户
   */
  async createUser(userData) {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new Error('邮箱已被注册')
    }

    // 创建用户
    const user = await prisma.user.create({
      data: userData
    })

    return user
  }
}

module.exports = new UserService()
```

### 4. 数据库查询规范

```javascript
// ✅ 推荐：使用 Prisma 进行类型安全的查询
const users = await prisma.user.findMany({
  where: {
    status: 'active',
    role: {
      in: ['user', 'moderator']
    }
  },
  select: {
    id: true,
    username: true,
    email: true
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10,
  skip: 0
})

// ❌ 不推荐：直接使用原始 SQL（除非必要）
const users = await prisma.$queryRaw`SELECT * FROM users`
```

---

## 小程序规范

### 1. 页面结构规范

```javascript
// pages/user/profile.js
Page({
  data: {
    user: null,
    loading: false,
    error: null
  },

  onLoad(options) {
    this.loadUserProfile()
  },

  async loadUserProfile() {
    this.setData({ loading: true, error: null })
    
    try {
      const user = await api.getUserProfile()
      this.setData({ user, loading: false })
    } catch (error) {
      this.setData({ 
        error: error.message, 
        loading: false 
      })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  }
})
```

### 2. API 请求规范

```javascript
// ✅ 推荐：使用统一的请求封装
const request = require('../../utils/request')

// 获取用户信息
export function getUserInfo(userId) {
  return request(`/users/${userId}`, {
    method: 'GET'
  })
}

// 更新用户信息
export function updateUserInfo(userId, data) {
  return request(`/users/${userId}`, {
    method: 'PUT',
    data
  })
}
```

### 3. 配置验证规范

```javascript
// app.js
const { validateAll } = require('./utils/configValidator')

App({
  onLaunch() {
    // 验证配置
    const configResult = validateAll()
    if (!configResult.valid) {
      console.error('⚠️ 配置验证失败')
      // 可以显示错误提示
    }
  }
})
```

---

## Git 规范

### 1. 提交信息格式

```bash
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链更新

**示例：**
```bash
feat(auth): 添加邮箱验证功能

- 实现验证码发送接口
- 添加验证码验证逻辑
- 更新用户注册流程

Closes #123
```

### 2. 分支管理

```bash
main          # 主分支，生产环境代码
develop       # 开发分支
feature/*     # 功能分支
fix/*         # 修复分支
hotfix/*      # 紧急修复分支
```

---

## 错误处理规范

### 1. 前端错误处理

```javascript
// ✅ 推荐：多层错误处理
import { extractErrorMessage } from '../utils/apiResponseHandler'
import logger from '../utils/logger'

async function handleUserAction() {
  try {
    // 业务逻辑
    const result = await api.doSomething()
    return result
  } catch (error) {
    // 1. 提取错误信息
    const message = extractErrorMessage(error)
    
    // 2. 记录错误日志
    logger.error('用户操作失败', error)
    
    // 3. 用户友好提示
    toast.error(message)
    
    // 4. 错误上报（生产环境）
    if (import.meta.env.PROD) {
      errorMonitor.captureError(error)
    }
    
    // 5. 重新抛出或返回默认值
    throw error
  }
}
```

### 2. 后端错误处理

```javascript
// ✅ 推荐：使用自定义错误类
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// 使用示例
if (!user) {
  throw new AppError('用户不存在', 404, 'USER_NOT_FOUND')
}
```

---

## API 设计规范

### 1. 统一响应格式

```javascript
// ✅ 成功响应
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    // 实际数据
  }
}

// ✅ 错误响应
{
  "success": false,
  "code": 400,
  "message": "参数错误",
  "error": "INVALID_PARAMS"
}
```

### 2. RESTful 设计

```
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
```

### 3. 分页规范

```javascript
// 请求
GET /api/users?page=1&pageSize=10

// 响应
{
  "success": true,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## 测试规范

### 1. 单元测试

```javascript
// ✅ 推荐：使用 Jest 进行单元测试
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      const user = await userService.getUserById(1)
      expect(user).toBeDefined()
      expect(user.id).toBe(1)
    })

    it('should return null when user does not exist', async () => {
      const user = await userService.getUserById(9999)
      expect(user).toBeNull()
    })
  })
})
```

### 2. 集成测试

```javascript
// ✅ 推荐：测试完整的 API 流程
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@mail.sustech.edu.cn',
        password: 'Test123456',
        username: 'testuser'
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('token')
  })
})
```

---

## 常见错误及预防

### 1. ❌ 未检查响应数据结构

```javascript
// ❌ 错误
const count = res.data.data.count // 可能导致 undefined 错误

// ✅ 正确
const count = res?.data?.data?.count || 0
// 或使用工具函数
const count = safeGet(res, 'data.data.count', 0)
```

### 2. ❌ API 地址配置错误

```javascript
// ❌ 错误：包含 www
apiBase: 'https://www.ieclub.online/api'

// ✅ 正确
apiBase: 'https://ieclub.online/api'
```

### 3. ❌ 缺少错误处理

```javascript
// ❌ 错误
async function fetchData() {
  const data = await api.getData()
  return data
}

// ✅ 正确
async function fetchData() {
  try {
    const data = await api.getData()
    return data
  } catch (error) {
    logger.error('获取数据失败', error)
    throw error
  }
}
```

### 4. ❌ 硬编码配置

```javascript
// ❌ 错误
const API_URL = 'http://localhost:3000/api'

// ✅ 正确
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api'
```

---

## 配置检查清单

### 部署前检查

- [ ] API 地址配置正确（不包含 www）
- [ ] 环境变量已设置
- [ ] 所有依赖已安装
- [ ] 数据库迁移已执行
- [ ] 代码已通过 lint 检查
- [ ] 所有测试已通过
- [ ] 敏感信息未提交到 Git
- [ ] 错误处理已完善
- [ ] 日志记录已添加
- [ ] 性能优化已完成

---

## 工具推荐

### 代码质量
- ESLint - JavaScript 代码检查
- Prettier - 代码格式化
- Husky - Git hooks

### 测试
- Jest - 单元测试
- Supertest - API 测试

### 调试
- Chrome DevTools
- React DevTools
- 微信开发者工具

---

**最后更新**: 2025-11-01
**维护者**: IEClub 开发团队

