# 更新日志

本文档记录 IEClub 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [2.0.0] - 2025-10-29

### 🎉 重大变更

#### 技术架构迁移
- **从 Taro 框架迁移到原生微信小程序**
- 移除所有 Taro 相关依赖和配置
- 使用原生微信小程序技术栈重写前端

#### 迁移原因
1. Taro 框架存在 `mount` 相关的稳定性问题
2. 跨平台编译增加了开发和调试复杂度
3. 原生小程序性能更优，官方支持更完善
4. 简化技术栈，降低学习和维护成本

### ✨ 新增功能

#### 页面实现
- **话题广场页** (`pages/plaza`)
  - Tab 切换（推荐、我来讲、想听、项目）
  - 话题卡片展示（瀑布流布局）
  - 话题类型徽章
  - 下拉刷新支持

- **社区页** (`pages/community`)
  - 用户卡片展示
  - 关注/取消关注功能
  - 用户等级和积分展示

- **活动页** (`pages/activities`)
  - 活动列表展示
  - 活动信息（时间、地点、人数）
  - 立即报名功能

- **发布页** (`pages/publish`)
  - 类型选择（我来讲、想听、项目）
  - 表单输入（标题、描述）
  - 发布功能

- **个人中心页** (`pages/profile`)
  - 用户信息展示
  - 数据统计（话题、粉丝、关注）
  - 功能菜单

#### 项目配置
- 新建 `app.js` - 小程序入口逻辑
- 新建 `app.json` - 全局配置（页面路由、TabBar）
- 新建 `app.wxss` - 全局样式
- 新建 `project.config.json` - 项目配置

### 📚 文档更新

- 重写 `README.md` - 项目总览和快速开始
- 新建 `ieclub-taro/README.md` - 小程序开发文档
- 新建 `ieclub-taro/开发规划.md` - 详细开发计划
- 新建 `CHANGELOG.md` - 更新日志（本文件）

### 🗑️ 删除内容

#### 移除 Taro 相关
- 删除 `ieclub-taro/src/` - Taro 源代码
- 删除 `ieclub-taro/dist/` - Taro 编译输出
- 删除 `ieclub-taro/config/` - Taro 配置
- 删除 `ieclub-taro/node_modules/` - Taro 依赖包
- 删除 `package.json` - Taro 依赖配置
- 删除 `babel.config.js` - Babel 配置
- 删除 `vite.config.js` - Vite 配置
- 删除 `tailwind.config.js` - Tailwind 配置

#### 清理旧文档
- 删除 `BUILD_SUCCESS.md`
- 删除 `CODE_STRUCTURE_REPORT.md`
- 删除 `CRITICAL_FIX_SUMMARY.md`
- 删除 `FIX_WEAPP_BLANK.md`
- 删除 `FIXES.md`
- 删除 `LAYOUT_OPTIMIZATION_SUMMARY.md`
- 删除 `QUALITY_CHECK_REPORT.md`
- 删除 `REFACTOR_NOTES.md`
- 删除 `RESPONSIVE_DESIGN.md`
- 删除 `UI_OPTIMIZATION_SUMMARY.md`
- 删除 `README_NEW.md`
- 删除 `布局优化总结.md`

#### 删除不需要的文件
- 删除 `index.html` - H5 入口
- 删除 `vercel.json` - Vercel 部署配置
- 删除 `public/` - H5 静态资源
- 删除 `i18n/` - 国际化配置

### 🎨 设计规范

#### 色彩系统
- 主色调: `#8b5cf6` (紫色)
- 渐变色: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 文字色: `#333` (主), `#666` (次), `#999` (辅)
- 背景色: `#f5f5f5` (页面), `#fff` (卡片)

#### 尺寸规范（rpx）
- 页面边距: 30
- 卡片内边距: 30
- 卡片圆角: 16
- 按钮圆角: 12

#### 字体大小（rpx）
- 标题: 36-40 (粗体)
- 正文: 28
- 辅助: 24
- 小字: 20-22

### 🔧 技术细节

#### 项目结构
```
ieclub-taro/
├── app.js                    # 小程序入口逻辑
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── pages/                    # 页面目录
│   ├── plaza/               # 话题广场
│   ├── community/           # 社区
│   ├── activities/          # 活动
│   ├── publish/             # 发布
│   └── profile/             # 个人中心
└── project.config.json      # 项目配置
```

#### 开发环境
- 微信开发者工具 - 最新稳定版
- Node.js >= 18.0.0 (后端)
- MySQL >= 8.0 (后端)

---

## [1.x.x] - 2025-10-28 及之前

### Taro 版本历史

在 v2.0.0 之前，项目使用 Taro 框架开发，包含以下主要功能：

- 基于 Taro 4.x + React 的跨平台开发
- 5 个核心页面的基础实现
- Zustand 状态管理
- SCSS 样式预处理
- 后端 API 集成

由于技术路径调整，Taro 版本已停止维护。

---

## 规划中的版本

### [2.1.0] - 计划 2025-11

#### 计划新增
- [ ] 后端 API 对接
- [ ] 用户登录注册
- [ ] 真实数据展示
- [ ] 数据持久化存储

#### 计划优化
- [ ] 请求工具封装
- [ ] 错误处理完善
- [ ] Loading 状态管理

### [2.2.0] - 计划 2025-12

#### 计划新增
- [ ] 话题详情页
- [ ] 用户详情页
- [ ] 活动详情页
- [ ] 消息通知
- [ ] 搜索功能

### [2.3.0] - 计划 2026-01

#### 计划优化
- [ ] 性能优化
- [ ] 交互优化
- [ ] 视觉优化
- [ ] 错误处理增强

### [2.4.0] - 计划 2026-02

#### 计划完成
- [ ] 完整功能测试
- [ ] 提交审核
- [ ] 正式发布

---

## 版本号说明

版本号遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**: 重大架构变更或不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

---

**注意**: 所有重要变更都会记录在此文件中。

最后更新: 2025-10-29

