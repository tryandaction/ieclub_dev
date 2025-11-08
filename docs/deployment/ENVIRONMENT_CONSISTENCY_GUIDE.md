# 测试环境与生产环境一致性保证指南

**版本**: v1.0  
**创建日期**: 2025-11-08  
**目的**: 确保测试环境和生产环境完全一致，避免"测试通过但生产出错"的问题

---

## 🎯 核心原则

> **测试环境必须完全反映生产环境，只有域名和数据不同**

### 一致性要求

| 项目 | 测试环境 | 生产环境 | 一致性要求 |
|------|----------|----------|------------|
| **代码版本** | develop 分支 | main 分支 | ✅ 部署前同步 |
| **数据库 Schema** | 完全相同 | 完全相同 | ✅ 必须一致 |
| **Node 版本** | v18+ | v18+ | ✅ 必须一致 |
| **依赖版本** | package.json | package.json | ✅ 必须一致 |
| **环境变量** | .env.staging | .env.production | ⚠️ 值不同但结构相同 |
| **Nginx 配置** | 相似 | 相似 | ⚠️ 域名不同但逻辑相同 |
| **Redis 配置** | 相同 | 相同 | ✅ 必须一致 |
| **PM2 配置** | 相同 | 相同 | ✅ 必须一致 |

---

## 📋 环境对比清单

### 1. 域名和端口配置

| 服务 | 测试环境 | 生产环境 |
|------|----------|----------|
| 前端网页 | https://test.ieclub.online | https://ieclub.online |
| 后端 API | https://test.ieclub.online/api | https://ieclub.online/api |
| 后端端口 | 3001 | 3000 |
| 数据库 | ieclub_staging | ieclub |

### 2. 数据库配置

**测试环境** (`ieclub_staging`):
```env
DATABASE_URL="mysql://root:password@localhost:3306/ieclub_staging"
```

**生产环境** (`ieclub`):
```env
DATABASE_URL="mysql://root:password@localhost:3306/ieclub"
```

**一致性检查**:
```bash
# 比较表结构
ssh root@ieclub.online

# 测试环境表结构
mysqldump -u root -p --no-data ieclub_staging > /tmp/staging_schema.sql

# 生产环境表结构
mysqldump -u root -p --no-data ieclub > /tmp/production_schema.sql

# 对比差异（应该只有数据库名不同）
diff /tmp/staging_schema.sql /tmp/production_schema.sql
```

### 3. Redis 配置

**两个环境应该使用相同的配置**:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

**验证**:
```bash
# 测试环境
redis-cli -h localhost -p 6379 -a password ping

# 生产环境
redis-cli -h localhost -p 6379 -a password ping
```

### 4. Node.js 版本

**检查版本一致性**:
```bash
ssh root@ieclub.online

# 检查 Node 版本
node --version  # 应该是 v18.x 或 v20.x

# 检查 npm 版本
npm --version   # 应该是 8.x 或更高

# 检查全局安装的包
npm list -g --depth=0
```

---

## 🔍 一致性验证脚本

### 自动化验证脚本

创建 `scripts/health-check/Check-Environment-Consistency.ps1`:

```powershell
#!/usr/bin/env pwsh
# 环境一致性检查脚本

param(
    [string]$ServerHost = "ieclub.online"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  环境一致性检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 检查数据库 Schema
Write-Host "`n[1/6] 检查数据库 Schema..." -ForegroundColor Yellow
$stagingTables = ssh root@$ServerHost "mysql -u root -p -e 'SHOW TABLES FROM ieclub_staging;' | wc -l"
$productionTables = ssh root@$ServerHost "mysql -u root -p -e 'SHOW TABLES FROM ieclub;' | wc -l"

if ($stagingTables -eq $productionTables) {
    Write-Host "✅ 表数量一致: $stagingTables 个表" -ForegroundColor Green
} else {
    Write-Host "❌ 表数量不一致: 测试($stagingTables) vs 生产($productionTables)" -ForegroundColor Red
}

# 2. 检查 Node 版本
Write-Host "`n[2/6] 检查 Node 版本..." -ForegroundColor Yellow
$nodeVersion = ssh root@$ServerHost "node --version"
Write-Host "Node 版本: $nodeVersion" -ForegroundColor Cyan

# 3. 检查依赖版本
Write-Host "`n[3/6] 检查后端依赖..." -ForegroundColor Yellow
ssh root@$ServerHost "cd /root/IEclub_dev/ieclub-backend && npm list --depth=0 | head -20"

# 4. 检查服务状态
Write-Host "`n[4/6] 检查服务状态..." -ForegroundColor Yellow
ssh root@$ServerHost "pm2 status"

# 5. 检查 API 健康
Write-Host "`n[5/6] 检查 API 健康..." -ForegroundColor Yellow
$stagingHealth = Invoke-RestMethod -Uri "https://test.ieclub.online/api/health" -Method Get
$productionHealth = Invoke-RestMethod -Uri "https://ieclub.online/api/health" -Method Get

Write-Host "测试环境: $($stagingHealth.status) - v$($stagingHealth.version)" -ForegroundColor Cyan
Write-Host "生产环境: $($productionHealth.status) - v$($productionHealth.version)" -ForegroundColor Cyan

if ($stagingHealth.version -eq $productionHealth.version) {
    Write-Host "✅ 版本一致" -ForegroundColor Green
} else {
    Write-Host "⚠️  版本不一致" -ForegroundColor Yellow
}

# 6. 检查前端版本
Write-Host "`n[6/6] 检查前端部署..." -ForegroundColor Yellow
$stagingWeb = Invoke-WebRequest -Uri "https://test.ieclub.online" -Method Get -UseBasicParsing
$productionWeb = Invoke-WebRequest -Uri "https://ieclub.online" -Method Get -UseBasicParsing

Write-Host "测试环境: $($stagingWeb.StatusCode) - $($stagingWeb.Content.Length) bytes" -ForegroundColor Cyan
Write-Host "生产环境: $($productionWeb.StatusCode) - $($productionWeb.Content.Length) bytes" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  检查完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

---

## 🚀 部署流程保证一致性

### 标准部署流程

```mermaid
graph TD
    A[开发完成] --> B[提交到 develop 分支]
    B --> C[部署到测试环境]
    C --> D[测试验证]
    D --> E{测试通过?}
    E -->|否| F[修复问题]
    F --> B
    E -->|是| G[合并到 main 分支]
    G --> H[执行一致性检查]
    H --> I{一致性检查通过?}
    I -->|否| J[修复不一致问题]
    J --> H
    I -->|是| K[部署到生产环境]
    K --> L[生产验证]
    L --> M[部署完成]
```

### 部署前检查命令

```bash
# 1. 检查代码分支
git branch --show-current  # 应该是 main

# 2. 检查代码差异
git diff develop main  # 应该没有差异

# 3. 检查数据库迁移
cd ieclub-backend
npx prisma migrate status  # 测试和生产应该一致

# 4. 检查依赖
npm list --depth=0  # 确认关键依赖版本

# 5. 检查环境变量
cat .env | grep -v "PASSWORD\|SECRET\|KEY"  # 检查结构（不显示敏感信息）
```

---

## 🔧 保持一致性的最佳实践

### 1. 使用相同的部署脚本

**测试环境**: `Deploy-Staging.ps1`
**生产环境**: `Deploy-Production.ps1`

两个脚本应该有相同的逻辑，只是参数不同：

```powershell
# 共同的部署步骤
function Deploy-Backend {
    # 1. 拉取代码
    # 2. 安装依赖
    # 3. 执行数据库迁移
    # 4. 重新生成 Prisma Client
    # 5. 重启服务
}

# 测试环境
Deploy-Backend -Environment "staging" -Port 3001 -Database "ieclub_staging"

# 生产环境
Deploy-Backend -Environment "production" -Port 3000 -Database "ieclub"
```

### 2. 使用版本控制管理配置

**推荐结构**:
```
ieclub-backend/
├── .env.example          # 环境变量模板
├── .env.staging          # 测试环境配置（不提交到 Git）
├── .env.production       # 生产环境配置（不提交到 Git）
├── config/
│   ├── staging.js        # 测试环境特定配置
│   └── production.js     # 生产环境特定配置
```

### 3. 数据库迁移同步

**规则**:
- ✅ 所有迁移脚本必须先在测试环境验证
- ✅ 测试环境验证通过后，才能应用到生产环境
- ✅ 迁移脚本必须提交到 Git
- ✅ 迁移脚本必须包含回滚方案

**执行顺序**:
```bash
# 1. 在测试环境执行
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend
mysql -u root -p ieclub_staging < prisma/migrations/xxx/migration.sql

# 2. 验证测试环境
npm run test
curl https://test.ieclub.online/api/health

# 3. 在生产环境执行（相同的脚本）
mysql -u root -p ieclub < prisma/migrations/xxx/migration.sql

# 4. 验证生产环境
curl https://ieclub.online/api/health
```

### 4. 依赖版本锁定

**使用 package-lock.json**:
```bash
# 安装依赖时生成 lock 文件
npm install

# 提交 lock 文件到 Git
git add package-lock.json
git commit -m "Lock dependency versions"

# 部署时使用 ci 命令（严格按照 lock 文件安装）
npm ci
```

### 5. 环境变量验证

**创建验证脚本** `scripts/validate-env.js`:
```javascript
// 验证必需的环境变量
const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_HOST',
  'JWT_SECRET',
  'SENDGRID_API_KEY',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ 所有必需的环境变量都已设置');
```

---

## 📊 一致性监控

### 定期检查项目

**每周检查**:
- [ ] 数据库 Schema 一致性
- [ ] Node 和 npm 版本
- [ ] 关键依赖版本
- [ ] 服务运行状态

**每次部署前检查**:
- [ ] 代码分支同步
- [ ] 数据库迁移状态
- [ ] 环境变量完整性
- [ ] 依赖安装完整性

**每次部署后检查**:
- [ ] API 健康检查
- [ ] 前端访问正常
- [ ] 关键功能测试
- [ ] 错误日志监控

---

## 🐛 常见不一致问题和解决方案

### 问题 1: 数据库 Schema 不一致

**症状**: 测试环境正常，生产环境报错 "column does not exist"

**原因**: 迁移脚本未在生产环境执行

**解决方案**:
```bash
# 1. 检查迁移状态
npx prisma migrate status

# 2. 执行待执行的迁移
npx prisma migrate deploy

# 3. 重新生成 Prisma Client
npx prisma generate
```

### 问题 2: 依赖版本不一致

**症状**: 测试环境正常，生产环境出现运行时错误

**原因**: 生产环境使用了不同版本的依赖

**解决方案**:
```bash
# 1. 删除旧的 node_modules
rm -rf node_modules

# 2. 使用 lock 文件严格安装
npm ci

# 3. 验证关键依赖版本
npm list @prisma/client express ioredis
```

### 问题 3: 环境变量缺失

**症状**: 服务启动失败或功能异常

**原因**: .env 文件缺少必需的变量

**解决方案**:
```bash
# 1. 对比 .env.example
diff .env .env.example

# 2. 添加缺失的变量
nano .env

# 3. 重启服务
pm2 restart ieclub-backend
```

### 问题 4: Nginx 配置差异

**症状**: 路由不正常或静态资源加载失败

**原因**: Nginx 配置不一致

**解决方案**:
```bash
# 1. 对比配置文件
diff /etc/nginx/sites-available/test.ieclub.online /etc/nginx/sites-available/ieclub.online

# 2. 同步配置（注意域名差异）
nano /etc/nginx/sites-available/ieclub.online

# 3. 测试并重载
nginx -t
systemctl reload nginx
```

---

## ✅ 一致性验证检查表

### 部署前验证

- [ ] 代码分支已同步（develop → main）
- [ ] 数据库迁移脚本已在测试环境验证
- [ ] 依赖版本已锁定（package-lock.json）
- [ ] 环境变量结构一致
- [ ] Nginx 配置逻辑一致
- [ ] 部署脚本已更新

### 部署后验证

- [ ] 数据库 Schema 一致
- [ ] API 版本号一致
- [ ] 前端构建版本一致
- [ ] 服务运行状态正常
- [ ] 关键功能测试通过
- [ ] 无错误日志

---

## 📚 相关文档

- [部署前检查清单](./PRE_PRODUCTION_CHECKLIST.md)
- [Bug 修复报告](./BUG_FIXES_2025_11_08.md)
- [数据库迁移说明](../../ieclub-backend/prisma/migrations/20251108_add_profile_fields/README.md)
- [部署指南](./Deployment_guide.md)

---

**最后更新**: 2025-11-08  
**维护人员**: AI Assistant  
**版本**: v1.0

