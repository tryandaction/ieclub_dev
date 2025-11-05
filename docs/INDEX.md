# IEClub 文档索引

> 📚 **更新日期**: 2025-11-05  
> 🎯 **目的**: 快速找到所需文档  
> ✅ **最新修复**: 部署脚本路径和语法错误已修复

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
| **CONFIGURE_REAL_EMAIL.md** | 邮件服务配置指南 |
| **SENDGRID_SETUP_COMPLETE.md** | SendGrid 配置完成报告 |

### 🧪 测试文档 (`docs/testing/`)

| 文档/脚本 | 说明 |
|-----------|------|
| **WEB_FRONTEND_TEST_GUIDE.md** | Web前端详细测试指南 |
| **test-complete-flow.sh** | Bash自动化测试脚本 |
| **test-registration-flow.py** | Python自动化测试脚本（推荐） |

### 🚀 部署文档 (`docs/deployment/`)

| 文档/脚本 | 说明 |
|-----------|------|
| **Deployment_guide.md** | 完整部署指南 |
| **Deploy_server.sh** | 服务器部署脚本 |
| **ecosystem.staging.config.js** | PM2测试环境配置 |
| **docker-compose.prod.yml** | Docker生产环境配置 |
| **nginx-dual-platform.conf** | Nginx双平台配置 |
| **ieclub-backend.service** | Systemd服务配置 |

### 🔧 执行脚本 (`scripts/`)

| 脚本 | 说明 |
|------|------|
| **QUICK_START.ps1** | 一键启动本地开发环境 |
| **deployment/Deploy-Production.ps1** | 生产环境部署脚本 |
| **deployment/Deploy-Staging.ps1** | 测试环境部署脚本 |
| **health-check/Check-Backend-Health.ps1** | 后端健康检查脚本 |
| **health-check/Check-Deploy-Ready.ps1** | 部署前检查脚本 |
| **start-staging.sh** | 测试环境启动脚本 |

### 📦 归档文档 (`docs/archive/`)

历史文档和已完成任务的总结：

| 文档 | 说明 |
|------|------|
| **COMPLETE_FIX_SUMMARY.md** | 2025-11-05 修复总结 |
| **SYSTEM_STATUS_REPORT.md** | 系统状态报告 |
| **NEXT_STEPS.md** | 下一步操作清单 |
| **DOCUMENTATION_INDEX.md** | 旧版文档索引 |
| **CLEANUP_SUMMARY.md** | 清理总结 |

### 📚 其他文档 (`docs/`)

| 文档 | 说明 |
|------|------|
| **DOCUMENTATION_GUIDE.md** | 文档编写指南 |
| **GIT_PROXY_SETUP.md** | Git代理设置 |
| **DEPLOYMENT_FIX_2025_11_05.md** | 部署脚本修复记录 (2025-11-05) |
| **CLEANUP_REPORT_2025_11_05.md** | 代码清理报告 (2025-11-05) |

---

## 🎯 快速导航

### 我想...

#### 🚀 开始使用项目
→ 查看 **README.md**

#### 📝 快速查找命令
→ 查看 **REMIND.md**

#### ✉️ 配置邮件服务
→ 查看 **docs/configuration/CONFIGURE_REAL_EMAIL.md**

#### 🧪 测试系统功能
→ 查看 **docs/testing/WEB_FRONTEND_TEST_GUIDE.md**  
→ 运行 `python3 docs/testing/test-registration-flow.py`

#### 🚀 部署到服务器
→ 查看 **docs/deployment/Deployment_guide.md**  
→ 运行 **scripts/deployment/Deploy-Staging.ps1**

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
| 2025-11-05 | 重新组织文档结构，创建分类目录 |
| 2025-11-05 | 归档历史修复文档 |
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

