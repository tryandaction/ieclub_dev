# IEClub 文档索引

> 📚 **更新日期**: 2025-11-06  
> 🎯 **目的**: 快速找到所需文档  
> ✅ **最新修复**: 测试环境部署系统完整修复 ⭐⭐⭐

---

## 📖 根目录文档

### 必读文档

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| **README.md** | 项目介绍和快速开始 | 所有人 ⭐ |
| **REMIND.md** | 快速参考和常用命令 | 所有人 ⭐ |

---

## 📁 分类文档

### 🔧 配置文档 (`docs/configuration/`)

| 文档 | 说明 |
|------|------|
| **ENVIRONMENT_CONFIG.md** | 三环境配置对照表（开发/测试/生产） ⭐ |
| **CLASH_PROXY_SETUP.md** | Clash代理配置（解决SSH连接问题） ⭐⭐ |
| **CONFIGURE_REAL_EMAIL.md** | 邮件服务配置指南 |
| **SECURITY_GUIDE.md** | 安全配置指南 |

### 🧪 测试文档 (`docs/testing/`)

| 文档/脚本 | 说明 |
|-----------|------|
| **README.md** | 测试文档目录和工具使用指南 ⭐ |
| **WEB_FRONTEND_TEST_GUIDE.md** | Web前端详细测试指南 |
| **test-email-service.ps1** | 邮件服务自动化测试脚本 |
| **test-registration-flow.py** | Python自动化测试脚本（推荐） |
| **test-complete-flow.sh** | Bash自动化测试脚本 |

### 🚀 部署文档 (`docs/deployment/`)

| 文档/脚本 | 说明 |
|-----------|------|
| **Deployment_guide.md** | 完整部署指南（开发/测试/生产三环境） ⭐⭐⭐ |
| **WECHAT_MINIPROGRAM_GUIDE.md** | 微信小程序开发与发布完整指南 ⭐⭐ |
| **Deploy_server.sh** | 服务器端部署脚本 |
| **ecosystem.staging.config.js** | PM2测试环境配置 |
| **nginx-staging-addon.conf** | Nginx测试环境配置扩展 |
| **docker-compose.prod.yml** | Docker生产环境配置 |
| **nginx-dual-platform.conf** | Nginx双平台配置 |
| **ieclub-backend.service** | Systemd服务配置 |
| **start-staging.sh** | 测试环境启动脚本 |

### 🔧 执行脚本 (`scripts/`)

| 脚本 | 说明 |
|------|------|
| **QUICK_START.ps1** | 一键启动本地开发环境 ⭐⭐⭐ |
| **admin/START_ADMIN_NOW.ps1** | 一键启动管理后台系统 ⭐⭐⭐ |
| **deployment/README.md** | 部署脚本使用指南 ⭐⭐⭐ |
| **deployment/Deploy-Staging.ps1** | 测试环境部署脚本 ⭐⭐ |
| **deployment/Deploy-Production.ps1** | 生产环境部署脚本 ⭐⭐ |
| **health-check/README.md** | 测试工具文档和使用指南 ⭐ |
| **health-check/Check-Network.ps1** | 网络连接诊断（部署前必查） ⭐⭐⭐ |
| **health-check/Check-Backend-Health.ps1** | 后端健康检查脚本 |
| **health-check/Check-Deploy-Ready.ps1** | 部署前检查脚本 |
| **health-check/create-test-user-simple.js** | 创建测试用户脚本 ⭐ |
| **health-check/test-login.sh** | 登录功能自动化测试脚本 ⭐ |

### 📦 归档文档 (`docs/archive/`)

历史文档和已完成任务的总结：

| 文档 | 说明 |
|------|------|
| **COMPLETE_FIX_SUMMARY.md** | 2025-11-05 修复总结 |
| **SYSTEM_STATUS_REPORT.md** | 系统状态报告 |
| **NEXT_STEPS.md** | 下一步操作清单 |
| **DOCUMENTATION_INDEX.md** | 旧版文档索引 |
| **CLEANUP_SUMMARY.md** | 清理总结 |


### 👥 管理员系统文档 (`docs/admin/`)

| 文档 | 说明 |
|------|------|
| **README.md** | 管理员系统总览和导航 ⭐⭐⭐ |
| **QUICK_START.md** | 快速启动指南 ⭐⭐⭐ |
| **ADMIN_SYSTEM_DESIGN.md** | 完整系统设计文档 ⭐⭐ |
| **ADMIN_USER_GUIDE.md** | 管理员操作手册 ⭐⭐ |


---

## 🎯 快速导航

### 我想...

#### 🚀 开始使用项目
→ 查看 **README.md**

#### 📝 快速查找命令
→ 查看 **REMIND.md**

#### ✉️ 配置邮件服务
→ 查看 **docs/configuration/CONFIGURE_REAL_EMAIL.md**

#### 🔧 解决Clash代理问题
→ 查看 **docs/configuration/CLASH_PROXY_SETUP.md** ⭐⭐  
→ 运行 `.\scripts\health-check\Check-Network.ps1` 诊断网络

#### 🧪 测试系统功能
→ 查看 **docs/testing/README.md** ⭐  
→ 运行 `bash scripts/health-check/test-login.sh production`

#### 🚀 部署到服务器
→ 查看 **docs/deployment/Deployment_guide.md** - 完整部署指南 ⭐⭐⭐  
→ 测试环境: **scripts/deployment/Deploy-Staging.ps1** ⭐⭐  
→ 生产环境: **scripts/deployment/Deploy-Production.ps1** ⭐⭐⭐

#### 📱 发布微信小程序
→ 查看 **docs/deployment/WECHAT_MINIPROGRAM_GUIDE.md** ⭐⭐⭐  
→ 包含开发者工具配置、调试、审核、发布全流程

#### ⚙️ 查看环境配置
→ 查看 **docs/configuration/ENVIRONMENT_CONFIG.md** ⭐  
→ 快速对比开发/测试/生产环境的配置差异

#### 📧 测试邮件服务
→ 运行 **.\docs\testing\test-email-service.ps1** ⭐  
→ 自动测试所有环境的邮件服务

#### 🔍 查看历史记录
→ 查看 **docs/archive/** 目录

---

## 📂 目录结构

```
IEclub_dev/
├── README.md                    # 项目介绍
├── REMIND.md                    # 快速参考
│
├── docs/                        # 文档目录
│   ├── INDEX.md                 # 本文档
│   │
│   ├── configuration/           # 配置文档
│   │   ├── CONFIGURE_REAL_EMAIL.md
│   │   └── SENDGRID_SETUP_COMPLETE.md
│   │
│   ├── testing/                 # 测试文档
│   │   ├── WEB_FRONTEND_TEST_GUIDE.md
│   │   ├── test-complete-flow.sh
│   │   └── test-registration-flow.py
│   │
│   ├── deployment/              # 部署文档
│   │   ├── Deployment_guide.md
│   │   └── ...
│   │
│   └── archive/                 # 归档文档
│       ├── COMPLETE_FIX_SUMMARY.md
│       └── ...
│
├── scripts/                     # 执行脚本
│   ├── QUICK_START.ps1
│   ├── deployment/              # 部署脚本
│   │   ├── Deploy-Production.ps1
│   │   ├── Deploy-Staging.ps1
│   │   └── ...
│   ├── health-check/            # 健康检查
│   │   ├── Check-Backend-Health.ps1
│   │   ├── Check-Deploy-Ready.ps1
│   │   └── ...
│   └── testing/                 # 测试脚本
│       └── ...
│
├── ieclub-backend/              # 后端代码
├── ieclub-frontend/             # 小程序代码
├── ieclub-web/                  # Web前端代码
└── scripts/                     # 工具脚本
```

---

## 🔄 文档更新记录

| 日期 | 更新内容 |
|------|---------|
| 2025-11-06 | ✅ 清理冗余文档，精简文档结构 |
| 2025-11-06 | ✅ 修复测试环境部署配置 |
| 2025-11-05 | ✅ 完成认证系统优化和测试 |
| 2025-11-05 | ✅ 添加邮件服务自动化测试 |
| 2025-11-03 | 创建部署和配置文档 |

---

## 💡 文档编写规范

如需添加新文档，请遵循以下规范：

1. **配置类文档** → `docs/configuration/`
2. **测试类文档** → `docs/testing/`
3. **部署类文档** → `docs/deployment/`
4. **已完成任务** → `docs/archive/`
5. **通用文档** → `docs/`

详细规范请查看: **docs/DOCUMENTATION_GUIDE.md**

---

**找不到需要的文档？** 请查看 **REMIND.md** 或联系项目维护者。

