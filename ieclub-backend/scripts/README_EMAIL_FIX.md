# 邮件服务快速修复指南

## 🚀 快速修复（3步）

### 步骤1: 运行自动修复脚本

```powershell
cd ieclub-backend
.\scripts\fix-email-staging.ps1
```

### 步骤2: 运行诊断

```powershell
cd ieclub-backend
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js
```

### 步骤3: 重启服务

```powershell
pm2 restart ieclub-backend-staging
```

---

## 📧 配置 Gmail（推荐用于测试）

1. **生成应用专用密码**
   - 访问: https://myaccount.google.com/apppasswords
   - 选择"邮件"和"其他（自定义名称）"
   - 输入名称: `IEclub Staging`
   - 复制16位密码

2. **编辑 .env.staging**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_digit_app_password
EMAIL_FROM="IEClub Staging <your_email@gmail.com>"
```

3. **重启服务**

```powershell
pm2 restart ieclub-backend-staging
```

---

## 🔍 诊断问题

运行诊断脚本查看详细问题：

```powershell
cd ieclub-backend
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js
```

---

## 📚 详细文档

查看完整修复指南: `docs/debugging/EMAIL_SERVICE_FIX_STAGING.md`

