# 🚨 IEClub 项目配置提醒

## ⚡ 紧急行动项目

请立即完成以下配置，否则项目无法正常运行：

### 1. 复制环境变量模板文件
```bash
# 根目录
cp .env.example .env

# 后端目录
cd ieclub-backend
cp .env.example .env
```

### 2. 填写核心配置（高优先级）

#### 数据库配置
```bash
DATABASE_URL="mysql://ieclub_user:你的数据库密码@127.0.0.1:3306/ieclub"
```

#### JWT 密钥配置
```bash
JWT_SECRET=生成一个至少32位的随机字符串
JWT_REFRESH_SECRET=生成另一个至少32位的随机字符串
```

#### 微信小程序配置
```bash
WECHAT_APPID=你的微信小程序APPID
WECHAT_SECRET=你的微信小程序SECRET
```

#### 阿里云 OSS 配置
```bash
OSS_ACCESS_KEY_ID=你的OSS访问密钥ID
OSS_ACCESS_KEY_SECRET=你的OSS访问密钥秘钥
OSS_BUCKET=你的OSS存储桶名称
OSS_ENDPOINT=你的OSS端点
OSS_CDN_DOMAIN=你的CDN域名（可选）
```

### 3. 生成安全的密钥

你可以使用以下命令生成随机密钥：

```bash
# 生成 JWT Secret（32位随机字符串）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或者使用 openssl
openssl rand -hex 32
```

### 4. 启动服务前检查清单

- [ ] 已创建 `.env` 文件
- [ ] 已填写数据库连接信息
- [ ] 已设置 JWT 密钥
- [ ] 已配置微信小程序凭证
- [ ] 已配置阿里云 OSS 凭证
- [ ] 已确保 `.env` 文件未被提交到 Git

### 5. 验证配置是否正确

```bash
# 后端服务启动测试
cd ieclub-backend
npm run dev

# 检查数据库连接
npm run prisma:studio

# 运行测试验证配置
npm run test
```

## 🔧 推荐配置（中优先级）

完成核心配置后，建议填写以下配置以增强功能：

### Redis 配置
```bash
REDIS_PASSWORD=你的Redis密码
```

### 邮件服务配置
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=你的邮箱密码
```

### 第三方登录配置
```bash
GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端秘钥
```

## 📊 监控配置（低优先级）

### Sentry 错误监控
```bash
SENTRY_DSN=你的Sentry DSN
```

## ⚠️ 重要安全提醒

1. **永远不要**将 `.env` 文件提交到 Git 仓库
2. **定期更换**敏感密钥，特别是生产环境
3. **使用强密码**，长度至少12位，包含字母、数字、特殊字符
4. **不同环境**使用不同的密钥
5. **备份密钥**但不要与代码放在一起

## 🚀 下一步

完成上述配置后，你就可以：

1. 启动后端服务：`npm run dev`
2. 启动前端开发：`npm run dev:weapp`
3. 部署到生产环境：`npm run build`

如果遇到任何配置问题，请查看 `敏感信息检查报告.md` 获取详细说明。