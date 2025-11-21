# IEClub 认证系统快速开始

**更新**: 2025-11-21 - 已修复验证码收不到的问题

---

## ✅ 已修复的问题

1. **验证码收不到** - 环境变量名错误（已修复）
2. **邮件服务配置过严** - 检测逻辑优化（已修复）
3. **图形验证码缺失** - 已新增完整实现

---

## 🚀 立即开始（3步）

### 步骤1：安装依赖

```bash
cd ieclub-backend
npm install
```

### 步骤2：配置邮箱（必须！）

复制 `.env.example` 为 `.env`：
```bash
copy .env.example .env
```

编辑 `.env` 文件，**只需修改邮箱部分**：

```bash
# 邮件配置（QQ邮箱）
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_qq_number@qq.com     # 改成你的QQ邮箱
EMAIL_PASSWORD=你的16位授权码            # 不是QQ密码！
EMAIL_FROM=your_qq_number@qq.com      # 改成你的QQ邮箱
```

**如何获取QQ邮箱授权码**：
1. 登录 https://mail.qq.com
2. 设置 → 账户
3. 找到"POP3/IMAP/SMTP"
4. 开启 IMAP/SMTP 服务
5. 点击"生成授权码"，发短信获取
6. 复制16位授权码到 `.env` 文件

### 步骤3：启动服务

```bash
npm run dev
```

看到这个就成功了：
```
✅ 邮件服务连接验证成功
📧 邮件服务已就绪，可以发送邮件
```

---

## 🧪 测试验证码

### 方法1：通过API测试

打开浏览器或Postman：
```http
POST http://localhost:3000/api/auth/send-verify-code
Content-Type: application/json

{
  "email": "your_email@example.com",
  "type": "register"
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "验证码已发送，请查收邮件",
  "data": {
    "expiresIn": 600,
    "emailSent": true
  }
}
```

**开发环境**（如果邮件发送失败）：
```json
{
  "success": true,
  "data": {
    "verificationCode": "123456",  // 直接在响应中返回验证码
    "note": "这是development环境，验证码: 123456"
  }
}
```

### 方法2：直接运行测试脚本

```bash
cd ieclub-backend
node -e "
const emailService = require('./src/services/emailService');
emailService.sendVerificationCode('your_email@example.com', '123456', 'register')
  .then(res => console.log('结果:', res));
"
```

---

## 📡 核心API（22个）

### 基础认证
```
GET  /api/auth/csrf-token           # 获取CSRF Token
POST /api/auth/send-verify-code     # 发送邮箱验证码 ⭐
POST /api/auth/register             # 用户注册 ⭐
POST /api/auth/login                # 密码登录 ⭐
POST /api/auth/login-with-code      # 验证码登录
POST /api/auth/logout               # 登出
```

### 图形验证码（新增）
```
GET  /api/captcha/generate          # 生成验证码 ⭐
POST /api/captcha/verify            # 验证验证码
POST /api/captcha/refresh           # 刷新验证码
```

### 密码管理
```
PUT  /api/auth/change-password      # 修改密码
POST /api/auth/forgot-password      # 忘记密码
POST /api/auth/reset-password       # 重置密码
```

### 个人信息
```
GET  /api/auth/profile              # 获取信息
PUT  /api/auth/profile              # 更新信息
```

### 账号绑定
```
POST /api/auth/bind-wechat          # 绑定微信
POST /api/auth/unbind-wechat        # 解绑微信
POST /api/auth/send-phone-code      # 发送手机验证码
POST /api/auth/bind-phone           # 绑定手机
POST /api/auth/unbind-phone         # 解绑手机
POST /api/auth/login-with-phone     # 手机登录
POST /api/auth/wechat-login         # 微信登录
DELETE /api/auth/account            # 注销账号
```

---

## 💻 前端调用示例

### React注册示例

```javascript
import axios from 'axios';
import { useState } from 'react';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 发送验证码
  const sendCode = async () => {
    try {
      const res = await axios.post('/api/auth/send-verify-code', {
        email,
        type: 'register'
      });
      
      if (res.data.success) {
        alert('验证码已发送');
        
        // 开发环境直接显示验证码
        if (res.data.data.verificationCode) {
          alert(`验证码: ${res.data.data.verificationCode}`);
        }
        
        // 60秒倒计时
        let count = 60;
        setCountdown(count);
        const timer = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) clearInterval(timer);
        }, 1000);
      }
    } catch (error) {
      alert(error.response?.data?.message || '发送失败');
    }
  };

  // 注册
  const handleRegister = async () => {
    try {
      const res = await axios.post('/api/auth/register', {
        email,
        password,
        verifyCode: code
      });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        alert('注册成功');
        window.location.href = '/';
      }
    } catch (error) {
      alert(error.response?.data?.message || '注册失败');
    }
  };

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="验证码" />
      <button onClick={sendCode} disabled={countdown > 0}>
        {countdown > 0 ? `${countdown}秒` : '发送验证码'}
      </button>
      <button onClick={handleRegister}>注册</button>
    </div>
  );
}
```

### 微信小程序登录

```javascript
// pages/login/login.js
const app = getApp();

Page({
  // 微信一键登录
  async onWechatLogin() {
    try {
      wx.showLoading({ title: '登录中...' });
      
      // 1. 获取微信code
      const { code } = await wx.login();
      
      // 2. 调用后端
      const res = await wx.request({
        url: 'https://ieclub.online/api/auth/wechat-login',
        method: 'POST',
        data: { code }
      });
      
      if (res.data.success) {
        wx.setStorageSync('token', res.data.data.token);
        wx.showToast({ title: '登录成功', icon: 'success' });
        wx.switchTab({ url: '/pages/index/index' });
      }
    } catch (error) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});
```

---

## 🔒 安全机制

### 已实现的安全措施

| 措施 | 实现 | 说明 |
|------|------|------|
| 密码加密 | bcrypt 10轮 | 不可逆加密 |
| JWT认证 | 7天有效 | 无状态认证 |
| 速率限制 | Redis | 5次/60秒 → 封禁5分钟 |
| CSRF保护 | Token | 防跨站攻击 |
| 验证码 | 10分钟过期 | 用后即焚 |
| 登录锁定 | 5次失败 | 锁定15分钟 |

---

## 🐛 常见问题

### 1. 验证码收不到

**已修复！** 检查：
- `.env` 文件中 `EMAIL_PASSWORD` 是否填写了授权码（不是QQ密码）
- 授权码是否是16位
- 查看后端日志：`tail -f logs/combined.log`

### 2. 启动时提示"邮件服务未配置"

编辑 `.env` 文件，填写正确的邮箱配置。

### 3. Token过期

默认7天有效期，过期后需要重新登录。

### 4. Redis连接失败

确保Redis正在运行：
```bash
redis-cli ping  # 应返回 PONG
```

---

## 📂 核心文件位置

```
ieclub-backend/src/
├── controllers/
│   ├── authController.js        # 认证控制器
│   └── captchaController.js     # 验证码控制器（新增）
├── services/
│   ├── emailService.js          # 邮件服务（已优化）
│   ├── captchaService.js        # 验证码服务（新增）
│   ├── smsService.js            # 短信服务
│   └── wechatService.js         # 微信服务
├── middleware/
│   ├── auth.js                  # JWT认证
│   ├── rateLimiter.js           # 速率限制
│   └── csrf.js                  # CSRF保护
└── routes/
    └── index.js                 # 路由配置
```

---

## ✅ 验收清单

完成以下检查确保系统正常：

- [ ] 安装依赖 `npm install`
- [ ] 配置 `.env` 文件（邮箱）
- [ ] 启动服务 `npm run dev`
- [ ] 看到"邮件服务已就绪"
- [ ] 测试发送验证码
- [ ] 收到验证码邮件
- [ ] 测试注册功能
- [ ] 测试登录功能

---

## 📝 重要提醒

1. **邮箱授权码不是QQ密码**！一定要用授权码
2. **开发环境会在响应中返回验证码**，方便测试
3. **生产环境必须使用HTTPS**
4. **不要泄露 `.env` 文件**

---

**文档版本**: 2.0 精简版  
**最后更新**: 2025-11-21  
**状态**: ✅ 验证码问题已修复，可正常使用

需要帮助？检查后端日志：`tail -f logs/combined.log`
