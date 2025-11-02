# 🚀 IEClub 完整部署指南

## 📋 目录

- [环境说明](#环境说明)
- [快速开始](#快速开始)
- [测试环境部署](#测试环境部署)
- [生产环境部署](#生产环境部署)
- [服务器配置](#服务器配置)
- [故障排查](#故障排查)

---

## 🌐 环境说明

IEClub 项目支持两套独立的部署环境：

### 1. 测试环境 (Staging)

**用途**：内部开发和测试，不影响线上用户

- **前端地址**：https://test.ieclub.online
- **后端地址**：https://test.ieclub.online/api
- **后端端口**：3001
- **数据库**：ieclub_staging（独立测试数据库）
- **Redis DB**：1
- **部署脚本**：`Deploy-Staging.ps1`

**特点**：
- 使用独立的测试数据库
- 日志级别：debug（详细日志）
- 限流更宽松（200次/15分钟）
- 不发送告警通知
- 页面标题显示"测试版"

### 2. 生产环境 (Production)

**用途**：正式发布，所有用户可见

- **前端地址**：https://ieclub.online
- **后端地址**：https://ieclub.online/api
- **后端端口**：3000
- **数据库**：ieclub（生产数据库）
- **Redis DB**：0
- **部署脚本**：`Deploy-Production.ps1`

**特点**：
- 使用生产数据库
- 日志级别：info（关键日志）
- 标准限流（100次/15分钟）
- 启用告警通知
- 需要强密钥和SSL证书

---

## 🚀 快速开始

### 部署流程

```
开发 → 测试环境验证 → 生产环境发布
```

### 1. 测试环境部署（内部测试）

```powershell
# 部署全部（前端 + 后端）
.\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 仅部署前端
.\Deploy-Staging.ps1 -Target web

# 仅部署后端
.\Deploy-Staging.ps1 -Target backend
```

### 2. 生产环境部署（正式发布）

```powershell
# 部署全部（前端 + 后端 + 小程序提示）
.\Deploy-Production.ps1 -Target all -Message "v1.2.0 正式发布"

# 仅部署前端
.\Deploy-Production.ps1 -Target web

# 仅部署后端
.\Deploy-Production.ps1 -Target backend

# 小程序发布提示
.\Deploy-Production.ps1 -Target weapp
```

---

## 🧪 测试环境部署

### 前置条件

1. 已配置好服务器环境
2. 存在 `.env.staging` 配置文件
3. 服务器上已创建测试数据库 `ieclub_staging`

### 配置文件

#### 前端配置：`ieclub-web/.env.staging`

```env
VITE_API_BASE_URL=https://test.ieclub.online/api
VITE_WS_URL=wss://test.ieclub.online
VITE_APP_ENV=staging
VITE_APP_TITLE=IEClub (测试版)
```

#### 后端配置：`ieclub-backend/.env.staging`

```env
NODE_ENV=staging
PORT=3001
DATABASE_URL=mysql://ieclub_user:password@localhost:3306/ieclub_staging
REDIS_DB=1
LOG_LEVEL=debug
CORS_ORIGIN=https://test.ieclub.online,http://localhost:5173
```

### 部署步骤

```powershell
# 1. 部署到测试环境
.\Deploy-Staging.ps1 -Target all -Message "测试版本 v1.2.0-beta"

# 2. 等待部署完成

# 3. 验证部署
# 访问 https://test.ieclub.online
# 检查 API：https://test.ieclub.online/api/health

# 4. 进行功能测试
# - 测试新功能
# - 检查 bug 修复
# - 验证性能

# 5. 确认无误后，准备发布到生产环境
```

### 服务器配置

测试环境在服务器上的目录结构：

```
/root/IEclub_dev_staging/
├── ieclub-backend/          # 测试环境后端
│   ├── .env                 # 测试环境配置
│   └── ...
└── ...

/var/www/test.ieclub.online/ # 测试环境前端
└── ...
```

---

## 🚀 生产环境部署

### 前置条件

1. ✅ 已在测试环境验证通过
2. ✅ 代码已合并到 main/master 分支
3. ✅ 所有测试通过
4. ✅ 已备份生产数据库
5. ✅ 已配置生产环境密钥

### 配置文件

#### 前端配置：`ieclub-web/.env.production`

```env
VITE_API_BASE_URL=https://ieclub.online/api
VITE_WS_URL=wss://ieclub.online
VITE_APP_ENV=production
VITE_APP_TITLE=IEClub
```

#### 后端配置：`ieclub-backend/.env.production`

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://ieclub_user:strong_password@localhost:3306/ieclub
REDIS_DB=0
LOG_LEVEL=info

# 生产环境必须修改以下密钥！
JWT_SECRET=your-production-secret-key-min-32-chars-CHANGE-THIS
JWT_REFRESH_SECRET=your-production-refresh-secret-key-min-32-chars-CHANGE-THIS
SESSION_SECRET=your-production-session-key-min-32-chars-CHANGE-THIS

CORS_ORIGIN=https://ieclub.online,https://www.ieclub.online
ENABLE_ALERTS=true
```

### 部署步骤

```powershell
# 1. 部署前检查
.\Deploy-Production.ps1 -Target all -Message "v1.2.0 正式发布"
# 脚本会自动检查：
# - 是否在 main 分支
# - 是否有未提交的更改
# - 配置文件是否存在

# 2. 确认部署
# 输入 'YES' 确认部署到生产环境

# 3. 等待部署完成
# - 自动备份当前版本
# - 上传新代码
# - 运行数据库迁移
# - 重启服务

# 4. 自动验证
# 脚本会自动验证：
# - 前端是否可访问
# - API 是否正常

# 5. 小程序发布（如果需要）
# 按照提示使用微信开发者工具上传
```

### 小程序发布

小程序需要单独上传到微信平台：

```powershell
# 1. 准备小程序代码
.\Deploy-Production.ps1 -Target weapp

# 2. 使用微信开发者工具
# - 打开项目：ieclub-frontend/
# - 点击"上传"
# - 填写版本号和备注
# - 提交审核

# 3. 在微信公众平台
# - 登录：https://mp.weixin.qq.com
# - 进入"版本管理"
# - 提交审核
# - 审核通过后发布
```

### 服务器配置

生产环境在服务器上的目录结构：

```
/root/IEclub_dev/
├── ieclub-backend/          # 生产环境后端
│   ├── .env                 # 生产环境配置
│   └── ...
└── ...

/var/www/ieclub.online/      # 生产环境前端
└── ...
```

---

## 🖥️ 服务器配置

### Nginx 配置

需要配置两个域名：

#### 1. 测试环境：test.ieclub.online

```nginx
server {
    listen 443 ssl http2;
    server_name test.ieclub.online;
    
    ssl_certificate /etc/letsencrypt/live/test.ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.ieclub.online/privkey.pem;
    
    root /var/www/test.ieclub.online;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. 生产环境：ieclub.online

```nginx
server {
    listen 443 ssl http2;
    server_name ieclub.online www.ieclub.online;
    
    ssl_certificate /etc/letsencrypt/live/ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ieclub.online/privkey.pem;
    
    root /var/www/ieclub.online;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 进程管理

两个环境使用不同的 PM2 进程：

```bash
# 查看所有进程
pm2 status

# 应该看到：
# ieclub-backend-staging (端口 3001) - 测试环境
# ieclub-backend         (端口 3000) - 生产环境

# 重启测试环境
pm2 restart ieclub-backend-staging

# 重启生产环境
pm2 restart ieclub-backend

# 查看日志
pm2 logs ieclub-backend-staging
pm2 logs ieclub-backend
```

### 数据库配置

创建两个独立的数据库：

```sql
-- 生产数据库
CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 测试数据库
CREATE DATABASE ieclub_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 授权
GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'localhost';
GRANT ALL PRIVILEGES ON ieclub_staging.* TO 'ieclub_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🔍 故障排查

### 测试环境问题

#### 前端无法访问

```bash
# 1. 检查 Nginx 配置
sudo nginx -t
sudo systemctl status nginx

# 2. 检查文件权限
ls -la /var/www/test.ieclub.online

# 3. 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

#### 后端 API 错误

```bash
# 1. 检查测试环境后端服务
pm2 status ieclub-backend-staging

# 2. 查看日志
pm2 logs ieclub-backend-staging

# 3. 检查端口
netstat -tlnp | grep 3001

# 4. 测试本地 API
curl http://localhost:3001/api/health
```

### 生产环境问题

#### 紧急回滚

```bash
# 1. 回滚前端
cd /var/www
ls -la | grep ieclub.online.backup
# 找到最近的备份，例如 ieclub.online.backup.20250102_120000
rm -rf ieclub.online
mv ieclub.online.backup.20250102_120000 ieclub.online

# 2. 回滚后端
cd /root/IEclub_dev/ieclub-backend
tar -xzf backup_20250102_120000.tar.gz
pm2 restart ieclub-backend
```

#### 数据库连接失败

```bash
# 1. 检查数据库服务
systemctl status mysql
# 或 Docker
docker-compose ps mysql

# 2. 测试连接
mysql -u ieclub_user -p ieclub

# 3. 检查配置
cd /root/IEclub_dev/ieclub-backend
cat .env | grep DATABASE_URL
```

### 常见错误

#### 1. 端口冲突

```bash
# 查看端口占用
netstat -tlnp | grep -E ':(3000|3001)'

# 杀死占用进程
kill -9 <PID>
```

#### 2. 权限问题

```bash
# 修复前端文件权限
sudo chown -R www-data:www-data /var/www/ieclub.online
sudo chmod -R 755 /var/www/ieclub.online

# 修复后端文件权限
sudo chown -R $USER:$USER /root/IEclub_dev
```

#### 3. SSL 证书过期

```bash
# 检查证书
sudo certbot certificates

# 手动续期
sudo certbot renew

# 重启 Nginx
sudo systemctl reload nginx
```

---

## 📊 部署检查清单

### 测试环境部署检查

- [ ] 代码已提交到 staging/develop 分支
- [ ] `.env.staging` 配置正确
- [ ] 测试数据库已创建
- [ ] 执行 `Deploy-Staging.ps1`
- [ ] 访问 https://test.ieclub.online 正常
- [ ] API 健康检查通过
- [ ] 功能测试通过

### 生产环境部署检查

- [ ] 测试环境验证通过
- [ ] 代码已合并到 main 分支
- [ ] `.env.production` 配置正确
- [ ] 生产密钥已更新
- [ ] 生产数据库已备份
- [ ] 执行 `Deploy-Production.ps1`
- [ ] 输入 'YES' 确认部署
- [ ] 访问 https://ieclub.online 正常
- [ ] API 健康检查通过
- [ ] 用户功能正常
- [ ] 监控告警正常

---

## 📞 支持

如有问题，请查看：
- 项目文档：`REMIND.md`
- API 文档：`docs/API_Reference.md`
- 架构文档：`docs/development/Project_Architecture.md`

---

**记住：先测试，后发布！** 🎯

