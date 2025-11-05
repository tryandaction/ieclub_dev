# IEclub管理员系统部署指南

**版本**: v1.0  
**更新时间**: 2025-11-05

---

## 📋 部署清单

### 后端部署（必须）
- [x] 数据库Schema更新
- [x] 安装依赖包
- [x] 环境变量配置
- [x] 数据库迁移
- [x] 初始化超级管理员
- [x] 启动服务器
- [x] API测试验证

### 前端部署（可选）
- [ ] Web管理后台
- [ ] 小程序管理端

---

## 🚀 快速部署

### 1. 更新代码

```bash
# 拉取最新代码
git pull origin main

# 进入后端目录
cd ieclub-backend
```

### 2. 安装依赖

```bash
# 安装新增的依赖包
npm install speakeasy@^2.0.0

# 或者重新安装所有依赖
npm install
```

### 3. 配置环境变量

编辑 `.env` 文件，添加以下配置：

```env
# JWT密钥（管理员专用）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# 管理员Token过期时间
ADMIN_TOKEN_EXPIRES_IN=2h
ADMIN_REFRESH_TOKEN_EXPIRES_IN=7d

# 登录限制
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=30

# 2FA设置
TWO_FACTOR_ENABLED=true
TWO_FACTOR_REQUIRED_FOR_SUPER_ADMIN=true

# 密码策略
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_MAX_AGE_DAYS=90
```

### 4. 数据库迁移

```bash
# 格式化Prisma schema
npx prisma format

# 生成Prisma Client
npx prisma generate

# 创建并应用迁移
npx prisma migrate dev --name add_admin_system

# 生产环境使用
npx prisma migrate deploy
```

### 5. 初始化超级管理员

```bash
npm run init:admin
```

按提示输入管理员信息：
- 用户名: admin
- 邮箱: admin@yourdomain.com
- 密码: 强密码（符合密码策略）
- 真实姓名: （可选）

### 6. 启动服务器

```bash
# 开发环境
npm run dev

# 生产环境
npm start

# 或使用PM2
pm2 start ecosystem.config.js --env production
```

### 7. 验证部署

运行测试脚本：

```bash
node test-admin-api.js
```

预期输出：
```
🚀 开始测试IEclub管理员API

==================================================
测试1: 管理员登录
==================================================
✅ 管理员登录成功
ℹ️  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ℹ️  管理员: admin
ℹ️  角色: super_admin
ℹ️  权限数量: 27

...

==================================================
测试总结
==================================================
ℹ️  总测试数: 11
✅ 通过: 11
❌ 失败: 0

🎉 所有测试通过！
```

---

## 🔧 详细配置

### 数据库配置

管理员系统新增以下数据表：

1. **admins** - 管理员表
2. **announcements** - 公告表
3. **announcement_views** - 公告查看记录
4. **admin_audit_logs** - 审计日志
5. **user_warnings** - 用户警告
6. **user_bans** - 用户封禁
7. **reports** - 举报表
8. **platform_stats** - 平台统计
9. **system_configs** - 系统配置

查看迁移状态：

```bash
npx prisma migrate status
```

### Nginx配置（可选）

如果使用Nginx反向代理，添加管理员路由：

```nginx
# 管理员API
location /api/admin {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
    
    # 管理员API不缓存
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### PM2配置

更新 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'ieclub-backend',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
      // 管理员系统环境变量
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    },
  }],
};
```

重启PM2：

```bash
pm2 reload ecosystem.config.js --env production
```

---

## 🔒 安全检查清单

部署后务必检查：

- [ ] JWT_SECRET已更改为强随机值
- [ ] JWT_REFRESH_SECRET已更改为强随机值
- [ ] 数据库密码使用强密码
- [ ] 超级管理员密码符合密码策略
- [ ] HTTPS已启用（生产环境）
- [ ] 防火墙规则已配置
- [ ] 审计日志功能正常
- [ ] 备份策略已设置

---

## 📊 监控和维护

### 日志监控

审计日志位置：
- 数据库表: `admin_audit_logs`
- 应用日志: `logs/admin-*.log`

查看最近的管理员操作：

```sql
SELECT 
  a.username,
  al.action,
  al.resourceType,
  al.description,
  al.createdAt
FROM admin_audit_logs al
JOIN admins a ON al.adminId = a.id
ORDER BY al.createdAt DESC
LIMIT 20;
```

### 定期维护

**每日**:
- 检查审计日志异常操作
- 查看登录失败记录

**每周**:
- 审查用户封禁记录
- 检查系统性能指标

**每月**:
- 导出审计日志归档
- 更新管理员权限
- 审核管理员账户

### 备份策略

管理员系统相关的备份内容：

```bash
# 备份管理员表
mysqldump -u root -p ieclub admins > backups/admins_$(date +%Y%m%d).sql

# 备份审计日志
mysqldump -u root -p ieclub admin_audit_logs > backups/audit_logs_$(date +%Y%m%d).sql

# 备份公告
mysqldump -u root -p ieclub announcements > backups/announcements_$(date +%Y%m%d).sql
```

---

## 🚨 故障恢复

### 管理员账户锁定

如果管理员账户被锁定：

```sql
-- 解除账户锁定
UPDATE admins 
SET loginAttempts = 0, lockedUntil = NULL 
WHERE email = 'admin@ieclub.com';
```

### Token失效问题

强制所有管理员重新登录：

```sql
-- 增加所有管理员的tokenVersion
UPDATE admins SET tokenVersion = tokenVersion + 1;
```

### 重置管理员密码

使用脚本重置：

```bash
node scripts/reset-admin-password.js admin@ieclub.com
```

或直接操作数据库：

```sql
-- 生成新密码哈希（使用bcrypt）
-- 然后更新数据库
UPDATE admins 
SET password = '$2a$12$...', 
    passwordChangedAt = NOW() 
WHERE email = 'admin@ieclub.com';
```

---

## 📞 支持和帮助

### 文档资源

- **系统设计文档**: `docs/admin/ADMIN_SYSTEM_DESIGN.md`
- **使用指南**: `docs/admin/ADMIN_USER_GUIDE.md`
- **API文档**: `docs/admin/API_REFERENCE.md`

### 联系方式

- **技术支持**: tech@ieclub.com
- **紧急联系**: +86 400-xxx-xxxx
- **GitHub Issues**: https://github.com/ieclub/ieclub/issues

---

## 📝 变更日志

### v1.0.0 (2025-11-05)

**新增功能**:
- ✨ 完整的管理员认证系统
- ✨ 双因素认证（2FA）
- ✨ 公告管理系统
- ✨ 用户管理功能
- ✨ 数据统计和分析
- ✨ 审计日志系统
- ✨ 权限控制体系

**数据库变更**:
- 新增9个数据表
- 添加索引优化查询性能

**API端点**:
- 新增30+个管理员API接口

---

**文档版本**: v1.0  
**最后更新**: 2025-11-05  
**维护者**: IEclub技术团队

