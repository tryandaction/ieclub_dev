# IEclub管理员系统使用指南

**版本**: v1.0  
**更新时间**: 2025-11-05

---

## 📚 目录

1. [快速开始](#快速开始)
2. [初始化管理员](#初始化管理员)
3. [登录管理后台](#登录管理后台)
4. [核心功能使用](#核心功能使用)
5. [安全最佳实践](#安全最佳实践)
6. [API参考](#api参考)
7. [常见问题](#常见问题)
8. [故障排除](#故障排除)

---

## 🚀 快速开始

### 前置条件

- Node.js >= 18.0.0
- MySQL数据库已配置
- 后端服务已启动

### 一键初始化

```bash
# 进入后端目录
cd ieclub-backend

# 安装依赖
npm install

# 运行数据库迁移
npm run migrate:dev

# 初始化超级管理员
npm run init:admin
```

---

## 👤 初始化管理员

### 步骤1: 运行初始化脚本

```bash
npm run init:admin
```

### 步骤2: 按提示输入信息

```
请输入超级管理员信息：

用户名: admin
邮箱: admin@ieclub.com
密码: Admin@123456
真实姓名（可选）: 张三
```

### 步骤3: 确认创建成功

```
✅ 超级管理员创建成功！

==================================================
ID: clxxx...
用户名: admin
邮箱: admin@ieclub.com
角色: 超级管理员
权限数量: 27
==================================================

请使用以下信息登录管理后台：
  邮箱: admin@ieclub.com
  密码: [您刚才输入的密码]

⚠️  请妥善保管登录信息，建议首次登录后立即修改密码！
```

---

## 🔐 登录管理后台

### Web端登录

1. **打开管理后台**  
   访问: `http://your-domain.com/admin/login`

2. **输入凭证**
   - 邮箱: `admin@ieclub.com`
   - 密码: [您设置的密码]

3. **双因素认证（可选）**  
   首次登录后，建议启用2FA以增强安全性

### 小程序端登录

1. 打开小程序
2. 点击"我的" → "管理入口"
3. 输入管理员邮箱和密码
4. 完成登录

### API登录

```bash
POST /api/admin/auth/login

{
  "email": "admin@ieclub.com",
  "password": "Admin@123456"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "clxxx...",
      "username": "admin",
      "email": "admin@ieclub.com",
      "role": "super_admin",
      "permissions": ["admin:create", "user:read", ...],
      "realName": "张三",
      "avatar": null
    }
  }
}
```

---

## 💼 核心功能使用

### 1. 仪表盘

查看平台核心数据

```bash
GET /api/admin/stats/dashboard
Authorization: Bearer {accessToken}
```

**展示内容**:
- 总用户数、活跃用户、今日新增
- 总帖子数、总话题数、总评论数
- 用户增长趋势图（近30天）
- 帖子发布趋势图
- 热门内容TOP 10
- 待处理举报、活跃封禁数

### 2. 公告管理

#### 2.1 创建公告

```bash
POST /api/admin/announcements
Authorization: Bearer {accessToken}

{
  "title": "系统维护通知",
  "content": "我们将在2025年11月10日进行系统维护...",
  "type": "system",
  "priority": "high",
  "displayType": "popup",
  "targetAudience": {
    "type": "all"
  },
  "publishAt": "2025-11-10T00:00:00Z",
  "expireAt": "2025-11-11T00:00:00Z"
}
```

#### 2.2 公告类型

- `system` - 系统维护
- `feature` - 功能更新
- `activity` - 活动通知
- `policy` - 政策公告
- `general` - 普通通知

#### 2.3 展示方式

- `popup` - 弹窗（强制查看）
- `banner` - 横幅（顶部提示）
- `notice` - 通知（消息中心）

#### 2.4 目标用户

```json
// 全体用户
{
  "type": "all"
}

// 特定学校
{
  "type": "school",
  "schools": ["清华大学", "北京大学"]
}

// 特定角色（需RBAC）
{
  "type": "role",
  "roles": ["vip_user", "verified_user"]
}
```

### 3. 用户管理

#### 3.1 搜索用户

```bash
GET /api/admin/users?keyword=张三&school=清华&page=1&limit=20
Authorization: Bearer {accessToken}
```

#### 3.2 查看用户详情

```bash
GET /api/admin/users/{userId}
Authorization: Bearer {accessToken}
```

**返回信息**:
- 基本信息（邮箱、学校、认证状态）
- 统计数据（发帖数、评论数、点赞数）
- 最近发布的帖子和话题
- 警告记录
- 封禁记录
- 举报统计

#### 3.3 警告用户

```bash
POST /api/admin/users/{userId}/warn
Authorization: Bearer {accessToken}

{
  "reason": "违反社区规范",
  "content": "您发布的帖子包含不当内容，请注意遵守社区规范。",
  "level": "serious",
  "relatedPostId": "clxxx..."
}
```

**警告级别**:
- `minor` - 轻微警告
- `serious` - 严重警告
- `final` - 最后警告

#### 3.4 封禁用户

```bash
POST /api/admin/users/{userId}/ban
Authorization: Bearer {accessToken}

{
  "reason": "多次发布违规内容",
  "duration": 7,
  "notifyUser": true
}
```

**duration参数**:
- 数字: 封禁天数（如7表示7天）
- `null`: 永久封禁

#### 3.5 解封用户

```bash
POST /api/admin/users/{userId}/unban
Authorization: Bearer {accessToken}

{
  "reason": "用户已认识错误，同意解封"
}
```

### 4. 内容管理

#### 4.1 管理帖子

```bash
# 获取帖子列表
GET /api/admin/posts?status=normal&page=1&limit=20

# 删除帖子
DELETE /api/admin/posts/{postId}

# 置顶帖子
POST /api/admin/posts/{postId}/pin

# 设为精选
POST /api/admin/posts/{postId}/feature
```

#### 4.2 管理举报

```bash
# 获取举报列表
GET /api/admin/reports?status=pending&page=1&limit=20

# 处理举报
POST /api/admin/reports/{reportId}/process
{
  "action": "delete_content",
  "reason": "内容确实违规，已删除",
  "additionalAction": {
    "warnUser": true,
    "warningLevel": "serious"
  }
}
```

**处理动作**:
- `reject` - 驳回举报
- `hide_content` - 隐藏内容
- `delete_content` - 删除内容
- `warn_user` - 警告用户
- `ban_user` - 封禁用户

### 5. 数据统计

#### 5.1 用户统计

```bash
GET /api/admin/stats/users?startDate=2025-10-01&endDate=2025-11-05
```

**包含数据**:
- 用户增长趋势
- 学校分布
- 用户等级分布
- 认证状态分布

#### 5.2 内容统计

```bash
GET /api/admin/stats/content
```

**包含数据**:
- 帖子类型分布
- 话题类别分布
- 评论统计

#### 5.3 互动统计

```bash
GET /api/admin/stats/engagement
```

**包含数据**:
- 总点赞数、今日新增
- 总评论数、今日新增
- 总收藏数、今日新增

#### 5.4 导出数据

```bash
POST /api/admin/stats/export
{
  "type": "users",
  "format": "csv",
  "startDate": "2025-10-01",
  "endDate": "2025-11-05",
  "includeDetails": true
}
```

---

## 🔒 安全最佳实践

### 1. 密码策略

**要求**:
- 至少8位字符
- 包含大写字母
- 包含小写字母
- 包含数字
- 包含特殊字符

**示例**: `Admin@123456`

### 2. 启用双因素认证（2FA）

#### 步骤1: 启用2FA

```bash
POST /api/admin/auth/enable-2fa
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "backupCodes": [
      "A2B3C4D5",
      "E6F7G8H9",
      ...
    ]
  }
}
```

#### 步骤2: 扫描二维码

使用Google Authenticator或类似应用扫描二维码

#### 步骤3: 验证并完成

```bash
POST /api/admin/auth/verify-2fa
Authorization: Bearer {accessToken}

{
  "token": "123456"
}
```

#### 步骤4: 妥善保存备用码

备用码只显示一次，请妥善保存。当2FA设备丢失时可以使用备用码登录。

### 3. 定期修改密码

```bash
POST /api/admin/auth/change-password
Authorization: Bearer {accessToken}

{
  "oldPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

**建议**: 每90天修改一次密码

### 4. 会话管理

- Access Token有效期: 2小时
- Refresh Token有效期: 7天
- 使用Refresh Token自动续期

```bash
POST /api/admin/auth/refresh

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. 安全登出

```bash
POST /api/admin/auth/logout
Authorization: Bearer {accessToken}
```

登出后，所有Token将失效。

---

## 📖 API参考

### 认证相关

| 接口 | 方法 | 说明 |
|-----|------|-----|
| `/api/admin/auth/login` | POST | 管理员登录 |
| `/api/admin/auth/logout` | POST | 管理员登出 |
| `/api/admin/auth/refresh` | POST | 刷新Token |
| `/api/admin/auth/me` | GET | 获取当前管理员信息 |
| `/api/admin/auth/change-password` | POST | 修改密码 |
| `/api/admin/auth/enable-2fa` | POST | 启用2FA |
| `/api/admin/auth/verify-2fa` | POST | 验证2FA |
| `/api/admin/auth/disable-2fa` | POST | 禁用2FA |

### 公告管理

| 接口 | 方法 | 权限 | 说明 |
|-----|------|-----|-----|
| `/api/admin/announcements` | GET | announcement:read | 获取公告列表 |
| `/api/admin/announcements/:id` | GET | announcement:read | 获取公告详情 |
| `/api/admin/announcements` | POST | announcement:create | 创建公告 |
| `/api/admin/announcements/:id` | PUT | announcement:update | 更新公告 |
| `/api/admin/announcements/:id` | DELETE | announcement:delete | 删除公告 |
| `/api/admin/announcements/:id/publish` | POST | announcement:create | 发布公告 |
| `/api/admin/announcements/:id/stats` | GET | announcement:read | 公告统计 |

### 用户管理

| 接口 | 方法 | 权限 | 说明 |
|-----|------|-----|-----|
| `/api/admin/users` | GET | user:read | 获取用户列表 |
| `/api/admin/users/:id` | GET | user:read | 获取用户详情 |
| `/api/admin/users/:id` | PUT | user:update | 更新用户信息 |
| `/api/admin/users/:id/warn` | POST | user:update | 警告用户 |
| `/api/admin/users/:id/ban` | POST | user:ban | 封禁用户 |
| `/api/admin/users/:id/unban` | POST | user:ban | 解封用户 |
| `/api/admin/users/:id` | DELETE | user:delete | 删除用户 |

### 数据统计

| 接口 | 方法 | 权限 | 说明 |
|-----|------|-----|-----|
| `/api/admin/stats/dashboard` | GET | stats:view | 仪表盘数据 |
| `/api/admin/stats/users` | GET | stats:view | 用户统计 |
| `/api/admin/stats/content` | GET | stats:view | 内容统计 |
| `/api/admin/stats/engagement` | GET | stats:view | 互动统计 |
| `/api/admin/stats/export` | POST | stats:export | 导出数据 |

---

## ❓ 常见问题

### Q1: 忘记密码怎么办？

**A**: 联系其他超级管理员重置，或者：
1. 直接操作数据库
2. 运行密码重置脚本
3. 重新创建管理员账户

### Q2: 2FA设备丢失无法登录？

**A**: 使用备用码登录：
```bash
POST /api/admin/auth/login

{
  "email": "admin@ieclub.com",
  "password": "your_password",
  "backupCode": "A2B3C4D5"
}
```

### Q3: 如何创建其他管理员？

**A**: 仅超级管理员可以创建：
```bash
POST /api/admin/admins

{
  "username": "moderator1",
  "email": "mod1@ieclub.com",
  "password": "SecurePass@123",
  "role": "content_moderator",
  "realName": "李四"
}
```

### Q4: 权限不足怎么办？

**A**: 检查您的角色权限，联系超级管理员升级权限。

### Q5: Token过期怎么办？

**A**: 使用Refresh Token刷新：
```bash
POST /api/admin/auth/refresh
{
  "refreshToken": "your_refresh_token"
}
```

---

## 🔧 故障排除

### 登录失败

**症状**: 提示"邮箱或密码错误"

**排查步骤**:
1. 确认邮箱和密码正确
2. 检查账户是否被锁定（5次失败后锁定30分钟）
3. 确认账户状态为"active"

### Token无效

**症状**: 提示"令牌无效或已过期"

**解决方案**:
1. 使用Refresh Token刷新
2. 重新登录获取新Token
3. 检查Token格式（Bearer + 空格 + Token）

### 权限不足

**症状**: 提示"权限不足"

**解决方案**:
1. 确认操作所需权限
2. 检查当前角色权限列表
3. 联系超级管理员分配权限

### 审计日志不完整

**症状**: 部分操作没有日志记录

**排查步骤**:
1. 检查日志中间件是否正确配置
2. 确认数据库连接正常
3. 查看服务器日志错误信息

---

## 📞 技术支持

- **文档**: https://docs.ieclub.com/admin
- **API文档**: https://docs.ieclub.com/api
- **技术支持**: tech@ieclub.com
- **紧急联系**: +86 400-xxx-xxxx

---

## 📄 附录

### A. 权限完整列表

```javascript
// 管理员管理
admin:create, admin:read, admin:update, admin:delete

// 用户管理  
user:read, user:update, user:ban, user:delete

// 内容管理
post:read, post:update, post:delete, post:feature, post:pin
topic:read, topic:update, topic:delete, topic:feature
comment:read, comment:delete

// 公告管理
announcement:create, announcement:read, announcement:update, announcement:delete

// 举报管理
report:read, report:handle

// 数据访问
stats:view, stats:export

// 系统配置
system:config, audit:view
```

### B. 角色对应权限

详见 [管理员系统设计文档](./ADMIN_SYSTEM_DESIGN.md#22-权限矩阵)

---

**文档版本**: v1.0  
**最后更新**: 2025-11-05  
**维护者**: IEclub技术团队

