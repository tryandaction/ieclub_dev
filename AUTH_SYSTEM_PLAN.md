# IEclub 认证系统完整开发规划

## 📊 现状分析

### ✅ 已有功能
- 邮箱验证码发送
- 邮箱+验证码登录
- 基础的密码登录（但没有设置密码功能）
- JWT Token 认证（7天过期）
- 管理员系统有完整的 Refresh Token 机制

### ❌ 存在问题
1. **Token 过期无刷新**：JWT 7天过期后用户被强制登出，没有自动刷新机制
2. **密码管理不完整**：缺少首次设置密码、修改密码的流程
3. **绑定功能不完整**：手机号、微信绑定后端接口缺失
4. **前端体验差**：401 错误直接跳转登录，没有尝试刷新 token
5. **安全性不足**：Access Token 过期时间过长（7天），应缩短并使用 Refresh Token

---

## 🎯 开发目标

### 核心目标
实现安全、流畅的认证系统，支持：
- ✅ Token 自动刷新（无感知）
- ✅ 密码设置/修改/重置完整流程
- ✅ 多账号绑定（邮箱、手机、微信）
- ✅ 安全的会话管理

### 技术方案
- **Access Token**：2小时过期（短期）
- **Refresh Token**：30天过期（长期）
- **自动刷新**：前端拦截器自动处理
- **安全存储**：Refresh Token 存数据库，支持撤销

---

## 📋 开发任务清单

### ✅ 阶段一：后端 Token 刷新机制（已完成）

#### 1.1 数据库准备
- [x] 为 `User` 表添加 `refreshToken` 字段（存储当前有效的 refresh token）
- [x] 为 `User` 表添加 `tokenVersion` 字段（用于撤销所有 token）
- [x] 创建数据库迁移

#### 1.2 JWT 配置优化
- [x] 修改 `.env` 配置
  - `JWT_SECRET`：Access Token 密钥（保持）
  - `JWT_EXPIRES_IN`：2h（从 7d 改为 2h）
  - `JWT_REFRESH_SECRET`：Refresh Token 密钥（新增）
  - `JWT_REFRESH_EXPIRES_IN`：30d（新增）
- [x] 更新 `config/index.js` 读取新配置

#### 1.3 Token 生成逻辑
- [x] 创建 `utils/tokenUtils.js`
  - `generateAccessToken(userId)`：生成 2 小时 access token
  - `generateRefreshToken(userId, tokenVersion)`：生成 30 天 refresh token
  - `generateTokenPair(user)`：同时生成两个 token
  - `verifyAccessToken(token)`：验证 access token
  - `verifyRefreshToken(token)`：验证 refresh token

#### 1.4 认证控制器更新
- [x] 创建 `tokenController.js`
  - `refreshToken()`：刷新 token 接口
  - `logout()`：登出接口（撤销 refresh token）
  - `logoutAll()`：登出所有设备（更新 tokenVersion）
  - `verifyToken()`：验证 token 有效性
- [x] 修改 `authController.js`
  - `register()`：返回 access token + refresh token
  - `login()`：返回 access token + refresh token
  - `loginWithCode()`：返回 access token + refresh token
  - `loginWithPhone()`：返回 access token + refresh token

#### 1.5 路由配置
- [x] 添加路由
  - `POST /api/auth/refresh`：刷新 token
  - `GET /api/auth/verify-token`：验证 token
  - `POST /api/auth/logout`：登出
  - `POST /api/auth/logout-all`：登出所有设备

---

### ✅ 阶段四：前端 Token 管理（已完成）

#### 4.1 Token 存储优化
- [x] 修改 `AuthContext.jsx`
  - 同时存储 `accessToken` 和 `refreshToken`
  - `login()` 接收两个 token
  - `logout()` 清除两个 token

#### 4.2 请求拦截器优化
- [x] 修改 `utils/request.js`
  - 请求拦截器注入 `accessToken`
  - 响应拦截器捕获 401 错误
  - 实现自动刷新 token 逻辑
  - 防并发刷新机制（刷新锁 + 请求队列）
  - 刷新失败跳转登录

#### 4.3 登录/注册页面更新
- [x] 修改 `Login.jsx`
  - 保存 `refreshToken`
- [x] 修改 `Register.jsx`
  - 保存 `refreshToken`

---

### ✅ 阶段二：密码管理完善（已完成）

#### 2.1 首次设置密码
- [x] 检查 `User` 表 `password` 字段是否允许 null
- [x] 创建 `POST /api/auth/set-password` 接口
  - 验证用户已登录
  - 验证用户未设置密码
  - 密码强度校验（8-20位，包含字母和数字）
  - 设置密码后返回新 token

#### 2.2 修改密码
- [x] 完善 `PUT /api/auth/change-password` 接口
  - 验证旧密码
  - 密码强度校验
  - 更新 tokenVersion（使所有设备重新登录）
  - 返回新 token

#### 2.3 重置密码
- [x] 完善 `POST /api/auth/reset-password` 接口
  - 验证验证码
  - 密码强度校验
  - 更新 tokenVersion
  - 返回新 token

#### 2.4 密码强度验证
- [x] 创建 `utils/passwordValidator.js`
  - 长度：8-20 位
  - 复杂度：必须包含字母和数字
  - 禁止常见弱密码（如 123456、password）
  - 返回友好的错误提示

#### 2.5 前端实现（双端）
- [x] 网页端：SetPassword.jsx、ChangePassword.jsx
  - 实时密码强度指示器
  - 密码可见性切换
  - 响应式设计
- [x] 小程序端：set-password、change-password 页面
  - 密码强度实时检测
  - 美观的渐变UI
  - Token自动保存

---

### 阶段三：绑定功能完善（中优先级）

#### 3.1 手机号绑定
- [ ] 检查 `User` 表 `phone` 字段
- [ ] 完善 `POST /api/auth/send-phone-code` 接口（发送短信验证码）
- [ ] 完善 `POST /api/auth/bind-phone` 接口
  - 验证验证码
  - 检查手机号是否已被绑定
  - 绑定到当前用户
- [ ] 完善 `POST /api/auth/unbind-phone` 接口
  - 验证密码或验证码
  - 解绑手机号

#### 3.2 微信绑定
- [ ] 检查 `User` 表 `openid`、`unionid` 字段
- [ ] 完善 `POST /api/auth/bind-wechat` 接口
  - 获取微信授权信息
  - 检查是否已被其他用户绑定
  - 绑定到当前用户
- [ ] 完善 `POST /api/auth/unbind-wechat` 接口

#### 3.3 邮箱绑定
- [ ] 添加 `POST /api/auth/bind-email` 接口
  - 发送验证码到新邮箱
  - 验证验证码
  - 检查邮箱是否已被绑定
  - 更换邮箱

---

### 阶段四：前端 Token 管理（高优先级）

#### 4.1 Token 存储优化
- [ ] 修改 `AuthContext.jsx`
  - 同时存储 `accessToken` 和 `refreshToken`
  - `login()` 接收两个 token
  - `logout()` 清除两个 token

#### 4.2 请求拦截器优化
- [ ] 修改 `utils/request.js`
  - 请求拦截器注入 `accessToken`（保持）
  - 响应拦截器捕获 401 错误
  - **新增** 自动刷新 token 逻辑
    - 检测到 401 且有 `refreshToken`
    - 调用 `/api/auth/refresh` 刷新 token
    - 用新 token 重试原请求
    - 若刷新失败，跳转登录

#### 4.3 刷新 Token 防并发
- [ ] 实现刷新锁机制
  - 同时多个请求 401，只刷新一次
  - 其他请求等待刷新完成后重试
  - 使用 Promise 队列管理

#### 4.4 API 方法更新
- [ ] 修改 `api/auth.js`
  - `refreshToken()`：调用刷新接口
  - `logout()`：调用登出接口
  - `logoutAll()`：登出所有设备

---

### 阶段五：前端密码与绑定功能（中优先级）

#### 5.1 密码设置页面
- [ ] 创建 `pages/SetPassword.jsx`
  - 输入新密码
  - 确认密码
  - 密码强度指示器
  - 提交后自动登录

#### 5.2 修改密码页面
- [ ] 创建 `pages/ChangePassword.jsx`
  - 输入旧密码
  - 输入新密码
  - 确认新密码
  - 修改后重新登录

#### 5.3 账号绑定页面
- [ ] 创建 `pages/AccountBinding.jsx`
  - 显示已绑定账号（邮箱、手机、微信）
  - 绑定新手机号
  - 绑定微信
  - 解绑功能

---

### 阶段六：安全增强（低优先级）

#### 6.1 登录日志
- [ ] 记录登录时间、IP、设备
- [ ] 显示最近登录记录
- [ ] 异常登录提醒

#### 6.2 设备管理
- [ ] 显示当前登录设备列表
- [ ] 远程登出其他设备

#### 6.3 双因素认证（2FA）
- [ ] 支持 TOTP（Google Authenticator）
- [ ] 备用恢复码

---

## 🚀 实施计划

### 第一周：核心功能
**目标**：解决 Token 过期问题

- [ ] **Day 1-2**：后端 Refresh Token 机制
  - 数据库迁移
  - Token 工具函数
  - 刷新接口实现
  
- [ ] **Day 3-4**：前端自动刷新
  - 请求拦截器优化
  - Token 管理优化
  - 测试刷新流程

- [ ] **Day 5**：密码管理基础
  - 设置密码接口
  - 修改密码接口
  - 密码强度校验

### 第二周：完善功能
**目标**：密码与绑定功能

- [ ] **Day 1-2**：密码管理前端
  - 设置密码页面
  - 修改密码页面
  - 重置密码流程优化

- [ ] **Day 3-5**：绑定功能
  - 手机号绑定
  - 微信绑定
  - 账号绑定页面

### 第三周：安全与优化
**目标**：安全增强

- [ ] **Day 1-2**：登录日志
- [ ] **Day 3-4**：设备管理
- [ ] **Day 5**：测试与优化

---

## 🧪 测试计划

### 功能测试
- [ ] Token 刷新测试（2小时后自动刷新）
- [ ] Token 过期测试（30天后需重新登录）
- [ ] 并发刷新测试（多个 401 同时发生）
- [ ] 密码设置/修改/重置流程
- [ ] 绑定/解绑流程

### 安全测试
- [ ] Token 篡改测试
- [ ] Refresh Token 重放攻击测试
- [ ] 密码强度测试
- [ ] SQL 注入测试

### 性能测试
- [ ] Token 刷新性能
- [ ] 数据库查询性能

---

## 📝 API 设计

### Token 相关
```typescript
// 刷新 Token
POST /api/auth/refresh
Request: { refreshToken: string }
Response: { accessToken: string, refreshToken: string }

// 登出
POST /api/auth/logout
Response: { message: string }

// 登出所有设备
POST /api/auth/logout-all
Response: { message: string }
```

### 密码相关
```typescript
// 首次设置密码
POST /api/auth/set-password
Request: { password: string, confirmPassword: string }
Response: { accessToken: string, refreshToken: string }

// 修改密码
POST /api/auth/change-password
Request: { oldPassword: string, newPassword: string }
Response: { accessToken: string, refreshToken: string }
```

### 绑定相关
```typescript
// 绑定手机号
POST /api/auth/bind-phone
Request: { phone: string, code: string }
Response: { message: string }

// 解绑手机号
POST /api/auth/unbind-phone
Request: { password?: string, code?: string }
Response: { message: string }
```

---

## 🔐 安全考虑

1. **Token 安全**
   - Refresh Token 只能使用一次（刷新后立即失效）
   - Refresh Token 存储在数据库，支持撤销
   - 使用不同的 secret 签名

2. **密码安全**
   - bcrypt 加密存储
   - 强度校验
   - 修改密码后撤销所有 token

3. **防重放攻击**
   - Token Version 机制
   - 登出后立即失效

4. **防暴力破解**
   - 登录失败次数限制
   - 验证码频率限制

---

## 📚 参考资料

- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- OWASP Authentication Cheat Sheet
- 已实现的管理员 Refresh Token 机制：`src/controllers/adminAuthController.js`

---

## ✅ 验收标准

### 必须通过
- [ ] 用户登录后 2 小时不操作，再次操作时自动刷新 token（无感知）
- [ ] 用户 30 天不登录，需重新登录
- [ ] 用户可设置、修改、重置密码
- [ ] 用户可绑定/解绑手机号
- [ ] 用户登出后 token 立即失效

### 性能要求
- [ ] Token 刷新响应时间 < 200ms
- [ ] 并发刷新不会导致多次请求
- [ ] 前端刷新逻辑不影响用户体验

---

**开始时间**：2025-11-22  
**完成时间**：进行中  
**当前阶段**：✅ Token 刷新机制已完成 | ✅ 密码管理功能已完成（双端）  
**下一阶段**：绑定功能完善（手机号、微信、邮箱）

---

## 🚀 部署指南

### 服务器部署步骤

#### 1. 生成 JWT Refresh Secret
```bash
ssh root@ieclub.online
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. 更新生产环境配置
```bash
cd /root/IEclub_dev/ieclub-backend
nano .env
```

添加/更新以下配置：
```bash
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=<刚才生成的64位字符串>
JWT_REFRESH_EXPIRES_IN=30d
```

#### 3. 执行数据库迁移
```bash
cd /root/IEclub_dev/ieclub-backend
npx prisma migrate deploy
npx prisma generate
```

#### 4. 重启服务
```bash
pm2 restart ieclub-backend
pm2 save
```

#### 5. 验证部署
```bash
# 测试健康检查
curl -s http://localhost:3000/health

# 测试刷新接口（需要先登录获取 refreshToken）
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

---

## 📊 功能验证清单

### 后端验证
- [ ] 登录返回 `accessToken` 和 `refreshToken`
- [ ] `/api/auth/refresh` 接口正常工作
- [ ] `/api/auth/logout` 清除 refreshToken
- [ ] `/api/auth/logout-all` 递增 tokenVersion
- [ ] 2小时后 accessToken 过期

### 前端验证
- [ ] 登录后保存两个 token
- [ ] 401 错误自动刷新 token
- [ ] 刷新失败跳转登录页
- [ ] 登出清除两个 token
- [ ] 多个 401 不会重复刷新

---

## ✅ 已解决的问题

1. **Token 过期登出问题** → Access Token 2小时自动刷新
2. **登录超时体验差** → 无感知自动刷新，30天免登录
3. **安全性不足** → Refresh Token 数据库存储，支持撤销
4. **多设备登录管理** → 登出所有设备功能
