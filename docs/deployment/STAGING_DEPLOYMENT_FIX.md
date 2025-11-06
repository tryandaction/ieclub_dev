# 测试环境部署失败问题诊断与修复

## 问题现象

```
PM2进程状态: ↺ 42 (不断重启)
健康检查: 404 Not Found
日志: 空（服务启动即崩溃）
```

## 根本原因

**服务器上缺少 `.env.staging` 配置文件！**

### 问题分析

1. **部署脚本逻辑：**
   - 本地打包时**不包含** `.env.staging`（避免覆盖服务器配置）
   - 服务器端部署脚本检查 `.env.staging` 是否存在
   - 如果不存在，应该报错退出，但检查逻辑有问题

2. **实际情况：**
   - 服务器上 `/root/IEclub_dev_staging/ieclub-backend/.env.staging` 不存在
   - Node.js 启动时无法加载环境变量
   - `config.port` 等配置为 `undefined`
   - 服务启动失败，PM2 不断重启

3. **为什么日志为空：**
   - 服务在初始化阶段就崩溃
   - 还没来得及写入日志就退出了

## 详细诊断步骤

### 1. 检查服务器配置文件

```bash
# SSH登录服务器
ssh root@ieclub.online

# 检查配置文件是否存在
ls -la /root/IEclub_dev_staging/ieclub-backend/.env.staging

# 如果不存在，会显示: No such file or directory
```

### 2. 检查PM2日志

```bash
# 查看PM2进程状态
pm2 status

# 查看详细日志（会看到启动错误）
pm2 logs staging-backend --lines 100

# 可能的错误信息：
# - TypeError: Cannot read property 'port' of undefined
# - Error: Missing required environment variables
# - Database connection failed
```

### 3. 检查端口占用

```bash
# 测试环境应该监听 3001 端口
netstat -tlnp | grep 3001

# 如果没有输出，说明服务没有成功启动
```

### 4. 手动测试启动

```bash
cd /root/IEclub_dev_staging/ieclub-backend

# 尝试手动启动（会立即看到错误）
node src/server-staging.js

# 预期错误：
# - 找不到 .env.staging 文件
# - 环境变量未定义
```

## 修复方案

### 方案一：使用自动修复脚本（推荐）

```powershell
# 在本地项目目录执行
cd C:\universe\GitHub_try\IEclub_dev

# 运行修复脚本
.\scripts\deployment\Fix-Staging-Env.ps1

# 脚本会自动：
# 1. 上传 env.staging.template 到服务器
# 2. 从生产环境复制敏感配置（数据库密码、JWT密钥等）
# 3. 创建测试数据库 ieclub_staging
# 4. 生成 .env.staging 文件
```

### 方案二：手动修复

#### 步骤1：在服务器上创建配置文件

```bash
# SSH登录服务器
ssh root@ieclub.online

# 进入测试环境目录
cd /root/IEclub_dev_staging/ieclub-backend

# 从生产环境复制配置模板
cp /root/IEclub_dev/ieclub-backend/.env .env.staging

# 修改配置
vi .env.staging
```

#### 步骤2：修改关键配置

```bash
# 修改以下配置项：

# 1. 环境和端口
NODE_ENV=staging
PORT=3001

# 2. 数据库（使用测试数据库）
DATABASE_URL="mysql://ieclub_user:your_password@localhost:3306/ieclub_staging"

# 3. Redis（使用不同的DB）
REDIS_DB=1

# 4. CORS（添加测试域名）
CORS_ORIGIN=http://localhost:5173,https://test.ieclub.online

# 5. JWT密钥（可以和生产环境相同，或添加后缀区分）
JWT_SECRET=your_jwt_secret_staging
JWT_REFRESH_SECRET=your_jwt_refresh_secret_staging

# 6. 日志级别（测试环境用debug）
LOG_LEVEL=debug
```

#### 步骤3：创建测试数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建测试数据库
CREATE DATABASE IF NOT EXISTS ieclub_staging 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

# 授权（如果需要）
GRANT ALL PRIVILEGES ON ieclub_staging.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
exit
```

#### 步骤4：运行数据库迁移

```bash
cd /root/IEclub_dev_staging/ieclub-backend

# 运行迁移
npx prisma migrate deploy

# 生成Prisma客户端
npx prisma generate
```

#### 步骤5：重启服务

```bash
# 重启测试环境后端
pm2 restart staging-backend

# 查看日志
pm2 logs staging-backend

# 应该看到成功启动的日志：
# ✅ 数据库连接成功
# ✅ Redis 连接成功
# ✅ HTTP 服务器已启动
# 🔗 API 地址: http://localhost:3001/api
```

#### 步骤6：验证服务

```bash
# 本地健康检查
curl http://localhost:3001/health

# 应该返回：
# {"status":"ok","timestamp":"..."}

# 检查PM2状态
pm2 status

# staging-backend 应该显示：
# status: online
# restarts: 0 (不再重启)
```

### 方案三：从零开始重新部署

如果上述方案都不行，可以清理后重新部署：

```bash
# 在服务器上
ssh root@ieclub.online

# 1. 停止并删除测试环境进程
pm2 delete staging-backend

# 2. 删除测试环境目录
rm -rf /root/IEclub_dev_staging

# 3. 在本地重新部署
cd C:\universe\GitHub_try\IEclub_dev

# 4. 先修复配置
.\scripts\deployment\Fix-Staging-Env.ps1

# 5. 重新部署
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "重新部署"
```

## 验证修复

### 1. 检查PM2状态

```bash
pm2 status

# 期望输出：
# ┌────┬────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
# │ id │ name               │ mode    │ pid     │ uptime   │ ↺      │ status│ cpu      │
# ├────┼────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
# │ 2  │ staging-backend    │ fork    │ 123456  │ 5m       │ 0      │ online│ 0%       │
# └────┴────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
#
# 关键指标：
# - status: online ✅
# - ↺ (restarts): 0 ✅
# - uptime: 持续增长 ✅
```

### 2. 健康检查

```bash
# 服务器本地检查
curl http://localhost:3001/health

# 外部检查（在本地PowerShell执行）
Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -Method GET
```

### 3. 查看日志

```bash
pm2 logs staging-backend --lines 50

# 应该看到：
# ✅ 测试环境启动完成！
# 🔗 API 地址: http://localhost:3001/api
# 💊 健康检查: http://localhost:3001/health
```

### 4. 测试API

```powershell
# 在本地PowerShell测试
$headers = @{"Content-Type"="application/json"}
$body = @{
    email = "test@example.com"
    password = "Test123456"
    nickname = "测试用户"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://test.ieclub.online/api/auth/register" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## 预防措施

### 1. 改进部署脚本

在 `Deploy-Staging.ps1` 中添加更严格的检查：

```powershell
# 在部署前检查服务器配置
$envCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "test -f /root/IEclub_dev_staging/ieclub-backend/.env.staging && echo 'exists' || echo 'missing'"

if ($envCheck -match "missing") {
    Write-Warning ".env.staging 文件不存在！"
    Write-Info "正在自动创建配置文件..."
    
    # 调用修复脚本
    & "$PSScriptRoot\Fix-Staging-Env.ps1"
}
```

### 2. 添加配置文件模板检查

```bash
# 在服务器端部署脚本中
if [ ! -f .env.staging ]; then
    echo "❌ 错误: .env.staging 文件不存在！"
    echo ""
    echo "请执行以下步骤："
    echo "  1. 在本地运行: .\scripts\deployment\Fix-Staging-Env.ps1"
    echo "  2. 或手动创建: cp env.staging.template .env.staging"
    echo ""
    exit 1
fi
```

### 3. 添加启动前检查

在 `server-staging.js` 中添加：

```javascript
// 检查必需的环境变量
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('');
  console.error('💡 请检查 .env.staging 文件是否存在并包含所有必需配置');
  process.exit(1);
}
```

## 常见问题

### Q1: 为什么不在打包时包含 .env.staging？

**A:** 因为：
1. 敏感信息不应该提交到Git
2. 每个服务器的配置可能不同
3. 避免本地配置覆盖服务器配置

### Q2: 测试数据库和生产数据库可以共用吗？

**A:** 强烈不建议！原因：
1. 测试可能产生脏数据
2. 测试失败可能影响生产数据
3. 无法独立测试数据库迁移

### Q3: 如何同步生产数据到测试环境？

```bash
# 在服务器上
# 1. 导出生产数据（排除敏感信息）
mysqldump -u ieclub_user -p ieclub \
  --ignore-table=ieclub.users \
  --ignore-table=ieclub.sessions \
  > /tmp/prod_data.sql

# 2. 导入到测试数据库
mysql -u ieclub_user -p ieclub_staging < /tmp/prod_data.sql

# 3. 清理
rm /tmp/prod_data.sql
```

### Q4: PM2重启次数过多怎么办？

```bash
# 1. 停止进程
pm2 stop staging-backend

# 2. 清除重启计数
pm2 reset staging-backend

# 3. 修复问题后重启
pm2 start staging-backend
```

## 总结

**核心问题：** 服务器缺少 `.env.staging` 配置文件

**快速修复：**
```powershell
.\scripts\deployment\Fix-Staging-Env.ps1
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
```

**验证成功标志：**
- ✅ PM2状态为 `online`
- ✅ 重启次数为 `0`
- ✅ 健康检查返回 `200 OK`
- ✅ 日志显示启动成功

