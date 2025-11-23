# 🤖 AI开发助手 - 快速启动指南

> **文档类型**: AI开发助手提示词  
> **最后更新**: 2025-11-23 17:25  
> **适用版本**: IEclub v1.5+

---

## 🎯 你的任务

你是IEclub社区平台的开发AI助手，负责继续完成个人中心及其他功能的开发工作。

---

## 📋 项目快速上手

### 技术栈
- **后端**: Node.js + Express + Prisma + MySQL
- **网页**: React + Vite + Tailwind CSS + Lucide Icons
- **小程序**: 微信原生小程序（WXML + WXSS + JS）
- **部署**: 生产环境 https://ieclub.online

### 目录结构
```
IEclub_dev/
├── ieclub-backend/          # 后端Node.js
│   ├── src/
│   │   ├── controllers/     # 控制器（业务逻辑）
│   │   ├── routes/          # 路由配置
│   │   └── prisma/          # 数据库模型
├── ieclub-web/              # React网页端
│   └── src/
│       ├── pages/           # 页面组件
│       ├── api/             # API封装
│       └── App.jsx          # 路由配置
├── ieclub-frontend/         # 微信小程序
│   ├── pages/               # 小程序页面
│   └── app.json             # 页面注册
├── AI_HANDOVER.md           # ⭐ 详细交接文档（必读！）
├── DEVELOPMENT_ROADMAP.md   # 开发路线图
└── REMIND.md                # 快速操作指南
```

---

## 🚀 立即开始开发

### 第一步：阅读文档
1. **必读**: `AI_HANDOVER.md` - 了解当前进度和最近更新
2. **参考**: `DEVELOPMENT_ROADMAP.md` - 了解整体规划
3. **查阅**: `REMIND.md` - 日常开发操作流程

### 第二步：选择功能开发

#### 推荐优先级（已有后端支持，可直接开始）

**1. 关注/粉丝列表页** ⭐⭐⭐ (预计2天)
```
后端API: ✅ 已存在
- GET /users/:id/following  (获取关注列表)
- GET /users/:id/followers  (获取粉丝列表)

需要创建:
- 小程序: pages/following/index.{js,wxml,wxss,json}
- 小程序: pages/followers/index.{js,wxml,wxss,json}
- 网页: ieclub-web/src/pages/Following.jsx
- 网页: ieclub-web/src/pages/Followers.jsx

参考模板: pages/my-topics 和 pages/my-favorites
```

**2. 参与的活动页** ⭐⭐ (预计3天)
```
后端API: ❓ 需要检查 userController.js
- 可能的接口: GET /me/activities 或 GET /users/:id/activities

需要创建:
- 后端: 检查并完善API接口
- 小程序: pages/my-activities/
- 网页: ieclub-web/src/pages/MyActivities.jsx
```

**3. 数据统计页** ⭐ (预计5天)
```
后端API: ❌ 需要新增
- GET /me/stats (用户统计数据)

需要开发:
- 后端: statsController.js
- 小程序: pages/stats/ (使用ECharts)
- 网页: ieclub-web/src/pages/Stats.jsx (使用Chart.js)
```

### 第三步：开发流程

#### 标准开发流程（必须遵守！）
```
1. 检查后端API
   └─ 查看 ieclub-backend/src/controllers/
   └─ 查看 ieclub-backend/src/routes/index.js
   └─ 如果API不存在，先创建

2. 实现小程序端
   └─ 创建页面目录 ieclub-frontend/pages/功能名/
   └─ 创建4个文件: index.{js,wxml,wxss,json}
   └─ 在 app.json 中注册页面
   └─ 在 profile/index.js 中实现跳转方法

3. 实现网页端
   └─ 创建页面 ieclub-web/src/pages/功能名.jsx
   └─ 在 App.jsx 中配置路由
   └─ 使用ProtectedRoute包裹（需要登录的页面）

4. 测试提交
   └─ 测试功能完整性
   └─ git add . && git commit -m "feat: ..." 
   └─ git push origin main
```

---

## 💻 代码规范（必读！）

### 1. 设计参考模板

**参考这两个页面的实现**:
- `ieclub-frontend/pages/my-topics/` - 我的话题（紫色主题）
- `ieclub-frontend/pages/my-favorites/` - 我的收藏（橙红主题）

**标准组件结构**:
```javascript
// 小程序 index.js
Page({
  data: {
    list: [],
    loading: false,
    hasMore: true,
    page: 1,
    limit: 10,
    isEmpty: false
  },

  onLoad() { ... },
  onPullDownRefresh() { ... },
  onReachBottom() { ... },
  
  async loadData(isRefresh) { ... },
  goToDetail(e) { ... }
})
```

**标准UI设计**:
- ✅ 渐变色头部（每个功能用不同色系）
- ✅ 卡片式布局 + 圆角阴影
- ✅ 骨架屏加载
- ✅ 下拉刷新 + 上拉加载
- ✅ 空状态友好提示
- ✅ 流畅的交互动画

### 2. 网页端开发规范

**React组件模板**:
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon1, Icon2 } from 'lucide-react';
import { request } from '../utils/request';
import { useAuth } from '../contexts/AuthContext';

export default function ComponentName() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user]);

  const loadData = async () => { ... };

  return (
    <div className="min-h-screen bg-gradient-to-br from-color-50 via-white to-color-50">
      {/* 渐变色头部 */}
      <div className="bg-gradient-to-r from-color-500 to-color-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1>标题</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 列表/卡片 */}
      </div>
    </div>
  );
}
```

### 3. 后端开发规范

**Controller模板**:
```javascript
class SomeController {
  static async getData(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.userId; // 来自authenticate中间件

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [data, total] = await Promise.all([
        prisma.model.findMany({
          where: { userId },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: { ... }
        }),
        prisma.model.count({ where: { userId } })
      ]);

      return res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('错误:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  }
}
```

**路由配置**:
```javascript
// ieclub-backend/src/routes/index.js
router.get('/me/something', 
  authenticate,        // 需要登录
  rateLimiters.api,    // API速率限制
  SomeController.getData
);
```

---

## 📝 必须完成的步骤清单

每次开发新功能，必须完成以下所有步骤：

### 后端
- [ ] 检查Controller是否存在对应方法
- [ ] 如不存在，在正确的Controller中添加方法
- [ ] 在routes/index.js中配置路由
- [ ] 添加适当的中间件（authenticate, rateLimiters, csrf）

### 小程序
- [ ] 创建页面目录 `pages/功能名/`
- [ ] 创建index.js (业务逻辑)
- [ ] 创建index.wxml (页面结构)
- [ ] 创建index.wxss (样式)
- [ ] 创建index.json (配置)
- [ ] 在app.json的pages数组中注册页面
- [ ] 在profile/index.js中实现跳转方法

### 网页端
- [ ] 创建页面组件 `src/pages/功能名.jsx`
- [ ] 在App.jsx中添加路由配置
- [ ] 如需登录，用ProtectedRoute包裹
- [ ] 确保响应式设计（移动端友好）

### 测试与提交
- [ ] 本地测试功能完整性
- [ ] 检查错误处理是否完善
- [ ] 更新AI_HANDOVER.md记录完成的功能
- [ ] Git提交: `git add . && git commit -m "feat: 功能描述"`
- [ ] 推送: `git push origin main`

---

## ⚠️ 重要注意事项

### 1. 三端同步原则
**任何功能都必须同时实现三端**：
- 后端API → 小程序 → 网页端
- 不允许只实现一端或两端

### 2. 不要删除或修改已有功能
- 只添加新功能，不要改动已完成的代码
- 如需修改，必须有充分理由

### 3. 代码质量要求
- ✅ 完善的错误处理（try-catch + 用户友好提示）
- ✅ 加载状态（Loading、骨架屏）
- ✅ 空状态提示
- ✅ 性能优化（分页加载、懒加载）

### 4. Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 样式调整
refactor: 重构代码
```

---

## 🆘 遇到问题怎么办

### 1. 不确定后端API是否存在
```bash
# 搜索Controller
grep -r "functionName" ieclub-backend/src/controllers/

# 查看路由配置
cat ieclub-backend/src/routes/index.js | grep "路径"
```

### 2. 不知道如何设计UI
- 参考 `pages/my-topics` 和 `pages/my-favorites`
- 复用已有的设计模式
- 保持风格一致

### 3. 不确定如何实现某个功能
- 查看类似功能的实现
- 参考AI_HANDOVER.md中的最近更新
- 保持代码简洁清晰

---

## 📚 相关文档

- **AI_HANDOVER.md** - 详细的开发交接文档
- **DEVELOPMENT_ROADMAP.md** - 开发路线图和优先级
- **REMIND.md** - 日常操作快速参考
- **docs/ACCOUNT_SECURITY_SYSTEM.md** - 账户安全系统文档

---

## ✅ 你准备好了吗？

如果你已经阅读完本文档，请：
1. 从"关注/粉丝列表页"开始（最简单，后端已有）
2. 严格遵守开发流程和代码规范
3. 完成后更新AI_HANDOVER.md
4. 提交代码并推送到main分支

**祝开发顺利！** 🚀
