# IEclub 数据备份和恢复指南

## 概述

IEclub 后端提供了完善的数据备份和恢复系统，支持：
- 自动定时备份
- 手动创建备份
- 完整系统恢复
- 部分数据恢复

## 备份内容

完整备份包含：
1. **数据库** - MySQL 数据库完整导出
2. **上传文件** - 用户上传的所有文件（图片、文档等）
3. **Redis 数据** - 缓存和会话数据
4. **元数据** - 备份时间、版本、表列表等信息

## 自动备份

系统默认配置了两个定时任务：

### 1. 每日备份
- **时间**: 每天凌晨 2:00
- **内容**: 完整系统备份
- **位置**: `ieclub-backend/backups/`

### 2. 备份清理
- **时间**: 每天凌晨 3:00
- **规则**: 保留最近 10 个备份，删除较旧的备份

### 修改定时任务

编辑 `src/jobs/scheduler.js` 修改 cron 表达式：

```javascript
// Cron 表达式格式: 秒 分 时 日 月 星期
// 例如: '0 2 * * *' = 每天凌晨 2 点

const backupTask = cron.schedule('0 2 * * *', async () => {
  // 备份逻辑
});
```

常用 Cron 表达式：
- `0 2 * * *` - 每天凌晨 2 点
- `0 */6 * * *` - 每 6 小时
- `0 0 * * 0` - 每周日凌晨
- `0 0 1 * *` - 每月 1 号凌晨

## API 接口

### 1. 创建完整备份

```bash
POST /api/backup/full
Authorization: Bearer {admin_token}
```

响应：
```json
{
  "success": true,
  "data": {
    "name": "full_backup_2025-10-31T07-16-58-123Z",
    "path": "/path/to/backups/full_backup_2025-10-31T07-16-58-123Z",
    "metadata": {
      "timestamp": "2025-10-31T07:16:58.123Z",
      "version": "1.0.0",
      "tables": ["users", "topics", "comments", ...],
      "files": ["database.sql", "uploads.zip", "redis.json", "metadata.json"]
    }
  },
  "message": "备份创建成功"
}
```

### 2. 列出所有备份

```bash
GET /api/backup/list
Authorization: Bearer {admin_token}
```

响应：
```json
{
  "success": true,
  "data": {
    "backups": [
      {
        "name": "full_backup_2025-10-31T07-16-58-123Z",
        "timestamp": "2025-10-31T07:16:58.123Z",
        "version": "1.0.0",
        "size": 52428800,
        "created": "2025-10-31T07:16:58.123Z",
        "tables": 15
      }
    ],
    "total": 1
  }
}
```

### 3. 恢复备份

```bash
POST /api/backup/restore
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "backupName": "full_backup_2025-10-31T07-16-58-123Z"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-10-31T07:16:58.123Z",
    "version": "1.0.0",
    "tables": ["users", "topics", ...],
    "files": ["database.sql", "uploads.zip", "redis.json"]
  },
  "message": "备份恢复成功"
}
```

### 4. 删除备份

```bash
DELETE /api/backup/{backupName}
Authorization: Bearer {admin_token}
```

### 5. 备份特定表

```bash
POST /api/backup/table
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "tableName": "users"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "file": "/path/to/backups/users_export_2025-10-31T07-16-58-123Z.json",
    "records": 1523
  },
  "message": "表备份成功"
}
```

### 6. 恢复特定表

```bash
POST /api/backup/table/restore
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "tableName": "users",
  "filePath": "/path/to/backups/users_export_2025-10-31T07-16-58-123Z.json"
}
```

### 7. 仅备份数据库

```bash
POST /api/backup/database
Authorization: Bearer {admin_token}
```

### 8. 仅备份 Redis

```bash
POST /api/backup/redis
Authorization: Bearer {admin_token}
```

### 9. 仅备份上传文件

```bash
POST /api/backup/uploads
Authorization: Bearer {admin_token}
```

## 命令行操作

### 手动创建备份

```bash
# 进入项目目录
cd ieclub-backend

# 使用 Node.js 执行备份
node -e "
const backupService = require('./src/services/backupService');
backupService.createFullBackup()
  .then(result => {
    console.log('备份成功:', result.name);
    process.exit(0);
  })
  .catch(error => {
    console.error('备份失败:', error.message);
    process.exit(1);
  });
"
```

### 列出备份

```bash
node -e "
const backupService = require('./src/services/backupService');
backupService.listBackups()
  .then(backups => {
    console.log('备份列表:');
    backups.forEach(b => {
      console.log(\`- \${b.name} (\${new Date(b.timestamp).toLocaleString()})\`);
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('获取备份列表失败:', error.message);
    process.exit(1);
  });
"
```

### 恢复备份

```bash
# 恢复最新备份
node -e "
const backupService = require('./src/services/backupService');
backupService.listBackups()
  .then(backups => {
    if (backups.length === 0) {
      console.error('没有可用的备份');
      process.exit(1);
    }
    const latest = backups[0];
    console.log('恢复备份:', latest.name);
    return backupService.restoreFullBackup(latest.name);
  })
  .then(() => {
    console.log('恢复成功');
    process.exit(0);
  })
  .catch(error => {
    console.error('恢复失败:', error.message);
    process.exit(1);
  });
"
```

## 前置要求

### MySQL 备份工具

系统使用 `mysqldump` 和 `mysql` 命令进行数据库备份和恢复。

#### Windows 安装

```bash
# 确保 MySQL 安装目录在 PATH 中
# 默认路径: C:\Program Files\MySQL\MySQL Server 8.0\bin

# 添加到 PATH (PowerShell 管理员)
$env:PATH += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

#### Linux/Mac 安装

```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# CentOS/RHEL
sudo yum install mysql

# macOS (Homebrew)
brew install mysql-client
```

### 依赖包

确保安装了以下 npm 包：

```bash
npm install archiver unzipper node-cron
```

## 备份文件结构

```
backups/
├── full_backup_2025-10-31T07-16-58-123Z/
│   ├── database.sql          # 数据库导出文件
│   ├── uploads.zip           # 上传文件压缩包
│   ├── redis.json            # Redis 数据导出
│   └── metadata.json         # 备份元数据
├── full_backup_2025-10-30T07-16-58-123Z/
│   └── ...
└── ...
```

## 最佳实践

### 1. 定期验证备份

定期测试备份恢复流程，确保备份文件可用：

```bash
# 在测试环境恢复最新备份
# 验证数据完整性
```

### 2. 异地备份

将备份文件复制到异地存储：

```bash
# 复制到云存储 (示例: AWS S3)
aws s3 sync ./backups/ s3://my-backup-bucket/ieclub-backups/

# 或使用 rsync 同步到远程服务器
rsync -avz ./backups/ user@backup-server:/backup/ieclub/
```

### 3. 备份保留策略

根据需求调整保留策略：

```javascript
// src/services/backupService.js
class BackupService {
  constructor() {
    this.maxBackups = 10; // 修改保留数量
  }
}
```

建议策略：
- **每日备份**: 保留 7-10 天
- **每周备份**: 保留 4-8 周
- **每月备份**: 保留 6-12 个月

### 4. 监控备份任务

查看备份日志：

```bash
# 查看最近的备份日志
tail -f logs/combined-*.log | grep backup

# 或使用监控 API
GET /api/monitoring/logs?keyword=backup
```

### 5. 备份前检查

- 确保磁盘空间充足
- 验证数据库连接
- 确认 Redis 运行正常
- 检查上传目录访问权限

## 故障恢复

### 场景 1: 数据库损坏

```bash
# 1. 停止服务
pm2 stop ieclub-backend

# 2. 恢复数据库
POST /api/backup/restore
{
  "backupName": "full_backup_2025-10-31T07-16-58-123Z"
}

# 3. 重启服务
pm2 start ieclub-backend
```

### 场景 2: 误删除用户数据

```bash
# 恢复特定表
POST /api/backup/table/restore
{
  "tableName": "users",
  "filePath": "/path/to/users_export.json"
}
```

### 场景 3: Redis 数据丢失

```bash
# 仅恢复 Redis
POST /api/backup/redis
# 然后使用恢复脚本恢复 Redis 数据
```

## 安全注意事项

1. **备份文件加密**: 对敏感数据加密存储
2. **访问控制**: 备份 API 仅限管理员访问
3. **文件权限**: 限制备份目录访问权限
4. **定期审计**: 记录所有备份和恢复操作

```bash
# 设置备份目录权限 (Linux)
chmod 700 backups/
chown -R app:app backups/
```

## 故障排除

### 问题 1: mysqldump 命令不存在

```bash
# 检查 MySQL 客户端是否安装
which mysqldump

# 如果不存在，安装 MySQL 客户端
# 参见"前置要求"部分
```

### 问题 2: 备份文件过大

```bash
# 分别备份不同组件
POST /api/backup/database   # 仅备份数据库
POST /api/backup/uploads    # 仅备份上传文件
POST /api/backup/redis      # 仅备份 Redis
```

### 问题 3: 恢复时间过长

- 在低峰时段执行恢复
- 考虑使用增量备份
- 优化数据库索引和配置

### 问题 4: 磁盘空间不足

```bash
# 清理旧备份
POST /api/backup/{backupName}  # 删除指定备份

# 或手动清理
rm -rf backups/full_backup_old_*
```

## 监控和告警

### 设置备份监控

```javascript
// 监控备份任务执行
const monitoringService = require('./services/monitoringService');

// 记录备份任务
monitoringService.recordMetric('backup_execution', {
  status: 'success',
  duration: 120000,
  size: 52428800
});
```

### 告警配置

当备份失败时发送告警邮件：

```javascript
const emailService = require('./services/emailService');

// 备份失败时
if (backupFailed) {
  await emailService.sendEmail({
    to: 'admin@example.com',
    subject: '【警告】IEclub 备份失败',
    html: `备份任务执行失败: ${error.message}`
  });
}
```

## 相关文档

- [部署指南](./DEPLOYMENT.md)
- [监控系统文档](./MONITORING.md)
- [管理后台指南](./ADMIN_GUIDE.md)

## 支持

如有问题，请联系：
- 技术支持: support@ieclub.com
- 文档更新: docs@ieclub.com

