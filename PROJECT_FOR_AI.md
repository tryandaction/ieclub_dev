# IEClub 项目完整指南（For AI）

**最后更新**: 2025-11-21 | **版本**: v1.1.0 | **状态**: 生产环境运行中 ✅

---

## 🎯 核心开发原则 ⚠️⚠️⚠️

### 1. 双端同步开发 📱💻
```
⚠️ 重要：小程序和Web端必须同步推进！
- Web端实现新功能时，小程序同步实现
- 共用同一个后端API，确保数据统一
- UI设计保持一致，交互体验统一
- 双端都需要充分测试
```

### 2. 专注单一功能原则 🎯
```
⚠️ 重要：一次只专注一个功能，做到最好！
- 不要同时开发多个功能
- 确保当前功能100%完成再开始下一个
- 包括前端+后端+双端+测试+文档
- 稳步推进，不要求快
```

### 3. 质量优先原则 ✨
```
每个功能开发流程：
1. 设计API接口
2. 实现后端逻辑
3. Web端实现UI
4. 小程序端实现UI
5. 双端测试
6. 部署到测试环境
7. 验证通过后部署生产环境
8. 完善文档
```

---

## 📖 项目概述

### 核心定位
IEClub 是面向南方科技大学的学术社交平台，连接思想，创造可能。

### 核心价值
- **知识分享**: 我来讲 - 分享专业知识
- **学习互助**: 想听 - 找到学习伙伴
- **项目对接**: 创业/科研/竞赛招募
- **活动组织**: 线下讲座、工作坊
- **智能匹配**: 基于技能和兴趣推荐

---

## 🏗 技术架构

### 整体架构
```
┌─────────────────────────────────┐
│   Web浏览器    |   微信小程序      │ ← 双端同步开发
├─────────────────────────────────┤
│         React18  |  原生WXML      │
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │ 统一后端API  │ ← 共用一个后端
        │ Node.js     │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ MySQL+Redis │
        └─────────────┘
```

### 技术栈
**前端双端**
- Web: React 18 + Vite + Zustand + TailwindCSS
- 小程序: 微信原生(WXML/WXSS/JS)
- 管理后台: React 18 + Ant Design 5

**后端统一**
- Node.js 18 + Express 4.18
- Prisma 5.8 + MySQL 8 + Redis 7
- JWT认证 + bcrypt加密
- 速率限制 + CSRF保护

---

## 📊 开发状态

### ✅ 已完成功能 (V1.0)

#### 1. 认证系统 (100%) ✅
**双端状态**: Web ✅ | 小程序 ✅
- 邮箱注册/登录（验证码）
- 密码登录（最少6位）
- 手机号绑定/登录
- 微信绑定/登录
- 修改密码
- 找回密码
- 账号设置页面 🆕

**最新修复** (2025-11-21):
- ✅ 统一密码长度验证（6位）
- ✅ 优化401错误提示
- ✅ 新增账号设置页面

#### 2. 话题广场 (100%) ✅
**双端状态**: Web ✅ | 小程序 ✅
- 四种类型：我来讲/想听/项目/分享
- 发布/编辑/删除
- 点赞/评论/收藏
- 搜索/筛选/排序
- 富文本编辑

#### 3. 社区功能 (100%) ✅
**双端状态**: Web ✅ | 小程序 ✅
- 用户列表/个人主页
- 关注系统
- 排行榜
- 用户搜索

#### 4. 活动管理 (100%) ✅
**双端状态**: Web ✅ | 小程序 ✅
- 活动发布/编辑
- 报名系统
- 签到功能（二维码+签到码）
- 数据统计

#### 5. 管理员系统 (100%) ✅
**双端状态**: Web(后台) ✅
- 用户管理
- 内容审核
- 数据统计（ECharts可视化）
- RBAC权限系统

---

## 🎯 开发规划

### 当前迭代 (V1.1) - 认证优化 ✅ 已完成
**目标**: 修复登录认证问题
- ✅ 统一密码验证规则
- ✅ 优化错误提示
- ✅ 新增账号设置功能
- ⏳ 待部署测试环境

### 下一迭代 (V1.2) - 私信系统 📋
**目标**: 完善用户间私信聊天功能
**双端同步**: Web + 小程序

**开发顺序**:
1. **后端API设计** (3天)
   - 消息发送/接收API
   - 消息列表/历史API
   - WebSocket实时推送
   - 未读消息统计

2. **Web端开发** (4天)
   - 消息列表页面
   - 聊天界面UI
   - 实时消息推送
   - 未读提示

3. **小程序端开发** (4天)
   - 消息列表页面
   - 聊天界面UI
   - 实时消息推送
   - 未读提示

4. **测试与优化** (2天)
   - 双端功能测试
   - 性能优化
   - 边界情况处理

**验收标准**:
- [ ] 后端API完整且文档齐全
- [ ] Web端功能完整可用
- [ ] 小程序端功能完整可用
- [ ] 双端UI一致，体验流畅
- [ ] 测试环境验证通过
- [ ] 生产环境部署成功

### V1.3 - 通知系统优化 📋
**目标**: 完善实时通知推送
**双端同步**: Web + 小程序

**功能清单**:
- [ ] 系统通知推送
- [ ] 互动消息提醒（点赞/评论/@）
- [ ] 活动提醒
- [ ] 邮件通知
- [ ] 未读消息角标
- [ ] 通知设置管理

### V1.4 - 搜索优化 📋
**目标**: 提升搜索体验
**双端同步**: Web + 小程序

**功能清单**:
- [ ] 全局搜索优化
- [ ] 搜索建议
- [ ] 热门搜索
- [ ] 搜索历史
- [ ] 高级筛选

### V2.0 - AI智能功能 🔮
**目标**: 引入AI能力
**时间**: 3-6个月后

**规划功能**:
- [ ] AI内容推荐
- [ ] 智能用户匹配
- [ ] 内容质量评分
- [ ] 自动标签生成
- [ ] 智能问答助手

---

## 📁 关键文件位置

### 后端核心文件
```
ieclub-backend/src/
├── server.js                    # 服务器入口
├── routes/index.js              # 主路由（724行）
├── controllers/
│   └── authController.js        # 认证控制器（2271行）⭐
├── middleware/
│   ├── auth.js                  # JWT认证
│   └── rateLimiter.js           # 速率限制
├── services/
│   ├── emailService.js          # 邮件服务
│   └── wechatService.js         # 微信服务
└── prisma/schema.prisma         # 数据库模型
```

### Web端核心文件
```
ieclub-web/src/
├── App.jsx                      # 路由配置
├── pages/
│   ├── Login.jsx                # 登录页 ⭐
│   ├── Register.jsx             # 注册页 ⭐
│   ├── Settings.jsx             # 账号设置 🆕
│   ├── Plaza.jsx                # 话题广场
│   └── Activities.jsx           # 活动列表
├── utils/
│   └── request.js               # Axios封装 ⭐
└── contexts/
    └── AuthContext.jsx          # 认证上下文
```

### 小程序端核心文件
```
ieclub-frontend/
├── pages/
│   ├── auth/                    # 认证页面
│   ├── plaza/                   # 话题广场
│   ├── community/               # 社区
│   ├── activities/              # 活动
│   └── profile/                 # 个人中心
├── api/                         # API封装
└── utils/                       # 工具函数
```

---

## 🔧 环境配置

### 开发环境
```bash
# Web前端
cd ieclub-web && npm run dev        # http://localhost:5173

# 管理后台
cd admin-web && npm run dev         # http://localhost:5174

# 后端
cd ieclub-backend && npm run dev    # http://localhost:3000

# 小程序
# 使用微信开发者工具打开 ieclub-frontend 目录
```

### 测试环境
- Web: https://test.ieclub.online
- API: https://test.ieclub.online/api
- 部署: `.\scripts\deployment\Deploy-Staging.ps1`

### 生产环境
- Web: https://ieclub.online
- API: https://ieclub.online/api
- 部署: `.\scripts\deployment\Deploy-Production.ps1`

---

## 📡 API设计规范

### RESTful设计
```javascript
// 资源操作
GET    /api/topics          // 列表
POST   /api/topics          // 创建
GET    /api/topics/:id      // 详情
PUT    /api/topics/:id      // 更新
DELETE /api/topics/:id      // 删除

// 子资源
GET    /api/topics/:id/comments    // 获取评论
POST   /api/topics/:id/comments    // 创建评论

// 操作
POST   /api/topics/:id/like        // 点赞
POST   /api/topics/:id/bookmark    // 收藏
```

### 统一响应格式
```javascript
// 成功
{
  "success": true,
  "message": "操作成功",
  "data": { /* 数据 */ }
}

// 失败
{
  "success": false,
  "message": "错误信息",
  "code": 400
}

// 列表（带分页）
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
}
```

---

## 🚀 部署流程

### 开发流程
```bash
# 1. 功能开发（develop分支）
git checkout develop
# 开发代码...

# 2. 提交代码
git add .
git commit -m "feat: 新功能描述"
git push origin develop

# 3. 部署到测试环境
cd scripts/deployment
.\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 4. 测试验证通过后，部署到生产环境
.\Deploy-Production.ps1 -Target all -Message "v1.x.x 正式发布"
```

### Git分支策略
- `main`: 生产环境分支（稳定版本）
- `develop`: 开发分支（日常开发）
- `feature/*`: 功能分支（大功能开发）
- `hotfix/*`: 紧急修复分支

---

## ⚠️ 开发注意事项

### 1. 双端同步开发要求
```
✅ 每个新功能必须同时实现Web和小程序
✅ 保持UI设计一致性
✅ 共用后端API，确保数据统一
✅ 双端都要充分测试
✅ 同步部署上线
```

### 2. 代码质量要求
```
✅ 遵循ESLint规范
✅ 组件化开发，复用性高
✅ 代码注释清晰
✅ 错误处理完善
✅ 性能优化到位
```

### 3. 安全要求
```
✅ 敏感信息不提交到Git
✅ API接口都有速率限制
✅ 输入验证完整
✅ XSS/CSRF防护
✅ 密码加密存储
```

### 4. 测试要求
```
✅ 功能测试完整
✅ 边界情况考虑
✅ 错误场景测试
✅ 性能测试
✅ 双端兼容性测试
```

---

## 🐛 常见问题

### 数据库连接失败
```bash
# 检查MySQL是否运行
mysql -u root -p

# 检查Redis是否运行
redis-cli ping

# 使用Docker启动（推荐）
cd ieclub-backend
docker-compose up -d mysql redis
```

### 前端开发问题
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 清理缓存
npm run clean
```

### 部署问题
```bash
# 检查服务器状态
ssh root@ieclub.online "pm2 status"

# 查看日志
ssh root@ieclub.online "pm2 logs ieclub-backend"

# 重启服务
ssh root@ieclub.online "pm2 restart ieclub-backend"
```

---

## 📞 相关链接

- **文档**: `docs/` 目录
- **快速参考**: `REMIND.md`
- **部署指南**: `docs/deployment/`
- **API文档**: http://localhost:3000/api/docs
- **GitHub**: https://github.com/tryandaction/ieclub_dev

---

**重要提醒**: 
- ⚠️ 开发新功能时，先设计API，再双端同步实现
- ⚠️ 一次专注一个功能，做到100%完成
- ⚠️ 测试环境验证通过后再部署生产环境
- ⚠️ 保持代码质量，注重用户体验
