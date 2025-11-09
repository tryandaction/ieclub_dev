# 测试环境邮件服务修复指南

**日期**: 2025-11-05  
**问题**: 测试环境收不到邮件

---

## 🔍 问题诊断

### 快速诊断

运行诊断脚本检查邮件服务状态：

```powershell
cd ieclub-backend
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js
```

### 常见问题

1. **邮件服务未配置**
   - `.env.staging` 文件不存在或配置不完整
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` 未设置

2. **邮件服务初始化失败**
   - SMTP 服务器连接失败
   - 用户名或密码错误
   - 网络连接问题
   - 防火墙阻止

3. **测试环境必须真实发送**
   - ✅ 测试环境（staging）和生产环境（production）行为一致
   - ✅ 必须配置真实的邮件服务，不能模拟发送
   - ✅ 只有开发环境（development）才允许模拟发送

---

## 🛠️ 修复步骤

### 方法1: 使用自动修复脚本（推荐）

```powershell
cd ieclub-backend
.\scripts\fix-email-staging.ps1
```

脚本会：
- ✅ 检查 `.env.staging` 文件
- ✅ 从模板创建配置文件（如果不存在）
- ✅ 引导配置 Gmail 或 SendGrid
- ✅ 运行诊断测试

### 方法2: 手动配置

#### 步骤1: 检查配置文件

```powershell
# 检查 .env.staging 是否存在
cd ieclub-backend
Test-Path .env.staging

# 如果不存在，从模板创建
Copy-Item env.staging.template .env.staging
```

#### 步骤2: 配置 Gmail SMTP（推荐用于测试）

1. **启用 Gmail 两步验证**
   - 访问: https://myaccount.google.com/security
   - 启用两步验证

2. **生成应用专用密码**
   - 访问: https://myaccount.google.com/apppasswords
   - 选择"邮件"和"其他（自定义名称）"
   - 输入名称（如：IEclub Staging）
   - 复制生成的16位密码

3. **编辑 .env.staging 文件**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_digit_app_password
EMAIL_FROM="IEClub Staging <your_email@gmail.com>"
```

#### 步骤3: 配置 SendGrid（推荐用于生产）

1. **创建 SendGrid 账号**
   - 访问: https://sendgrid.com
   - 注册并验证邮箱

2. **创建 API Key**
   - 访问: https://app.sendgrid.com/settings/api_keys
   - 创建 API Key（需要"Mail Send"权限）

3. **编辑 .env.staging 文件**

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM="IEClub Staging <verified_email@yourdomain.com>"
```

**注意**: SendGrid 需要验证发件人邮箱地址。

#### 步骤4: 验证配置

```powershell
cd ieclub-backend
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js
```

#### 步骤5: 重启服务

```powershell
# 如果使用 PM2
pm2 restart ieclub-backend-staging

# 或手动重启
cd ieclub-backend
npm run start:staging
```

---

## 🧪 测试邮件发送

### 方法1: 使用 API 测试

```powershell
# 发送验证码
$body = @{
    email = "test@example.com"
    type = "register"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://test.ieclub.online/api/auth/send-code" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### 方法2: 使用诊断脚本测试

```powershell
cd ieclub-backend
$env:NODE_ENV = "staging"
$env:TEST_EMAIL = "your_test_email@example.com"
node scripts/diagnose-email.js
```

---

## 📋 配置检查清单

- [ ] `.env.staging` 文件存在
- [ ] `EMAIL_HOST` 已设置（例如: `smtp.gmail.com`）
- [ ] `EMAIL_PORT` 已设置（例如: `587`）
- [ ] `EMAIL_USER` 已设置（您的邮箱地址）
- [ ] `EMAIL_PASSWORD` 已设置（密码或应用专用密码）
- [ ] `EMAIL_FROM` 已设置（发件人显示名称和邮箱）
- [ ] 邮件服务诊断通过
- [ ] 后端服务已重启
- [ ] 测试邮件发送成功

---

## 🔧 故障排除

### 问题1: "邮件服务未配置"

**原因**: `.env.staging` 文件不存在或配置不完整

**解决**:
```powershell
# 从模板创建
cd ieclub-backend
Copy-Item env.staging.template .env.staging

# 编辑配置
notepad .env.staging
```

### 问题2: "连接验证失败"

**可能原因**:
- SMTP 服务器地址错误
- 端口被防火墙阻止
- 用户名或密码错误
- 需要应用专用密码（Gmail）

**解决**:
1. 检查 SMTP 服务器地址和端口
2. 确认用户名和密码正确
3. 对于 Gmail，使用应用专用密码
4. 检查网络连接和防火墙设置

### 问题3: "邮件发送失败"

**可能原因**:
- 收件人邮箱地址无效
- 发件人邮箱未验证（SendGrid）
- 邮件内容格式错误
- 达到发送限制

**解决**:
1. 验证收件人邮箱地址格式
2. 确认发件人邮箱已验证（SendGrid）
3. 检查邮件内容格式
4. 查看邮件服务日志

### 问题4: 测试环境仍然模拟发送

**原因**: 代码中测试环境默认使用模拟模式

**解决**: 确保 `.env.staging` 中配置了完整的邮件服务信息，并且服务已重启。

---

## 📝 日志检查

查看邮件服务日志：

```powershell
# PM2 日志
pm2 logs ieclub-backend-staging --lines 50

# 或查看应用日志文件
Get-Content ieclub-backend/logs/app.log -Tail 50
```

查找关键词：
- `邮件服务已就绪` - 服务初始化成功
- `邮件服务连接验证失败` - 连接问题
- `邮件发送成功` - 发送成功
- `邮件发送失败` - 发送失败

---

## 🎯 快速修复命令

```powershell
# 一键修复（使用 Gmail）
cd ieclub-backend
.\scripts\fix-email-staging.ps1

# 诊断问题
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js

# 重启服务
pm2 restart ieclub-backend-staging
```

---

## 📚 相关文档

- [部署指南](../deployment/Deployment_guide.md)
- [环境配置](../configuration/README.md)
- [邮件服务代码](../../ieclub-backend/src/services/emailService.js)

---

**最后更新**: 2025-11-05

