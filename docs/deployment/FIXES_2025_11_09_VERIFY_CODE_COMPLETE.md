# 验证码接口 500 错误完整修复 - 2025-11-09

## 问题描述

测试环境注册登录功能无法使用，发送验证码和验证码验证接口都返回 500 错误：
- `POST /api/auth/send-verify-code` 返回 500
- `POST /api/auth/verify-code` 返回 500

## 根本原因分析

经过详细检查，发现了以下问题：

1. **`emailService.sendVerificationCode` 可能抛出错误**：如果邮件服务抛出异常而不是返回错误对象，会被外层的 catch 捕获，导致 500 错误
2. **`verifyCode` 方法缺少错误日志**：catch 块只调用 `next(error)`，没有记录错误信息，无法调试
3. **数据库错误日志不完整**：数据库错误只记录了错误对象，没有记录详细的错误信息（stack trace、error code、error name）
4. **缺少输入验证**：`req.body` 可能为空或格式不正确，导致后续操作失败

## 修复内容

### 1. 修复 `sendVerifyCode` 方法

**文件**：`ieclub-backend/src/controllers/authController.js`

**修复点**：
- ✅ 添加了 `req.body` 的空值检查
- ✅ 为 `emailService.sendVerificationCode` 添加了 try-catch 处理
- ✅ 改进了错误日志，包括 stack trace、error code 和 error name
- ✅ 在所有数据库操作中都添加了详细的错误处理

**修复的代码**：
```javascript
// 添加输入验证
const { email, type = 'register' } = req.body || {};
if (!email) {
  return res.status(400).json({
    code: 400,
    message: '邮箱地址不能为空'
  });
}

// 添加邮件服务错误处理
let sendResult;
try {
  sendResult = await emailService.sendVerificationCode(email, code, type);
} catch (emailError) {
  logger.error('邮件服务调用失败:', { email, error: emailError.message, stack: emailError.stack });
  // 即使邮件发送失败，验证码仍然有效（已保存到数据库）
  return res.json({
    code: 200,
    message: '验证码已生成，但邮件发送失败',
    data: {
      expiresIn: 600,
      emailSent: false,
      code: process.env.NODE_ENV === 'development' ? code : undefined
    }
  });
}
```

### 2. 修复 `verifyCode` 方法

**文件**：`ieclub-backend/src/controllers/authController.js`

**修复点**：
- ✅ 添加了 `req.body` 的空值检查
- ✅ 添加了输入验证（邮箱格式、验证码格式）
- ✅ 添加了详细的错误日志记录
- ✅ 改进了数据库错误处理

**修复的代码**：
```javascript
// 添加输入验证
const { email, code } = req.body || {};

// 验证必填字段
if (!email || !code) {
  return res.status(400).json({
    success: false,
    message: '邮箱和验证码不能为空'
  });
}

// 验证邮箱格式
if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
  return res.status(400).json({
    success: false,
    message: '邮箱格式不正确'
  });
}

// 验证验证码格式
if (!/^\d{6}$/.test(code)) {
  return res.status(400).json({
    success: false,
    message: '验证码必须是6位数字'
  });
}

// 添加详细的错误日志
catch (error) {
  logger.error('验证验证码失败:', { 
    email: req.body?.email, 
    error: error.message, 
    stack: error.stack,
    code: error.code,
    name: error.name
  });
  next(error);
}
```

### 3. 改进数据库错误处理

**修复点**：
- ✅ 所有数据库错误都记录详细的日志（包括 stack trace、error code、error name）
- ✅ 区分数据库连接错误和其他数据库错误
- ✅ 其他数据库错误也记录日志，便于调试

**修复的代码**：
```javascript
catch (dbError) {
  // 数据库连接错误
  if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
    logger.error('数据库连接失败:', { 
      error: dbError.message, 
      code: dbError.code, 
      name: dbError.name,
      stack: dbError.stack 
    });
    return res.status(503).json({
      code: 503,
      message: '服务暂时不可用，请稍后重试'
    });
  }
  // 其他数据库错误也记录日志
  logger.error('数据库操作失败:', { 
    error: dbError.message, 
    code: dbError.code, 
    name: dbError.name,
    stack: dbError.stack 
  });
  throw dbError;
}
```

## 错误处理逻辑

### 数据库错误处理

所有数据库操作都添加了以下错误处理：

1. **连接错误**（P1001、P1000、PrismaClientInitializationError）：
   - 返回 503 状态码
   - 记录详细错误日志
   - 返回友好的错误信息

2. **其他数据库错误**：
   - 记录详细错误日志
   - 抛出错误，由错误处理器处理

### 邮件服务错误处理

1. **邮件服务抛出异常**：
   - 捕获异常并记录日志
   - 返回 200 状态码（验证码已保存到数据库）
   - 返回友好的错误信息

2. **邮件服务返回失败**：
   - 检查返回结果
   - 记录错误日志
   - 返回 200 状态码（验证码已保存到数据库）

### 输入验证

1. **`sendVerifyCode`**：
   - 检查 `req.body` 是否为空
   - 检查 `email` 是否为空
   - 使用 `checkEmailAllowed` 验证邮箱格式和域名

2. **`verifyCode`**：
   - 检查 `req.body` 是否为空
   - 检查 `email` 和 `code` 是否为空
   - 验证邮箱格式
   - 验证验证码格式（6位数字）

## 使用说明

### 检查后端日志

运行日志检查脚本：
```powershell
.\scripts\deployment\Check-Backend-Logs.ps1 -ServerHost test.ieclub.online
```

### 检查数据库连接

如果看到 503 错误，请检查：
1. `.env.staging` 文件中的 `DATABASE_URL` 配置
2. 数据库服务是否正常运行
3. 数据库网络连接是否正常

### 重启服务

如果数据库连接正常，但服务仍然报错，可以重启服务：
```bash
ssh root@test.ieclub.online
cd /root/IEclub_dev_staging/ieclub-backend
pm2 restart staging-backend
pm2 logs staging-backend --lines 100
```

## 测试建议

1. **测试发送验证码**：
   ```bash
   curl -X POST https://test.ieclub.online/api/auth/send-verify-code \
     -H "Content-Type: application/json" \
     -d '{"email":"12310203@mail.sustech.edu.cn","type":"register"}'
   ```

2. **测试验证验证码**：
   ```bash
   curl -X POST https://test.ieclub.online/api/auth/verify-code \
     -H "Content-Type: application/json" \
     -d '{"email":"12310203@mail.sustech.edu.cn","code":"123456"}'
   ```

3. **检查错误日志**：
   ```bash
   ssh root@test.ieclub.online
   pm2 logs staging-backend --lines 100 --err
   ```

## 相关文件

- `ieclub-backend/src/controllers/authController.js` - 已修复
- `ieclub-backend/src/middleware/errorHandler.js` - 错误处理器
- `ieclub-backend/src/services/emailService.js` - 邮件服务
- `scripts/deployment/Check-Backend-Logs.ps1` - 日志检查脚本

## 后续建议

1. **监控数据库连接**：定期检查数据库连接状态
2. **日志记录**：确保所有错误都被正确记录
3. **错误恢复**：考虑添加自动重试机制
4. **健康检查**：添加健康检查接口，定期检查数据库连接
5. **单元测试**：添加单元测试，覆盖各种错误场景

