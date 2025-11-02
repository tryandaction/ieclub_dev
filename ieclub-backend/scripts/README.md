# IEClub 后端工具脚本

这个目录包含了用于管理、维护和优化 IEClub 后端系统的工具脚本。

## 📋 目录

- [性能监控与优化](#性能监控与优化)
- [数据库管理](#数据库管理)
- [系统维护](#系统维护)
- [最佳实践](#最佳实践)

---

## 🚀 性能监控与优化

### 1. 性能检查 (`performance-check.js`)

**功能**: 全面检查系统性能，包括数据库、索引、数据分布等

**使用方法**:
```bash
npm run check:performance
# 或
node scripts/performance-check.js
```

**输出内容**:
- 数据库连接状态和延迟
- 各表的大小和记录数
- 索引使用情况
- 数据分布统计
- 热门内容分析
- 性能优化建议

**推荐频率**: 每周一次

---

### 2. 热度分数更新 (`update-hot-scores.js`)

**功能**: 使用 Hacker News 算法更新话题热度分数

**使用方法**:
```bash
# 更新所有话题
npm run update:hot-scores
node scripts/update-hot-scores.js all

# 只更新最近7天的话题
node scripts/update-hot-scores.js recent 168

# 显示热度排行榜
node scripts/update-hot-scores.js top 20

# 更新单个话题
node scripts/update-hot-scores.js single 123
```

**算法说明**:
```
热度分数 = (浏览数 × 1 + 点赞数 × 2 + 评论数 × 3 + 收藏数 × 2) / (发布小时数 + 2)^1.8
```

**推荐频率**: 
- 开发环境: 按需运行
- 生产环境: 每小时通过 cron 任务自动运行

---

### 3. 数据库优化 (`run-database-optimization.js`)

**功能**: 执行数据库优化 SQL 脚本，创建索引、优化表结构

**使用方法**:
```bash
npm run optimize:db
# 或
node scripts/run-database-optimization.js
```

**执行操作**:
- 创建性能优化索引
- 优化表引擎和字符集
- 分析和优化表
- 创建性能视图
- 创建存储过程

**注意事项**:
- 首次运行可能需要几分钟
- 会自动跳过已存在的索引
- 建议在低峰期运行

**推荐频率**: 每月一次

---

## 💾 数据库管理

### 4. 备份与恢复 (`backup-restore.js`)

**功能**: 数据库备份和恢复工具

**使用方法**:
```bash
# 创建完整备份
npm run backup
node scripts/backup-restore.js backup

# 列出所有备份
npm run backup:list
node scripts/backup-restore.js list

# 只备份数据库结构
npm run backup:schema
node scripts/backup-restore.js schema

# 恢复备份
node scripts/backup-restore.js restore <备份文件名>
node scripts/backup-restore.js restore backup_ieclub_2025-11-02.sql.gz

# 清理旧备份（保留最近30个）
node scripts/backup-restore.js clean
```

**备份存储**:
- 位置: `ieclub-backend/backups/`
- 格式: `backup_<数据库名>_<时间戳>.sql.gz`
- 自动压缩
- 自动清理超过30个的旧备份

**推荐频率**:
- 生产环境: 每天自动备份
- 开发环境: 每周手动备份
- 重要操作前: 立即备份

---

## 🏥 系统维护

### 5. 健康检查 (`health-check.js`)

**功能**: 全面的系统健康状态检查

**使用方法**:
```bash
npm run health
node scripts/health-check.js

# 包含 API 端点检查
npm run health:api
node scripts/health-check.js --check-api
```

**检查项目**:
- ✅ 环境变量配置
- ✅ 数据库连接和延迟
- ✅ Redis 连接（可选）
- ✅ 文件系统权限
- ✅ 系统资源（CPU、内存）
- ✅ 数据完整性
- ✅ API 端点可用性（可选）

**健康评分**:
- 90-100%: 优秀 ✨
- 70-89%: 良好（有小问题）
- <70%: 异常（需要处理）

**推荐频率**: 每天一次，或部署后立即运行

---

## 🛠️ 最佳实践

### 日常维护计划

#### 每日任务
```bash
# 1. 健康检查
npm run health

# 2. 创建备份（生产环境）
npm run backup
```

#### 每周任务
```bash
# 1. 性能检查
npm run check:performance

# 2. 更新热度分数
npm run update:hot-scores

# 3. 查看备份列表
npm run backup:list
```

#### 每月任务
```bash
# 1. 数据库优化
npm run optimize:db

# 2. 完整性检查
npm run health

# 3. 清理旧备份
node scripts/backup-restore.js clean
```

---

### 自动化建议

可以通过 cron 任务或 GitHub Actions 自动执行这些脚本：

**Linux Crontab 示例**:
```bash
# 编辑 crontab
crontab -e

# 添加以下任务
# 每天 2:00 备份数据库
0 2 * * * cd /path/to/ieclub-backend && npm run backup

# 每小时更新热度分数
0 * * * * cd /path/to/ieclub-backend && npm run update:hot-scores

# 每天 3:00 健康检查
0 3 * * * cd /path/to/ieclub-backend && npm run health

# 每周日 4:00 性能检查
0 4 * * 0 cd /path/to/ieclub-backend && npm run check:performance

# 每月1号 5:00 数据库优化
0 5 1 * * cd /path/to/ieclub-backend && npm run optimize:db
```

**Windows 任务计划程序**:
1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器（每天/每周/每月）
4. 操作: 启动程序
   - 程序: `C:\Program Files\nodejs\node.exe`
   - 参数: `scripts/health-check.js`
   - 起始位置: `C:\path\to\ieclub-backend`

---

### 故障排查

#### 数据库连接失败
```bash
# 1. 检查数据库服务
mysql -u root -p -e "SELECT 1"

# 2. 检查环境变量
node -e "console.log(process.env.DATABASE_URL)"

# 3. 运行健康检查
npm run health
```

#### 性能问题
```bash
# 1. 检查系统资源
npm run health

# 2. 查看性能指标
npm run check:performance

# 3. 优化数据库
npm run optimize:db

# 4. 更新热度分数
npm run update:hot-scores
```

#### 数据丢失
```bash
# 1. 列出可用备份
npm run backup:list

# 2. 恢复最近的备份
node scripts/backup-restore.js restore <备份文件名>
```

---

### 安全建议

1. **备份加密**: 生产环境的备份文件应加密存储
2. **权限控制**: 限制脚本执行权限，只允许管理员运行
3. **日志审计**: 记录所有脚本执行日志
4. **定期测试**: 定期测试备份恢复流程
5. **监控告警**: 配置监控系统，异常时发送告警

---

### 环境要求

- Node.js >= 18.0.0
- MySQL/MariaDB
- Redis (可选)
- 足够的磁盘空间（备份）

### 依赖项

所有脚本都使用项目已安装的依赖，无需额外安装。

---

## 📞 技术支持

如有问题，请：
1. 查看脚本输出的错误信息
2. 检查环境变量配置
3. 运行健康检查诊断问题
4. 查看 `logs/` 目录的日志文件

---

## 🔄 更新记录

- **2025-11-02**: 创建完整的工具脚本集合
  - 性能监控
  - 数据库优化
  - 备份恢复
  - 健康检查
  - 热度更新

---

## 📝 许可证

MIT License - 仅供 IEClub 项目内部使用

