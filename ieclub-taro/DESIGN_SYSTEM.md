# IEClub 设计系统 Design System

> **版本**: v2.0  
> **最后更新**: 2024-10-27  
> **目标**: 对标小红书，保留IEclub风格

---

## 🎨 设计原则

### 1. 内容为王 (Content-First)
- 一切设计服务于内容展示
- 高效的信息密度
- 沉浸式浏览体验

### 2. 精致细腻
- 统一的间距系统（4px基准）
- 完美的图标文字对齐
- 柔和的阴影和圆角

### 3. 响应式优先
- 移动端优先设计
- 流畅的多端适配
- 一致的用户体验

### 4. 品牌一致性
- 保留IEclub紫色系
- 年轻化、活力化的视觉
- 学术与创新并重

---

## 🎨 色彩系统

### 主色调 (Primary Colors)
```scss
// 品牌主色 - 紫色系
$primary-50: #f5f7ff;
$primary-100: #ebefff;
$primary-200: #d6dfff;
$primary-300: #b3c5ff;
$primary-400: #8b9eff;
$primary-500: #667eea;  // 主色
$primary-600: #5566cc;
$primary-700: #4451a3;
$primary-800: #353d7a;
$primary-900: #262952;

// 品牌次色 - 深紫色
$secondary-500: #764ba2;
$secondary-600: #6a3d92;
$secondary-700: #5e3082;
```

### 功能色 (Functional Colors)
```scss
$success: #4caf50;   // 成功/确认
$warning: #ff9800;   // 警告
$error: #f44336;     // 错误/危险
$info: #2196f3;      // 信息
```

### 话题类型色 (Topic Type Colors)
```scss
$topic-offer: #5B7FFF;    // 我来讲（蓝色）
$topic-demand: #FF6B9D;   // 想听（粉色）
$topic-project: #FFA500;  // 项目（橙色）
```

### 灰度色系 (Grayscale)
```scss
$gray-50: #fafafa;   // 最浅背景
$gray-100: #f5f5f5;  // 背景色
$gray-200: #e0e0e0;  // 边框
$gray-300: #d1d1d1;  // 禁用状态
$gray-400: #a3a3a3;  // 占位文字
$gray-500: #737373;  // 次要文字
$gray-600: #666666;  // 普通文字
$gray-700: #4a4a4a;  // 强调文字
$gray-800: #333333;  // 标题文字
$gray-900: #1a1a1a;  // 最深文字
```

### 渐变色 (Gradients)
```scss
$gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$gradient-pink: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
$gradient-blue: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
$gradient-orange: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
$gradient-green: linear-gradient(135deg, #81fbb8 0%, #28c76f 100%);

// 话题类型渐变
$gradient-offer: linear-gradient(135deg, #5B7FFF 0%, #4A6FEE 100%);
$gradient-demand: linear-gradient(135deg, #FF6B9D 0%, #EE5A8C 100%);
$gradient-project: linear-gradient(135deg, #FFA500 0%, #EE9400 100%);
```

---

## 📏 间距系统 (Spacing System)

### 基准值: 4px

```scss
$spacing-0: 0;
$spacing-1: 4px;    // 0.25rem
$spacing-2: 8px;    // 0.5rem
$spacing-3: 12px;   // 0.75rem
$spacing-4: 16px;   // 1rem
$spacing-5: 20px;   // 1.25rem
$spacing-6: 24px;   // 1.5rem
$spacing-8: 32px;   // 2rem
$spacing-10: 40px;  // 2.5rem
$spacing-12: 48px;  // 3rem
$spacing-16: 64px;  // 4rem
$spacing-20: 80px;  // 5rem
$spacing-24: 96px;  // 6rem
```

### 使用规范

| 用途 | 推荐间距 | 示例 |
|------|---------|------|
| 图标与文字 | 4px-8px | 按钮内部 |
| 卡片内边距 | 12px-16px | 内容区域 |
| 卡片间距 | 16px | 瀑布流布局 |
| 模块间距 | 24px-32px | 页面分区 |
| 页面边距 | 16px-24px | 容器padding |

---

## ✏️ 字体系统 (Typography)

### 字号规范
```scss
$text-xs: 12px;    // 0.75rem - 辅助信息、标签
$text-sm: 14px;    // 0.875rem - 次要文字、说明
$text-base: 16px;  // 1rem - 正文、主要内容
$text-lg: 18px;    // 1.125rem - 小标题
$text-xl: 20px;    // 1.25rem - 卡片标题
$text-2xl: 24px;   // 1.5rem - 页面标题
$text-3xl: 30px;   // 1.875rem - 大标题
$text-4xl: 36px;   // 2.25rem - 特大标题
```

### 字重规范
```scss
$font-thin: 100;
$font-light: 300;
$font-normal: 400;      // 正文
$font-medium: 500;      // 次要强调
$font-semibold: 600;    // 强调
$font-bold: 700;        // 标题、按钮
$font-extrabold: 800;   // 特别强调
$font-black: 900;       // 最强调
```

### 行高规范
```scss
$leading-none: 1;      // 标签、徽章
$leading-tight: 1.25;  // 标题
$leading-snug: 1.375;  // 卡片标题
$leading-normal: 1.5;  // 正文
$leading-relaxed: 1.625; // 长文本
$leading-loose: 2;     // 特殊用途
```

### 字体家族
```scss
$font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
              'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

---

## 🎭 圆角系统 (Border Radius)

```scss
$radius-xs: 4px;     // 0.25rem - 小按钮、标签
$radius-sm: 6px;     // 0.375rem - 按钮、输入框
$radius-md: 8px;     // 0.5rem - 小卡片
$radius-lg: 12px;    // 0.75rem - 卡片、模态框
$radius-xl: 16px;    // 1rem - 大卡片
$radius-2xl: 24px;   // 1.5rem - 特大卡片
$radius-3xl: 32px;   // 2rem - 特殊卡片
$radius-full: 9999px; // 圆形、胶囊
$radius-card: 12px;  // 卡片默认值
```

### 使用规范
- **标签/徽章**: `radius-full` (圆角胶囊)
- **按钮**: `radius-lg` (12px)
- **输入框**: `radius-md` (8px)
- **卡片**: `radius-xl` (16px) 或 `radius-2xl` (24px)
- **模态框**: `radius-2xl` (24px)
- **头像**: `radius-full` (完全圆形)

---

## 🌫️ 阴影系统 (Box Shadow)

```scss
// 基础阴影
$shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

// 特殊阴影
$shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
$shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
$shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.12);

// 彩色阴影（用于强调）
$shadow-primary: 0 4px 12px rgba(102, 126, 234, 0.3);
$shadow-secondary: 0 4px 12px rgba(118, 75, 162, 0.3);
```

### 使用规范
| 元素 | 默认阴影 | Hover阴影 |
|------|---------|----------|
| 卡片 | shadow-sm | shadow-md |
| 按钮 | shadow-sm | shadow-md |
| 模态框 | shadow-xl | - |
| 下拉菜单 | shadow-lg | - |
| 浮动按钮 | shadow-lg | shadow-xl |

---

## 🎬 动画系统 (Animations)

### 过渡时间
```scss
$duration-75: 75ms;
$duration-100: 100ms;
$duration-150: 150ms;
$duration-200: 200ms;
$duration-300: 300ms;
$duration-500: 500ms;
$duration-700: 700ms;
$duration-1000: 1000ms;
```

### 缓动函数
```scss
$ease-linear: linear;
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 预设动画

#### 淡入淡出
```scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

#### 滑动
```scss
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

#### 缩放
```scss
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes scaleOut {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.9); opacity: 0; }
}
```

### 使用规范
| 交互 | 动画 | 时长 | 缓动 |
|------|------|------|------|
| 悬停 | scale | 200ms | ease-out |
| 点击 | scale | 150ms | ease-in-out |
| 页面过渡 | fadeIn | 300ms | ease-out |
| 模态框 | slideUp | 300ms | ease-out |
| Toast | slideInRight | 300ms | ease-out |
| 列表项加载 | fadeIn | 200ms | ease-out |

---

## 📱 响应式断点 (Breakpoints)

```scss
// 移动端
$screen-xs: 320px;  // 小屏手机
$screen-sm: 640px;  // 大屏手机

// 平板
$screen-md: 768px;  // 平板竖屏
$screen-lg: 1024px; // 平板横屏

// 桌面
$screen-xl: 1280px; // 桌面
$screen-2xl: 1536px; // 大屏桌面
```

### 使用规范

#### 瀑布流列数
| 屏幕宽度 | 列数 | 最小列宽 |
|---------|------|---------|
| < 640px | 2列 | 140px |
| 640px - 1023px | 3列 | 200px |
| 1024px - 1279px | 4列 | 240px |
| ≥ 1280px | 4-5列 | 260px |

#### 侧边栏宽度
| 屏幕宽度 | 左侧边栏 | 右侧边栏 |
|---------|---------|---------|
| < 1024px | 隐藏 | 隐藏 |
| 1024px - 1279px | 220px | 隐藏 |
| ≥ 1280px | 240px | 280px |

---

## 🎯 组件规范

### 按钮 (Button)

#### 尺寸
```scss
// 小按钮
.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 8px;
}

// 中按钮（默认）
.btn-md {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 12px;
}

// 大按钮
.btn-lg {
  padding: 14px 28px;
  font-size: 18px;
  border-radius: 14px;
}
```

#### 变体
- **Primary**: 品牌主色，渐变背景
- **Secondary**: 次要色，描边
- **Success/Warning/Error**: 功能色
- **Ghost**: 透明背景，文字色
- **Link**: 无背景，下划线

### 卡片 (Card)

#### 基础结构
```jsx
<div className="card">
  {/* 顶部媒体区域 */}
  <div className="card-media">
    {/* 图片或渐变背景 */}
  </div>
  
  {/* 内容区域 */}
  <div className="card-content">
    {/* 标题 */}
    <h3 className="card-title">...</h3>
    {/* 描述 */}
    <p className="card-description">...</p>
    {/* 标签 */}
    <div className="card-tags">...</div>
  </div>
  
  {/* 底部区域 */}
  <div className="card-footer">
    {/* 作者信息 */}
    <div className="card-author">...</div>
    {/* 互动数据 */}
    <div className="card-stats">...</div>
  </div>
</div>
```

#### 话题卡片规范
- **宽高比**: 3:4 (小红书风格)
- **圆角**: 16px-24px
- **内边距**: 16px
- **阴影**: `shadow-sm` → `shadow-md` (hover)
- **过渡**: 200ms ease-out

### 输入框 (Input)

```scss
.input {
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid $gray-200;
  border-radius: 12px;
  transition: all 200ms ease-out;
  
  &:focus {
    border-color: $primary-500;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
}
```

### 标签 (Tag)

```scss
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  background: $gray-100;
  color: $gray-700;
}
```

---

## 🎨 布局规范

### 容器宽度
```scss
$container-sm: 640px;
$container-md: 768px;
$container-lg: 1024px;
$container-xl: 1280px;
$container-2xl: 1536px;
```

### 页面布局

#### 桌面端（≥1024px）
```
┌─────────────────────────────────────────┐
│           Navbar (固定顶部)              │
├────────┬─────────────────────┬──────────┤
│        │                     │          │
│ 左侧栏 │     主内容区域       │ 右侧栏   │
│ 220px  │     flex-1          │ 280px    │
│        │                     │ (可选)   │
│        │                     │          │
└────────┴─────────────────────┴──────────┘
```

#### 移动端（<1024px）
```
┌──────────────────────────────┐
│      Navbar (固定顶部)        │
├──────────────────────────────┤
│                              │
│       主内容区域 100%         │
│                              │
│                              │
├──────────────────────────────┤
│    BottomNavBar (固定底部)   │
└──────────────────────────────┘
```

### 瀑布流布局

#### 桌面端（≥1280px）
- **列数**: 4-5列
- **列宽**: 260-280px
- **间距**: 16px
- **容器**: max-width: 1536px

#### 平板端（768px-1023px）
- **列数**: 3列
- **列宽**: 自适应
- **间距**: 16px

#### 移动端（<768px）
- **列数**: 2列
- **列宽**: 自适应
- **间距**: 12px

---

## 🎯 图标使用规范

### 尺寸标准
```scss
$icon-xs: 14px;
$icon-sm: 16px;
$icon-md: 20px;
$icon-lg: 24px;
$icon-xl: 32px;
```

### 对齐规范
**关键原则**: 所有图标与文字必须使用Flexbox垂直居中

```jsx
// ✅ 正确示例
<div className="flex items-center gap-2">
  <Icon icon="heart" size="sm" />
  <span className="leading-none">点赞</span>
</div>

// ❌ 错误示例
<div>
  <Icon icon="heart" size="sm" />
  <span>点赞</span>
</div>
```

### 颜色规范
- **默认**: 继承父元素颜色 (`currentColor`)
- **主色**: `#667eea`
- **激活状态**: 根据功能（点赞红色、收藏黄色等）
- **禁用状态**: `$gray-400`

---

## 📋 设计检查清单

### 卡片设计
- [ ] 使用 3:4 宽高比
- [ ] 圆角 16px-24px
- [ ] 内边距 16px
- [ ] 图片/渐变区域与文字区域分离
- [ ] 文字背景为纯白或浅灰
- [ ] 阴影 `shadow-sm` → `shadow-md` (hover)

### 间距检查
- [ ] 所有间距是4px的倍数
- [ ] 图标与文字间距 4-8px
- [ ] 卡片内边距 12-16px
- [ ] 卡片间距 16px
- [ ] 模块间距 24-32px

### 对齐检查
- [ ] 图标与文字使用 Flexbox `items-center`
- [ ] 所有可点击区域至少 44x44px
- [ ] 文字行高合理（标题 1.25，正文 1.5）

### 响应式检查
- [ ] 移动端双列瀑布流
- [ ] 平板端三列瀑布流
- [ ] 桌面端四列瀑布流
- [ ] 所有文字在小屏幕可读（最小14px）
- [ ] 按钮和卡片在触摸设备上足够大

### 性能检查
- [ ] 图片懒加载
- [ ] 列表虚拟滚动（>100项时）
- [ ] 动画使用 transform 而非 left/top
- [ ] 避免大面积阴影和模糊效果

---

## 📚 参考资源

### 设计灵感
- 小红书 - 瀑布流布局、卡片设计
- Instagram - 图片展示
- Pinterest - 瀑布流
- Dribbble - 整体视觉风格

### 技术文档
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React](https://react.dev)
- [Taro](https://taro-docs.jd.com)

---

**维护者**: IEClub Dev Team  
**版本**: v2.0  
**更新日期**: 2024-10-27

