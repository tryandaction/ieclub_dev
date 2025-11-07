# 邮箱域名白名单配置

## 概述

为了增强安全性和灵活性，系统现在支持通过环境变量配置允许注册、登录的邮箱域名白名单。

## 更新日期

2025-11-07

## 功能特性

### 1. 统一的邮箱域名检查

所有与邮箱相关的操作现在都使用统一的域名检查机制：
- 发送验证码
- 用户注册
- 用户登录
- 密码找回
- 密码重置
- 验证码登录

### 2. 灵活的配置方式

系统支持通过环境变量 `ALLOWED_EMAIL_DOMAINS` 配置允许的邮箱域名列表。

### 3. 不同操作类型的自定义消息

系统会根据不同的操作类型（注册、登录、密码重置）返回相应的错误提示信息。

## 配置方法

### 环境变量配置

在 `.env` 文件中添加或修改以下配置：

```env
# 邮箱域名白名单（用逗号分隔）
# 支持带 mail. 前缀和不带前缀的域名
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,example.com
```

### 配置示例

#### 示例 1: 仅允许南科大邮箱

```env
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn
```

允许的邮箱格式：
- `user@sustech.edu.cn`
- `user@mail.sustech.edu.cn`

#### 示例 2: 允许多个域名

```env
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,company.com,university.edu
```

允许的邮箱格式：
- `user@sustech.edu.cn`
- `user@mail.sustech.edu.cn`
- `user@company.com`
- `user@university.edu`

#### 示例 3: 开发环境（允许所有域名）

```env
# 留空或不设置该变量将使用默认值（仅允许南科大邮箱）
# 如果要允许所有域名，需要在代码中修改 emailDomainChecker.js
```

### 默认配置

如果未设置 `ALLOWED_EMAIL_DOMAINS` 环境变量，系统将默认仅允许南科大邮箱域名：
- `sustech.edu.cn`
- `mail.sustech.edu.cn`

## 技术实现

### 核心模块

`ieclub-backend/src/utils/emailDomainChecker.js`

该模块提供了以下功能：

1. **`getAllowedDomains()`**: 获取允许的邮箱域名列表
2. **`checkEmailAllowed(email, type)`**: 检查邮箱是否在白名单中

### 验证流程

```javascript
const { checkEmailAllowed } = require('../utils/emailDomainChecker');

// 检查邮箱是否允许
const emailCheck = checkEmailAllowed(email, 'register');
if (!emailCheck.valid) {
  return res.status(400).json({
    code: 400,
    message: emailCheck.message
  });
}
```

### 集成点

邮箱域名检查已集成到以下位置：

#### 1. 控制器层 (`authController.js`)
- `sendVerifyCode()` - 发送验证码
- `register()` - 用户注册
- `login()` - 密码登录
- `loginWithCode()` - 验证码登录
- `forgotPassword()` - 密码找回
- `resetPassword()` - 密码重置

#### 2. 验证中间件层 (`validators.js`)
- `sendVerifyCodeValidation` - 发送验证码验证
- `registerValidation` - 注册验证
- `loginValidation` - 登录验证

#### 3. 路由层 (`routes/index.js`)
验证中间件已添加到相应的路由：
```javascript
router.post('/auth/send-verify-code', 
  rateLimiters.auth,
  sendVerifyCodeValidation,
  handleValidationErrors,
  AuthController.sendVerifyCode
);

router.post('/auth/register', 
  rateLimiters.auth,
  registerValidation,
  handleValidationErrors,
  AuthController.register
);

router.post('/auth/login', 
  rateLimiters.auth,
  loginValidation,
  handleValidationErrors,
  AuthController.login
);
```

## 错误消息

系统会根据不同的操作类型返回不同的错误消息：

| 操作类型 | 错误消息示例 |
|---------|------------|
| register | `注册仅限使用以下邮箱：sustech.edu.cn, mail.sustech.edu.cn` |
| login | `登录仅限使用以下邮箱：sustech.edu.cn, mail.sustech.edu.cn` |
| reset | `密码重置仅限使用以下邮箱：sustech.edu.cn, mail.sustech.edu.cn` |
| 其他 | `该邮箱不在允许的域名列表中` |

## 安全性优势

1. **集中管理**: 所有邮箱域名限制都在一个地方管理，便于维护
2. **灵活配置**: 通过环境变量快速调整白名单，无需修改代码
3. **多层防护**: 在验证器层和控制器层都进行检查，双重保护
4. **清晰反馈**: 用户会收到明确的错误提示，知道哪些域名被允许

## 部署注意事项

### 生产环境

1. 确保在生产环境的 `.env` 文件中设置了 `ALLOWED_EMAIL_DOMAINS`
2. 建议只允许可信任的机构邮箱域名
3. 重启服务以使配置生效

```bash
# 编辑环境变量
nano /path/to/ieclub-backend/.env

# 重启服务
pm2 restart ieclub-backend
```

### 测试环境

对于测试和开发环境，可以根据需要配置更宽松的域名白名单。

### 验证配置

可以通过以下方式验证配置是否生效：

1. 查看日志中的配置信息（服务启动时会打印）
2. 尝试使用不同域名的邮箱注册，验证是否被正确拦截
3. 使用白名单中的邮箱注册，验证是否能正常通过

## 迁移说明

### 从旧版本升级

如果您从旧版本（使用硬编码的正则表达式）升级到新版本：

1. 旧的邮箱验证逻辑已被完全替换
2. 默认行为保持不变（仅允许南科大邮箱）
3. 如需支持其他域名，只需添加环境变量配置

### 回滚计划

如果出现问题需要回滚：

1. 恢复到之前的代码版本
2. 或者临时修改 `emailDomainChecker.js` 中的默认值

## 测试建议

### 单元测试

建议为以下场景编写测试：

```javascript
describe('邮箱域名验证', () => {
  it('应该允许白名单中的域名', async () => {
    // 测试代码
  });

  it('应该拒绝不在白名单中的域名', async () => {
    // 测试代码
  });

  it('应该正确处理 mail. 前缀', async () => {
    // 测试代码
  });

  it('应该返回适当的错误消息', async () => {
    // 测试代码
  });
});
```

### 集成测试

1. 测试发送验证码接口
2. 测试用户注册流程
3. 测试用户登录流程
4. 测试密码重置流程

### 手动测试

使用 Postman 或 curl 测试各个接口：

```bash
# 测试发送验证码（应该被拒绝）
curl -X POST http://localhost:3000/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@invalid-domain.com", "type": "register"}'

# 测试发送验证码（应该成功）
curl -X POST http://localhost:3000/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "test@sustech.edu.cn", "type": "register"}'
```

## 相关文件

- `ieclub-backend/src/utils/emailDomainChecker.js` - 核心检查模块
- `ieclub-backend/src/controllers/authController.js` - 认证控制器
- `ieclub-backend/src/middleware/validators.js` - 验证中间件
- `ieclub-backend/src/routes/index.js` - 路由配置
- `ieclub-backend/.env` - 环境变量配置

## 常见问题

### Q: 如何允许所有邮箱域名？

A: 目前的设计是基于白名单的，不建议允许所有域名。如果确实需要，可以修改 `emailDomainChecker.js` 中的 `checkEmailAllowed` 函数，直接返回 `{ valid: true }`。

### Q: 配置更改后需要重启服务吗？

A: 是的，环境变量的更改需要重启 Node.js 进程才能生效。

### Q: 可以为不同操作类型设置不同的白名单吗？

A: 当前版本所有操作类型共享同一个白名单。如需此功能，可以修改 `emailDomainChecker.js` 来支持基于操作类型的不同配置。

### Q: 如何在开发环境中临时允许其他域名？

A: 在本地的 `.env` 文件中添加需要的域名即可：
```env
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn,test.com,localhost
```

## 更新历史

- **2025-11-07**: 初始版本
  - 创建统一的邮箱域名检查模块
  - 更新所有认证相关功能
  - 添加验证中间件支持
  - 完善错误消息

## 维护者

如有问题或建议，请联系开发团队。

