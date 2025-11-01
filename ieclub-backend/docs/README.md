# IEclub 后端文档中心

欢迎来到 IEclub 后端文档中心！这里汇集了所有后端相关的技术文档。

---

## 📚 文档导航

### 🚀 快速开始

- **项目 README** - [../README.md](../../README.md)  
  项目概览、快速开始、技术架构

- **API 快速参考** - [api/API_QUICK_REFERENCE.md](api/API_QUICK_REFERENCE.md)  
  常用 API 接口速查手册

### 📖 完整指南

#### 管理指南 (guides/)

- **RBAC 权限管理指南** - [guides/RBAC_GUIDE.md](guides/RBAC_GUIDE.md)  
  完整的角色权限管理系统文档，包括初始化、API、最佳实践

- **备份系统指南** - [guides/BACKUP_GUIDE.md](guides/BACKUP_GUIDE.md)  
  数据备份与恢复系统使用指南

#### 管理后台 (admin/)

- **管理后台使用指南** - [admin/ADMIN_GUIDE.md](admin/ADMIN_GUIDE.md)  
  管理员功能详解：用户管理、内容审核、系统统计等

#### API 文档 (api/)

- **API 快速参考** - [api/API_QUICK_REFERENCE.md](api/API_QUICK_REFERENCE.md)  
  所有 API 接口的快速参考

- **完整 API 文档** - [../../docs/API_REFERENCE.md](../../docs/API_REFERENCE.md)  
  详细的 API 接口文档（根目录 docs）

---

## 🗂️ 文档结构

```
ieclub-backend/docs/
├── README.md                        # 本文件 - 文档索引
├── guides/                          # 系统指南
│   ├── RBAC_GUIDE.md               # RBAC 权限管理指南
│   └── BACKUP_GUIDE.md             # 备份系统指南
├── admin/                           # 管理后台文档
│   └── ADMIN_GUIDE.md              # 管理后台使用指南
└── api/                             # API 文档
    └── API_QUICK_REFERENCE.md      # API 快速参考
```

---

## 🎯 根目录文档

项目根目录的 `docs/` 文件夹包含全项目文档：

```
docs/
├── API_REFERENCE.md                 # 完整 API 文档
├── deployment/                      # 部署相关
│   └── Deployment_guide.md         # 部署指南
├── development/                     # 开发相关
│   ├── DEVELOPMENT_PLAN.md         # 开发规划
│   ├── PROJECT_ARCHITECTURE.md     # 项目架构
│   └── SECURITY_AND_FUNCTIONALITY_CHECKLIST.md
└── features/                        # 功能说明
    ├── NEW_FEATURES.md             # 新功能介绍
    └── CREDIT_SYSTEM_SUMMARY.md    # 积分系统总结
```

---

## 🔍 按需求查找文档

### 我想了解...

#### 系统架构和技术栈
👉 [项目架构文档](../../docs/development/PROJECT_ARCHITECTURE.md)  
👉 [主 README](../../README.md)

#### API 接口调用
👉 [API 快速参考](api/API_QUICK_REFERENCE.md) - 快速查阅  
👉 [完整 API 文档](../../docs/API_REFERENCE.md) - 详细说明

#### 用户权限管理
👉 [RBAC 权限管理指南](guides/RBAC_GUIDE.md)  
👉 [管理后台指南](admin/ADMIN_GUIDE.md) - 第9节

#### 数据备份与恢复
👉 [备份系统指南](guides/BACKUP_GUIDE.md)  
👉 [管理后台指南](admin/ADMIN_GUIDE.md) - 第10节

#### 管理后台功能
👉 [管理后台使用指南](admin/ADMIN_GUIDE.md)

#### 部署相关
👉 [部署指南](../../docs/deployment/Deployment_guide.md)

#### 新功能和更新
👉 [新功能介绍](../../docs/features/NEW_FEATURES.md)  
👉 [开发规划](../../docs/development/DEVELOPMENT_PLAN.md)

#### 积分和等级系统
👉 [积分系统总结](../../docs/features/CREDIT_SYSTEM_SUMMARY.md)

#### 安全和功能检查
👉 [安全检查清单](../../docs/development/SECURITY_AND_FUNCTIONALITY_CHECKLIST.md)

---

## 🛠️ 开发工具

### 数据库管理

```bash
# 查看数据库状态
npm run db:status

# 运行迁移
npm run db:migrate

# 重置数据库
npm run db:reset

# 生成 Prisma Client
npm run db:generate
```

### 初始化脚本

```bash
# 初始化数据库
node scripts/init-db.js

# 初始化 RBAC 系统
node scripts/init-rbac.js

# 为用户分配角色
node scripts/assign-role.js <email> <role>

# 填充测试数据
npm run db:seed
```

### 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

---

## 📝 文档编写规范

### Markdown 规范

1. **标题层级**: 使用 `#` 到 `######`，不跳级
2. **代码块**: 指定语言类型
   ```javascript
   // 示例代码
   ```
3. **链接**: 使用相对路径
4. **列表**: 使用 `-` 或数字
5. **表格**: 使用标准 Markdown 表格格式

### 文档结构

每个指南文档应包含：

1. **概述** - 简要介绍
2. **快速开始** - 最简使用方式
3. **详细说明** - 完整功能介绍
4. **API 参考** - 相关接口
5. **最佳实践** - 推荐做法
6. **故障排除** - 常见问题
7. **相关文档** - 其他参考

---

## 🤝 贡献文档

### 如何更新文档

1. 找到对应的 Markdown 文件
2. 编辑内容
3. 遵循文档规范
4. 更新"最后更新"时间
5. 提交 Pull Request

### 新增文档

1. 确定文档类型（指南/管理/API）
2. 放在相应目录下
3. 更新本 README 的导航
4. 在相关文档中添加链接

---

## 📞 获取帮助

### 遇到问题？

1. 📖 先查阅相关文档
2. 🔍 搜索 [GitHub Issues](https://github.com/tryandaction/ieclub_dev/issues)
3. 💬 在 Issues 中提问
4. 📧 联系技术支持: support@ieclub.com

### 文档问题反馈

如果发现文档错误或需要改进：
- 📝 提交 Issue
- 🔧 直接提交 PR
- 📧 发送邮件: docs@ieclub.com

---

## 🔗 快速链接

### 常用文档
- [主 README](../../README.md)
- [API 快速参考](api/API_QUICK_REFERENCE.md)
- [RBAC 指南](guides/RBAC_GUIDE.md)
- [管理后台指南](admin/ADMIN_GUIDE.md)

### 外部资源
- [Prisma 文档](https://www.prisma.io/docs)
- [Express 文档](https://expressjs.com/)
- [Node.js 文档](https://nodejs.org/docs/latest/api/)
- [MySQL 文档](https://dev.mysql.com/doc/)

---

## 📊 文档统计

| 类型 | 数量 | 说明 |
|------|------|------|
| 系统指南 | 2 | RBAC、备份 |
| 管理文档 | 1 | 管理后台 |
| API 文档 | 2 | 快速参考、完整文档 |
| 开发文档 | 3 | 架构、规划、检查清单 |
| 功能文档 | 2 | 新功能、积分系统 |
| 部署文档 | 1 | 部署指南 |

**总计**: 11+ 份文档

---

**最后更新**: 2025-10-31  
**文档版本**: v2.0

---

<div align="center">

**📚 持续完善中 | 欢迎贡献 📚**

Made with ❤️ by IEClub Team

</div>

