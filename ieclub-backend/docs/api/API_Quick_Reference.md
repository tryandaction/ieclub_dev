# IEclub API 快速参考

## 概述

本文档提供 IEclub 后端 API 的快速参考，适合开发人员查阅。

完整 API 文档请参考：[API 参考文档](../../../docs/API_REFERENCE.md)

---

## 基础信息

**Base URL**: `https://ieclub.online/api`  
**认证方式**: JWT Bearer Token  
**内容类型**: `application/json`

### 通用请求头

```http
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

### 通用响应格式

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": { ... }
  }
}
```

---

## 认证 API

### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "password": "SecurePass123!",
  "nickname": "张三",
  "verificationCode": "123456"
}
```

### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "password": "SecurePass123!"
}
```

### 发送验证码

```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "type": "register"  // register/reset_password
}
```

### 重置密码

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "student@sustech.edu.cn",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}
```

---

## 用户 API

### 获取当前用户信息

```http
GET /api/users/me
Authorization: Bearer {token}
```

### 更新用户信息

```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "nickname": "新昵称",
  "bio": "个人简介",
  "avatar": "头像URL"
}
```

### 获取用户主页

```http
GET /api/users/{userId}
```

### 关注用户

```http
POST /api/users/{userId}/follow
Authorization: Bearer {token}
```

### 取消关注

```http
DELETE /api/users/{userId}/follow
Authorization: Bearer {token}
```

---

## 话题 API

### 获取话题列表

```http
GET /api/topics?category=我来讲&page=1&limit=20&sort=hot
```

**参数**:
- `category`: 我来讲/想听/项目/分享
- `page`: 页码
- `limit`: 每页数量
- `sort`: hot/new/recommended

### 获取话题详情

```http
GET /api/topics/{topicId}
```

### 创建话题

```http
POST /api/topics
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "话题标题",
  "content": "话题内容",
  "category": "我来讲",
  "tags": ["标签1", "标签2"],
  "attachments": [...]
}
```

### 更新话题

```http
PUT /api/topics/{topicId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "新标题",
  "content": "新内容"
}
```

### 删除话题

```http
DELETE /api/topics/{topicId}
Authorization: Bearer {token}
```

### 点赞话题

```http
POST /api/topics/{topicId}/like
Authorization: Bearer {token}
```

### 收藏话题

```http
POST /api/topics/{topicId}/bookmark
Authorization: Bearer {token}
```

---

## 评论 API

### 获取评论列表

```http
GET /api/topics/{topicId}/comments?page=1&limit=20
```

### 创建评论

```http
POST /api/topics/{topicId}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "评论内容",
  "parentId": null  // 回复评论时填写父评论ID
}
```

### 删除评论

```http
DELETE /api/comments/{commentId}
Authorization: Bearer {token}
```

### 点赞评论

```http
POST /api/comments/{commentId}/like
Authorization: Bearer {token}
```

---

## 活动 API

### 获取活动列表

```http
GET /api/activities?status=upcoming&page=1&limit=20
```

**status**: `upcoming`(即将开始) / `ongoing`(进行中) / `ended`(已结束)

### 获取活动详情

```http
GET /api/activities/{activityId}
```

### 创建活动

```http
POST /api/activities
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "活动标题",
  "description": "活动描述",
  "startTime": "2025-11-01T14:00:00.000Z",
  "endTime": "2025-11-01T16:00:00.000Z",
  "location": "活动地点",
  "maxParticipants": 50,
  "requireApproval": true
}
```

### 报名活动

```http
POST /api/activities/{activityId}/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "note": "报名备注"
}
```

### 取消报名

```http
DELETE /api/activities/{activityId}/register
Authorization: Bearer {token}
```

### 签到

```http
POST /api/activities/{activityId}/checkin
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "签到码"
}
```

---

## 社区 API

### 获取用户列表

```http
GET /api/community/users?page=1&limit=20&sort=credit
```

**sort**: `credit`(积分) / `level`(等级) / `active`(活跃度)

### 获取推荐用户

```http
GET /api/community/recommended-users?limit=10
Authorization: Bearer {token}
```

### 获取排行榜

```http
GET /api/leaderboard?type=weekly&metric=credit&limit=10
```

**type**: `daily` / `weekly` / `monthly` / `all_time`  
**metric**: `credit` / `topics` / `activities`

---

## 搜索 API

### 全局搜索

```http
GET /api/search?q=关键词&type=all&page=1&limit=20
```

**type**: `all` / `topics` / `users` / `activities`

### 获取热门搜索

```http
GET /api/search/hot?limit=10
```

### 搜索建议

```http
GET /api/search/suggestions?q=关键
```

---

## 通知 API

### 获取通知列表

```http
GET /api/notifications?type=all&unread=true&page=1&limit=20
Authorization: Bearer {token}
```

**type**: `all` / `system` / `interaction` / `follow` / `activity`

### 标记为已读

```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer {token}
```

### 标记全部为已读

```http
PUT /api/notifications/read-all
Authorization: Bearer {token}
```

### 获取未读数量

```http
GET /api/notifications/unread-count
Authorization: Bearer {token}
```

---

## 积分 API

### 获取积分记录

```http
GET /api/credits/history?page=1&limit=20&type=earn
Authorization: Bearer {token}
```

**type**: `earn` / `spend` / `all`

### 获取积分排行

```http
GET /api/credits/leaderboard?period=weekly&limit=10
```

### 兑换积分

```http
POST /api/credits/redeem
Authorization: Bearer {token}
Content-Type: application/json

{
  "itemId": "reward_item_id",
  "quantity": 1
}
```

---

## 徽章 API

### 获取用户徽章

```http
GET /api/badges/my-badges
Authorization: Bearer {token}
```

### 获取所有徽章

```http
GET /api/badges
```

### 设置展示徽章

```http
PUT /api/badges/display
Authorization: Bearer {token}
Content-Type: application/json

{
  "badgeIds": ["badge1", "badge2", "badge3"]
}
```

---

## 文件上传 API

### 上传图片

```http
POST /api/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <image_file>
```

### 上传文档

```http
POST /api/upload/document
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <document_file>
```

---

## 反馈 API

### 提交反馈

```http
POST /api/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "bug",  // bug/feature/suggestion
  "title": "反馈标题",
  "content": "反馈内容",
  "contact": "联系方式"
}
```

### 获取我的反馈

```http
GET /api/feedback/my?page=1&limit=20
Authorization: Bearer {token}
```

---

## 举报 API

### 提交举报

```http
POST /api/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetType": "topic",  // topic/comment/user
  "targetId": "target_id",
  "reason": "spam",  // spam/harassment/inappropriate/other
  "description": "详细说明"
}
```

---

## 统计 API

### 获取个人统计

```http
GET /api/stats/personal
Authorization: Bearer {token}
```

### 获取平台统计

```http
GET /api/stats/platform
```

---

## 管理员 API

详见 [管理后台指南](../admin/ADMIN_GUIDE.md)

### 常用接口

```http
# 获取用户列表
GET /api/admin/users

# 封禁用户
POST /api/admin/users/{userId}/ban

# 审核话题
POST /api/admin/topics/{topicId}/review

# 处理举报
PUT /api/admin/reports/{reportId}/handle

# 系统统计
GET /api/admin/stats/system
```

---

## RBAC 权限 API

详见 [RBAC 权限管理指南](../guides/RBAC_GUIDE.md)

### 常用接口

```http
# 获取角色列表
GET /api/rbac/roles

# 获取权限列表
GET /api/rbac/permissions

# 为用户分配角色
POST /api/rbac/users/{userId}/roles

# 获取我的权限
GET /api/rbac/my-permissions
```

---

## 备份 API

详见 [备份系统指南](../guides/BACKUP_GUIDE.md)

### 常用接口

```http
# 创建备份
POST /api/backup

# 获取备份列表
GET /api/backup

# 恢复备份
POST /api/backup/{backupId}/restore
```

---

## WebSocket 实时通信

### 连接

```javascript
const ws = new WebSocket('wss://ieclub.online/ws');

// 认证
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### 订阅通知

```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'notifications'
}));
```

### 消息格式

```json
{
  "type": "notification",
  "data": {
    "id": "notif_id",
    "type": "like",
    "content": "有人点赞了你的话题",
    "createdAt": "2025-10-31T10:00:00.000Z"
  }
}
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| VALIDATION_ERROR | 参数验证失败 |
| AUTHENTICATION_FAILED | 认证失败 |
| PERMISSION_DENIED | 权限不足 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| DUPLICATE_RESOURCE | 资源重复 |
| RATE_LIMIT_EXCEEDED | 超出频率限制 |
| INTERNAL_ERROR | 内部错误 |

---

## 速率限制

| 接口类型 | 限制 |
|---------|------|
| 认证接口 | 5次/分钟 |
| 创建内容 | 10次/分钟 |
| 普通查询 | 60次/分钟 |
| 文件上传 | 10次/小时 |
| 管理接口 | 100次/分钟 |

---

## 测试环境

**Base URL**: `http://localhost:3000/api`

使用测试账号：
- 邮箱: `test@sustech.edu.cn`
- 密码: `Test123!`

---

## Postman Collection

导入以下链接获取完整 Postman 集合：
```
https://ieclub.online/api/postman-collection
```

---

## 相关文档

- [完整 API 文档](../../../docs/API_REFERENCE.md)
- [管理后台指南](../admin/ADMIN_GUIDE.md)
- [RBAC 权限管理](../guides/RBAC_GUIDE.md)
- [备份系统指南](../guides/BACKUP_GUIDE.md)

---

**最后更新**: 2025-10-31  
**API 版本**: v2.0

