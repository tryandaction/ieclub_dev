# 测试环境真实邮件服务配置指南

## 为什么需要真实邮件服务？

测试环境应该尽可能接近生产环境，使用真实邮件服务可以：
- ✅ 测试用户注册流程（接收验证码）
- ✅ 测试找回密码功能
- ✅ 测试邮件发送稳定性
- ✅ 确保生产环境不会出问题

## 当前问题

目前使用的 `Ethereal Email` 是**模拟邮件服务**：
- ❌ 邮件不会真实发送
- ❌ 用户收不到验证码
- ❌ 无法完整测试用户流程

---

## 推荐方案：SendGrid（免费版足够）

### 第一步：注册 SendGrid

1. 访问：https://signup.sendgrid.com/
2. 填写注册信息
3. 验证邮箱

### 第二步：创建 API Key

1. 登录 SendGrid
2. 进入 **Settings** → **API Keys**
3. 点击 **Create API Key**
4. 名称：`IEClub-Staging`
5. 权限：选择 **Full Access**（或 Mail Send）
6. **复制并保存** API Key（只显示一次！）

### 第三步：配置测试环境

我已经准备好配置脚本，运行以下命令：

```bash
# 在本地运行
chmod +x configure-sendgrid.sh
./configure-sendgrid.sh
```

脚本会提示你输入：
- SendGrid API Key
- 发件人邮箱（需要先在 SendGrid 验证）

### 第四步：验证发件人邮箱

⚠️ **重要**：SendGrid 要求验证发件人邮箱

1. 进入 **Settings** → **Sender Authentication**
2. 点击 **Verify a Single Sender**
3. 填写发件人信息：
   - From Name: `IEClub测试环境`
   - From Email: 你的邮箱（如 `noreply@yourdomain.com`）
   - Reply To: 同上
4. 去邮箱点击验证链接
5. 等待验证完成（几分钟）

### 第五步：重启服务

```bash
ssh root@ieclub.online "pm2 restart ieclub-staging"
```

---

## 方案二：腾讯企业邮箱（国内推荐）

### 优势
- ✅ 国内服务，速度快
- ✅ 免费版支持50个账号
- ✅ 稳定可靠

### 配置步骤

1. 注册腾讯企业邮箱：https://exmail.qq.com/
2. 添加域名并验证
3. 创建邮箱账号：如 `noreply@yourdomain.com`
4. 开启 SMTP 服务
5. 使用以下配置：

```bash
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=你的邮箱密码
EMAIL_FROM=IEClub <noreply@yourdomain.com>
```

---

## 方案三：阿里云邮件推送

### 配置步骤

1. 开通服务：https://www.aliyun.com/product/directmail
2. 配置发信域名
3. 创建发信地址
4. 获取 SMTP 配置信息

---

## 测试邮件发送

配置完成后，测试邮件功能：

```bash
# 1. 测试注册（会发送验证码）
curl -X POST https://test.ieclub.online/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "your-real-email@example.com",
    "password": "Test123456!",
    "nickname": "测试用户"
  }'

# 2. 检查你的邮箱是否收到验证码
```

---

## 常见问题

### Q1: SendGrid 免费版够用吗？
**A**: 够用！免费版每天 100 封，测试环境足够。

### Q2: 邮件进垃圾箱怎么办？
**A**: 
- 完成 SendGrid 的 **Domain Authentication**
- 配置 SPF 和 DKIM 记录
- 添加退订链接

### Q3: 如果没有域名怎么办？
**A**: 
- 可以使用个人邮箱（Gmail、QQ 邮箱等）
- 在 SendGrid 验证单个发件人即可

### Q4: 生产环境也用 SendGrid？
**A**: 可以，但建议：
- 测试环境：SendGrid 免费版
- 生产环境：SendGrid 付费版或专业邮件服务

---

## 下一步

**请选择邮件服务方案**，我会帮你完成配置：

1. **SendGrid**（推荐，5分钟搞定）
2. **腾讯企业邮箱**（需要域名）
3. **其他方案**

告诉我你的选择，我会提供详细指导！

