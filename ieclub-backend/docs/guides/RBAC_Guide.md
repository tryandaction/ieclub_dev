

# IEclub RBAC 权限管理系统指南

## 概述

IEclub 采用基于角色的访问控制（Role-Based Access Control, RBAC）系统，提供细粒度的权限管理功能。

### 核心概念

- **权限（Permission）**: 系统中的具体操作，如 `topic.create`、`user.delete`
- **角色（Role）**: 权限的集合，如 `admin`、`moderator`
- **用户角色（User Role）**: 用户与角色的关联关系

### 系统特性

✅ 细粒度权限控制  
✅ 灵活的角色管理  
✅ 支持临时角色（可设置过期时间）  
✅ 权限继承和组合  
✅ 操作日志审计  
✅ Redis 缓存优化  
✅ 兼容旧权限系统

---

## 快速开始

### 1. 初始化 RBAC 系统

```bash
# 进入项目目录
cd ieclub-backend

# 运行初始化脚本
node scripts/init-rbac.js
```

这将创建以下默认角色：

| 角色 | 描述 | 级别 |
|------|------|------|
| `super_admin` | 超级管理员 - 拥有所有权限 | 100 |
| `admin` | 管理员 - 拥有大部分管理权限 | 80 |
| `moderator` | 版主 - 负责内容审核 | 50 |
| `vip` | VIP用户 | 20 |
| `user` | 普通用户 | 10 |

### 2. 为用户分配角色

#### 方法 1: 使用命令行工具

```bash
# 分配超级管理员角色
node scripts/assign-role.js admin@sustech.edu.cn super_admin

# 分配版主角色
node scripts/assign-role.js moderator@sustech.edu.cn moderator
```

#### 方法 2: 使用 API

```bash
POST /api/rbac/users/{userId}/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "roleId": "role_id_here",
  "expiresAt": "2025-12-31T23:59:59.000Z"  # 可选，临时角色
}
```

### 3. 在代码中使用权限检查

#### 在路由中使用

```javascript
const { hasPermission, hasRole, isAdmin } = require('../middleware/permission');

// 检查特定权限
router.post('/topics/:id/delete',
  authenticate,
  hasPermission('topic.delete'),
  topicController.deleteTopic
);

// 检查多个权限（任一即可）
router.post('/content/approve',
  authenticate,
  hasPermission(['moderation.approve', 'admin.content']),
  contentController.approve
);

// 检查角色
router.get('/admin/dashboard',
  authenticate,
  isAdmin,
  adminController.dashboard
);

// 检查是否是资源所有者或有删除权限
router.delete('/topics/:id',
  authenticate,
  isOwnerOrHasPermission(
    async (req) => {
      const topic = await prisma.topic.findUnique({ where: { id: req.params.id } });
      return topic.userId;
    },
    'topic.delete.any'
  ),
  topicController.deleteTopic
);
```

#### 在 Service 中使用

```javascript
const rbacService = require('../services/rbacService');

// 检查用户权限
const canDelete = await rbacService.userHasPermission(userId, 'topic.delete.any');

if (!canDelete) {
  throw new Error('权限不足');
}

// 检查用户角色
const isAdmin = await rbacService.userHasRole(userId, 'admin');

// 检查多个权限
const canModerate = await rbacService.userHasAnyPermission(userId, [
  'moderation.review',
  'moderation.approve'
]);
```

---

## 权限定义

### 权限命名规范

权限名称遵循 `module.action[.resource]` 格式：

- **module**: 模块名（如 user, topic, comment）
- **action**: 操作（如 create, read, update, delete）
- **resource**: 可选，资源限定符（如 any, own）

示例：
- `topic.create` - 创建话题
- `topic.delete` - 删除自己的话题
- `topic.delete.any` - 删除任何话题

### 默认权限列表

#### 用户管理

```
user.create     - 创建用户
user.read       - 查看用户
user.update     - 更新用户
user.delete     - 删除用户
user.ban        - 封禁用户
```

#### 话题管理

```
topic.create      - 创建话题
topic.read        - 查看话题
topic.update      - 更新话题
topic.delete      - 删除话题
topic.delete.any  - 删除任何话题
```

#### 评论管理

```
comment.create      - 创建评论
comment.read        - 查看评论
comment.update      - 更新评论
comment.delete      - 删除评论
comment.delete.any  - 删除任何评论
```

#### 内容审核

```
moderation.review   - 审核内容
moderation.approve  - 批准内容
moderation.reject   - 拒绝内容
```

#### 管理后台

```
admin.access     - 访问管理后台
admin.dashboard  - 查看控制面板
admin.users      - 管理用户
admin.content    - 管理内容
admin.settings   - 系统设置
```

#### 角色权限管理

```
role.create      - 创建角色
role.read        - 查看角色
role.update      - 更新角色
role.delete      - 删除角色
role.assign      - 分配角色

permission.create  - 创建权限
permission.read    - 查看权限
permission.update  - 更新权限
permission.delete  - 删除权限
```

#### 系统管理

```
system.backup      - 系统备份
system.restore     - 系统恢复
system.logs        - 查看日志
system.monitoring  - 系统监控
```

---

## API 接口

### 角色管理

#### 创建角色

```http
POST /api/rbac/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "content_manager",
  "displayName": "内容管理员",
  "description": "负责内容管理和审核",
  "level": 40,
  "permissions": ["permission_id_1", "permission_id_2"]
}
```

#### 获取所有角色

```http
GET /api/rbac/roles?type=custom&isActive=true&search=管理员
Authorization: Bearer {admin_token}
```

#### 获取角色详情

```http
GET /api/rbac/roles/{roleId}
Authorization: Bearer {admin_token}
```

#### 更新角色

```http
PUT /api/rbac/roles/{roleId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "displayName": "高级内容管理员",
  "description": "更新后的描述",
  "level": 45,
  "isActive": true,
  "permissions": ["permission_id_1", "permission_id_2", "permission_id_3"]
}
```

#### 删除角色

```http
DELETE /api/rbac/roles/{roleId}
Authorization: Bearer {admin_token}
```

### 权限管理

#### 创建权限

```http
POST /api/rbac/permissions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "project.manage",
  "displayName": "管理项目",
  "description": "创建、编辑、删除项目",
  "module": "project",
  "action": "manage",
  "resource": "any"
}
```

#### 获取所有权限

```http
GET /api/rbac/permissions?module=topic&action=delete&isActive=true
Authorization: Bearer {admin_token}
```

### 用户角色管理

#### 为用户分配角色

```http
POST /api/rbac/users/{userId}/roles
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "roleId": "role_id_here",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

#### 移除用户角色

```http
DELETE /api/rbac/users/{userId}/roles/{roleId}
Authorization: Bearer {admin_token}
```

#### 获取用户角色

```http
GET /api/rbac/users/{userId}/roles
Authorization: Bearer {admin_token}
```

#### 获取用户权限

```http
GET /api/rbac/users/{userId}/permissions
Authorization: Bearer {admin_token}
```

#### 获取当前用户权限

```http
GET /api/rbac/my-permissions
Authorization: Bearer {token}
```

响应：
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "role_id",
        "name": "admin",
        "displayName": "管理员",
        "level": 80
      }
    ],
    "permissions": [
      {
        "id": "perm_id",
        "name": "topic.delete.any",
        "displayName": "删除任何话题",
        "module": "topic",
        "action": "delete"
      }
    ],
    "permissionNames": ["topic.delete.any", "user.ban", ...]
  }
}
```

---

## 管理后台集成

### RBAC 管理页面 API

#### 获取 RBAC 概览

```http
GET /api/admin/rbac/overview
Authorization: Bearer {admin_token}
```

返回角色、权限统计和最近分配记录。

#### 获取用户角色权限详情

```http
GET /api/admin/rbac/users/{userId}/details
Authorization: Bearer {admin_token}
```

#### 获取权限矩阵

```http
GET /api/admin/rbac/permission-matrix
Authorization: Bearer {admin_token}
```

返回角色-权限矩阵，用于可视化展示。

#### 搜索用户

```http
GET /api/admin/rbac/search-users?keyword=admin&roleId={roleId}
Authorization: Bearer {admin_token}
```

#### 批量分配角色

```http
POST /api/admin/rbac/batch-assign
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userIds": ["user_id_1", "user_id_2"],
  "roleIds": ["role_id_1", "role_id_2"],
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

#### 批量移除角色

```http
POST /api/admin/rbac/batch-remove
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userIds": ["user_id_1", "user_id_2"],
  "roleIds": ["role_id_1"]
}
```

---

## 高级用法

### 1. 创建自定义权限

```javascript
const rbacService = require('./services/rbacService');

// 创建自定义权限
await rbacService.createPermission({
  name: 'event.manage',
  displayName: '管理活动',
  description: '创建、编辑、删除活动',
  module: 'event',
  action: 'manage'
});
```

### 2. 创建自定义角色

```javascript
// 创建角色并分配权限
await rbacService.createRole({
  name: 'event_organizer',
  displayName: '活动组织者',
  description: '负责组织和管理活动',
  level: 30,
  permissions: [eventManagePermissionId, eventPublishPermissionId]
});
```

### 3. 临时角色分配

```javascript
// 分配临时版主角色（7天后过期）
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);

await rbacService.assignRoleToUser(
  userId,
  moderatorRoleId,
  assignedBy,
  expiresAt
);
```

### 4. 权限组合检查

```javascript
// 检查用户是否有所有指定权限
const hasAll = await rbacService.userHasAllPermissions(userId, [
  'topic.create',
  'topic.update',
  'topic.delete'
]);

// 检查用户是否有任一权限
const hasAny = await rbacService.userHasAnyPermission(userId, [
  'moderation.approve',
  'admin.content'
]);
```

---

## 数据库结构

### roles 表

```sql
CREATE TABLE `roles` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(50) UNIQUE NOT NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `level` INT DEFAULT 0,
  `type` VARCHAR(20) DEFAULT 'custom',
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### permissions 表

```sql
CREATE TABLE `permissions` (
  `id` VARCHAR(191) PRIMARY KEY,
  `name` VARCHAR(100) UNIQUE NOT NULL,
  `displayName` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `module` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `resource` VARCHAR(50),
  `isActive` BOOLEAN DEFAULT true,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

### role_permissions 表

```sql
CREATE TABLE `role_permissions` (
  `id` VARCHAR(191) PRIMARY KEY,
  `roleId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`roleId`, `permissionId`)
);
```

### user_roles 表

```sql
CREATE TABLE `user_roles` (
  `id` VARCHAR(191) PRIMARY KEY,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `assignedBy` VARCHAR(191),
  `expiresAt` DATETIME,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`userId`, `roleId`)
);
```

---

## 性能优化

### 缓存策略

系统使用 Redis 缓存用户权限，缓存时间为 5 分钟：

```javascript
// 权限自动缓存
const permissions = await rbacService.getUserPermissions(userId);

// 清除缓存（在角色或权限变更时自动执行）
await rbacService.clearUserPermissionsCache(userId);
```

### 批量操作

使用批量 API 提高效率：

```javascript
// 批量创建权限
await rbacService.createPermissionsBatch(permissionsArray);

// 批量分配角色
await adminRBACController.batchAssignRoles(req, res);
```

---

## 最佳实践

### 1. 权限粒度设计

✅ **推荐**: 细粒度权限
```javascript
hasPermission('topic.delete.any')  // 删除任何话题
hasPermission('topic.delete')      // 删除自己的话题
```

❌ **不推荐**: 过于粗粒度
```javascript
hasPermission('admin')  // 太宽泛
```

### 2. 角色层次

建议角色级别划分：
- 100: 超级管理员
- 80-90: 系统管理员
- 50-70: 部门管理员/版主
- 20-40: 特权用户
- 1-10: 普通用户

### 3. 权限命名

遵循一致的命名规范：
```
{module}.{action}[.{resource}]

示例:
- topic.create
- topic.update.own
- topic.delete.any
- admin.users.ban
```

### 4. 安全原则

- ✅ 最小权限原则：仅授予必要权限
- ✅ 定期审计：检查角色分配
- ✅ 临时权限：敏感操作使用临时角色
- ✅ 操作日志：记录所有权限变更

---

## 故障排除

### 问题 1: 权限不生效

**症状**: 用户有角色但权限检查失败

**解决方案**:
```bash
# 清除用户权限缓存
redis-cli DEL user:{userId}:permissions

# 或在代码中
await rbacService.clearUserPermissionsCache(userId);
```

### 问题 2: 无法删除角色

**错误**: "该角色正在被 X 个用户使用，无法删除"

**解决方案**:
```bash
# 先移除所有用户的该角色
POST /api/admin/rbac/batch-remove
{
  "userIds": [...],
  "roleIds": ["role_to_delete"]
}

# 然后删除角色
DELETE /api/rbac/roles/{roleId}
```

### 问题 3: 系统内置角色不能修改

**错误**: "系统内置角色不允许修改名称"

**说明**: `type: 'system'` 的角色受保护，只能修改显示名称和描述，不能修改 name 和 type。

---

## 从旧权限系统迁移

系统保持向后兼容，同时支持新旧权限系统：

```javascript
// 旧系统 (adminAuth.js)
router.use(requireAdmin);

// 新系统 (permission.js)
router.use(canAccessAdmin);

// 兼容方式 (admin.js)
router.use(async (req, res, next) => {
  const hasAccess = await rbacService.userHasPermission(req.user.id, 'admin.access');
  if (hasAccess) return next();
  requireAdmin(req, res, next);  // Fallback
});
```

---

## 相关文档

- [部署指南](./DEPLOYMENT.md)
- [管理后台指南](./ADMIN_GUIDE.md)
- [备份系统指南](./BACKUP_GUIDE.md)
- [API 文档](./docs/API_REFERENCE.md)

---

## 支持

如有问题，请联系：
- 技术支持: support@ieclub.com
- 文档更新: docs@ieclub.com

