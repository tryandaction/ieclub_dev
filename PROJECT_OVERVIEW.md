# IEClub 项目总览

> **最后更新**: 2025-10-29  
> **当前版本**: V2.0  
> **开发阶段**: 设计完成，准备开发

---

## 📚 文档导航

### 核心文档
1. **[README.md](README.md)** - 项目介绍与快速开始
2. **[PRODUCT_DESIGN_V1.md](PRODUCT_DESIGN_V1.md)** - 完整产品设计文档
3. **[DEVELOPMENT_ROADMAP_V1.md](DEVELOPMENT_ROADMAP_V1.md)** - V1.0开发路线图

### 技术文档
- **[Deployment_guide.md](Deployment_guide.md)** - 部署指南
- **[VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)** - 系统验证报告
- **[DEPLOYMENT_FIX_LOG.md](DEPLOYMENT_FIX_LOG.md)** - 部署问题修复日志

### 参考文档
- **[ieclub_v2_demo.tsx](ieclub_v2_demo.tsx)** - 设计原型（保留参考）

---

## 🎯 项目定位

**IEClub：创造线上线下交互的无限可能！**

我们现阶段将立足南科大，打造线上线下的学术交流空间与分享、交流、互助的氛围，让南科学子在遇到学业、科研、项目以及创业等方面问题的时候都能想到IEClub。

---

## ✨ 核心功能

### 1. 话题广场
- 🎤 **我来讲** - 知识分享、技能教学
- 👂 **想听** - 学习需求、求助辅导
- 🚀 **项目** - 创业/科研项目招募
- 📤 **分享** - PDF/PPT/公众号/B站视频

### 2. 社区
- 👥 用户发现与关注
- 🏆 多维度排行榜
- 🎯 智能技能匹配
- 💬 私信聊天

### 3. 活动管理
- 📅 活动发布
- 👥 报名管理
- ✅ 签到系统
- 📊 数据统计

### 4. 其他
- 🔐 南科大邮箱认证
- 💬 消息通知系统
- 🔍 智能搜索
- 🏅 成长体系（等级/积分/成就）

---

## 🏗️ 技术架构

```
         用户端
    ┌──────┴──────┐
浏览器Web     微信小程序
    │             │
┌────────┐   ┌────────┐
│React   │   │原生    │
│Vite    │   │WXML   │
└───┬────┘   └───┬────┘
    │            │
    └─────┬──────┘
          │
   Node.js + MySQL
```

### 前端
- **网页**: React 18 + Vite + Tailwind CSS
- **小程序**: 原生 WXML + WXSS + JS

### 后端
- **框架**: Node.js 18+ + Express
- **数据库**: MySQL 8.0 + Redis 7.0
- **ORM**: Prisma
- **认证**: JWT

---

## 📅 开发计划

### V1.0开发周期（15周）

```
Week 1-2:   认证系统（注册/登录/密码管理）
Week 3-6:   核心功能（话题/社区/发布/个人中心）
Week 7-9:   互动系统（消息/评论/私信）
Week 10-11: 活动管理（发布/报名/签到）
Week 12-13: 搜索推荐（智能搜索/个性化推荐）
Week 14-15: 测试上线（全面测试/性能优化）
```

### 当前状态
✅ 产品设计完成  
✅ 技术选型确定  
✅ 项目架构搭建  
⏳ 准备开始开发（阶段一：认证系统）

---

## 📂 项目结构

```
IEclub_dev/
├── ieclub-web/           # 网页版（React）
├── ieclub-frontend/      # 小程序版（原生）
├── ieclub-backend/       # 后端服务
│
├── PRODUCT_DESIGN_V1.md      # 产品设计
├── DEVELOPMENT_ROADMAP_V1.md # 开发路线图
├── README.md                  # 项目说明
├── Deploy.ps1                 # 部署脚本
└── Deploy_server.sh           # 服务器脚本
```

---

## 🚀 快速开始

### 本地开发

```bash
# 网页版
cd ieclub-web
npm install
npm run dev

# 小程序版
# 使用微信开发者工具打开 ieclub-frontend

# 后端
cd ieclub-backend
npm install
npm run dev
```

### 一键部署

```powershell
# 部署所有
.\Deploy.ps1 -Target "all"

# 仅部署网页
.\Deploy.ps1 -Target "web"
```

---

## 🎯 V1.0目标

### 用户指标
- 注册用户: 500+
- 日活用户: 100+
- 发布话题: 200+
- 举办活动: 20+

### 技术指标
- 页面加载: < 2秒
- API响应: < 200ms
- 系统可用性: > 99.5%
- 并发支持: 100+用户

---

## 👥 团队

- 后端工程师 (2人)
- 前端工程师 (2人)
- UI/UX设计师 (1人)
- 产品经理 (1人)
- 运营 (1人)

---

## 📞 联系方式

- **官网**: https://ieclub.online
- **GitHub**: https://github.com/tryandaction/ieclub_dev
- **反馈**: [Issues](https://github.com/tryandaction/ieclub_dev/issues)

---

**让我们一起创造IEClub！** 🚀

