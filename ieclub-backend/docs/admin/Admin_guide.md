# IEclub 管理后台使用指南

## 概述

IEclub 管理后台是为管理员提供的强大管理工具，提供用户管理、内容审核、数据统计、系统配置等功能。

---

## 快速入门

### 访问管理后台

**URL**: `https://ieclub.online/api/admin/*`  
**权限要求**: 需要管理员或超级管理员权限

### 首次登录

1. 使用南科大邮箱注册账号
2. 联系系统管理员分配管理员角色
3. 使用管理员账号登录
4. 访问管理后台路由

---

## 核心功能模块

### 1. 用户管理

#### 获取用户列表

```http
GET /api/admin/users?page=1&limit=20&status=active&sort=createdAt&order=desc
Authorization: Bearer {admin_token}
```

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20，最大100）
- `status`: 用户状态（active/banned）
- `sort`: 排序字段（createdAt/credit/level）
- `order`: 排序方向（asc/desc）
- `search`: 搜索关键词（邮箱/昵称）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### 获取用户详情

```http
GET /api/admin/users/{userId}
Authorization: Bearer {admin_token}
```

返回用户的详细信息，包括：
- 基本信息
- 发布的话题和评论
- 参与的活动
- 积分和等级
- 违规记录

#### 封禁用户

```http
POST /api/admin/users/{userId}/ban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "发布违规内容",
  "duration": 7,  // 封禁天数，0表示永久
  "note": "违反社区规范第3条"
}
```

#### 解封用户

```http
POST /api/admin/users/{userId}/unban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "note": "申诉通过，解除封禁"
}
```

#### 删除用户

```http
DELETE /api/admin/users/{userId}
Authorization: Bearer {admin_token}
```

⚠️ **注意**: 删除用户是不可逆操作，请谨慎使用。

---

### 2. 内容管理

#### 获取话题列表

```http
GET /api/admin/topics?page=1&limit=20&status=pending&category=我来讲
Authorization: Bearer {admin_token}
```

**查询参数**:
- `status`: 话题状态（pending/approved/rejected）
- `category`: 话题分类
- `reportCount`: 最小举报数
- `sort`: 排序字段
- `order`: 排序方向

#### 审核话题

```http
POST /api/admin/topics/{topicId}/review
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "approve",  // approve/reject/delete
  "reason": "审核通过",
  "note": "内容优质"
}
```

#### 批量操作

```http
POST /api/admin/topics/batch
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "approve",
  "topicIds": ["id1", "id2", "id3"],
  "reason": "批量审核通过"
}
```

---

### 3. 评论管理

#### 获取评论列表

```http
GET /api/admin/comments?page=1&limit=20&status=flagged
Authorization: Bearer {admin_token}
```

#### 删除评论

```http
DELETE /api/admin/comments/{commentId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "违反社区规范",
  "notifyUser": true
}
```

---

### 4. 活动管理

#### 获取活动列表

```http
GET /api/admin/activities?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}
```

#### 审核活动

```http
POST /api/admin/activities/{activityId}/review
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "approve",
  "reason": "活动符合规范",
  "featured": true  // 是否设为精选
}
```

---

### 5. 举报管理

#### 获取举报列表

```http
GET /api/admin/reports?status=pending&type=topic
Authorization: Bearer {admin_token}
```

**举报类型**:
- `topic`: 话题举报
- `comment`: 评论举报
- `user`: 用户举报
- `activity`: 活动举报

#### 处理举报

```http
PUT /api/admin/reports/{reportId}/handle
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "accept",  // accept/reject/ignore
  "reason": "确认违规",
  "punishment": {
    "type": "ban",  // ban/warning/delete_content
    "duration": 7,
    "note": "违反社区规范"
  }
}
```

---

### 6. 系统统计

#### 获取系统概览

```http
GET /api/admin/stats/system
Authorization: Bearer {admin_token}
```

**返回数据**:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "active": 850,
      "new": 45,  // 本周新增
      "banned": 3
    },
    "topics": {
      "total": 3200,
      "pending": 12,
      "published": 3150
    },
    "activities": {
      "total": 156,
      "upcoming": 8,
      "ongoing": 2
    },
    "reports": {
      "pending": 5,
      "handled": 132
    }
  }
}
```

#### 获取用户增长数据

```http
GET /api/admin/stats/users?period=30d
Authorization: Bearer {admin_token}
```

#### 获取内容统计

```http
GET /api/admin/stats/content?period=30d
Authorization: Bearer {admin_token}
```

---

### 7. 系统公告

#### 发送系统公告

```http
POST /api/admin/announcements
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "系统维护通知",
  "content": "本系统将于今晚22:00-23:00进行维护升级",
  "type": "system",  // system/activity/feature
  "priority": "high",  // high/normal/low
  "targets": {
    "all": true,  // 发送给所有用户
    "userIds": [],  // 或指定用户ID
    "roles": ["admin", "moderator"]  // 或指定角色
  },
  "scheduledAt": "2025-10-31T22:00:00.000Z"  // 可选，定时发送
}
```

---

### 8. 数据导出

#### 导出用户数据

```http
GET /api/admin/export?type=users&format=csv&dateFrom=2025-01-01&dateTo=2025-12-31
Authorization: Bearer {admin_token}
```

**导出类型**:
- `users`: 用户数据
- `topics`: 话题数据
- `activities`: 活动数据
- `reports`: 举报记录
- `logs`: 操作日志

**格式**:
- `csv`: CSV文件
- `json`: JSON文件
- `xlsx`: Excel文件

---

### 9. 角色权限管理（RBAC）

详见 [RBAC 权限管理指南](../guides/RBAC_GUIDE.md)

#### 快速操作

**获取 RBAC 概览**:
```http
GET /api/admin/rbac/overview
```

**批量分配角色**:
```http
POST /api/admin/rbac/batch-assign
{
  "userIds": ["user1", "user2"],
  "roleIds": ["moderator"],
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**搜索用户**:
```http
GET /api/admin/rbac/search-users?keyword=admin&roleId={roleId}
```

---

### 10. 系统备份

详见 [备份系统指南](../guides/BACKUP_GUIDE.md)

#### 快速操作

**创建备份**:
```http
POST /api/backup
{
  "type": "full",
  "description": "每日自动备份"
}
```

**获取备份列表**:
```http
GET /api/backup?page=1&limit=10
```

**恢复备份**:
```http
POST /api/backup/{backupId}/restore
{
  "confirmPassword": "admin_password"
}
```

---

## 操作日志

### 查看操作日志

所有管理员操作都会被记录在 `admin_operation_logs` 表中。

```http
GET /api/admin/logs?adminId={adminId}&action=ban_user&dateFrom=2025-10-01
Authorization: Bearer {admin_token}
```

**日志字段**:
- `adminId`: 操作管理员ID
- `action`: 操作类型
- `targetType`: 目标类型（user/topic/comment等）
- `targetId`: 目标ID
- `details`: 操作详情（JSON）
- `ipAddress`: 操作IP
- `createdAt`: 操作时间

---

## 权限说明

### 权限等级

1. **Super Admin（超级管理员）**
   - 所有权限
   - 可以管理其他管理员
   - 可以修改系统配置
   - 可以执行备份恢复

2. **Admin（管理员）**
   - 用户管理
   - 内容审核
   - 举报处理
   - 数据导出

3. **Moderator（版主）**
   - 内容审核
   - 评论管理
   - 举报处理

### 权限检查

所有管理后台接口都需要通过以下验证：

1. **身份认证**: JWT Token 验证
2. **角色检查**: 是否有管理员角色
3. **权限检查**: 是否有特定操作权限
4. **操作记录**: 所有操作自动记录日志

---

## 最佳实践

### 1. 用户管理

✅ **推荐做法**:
- 优先使用警告，而非直接封禁
- 封禁时说明具体原因
- 定期审查封禁用户，及时解封
- 重要操作前先查看用户历史记录

❌ **避免**:
- 无理由封禁
- 永久封禁轻微违规用户
- 不记录操作原因

### 2. 内容审核

✅ **推荐做法**:
- 制定明确的审核标准
- 及时处理待审核内容
- 拒绝时给出具体理由
- 对优质内容给予鼓励

❌ **避免**:
- 主观判断，缺乏标准
- 长时间积压待审核内容
- 简单拒绝，不给理由

### 3. 举报处理

✅ **推荐做法**:
- 24小时内响应举报
- 核实举报内容真实性
- 公正处理，一视同仁
- 记录详细的处理过程

❌ **避免**:
- 忽视举报
- 偏袒某一方
- 不调查就下结论

### 4. 数据安全

✅ **推荐做法**:
- 定期备份数据
- 敏感操作二次确认
- 不在公开场合讨论用户数据
- 遵守数据隐私法规

❌ **避免**:
- 泄露用户隐私
- 不备份就执行危险操作
- 与无关人员分享管理权限

---

## 常见问题

### Q1: 如何批量处理违规内容？

A: 使用批量操作接口：

```http
POST /api/admin/topics/batch
{
  "action": "delete",
  "topicIds": ["id1", "id2", "id3"],
  "reason": "批量删除违规内容"
}
```

### Q2: 如何导出特定时间段的数据？

A: 使用导出接口并指定时间范围：

```http
GET /api/admin/export?type=users&dateFrom=2025-10-01&dateTo=2025-10-31
```

### Q3: 如何查看某个管理员的操作历史？

A: 查询操作日志：

```http
GET /api/admin/logs?adminId={adminId}&page=1&limit=50
```

### Q4: 误删了内容如何恢复？

A: 目前系统支持软删除，可以从备份恢复。建议：
1. 立即通知超级管理员
2. 停止相关操作
3. 使用最近的备份恢复
4. 未来考虑实现"回收站"功能

### Q5: 如何设置定时任务？

A: 系统已集成定时任务（使用 node-cron）：
- 自动备份：每天凌晨2点
- 数据统计：每天凌晨3点
- 缓存清理：每小时

可以在 `src/jobs/scheduler.js` 中配置。

---

## 安全建议

1. **强密码策略**
   - 使用复杂密码
   - 定期更换密码
   - 不要共享账号

2. **访问控制**
   - 限制管理后台 IP 访问（可选）
   - 使用 HTTPS 加密
   - 启用二次验证（未来功能）

3. **操作审计**
   - 定期查看操作日志
   - 关注异常操作
   - 及时处理安全事件

4. **数据备份**
   - 每日自动备份
   - 定期测试恢复流程
   - 异地存储备份

---

## 相关文档

- [RBAC 权限管理指南](../guides/RBAC_GUIDE.md)
- [备份系统指南](../guides/BACKUP_GUIDE.md)
- [API 参考文档](../../../docs/API_REFERENCE.md)
- [部署指南](../../../docs/deployment/Deployment_guide.md)

---

## 技术支持

如有问题，请联系：
- 技术支持: support@ieclub.com
- 紧急事件: emergency@ieclub.com
- 文档反馈: docs@ieclub.com

---

**最后更新**: 2025-10-31  
**版本**: v2.0

