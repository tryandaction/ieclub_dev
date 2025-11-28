# 🤖 AI开发助手提示词 - IEclub项目

> **交接时间**: 2025-11-28 22:00  
> **当前版本**: V4.2 - PWA支持 🚀  
> **代码状态**: ✅ 生产环境运行稳定  
> **Git分支**: main (生产)  
> **部署状态**: ✅ 已部署  
> **最新工作**: PWA离线访问、发布功能完善、活动签到完善

---

## 🎯 你的核心任务

你是IEclub社区平台的开发AI助手，负责：
1. **双端同步开发** - 确保小程序(ieclub-frontend)与网页(ieclub-web)功能完全一致
2. **真实数据优先** - 不使用 mock 数据，所有功能必须连接后端真实数据
3. **字段兼容性** - 注意后端返回字段名，如 `topicType` vs `type`，`author` vs `user`
4. **错误处理** - 使用可选链(?.)和默认值防止 undefined 错误
5. **部署验证** - 每次修改后部署并验证生产环境

---

## 📁 项目结构

```
IEclub_dev/
├── ieclub-web/          # React网站前端 (Vite + React 18)
├── ieclub-frontend/     # 微信原生小程序
├── ieclub-backend/      # Node.js后端 (Express + Prisma)
├── admin-web/           # 管理后台 (React + TypeScript)
├── scripts/             # 部署和工具脚本
└── docs/                # 项目文档
```

### 技术栈

| 模块 | 技术 |
|------|------|
| 网页前端 | React 18 + Vite + TailwindCSS + Zustand |
| 小程序 | 微信原生开发 |
| 后端 | Express + Prisma ORM + MySQL |
| 缓存 | Redis |
| 部署 | PM2 + Nginx |

---

## 🎉 最新完成功能 (2025-11-28)

### ✅ V4.2 PWA支持
- **Service Worker**: vite-plugin-pwa 自动生成
- **离线缓存**: API网络优先、图片缓存优先
- **桌面安装**: Web App Manifest 配置
- **更新提示**: PWAPrompt.jsx 组件

**关键文件**:
- `ieclub-web/vite.config.js` - PWA插件配置
- `ieclub-web/src/components/PWAPrompt.jsx` - 更新/安装提示

### ✅ V4.1 发布功能完善
**四大发布类型**:
| 类型 | 专属字段 |
|------|---------|
| 我想听 | 紧急程度(4级) |
| 我来讲 | 目标听众、成团人数 |
| 项目 | 阶段、角色、技能、联系方式 |
| 分享 | 资源类型(6种)、下载链接、提取码 |

**数据库新增字段**:
- `urgency` - 紧急程度
- `resourceType` - 资源类型
- `downloadLink` - 下载链接
- `extractCode` - 提取码

### ✅ V4.0 小组圈子功能
**数据模型**: Group, GroupMember, GroupTopic, GroupJoinRequest 等8张表

**API端点**: 13个（创建/加入/退出/话题发布/成员管理）

**前端页面**:
- 网页: `Groups.jsx`, `GroupDetail.jsx`
- 小程序: `pages/groups/`, `pages/group-detail/`

### ✅ 活动管理完善
- **签到二维码**: qrcode库生成，24小时有效
- **活动提醒**: node-cron定时任务，30分钟前提醒
- **签到统计**: 报名率、签到率、参与者列表

---

## 📊 功能模块清单

### 核心功能 ✅ 已完成
| 模块 | 网页端 | 小程序 | 后端API |
|------|--------|--------|---------|
| 用户认证 | ✅ | ✅ | ✅ |
| 话题发布 | ✅ | ✅ | ✅ |
| 话题浏览 | ✅ | ✅ | ✅ |
| 点赞收藏 | ✅ | ✅ | ✅ |
| 评论系统 | ✅ | ✅ | ✅ |
| 活动系统 | ✅ | ✅ | ✅ |
| 小组圈子 | ✅ | ✅ | ✅ |
| 私信系统 | ✅ | ✅ | ✅ |
| 通知系统 | ✅ | ✅ | ✅ |
| 个人中心 | ✅ | ✅ | ✅ |
| 签到系统 | ✅ | ✅ | ✅ |
| PWA支持 | ✅ | N/A | N/A |

### 管理后台 ✅ 已完成
- 仪表盘统计
- 内容管理（话题/活动）
- 用户管理（警告/封禁）
- 公告管理
- 举报管理
- 审计日志

---

## 🔧 开发规范

### API 响应格式
```javascript
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// 分页响应
{
  "code": 0,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 错误响应
{
  "code": 40001,
  "message": "参数错误"
}
```

### 常见字段映射
```javascript
// 后端返回 → 前端使用
author → user (某些旧接口)
topicType → type (话题类型)
createdAt → createTime (时间字段)
```

### 部署命令
```powershell
# 进入部署脚本目录
cd scripts/deployment

# 全量部署
.\Deploy-Production.ps1 -Target all -Message "版本说明"

# 仅部署后端
.\Deploy-Production.ps1 -Target backend

# 仅部署网页
.\Deploy-Production.ps1 -Target web
```

### 数据库迁移
```bash
# SSH到服务器后执行
cd /root/IEclub_dev/ieclub-backend
npx prisma db push --accept-data-loss
pm2 restart ieclub-backend
```

---

## 📝 待开发功能

### 高优先级
1. **智能推荐系统** - 基于用户兴趣的内容推荐
2. **智能匹配** - 技能/项目匹配算法

### 中优先级
1. **数据分析** - 用户行为统计和可视化
2. **内容审核** - AI内容安全检测优化

### 低优先级
1. **勋章系统完善** - 更多成就勋章
2. **积分商城** - 积分兑换功能

---

## ⚠️ 注意事项

### 已知问题
1. 图片上传依赖后端配置的存储服务
2. 微信登录需要正确配置 AppID 和 AppSecret
3. 内容安全检测依赖微信API，可能偶发失败

### 开发建议
1. 修改后端Schema后必须执行 `prisma db push`
2. 网页端修改后执行 `npm run build` 并部署
3. 小程序修改后需在开发者工具中上传

### 文件说明
- `AI_HANDOVER.md` - 本文档，AI开发提示
- `DEVELOPMENT_ROADMAP.md` - 开发路线图
- `docs/USER_GUIDE.md` - 用户使用指南
- `docs/TEST_GUIDE.md` - 测试指南

---

## 🔗 快速链接

| 资源 | 地址 |
|------|------|
| 生产网页 | https://ieclub.online |
| 管理后台 | https://ieclub.online/admin |
| API文档 | /api/v1/... |
| 服务器 | ssh root@ieclub.online |

---

*最后更新: 2025-11-28 22:00*
