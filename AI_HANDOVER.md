# AI开发交接文档 - IEclub项目

## 📋 项目概述

**项目名称**: IEclub 社区平台  
**技术栈**: 
- 前端: React Web + 微信小程序原生
- 后端: Node.js + Express + Prisma + MySQL
- 部署: 生产环境 ieclub.online

**当前状态**: 
- ✅ Web前端功能完整
- ⚠️ 小程序功能不完整，界面落后
- ⚠️ 存在登录过期和密码显示问题

---

## 🔥 紧急待修复问题

### 1. **小程序密码显示/隐藏功能未实现** ⚠️ HIGH PRIORITY

**问题描述**:
- 网页版密码显示/隐藏功能正常
- 小程序版本**完全不工作**
- 代码已修改但未生效

**文件位置**:
- `ieclub-frontend/pages/auth/index.js` (已修改)
- `ieclub-frontend/pages/auth/index.wxml` (已修改)
- `ieclub-frontend/pages/auth/index.wxss` (已修改)

**建议方案**:
```
1. 删除现有的密码显示/隐藏实现代码
2. 参考网页版实现（ieclub-web/src/pages/Auth.jsx）
3. 完全重写小程序版本，确保逻辑正确：
   - togglePassword() 方法正确切换 showPassword 状态
   - WXML中 type="{{ showPassword ? 'text' : 'password' }}"
   - 图标绑定：icon="{{ showPassword ? '眼睛打开' : '眼睛关闭' }}"
4. 在微信开发者工具中实际测试点击效果
5. 确认 console.log 输出 showPassword 状态变化
```

**参考实现（网页版）**:
```javascript
// ieclub-web/src/pages/Auth.jsx
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? 'text' : 'password'}
  suffix={
    <button onClick={() => setShowPassword(!showPassword)}>
      {showPassword ? <EyeOpen /> : <EyeClosed />}
    </button>
  }
/>
```

---

### 2. **登录401 Token过期问题** ⚠️ HIGH PRIORITY

**错误信息**:
```
POST https://ieclub.online/api/auth/login 401 (Unauthorized)
🔒 [401] /auth/login: Token 已过期
```

**问题分析**:
这是**登录请求本身返回401**，不是token刷新问题。可能原因：
1. 后端登录接口验证逻辑错误
2. 密码加密不匹配（bcrypt）
3. 请求拦截器错误地为登录请求添加了过期token

**排查步骤**:
```
1. 检查 ieclub-frontend/utils/request.js 的请求拦截器
   - 登录请求不应该携带token
   - 确认 /auth/login 在白名单中

2. 检查后端 authController.js 的 login 方法
   - 验证密码比对逻辑（bcrypt.compare）
   - 确认不会检查token（这是登录接口）

3. 测试步骤：
   - 清除所有本地存储（wx.clearStorage()）
   - 重新注册新用户
   - 立即登录测试
   - 如果还是401，查看后端日志
```

**可能需要修改**:
```javascript
// ieclub-frontend/utils/request.js
const noAuthUrls = ['/auth/login', '/auth/register', '/auth/send-code'];

request.interceptors.request.use(config => {
  const url = config.url || '';
  const needAuth = !noAuthUrls.some(path => url.includes(path));
  
  if (needAuth) {
    const token = wx.getStorageSync('token');
    if (token) {
      config.header.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

---

### 3. **小程序界面落后于网页** ⚠️ MEDIUM PRIORITY

**问题**:
- 网页版界面美观、功能完整
- 小程序版界面简陋、底部按钮显示不全
- 多处界面需要对齐网页版

**需要优化的页面**:
```
1. 登录/注册页面 (pages/auth/index)
   - 底部按钮显示不全
   - 布局需要优化
   - 参考网页版设计

2. 首页 (pages/index/index)
   - 布局对齐网页版
   - 交互体验优化

3. 活动列表/详情页
   - 界面美化
   - 功能完善

4. 个人中心
   - 对齐网页版功能
```

**建议方案**:
```
1. 逐页对比网页版和小程序版
2. 创建统一的UI组件库
3. 使用WXSS实现类似TailwindCSS的样式
4. 确保小程序体验不弱于网页版
```

---

## ⚠️ 已知技术债务

### Redis检查导致部署断网 🚨

**问题描述**:
部署脚本中的Redis检查会触发网络安全策略，导致所有SSH连接断开，必须切换网络才能恢复。

**当前解决方案**:
临时**完全禁用**了Redis检查：
```powershell
# scripts/health-check/Check-Server-Resources.ps1 第261-266行
Write-Host "Redis连接: 已禁用检查（会导致断网）" -ForegroundColor Gray
# Redis并非必需服务，不影响系统核心功能
```

**长期解决规划**:
```
阶段1 (紧急): ✅ 已完成
  - 禁用Redis检查避免部署中断

阶段2 (短期，1-2周内):
  - 调查为什么Redis检查触发安全策略
  - 可能原因：
    1. ssh + redis-cli 组合被IDS识别为异常
    2. timeout命令触发连接管理规则
    3. 服务器防火墙/IPS规则过于严格
  
  解决方案选项：
  A. 修改Redis检查方式：
     - 使用本地脚本而非SSH远程执行
     - 通过HTTP健康检查接口间接验证Redis
     - 使用更简单的命令（如netstat检查端口）
  
  B. 调整服务器安全策略：
     - 审查iptables/firewalld规则
     - 检查fail2ban配置
     - 白名单化部署操作的IP
  
  C. 改用其他监控方案：
     - 部署Prometheus + Grafana
     - 使用专门的监控工具而非脚本检查

阶段3 (长期，1个月内):
  - 评估Redis在项目中的实际使用情况
  - 如果未充分使用，考虑移除Redis依赖
  - 如果必需，完善Redis连接池和错误处理
  - 添加Redis健康检查到后端API
```

**建议下一步行动**:
1. 先解决登录和密码显示问题
2. 优化小程序界面
3. 再回来处理Redis监控问题
4. 可以在后端添加 `/api/health/redis` 接口间接检查

---

## 📂 关键文件位置

### 小程序相关
```
ieclub-frontend/
├── pages/auth/index.js          # 登录注册页面逻辑 ⚠️ 需要重写密码显示
├── pages/auth/index.wxml        # 登录注册页面模板 ⚠️ 需要重写
├── pages/auth/index.wxss        # 登录注册页面样式 ⚠️ 需要优化
├── utils/request.js             # API请求封装 ⚠️ 检查token拦截器
├── utils/config.js              # API配置
└── api/auth.js                  # 认证API接口
```

### 网页版参考（实现正确）
```
ieclub-web/
├── src/pages/Auth.jsx           # ✅ 密码显示功能正常，可参考
├── src/api/auth.js              # ✅ API调用方式
└── src/utils/request.js         # ✅ 请求拦截器实现
```

### 后端
```
ieclub-backend/
├── src/controllers/authController.js  # 登录注册逻辑
├── src/middleware/auth.js             # Token验证中间件
└── src/routes/auth.js                 # 认证路由
```

### 部署相关
```
scripts/
├── deployment/Deploy-Production.ps1              # 部署脚本
└── health-check/Check-Server-Resources.ps1       # ⚠️ Redis检查已禁用
```

---

## 🔍 调试和测试指南

### 小程序调试
```javascript
// 1. 在微信开发者工具控制台查看日志
console.log('密码显示状态:', this.data.showPassword);
console.log('登录表单:', this.data.loginForm);

// 2. 查看网络请求
// 工具 → 调试器 → Network 标签

// 3. 查看Storage
// 工具 → 调试器 → Storage 标签
wx.getStorageSync('token')
wx.getStorageSync('userInfo')

// 4. 清除缓存重新测试
wx.clearStorage()
```

### 后端调试
```bash
# SSH登录生产服务器
ssh root@ieclub.online

# 查看后端日志（实时）
pm2 logs ieclub-backend

# 查看最近50行日志
pm2 logs ieclub-backend --lines 50

# 查看PM2进程状态
pm2 status

# 重启后端
pm2 restart ieclub-backend
```

### API测试
```bash
# 健康检查
curl https://ieclub.online/api/health

# 测试登录（替换真实邮箱密码）
curl -X POST https://ieclub.online/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎯 开发优先级

### 第一优先级（本周必须完成）
1. ✅ **修复小程序密码显示/隐藏功能**
   - 删除现有代码重写
   - 参考网页版实现
   - 实际测试验证

2. ✅ **解决登录401问题**
   - 排查请求拦截器
   - 验证后端逻辑
   - 测试完整登录流程

3. ✅ **优化登录页面底部按钮显示**
   - 修复布局问题
   - 对齐网页版样式

### 第二优先级（下周完成）
4. 🔄 **小程序界面全面优化**
   - 逐页对比并改进
   - 统一UI风格
   - 提升用户体验

5. 🔄 **完善验证码登录功能**
   - 测试验证码发送
   - 验证码登录流程
   - 错误处理

### 第三优先级（本月内）
6. 📅 **Redis监控问题长期方案**
   - 调研解决方案
   - 实施并测试
   - 文档化配置

7. 📅 **小程序功能完善**
   - 添加网页版已有但小程序缺少的功能
   - 性能优化
   - 用户反馈收集

---

## 💡 给下一个AI的建议

### 工作方法
1. **先读后改**: 先完整阅读相关代码，理解现有实现
2. **对比参考**: 网页版功能正常，多参考网页版代码
3. **小步验证**: 每修改一个功能，立即在开发工具中测试
4. **保持日志**: 删除敏感信息日志，保留调试日志
5. **文档同步**: 修改后更新此文档

### 测试流程
```
1. 本地测试（微信开发者工具）
   ✓ 功能测试
   ✓ 界面检查
   ✓ 日志输出

2. 提交代码
   git add .
   git commit -m "fix: 描述修改内容"
   git push origin develop

3. 部署到生产（使用SkipGitPush避免断网）
   cd scripts/deployment
   .\Deploy-Production.ps1 -Target all -Message "更新说明" -SkipGitPush -SkipConfirmation

4. 生产验证
   - 访问 https://ieclub.online
   - 检查后端健康: https://ieclub.online/api/health
   - 测试具体功能
```

### 常见问题处理
```
Q: 部署时断网了？
A: 是Redis检查导致的，已禁用。使用 -SkipGitPush 参数部署。

Q: PM2显示backend errored？
A: ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && pm2 restart ieclub-backend"

Q: 小程序修改不生效？
A: 1) 检查是否真的保存了文件
   2) 微信开发者工具中"编译"
   3) 清除缓存重新编译

Q: 401错误持续出现？
A: 1) 清除Storage: wx.clearStorage()
   2) 检查request.js拦截器
   3) 查看后端日志: pm2 logs ieclub-backend
```

---

## 📚 相关文档

- **部署指南**: `docs/DEPLOYMENT_GUIDE.md`
- **开发路线图**: `DEVELOPMENT_ROADMAP.md`
- **项目总览**: `PROJECT_FOR_AI.md`
- **快速开始**: `ieclub-backend/QUICK_START.md`

---

## ✅ 已完成的工作（本次会话）

1. ✅ 修复部署脚本develop分支推送BUG
2. ✅ 优化PM2检测逻辑（使用which pm2）
3. ✅ 简化数据库检查（使用pgrep）
4. ✅ **完全禁用Redis检查**（避免断网）
5. ✅ 添加-SkipGitPush参数支持
6. ✅ 删除所有敏感信息日志（密码、token等）
7. ✅ 重启生产环境后端服务
8. ⚠️ 尝试修复小程序密码显示功能（**未生效，需要重做**）
9. ⚠️ 添加验证码登录功能（**需要测试**）

---

## 🚨 特别提醒

1. **Redis检查会导致断网** - 已禁用，长期需要解决方案
2. **小程序密码显示功能完全不工作** - 建议删除重写
3. **登录401问题** - 优先排查request.js拦截器
4. **部署必须使用-SkipGitPush** - 否则可能GitHub连接超时
5. **敏感信息不能日志** - 密码、token等绝对不能console.log

---

**创建时间**: 2025-11-22  
**项目阶段**: 小程序功能完善期  
**下一个AI**: 请优先解决密码显示和登录401问题，然后优化界面！

**祝开发顺利！** 🚀
