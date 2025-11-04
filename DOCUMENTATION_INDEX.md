# 📚 IEClub 文档总览

> **最后更新**: 2025-11-04  
> **文档总数**: 12个核心文档

---

## 🎯 快速导航

### 新手必读（按顺序）
1. [README.md](README.md) - 项目介绍和技术架构
2. [REMIND.md](REMIND.md) - ⚠️ **重要提醒和快速参考**
3. [ieclub-backend/QUICK_START.md](ieclub-backend/QUICK_START.md) - 后端开发快速开始

### 遇到问题？
- **部署问题** → [REMIND.md](REMIND.md) 故障排查部分
- **Git网络问题** → [docs/GIT_PROXY_SETUP.md](docs/GIT_PROXY_SETUP.md)
- **后端服务异常** → 运行 `.\Check-Backend-Health.ps1`

### 部署相关
- **测试环境部署** → 运行 `.\Deploy-Staging.ps1 -Target all`
- **生产环境部署** → 运行 `.\Deploy-Production.ps1 -Target all`
- **详细部署指南** → [docs/deployment/Deployment_guide.md](docs/deployment/Deployment_guide.md)

---

## 📂 完整文档列表

### 根目录核心文档
```
📄 README.md                    - 项目总览、技术架构、快速开始
📄 REMIND.md                    - 重要提醒、常用命令、故障排查
📄 DOCUMENTATION_INDEX.md       - 文档总览（本文件）
```

### docs/ 文档目录
```
docs/
├── 📄 README.md                       - 文档导航索引
├── 📄 DOCUMENTATION_GUIDE.md          - 文档维护规范
├── 📄 GIT_PROXY_SETUP.md              - Git代理配置指南
├── 📄 CLEANUP_SUMMARY.md              - 文档整理总结
└── deployment/
    └── 📄 Deployment_guide.md         - 完整部署指南
```

### ieclub-backend/ 后端文档
```
ieclub-backend/
├── 📄 README.md                       - 后端项目说明
├── 📄 QUICK_START.md                  - 快速开始指南
├── 📄 CHANGELOG.md                    - 变更日志
├── scripts/
│   └── 📄 README.md                   - 脚本工具说明
└── prisma/migrations/20251101_add_checkin_fields/
    └── 📄 README.md                   - 数据库迁移说明
```

---

## 🗂️ 按用途分类

### 🚀 入门文档
| 文档 | 用途 | 目标读者 |
|------|------|----------|
| [README.md](README.md) | 项目介绍、技术架构 | 所有人 |
| [REMIND.md](REMIND.md) | 快速参考、常用命令 | 开发&运维 |
| [ieclub-backend/QUICK_START.md](ieclub-backend/QUICK_START.md) | 后端开发起步 | 后端开发 |

### 📖 参考文档
| 文档 | 用途 | 目标读者 |
|------|------|----------|
| [docs/README.md](docs/README.md) | 文档导航 | 所有人 |
| [ieclub-backend/README.md](ieclub-backend/README.md) | 后端详细说明 | 后端开发 |
| [ieclub-backend/scripts/README.md](ieclub-backend/scripts/README.md) | 脚本工具说明 | 运维&开发 |

### 🔧 配置指南
| 文档 | 用途 | 目标读者 |
|------|------|----------|
| [docs/GIT_PROXY_SETUP.md](docs/GIT_PROXY_SETUP.md) | Git代理配置 | 遇到网络问题者 |
| [docs/deployment/Deployment_guide.md](docs/deployment/Deployment_guide.md) | 部署详细步骤 | 部署人员 |

### 📝 维护文档
| 文档 | 用途 | 目标读者 |
|------|------|----------|
| [docs/DOCUMENTATION_GUIDE.md](docs/DOCUMENTATION_GUIDE.md) | 文档编写规范 | 文档维护者 |
| [docs/CLEANUP_SUMMARY.md](docs/CLEANUP_SUMMARY.md) | 文档整理记录 | 项目维护者 |
| [ieclub-backend/CHANGELOG.md](ieclub-backend/CHANGELOG.md) | 变更历史 | 所有人 |

---

## 🎯 常见任务快速查找

### 我想...

#### 开始开发
→ 先看 [README.md](README.md)  
→ 后端开发看 [ieclub-backend/QUICK_START.md](ieclub-backend/QUICK_START.md)  
→ 常用命令看 [REMIND.md](REMIND.md)

#### 部署到测试环境
→ 快速部署：运行 `.\Deploy-Staging.ps1 -Target all -Message "描述"`  
→ 详细步骤：[docs/deployment/Deployment_guide.md](docs/deployment/Deployment_guide.md)  
→ 遇到问题：[REMIND.md](REMIND.md) 故障排查

#### 部署到生产环境
→ 快速部署：运行 `.\Deploy-Production.ps1 -Target all -Message "版本号"`  
→ 部署前必读：[REMIND.md](REMIND.md) 部署检查清单  
→ 详细步骤：[docs/deployment/Deployment_guide.md](docs/deployment/Deployment_guide.md)

#### 诊断后端问题
→ 运行健康检查：`.\Check-Backend-Health.ps1 -Environment staging`  
→ 查看故障排查：[REMIND.md](REMIND.md) 故障排查部分  
→ 查看日志：`ssh root@ieclub.online "pm2 logs staging-backend"`

#### Git连接失败
→ 完整解决方案：[docs/GIT_PROXY_SETUP.md](docs/GIT_PROXY_SETUP.md)  
→ 快速修复：`git config --global --unset http.proxy`

#### 使用后端工具脚本
→ 脚本说明：[ieclub-backend/scripts/README.md](ieclub-backend/scripts/README.md)  
→ 数据库初始化：`npm run init-db`  
→ 权限初始化：`npm run init-rbac`

#### 编写或更新文档
→ 编写规范：[docs/DOCUMENTATION_GUIDE.md](docs/DOCUMENTATION_GUIDE.md)  
→ 文档结构：[docs/README.md](docs/README.md)  
→ 更新后同步到索引

---

## 📊 文档质量指标

### 文档完整性
- ✅ 项目介绍文档完整
- ✅ 开发指南齐全
- ✅ 部署文档详细
- ✅ 故障排查完善
- ✅ 维护规范建立

### 文档可用性
- ✅ 多层次索引
- ✅ 按用途分类
- ✅ 快速查找指南
- ✅ 示例完整
- ✅ 及时更新

### 文档优化历史
- **2025-11-04**: 大规模整理，删除30+临时文档，精简70%
- **2025-11-04**: 建立文档维护规范
- **2025-11-04**: 创建多层次索引系统

---

## 🔄 文档维护

### 更新频率
- **REMIND.md**: 每次重要配置变更后
- **CHANGELOG.md**: 每次版本发布
- **部署文档**: 部署流程变更后
- **其他文档**: 根据实际需要

### 维护原则
1. 保持简洁 - 只保留有用的文档
2. 及时清理 - 临时文档问题解决后删除
3. 持续更新 - 文档与代码同步
4. 易于查找 - 维护清晰的索引

### 参与维护
文档维护规范详见：[docs/DOCUMENTATION_GUIDE.md](docs/DOCUMENTATION_GUIDE.md)

---

## 📞 帮助与支持

### 文档相关问题
- 创建Issue描述问题
- 提交PR改进文档
- 联系团队成员

### 技术问题
- 查看 [REMIND.md](REMIND.md) 故障排查
- 查看 [ieclub-backend/CHANGELOG.md](ieclub-backend/CHANGELOG.md) 了解最近变更
- 运行诊断工具 `Check-Backend-Health.ps1`

---

**文档索引最后更新**: 2025-11-04  
**维护者**: IEClub开发团队

