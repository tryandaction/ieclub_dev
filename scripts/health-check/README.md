# Health Check & Testing Scripts

本目录包含用于测试和验证IE Club部署的脚本工具。

## 📁 文件说明

### 🔧 测试工具

- **`create-test-user.js`**: 创建测试用户
- **`test-login.sh`**: 测试登录功能
- **`Check-Backend-Health.ps1`**: Windows后端健康检查（在scripts根目录）

## 🚀 使用指南

### 1. 创建测试用户

在新部署的环境中，首先需要创建测试用户：

```bash
# 本地执行
cd scripts/health-check
node create-test-user.js

# 或在服务器上执行
scp create-test-user.js root@ieclub.online:/tmp/
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node /tmp/create-test-user.js'
```

**输出示例**：
```
=== 创建测试用户 ===
Email: admin@sustech.edu.cn
Nickname: Admin

✅ 用户创建成功:
{
  id: 'cmhlqzbcd000087r20tlbclpz',
  email: 'admin@sustech.edu.cn',
  nickname: 'Admin',
  status: 'active'
}

您现在可以使用以下凭据登录:
Email: admin@sustech.edu.cn
Password: Test123456
```

### 2. 测试登录功能

```bash
# 在服务器上测试
scp test-login.sh root@ieclub.online:/tmp/
ssh root@ieclub.online 'bash /tmp/test-login.sh production'

# 测试不同环境
bash /tmp/test-login.sh local      # 本地环境 (端口3000)
bash /tmp/test-login.sh staging    # 测试环境 (端口3001)
bash /tmp/test-login.sh production # 生产环境 (端口3000)
```

**测试内容**：
- ✅ 健康检查
- ✅ 正确的登录请求 (带Content-Type)
- ✅ 错误的登录请求 (不带Content-Type，预期失败)
- ✅ Token验证 (获取用户信息)

### 3. 后端健康检查 (Windows)

```powershell
cd scripts
.\Check-Backend-Health.ps1
```

## 🧪 测试场景

### 场景1: 新环境部署后的完整测试

```bash
# 步骤1: 创建测试用户
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node /tmp/create-test-user.js'

# 步骤2: 测试登录
ssh root@ieclub.online 'bash /tmp/test-login.sh production'

# 步骤3: 手动测试API
curl -X POST https://ieclub.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'
```

### 场景2: 调试登录问题

如果登录失败，按以下步骤排查：

```bash
# 1. 检查服务状态
ssh root@ieclub.online 'pm2 status'

# 2. 查看日志
ssh root@ieclub.online 'pm2 logs ieclub-backend --lines 50'

# 3. 检查数据库中是否有用户
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && npx prisma studio --browser none --port 5555 &'

# 4. 测试Content-Type的影响
# 正确方式 (应该成功)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'

# 错误方式 (应该失败: "请使用南科大邮箱")
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'
```

## ⚠️ 常见问题

### Q1: "请使用南科大邮箱" 错误

**原因**: 请求未设置 `Content-Type: application/json`，导致Express无法解析JSON body，`req.body`为空。

**解决**: 确保curl命令包含 `-H "Content-Type: application/json"`

```bash
# ✅ 正确
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'

# ❌ 错误
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'
```

### Q2: "邮箱或密码错误"

**原因**: 用户不存在或密码错误。

**解决**: 运行 `create-test-user.js` 创建测试用户

```bash
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node /tmp/create-test-user.js'
```

### Q3: SSH中执行复杂curl命令引号转义问题

**原因**: SSH远程执行时shell的引号转义很复杂。

**解决**: 使用测试脚本或heredoc

```bash
# 方法1: 使用测试脚本
bash test-login.sh production

# 方法2: 使用heredoc
ssh root@ieclub.online << 'EOF'
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sustech.edu.cn","password":"Test123456"}'
EOF

# 方法3: 将JSON数据放到文件中
echo '{"email":"admin@sustech.edu.cn","password":"Test123456"}' > /tmp/login.json
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d @/tmp/login.json
```

## 📊 测试结果判断

### ✅ 成功标准

登录成功响应应包含：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@sustech.edu.cn",
      "nickname": "Admin",
      "avatar": "",
      "level": 1,
      "isCertified": false
    }
  }
}
```

### ❌ 失败标准

常见失败响应：

1. **邮箱格式验证失败** (body为空)
```json
{
  "success": false,
  "message": "请使用南科大邮箱"
}
```

2. **用户不存在或密码错误**
```json
{
  "success": false,
  "message": "邮箱或密码错误"
}
```

3. **服务器错误**
```json
{
  "success": false,
  "message": "登录失败，请稍后重试"
}
```

## 🔗 相关文档

- **部署指南**: `docs/deployment/Deployment_guide.md`
- **快速启动**: `scripts/QUICK_START.ps1`
- **环境配置**: 项目根目录 `.env.template` 文件

---

**Last Updated**: 2025-11-05

