# 数据库迁移：添加个人主页字段和发布内容表

**日期**: 2025-11-08  
**版本**: 20251108_add_profile_fields  
**重要性**: ⚠️ **必须执行** - 修复测试环境发现的字段缺失问题

## 变更说明

### 1. Users 表更新

添加个人主页相关字段：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `coverImage` | TEXT | 个人主页封面图 |
| `motto` | VARCHAR(200) | 个人座右铭 |
| `introduction` | TEXT | 详细个人介绍 |
| `website` | VARCHAR(200) | 个人网站 |
| `github` | VARCHAR(200) | GitHub |
| `bilibili` | VARCHAR(200) | B站主页 |
| `wechat` | VARCHAR(100) | 微信号 |
| `school` | VARCHAR(100) | 学校 |
| `major` | VARCHAR(100) | 专业 |
| `grade` | VARCHAR(20) | 年级 |
| `verified` | BOOLEAN | 是否认证 |
| `achievements` | TEXT | 成就列表 (JSON) |
| `projectsData` | TEXT | 个人项目列表 (JSON) |

### 2. Posts 表创建

创建统一的发布内容表，支持：
- 我想听 (want_hear)
- 我来讲 (can_tell)
- 分享 (share)
- 活动 (activity)
- 项目 (project)

## 为什么需要这个迁移？

在测试环境发现以下问题：
1. ❌ `/api/profile/:userId` 返回 500 错误
2. ❌ 数据库缺少 `users.coverImage` 等字段
3. ❌ `posts` 表不存在

这些字段在 `schema.prisma` 中已定义，但数据库中缺失，导致 API 调用失败。

## 执行方式

### 测试环境（已执行）

```bash
# 已在测试环境手动执行
ssh root@ieclub.online
mysql -u root -p ieclub_staging < /tmp/migration.sql
```

### 生产环境（待执行）

**方式1: 使用 Prisma Migrate（推荐）**

```bash
cd ieclub-backend
npm run prisma:migrate:prod
```

**方式2: 手动执行 SQL**

```bash
# 登录服务器
ssh root@ieclub.online

# 备份数据库
mysqldump -u root -p ieclub > /root/backups/ieclub_backup_$(date +%Y%m%d_%H%M%S).sql

# 执行迁移
mysql -u root -p ieclub < ieclub-backend/prisma/migrations/20251108_add_profile_fields/migration.sql

# 验证
mysql -u root -p ieclub -e "DESCRIBE users;" | grep coverImage
mysql -u root -p ieclub -e "SHOW TABLES LIKE 'posts';"
```

## 验证步骤

执行迁移后，验证：

```sql
-- 1. 检查 users 表新字段
DESCRIBE users;

-- 2. 检查 posts 表是否存在
SHOW TABLES LIKE 'posts';

-- 3. 检查 posts 表结构
DESCRIBE posts;

-- 4. 验证外键约束
SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  CONSTRAINT_NAME, 
  REFERENCED_TABLE_NAME, 
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'posts' AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## 回滚方式

如需回滚此迁移：

```sql
-- 1. 删除 posts 表
DROP TABLE IF EXISTS `posts`;

-- 2. 删除 users 表新增字段
ALTER TABLE `users` 
  DROP COLUMN `coverImage`,
  DROP COLUMN `motto`,
  DROP COLUMN `introduction`,
  DROP COLUMN `website`,
  DROP COLUMN `github`,
  DROP COLUMN `bilibili`,
  DROP COLUMN `wechat`,
  DROP COLUMN `school`,
  DROP COLUMN `major`,
  DROP COLUMN `grade`,
  DROP COLUMN `verified`,
  DROP COLUMN `achievements`,
  DROP COLUMN `projectsData`;
```

## 注意事项

1. **向后兼容**: ✅ 所有新字段都是可选的（NULL），不影响现有数据
2. **性能影响**: ⚡ 添加字段操作很快，不会锁表太久
3. **数据完整性**: ✅ 外键约束确保数据一致性
4. **测试验证**: ✅ 已在测试环境验证通过

## 部署检查清单

- [ ] 备份生产数据库
- [ ] 在测试环境验证迁移
- [ ] 检查磁盘空间（至少 1GB 可用）
- [ ] 确认数据库版本（MySQL >= 8.0）
- [ ] 执行迁移脚本
- [ ] 验证表结构
- [ ] 重启后端服务
- [ ] 测试 API 端点
- [ ] 监控错误日志

## 相关文档

- [Bug 修复报告](../../../docs/deployment/BUG_FIXES_2025_11_08.md)
- [Schema 定义](../schema.prisma)
- [部署指南](../../../docs/deployment/Deployment_guide.md)

---

**状态**: ✅ 测试环境已验证  
**下一步**: 部署到生产环境前执行此迁移

