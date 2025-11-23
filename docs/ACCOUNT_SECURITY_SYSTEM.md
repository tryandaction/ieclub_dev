# 账户安全系统设计文档

## 📋 系统概述

本文档描述 IEclub 项目的账户安全系统，包括多种登录方式、账号绑定、安全策略等。

---

## 🔐 认证方式

### 支持的登录方式

| 登录方式 | 端 | 状态 | 说明 |
|---------|-----|------|------|
| 邮箱+密码 | Web/小程序 | ✅ 已实现 | 主要登录方式 |
| 邮箱+验证码 | Web/小程序 | ✅ 已实现 | 无密码登录 |
| 手机号+验证码 | Web/小程序 | ✅ 已实现 | 需先绑定手机 |
| 微信快速登录 | 小程序 | ✅ 已实现 | 微信授权登录 |
| 微信扫码登录 | Web | ⚠️ 待实现 | 网页端微信扫码 |

---

## 📱 账号绑定系统

### 1. 邮箱绑定
- **必需性**: ✅ 必需（注册时绑定）
- **唯一性**: ✅ 一个邮箱只能绑定一个账号
- **修改**: ⚠️ 需验证新邮箱
- **解绑**: ❌ 不支持（主要登录凭证）

### 2. 手机号绑定
- **必需性**: ⚠️ 可选
- **唯一性**: ✅ 一个手机号只能绑定一个账号
- **修改**: ✅ 支持换绑
- **解绑**: ✅ 支持解绑
- **用途**: 
  - 手机号登录
  - 找回密码
  - 安全验证

### 3. 微信绑定
- **必需性**: ⚠️ 可选
- **唯一性**: ✅ 一个微信只能绑定一个账号
- **修改**: ✅ 支持换绑
- **解绑**: ✅ 支持解绑（需保留其他登录方式）
- **存储信息**:
  - `openid`: 小程序用户唯一标识
  - `unionid`: 微信开放平台唯一标识（可选）
  - `sessionKey`: 微信会话密钥

---

## 🔄 登录流程设计

### 1. 邮箱密码登录
```
用户输入: email + password
↓
后端验证:
  1. 检查邮箱格式
  2. 检查域名限制（南科大邮箱）
  3. 查找用户记录
  4. 验证密码（bcrypt）
  5. 检查账户状态
↓
成功: 返回 access_token + refresh_token
失败: 返回错误信息
```

### 2. 邮箱验证码登录
```
步骤1: 发送验证码
  用户输入: email
  ↓
  后端生成6位数字验证码
  ↓
  发送邮件
  ↓
  返回成功（60秒倒计时）

步骤2: 验证登录
  用户输入: email + code
  ↓
  验证码校验
  ↓
  查找/创建用户
  ↓
  返回 token
```

### 3. 手机号验证码登录
```
前提: 用户已绑定手机号

步骤1: 发送短信验证码
  用户输入: phone
  ↓
  后端调用短信服务
  ↓
  返回成功

步骤2: 验证登录
  用户输入: phone + code
  ↓
  验证码校验
  ↓
  查找用户（phone）
  ↓
  返回 token
```

### 4. 微信快速登录（小程序）
```
用户点击授权
↓
获取微信 code
↓
前端发送: code + userInfo
↓
后端调用微信API换取 openid
↓
查找用户（openid）:
  - 已存在: 直接登录
  - 不存在: 创建新用户
↓
返回 token
```

---

## 🔗 绑定/解绑流程

### 绑定手机号
```
前提: 用户已登录

步骤1: 发送验证码
  POST /api/auth/send-phone-code
  Body: { phone }
  ↓
  检查手机号是否已被绑定
  ↓
  发送短信验证码
  ↓
  返回成功

步骤2: 验证并绑定
  POST /api/auth/bind-phone
  Header: Authorization
  Body: { phone, code }
  ↓
  验证验证码
  ↓
  更新 User.phone
  ↓
  创建 UserBinding 记录
  ↓
  返回成功
```

### 解绑手机号
```
前提: 用户已登录，且有其他登录方式

DELETE /api/auth/unbind-phone
Header: Authorization
↓
检查是否有其他登录方式（email/wechat）
↓
清空 User.phone
↓
删除 UserBinding 记录
↓
返回成功
```

### 绑定微信
```
前提: 用户已登录（邮箱账号）

POST /api/auth/bind-wechat
Header: Authorization
Body: { code, nickName, avatarUrl }
↓
调用微信API换取openid
↓
检查openid是否已被绑定
↓
更新 User.openid/unionid/sessionKey
↓
创建 UserBinding 记录
↓
返回成功
```

### 解绑微信
```
前提: 用户已登录，且有密码或手机号

DELETE /api/auth/unbind-wechat
Header: Authorization
↓
检查是否有密码或手机号
↓
清空 User.openid/unionid/sessionKey
↓
删除 UserBinding 记录
↓
返回成功
```

---

## 🛡️ 安全策略

### 1. 密码安全
- **加密**: bcrypt (salt rounds: 10)
- **强度要求**:
  - 长度: 6-20位（用户友好）
  - 弱密码检测: 禁止常见密码（password123等）
- **存储**: 只存储哈希值，不可逆
- **修改**: 需验证旧密码或验证码

### 2. 验证码安全
- **长度**: 6位数字
- **有效期**: 10分钟
- **重发限制**: 60秒倒计时
- **使用次数**: 一次性（使用后标记为used）
- **存储**: 数据库表 `VerificationCode`

### 3. Token安全
- **Access Token**:
  - 类型: JWT
  - 有效期: 7天
  - 存储位置: localStorage/cookie
  - 包含信息: userId, email
  
- **Refresh Token**:
  - 类型: 随机字符串
  - 有效期: 30天
  - 存储位置: 数据库 + HttpOnly Cookie
  - 用途: 刷新access token

- **Token版本控制**:
  - `User.tokenVersion`: 撤销所有token
  - 修改密码后自动增加版本号

### 4. 登录保护
- **失败次数限制**: 5次/15分钟（根据IP）
- **登录日志**: 记录所有登录尝试
  - IP地址
  - User Agent
  - 登录方式
  - 成功/失败状态
- **异常检测**: 
  - 异地登录提醒
  - 设备变更提醒

### 5. 账号保护
- **解绑限制**: 
  - 必须保留至少一种登录方式
  - 解绑需验证身份
- **注销账号**:
  - 需验证密码或验证码
  - 软删除（修改status为deleted）
  - 保留30天可恢复期

---

## 📊 数据库模型

### User表（关键字段）
```prisma
model User {
  id String @id @default(cuid())
  
  // 登录凭证
  email      String  @unique  // 必需
  password   String           // 密码哈希
  phone      String? @unique  // 可选
  openid     String? @unique  // 微信openid
  unionid    String?          // 微信unionid
  sessionKey String?          // 微信session_key
  
  // Token管理
  refreshToken String?        // 当前refresh token
  tokenVersion Int @default(0) // Token版本号
  
  // 时间戳
  lastLoginAt  DateTime?
  lastActiveAt DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // 关联
  userBindings UserBinding[]
  loginLogs    LoginLog[]
}
```

### UserBinding表
```prisma
model UserBinding {
  id String @id @default(cuid())
  
  type      String  // wechat, phone, email
  bindValue String  // 绑定值
  metadata  String? // JSON额外信息
  
  userId    String
  user      User @relation(...)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([type, bindValue])
}
```

### VerificationCode表
```prisma
model VerificationCode {
  id String @id @default(cuid())
  
  email     String  // 邮箱/手机号
  code      String  // 验证码
  type      String  // register, login, reset_password, bind_phone
  used      Boolean @default(false)
  usedAt    DateTime?
  expiresAt DateTime
  
  createdAt DateTime @default(now())
}
```

### LoginLog表
```prisma
model LoginLog {
  id String @id @default(cuid())
  
  userId      String
  user        User @relation(...)
  
  ipAddress   String
  userAgent   String?
  loginMethod String  // email, phone, wechat
  status      String  // success, failed
  failReason  String?
  
  createdAt   DateTime @default(now())
}
```

---

## 🔌 API接口清单

### 认证接口
| 接口 | 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|------|
| 邮箱密码登录 | POST | `/api/auth/login` | 邮箱+密码 | ✅ |
| 邮箱验证码登录 | POST | `/api/auth/login-with-code` | 邮箱+验证码 | ✅ |
| 手机验证码登录 | POST | `/api/auth/login-with-phone` | 手机+验证码 | ✅ |
| 微信登录 | POST | `/api/auth/wechat-login` | 微信code | ✅ |
| 注册 | POST | `/api/auth/register` | 邮箱注册 | ✅ |
| 退出登录 | POST | `/api/auth/logout` | - | ✅ |
| 刷新Token | POST | `/api/auth/refresh` | refreshToken | ✅ |

### 验证码接口
| 接口 | 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|------|
| 发送邮箱验证码 | POST | `/api/auth/send-verify-code` | type参数 | ✅ |
| 发送手机验证码 | POST | `/api/auth/send-phone-code` | 手机号 | ⚠️ 需实现 |
| 验证验证码 | POST | `/api/auth/verify-code` | 验证有效性 | ✅ |

### 密码管理
| 接口 | 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|------|
| 忘记密码 | POST | `/api/auth/forgot-password` | 发送重置邮件 | ✅ |
| 重置密码 | POST | `/api/auth/reset-password` | 验证码/token | ✅ |
| 修改密码 | PUT | `/api/auth/change-password` | 需旧密码 | ✅ |
| 设置密码 | POST | `/api/auth/set-password` | 微信用户首次 | ✅ |

### 账号绑定
| 接口 | 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|------|
| 绑定手机号 | POST | `/api/auth/bind-phone` | 验证码绑定 | ⚠️ 需实现 |
| 解绑手机号 | DELETE | `/api/auth/unbind-phone` | - | ✅ |
| 绑定微信 | POST | `/api/auth/bind-wechat` | 微信code | ⚠️ 需实现 |
| 解绑微信 | DELETE | `/api/auth/unbind-wechat` | - | ✅ |
| 注销账号 | DELETE | `/api/auth/delete-account` | 软删除 | ✅ |

---

## ⚠️ 待实现功能

### P0（高优先级）
1. **发送手机验证码接口** (`sendPhoneCode`)
   - 集成阿里云短信服务
   - 验证手机号格式
   - 防刷限制

2. **绑定手机号接口** (`bindPhone`)
   - 验证验证码
   - 检查手机号是否已绑定
   - 更新数据库

3. **绑定微信接口** (`bindWechat`)
   - 调用微信API
   - 检查openid是否已绑定
   - 更新数据库

### P1（中优先级）
4. **登录日志查询**
   - 用户查看自己的登录历史
   - 异常登录提醒

5. **设备管理**
   - 查看所有登录设备
   - 踢出其他设备

### P2（低优先级）
6. **两步验证**
   - 短信验证码二次确认
   - TOTP（Google Authenticator）

7. **微信扫码登录（Web）**
   - 网页端扫码登录
   - 需微信开放平台

---

## 🧪 测试清单

### 登录测试
- [ ] 邮箱密码登录（正确/错误密码）
- [ ] 邮箱验证码登录
- [ ] 手机号验证码登录
- [ ] 微信快速登录
- [ ] Token过期自动刷新
- [ ] 登录失败次数限制

### 绑定测试
- [ ] 绑定手机号（新手机/已绑定手机）
- [ ] 解绑手机号（有/无其他登录方式）
- [ ] 绑定微信（新微信/已绑定微信）
- [ ] 解绑微信（有/无密码）

### 安全测试
- [ ] 密码强度验证
- [ ] 验证码有效期测试
- [ ] Token版本控制测试
- [ ] 并发登录测试
- [ ] SQL注入测试
- [ ] XSS攻击测试

---

**最后更新**: 2025-11-23  
**维护者**: AI开发团队
