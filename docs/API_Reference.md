# IEclub API 参考文档

> IEclub 平台完整的 RESTful API 接口文档

## 目录

- [认证说明](#认证说明)
- [通用响应格式](#通用响应格式)
- [错误码说明](#错误码说明)
- [API 端点](#api-端点)

---

## 认证说明

### JWT Token 认证

大多数 API 需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <your_jwt_token>
```

### 获取 Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "userId",
      "email": "user@example.com",
      "nickname": "用户昵称"
    }
  }
}
```

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { /* 返回的数据 */ },
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [ /* 数据列表 */ ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

---

## 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未授权 |
| FORBIDDEN | 403 | 无权限 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 验证失败 |
| DUPLICATE_ENTRY | 409 | 资源已存在 |
| INTERNAL_ERROR | 500 | 服务器错误 |

---

## API 端点

### 1. 认证模块 (Auth)

#### 1.1 用户注册
```http
POST /api/auth/register
```

**请求体**:
```json
{
  "email": "user@sustech.edu.cn",
  "password": "Password123",
  "nickname": "昵称"
}
```

#### 1.2 用户登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "user@sustech.edu.cn",
  "password": "Password123"
}
```

#### 1.3 刷新 Token
```http
POST /api/auth/refresh
```

**请求头**: `Authorization: Bearer <refresh_token>`

#### 1.4 登出
```http
POST /api/auth/logout
```

---

### 2. 用户模块 (User)

#### 2.1 获取当前用户信息
```http
GET /api/users/me
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "userId",
    "email": "user@sustech.edu.cn",
    "nickname": "昵称",
    "avatar": "avatarUrl",
    "level": 5,
    "credits": 1000
  }
}
```

#### 2.2 更新用户信息
```http
PUT /api/users/me
```

**请求体**:
```json
{
  "nickname": "新昵称",
  "avatar": "新头像URL"
}
```

#### 2.3 获取用户详情
```http
GET /api/users/:userId
```

---

### 3. 社区模块 (Community)

#### 3.1 创建帖子
```http
POST /api/community/posts
```

**请求体**:
```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "type": "text",
  "images": ["imageUrl1", "imageUrl2"],
  "tags": ["tag1", "tag2"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "postId",
    "title": "帖子标题",
    "author": {
      "id": "userId",
      "nickname": "用户昵称"
    },
    "createdAt": "2025-10-31T08:00:00Z"
  }
}
```

#### 3.2 获取帖子列表
```http
GET /api/community/posts?page=1&pageSize=20&sort=hot
```

**查询参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认20）
- `sort`: 排序方式（hot/new/top）
- `tag`: 标签筛选

#### 3.3 获取帖子详情
```http
GET /api/community/posts/:postId
```

#### 3.4 更新帖子
```http
PUT /api/community/posts/:postId
```

#### 3.5 删除帖子
```http
DELETE /api/community/posts/:postId
```

#### 3.6 点赞帖子
```http
POST /api/community/posts/:postId/like
```

**响应**:
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 42
  }
}
```

#### 3.7 收藏帖子
```http
POST /api/community/posts/:postId/bookmark
```

#### 3.8 分享帖子
```http
POST /api/community/posts/:postId/share
```

#### 3.9 关注用户
```http
POST /api/community/follow/:userId
```

#### 3.10 获取动态流
```http
GET /api/community/feed?page=1&pageSize=20
```

#### 3.11 获取粉丝列表
```http
GET /api/community/followers?userId=xxx
```

#### 3.12 获取关注列表
```http
GET /api/community/following?userId=xxx
```

---

### 4. 活动模块 (Activities)

#### 4.1 创建活动
```http
POST /api/activities-v2
```

**请求体**:
```json
{
  "title": "活动标题",
  "description": "活动描述",
  "type": "讲座",
  "location": "活动地点",
  "startTime": "2025-11-01T14:00:00Z",
  "endTime": "2025-11-01T16:00:00Z",
  "maxParticipants": 100,
  "coverImage": "coverImageUrl",
  "tags": ["tag1", "tag2"]
}
```

#### 4.2 获取活动列表
```http
GET /api/activities-v2?page=1&pageSize=20&type=讲座&status=upcoming
```

**查询参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `type`: 活动类型
- `status`: 状态（upcoming/ongoing/ended）

#### 4.3 获取活动详情
```http
GET /api/activities-v2/:activityId
```

#### 4.4 更新活动
```http
PUT /api/activities-v2/:activityId
```

#### 4.5 取消活动
```http
DELETE /api/activities-v2/:activityId
```

#### 4.6 报名活动
```http
POST /api/activities/:activityId/register
```

**请求体**:
```json
{
  "name": "参与者姓名",
  "phone": "13800138000",
  "email": "participant@example.com",
  "note": "备注信息"
}
```

#### 4.7 取消报名
```http
DELETE /api/activities/:activityId/register
```

#### 4.8 活动签到
```http
POST /api/activities/:activityId/check-in
```

#### 4.9 评价活动
```http
POST /api/activities/:activityId/review
```

**请求体**:
```json
{
  "rating": 5,
  "comment": "活动很棒！"
}
```

#### 4.10 获取参与者列表
```http
GET /api/activities/:activityId/participants
```

#### 4.11 获取活动统计
```http
GET /api/activities/:activityId/stats
```

---

### 5. 评论模块 (Comments)

#### 5.1 发表评论
```http
POST /api/comments
```

**请求体**:
```json
{
  "targetType": "post",
  "targetId": "postId",
  "content": "评论内容",
  "parentId": null
}
```

#### 5.2 获取评论列表
```http
GET /api/comments?targetType=post&targetId=xxx&page=1&pageSize=20
```

#### 5.3 获取评论详情
```http
GET /api/comments/:commentId
```

#### 5.4 更新评论
```http
PUT /api/comments/:commentId
```

#### 5.5 删除评论
```http
DELETE /api/comments/:commentId
```

#### 5.6 点赞评论
```http
POST /api/comments/:commentId/like
```

#### 5.7 回复评论
```http
POST /api/comments/:commentId/reply
```

**请求体**:
```json
{
  "content": "回复内容"
}
```

#### 5.8 获取回复列表
```http
GET /api/comments/:commentId/replies?page=1&pageSize=10
```

---

### 6. 通知模块 (Notifications)

#### 6.1 获取通知列表
```http
GET /api/notifications?page=1&pageSize=20&type=all
```

**查询参数**:
- `type`: 通知类型（all/system/activity/interaction/credit）
- `isRead`: 是否已读（true/false）

#### 6.2 获取未读数量
```http
GET /api/notifications/unread-count
```

**响应**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### 6.3 标记为已读
```http
PUT /api/notifications/:notificationId/read
```

#### 6.4 全部标记为已读
```http
PUT /api/notifications/read-all
```

#### 6.5 删除通知
```http
DELETE /api/notifications/:notificationId
```

#### 6.6 获取通知设置
```http
GET /api/notifications/settings
```

#### 6.7 更新通知设置
```http
PUT /api/notifications/settings
```

**请求体**:
```json
{
  "enableSystem": true,
  "enableActivity": true,
  "enableInteraction": true,
  "enableCredit": false
}
```

---

### 7. 搜索模块 (Search)

#### 7.1 全局搜索
```http
GET /api/search-v2?q=关键词&page=1&pageSize=20
```

**响应**:
```json
{
  "success": true,
  "data": {
    "posts": [ /* 帖子列表 */ ],
    "activities": [ /* 活动列表 */ ],
    "users": [ /* 用户列表 */ ],
    "total": 50
  }
}
```

#### 7.2 搜索帖子
```http
GET /api/search-v2/posts?q=关键词&sort=relevant
```

#### 7.3 搜索活动
```http
GET /api/search-v2/activities?q=关键词&type=讲座
```

#### 7.4 搜索用户
```http
GET /api/search-v2/users?q=昵称
```

#### 7.5 搜索话题
```http
GET /api/search-v2/topics?q=话题
```

#### 7.6 获取搜索建议
```http
GET /api/search-v2/suggestions?q=关
```

**响应**:
```json
{
  "success": true,
  "data": {
    "suggestions": ["关键词1", "关键词2", "关键词3"]
  }
}
```

#### 7.7 获取搜索历史
```http
GET /api/search-v2/history
```

#### 7.8 清除搜索历史
```http
DELETE /api/search-v2/history
```

---

### 8. 文件上传模块 (Upload)

#### 8.1 上传图片
```http
POST /api/upload-v2/image
Content-Type: multipart/form-data
```

**表单数据**:
- `file`: 图片文件（必需）
- `compress`: 是否压缩（可选，默认true）
- `quality`: 压缩质量（可选，默认80）

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/uploads/xxx.jpg",
    "filename": "xxx.jpg",
    "size": 102400,
    "width": 1920,
    "height": 1080
  }
}
```

#### 8.2 批量上传图片
```http
POST /api/upload-v2/images
Content-Type: multipart/form-data
```

**表单数据**:
- `files`: 多个图片文件

**响应**:
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "url": "https://example.com/uploads/xxx1.jpg",
        "filename": "xxx1.jpg"
      },
      {
        "url": "https://example.com/uploads/xxx2.jpg",
        "filename": "xxx2.jpg"
      }
    ]
  }
}
```

#### 8.3 上传文档
```http
POST /api/upload-v2/document
Content-Type: multipart/form-data
```

**表单数据**:
- `file`: 文档文件

#### 8.4 删除文件
```http
DELETE /api/upload-v2/:fileId
```

#### 8.5 获取文件列表
```http
GET /api/upload-v2/list?page=1&pageSize=20
```

---

### 9. 积分模块 (Credits)

#### 9.1 获取积分信息
```http
GET /api/credits/info
```

**响应**:
```json
{
  "success": true,
  "data": {
    "credits": 1000,
    "level": 5,
    "exp": 2500,
    "nextLevelExp": 3000,
    "progress": 83.33
  }
}
```

#### 9.2 每日签到
```http
POST /api/credits/check-in
```

**响应**:
```json
{
  "success": true,
  "data": {
    "credits": 5,
    "exp": 5,
    "consecutiveDays": 3,
    "totalCheckIns": 30
  }
}
```

#### 9.3 获取签到状态
```http
GET /api/credits/check-in/status
```

#### 9.4 获取积分历史
```http
GET /api/credits/history?page=1&pageSize=20&type=all
```

**查询参数**:
- `type`: 类型（all/earn/spend）

#### 9.5 获取任务列表
```http
GET /api/credits/tasks
```

#### 9.6 获取徽章列表
```http
GET /api/credits/badges
```

#### 9.7 获取所有徽章
```http
GET /api/credits/badges/all
```

#### 9.8 获取积分排行榜
```http
GET /api/credits/leaderboard/credits?limit=50
```

#### 9.9 获取等级排行榜
```http
GET /api/credits/leaderboard/level?limit=50
```

---

### 10. 数据统计模块 (Stats)

#### 10.1 获取平台统计
```http
GET /api/stats-v2/platform
```

**响应**:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 10000,
      "active": 1500,
      "new": 50
    },
    "posts": {
      "total": 5000,
      "today": 20
    },
    "activities": {
      "total": 200,
      "upcoming": 10
    }
  }
}
```

#### 10.2 获取用户统计
```http
GET /api/stats-v2/user/:userId?
```

**响应**:
```json
{
  "success": true,
  "data": {
    "posts": 50,
    "comments": 200,
    "likes": 500,
    "followers": 100,
    "following": 80
  }
}
```

#### 10.3 获取内容趋势
```http
GET /api/stats-v2/trend?days=30
```

#### 10.4 获取热门内容
```http
GET /api/stats-v2/hot?type=post&limit=10&days=7
```

#### 10.5 获取用户行为分析
```http
GET /api/stats-v2/behavior/:userId?
```

#### 10.6 获取积分趋势
```http
GET /api/stats-v2/credits/:userId?&days=30
```

#### 10.7 获取分类统计
```http
GET /api/stats-v2/categories
```

#### 10.8 获取排行榜
```http
GET /api/stats-v2/leaderboard?type=credits&limit=50
```

**查询参数**:
- `type`: 排行类型（credits/level/posts/active）

#### 10.9 获取数据概览
```http
GET /api/stats-v2/dashboard
```

---

## WebSocket API

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=<JWT_TOKEN>');
```

### 消息格式

#### 接收通知
```json
{
  "type": "notification",
  "data": {
    "id": "notificationId",
    "type": "like",
    "title": "新的点赞",
    "content": "用户A 点赞了你的帖子",
    "timestamp": "2025-10-31T08:00:00Z"
  }
}
```

#### 心跳
客户端应每30秒发送一次心跳：
```json
{
  "type": "ping"
}
```

服务器响应：
```json
{
  "type": "pong"
}
```

---

## 限流说明

### 速率限制

| 端点类型 | 限制 |
|---------|------|
| 登录/注册 | 5次/分钟 |
| 普通API | 100次/分钟 |
| 上传文件 | 10次/分钟 |
| 搜索 | 30次/分钟 |

### 限流响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "retryAfter": 60
  }
}
```

响应头：
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698739200
```

---

## 最佳实践

### 1. 错误处理

```javascript
try {
  const response = await fetch('/api/xxx', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // 处理业务错误
    console.error(result.error);
  }
} catch (error) {
  // 处理网络错误
  console.error(error);
}
```

### 2. Token 刷新

Token 过期时会返回 401 错误，应自动刷新 Token：

```javascript
if (response.status === 401) {
  // 刷新 Token
  await refreshToken();
  // 重试请求
  return retryRequest();
}
```

### 3. 分页加载

```javascript
let page = 1;
const pageSize = 20;

async function loadMore() {
  const response = await fetch(
    `/api/xxx?page=${page}&pageSize=${pageSize}`
  );
  const data = await response.json();
  
  if (data.data.items.length > 0) {
    page++;
    return data.data.items;
  }
  
  return null; // 没有更多数据
}
```

---

## 更新日志

### v1.0.0 (2025-10-31)
- 初始版本发布
- 完整的 API 文档

---

**维护人**: IEclub 开发团队  
**联系方式**: dev@ieclub.com  
**最后更新**: 2025-10-31

