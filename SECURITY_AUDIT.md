# IEClub 安全审计与修复完整报告

**审计日期**: 2025-10-30  
**版本**: v1.0  
**状态**: 🟢 系统运行正常，需要配置邮件服务

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [安全评分](#安全评分)
3. [关键发现](#关键发现)
4. [详细审计结果](#详细审计结果)
5. [修复方案](#修复方案)
6. [测试验证](#测试验证)

---

## 执行摘要

### 当前状态
✅ **后端服务运行正常** - systemd管理，端口3000  
✅ **前端网页可访问** - https://ieclub.online 正常  
✅ **数据库连接正常** - MySQL + Prisma ORM  
⚠️ **邮件服务未配置** - EMAIL_USER/EMAIL_PASS未设置  

### 关键问题（按优先级）
🔴 **P0 - 立即修复**
- 邮件服务未配置 → 验证码、密码重置功能不可用
- 生产域名未添加到CORS → 可能影响前端API调用

🟡 **P1 - 1周内修复**
- 密码强度要求过弱（仅6位）
- API限流配置未应用
- 验证码无发送频率限制

### 安全评分：**80/100** - 良好

---

## 安全评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 认证安全 | 85/100 | 密码加密✓ 登录限制✓ 密码强度可增强 |
| 会话管理 | 80/100 | JWT机制完善，缺Token黑名单 |
| 数据保护 | 90/100 | 数据脱敏良好，日志完整 |
| API安全 | 75/100 | CORS/Helmet完善，限流未启用 |
| 配置安全 | 70/100 | 多数配置合理，邮件服务待配置 |

**综合评分**: **80/100**

---

## 关键发现

### ✅ 做得好的地方

1. **密码安全**: bcrypt加密，salt轮数10
2. **防暴力破解**: 15分钟内失败5次自动锁定
3. **登录日志**: 记录IP、User-Agent、时间、成功/失败状态
4. **验证码机制**: 数据库存储，一次性使用，10分钟过期
5. **SQL注入防护**: 使用Prisma ORM，自动防注入
6. **敏感数据保护**: API响应不包含密码字段
7. **JWT管理**: Token 7天过期，Refresh Token 30天
8. **用户状态检查**: 实时验证账号是否被禁用
9. **CORS配置**: 严格的域名白名单
10. **安全头部**: Helmet中间件保护

### 🚨 需要修复的问题

#### 🔴 高危（P0 - 立即修复）

**1. 邮件服务未配置**
```bash
# 位置: ieclub-backend/.env
EMAIL_USER=          # ❌ 未配置
EMAIL_PASS=          # ❌ 未配置

# 影响功能：
- ❌ 用户无法注册（收不到验证码）
- ❌ 无法重置密码
- ❌ 验证码登录不可用
```

**2. CORS生产域名缺失**
```env
# 当前配置
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# 缺少生产域名
# ❌ https://ieclub.online
# ❌ https://www.ieclub.online
```

#### 🟡 中危（P1 - 1周内修复）

**3. 密码强度要求过弱**
```javascript
// 当前：仅检查长度 >= 6
if (newPassword.length < 6) {
  return res.status(400).json({ message: '密码至少6位' });
}

// 建议：8位 + 大小写 + 数字 + 特殊字符
```

**4. API限流未启用**
```javascript
// 配置存在但未应用到Express
// 位置: .env
RATE_LIMIT_WINDOW_MS=900000  // 配置了
RATE_LIMIT_MAX_REQUESTS=100  // 配置了

// 但 app.js 中未使用
```

**5. 验证码无发送频率限制**
- 同一邮箱可无限制发送验证码
- 同一IP可无限制请求验证码
- 可能被恶意利用刷邮件

---

## 详细审计结果

### 1. 认证系统

#### 1.1 用户注册 (`POST /api/auth/register`)

**✅ 安全特性**:
```javascript
// 1. 严格的邮箱验证
const emailRegex = /^[a-zA-Z0-9._-]+@mail\.sustech\.edu\.cn$/;
// 只允许 @mail.sustech.edu.cn 域名

// 2. 验证码验证（10分钟有效期，一次性使用）
const stored = await prisma.verificationCode.findFirst({
  where: { email, code, type: 'register', used: false }
});
if (!stored || new Date() > stored.expiresAt) {
  return res.status(400).json({ message: '验证码无效或已过期' });
}

// 3. 密码加密存储
const hashedPassword = await bcrypt.hash(password, 10);

// 4. 登录日志记录
await prisma.loginLog.create({
  data: {
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    loginMethod: 'register',
    status: 'success'
  }
});
```

⚠️ **问题**: 密码强度要求仅6位，无复杂度要求

#### 1.2 用户登录 (`POST /api/auth/login`)

**✅ 防暴力破解**:
```javascript
// 15分钟内失败5次锁定
const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
const failedAttempts = await prisma.loginLog.count({
  where: {
    userId: user.id,
    status: 'failed',
    loginTime: { gte: fifteenMinutesAgo }
  }
});

if (failedAttempts >= 5) {
  return res.status(429).json({
    message: '登录失败次数过多，请15分钟后重试'
  });
}
```

**✅ 安全的错误消息**:
```javascript
// 不泄露用户是否存在
if (!user || !isPasswordValid) {
  return res.status(401).json({
    message: '邮箱或密码错误'  // 统一的错误消息
  });
}
```

#### 1.3 微信登录 (`POST /api/auth/wechat-login`)

⚠️ **临时实现（待完善）**:
```javascript
// 当前使用临时openid
const openid = `wx_${code}_${Date.now()}`;
// TODO: 需要调用微信服务器API换取真实openid
```

### 2. 验证码系统

#### 2.1 发送验证码 (`POST /api/auth/send-code`)

**✅ 安全存储**:
```javascript
await prisma.verificationCode.create({
  data: {
    email,
    code,
    type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟
  }
});
```

🔴 **致命问题 - 邮件服务未配置**:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,  // ❌ 未设置
    pass: process.env.EMAIL_PASS   // ❌ 未设置
  }
});
```

⚠️ **缺少频率限制**:
- 无同一邮箱发送间隔限制
- 无IP请求次数限制

### 3. 密码管理

**✅ bcrypt加密**:
```javascript
// 加密
const hashedPassword = await bcrypt.hash(password, 10);

// 验证
const isPasswordValid = await bcrypt.compare(password, user.password);
```

⚠️ **密码强度要求**:
```javascript
// 当前：仅要求6位
if (newPassword.length < 6) {
  return res.status(400).json({ message: '密码至少6位' });
}

// 建议：至少8位 + 大小写 + 数字 + 特殊字符
```

### 4. 会话管理

**✅ JWT配置**:
```env
JWT_SECRET=vXroGJ1DzqbM8MreoogKfvfewefv32fb
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=EaCp3XnU2Eh5E1H6BoWpdfvddsbii28gd324
JWT_REFRESH_EXPIRES_IN=30d
```

**✅ Token验证中间件**:
```javascript
exports.authenticate = async (req, res, next) => {
  // 1. 提取Token
  const token = authHeader.replace('Bearer ', '');
  
  // 2. 验证签名
  const decoded = jwt.verify(token, config.jwt.secret);
  
  // 3. 查询用户
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });
  
  // 4. 检查用户状态
  if (user.status !== 'active') {
    throw new AppError('AUTH_USER_BANNED');
  }
  
  req.user = user;
  next();
};
```

⚠️ **建议增强**:
- Token黑名单机制（退出登录时让Token立即失效）
- 设备绑定（限制Token跨设备使用）

### 5. API安全

**✅ CORS配置**:
```javascript
app.use(cors({
  origin: function(origin, callback) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));
```

⚠️ **CORS配置问题**:
```env
# 当前仅配置了localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:8080
# 缺少生产域名
```

**✅ Helmet安全头部**:
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  xContentTypeOptions: true,
  server: 'IEClub/2.0'
}));
```

**✅ 请求体大小限制**:
```javascript
app.use(express.json({ limit: '10mb' }));
```

⚠️ **限流未启用**:
```env
# 配置存在
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
# 但未在app.js中应用
```

### 6. 数据库安全

**✅ Prisma ORM防SQL注入**:
```javascript
// 所有查询都通过Prisma，自动防注入
await prisma.user.findUnique({ where: { email } });
```

**✅ 专用数据库用户**:
```env
DATABASE_URL="mysql://ieclub_user:kE7pCg$r@W9nZ!sV2@127.0.0.1:3306/ieclub"
# 使用ieclub_user而非root，权限受限 ✓
```

---

## 修复方案

### 🔴 P0 - 立即修复（30分钟内）

#### 修复1: 配置邮件服务

**步骤1 - 获取QQ邮箱授权码**:
1. 登录QQ邮箱：https://mail.qq.com
2. 设置 → 账户 → POP3/IMAP/SMTP服务
3. 开启"SMTP服务"
4. 发送短信获取**授权码**（16位，不是QQ密码）
5. 保存授权码

**步骤2 - 更新配置**:
```bash
# SSH到服务器
ssh root@39.108.160.112

# 编辑.env文件
cd /root/IEclub_dev/ieclub-backend
nano .env

# 添加以下配置（替换为真实值）
EMAIL_USER=your_qq_email@qq.com
EMAIL_PASS=your_16_digit_authorization_code

# 保存: Ctrl+X → Y → Enter
```

**步骤3 - 重启服务**:
```bash
systemctl restart ieclub-backend

# 验证服务正常
systemctl status ieclub-backend
```

**步骤4 - 测试验证码**:
```bash
# 测试发送验证码
curl -X POST http://127.0.0.1:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@mail.sustech.edu.cn","type":"register"}' \
  | jq

# 期望输出: {"success": true, "message": "验证码已发送"}
# 检查邮箱是否收到验证码邮件
```

#### 修复2: 更新CORS配置

```bash
# 编辑.env文件
nano /root/IEclub_dev/ieclub-backend/.env

# 修改CORS_ORIGIN这行
CORS_ORIGIN=http://localhost:3000,http://localhost:8080,https://ieclub.online,https://www.ieclub.online

# 重启服务
systemctl restart ieclub-backend

# 验证CORS
curl -H "Origin: https://ieclub.online" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://127.0.0.1:3000/api/auth/login \
  -v 2>&1 | grep "Access-Control-Allow-Origin"
```

---

### 🟡 P1 - 短期修复（1周内）

#### 修复3: 增强密码强度

**编辑authController.js**:
```bash
cd /root/IEclub_dev/ieclub-backend
nano src/controllers/authController.js
```

**在文件顶部添加密码验证函数**:
```javascript
// 在第10行附近添加
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, message: '密码至少8位' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码需包含小写字母' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码需包含大写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: '密码需包含特殊字符' };
  }
  return { valid: true };
}
```

**替换3处密码验证**:

1. 第253行（注册）:
```javascript
// 原代码
if (!password || password.length < 6) {
  return res.status(400).json({ message: '密码至少6位' });
}

// 新代码
const passwordCheck = validatePasswordStrength(password);
if (!passwordCheck.valid) {
  return res.status(400).json({ 
    success: false, 
    message: passwordCheck.message 
  });
}
```

2. 第520行（修改密码）:
3. 第791行（重置密码）:

**重启服务**:
```bash
systemctl restart ieclub-backend
```

#### 修复4: 启用API限流

**编辑app.js**:
```bash
nano /root/IEclub_dev/ieclub-backend/src/app.js
```

**在第72行（`app.use('/api', routes);`之前）添加**:
```javascript
// API限流配置
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    code: 429,
    message: '请求过于频繁，请稍后再试'
  }
});

app.use('/api', apiLimiter);
```

**重启并测试**:
```bash
systemctl restart ieclub-backend

# 测试限流（快速请求101次）
for i in {1..101}; do 
  curl -s http://127.0.0.1:3000/api/test > /dev/null
done

# 第101次应该返回429
curl -s http://127.0.0.1:3000/api/test | jq
```

#### 修复5: 验证码发送频率限制

**编辑authController.js**:
```bash
nano /root/IEclub_dev/ieclub-backend/src/controllers/authController.js
```

**在sendVerifyCode函数中添加（第157行后）**:
```javascript
static async sendVerifyCode(req, res) {
  try {
    const { email, type = 'register' } = req.body;

    // === 新增：频率限制 ===
    // 1分钟内同一邮箱只能发送1次
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentCode) {
      const waitSeconds = Math.ceil(
        (recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `验证码发送过于频繁，请${waitSeconds}秒后重试`
      });
    }
    // === 新增结束 ===

    // 原有代码...
```

**重启服务**:
```bash
systemctl restart ieclub-backend
```

---

## 测试验证

### 快速测试脚本

创建并运行测试脚本：

```bash
# SSH到服务器
ssh root@39.108.160.112

# 创建测试脚本
cat > /tmp/test_ieclub_security.sh << 'EOF'
#!/bin/bash
echo "========================================="
echo "IEClub 安全修复验证"
echo "========================================="

# 1. 健康检查
echo -n "1. 健康检查 ... "
if curl -s http://127.0.0.1:3000/health | grep -q '"status":"UP"'; then
  echo "✅"
else
  echo "❌"
fi

# 2. API连接
echo -n "2. API连接 ... "
if curl -s http://127.0.0.1:3000/api/test | grep -q '"success":true'; then
  echo "✅"
else
  echo "❌"
fi

# 3. 验证码发送（需要邮件配置）
echo -n "3. 验证码发送 ... "
response=$(curl -s -X POST http://127.0.0.1:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","type":"register"}')
if echo "$response" | grep -q '"success":true'; then
  echo "✅ (邮件服务已配置)"
elif echo "$response" | grep -q 'nodemailer'; then
  echo "⚠️  (邮件服务未配置)"
else
  echo "❌"
fi

# 4. CORS
echo -n "4. CORS配置 ... "
if curl -s -H "Origin: https://ieclub.online" \
  -X OPTIONS http://127.0.0.1:3000/api/auth/login -I 2>&1 | \
  grep -q "Access-Control-Allow-Origin"; then
  echo "✅"
else
  echo "❌"
fi

# 5. 数据库连接
echo -n "5. 数据库连接 ... "
if curl -s http://127.0.0.1:3000/api/topics?page=1 | grep -q '"success":true'; then
  echo "✅"
else
  echo "❌"
fi

# 6. 前端页面
echo -n "6. 前端页面 ... "
http_code=$(curl -s -o /dev/null -w "%{http_code}" https://ieclub.online)
if [ "$http_code" == "200" ]; then
  echo "✅"
else
  echo "❌ (HTTP $http_code)"
fi

echo "========================================="
echo "测试完成"
echo "========================================="
EOF

chmod +x /tmp/test_ieclub_security.sh
/tmp/test_ieclub_security.sh
```

### 完整功能测试

```bash
# 1. 测试登录（应该失败 - 用户不存在）
curl -X POST http://127.0.0.1:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","password":"Test123!"}' \
  | jq

# 期望: {"success": false, "message": "邮箱或密码错误"}

# 2. 测试获取话题列表
curl -s http://127.0.0.1:3000/api/topics?page=1&limit=5 | jq

# 期望: {"success": true, "data": {...}}

# 3. 测试搜索
curl -s "http://127.0.0.1:3000/api/search/topics?keyword=测试" | jq

# 4. 测试限流（快速请求20次）
for i in {1..20}; do
  response=$(curl -s http://127.0.0.1:3000/api/test)
  echo "Request $i: $response"
  sleep 0.1
done

# 5. 测试验证码频率限制
curl -X POST http://127.0.0.1:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","type":"register"}' | jq

# 立即再发一次
curl -X POST http://127.0.0.1:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mail.sustech.edu.cn","type":"register"}' | jq

# 期望第二次: {"success": false, "message": "验证码发送过于频繁..."}
```

---

## 修复检查清单

完成修复后，逐项确认：

### P0 - 立即修复
- [ ] **邮件服务**: EMAIL_USER和EMAIL_PASS已配置
- [ ] **邮件测试**: 可以成功发送验证码邮件
- [ ] **CORS配置**: 添加了 ieclub.online 域名
- [ ] **CORS测试**: 跨域请求返回正确的头部

### P1 - 短期修复
- [ ] **密码强度**: 增加了8位+复杂度要求
- [ ] **密码测试**: 弱密码被拒绝
- [ ] **API限流**: 已应用限流中间件
- [ ] **限流测试**: 第101次请求返回429
- [ ] **验证码限流**: 同一邮箱1分钟内只能发送1次
- [ ] **验证码测试**: 频繁发送被阻止

### 服务状态
- [ ] **后端服务**: 运行正常（`systemctl status ieclub-backend`）
- [ ] **错误日志**: 无严重错误（`journalctl -u ieclub-backend -n 50`）
- [ ] **前端访问**: https://ieclub.online 可访问
- [ ] **API响应**: 所有测试API正常返回

---

## 回滚方案

如果修复后出现问题：

```bash
# 1. 停止服务
systemctl stop ieclub-backend

# 2. 恢复配置（如果有备份）
cd /root/IEclub_dev/ieclub-backend
ls -la .env.backup.*
cp .env.backup.YYYYMMDD_HHMMSS .env

# 3. 恢复代码（如果有Git提交）
git status
git diff
git checkout -- src/

# 4. 重启服务
systemctl start ieclub-backend

# 5. 检查日志
journalctl -u ieclub-backend -n 100 --no-pager
```

---

## 常见问题

### Q1: 邮件发送失败怎么办？

```bash
# 检查日志
journalctl -u ieclub-backend -n 100 | grep -i mail

# 常见错误：
# - "Invalid login" → 授权码错误，重新获取
# - "Connection timeout" → 防火墙阻止465端口
# - "Recipient address rejected" → 邮箱格式错误
```

### Q2: CORS还是报错怎么办？

```bash
# 检查当前配置
grep CORS_ORIGIN /root/IEclub_dev/ieclub-backend/.env

# 确保没有多余空格
# 确保域名正确（https://ieclub.online）

# 重启Nginx
systemctl restart nginx
```

### Q3: 修改代码后服务无法启动？

```bash
# 查看详细错误
journalctl -u ieclub-backend -n 100 --no-pager

# 常见错误：
# - 语法错误 → 检查JavaScript语法
# - 模块未找到 → 运行 npm install
# - 端口占用 → 检查3000端口是否被占用
```

---

## 维护建议

### 定期检查（每周）
- 查看登录日志，检测异常登录
- 检查错误日志，发现潜在问题
- 监控API请求量和响应时间

### 定期更新（每月）
- 更新npm依赖包
- 检查安全补丁
- 审查新增功能的安全性

### 安全审计（每季度）
- 完整的安全审计
- 密码策略审查
- 数据备份测试

---

## 联系方式

**技术支持**: support@ieclub.online  
**安全团队**: security@ieclub.online

---

**报告生成**: 2025-10-30  
**下次审计**: 2025-11-30  
**文档版本**: v1.0

