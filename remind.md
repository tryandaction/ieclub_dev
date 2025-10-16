# 🚀 IEclub 项目部署提醒清单

## ⚠️ 重要提醒

**在部署之前，请仔细阅读并完成以下所有配置步骤！**

---

## 🔧 第一阶段：基础配置（必须完成）

### 1. 环境变量配置

**位置**: `ieclub-backend/.env`

请填写以下配置项：

```env
# ==================== 基础配置 ====================
NODE_ENV=production
PORT=3000
API_VERSION=v1

# ==================== 数据库配置 ====================
DATABASE_URL="mysql://用户名:密码@数据库地址:端口/数据库名"

# ==================== Redis 配置 ====================
REDIS_HOST=你的Redis服务器地址
REDIS_PORT=6379
REDIS_PASSWORD=你的Redis密码（如果有）

# ==================== JWT 配置 ====================
JWT_SECRET=你的JWT密钥（至少32位随机字符串）
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=你的刷新令牌密钥（至少32位随机字符串）
JWT_REFRESH_EXPIRES_IN=30d

# ==================== 微信小程序配置 ====================
WECHAT_APPID=你的微信小程序AppID
WECHAT_SECRET=你的微信小程序Secret

# ==================== 阿里云 OSS 配置 ====================
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的阿里云AccessKeyID
OSS_ACCESS_KEY_SECRET=你的阿里云AccessKeySecret
OSS_BUCKET=你的OSS存储桶名称
OSS_ENDPOINT=你的OSS外网访问域名
OSS_CDN_DOMAIN=你的CDN加速域名（可选）

# ==================== 域名配置 ====================
FRONTEND_URL=https://ieclub.online
API_BASE_URL=https://api.ieclub.online

# ==================== 其他配置 ====================
# 内容安全检测（微信小程序）
WECHAT_CONTENT_CHECK=true

# 文件上传限制
MAX_IMAGE_SIZE=5242880
MAX_DOCUMENT_SIZE=20971520

# 缓存配置
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=3600
CACHE_TTL_LONG=86400
```

### 2. 小程序端环境配置

**位置**: `ieclub-taro/.env`

```env
# 小程序基本信息
MINI_PROGRAM_APPID=你的微信小程序AppID

# API 地址
API_BASE_URL=https://api.ieclub.online/api/v1

# 环境配置
NODE_ENV=production

# 其他小程序配置...
```

---

## 🌐 第二阶段：域名和服务器配置

### 3. 域名解析配置

你需要在域名服务商处配置：

```
# 主域名
ieclub.online → 你的服务器IP地址

# API 子域名
api.ieclub.online → 你的服务器IP地址

# 文件存储域名（如果使用CDN）
cdn.ieclub.online → 你的CDN地址或服务器IP
```

### 4. SSL 证书配置

**推荐使用 Let's Encrypt 免费证书：**

```bash
# 安装 certbot
sudo apt install certbot

# 生成证书（主域名）
sudo certbot certonly --webroot -w /var/www/html -d ieclub.online

# 生成证书（API域名）
sudo certbot certonly --webroot -w /var/www/html -d api.ieclub.online
```

### 5. Nginx 配置

**位置**: `/etc/nginx/sites-available/ieclub`

```nginx
# 主网站配置
server {
    listen 80;
    server_name ieclub.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ieclub.online;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ieclub.online/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 根目录（小程序前端）
    root /var/www/ieclub-frontend/dist;
    index index.html;

    # 前端路由处理
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API 单独配置
server {
    listen 443 ssl http2;
    server_name api.ieclub.online;

    ssl_certificate /etc/letsencrypt/live/api.ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ieclub.online/privkey.pem;

    # SSL 安全配置（同上）

    location / {
        proxy_pass http://localhost:3000;
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

---

## 🗄️ 第三阶段：数据库和基础设施

### 6. 数据库配置

**推荐使用云数据库：**

#### 阿里云 RDS MySQL
```sql
-- 创建数据库
CREATE DATABASE ieclub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'ieclub_user'@'%' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON ieclub.* TO 'ieclub_user'@'%';
FLUSH PRIVILEGES;
```

#### 本地数据库配置
```bash
# 安装 MySQL
sudo apt update
sudo apt install mysql-server

# 启动服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 设置 root 密码并创建数据库
sudo mysql_secure_installation
```

### 7. Redis 配置

**推荐使用云 Redis：**

#### 阿里云 Redis
- 在阿里云控制台购买 Redis 实例
- 记录连接地址、端口、密码

#### 本地 Redis 配置
```bash
# 安装 Redis
sudo apt install redis-server

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis

# 设置密码（可选）
sudo vim /etc/redis/redis.conf
# 找到 requirepass 行，取消注释并设置密码
```

---

## 🚀 第四阶段：部署操作

### 8. 后端部署

```bash
# 1. 克隆代码
cd /var/www
git clone 你的后端仓库地址 ieclub-backend
cd ieclub-backend

# 2. 安装依赖
npm install --production

# 3. 生成 Prisma Client
npx prisma generate

# 4. 运行数据库迁移
npx prisma migrate deploy

# 5. 构建前端静态文件（如果需要）
# npm run build

# 6. 启动服务（推荐使用 PM2）
npm install -g pm2
pm2 start src/server.js --name "ieclub-api"
pm2 startup
pm2 save

# 7. 配置 Nginx（参考上面的配置）
sudo ln -s /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. 小程序端部署

小程序端需要打包并上传到微信平台：

```bash
# 1. 安装依赖
cd ieclub-taro
npm install

# 2. 构建生产版本
npm run build --production

# 3. 上传到微信开发者工具
# - 在微信开发者工具中导入 dist 目录
# - 填写正确的 AppID 和服务器域名
# - 提交审核
```

---

## ⚙️ 第五阶段：小程序平台配置

### 10. 微信小程序管理后台配置

**登录 [微信小程序管理平台](https://mp.weixin.qq.com)**

#### 开发设置：
```
开发管理 → 开发设置 → 服务器域名

合法域名：
- request: https://api.ieclub.online
- upload: https://api.ieclub.online
- download: https://api.ieclub.online

业务域名：
- https://ieclub.online
```

#### 版本管理：
```
开发管理 → 开发版本 → 开发中

1. 填写版本号（如 1.0.0）
2. 上传小程序代码
3. 提交审核
```

---

## 🔍 第六阶段：测试验证

### 11. 部署验证清单

#### 网站访问测试：
- [ ] https://ieclub.online - 主网站能正常访问
- [ ] https://api.ieclub.online/api/v1/health - API 健康检查
- [ ] 网站功能正常（注册、登录、发帖等）

#### 小程序测试：
- [ ] 小程序能正常扫码登录
- [ ] 能正常调用 API 接口
- [ ] 文件上传功能正常
- [ ] 支付功能正常（如果有）

#### 域名验证：
- [ ] SSL 证书生效（浏览器显示安全锁图标）
- [ ] 域名解析正确
- [ ] CDN 加速正常（如果配置）

### 12. 常见问题排查

#### 如果网站无法访问：
1. 检查域名解析是否生效：`ping ieclub.online`
2. 检查 Nginx 配置：`sudo nginx -t`
3. 检查后端服务状态：`pm2 status`
4. 检查防火墙：`sudo ufw status`

#### 如果 API 调用失败：
1. 检查后端日志：`pm2 logs ieclub-api`
2. 检查数据库连接
3. 检查 Redis 连接
4. 确认环境变量配置正确

#### 如果小程序无法登录：
1. 检查微信小程序 AppID 和 Secret
2. 检查服务器域名配置
3. 检查 API 地址配置

---

## 📋 第七阶段：上线准备清单

### 必须完成的检查项：

- [ ] 域名 ieclub.online 能正常访问
- [ ] API 域名 api.ieclub.online 能正常访问
- [ ] SSL 证书配置正确
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] 文件上传功能正常
- [ ] 微信小程序能正常登录
- [ ] 小程序能正常调用 API
- [ ] 所有环境变量配置正确
- [ ] 日志系统正常工作
- [ ] 错误监控正常（Sentry等）

### 建议完成的优化项：

- [ ] 配置 CDN 加速
- [ ] 配置数据库备份
- [ ] 配置监控告警
- [ ] 配置日志轮转
- [ ] 性能优化（Redis缓存等）
- [ ] 安全加固（防火墙、入侵检测等）

---

## 🎯 最终部署命令

```bash
# 1. 停止开发服务
pm2 stop all
pm2 delete all

# 2. 拉取最新代码
cd /var/www/ieclub-backend
git pull origin main

# 3. 重新安装依赖
npm install --production

# 4. 更新数据库
npx prisma generate
npx prisma migrate deploy

# 5. 启动生产服务
pm2 start src/server.js --name "ieclub-api"
pm2 restart ieclub-api

# 6. 验证服务状态
pm2 status
curl https://api.ieclub.online/api/v1/health

# 7. 查看日志
pm2 logs ieclub-api --lines 50
```

---

## ⚠️ 重要提醒

1. **备份数据**: 在部署前务必备份数据库和重要文件
2. **测试环境**: 建议先在测试环境验证所有功能
3. **回滚计划**: 准备好回滚方案，以防部署失败
4. **监控告警**: 配置监控和告警，及时发现问题
5. **安全第一**: 生产环境要特别注意安全配置

---

**🎉 完成以上所有步骤后，你的 IEclub 项目就可以正式上线了！**

**访问地址：**
- 网站：https://ieclub.online
- API：https://api.ieclub.online/api/v1
- 小程序：微信搜索小程序名称

---

## 📞 需要帮助？

如果在部署过程中遇到问题，请：

1. 查看日志文件：`pm2 logs ieclub-api`
2. 检查配置文件：`cat ieclub-backend/.env`
3. 验证网络连接：`ping api.ieclub.online`
4. 联系技术支持

**祝部署顺利！🚀**