# 数据库迁移：添加签到功能字段

**日期**: 2025-11-01  
**版本**: 20251101_add_checkin_fields

## 变更说明

### 1. ActivityParticipant 表更新

添加以下字段：
- `status` (VARCHAR(20)): 报名状态 (approved/pending/rejected)
- `note` (TEXT): 报名备注
- `checkedIn` (BOOLEAN): 是否已签到
- `checkedInAt` (DATETIME): 签到时间
- `updatedAt` (DATETIME): 更新时间

添加索引：
- `checkedIn` 字段索引，优化签到查询性能

### 2. Activity 表更新

添加字段：
- `checkedInCount` (INT): 签到人数统计

### 3. 数据初始化

- 自动计算并更新现有活动的签到人数

## 执行方式

### 开发环境

```bash
# 方式1: 使用 Prisma Migrate
npm run prisma:migrate

# 方式2: 手动执行 SQL
mysql -u root -p ieclub_dev < prisma/migrations/20251101_add_checkin_fields/migration.sql
```

### 生产环境

```bash
# 使用 Prisma Migrate Deploy
npm run prisma:migrate:prod

# 或手动执行
mysql -u your_user -p your_database < prisma/migrations/20251101_add_checkin_fields/migration.sql
```

## 回滚方式

如需回滚此迁移：

```sql
-- 1. 删除新增字段
ALTER TABLE `activity_participants` 
  DROP COLUMN `status`,
  DROP COLUMN `note`,
  DROP COLUMN `checkedIn`,
  DROP COLUMN `checkedInAt`,
  DROP COLUMN `updatedAt`;

-- 2. 删除索引
DROP INDEX `activity_participants_checkedIn_idx` ON `activity_participants`;

-- 3. 删除签到统计字段
ALTER TABLE `activities` DROP COLUMN `checkedInCount`;
```

## 注意事项

1. **向后兼容**: 所有新字段都有默认值，不影响现有代码
2. **性能影响**: 添加索引可能需要一些时间，建议在低峰期执行
3. **数据完整性**: 迁移会自动初始化现有数据的签到统计
4. **测试建议**: 在生产环境执行前，请在测试环境充分测试

## 验证步骤

执行迁移后，验证：

```sql
-- 1. 检查表结构
DESCRIBE activity_participants;
DESCRIBE activities;

-- 2. 检查索引
SHOW INDEX FROM activity_participants;

-- 3. 验证数据
SELECT 
  a.id,
  a.title,
  a.checkedInCount,
  COUNT(ap.id) as actual_count
FROM activities a
LEFT JOIN activity_participants ap ON a.id = ap.activityId AND ap.checkedIn = TRUE
GROUP BY a.id;
```

## 相关文件

- Schema: `prisma/schema.prisma`
- Service: `src/services/activityService.js`
- Controller: `src/controllers/activityControllerV2.js`
- Documentation: `docs/features/Activity_CheckIn_System.md`

