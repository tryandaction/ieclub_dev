# IEClub 项目文档索引

## 📚 文档导航

### 🚀 快速开始
- [项目主README](../README.md) - 项目总体介绍
- [快速启动指南](../QUICK_START.ps1) - 一键启动开发环境
- [后端快速开始](../ieclub-backend/QUICK_START.md) - 后端开发快速上手

### 📖 核心文档
- [重要提醒与操作指南](../REMIND.md) - **必读**，包含所有重要配置和常用命令
- [部署指南](./deployment/Deployment_guide.md) - 详细的部署文档
- [Git代理配置](./GIT_PROXY_SETUP.md) - Git网络问题解决方案

### 🛠️ 运维工具
- [测试环境部署脚本](../Deploy-Staging.ps1) - 部署到测试环境
- [生产环境部署脚本](../Deploy-Production.ps1) - 部署到生产环境
- [后端健康检查脚本](../Check-Backend-Health.ps1) - 诊断后端服务问题
- [部署准备检查](../Check-Deploy-Ready.ps1) - 部署前环境检查

### 🔧 后端相关
- [后端README](../ieclub-backend/README.md) - 后端项目说明
- [变更日志](../ieclub-backend/CHANGELOG.md) - 后端更新记录
- [脚本工具说明](../ieclub-backend/scripts/README.md) - 后端工具脚本

### 🎯 项目结构

```
IEclub_dev/
├── 📄 核心文档
│   ├── README.md              # 项目总览
│   ├── REMIND.md              # 重要提醒（必读）
│   └── LICENSE                # 开源协议
│
├── 📂 docs/                   # 文档目录
│   ├── README.md              # 文档索引（本文件）
│   ├── deployment/            # 部署相关文档
│   │   └── Deployment_guide.md
│   └── GIT_PROXY_SETUP.md     # Git配置
│
├── 🚀 部署脚本
│   ├── Deploy-Staging.ps1         # 测试环境部署
│   ├── Deploy-Production.ps1      # 生产环境部署
│   ├── Check-Backend-Health.ps1   # 后端健康检查
│   └── Check-Deploy-Ready.ps1     # 部署检查
│
├── 💻 后端项目
│   └── ieclub-backend/
│       ├── README.md          # 后端说明
│       ├── QUICK_START.md     # 快速开始
│       ├── CHANGELOG.md       # 更新日志
│       ├── src/               # 源代码
│       ├── scripts/           # 工具脚本
│       └── prisma/            # 数据库
│
├── 🌐 Web前端
│   └── ieclub-web/
│       ├── src/               # 源代码
│       └── dist/              # 构建产物
│
└── 📱 小程序前端
    └── ieclub-frontend/
        ├── pages/             # 页面
        └── api/               # API封装
```

## 🎯 常见任务指南

### 本地开发
```powershell
# 1. 启动开发环境（一键启动）
.\QUICK_START.ps1

# 2. 或者分别启动各服务
cd ieclub-backend
npm run dev

cd ieclub-web  
npm run dev
```

### 部署到测试环境
```powershell
# 部署全部（推荐）
.\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 只部署后端
.\Deploy-Staging.ps1 -Target backend

# 只部署Web前端
.\Deploy-Staging.ps1 -Target web
```

### 部署到生产环境
```powershell
# ⚠️ 谨慎操作！会影响所有用户
.\Deploy-Production.ps1 -Target all -Message "v1.2.0 正式发布"
```

### 故障排查
```powershell
# 检查后端健康状态
.\Check-Backend-Health.ps1 -Environment staging

# 检查部署准备情况
.\Check-Deploy-Ready.ps1
```

## 📝 文档维护说明

### 文档分类
- **核心文档**: 长期维护，包含关键信息
- **操作指南**: 日常使用的命令和流程
- **临时文档**: 问题修复报告等，解决后应删除

### 更新原则
1. **REMIND.md**: 记录最新的配置、问题和解决方案
2. **部署文档**: 保持与实际部署流程同步
3. **临时报告**: 问题解决后及时删除，避免文档冗余

### 文档命名规范
- 使用英文命名，避免中文文件名
- 使用描述性名称，如 `Deployment_guide.md`
- 临时文档应标注日期，如 `BUG_FIX_2025_11_04.md`

## 🔗 相关链接

- **测试环境**: https://test.ieclub.online
- **生产环境**: https://ieclub.online
- **GitHub仓库**: https://github.com/tryandaction/ieclub_dev
- **服务器**: ieclub.online (SSH: port 22)

## 📞 技术支持

如遇到问题：
1. 查看 [REMIND.md](../REMIND.md) 中的故障排查部分
2. 运行诊断脚本 `Check-Backend-Health.ps1`
3. 查看服务日志：`ssh root@ieclub.online "pm2 logs"`

