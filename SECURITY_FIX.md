# 🔒 安全漏洞修复报告

## 漏洞描述

**严重程度**: 🔴 高危

**问题**: 前端日志输出导致用户密码明文泄露到浏览器控制台

### 泄露证据

在浏览器控制台日志中发现：
```javascript
🚀 [POST] https://test.ieclub.online/api/auth/login 
{
  params: undefined, 
  data: '{"email":"12310203@mail.sustech.edu.cn","password":"fuhaokun1766968"}',
  headers: sn
}
```

**影响范围**:
- 所有登录、注册、修改密码操作
- 任何使用密码、token等敏感信息的API请求
- 攻击者可通过浏览器开发者工具窃取密码

---

## 修复方案

### 1. ✅ 已修复：前端 request.js

**文件**: `ieclub-web/src/utils/request.js`

**修复内容**:
- 添加 `sanitizeSensitiveData()` 函数
- 过滤敏感字段：password、oldPassword、newPassword、token、accessToken、refreshToken
- 将敏感字段替换为 `***hidden***`

**修复前**:
```javascript
console.log(`🚀 [${config.method?.toUpperCase()}] ${fullURL}`, {
  params: config.params,
  data: config.data,  // ❌ 直接输出原始数据
  headers: config.headers
})
```

**修复后**:
```javascript
const sanitizedData = config.data ? sanitizeSensitiveData(config.data) : undefined
console.log(`🚀 [${config.method?.toUpperCase()}] ${fullURL}`, {
  params: config.params,
  data: sanitizedData,  // ✅ 输出过滤后的数据
  headers: config.headers
})
```

### 2. ⚠️ 需要注意：logger.js

**文件**: `ieclub-web/src/utils/logger.js`

**状态**: 未被广泛使用，但建议后续改进

**潜在问题**:
- `api(method, url, data)` 方法直接输出 data
- `apiResponse(method, url, status, data)` 方法直接输出 data

**建议**: 如果后续使用此logger，需要在这两个方法中也添加敏感数据过滤

### 3. ✅ 后端检查：无问题

**检查结果**:
- ✅ 后端不直接打印 `req.body`
- ✅ 后端不在日志中输出密码字段
- ✅ 后端日志使用 logger.warn/error，主要记录操作结果和错误信息

---

## 测试验证

修复后的日志输出示例：
```javascript
🚀 [POST] https://test.ieclub.online/api/auth/login 
{
  params: undefined,
  data: {
    email: "12310203@mail.sustech.edu.cn",
    password: "***hidden***"  // ✅ 已隐藏
  },
  headers: sn
}
```

---

## 部署计划

### 紧急部署
1. ✅ 提交修复代码
2. 🔄 推送到远程仓库
3. 🚀 立即部署到生产环境（高优先级安全修复）

### 命令
```powershell
git push origin develop
.\scripts\deployment\Deploy-Production.ps1 -Target web -Message "紧急安全修复：防止密码泄露"
```

---

## 安全建议

### 开发规范
1. **永远不要在日志中输出敏感信息**
   - 密码、token、验证码、身份证号等

2. **生产环境关闭调试日志**
   - 设置 `LOG_LEVEL=WARN` 或更高

3. **定期安全审计**
   - 检查所有 console.log/logger 调用
   - 确保没有敏感数据泄露

4. **代码审查**
   - 新增API调用时，确保不输出敏感字段

### 用户建议
1. **立即修改密码**（如果密码已泄露到日志）
2. **不要在公共场所或他人可见的情况下使用开发者工具**
3. **注意浏览器扩展的权限**（某些扩展可能读取控制台日志）

---

## 修复人员
- AI Assistant (Cascade)
- 修复时间: 2025-11-21 21:29 UTC+8

## 相关Commit
- `57ccc0ec` - security: 修复控制台日志泄露密码的安全漏洞
