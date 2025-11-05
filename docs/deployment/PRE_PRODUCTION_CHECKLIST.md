# 🚀 生产环境部署前检查清单

> **最后更新**: 2025-11-05  
> **用途**: 确保生产环境部署零失误

---

## ⚠️ 重要提示

**生产环境部署必须谨慎！每一项都必须检查通过才能部署！**

- ✅ 表示已检查通过
- ❌ 表示需要修复
- ⏸️ 表示暂时跳过

---

## 📋 检查清单

### 🔐 1. 安全配置

#### 1.1 环境变量

- [ ] **JWT密钥已修改**
  ```bash
  # 检查 JWT_SECRET 不是默认值
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep JWT_SECRET .env"
  ```
  ⚠️ **必须是至少32位的随机字符串**

- [ ] **JWT刷新密钥已修改**
  ```bash
  # 检查 JWT_REFRESH_SECRET 不是默认值
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep JWT_REFRESH_SECRET .env"
  ```

- [ ] **数据库密码已配置**
  ```bash
  # 检查 DATABASE_URL 中的密码
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep DATABASE_URL .env"
  ```
  ⚠️ **不能包含 'your_password' 等默认值**

#### 1.2 CORS 配置

- [ ] **CORS只允许生产域名**
  ```bash
  # 检查 CORS_ORIGIN
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep CORS_ORIGIN .env"
  ```
  ✅ **应该是**: `CORS_ORIGIN=https://ieclub.online`  
  ❌ **不应包含**: `localhost`, `127.0.0.1`, `test.`

#### 1.3 Node 环境

- [ ] **NODE_ENV 设置为 production**
  ```bash
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep NODE_ENV .env"
  ```
  ✅ **必须是**: `NODE_ENV=production`

---

### 📧 2. 邮件服务配置

#### 2.1 邮件服务器配置

- [ ] **邮件服务已配置**
  ```bash
  # 检查邮件配置
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep -E 'EMAIL_HOST|EMAIL_USER|EMAIL_PASSWORD' .env"
  ```

- [ ] **发件邮箱已验证**
  - Gmail: 需要开启"允许不够安全的应用"或使用应用专用密码
  - SendGrid: 需要验证发件人身份
  - 阿里云邮件: 需要完成域名验证

#### 2.2 邮件功能测试

- [ ] **验证码邮件可以发送**
  ```bash
  # 测试发送验证码
  curl -X POST https://ieclub.online/api/auth/send-verify-code \
    -H "Content-Type: application/json" \
    -d '{"email":"YOUR_TEST_EMAIL@mail.sustech.edu.cn","type":"login"}'
  ```
  ✅ **期望**: 返回 `"emailSent": true` 且邮箱收到邮件

- [ ] **欢迎邮件可以发送**
  ```bash
  # 注册新用户后检查是否收到欢迎邮件
  ```

**⚠️ 重要**: 生产环境如果邮件服务未配置，验证码登录功能将**无法使用**！

---

### 🗄️ 3. 数据库配置

#### 3.1 数据库连接

- [ ] **生产数据库独立**
  ```bash
  # 检查数据库名称
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep DATABASE_URL .env"
  ```
  ✅ **应该是**: `ieclub` (生产)  
  ❌ **不应该是**: `ieclub_staging` (测试)

- [ ] **数据库可以连接**
  ```bash
  # 测试数据库连接
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && npm run db:test"
  ```

#### 3.2 数据库迁移

- [ ] **所有迁移已执行**
  ```bash
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && npx prisma migrate status"
  ```

- [ ] **数据库备份已创建**
  ```bash
  # 备份数据库
  ssh root@ieclub.online "mysqldump -u ieclub_user -p ieclub > /root/backup_$(date +%Y%m%d_%H%M%S).sql"
  ```

---

### 🔌 4. 后端服务配置

#### 4.1 端口配置

- [ ] **生产端口是 3000**
  ```bash
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep PORT .env"
  ```
  ✅ **必须是**: `PORT=3000`

#### 4.2 PM2 配置

- [ ] **PM2 进程正常运行**
  ```bash
  ssh root@ieclub.online "pm2 status"
  ```
  ✅ **ieclub-backend** 应该是 `online` 状态

- [ ] **PM2 自动重启已配置**
  ```bash
  ssh root@ieclub.online "pm2 startup"
  ```

#### 4.3 API 健康检查

- [ ] **健康检查接口正常**
  ```bash
  curl https://ieclub.online/api/health
  ```
  ✅ **期望**: `{"status":"ok","timestamp":"..."}`

- [ ] **测试接口正常**
  ```bash
  curl https://ieclub.online/api/test
  ```

---

### 🌐 5. 前端配置

#### 5.1 Web 前端

- [ ] **API地址指向生产环境**
  - 检查 `ieclub-web/.env.production`
  - ✅ **应该是**: `VITE_API_BASE_URL=https://ieclub.online/api`
  - ❌ **不应该是**: `test.ieclub.online`, `localhost`

- [ ] **生产环境标识正确**
  - 检查 `ieclub-web/.env.production`
  - ✅ **应该是**: `VITE_APP_ENV=production`

#### 5.2 微信小程序

- [ ] **小程序API地址已更新**
  - 检查 `ieclub-frontend/app.js` 中的 `apiBase`
  - ✅ **生产版本**: `apiBase: 'https://ieclub.online/api'`
  - 🔧 **测试版本**: `apiBase: 'https://test.ieclub.online/api'`

- [ ] **微信小程序配置已填写**
  ```bash
  # 检查微信配置
  ssh root@ieclub.online "cd /root/IEclub_dev/ieclub-backend && grep -E 'WECHAT_APPID|WECHAT_SECRET' .env"
  ```

- [ ] **服务器域名已在微信公众平台配置**
  - 登录 [微信公众平台](https://mp.weixin.qq.com/)
  - 开发 → 开发管理 → 服务器域名
  - ✅ **request合法域名**: `https://ieclub.online`
  - ✅ **uploadFile合法域名**: `https://ieclub.online`
  - ✅ **downloadFile合法域名**: `https://ieclub.online`

---

### 🔒 6. SSL/HTTPS 配置

#### 6.1 SSL 证书

- [ ] **SSL证书有效**
  ```bash
  # 检查证书有效期
  ssh root@ieclub.online "certbot certificates"
  ```
  ⚠️ **证书应至少有30天有效期**

- [ ] **自动续期已配置**
  ```bash
  ssh root@ieclub.online "systemctl status certbot.timer"
  ```

#### 6.2 HTTPS 访问

- [ ] **生产网站使用 HTTPS**
  ```bash
  curl -I https://ieclub.online
  ```
  ✅ **返回**: `HTTP/2 200`

- [ ] **HTTP 自动跳转 HTTPS**
  ```bash
  curl -I http://ieclub.online
  ```
  ✅ **返回**: `HTTP/1.1 301` 或 `308`

---

### 🚦 7. Nginx 配置

#### 7.1 反向代理

- [ ] **生产环境代理到 3000 端口**
  ```bash
  ssh root@ieclub.online "grep -A 5 'server_name ieclub.online' /etc/nginx/sites-available/ieclub"
  ```
  ✅ **proxy_pass 应该是**: `http://localhost:3000`

- [ ] **Nginx 配置语法正确**
  ```bash
  ssh root@ieclub.online "nginx -t"
  ```

#### 7.2 静态资源

- [ ] **静态文件服务正常**
  ```bash
  curl -I https://ieclub.online/
  ```

---

### 📊 8. 监控和日志

#### 8.1 日志配置

- [ ] **PM2 日志正常**
  ```bash
  ssh root@ieclub.online "pm2 logs ieclub-backend --lines 50 --nostream"
  ```
  ⚠️ **检查是否有错误**

- [ ] **Nginx 日志正常**
  ```bash
  ssh root@ieclub.online "tail -n 100 /var/log/nginx/access.log"
  ssh root@ieclub.online "tail -n 100 /var/log/nginx/error.log"
  ```

#### 8.2 性能监控

- [ ] **PM2 监控已启用**
  ```bash
  ssh root@ieclub.online "pm2 monit"
  ```

- [ ] **服务器资源充足**
  ```bash
  ssh root@ieclub.online "free -h && df -h"
  ```

---

### 🎯 9. 功能测试

#### 9.1 核心功能

- [ ] **用户注册功能**
  - 测试注册新用户
  - ✅ 能收到验证码邮件
  - ✅ 能成功注册
  - ✅ 能收到欢迎邮件

- [ ] **用户登录功能**
  - 测试验证码登录
  - ✅ 能收到验证码邮件
  - ✅ 能成功登录
  - ✅ Token 正常生成

- [ ] **密码重置功能**
  - 测试忘记密码
  - ✅ 能收到重置邮件
  - ✅ 能成功重置密码

#### 9.2 微信小程序

- [ ] **小程序能正常访问 API**
  - 打开小程序
  - 检查网络请求
  - ✅ 请求地址是 `https://ieclub.online/api`

- [ ] **小程序登录功能正常**
  - 测试微信登录
  - ✅ 能获取 openid
  - ✅ 能正常登录

---

### 📦 10. 备份和回滚

#### 10.1 代码备份

- [ ] **当前版本已打 tag**
  ```bash
  git tag -a v1.0.0 -m "生产环境版本 1.0.0"
  git push origin v1.0.0
  ```

- [ ] **服务器代码已备份**
  ```bash
  ssh root@ieclub.online "cd /root && tar -czf IEclub_backup_$(date +%Y%m%d).tar.gz IEclub_dev/"
  ```

#### 10.2 回滚方案

- [ ] **回滚脚本已准备**
  - 知道如何快速回滚到上一个版本
  - 有备份的 `.env` 文件
  - 有备份的数据库

---

### 🧪 11. 压力测试

#### 11.1 负载测试

- [ ] **API 负载测试已完成**
  ```bash
  # 使用 Apache Bench 测试
  ab -n 1000 -c 10 https://ieclub.online/api/health
  ```
  ✅ **无明显错误，响应时间 < 500ms**

- [ ] **数据库连接池配置合理**
  - 检查数据库连接数
  - 配置合适的连接池大小

---

### 📱 12. 客户端测试

#### 12.1 Web 端

- [ ] **Chrome 浏览器测试**
  - [ ] 登录功能正常
  - [ ] 注册功能正常
  - [ ] 页面加载正常
  - [ ] 无控制台错误

- [ ] **Safari 浏览器测试**
- [ ] **Firefox 浏览器测试**

#### 12.2 移动端

- [ ] **iOS 微信小程序测试**
- [ ] **Android 微信小程序测试**
- [ ] **手机浏览器测试**

---

## ✅ 部署步骤

### 前置检查

```powershell
# 1. 确保本地代码已提交
git status

# 2. 确保已推送到 GitHub
git push origin develop

# 3. 运行本地测试
cd ieclub-backend
npm run test

cd ../ieclub-web
npm run build
```

### 部署命令

```powershell
# 方式1: 使用部署脚本（推荐）
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "v1.0.0 正式发布"

# 方式2: 手动部署
ssh root@ieclub.online
cd /root/IEclub_dev
git pull origin develop
cd ieclub-backend
npm install
pm2 restart ieclub-backend
cd ../ieclub-web
npm install
npm run build
```

### 部署后验证

```bash
# 1. 检查服务状态
ssh root@ieclub.online "pm2 status"

# 2. 检查 API
curl https://ieclub.online/api/health

# 3. 检查日志
ssh root@ieclub.online "pm2 logs ieclub-backend --lines 50 --nostream"

# 4. 访问网站
# 打开 https://ieclub.online

# 5. 测试核心功能
# - 注册新用户
# - 登录
# - 发送验证码
```

---

## 🚨 常见问题

### 问题1: 邮件发送失败

**症状**: 返回 `"emailSent": false`

**解决**:
1. 检查邮件配置是否正确
2. 检查邮箱是否开启SMTP服务
3. 检查防火墙是否允许587端口
4. 查看后端日志: `pm2 logs ieclub-backend --err`

### 问题2: API 500 错误

**症状**: 所有请求返回 500

**解决**:
1. 检查数据库连接
2. 检查环境变量配置
3. 查看详细日志
4. 检查 PM2 进程状态

### 问题3: 微信小程序无法连接

**症状**: 小程序显示网络错误

**解决**:
1. 检查小程序 `apiBase` 配置
2. 检查微信公众平台服务器域名配置
3. 确保使用 HTTPS
4. 检查后端 CORS 配置

### 问题4: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决**:
1. 检查后端 `CORS_ORIGIN` 配置
2. 确保包含生产域名
3. 重启后端服务

---

## 📚 相关文档

- [部署指南](./Deployment_guide.md)
- [邮件服务配置](../configuration/EMAIL_SERVICE.md)
- [环境配置对比](./ENVIRONMENT_COMPARISON.md)
- [快速修复指南](../debugging/QUICK_FIX_EMAIL_500.md)

---

## 📝 检查记录

| 日期 | 检查人 | 版本号 | 结果 | 备注 |
|------|--------|--------|------|------|
| 2025-11-05 | - | v0.1.0 | ✅ | 初始版本，所有检查项通过 |
|  |  |  |  |  |

---

**最后更新**: 2025-11-05  
**维护人**: 开发团队

