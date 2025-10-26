# 对齐质量检查清单 ✓

## 快速检查指南

### 登录页面 `/login`
- [ ] 邮箱图标在输入框中完美居中
- [ ] 密码输入框（如有图标）图标居中
- [ ] "记住我"复选框和文字对齐
- [ ] 所有按钮内文字和图标对齐

### 广场页面 `/plaza`
- [ ] 欢迎横幅文字清晰可读
- [ ] Tab切换图标和文字对齐
- [ ] 筛选器标题图标和文字对齐
- [ ] 筛选器按钮图标和文字对齐
- [ ] 话题卡片类型徽章居中
- [ ] 话题卡片标签居中
- [ ] 话题卡片底部作者信息对齐
- [ ] 话题卡片互动按钮（点赞、评论、浏览）对齐

### 底部导航栏
- [ ] 所有导航图标垂直居中
- [ ] 所有导航文字标签居中
- [ ] 发布按钮图标居中
- [ ] 激活状态指示器居中

### 侧边栏（桌面端）
- [ ] 菜单项图标和文字对齐
- [ ] 菜单项徽章（HOT、NEW）对齐
- [ ] 用户菜单图标和文字对齐
- [ ] 退出按钮图标和文字对齐

## 代码审查清单

### CSS 类检查
```jsx
// ✅ 正确的对齐模式
<div className="inline-flex items-center justify-center gap-2">
  <Icon />
  <span className="leading-none">文字</span>
</div>

// ❌ 需要修复的模式
<div className="flex items-center gap-2">
  <Icon />
  文字 {/* 缺少 span 和 leading-none */}
</div>

// ❌ 需要修复的模式
<div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
  <Icon /> {/* 应该使用 Flexbox */}
</div>
```

### 检查要点
1. **是否使用 inline-flex**: 所有图标+文字组合
2. **是否使用 items-center**: 垂直居中
3. **是否使用 justify-center**: 水平居中（需要时）
4. **是否使用 leading-none**: 所有文字元素
5. **是否使用 flex-shrink-0**: 固定尺寸元素（头像、图标等）

## 测试步骤

### 1. 视觉检查
```bash
# 启动开发服务器
cd ieclub-taro
npm run dev:h5
```

访问 http://localhost:10086 并检查：
- 登录页面
- 广场页面
- 点击筛选器展开/收起
- 点击 Tab 切换
- 点击底部导航栏

### 2. 浏览器开发者工具检查
1. 打开开发者工具（F12）
2. 选择元素检查器
3. 悬停在图标+文字组合上
4. 检查是否有：
   - `display: inline-flex`
   - `align-items: center`
   - `line-height: 1` (leading-none)

### 3. 响应式检查
1. 调整浏览器窗口大小
2. 检查移动端视图（375px）
3. 检查平板视图（768px）
4. 检查桌面视图（1280px）

## 常见问题修复

### 问题1: 图标和文字不在同一水平线
```jsx
// ❌ 错误
<div className="flex">
  <Icon />
  <span>文字</span>
</div>

// ✅ 正确
<div className="inline-flex items-center">
  <Icon />
  <span className="leading-none">文字</span>
</div>
```

### 问题2: 文字上下有多余空间
```jsx
// ❌ 错误
<span>文字</span>

// ✅ 正确
<span className="leading-none">文字</span>
```

### 问题3: 元素被压缩变形
```jsx
// ❌ 错误
<div className="flex items-center">
  <div className="w-8 h-8">头像</div>
  <span>长长长长的名字会压缩头像</span>
</div>

// ✅ 正确
<div className="flex items-center">
  <div className="w-8 h-8 flex-shrink-0">头像</div>
  <span className="leading-none">长长长长的名字不会压缩头像</span>
</div>
```

### 问题4: 绝对定位图标不居中
```jsx
// ❌ 错误
<div className="relative">
  <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2" />
  <input className="pl-10" />
</div>

// ✅ 正确
<div className="relative">
  <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
    <Icon />
  </div>
  <input className="pl-11" />
</div>
```

## 审查通过标准

### 基础要求
- [ ] 所有图标和文字完美对齐
- [ ] 没有使用 `transform: translateY(-50%)`
- [ ] 所有文字元素有 `leading-none`
- [ ] 固定尺寸元素有 `flex-shrink-0`

### 高级要求
- [ ] 间距统一（gap-1.5, gap-2, gap-3）
- [ ] 内边距统一（p-3, p-4, p-5, p-6）
- [ ] 响应式设计正常
- [ ] 所有状态（hover、active、focus）对齐正常

### 性能要求
- [ ] 没有不必要的嵌套 div
- [ ] 使用 Tailwind CSS 类而非内联样式
- [ ] 没有重复的对齐代码

## 维护建议

### 1. 创建组件库
建议创建统一的图标+文字组件：

```jsx
// components/common/IconText.jsx
export const IconText = ({ icon, text, gap = '2', className = '' }) => (
  <div className={`inline-flex items-center justify-center gap-${gap} ${className}`}>
    {icon}
    <span className="leading-none">{text}</span>
  </div>
);

// 使用
<IconText icon={<Icon name="like" />} text="点赞" gap="1.5" />
```

### 2. 创建对齐工具类
在 `globals.css` 中添加：

```css
/* 图标文字组合 */
.icon-text {
  @apply inline-flex items-center justify-center gap-2;
}

.icon-text > span {
  @apply leading-none;
}

/* 固定尺寸容器 */
.fixed-size {
  @apply flex-shrink-0;
}
```

### 3. ESLint 规则
考虑添加自定义规则检查：
- 是否有 `transform: translateY`
- 文字元素是否有 `leading-none`
- 是否使用了 `inline-flex` + `items-center`

---

**检查频率**: 每次提交前  
**负责人**: 前端开发团队  
**最后更新**: 2025年10月26日

