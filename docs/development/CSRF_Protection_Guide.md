# CSRF 防护使用指南

**更新日期**: 2025-11-02  
**版本**: v1.0.0

---

## 📋 概述

IEClub 后端已实现 **CSRF (跨站请求伪造) 防护**，使用 **Double Submit Cookie** 模式，确保所有状态改变操作的安全性。

---

## 🔒 工作原理

### Double Submit Cookie 模式

1. **服务器生成 Token**
   - 生成随机 CSRF Token
   - 存储在 Cookie 中（`XSRF-TOKEN`）
   - 存储在 Session 中（`csrfSecret`）

2. **客户端发送请求**
   - 从 Cookie 读取 Token
   - 在请求头中发送 Token（`X-CSRF-Token`）

3. **服务器验证**
   - 比较请求头的 Token 和 Cookie 中的 Token
   - 比较 Cookie 中的 Token 和 Session 中的密钥
   - 三者一致才通过验证

---

## 🚀 快速开始

### 1. 获取 CSRF Token

**端点**: `GET /csrf-token`

**请求示例**:
```javascript
// 获取 CSRF Token
const response = await fetch('https://ieclub.online/csrf-token', {
  method: 'GET',
  credentials: 'include'  // 重要：包含 Cookie
});

const data = await response.json();
console.log(data.csrfToken);  // 获取 Token
```

**响应示例**:
```json
{
  "success": true,
  "csrfToken": "a1b2c3d4e5f6...",
  "message": "CSRF Token 已生成"
}
```

### 2. 使用 CSRF Token 发送请求

**所有 POST/PUT/DELETE 请求都需要携带 CSRF Token**

**请求示例**:
```javascript
// 创建话题（需要 CSRF Token）
const csrfToken = getCsrfToken();  // 从 Cookie 或之前的响应中获取

const response = await fetch('https://ieclub.online/api/topics', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'X-CSRF-Token': csrfToken  // 添加 CSRF Token
  },
  credentials: 'include',  // 重要：包含 Cookie
  body: JSON.stringify({
    title: '我的话题',
    content: '话题内容...',
    category: '技术'
  })
});
```

### 3. 刷新 CSRF Token

**端点**: `POST /csrf-token/refresh`

**请求示例**:
```javascript
const response = await fetch('https://ieclub.online/csrf-token/refresh', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();
console.log(data.csrfToken);  // 新的 Token
```

---

## 💻 前端集成

### React 示例

```javascript
import { useState, useEffect } from 'react';

// CSRF Token 管理 Hook
function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState(null);

  useEffect(() => {
    // 获取 CSRF Token
    async function fetchCsrfToken() {
      try {
        const response = await fetch('https://ieclub.online/csrf-token', {
          credentials: 'include'
        });
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error('获取 CSRF Token 失败:', error);
      }
    }

    fetchCsrfToken();
  }, []);

  return csrfToken;
}

// 使用示例
function CreateTopicForm() {
  const csrfToken = useCsrfToken();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!csrfToken) {
      alert('CSRF Token 未加载');
      return;
    }

    const response = await fetch('https://ieclub.online/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({
        title: '话题标题',
        content: '话题内容'
      })
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### Axios 拦截器示例

```javascript
import axios from 'axios';

// 创建 Axios 实例
const api = axios.create({
  baseURL: 'https://ieclub.online/api',
  withCredentials: true  // 重要：包含 Cookie
});

// 获取 CSRF Token
let csrfToken = null;

async function getCsrfToken() {
  if (!csrfToken) {
    const response = await axios.get('https://ieclub.online/csrf-token', {
      withCredentials: true
    });
    csrfToken = response.data.csrfToken;
  }
  return csrfToken;
}

// 请求拦截器：自动添加 CSRF Token
api.interceptors.request.use(async (config) => {
  // 只对 POST/PUT/DELETE 请求添加 CSRF Token
  if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

// 响应拦截器：处理 CSRF 错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && 
        error.response?.data?.code === 'FORBIDDEN') {
      // CSRF Token 过期，刷新并重试
      csrfToken = null;
      const token = await getCsrfToken();
      error.config.headers['X-CSRF-Token'] = token;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// 使用示例
async function createTopic(data) {
  const response = await api.post('/topics', data);
  return response.data;
}
```

### 小程序示例

```javascript
// utils/csrf.js
let csrfToken = null;

// 获取 CSRF Token
export async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://ieclub.online/csrf-token',
      method: 'GET',
      success: (res) => {
        if (res.data.success) {
          csrfToken = res.data.csrfToken;
          resolve(csrfToken);
        } else {
          reject(new Error('获取 CSRF Token 失败'));
        }
      },
      fail: reject
    });
  });
}

// 发送带 CSRF Token 的请求
export async function request(options) {
  const token = await getCsrfToken();

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      header: {
        ...options.header,
        'X-CSRF-Token': token
      },
      success: resolve,
      fail: reject
    });
  });
}

// 使用示例
import { request } from './utils/csrf';

async function createTopic(data) {
  const res = await request({
    url: 'https://ieclub.online/api/topics',
    method: 'POST',
    data: data,
    header: {
      'Authorization': `Bearer ${wx.getStorageSync('token')}`
    }
  });

  return res.data;
}
```

---

## 🛡️ 受保护的端点

### 需要 CSRF Token 的操作

所有 **POST/PUT/DELETE/PATCH** 请求都需要 CSRF Token，除了以下例外：

#### 例外（不需要 CSRF Token）

1. **登录相关**
   - `POST /api/auth/login` - 用户登录
   - `POST /api/auth/wechat-login` - 微信登录
   - `POST /api/auth/send-verify-code` - 发送验证码

2. **系统端点**
   - `GET /csrf-token` - 获取 CSRF Token
   - `GET /health` - 健康检查

#### 需要保护的端点（示例）

- ✅ `POST /api/auth/register` - 用户注册
- ✅ `POST /api/topics` - 创建话题
- ✅ `PUT /api/topics/:id` - 更新话题
- ✅ `DELETE /api/topics/:id` - 删除话题
- ✅ `POST /api/comments` - 创建评论
- ✅ `POST /api/topics/:id/like` - 点赞话题
- ✅ `POST /api/activities/:id/join` - 报名活动
- ✅ `PUT /api/auth/profile` - 更新个人资料
- ✅ `POST /api/upload/images` - 上传图片

---

## 🔧 配置选项

### 服务器端配置

```javascript
// src/middleware/csrf.js
const csrfProtection = (options = {}) => {
  const {
    ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],  // 忽略的 HTTP 方法
    ignorePaths = []  // 忽略的路径（正则表达式）
  } = options;
  
  // ...
};

// 使用示例
const csrf = csrfProtection({
  ignorePaths: [
    '^/auth/login$',
    '^/auth/wechat-login$'
  ]
});
```

### Cookie 配置

```javascript
// src/app.js
res.cookie('XSRF-TOKEN', token, {
  httpOnly: false,  // 允许 JavaScript 读取
  secure: true,     // 生产环境使用 HTTPS
  sameSite: 'strict',  // 严格的同站策略
  maxAge: 24 * 60 * 60 * 1000  // 24小时
});
```

---

## ❌ 错误处理

### 常见错误

#### 1. CSRF Token 缺失

**错误响应**:
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "CSRF Token 验证失败"
}
```

**解决方案**:
- 确保请求头包含 `X-CSRF-Token`
- 确保请求包含 Cookie（`credentials: 'include'`）

#### 2. CSRF Token 无效

**错误响应**:
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "CSRF Token 验证失败"
}
```

**解决方案**:
- Token 可能已过期，重新获取
- 检查 Token 是否正确传递

#### 3. Cookie 未发送

**原因**:
- 跨域请求未设置 `credentials: 'include'`
- 浏览器阻止了第三方 Cookie

**解决方案**:
```javascript
// Fetch API
fetch(url, {
  credentials: 'include'  // 添加此选项
});

// Axios
axios.create({
  withCredentials: true  // 添加此选项
});
```

---

## 🧪 测试

### 测试 CSRF 保护

```bash
# 1. 获取 CSRF Token
curl -c cookies.txt https://ieclub.online/csrf-token

# 2. 使用 Token 创建话题（成功）
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -X POST \
  -d '{"title":"测试","content":"测试内容","category":"技术"}' \
  https://ieclub.online/api/topics

# 3. 不使用 Token 创建话题（失败）
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -X POST \
  -d '{"title":"测试","content":"测试内容","category":"技术"}' \
  https://ieclub.online/api/topics
```

---

## 📚 最佳实践

### 1. Token 管理

✅ **推荐**:
```javascript
// 在应用启动时获取 Token
async function initApp() {
  await getCsrfToken();
  // ...其他初始化
}

// 在请求拦截器中自动添加
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = await getCsrfToken();
  }
  return config;
});
```

❌ **不推荐**:
```javascript
// 每次请求都重新获取 Token（性能差）
async function createTopic(data) {
  const token = await getCsrfToken();  // 不推荐
  // ...
}
```

### 2. 错误处理

✅ **推荐**:
```javascript
// 自动重试机制
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      // 刷新 Token 并重试
      await refreshCsrfToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 3. 安全性

✅ **推荐**:
- 总是使用 HTTPS
- 设置 `SameSite=Strict`
- 定期刷新 Token

❌ **不推荐**:
- 在 URL 中传递 Token
- 在 localStorage 中存储 Token
- 禁用 CSRF 保护

---

## 🔍 故障排查

### 问题：Token 验证总是失败

**检查清单**:
1. ✅ 请求是否包含 Cookie？
2. ✅ 请求头是否包含 `X-CSRF-Token`？
3. ✅ Token 是否过期？
4. ✅ 是否跨域且未设置 `credentials`？

### 问题：小程序无法使用

**原因**: 小程序不支持 Cookie

**解决方案**: 使用自定义 Token 存储
```javascript
// 存储 Token
wx.setStorageSync('csrfToken', token);

// 使用 Token
wx.request({
  header: {
    'X-CSRF-Token': wx.getStorageSync('csrfToken')
  }
});
```

---

## 📞 技术支持

如有问题，请查看：
- [后端优化报告](../optimization/BACKEND_OPTIMIZATION_REPORT.md)
- [安全检查清单](./Security_And_Functionality_Checklist.md)

---

**CSRF 防护已启用，保护您的应用安全！** 🛡️✨

