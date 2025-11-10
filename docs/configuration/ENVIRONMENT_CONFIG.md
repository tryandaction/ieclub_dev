# 环境配置对照表

> 📋 **用途**: 快速查看三个环境的配置差异  
> 🎯 **目标**: 避免配置错误，确保部署正确  
> 📅 **更新日期**: 2025-11-05

---

## 📊 三环境概览

| 环境 | 域名 | 端口 | 数据库 | 用途 |
|------|------|------|--------|------|
| **开发环境** | localhost | 5173/3000 | ieclub | 本地开发 |
| **测试环境** | test.ieclub.online | 3001 | ieclub_staging | 内部测试 |
| **生产环境** | ieclub.online | 3000 | ieclub | 正式上线 |

---

## 🔧 后端配置对比

### 基础配置

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **NODE_ENV** | development | staging | production |
| **PORT** | 3000 | 3001 | 3000 |
| **DATABASE_URL** | mysql://...@localhost:3306/**ieclub** | mysql://...@localhost:3306/**ieclub_staging** | mysql://...@localhost:3306/**ieclub** |
| **REDIS_DB** | 0 | 1 | 0 |

### JWT 配置

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **JWT_SECRET** | dev_jwt_secret... | CHANGE_THIS_IN_SERVER | **必须修改为强密钥** ⚠️ |
| **JWT_REFRESH_SECRET** | dev_jwt_refresh... | CHANGE_THIS_IN_SERVER | **必须修改为强密钥** ⚠️ |
| **JWT_EXPIRES_IN** | 7d | 7d | 7d |
| **JWT_REFRESH_EXPIRES_IN** | 30d | 30d | 30d |

⚠️ **安全提醒**: 
- 开发环境可以使用默认密钥
- 测试和生产环境**必须**使用不同的强随机密钥
- 密钥长度至少 32 位

### CORS 配置

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **CORS_ORIGIN** | http://localhost:5173,<br>http://localhost:3000 | http://localhost:5173,<br>https://test.ieclub.online | https://ieclub.online |

⚠️ **重要**: 
- 生产环境**不应该**包含 localhost
- 生产环境**不应该**包含 test 子域名
- 必须使用 HTTPS（本地除外）

### 邮件配置

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **EMAIL_HOST** | smtp.gmail.com | smtp.gmail.com | smtp.gmail.com |
| **EMAIL_PORT** | 587 | 587 | 587 |
| **EMAIL_USER** | 可留空 | **必须配置** ⚠️ | **必须配置** ⚠️ |
| **EMAIL_PASSWORD** | 可留空 | **必须配置** ⚠️ | **必须配置** ⚠️ |
| **行为** | 模拟发送（未配置时） | **真实发送** | **真实发送** |

⚠️ **邮件服务行为差异**:
```javascript
// 开发环境：邮件未配置时（允许模拟）
return { 
  success: true,  // 返回成功
  mock: true,     // 标记为模拟
  env: 'development' 
}

// 测试环境/生产环境：邮件未配置时（必须真实发送）
return { 
  success: false, // 返回失败 ⚠️
  error: '邮件服务未配置或初始化失败',
  message: '请配置邮件服务'
}
```

✅ **重要说明**：
- **测试环境（staging）和生产环境（production）行为完全一致**
- 两者都必须配置真实的邮件服务，不能模拟发送
- 只有开发环境（development）允许模拟发送，用于本地开发测试
- 这确保了测试环境能真实验证邮件发送功能，避免生产环境出现问题

### 微信小程序配置

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| **WECHAT_APPID** | 可留空 | your_wechat_appid | **必须配置** |
| **WECHAT_SECRET** | 可留空 | your_wechat_secret | **必须配置** |

---

## 🌐 前端配置对比 (Web)

### ieclub-web 配置

| 配置项 | 开发环境<br>`.env.development` | 测试环境<br>`.env.staging` | 生产环境<br>`.env.production` |
|--------|---------|---------|---------|
| **VITE_API_BASE_URL** | http://localhost:3000/api | https://test.ieclub.online/api | https://ieclub.online/api |
| **VITE_APP_ENV** | development | staging | production |

### 配置文件位置

```
ieclub-web/
├── .env.development      # 本地开发（手动创建）
├── .env.staging          # 测试环境（部署脚本自动创建）
├── .env.production       # 生产环境（部署脚本自动创建）
├── env.staging.template  # 测试环境模板 ✅
└── env.production.template # 生产环境模板 ✅
```

---

## 📱 前端配置对比 (微信小程序)

### ieclub-frontend/app.js

| 环境 | apiBase 配置 | 说明 |
|------|------------|------|
| **开发调试** | `'http://localhost:3000/api'` | 使用本地后端 |
| **测试版本** | `'https://test.ieclub.online/api'` | 使用测试环境后端 |
| **生产版本** | `'https://ieclub.online/api'` | 使用生产环境后端 |

⚠️ **微信小程序特别注意**:
1. 必须在微信公众平台配置服务器域名
2. 必须使用 HTTPS（localhost 除外）
3. 不同版本需要手动修改 `app.js` 中的 `apiBase`

### 微信公众平台配置

**开发调试**:
- 勾选"不校验合法域名"

**测试环境**:
```
request合法域名:
  https://test.ieclub.online

uploadFile合法域名:
  https://test.ieclub.online

downloadFile合法域名:
  https://test.ieclub.online
```

**生产环境**:
```
request合法域名:
  https://ieclub.online

uploadFile合法域名:
  https://ieclub.online

downloadFile合法域名:
  https://ieclub.online
```

---

## 🔀 Nginx 配置对比

### 生产环境

```nginx
server {
    server_name ieclub.online;
    
    location /api {
        proxy_pass http://localhost:3000;  # 端口 3000
    }
    
    location / {
        root /root/IEclub_dev/ieclub-web/dist;
    }
}
```

### 测试环境

```nginx
server {
    server_name test.ieclub.online;
    
    location /api {
        proxy_pass http://localhost:3001;  # 端口 3001
    }
    
    location / {
        root /root/IEclub_dev_staging/ieclub-web/dist;
    }
}
```

---

## 🚀 PM2 配置对比

### 生产环境

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ieclub-backend',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 测试环境

```javascript
// ecosystem.staging.config.js
module.exports = {
  apps: [{
    name: 'ieclub-backend-staging',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    }
  }]
}
```

---

## 📂 服务器目录结构

```
/root/
├── IEclub_dev/                    # 生产环境
│   ├── ieclub-backend/
│   │   └── .env (PORT=3000)
│   └── ieclub-web/
│       └── dist/
│
└── IEclub_dev_staging/            # 测试环境
    ├── ieclub-backend/
    │   └── .env (PORT=3001)
    └── ieclub-web/
        └── dist/
```

---

## ✅ 配置检查清单

### 开发环境

- [ ] `.env.development` 已创建
- [ ] API 地址指向 `http://localhost:3000/api`
- [ ] 后端端口设置为 `3000`
- [ ] 可以直接运行 `npm run dev`

### 测试环境

- [ ] `NODE_ENV=staging`
- [ ] `PORT=3001`
- [ ] 数据库是 `ieclub_staging`
- [ ] CORS 包含 `https://test.ieclub.online`
- [ ] PM2 进程名是 `ieclub-backend-staging`

### 生产环境

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] 数据库是 `ieclub`
- [ ] JWT密钥已修改为强随机字符串
- [ ] CORS **仅**包含 `https://ieclub.online`
- [ ] 邮件服务已配置
- [ ] 微信小程序配置已填写
- [ ] PM2 进程名是 `ieclub-backend`

---

## 🔧 配置文件模板

### 后端 .env 模板

```bash
# 快速生成配置
ssh root@ieclub.online

# 生产环境
cd /root/IEclub_dev/ieclub-backend
cp env.production.template .env
nano .env  # 修改密钥和密码

# 测试环境
cd /root/IEclub_dev_staging/ieclub-backend
cp env.staging.template .env
nano .env  # 修改密钥和密码
```

### 前端配置模板

```bash
# 部署脚本会自动处理
# 从 env.production.template 创建 .env.production
# 从 env.staging.template 创建 .env.staging
```

---

## 🚨 常见配置错误

### 错误 1: 生产环境使用测试数据库

❌ **错误配置**:
```env
# 生产环境的 .env
NODE_ENV=production
DATABASE_URL=mysql://...@localhost:3306/ieclub_staging  # ❌ 错误！
```

✅ **正确配置**:
```env
# 生产环境的 .env
NODE_ENV=production
DATABASE_URL=mysql://...@localhost:3306/ieclub  # ✅ 正确
```

### 错误 2: 生产环境 CORS 包含测试域名

❌ **错误配置**:
```env
# 生产环境的 .env
CORS_ORIGIN=https://ieclub.online,https://test.ieclub.online  # ❌
```

✅ **正确配置**:
```env
# 生产环境的 .env
CORS_ORIGIN=https://ieclub.online  # ✅
```

### 错误 3: 端口冲突

❌ **错误场景**:
```env
# 测试环境使用 3000 端口
PORT=3000  # ❌ 与生产环境冲突！
```

✅ **正确配置**:
```env
# 生产环境
PORT=3000

# 测试环境
PORT=3001  # ✅ 使用不同端口
```

### 错误 4: 微信小程序 API 配置错误

❌ **错误配置**:
```javascript
// ieclub-frontend/app.js
globalData: {
  apiBase: 'http://ieclub.online/api'  // ❌ 使用 HTTP
}
```

✅ **正确配置**:
```javascript
// ieclub-frontend/app.js
globalData: {
  apiBase: 'https://ieclub.online/api'  // ✅ 使用 HTTPS
}
```

---

## 📚 相关文档

- [部署指南](../deployment/Deployment_guide.md)
- [生产环境检查清单](../deployment/PRE_PRODUCTION_CHECKLIST.md)
- [邮件服务配置指南](./EMAIL_SETUP_GUIDE.md)
- [环境变量配置说明](./ENVIRONMENT_VARIABLES.md)
- [安全配置指南](./SECURITY_GUIDE.md)

---

## 🔄 配置更新记录

| 日期 | 更新内容 |
|------|---------|
| 2025-11-05 | 创建环境配置对照表 |
| 2025-11-05 | 添加邮件服务行为差异说明 |
| 2025-11-05 | 添加微信小程序配置说明 |

---

**维护人**: 开发团队  
**最后更新**: 2025-11-05

