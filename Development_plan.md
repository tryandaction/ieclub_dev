# IEClub 主开发计划（Master Development Plan）

**版本**: v2.0.0  
**制定时间**: 2025-10-29  
**负责人**: 产品 + 技术团队  
**项目代号**: Phoenix（凤凰）

> "打造最优秀的学术创业社区平台"

---

## 📊 执行摘要（Executive Summary）

### 项目概览

**目标**: 3周内完成 MVP，5周内正式上线

**当前进度**: 15% （基础架构完成）

**下一里程碑**: Week 1 结束 - 用户登录系统上线

**风险等级**: 🟢 低风险（架构稳定，技术栈成熟）

### 核心指标

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| 代码完成度 | 100% | 15% | 🟡 进行中 |
| 功能完成度 | 100% | 10% | 🟡 进行中 |
| 测试覆盖率 | 80% | 0% | ⏳ 未开始 |
| 性能指标 | <2s | N/A | ⏳ 未测试 |
| Bug 数量 | 0 P0/P1 | 0 | 🟢 正常 |

---

## 🎯 Part 1: 现状分析（Current State Analysis）

### 1.1 已完成工作（✅ Completed）

#### 技术基础设施（100%）

**双端项目框架**:
```
✅ ieclub-web/          - React 18 + Vite + Tailwind CSS
✅ ieclub-frontend/     - 原生微信小程序
✅ ieclub-backend/      - Node.js + Express + MySQL
```

**API 层完整**:
```
✅ 网页版 API 封装      - Axios + 拦截器 + 错误处理
✅ 小程序 API 封装      - wx.request Promise 化
✅ API 模块化           - auth/topic/user 三大模块
✅ 统一响应格式         - {code, data, message}
✅ Token 管理           - 自动注入 + 过期处理
```

**UI 框架**:
```
✅ 网页版 5 个页面      - Plaza/Community/Activities/Publish/Profile
✅ 小程序 5 个页面      - 同上
✅ 设计系统             - 色彩/字体/间距/圆角/阴影
✅ 响应式布局           - 桌面端 + 移动端
```

**文档体系**:
```
✅ README.md                      - 项目总览
✅ Dual_platform_guide.md         - 架构说明
✅ Product_roadmap.md             - 产品规划
✅ Weekly_tasks.md                - 周任务
✅ Quick_start.md                 - 启动指南
✅ Changelog.md                   - 更新日志
✅ Project_status.md              - 项目状态
```

#### 评估结果

| 评估项 | 分数 | 说明 |
|--------|------|------|
| 架构设计 | 9/10 | 双端统一架构优秀 |
| 代码质量 | 8/10 | 规范清晰，需补充注释 |
| 文档完整性 | 9/10 | 文档齐全 |
| 可扩展性 | 9/10 | 模块化良好 |
| 总体评分 | **8.75/10** | 🌟 优秀 |

---

### 1.2 待完成工作（🔄 Pending）

#### 核心功能（0%）

**用户系统**:
```
⏳ 用户注册登录        - 0%
⏳ 用户信息管理        - 0%
⏳ 用户权限控制        - 0%
```

**话题系统**:
```
⏳ 话题发布            - 0%
⏳ 话题浏览            - 0%（目前是 mock 数据）
⏳ 话题详情            - 0%
⏳ 话题互动            - 0%
```

**社区系统**:
```
⏳ 用户列表            - 0%（目前是 mock 数据）
⏳ 关注功能            - 0%
⏳ 用户主页            - 0%
```

**活动系统**:
```
⏳ 活动发布            - 0%
⏳ 活动报名            - 0%
⏳ 活动管理            - 0%
```

#### 后端 API（需确认）

**需要确认后端接口是否已实现**:
```
❓ POST /api/auth/login
❓ POST /api/auth/wechat-login
❓ GET  /api/auth/me
❓ GET  /api/topics
❓ POST /api/topics
❓ POST /api/topics/:id/like
❓ GET  /api/users
❓ POST /api/users/:id/follow
```

---

### 1.3 技术债务（Technical Debt）

#### 高优先级

1. **后端接口确认** 🔴
   - 当前状态：前端 API 已封装，但后端接口是否实现未知
   - 影响：无法进行功能开发
   - 解决方案：立即检查后端，补充缺失接口
   - 预计工时：2-4 小时

2. **登录页面缺失** 🔴
   - 当前状态：有 5 个主页面，但没有登录页
   - 影响：用户无法登录
   - 解决方案：创建登录页（网页版 + 小程序）
   - 预计工时：4 小时

3. **状态管理缺失** 🟡
   - 当前状态：页面使用 mock 数据，没有全局状态
   - 影响：数据无法共享，用户登录状态无法维护
   - 解决方案：集成 Zustand（网页版）+ 全局 data（小程序）
   - 预计工时：3 小时

#### 中优先级

4. **错误边界处理** 🟡
   - 当前状态：基础错误处理完成，缺少错误边界组件
   - 影响：页面崩溃无法恢复
   - 解决方案：添加 ErrorBoundary
   - 预计工时：2 小时

5. **Loading 组件** 🟡
   - 当前状态：只有 console.log
   - 影响：用户体验差
   - 解决方案：创建全局 Loading 组件
   - 预计工时：2 小时

---

### 1.4 风险评估（Risk Assessment）

| 风险项 | 等级 | 概率 | 影响 | 应对措施 |
|--------|------|------|------|----------|
| 后端接口不完整 | 🔴 高 | 70% | 高 | 立即检查，必要时自己补充 |
| 3周时间不够 | 🟡 中 | 40% | 中 | 削减功能，聚焦 MVP |
| 双端不一致 | 🟢 低 | 20% | 中 | 严格测试，代码审查 |
| 性能问题 | 🟢 低 | 30% | 低 | 性能监控，及时优化 |
| 微信审核不过 | 🟡 中 | 30% | 高 | 提前了解规则，避免违规 |

---

## 🚀 Part 2: 超详细开发计划（Detailed Development Plan）

### 2.1 整体时间线（Timeline）

```
Week 0 (已完成): 架构搭建
├── 技术选型
├── 项目初始化
├── API 封装
└── 基础页面

Week 1 (本周): 用户系统 ←───── 当前位置
├── Day 1-2: API 封装 (✅ 已完成)
├── Day 3-4: 登录功能
├── Day 5: 用户信息展示
├── Day 6-7: 完善与测试

Week 2: 话题系统
├── Day 8-9: 话题发布
├── Day 10-11: 话题列表与筛选
├── Day 12-13: 话题详情
├── Day 14: 点赞评论

Week 3: 完善与测试
├── Day 15-16: 社区功能
├── Day 17-18: 活动功能
├── Day 19: 集成测试
├── Day 20-21: Bug 修复与优化

Week 4: 灰度测试
├── 内部测试
├── 小范围用户测试
├── 收集反馈
└── 快速迭代

Week 5: 正式发布
├── 网页版上线
├── 小程序提审
├── 运营准备
└── 正式发布
```

---

### 2.2 Week 1 详细计划（本周重点）

#### Day 1-2: API 封装（✅ 已完成）

**成果**:
- ✅ 网页版 API 封装
- ✅ 小程序 API 封装
- ✅ API 模块化
- ✅ 错误处理

---

#### Day 3-4: 用户登录功能（🔥 接下来做这个！）

##### 任务清单

**Task 3.1: 检查后端接口**（1小时）

目标：确认后端 API 是否已实现

步骤：
1. 启动后端服务
2. 测试以下接口：
   ```bash
   # 发送验证码
   curl -X POST http://localhost:3000/api/auth/send-code \
     -H "Content-Type: application/json" \
     -d '{"phone":"13800138000"}'
   
   # 手机号登录
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone":"13800138000","code":"123456"}'
   
   # 微信登录
   curl -X POST http://localhost:3000/api/auth/wechat-login \
     -H "Content-Type: application/json" \
     -d '{"code":"wx_code"}'
   
   # 获取当前用户
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Authorization: Bearer <token>"
   ```

3. 记录结果，补充缺失接口

**Task 3.2: 创建登录页面（网页版）**（2小时）

文件结构：
```
ieclub-web/src/pages/
├── Login.jsx           ← 新建
└── Login.module.css    ← 新建（或使用 Tailwind）
```

功能需求：
- 手机号输入框（验证格式）
- 验证码输入框
- 发送验证码按钮（60秒倒计时）
- 登录按钮
- 错误提示
- Loading 状态

UI 设计：
```
┌─────────────────────────────────────┐
│                                     │
│          🌟 IEClub                  │
│      学习·科研·创业                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📱 手机号                      │ │
│  │   [          ]                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌─────────────────┬─────────────┐ │
│  │ 🔢 验证码        │  获取验证码  │ │
│  │   [      ]      │             │ │
│  └─────────────────┴─────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │         登 录                  │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

代码结构：
```jsx
// Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendCode, login } from '@/api/auth'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // 发送验证码
  const handleSendCode = async () => { ... }

  // 登录
  const handleLogin = async () => { ... }

  return (
    <div className="login-container">
      {/* UI 实现 */}
    </div>
  )
}
```

**Task 3.3: 创建登录页面（小程序）**（2小时）

文件结构：
```
ieclub-frontend/pages/
├── login/
│   ├── index.js        ← 新建
│   ├── index.wxml      ← 新建
│   ├── index.wxss      ← 新建
│   └── index.json      ← 新建
```

功能需求：
- 微信授权按钮
- 获取用户信息
- 调用登录接口
- 存储 Token
- 跳转到主页

UI 设计：
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          🌟 IEClub                  │
│      学习·科研·创业                 │
│                                     │
│              [Logo]                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    🔐 微信快速登录              │ │
│  └───────────────────────────────┘ │
│                                     │
│     登录即代表同意《用户协议》      │
│                                     │
└─────────────────────────────────────┘
```

代码结构：
```javascript
// pages/login/index.js
import { wechatLogin } from '../../api/auth'

Page({
  data: {},

  // 微信登录
  handleWechatLogin() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 获取用户信息
        wx.login({
          success: async (loginRes) => {
            // 调用登录接口
            const { token, user } = await wechatLogin(loginRes.code)
            // 存储 Token
            wx.setStorageSync('token', token)
            // 跳转主页
            wx.switchTab({ url: '/pages/plaza/index' })
          }
        })
      }
    })
  }
})
```

**Task 3.4: 路由守卫（网页版）**（1小时）

创建路由守卫，未登录跳转登录页：

```jsx
// src/components/AuthGuard.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthGuard({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  return children
}
```

使用：
```jsx
// App.jsx
<Route path="/plaza" element={
  <AuthGuard>
    <Plaza />
  </AuthGuard>
} />
```

**Task 3.5: 登录状态判断（小程序）**（30分钟）

在 app.js 中添加全局登录检查：

```javascript
// app.js
App({
  onLaunch() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (!token) {
      // 未登录，跳转登录页
      wx.reLaunch({
        url: '/pages/login/index'
      })
    }
  },

  globalData: {
    isLogin: false,
    token: '',
    userInfo: null,
    apiBase: 'http://localhost:3000/api'
  }
})
```

**Task 3.6: 测试登录功能**（1小时）

测试清单：
- [ ] 网页版可以发送验证码
- [ ] 网页版可以登录成功
- [ ] 网页版 Token 正确存储
- [ ] 网页版登录后跳转正确
- [ ] 小程序可以唤起微信授权
- [ ] 小程序可以登录成功
- [ ] 小程序 Token 正确存储
- [ ] 小程序登录后跳转正确
- [ ] 双端 Token 格式一致
- [ ] 未登录自动跳转登录页

---

#### Day 5: 用户信息展示（4小时）

**Task 5.1: 获取并显示用户信息**

网页版：
```jsx
// src/pages/Profile.jsx
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/api/auth'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const data = await getCurrentUser()
      setUser(data)
    } catch (error) {
      console.error('获取用户信息失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>

  return (
    <div className="profile-page">
      <div className="user-header">
        <img src={user.avatar} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.major} · {user.grade}</p>
      </div>
      {/* ... 其他内容 */}
    </div>
  )
}
```

小程序：
```javascript
// pages/profile/index.js
import { getCurrentUser } from '../../api/auth'

Page({
  data: {
    user: null,
    loading: true
  },

  onLoad() {
    this.loadUserInfo()
  },

  async loadUserInfo() {
    try {
      const user = await getCurrentUser()
      this.setData({ user, loading: false })
    } catch (error) {
      console.error('获取用户信息失败', error)
      this.setData({ loading: false })
    }
  }
})
```

**Task 5.2: 编辑资料功能**

创建编辑资料页面，允许用户修改：
- 姓名
- 头像
- 专业
- 年级
- 个人简介

---

#### Day 6-7: 完善与测试（8小时）

**Task 6.1: 完善错误处理**
- 网络错误提示优化
- Token 过期自动跳转
- 表单验证完善

**Task 6.2: 添加 Loading 组件**
- 全局 Loading 组件
- 按钮 Loading 状态
- 骨架屏

**Task 6.3: 完善 UI 细节**
- 动画效果
- 交互反馈
- 适配优化

**Task 6.4: 全面测试**
- 功能测试
- 边界测试
- 兼容性测试

---

### 2.3 接口定义（API Specification）

#### 认证接口

**1. 发送验证码**
```http
POST /api/auth/send-code
Content-Type: application/json

Request:
{
  "phone": "13800138000"
}

Response:
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

**2. 手机号登录**
```http
POST /api/auth/login
Content-Type: application/json

Request:
{
  "phone": "13800138000",
  "code": "123456"
}

Response:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "avatar": "https://...",
      "phone": "13800138000",
      "major": "计算机科学",
      "grade": "大三",
      "level": 1,
      "score": 0,
      "createdAt": "2025-10-29T10:00:00Z"
    }
  }
}
```

**3. 微信登录**
```http
POST /api/auth/wechat-login
Content-Type: application/json

Request:
{
  "code": "wx_login_code",
  "userInfo": {
    "nickName": "微信用户",
    "avatarUrl": "https://..."
  }
}

Response:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**4. 获取当前用户信息**
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "张三",
    "avatar": "https://...",
    "phone": "13800138000",
    "major": "计算机科学",
    "grade": "大三",
    "level": 12,
    "score": 1420,
    "bio": "代码改变世界",
    "stats": {
      "topics": 23,
      "followers": 890,
      "following": 145
    },
    "createdAt": "2025-10-29T10:00:00Z"
  }
}
```

---

### 2.4 数据模型（Data Model）

#### User（用户表）

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '姓名',
  avatar VARCHAR(255) COMMENT '头像URL',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  wechat_openid VARCHAR(100) UNIQUE COMMENT '微信OpenID',
  wechat_unionid VARCHAR(100) COMMENT '微信UnionID',
  major VARCHAR(50) COMMENT '专业',
  grade VARCHAR(20) COMMENT '年级',
  bio TEXT COMMENT '个人简介',
  level INT DEFAULT 1 COMMENT '等级',
  score INT DEFAULT 0 COMMENT '积分',
  status TINYINT DEFAULT 1 COMMENT '状态：1正常 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_wechat_openid (wechat_openid),
  INDEX idx_level (level),
  INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

#### Topic（话题表）

```sql
CREATE TABLE topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '发布者ID',
  type ENUM('offer', 'demand', 'project') NOT NULL COMMENT '类型',
  title VARCHAR(100) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '内容',
  cover VARCHAR(255) COMMENT '封面图',
  images JSON COMMENT '图片数组',
  tags JSON COMMENT '标签数组',
  view_count INT DEFAULT 0 COMMENT '浏览数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  status TINYINT DEFAULT 1 COMMENT '状态：1正常 0删除',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_view_count (view_count),
  INDEX idx_like_count (like_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='话题表';
```

#### Like（点赞表）

```sql
CREATE TABLE likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  topic_id INT NOT NULL COMMENT '话题ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id),
  UNIQUE KEY uk_user_topic (user_id, topic_id),
  INDEX idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';
```

#### Follow（关注表）

```sql
CREATE TABLE follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL COMMENT '关注者ID',
  followee_id INT NOT NULL COMMENT '被关注者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (followee_id) REFERENCES users(id),
  UNIQUE KEY uk_follower_followee (follower_id, followee_id),
  INDEX idx_followee_id (followee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='关注表';
```

---

### 2.5 测试计划（Testing Plan）

#### 单元测试

**网页版**:
```javascript
// __tests__/api/auth.test.js
describe('Auth API', () => {
  test('sendCode should work', async () => {
    const result = await sendCode('13800138000')
    expect(result).toBeDefined()
  })

  test('login should return token', async () => {
    const result = await login('13800138000', '123456')
    expect(result.token).toBeDefined()
    expect(result.user).toBeDefined()
  })
})
```

**小程序**:
```javascript
// utils/__tests__/request.test.js
describe('Request', () => {
  test('should handle success response', async () => {
    // Mock wx.request
    // Test request function
  })

  test('should handle error response', async () => {
    // Test error handling
  })
})
```

#### 集成测试

测试场景：
1. 用户注册登录流程
2. 发布话题流程
3. 浏览和互动流程
4. 关注用户流程

#### E2E 测试

使用 Cypress（网页版）或微信开发者工具（小程序）进行端到端测试。

---

## 📋 Part 3: 立即行动计划（Immediate Action Plan）

### 3.1 现在马上做（Next 1 Hour）

**Step 1: 检查后端状态**（15分钟）
```bash
cd ieclub-backend
npm run dev
```

测试接口：
```bash
curl http://localhost:3000/api/health
```

**Step 2: 创建登录页面（网页版）**（45分钟）

创建文件：
```bash
mkdir -p ieclub-web/src/pages
touch ieclub-web/src/pages/Login.jsx
```

实现基本登录功能。

---

### 3.2 今天完成（Next 4 Hours）

- ✅ 创建网页版登录页
- ✅ 创建小程序登录页
- ✅ 实现基本登录逻辑
- ✅ 测试登录功能

---

### 3.3 本周完成（Next 5 Days）

- Day 3-4: 完成登录功能
- Day 5: 用户信息展示
- Day 6-7: 完善与测试

---

## 🎯 Part 4: 成功指标（Success Metrics）

### Week 1 目标

**功能指标**:
- ✅ 用户可以注册登录
- ✅ 用户可以查看个人信息
- ✅ Token 正确管理
- ✅ 双端功能一致

**质量指标**:
- ✅ 无 P0/P1 Bug
- ✅ 登录成功率 > 95%
- ✅ 页面加载 < 2s

**测试指标**:
- ✅ 核心功能测试通过
- ✅ 双端一致性测试通过

---

## 📞 附录（Appendix）

### A. 技术栈详细版本

```json
{
  "网页版": {
    "react": "18.2.0",
    "vite": "5.0.8",
    "react-router-dom": "6.20.0",
    "tailwindcss": "3.3.6",
    "zustand": "4.4.7",
    "axios": "1.6.2"
  },
  "小程序": {
    "微信小程序基础库": "3.10.3"
  },
  "后端": {
    "node": "18.0.0",
    "express": "4.18.2",
    "prisma": "5.8.0",
    "mysql": "8.0",
    "redis": "7.0"
  }
}
```

### B. 代码规范

**命名规范**:
- 组件：PascalCase (UserCard.jsx)
- 函数：camelCase (getUserInfo)
- 常量：UPPER_SNAKE_CASE (API_BASE_URL)
- CSS类：kebab-case (user-card)

**注释规范**:
```javascript
/**
 * 函数说明
 * @param {type} paramName - 参数说明
 * @returns {type} - 返回值说明
 */
```

### C. Git 提交规范

```
feat: 添加用户登录功能
fix: 修复登录页面样式问题
docs: 更新开发文档
style: 代码格式调整
refactor: 重构 API 请求层
test: 添加登录功能测试
chore: 更新依赖包
```

---

**准备好了吗？让我们开始Day 3-4的工作！** 🚀

下一步：创建登录页面！

