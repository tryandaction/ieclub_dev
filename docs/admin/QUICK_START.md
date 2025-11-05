# 🎯 IEclub 管理员系统使用指南

> **一个文档搞定所有管理员操作**

---

## ⚡ 快速开始（3步）

### 1️⃣ 启动后端服务
```bash
cd ieclub-backend
npm install
npm run dev
```

### 2️⃣ 初始化管理员账号（首次）
```bash
# 在另一个终端
cd ieclub-backend
node scripts/init-admin.js
```

按提示设置：
- 用户名：`admin@ieclub.com`
- 密码：`Admin123456`（或自定义）

### 3️⃣ 启动前端（可选）
```bash
# 在第三个终端
cd admin-web
npm install
npm run dev
```

访问：http://localhost:3001

---

## 🧪 测试系统

### 运行完整测试
```bash
# 确保后端已启动
cd ieclub-backend
node test-admin-system-complete.js
```

**测试内容**：
- ✅ 管理员登录
- ✅ 仪表盘数据
- ✅ 用户管理
- ✅ 内容审核
- ✅ 公告管理
- ✅ 举报处理
- ✅ 数据统计
- ✅ 审计日志

**成功标准**：所有测试通过，成功率 100%

---

## 📊 管理功能

### 仪表盘
- 查看平台概览数据
- 用户增长趋势
- 内容统计图表

### 用户管理
- 查看所有用户列表
- 查看用户详细信息
- 禁用/启用用户账号
- 重置用户密码

### 内容管理
- 审核话题和帖子
- 删除违规内容
- 置顶优质内容
- 查看举报处理

### 系统公告
- 发布平台公告
- 管理公告显示
- 设置公告优先级

### 数据统计
- 用户活跃度分析
- 内容发布趋势
- 互动数据统计

### 审计日志
- 查看所有管理操作
- 追踪系统变更
- 导出日志记录

---

## 🔑 API接口（开发参考）

### 认证接口
```bash
# 管理员登录
POST /api/admin/auth/login
{
  "username": "admin@ieclub.com",
  "password": "Admin123456"
}

# 获取管理员信息
GET /api/admin/auth/me
Headers: Authorization: Bearer {token}
```

### 数据接口
```bash
# 仪表盘统计
GET /api/admin/stats/dashboard

# 用户列表
GET /api/admin/users?page=1&pageSize=10

# 用户详情
GET /api/admin/users/:userId

# 公告管理
GET /api/admin/announcements
POST /api/admin/announcements
PUT /api/admin/announcements/:id
DELETE /api/admin/announcements/:id
```

完整API文档：[docs/admin/ADMIN_API.md](./docs/admin/ADMIN_API.md)

---

## 🚨 常见问题

### Q1: 测试时提示"连接被拒绝"？
**A**: 确保后端服务已启动
```bash
cd ieclub-backend
npm run dev
# 看到 "Server is running on port 3000" 表示启动成功
```

### Q2: 管理员登录失败？
**A**: 重新初始化管理员账号
```bash
cd ieclub-backend
node scripts/init-admin.js
```

### Q3: 测试部分失败？
**A**: 检查数据库连接
```bash
# 查看 .env 文件中的 DATABASE_URL
# 确保 MySQL 服务正在运行
```

### Q4: 前端无法访问？
**A**: 检查后端 CORS 配置
```javascript
// ieclub-backend/src/server.js 应包含：
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
```

### Q5: 如何添加新管理员？
**A**: 使用管理员命令
```bash
cd ieclub-backend
node scripts/create-admin.js
# 或通过现有管理员在Web界面创建
```

---

## 📁 项目结构

```
IEclub_dev/
├── admin-web/                    # 🎨 管理员前端
│   ├── src/
│   │   ├── pages/                # 页面组件
│   │   ├── components/           # 通用组件
│   │   └── utils/                # 工具函数
│   └── package.json
│
├── ieclub-backend/               # 🔧 后端服务
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js      # 管理员控制器
│   │   │   └── adminStatsController.js # 统计控制器
│   │   ├── routes/
│   │   │   └── adminRoutes.js          # 管理员路由
│   │   └── middleware/
│   │       ├── adminAuth.js            # 管理员认证
│   │       └── permission.js           # 权限检查
│   ├── scripts/
│   │   └── init-admin.js               # 初始化管理员
│   └── test-admin-system-complete.js   # 完整测试
│
└── docs/admin/                   # 📚 管理员文档
    ├── ADMIN_SYSTEM_DESIGN.md    # 系统设计
    ├── ADMIN_API.md              # API文档
    └── ADMIN_USER_GUIDE.md       # 用户指南
```

---

## 🔐 安全注意事项

1. **生产环境必改**
   - 修改默认管理员密码
   - 使用强密码（至少12位，包含大小写字母、数字、特殊字符）
   - 定期更换密码

2. **权限控制**
   - 限制管理员数量
   - 记录所有管理操作
   - 定期审查审计日志

3. **网络安全**
   - 使用 HTTPS
   - 启用 IP 白名单（如需要）
   - 配置访问频率限制

4. **数据备份**
   - 定期备份数据库
   - 保存审计日志
   - 测试恢复流程

---

## 🚀 部署到生产环境

### 1. 配置生产环境变量
```bash
# ieclub-backend/.env.production
NODE_ENV=production
DATABASE_URL=mysql://user:pass@localhost:3306/ieclub_production
JWT_SECRET=your-super-secret-jwt-key
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key
```

### 2. 构建前端
```bash
cd admin-web
npm run build
# 将 dist 目录部署到服务器
```

### 3. 启动后端
```bash
cd ieclub-backend
pm2 start ecosystem.config.js --env production
```

### 4. 配置 Nginx
```nginx
# 管理员后台
location /admin {
    alias /path/to/admin-web/dist;
    try_files $uri $uri/ /admin/index.html;
}

# 管理员API
location /api/admin {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 📞 获取帮助

### 技术文档
- [系统设计文档](./docs/admin/ADMIN_SYSTEM_DESIGN.md)
- [完整API文档](./docs/admin/ADMIN_API.md)
- [用户操作指南](./docs/admin/ADMIN_USER_GUIDE.md)

### 问题反馈
- GitHub Issues: https://github.com/tryandaction/ieclub_dev/issues
- 项目文档: [README.md](./README.md)

---

## ✅ 检查清单

部署前检查：
- [ ] 后端服务正常启动
- [ ] 管理员账号已创建
- [ ] 所有测试通过（100%成功率）
- [ ] 数据库连接正常
- [ ] JWT密钥已配置
- [ ] CORS配置正确
- [ ] 生产环境变量已设置
- [ ] 默认密码已修改

---

**🎉 现在您可以开始使用管理员系统了！**

**记住这3个命令**：
```bash
# 1. 启动服务
cd ieclub-backend && npm run dev

# 2. 初始化管理员（首次）
node scripts/init-admin.js

# 3. 测试系统
node test-admin-system-complete.js
```

---

*最后更新: 2025-11-05*

