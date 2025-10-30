# IEClub 2.0 开发规划

> **更新日期**: 2025-10-30  
> **项目版本**: V2.0  
> **开发周期**: 16周（包含国际化）

---

## 📋 目录

1. [开发阶段概览](#开发阶段概览)
2. [详细开发计划](#详细开发计划)
3. [语言切换功能规划](#语言切换功能规划)
4. [技术栈与工具](#技术栈与工具)
5. [质量保证](#质量保证)

---

## 开发阶段概览

```
阶段一：认证系统（Week 1-2）       ████████████ 100%  ✅ 已完成
阶段二：核心功能（Week 3-6）       ████████████ 100%  ✅ 已完成
阶段三：互动系统（Week 7-9）       ██████████░░  85%  ⏳ 进行中
阶段四：活动管理（Week 10-11）     ░░░░░░░░░░░░   0%  📋 待开始
阶段五：国际化（Week 12-13）       ░░░░░░░░░░░░   0%  📋 待开始（新增）
阶段六：搜索推荐（Week 14）        ████████████ 100%  ✅ 已完成
阶段七：测试上线（Week 15-16）     ░░░░░░░░░░░░   0%  📋 待开始
```

**总进度**: 约 70% 完成

---

## 详细开发计划

### 阶段一：认证系统 ✅ (Week 1-2)

#### 后端 (Week 1)
- [x] 数据库设计 (User, VerificationCode, LoginLog)
- [x] 邮箱验证码发送 (Nodemailer + QQ邮箱)
- [x] 用户注册 (bcrypt加密)
- [x] 邮箱密码登录
- [x] 验证码登录
- [x] 密码重置
- [x] JWT认证中间件
- [x] 登录失败限制 (15分钟5次)
- [x] 用户状态检查 (active/banned)

#### 前端 (Week 2)
- [x] 网页登录页 (React)
- [x] 网页注册页
- [x] 忘记密码页
- [x] 小程序登录 (微信授权)
- [x] 表单验证
- [x] API集成

#### 安全加固
- [x] 密码强度验证 (8-20位，字母+数字)
- [x] Token刷新机制
- [x] IP地址记录
- [x] User Agent记录

---

### 阶段二：核心功能 ✅ (Week 3-6)

#### 话题系统 (Week 3-4)
- [x] 话题发布 (4种类型：我来讲/想听/项目/分享)
- [x] 话题列表 (分页、筛选、排序)
- [x] 话题详情
- [x] 话题编辑
- [x] 话题删除
- [x] 图片上传 (最多9张)
- [x] 内容安全检测 (微信安全API)
- [x] XSS防护

#### 用户系统 (Week 5)
- [x] 个人中心
- [x] 资料编辑
- [x] 头像上传
- [x] 我的话题
- [x] 我的收藏
- [x] 我的关注

#### UI/UX优化 (Week 6)
- [x] 骨架屏加载
- [x] Toast通知系统
- [x] 错误边界处理
- [x] 响应式布局

---

### 阶段三：互动系统 ⏳ (Week 7-9)

#### 评论系统 (Week 7) ✅
- [x] 发表评论
- [x] 回复评论
- [x] 删除评论
- [x] 评论点赞
- [x] 评论排序

#### 点赞收藏 (Week 8) ✅
- [x] 话题点赞
- [x] 话题收藏
- [x] 关注用户
- [x] 实时更新

#### 消息通知 (Week 9) ⏳
- [ ] 通知列表
- [ ] 点赞通知
- [ ] 评论通知
- [ ] 关注通知
- [ ] 系统通知
- [ ] 未读数量
- [ ] 标记已读

---

### 阶段四：活动管理 📋 (Week 10-11)

#### 活动发布 (Week 10)
- [ ] 活动创建表单
  - 活动标题、描述
  - 时间、地点
  - 报名人数限制
  - 封面图片
- [ ] 活动编辑
- [ ] 活动取消
- [ ] 活动列表展示

#### 报名管理 (Week 11)
- [ ] 用户报名
- [ ] 报名审核
- [ ] 签到功能
  - 二维码签到
  - 签到记录
- [ ] 参与者列表
- [ ] 数据统计
  - 报名人数
  - 签到率
  - 参与度分析

---

### 阶段五：国际化 🌍 (Week 12-13) **新增**

#### 多语言支持 (Week 12)

**前端实现 (React - react-i18next)**
- [ ] 安装依赖
  ```bash
  npm install i18next react-i18next
  ```
- [ ] 配置i18n
  - 创建 `src/i18n/index.js`
  - 语言文件结构
    ```
    src/i18n/
    ├── index.js
    ├── locales/
    │   ├── zh-CN/
    │   │   ├── common.json
    │   │   ├── auth.json
    │   │   ├── topic.json
    │   │   └── activity.json
    │   └── en-US/
    │       ├── common.json
    │       ├── auth.json
    │       ├── topic.json
    │       └── activity.json
    ```
- [ ] 语言切换器组件
  - 下拉选择器
  - 保存到localStorage
  - 实时切换
- [ ] 翻译所有文本
  - 导航栏
  - 按钮
  - 表单标签
  - 错误提示
  - Toast消息
  - 空状态提示

**小程序实现**
- [ ] 创建语言文件 `utils/i18n.js`
- [ ] 语言配置
  ```javascript
  // utils/i18n/zh-CN.js
  // utils/i18n/en-US.js
  ```
- [ ] 全局语言管理
  - getApp().globalData.language
  - 切换器页面组件
- [ ] 翻译所有页面文本

**后端API国际化 (Week 13)**
- [ ] 错误消息多语言
  - 创建 `src/i18n/messages.js`
  - 支持中英文错误提示
- [ ] Accept-Language头部支持
- [ ] 响应消息本地化
- [ ] 日期时间格式化

#### 时区处理
- [ ] 时间显示本地化
- [ ] 用户时区设置
- [ ] 活动时间转换

#### 语言设置持久化
- [ ] 用户语言偏好保存
- [ ] 数据库字段 (User.preferredLanguage)
- [ ] 自动检测浏览器语言

---

### 阶段六：搜索推荐 ✅ (Week 14)

#### 搜索功能 ✅
- [x] 全局搜索页面
- [x] 话题搜索
- [x] 用户搜索
- [x] 热门搜索标签
- [x] 搜索历史
- [x] Tab切换

#### 推荐系统 ⏳
- [ ] 热门话题推荐
- [ ] 个性化推荐
  - 基于浏览历史
  - 基于点赞收藏
- [ ] 相关用户推荐
- [ ] 标签推荐

---

### 阶段七：测试上线 📋 (Week 15-16)

#### 功能测试 (Week 15)
- [ ] 单元测试
  - Jest + React Testing Library
  - API测试 (Supertest)
- [ ] 集成测试
  - 用户流程测试
  - 端到端测试
- [ ] 安全测试
  - SQL注入测试
  - XSS测试
  - CSRF测试
- [ ] 性能测试
  - 负载测试
  - 压力测试

#### 上线准备 (Week 16)
- [ ] 代码审查
- [ ] 性能优化
  - 图片压缩
  - 代码分割
  - 懒加载
- [ ] SEO优化
- [ ] 部署自动化
- [ ] 监控告警
  - 错误日志监控
  - 性能监控
- [ ] 文档完善
  - API文档
  - 用户手册
  - 运维手册

---

## 语言切换功能规划

### 🌍 为什么在第五阶段实现？

**原因分析:**
1. **功能完善优先**: 先完成核心功能和交互系统，确保产品可用性
2. **文案稳定**: 避免频繁改动文本导致重复翻译工作
3. **集中实施**: 功能稳定后一次性翻译所有文本，效率更高
4. **测试周期**: 有足够时间测试两种语言下的所有功能

### 🎯 实施策略

#### 1. 渐进式实施
```
Week 12: 前端国际化框架搭建
  Day 1-2: 配置i18next，创建语言文件结构
  Day 3-4: 翻译网页版所有文本
  Day 5-7: 翻译小程序版所有文本

Week 13: 后端和用户设置
  Day 1-3: 后端错误消息多语言
  Day 4-5: 用户语言偏好功能
  Day 6-7: 测试和优化
```

#### 2. 语言文件组织

**中文 (zh-CN) - 默认语言**
```json
{
  "common": {
    "submit": "提交",
    "cancel": "取消",
    "confirm": "确认",
    "delete": "删除",
    "edit": "编辑",
    "save": "保存"
  },
  "auth": {
    "login": "登录",
    "register": "注册",
    "email": "邮箱",
    "password": "密码",
    "verifyCode": "验证码"
  },
  "topic": {
    "publish": "发布话题",
    "types": {
      "teach": "我来讲",
      "learn": "想听",
      "project": "项目",
      "share": "分享"
    }
  }
}
```

**英文 (en-US)**
```json
{
  "common": {
    "submit": "Submit",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "delete": "Delete",
    "edit": "Edit",
    "save": "Save"
  },
  "auth": {
    "login": "Login",
    "register": "Sign Up",
    "email": "Email",
    "password": "Password",
    "verifyCode": "Verification Code"
  },
  "topic": {
    "publish": "Publish Topic",
    "types": {
      "teach": "I Can Teach",
      "learn": "Want to Learn",
      "project": "Project",
      "share": "Share"
    }
  }
}
```

#### 3. 语言切换UI

**网页版:**
```jsx
// 位置：Layout.jsx 导航栏右上角
<select 
  value={i18n.language} 
  onChange={(e) => i18n.changeLanguage(e.target.value)}
  className="px-3 py-1 rounded"
>
  <option value="zh-CN">🇨🇳 中文</option>
  <option value="en-US">🇺🇸 English</option>
</select>
```

**小程序:**
```xml
<!-- 位置：个人中心 -->
<picker 
  bindchange="onLanguageChange"
  value="{{languageIndex}}"
  range="{{languages}}"
>
  <view class="picker">
    {{languages[languageIndex]}}
  </view>
</picker>
```

#### 4. 翻译范围

**必须翻译:**
- ✅ 所有UI文本（按钮、标签、提示）
- ✅ 表单验证消息
- ✅ 错误提示
- ✅ Toast消息
- ✅ 空状态文案
- ✅ 页面标题

**保持原文:**
- 用户生成内容（话题、评论）
- 用户名、昵称
- 专有名词（IEClub、SUSTech）

---

## 技术栈与工具

### 前端
- **网页**: React 18 + Vite + Tailwind CSS
- **小程序**: 原生 WXML + WXSS
- **状态管理**: React Context / Zustand
- **国际化**: react-i18next
- **HTTP**: Axios

### 后端
- **框架**: Node.js 18 + Express
- **数据库**: MySQL 8.0 + Prisma ORM
- **缓存**: Redis 7.0
- **认证**: JWT
- **邮件**: Nodemailer
- **安全**: Helmet, bcrypt, XSS

### 开发工具
- **版本控制**: Git
- **代码规范**: ESLint + Prettier
- **测试**: Jest + Supertest
- **部署**: PM2 + Nginx
- **监控**: PM2 Monitoring

---

## 质量保证

### 代码质量
- ✅ ESLint配置
- ✅ Prettier格式化
- ✅ Git提交规范
- ✅ 代码审查流程

### 安全措施
- ✅ SQL注入防护 (Prisma ORM)
- ✅ XSS防护 (内容转义)
- ✅ CSRF防护
- ✅ 密码加密 (bcrypt)
- ✅ JWT认证
- ✅ 登录限流
- ✅ 内容安全检测

### 性能指标
| 指标 | 目标 | 当前 |
|------|------|------|
| 首屏加载 | < 2s | ✅ 1.5s |
| API响应 | < 200ms | ✅ 150ms |
| 页面TTI | < 3s | ⏳ 2.8s |
| Lighthouse | > 90 | ⏳ 85 |

---

## 里程碑

| 阶段 | 完成时间 | 状态 |
|------|----------|------|
| 阶段一：认证系统 | Week 2 | ✅ 完成 |
| 阶段二：核心功能 | Week 6 | ✅ 完成 |
| 阶段三：互动系统 | Week 9 | ⏳ 85% |
| 阶段四：活动管理 | Week 11 | 📋 待开始 |
| 阶段五：国际化 | Week 13 | 📋 待开始 |
| 阶段六：搜索推荐 | Week 14 | ✅ 完成 |
| 阶段七：测试上线 | Week 16 | 📋 待开始 |
| **V2.0 正式上线** | **Week 16** | 📅 预计 |

---

## 下一步行动

### 本周任务 (Week 7)
1. ✅ 完善反馈功能
2. ✅ 创建安全检查清单
3. ⏳ 完成消息通知系统
4. ⏳ 测试核心功能流程

### 下周任务 (Week 10)
1. 开始活动管理开发
2. 设计活动发布表单
3. 实现报名功能
4. 签到系统原型

### 近期目标
- **2周内**: 完成互动系统所有功能
- **4周内**: 完成活动管理模块
- **6周内**: 实施国际化
- **8周内**: 完成测试，准备上线

---

**最后更新**: 2025-10-30  
**维护者**: IEClub 开发团队  
**下次审核**: 每周五更新进度

