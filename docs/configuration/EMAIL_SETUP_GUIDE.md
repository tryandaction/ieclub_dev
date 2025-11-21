# 邮件服务配置指南

## 🔒 安全说明

**重要提示**：
- ✅ `.env` 文件已在 `.gitignore` 中，**不会被提交到 Git**
- ✅ 你的密码只会保存在本地的 `.env` 文件中
- ✅ 只有你自己能看到 `.env` 文件的内容
- ⚠️  永远不要将包含真实密码的文件提交到 Git

## 📧 支持的邮箱服务商

本系统支持以下邮箱服务商：
- QQ 邮箱
- 学校邮箱（各大学邮箱）
- Gmail
- 其他支持 SMTP 的邮箱服务

## 🚀 快速配置步骤

### 1. 创建环境变量文件

```bash
# 进入后端目录
cd ieclub-backend

# 复制模板文件
cp .env.example .env

# 编辑 .env 文件，填入你的邮箱配置
# Windows: notepad .env
# Linux/Mac: nano .env
```

### 2. 配置邮箱信息

根据你使用的邮箱类型，选择对应的配置方式：

---

## 📮 QQ 邮箱配置

### 步骤 1: 开启 SMTP 服务

1. 登录 QQ 邮箱：https://mail.qq.com
2. 点击 **设置** → **账户**
3. 找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务**
4. 开启 **POP3/SMTP服务** 或 **IMAP/SMTP服务**
5. 按照提示发送短信验证
6. 获取 **授权码**（16位字符，不是QQ密码！）

### 步骤 2: 配置环境变量

在 `ieclub-backend/.env` 文件中配置：

```env
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_qq_number@qq.com
EMAIL_PASSWORD=你的QQ邮箱授权码（16位）
EMAIL_FROM="IEClub <your_qq_number@qq.com>"
```

**重要提示**：
- `EMAIL_USER` 填写你的完整QQ邮箱地址
- `EMAIL_PASSWORD` 填写**授权码**，不是QQ密码
- 授权码是16位字符，格式类似：`abcdefghijklmnop`

### 步骤 3: 测试配置

```bash
cd ieclub-backend
node scripts/test-email-service.js your_test_email@example.com
```

---

## 🎓 学校邮箱配置

### 步骤 1: 获取 SMTP 配置信息

不同学校的邮箱配置可能不同，常见配置如下：

#### 清华大学
```env
EMAIL_HOST=smtp.tsinghua.edu.cn
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### 北京大学
```env
EMAIL_HOST=smtp.pku.edu.cn
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### 其他学校
请咨询学校 IT 部门或查看学校邮箱帮助文档，获取以下信息：
- SMTP 服务器地址
- SMTP 端口（通常是 587 或 465）
- 是否需要 SSL/TLS

### 步骤 2: 配置环境变量

在 `ieclub-backend/.env` 文件中配置：

```env
EMAIL_HOST=smtp.your_school.edu.cn
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=12310203@your_school.edu.cn
EMAIL_PASSWORD=你的学校邮箱密码
EMAIL_FROM="IEClub <12310203@your_school.edu.cn>"
```

**重要提示**：
- `EMAIL_USER` 填写你的完整学校邮箱地址
- `EMAIL_PASSWORD` 填写你的学校邮箱密码
- 如果学校邮箱需要特殊认证，可能需要使用授权码

### 步骤 3: 测试配置

```bash
cd ieclub-backend
node scripts/test-email-service.js your_test_email@example.com
```

---

## 🔧 常见问题排查

### 问题 1: 连接失败

**症状**：日志显示 "邮件服务连接验证失败"

**可能原因**：
1. SMTP 服务器地址或端口不正确
2. 用户名或密码错误
3. 网络连接问题
4. 防火墙阻止连接

**解决方法**：
- 检查 `EMAIL_HOST` 和 `EMAIL_PORT` 是否正确
- 确认 `EMAIL_USER` 和 `EMAIL_PASSWORD` 正确
- 检查网络连接
- 如果是 QQ 邮箱，确认使用的是授权码而不是密码

### 问题 2: 认证失败（QQ 邮箱）

**症状**：错误代码 535 或 "Authentication failed"

**解决方法**：
1. 确认已开启 SMTP 服务
2. 确认使用的是**授权码**而不是QQ密码
3. 重新生成授权码（授权码可能会过期）

### 问题 3: 学校邮箱无法连接

**症状**：连接超时或连接被拒绝

**解决方法**：
1. 确认 SMTP 服务器地址正确
2. 尝试不同的端口（587 或 465）
3. 如果使用 465 端口，设置 `EMAIL_SECURE=true`
4. 联系学校 IT 部门确认 SMTP 服务是否开启

### 问题 4: 邮件发送失败

**症状**：前端显示 "邮件发送失败"

**排查步骤**：
1. 查看后端日志，查找具体错误信息
2. 运行测试脚本：`node scripts/test-email-service.js`
3. 检查收件人邮箱地址是否正确
4. 检查垃圾邮件文件夹

---

## 🔐 安全最佳实践

### 1. 保护 .env 文件

- ✅ `.env` 文件已在 `.gitignore` 中
- ✅ 永远不要将 `.env` 文件提交到 Git
- ✅ 不要将 `.env` 文件分享给他人
- ✅ 定期更换密码和授权码

### 2. 使用授权码而非密码

- QQ 邮箱：使用授权码，不要使用QQ密码
- Gmail：使用应用专用密码
- 学校邮箱：如果支持，优先使用授权码

### 3. 限制邮箱权限

- 使用专门的邮箱账号用于发送系统邮件
- 不要使用个人重要邮箱
- 定期检查邮箱安全设置

### 4. 监控邮件发送

- 定期检查邮件发送日志
- 监控异常发送行为
- 设置邮件发送频率限制

---

## 📝 配置示例

### 完整配置示例（QQ 邮箱）

```env
# 邮件服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_qq_number@qq.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM="IEClub <your_qq_number@qq.com>"
```

### 完整配置示例（学校邮箱）

```env
# 邮件服务配置
EMAIL_HOST=smtp.your_school.edu.cn
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=12310203@your_school.edu.cn
EMAIL_PASSWORD=your_school_email_password
EMAIL_FROM="IEClub <12310203@your_school.edu.cn>"
```

---

## ✅ 验证配置

配置完成后，运行以下命令验证：

```bash
# 进入后端目录
cd ieclub-backend

# 运行测试脚本
node scripts/test-email-service.js your_test_email@example.com
```

如果配置正确，你应该看到：
```
✅ 邮件服务连接验证成功
📧 邮件服务已就绪，可以发送邮件
📨 测试邮件已发送到: your_test_email@example.com
```

---

## 📚 相关文档

- [邮件服务修复报告](../debugging/EMAIL_SERVICE_FIX_COMPLETE.md)
- [环境变量配置说明](./ENVIRONMENT_VARIABLES.md)
- [部署指南](../deployment/Deployment_guide.md)

---

## 🆘 需要帮助？

如果遇到问题：
1. 查看后端日志：`pm2 logs ieclub-backend`
2. 运行诊断脚本：`node scripts/test-email-service.js`
3. 检查 `.env` 文件配置是否正确
4. 查看本文档的常见问题部分

