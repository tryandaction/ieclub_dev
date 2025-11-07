# 📜 执行脚本目录

> 本目录包含项目中所有可执行的脚本文件，按功能分类管理。

---

## 📂 目录结构

```
scripts/
├── QUICK_START.ps1                      # 🚀 快速启动本地开发环境
├── README.md                            # 本文档
│
├── admin/                               # 👨‍💼 管理员系统脚本
│   └── START_ADMIN_NOW.ps1              # 快速启动管理后台
│
├── deployment/                          # 🚀 部署脚本
│   ├── Deploy-Staging.ps1               # 测试环境部署（标准）⭐
│   ├── Deploy-Staging-Complete.ps1      # 测试环境完整部署
│   ├── Deploy-And-Verify.ps1            # 部署+自动验证
│   ├── Deploy-Production.ps1            # 生产环境部署 ⭐
│   ├── Deploy-Production-OneClick.ps1   # 生产环境一键部署
│   ├── Fix-Staging-All.ps1              # 测试环境一键修复 ⭐
│   ├── Fix-Staging-Env.ps1              # 测试环境配置修复
│   ├── Diagnose-Staging.ps1             # 测试环境诊断
│   └── README.md                        # 部署脚本详细说明
│
├── health-check/                        # 🏥 健康检查脚本
│   ├── Check-Deploy-Ready.ps1           # 部署前检查 ⭐
│   ├── Fix-Server-Complete.ps1          # 服务器完整修复
│   ├── create-test-user.js              # 创建测试用户
│   ├── create-test-user-simple.js       # 创建测试用户（简化版）
│   └── test-login.sh                    # 登录测试
│
└── testing/                             # 🧪 测试脚本
    ├── comprehensive-test.js            # 综合测试
    └── test-email-domain-validation.js  # 邮箱域名验证测试
```

---

## 🚀 快速启动

### 本地开发

启动本地开发环境（后端 + Web前端）：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\QUICK_START.ps1
```

---

## 🚀 部署脚本

### 部署到测试环境

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "功能描述"
```

**参数说明**：
- `-Target all` - 部署全部（前端+后端）
- `-Target web` - 仅部署Web前端
- `-Target backend` - 仅部署后端
- `-Message "描述"` - 部署说明（可选）

### 部署到生产环境

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "版本说明"
```

**⚠️ 注意**：生产环境部署需要输入 `YES` 确认！

---

## 🏥 健康检查脚本

### 部署前检查

在部署前运行，检查代码状态、Git状态等：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\health-check\Check-Deploy-Ready.ps1
```

**检查项目**：
- ✅ Git 状态（是否有未提交更改）
- ✅ 源代码新鲜度
- ✅ 环境配置文件
- ✅ 依赖包完整性

### 测试环境诊断与修复

**诊断测试环境**（仅查看状态，不修复）：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Diagnose-Staging.ps1
```

**一键修复测试环境**（推荐）⭐：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Fix-Staging-All.ps1
# 或自动修复所有问题
.\scripts\deployment\Fix-Staging-All.ps1 -AutoFix
```

**检查并修复项目**：
- ✅ SSH连接
- ✅ 目录结构
- ✅ 配置文件
- ✅ 数据库
- ✅ PM2进程
- ✅ 端口占用
- ✅ 健康检查

---

## 🧪 测试脚本

### 邮箱域名验证测试

测试邮箱域名白名单功能：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
node .\scripts\testing\test-email-domain-validation.js
```

### 综合测试

运行完整的系统测试：

```powershell
cd C:\universe\GitHub_try\IEclub_dev
node .\scripts\testing\comprehensive-test.js
```

---

## 📋 使用建议

### 1. 开发流程

```powershell
# 1. 启动本地开发
.\scripts\QUICK_START.ps1

# 2. 开发并测试功能
# ...

# 3. 提交代码
git add .
git commit -m "功能描述"
git push

# 4. 部署前检查
.\scripts\health-check\Check-Deploy-Ready.ps1

# 5. 部署到测试环境
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 6. 验证测试环境
.\scripts\health-check\Check-Backend-Health.ps1 -Environment staging

# 7. 部署到生产环境
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"

# 8. 验证生产环境
.\scripts\health-check\Check-Backend-Health.ps1 -Environment production
```

### 2. 脚本路径规则

- ✅ **始终从项目根目录执行脚本**
- ✅ **使用相对路径** `.\scripts\...`
- ✅ **不要直接进入 scripts 目录执行**

**正确示例**：
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target all
```

**错误示例**：
```powershell
cd C:\universe\GitHub_try\IEclub_dev\scripts\deployment
.\Deploy-Staging.ps1 -Target all  # ❌ 可能导致路径错误
```

### 3. 权限要求

- Windows PowerShell 脚本需要执行权限
- 首次运行可能需要设置执行策略：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 相关文档

- **部署指南**: [docs/deployment/Deployment_guide.md](../docs/deployment/Deployment_guide.md)
- **快速参考**: [REMIND.md](../REMIND.md)
- **项目总览**: [README.md](../README.md)
- **文档索引**: [docs/INDEX.md](../docs/INDEX.md)

---

## 🔧 脚本维护

### 添加新脚本

1. 确定脚本类型（部署/健康检查/测试）
2. 放入对应的子目录
3. 更新本 README
4. 更新 [docs/INDEX.md](../docs/INDEX.md)

### 脚本命名规范

- 使用 **PascalCase** 命名（如 `Deploy-Staging.ps1`）
- 使用 **连字符** 分隔单词
- 使用 **描述性名称**，清楚表达功能

**示例**：
- ✅ `Deploy-Staging.ps1` - 清晰明了
- ✅ `Check-Backend-Health.ps1` - 描述性强
- ❌ `deploy.ps1` - 太模糊
- ❌ `script1.ps1` - 无意义

---

## 📞 问题反馈

如果脚本执行遇到问题：

1. 检查是否在项目根目录执行
2. 检查 PowerShell 执行策略
3. 查看脚本输出的错误信息
4. 查阅 [REMIND.md](../REMIND.md) 故障排查部分

---

**Last Updated**: 2025-11-07

---

## 🎯 最近更新

### 2025-11-07
- ✅ 清理冗余脚本，精简目录结构
- ✅ 删除临时部署脚本（Direct-Redeploy、Quick-Redeploy等）
- ✅ 删除临时修复脚本（Fix-All-Production-Issues等）
- ✅ 删除临时监控和数据库脚本
- ✅ 保留核心部署、健康检查和测试脚本

### 脚本清理原则
- ✅ **保留**: 标准化的、长期维护的核心脚本
- ❌ **删除**: 临时解决方案、重复功能的脚本

