# IEclub 管理后台 Web端

**版本**: v1.0  
**技术栈**: React 18 + TypeScript + Ant Design 5 + Redux Toolkit + Vite  
**状态**: 🚧 核心功能已完成，部分页面开发中

---

## 📁 项目结构

```
admin-web/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API服务层
│   │   ├── request.ts    # Axios配置和拦截器
│   │   ├── admin.ts      # 管理员API
│   │   ├── announcement.ts # 公告API
│   │   ├── user.ts       # 用户API
│   │   ├── stats.ts      # 统计API
│   │   ├── report.ts     # 举报API
│   │   └── audit.ts      # 审计日志API
│   ├── components/        # 通用组件
│   │   └── Layout/       # 布局组件
│   │       ├── MainLayout.tsx
│   │       └── MainLayout.less
│   ├── pages/            # 页面组件
│   │   ├── Login/        # 登录页
│   │   ├── Dashboard/    # 仪表盘
│   │   ├── Announcements/  # 公告管理（待开发）
│   │   ├── Users/        # 用户管理（待开发）
│   │   ├── Reports/      # 举报管理（待开发）
│   │   ├── Stats/        # 数据统计（待开发）
│   │   ├── Audit/        # 审计日志（待开发）
│   │   └── Settings/     # 系统设置（待开发）
│   ├── store/            # Redux状态管理
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── announcementSlice.ts
│   │       ├── userSlice.ts
│   │       └── reportSlice.ts
│   ├── types/            # TypeScript类型定义
│   │   ├── admin.ts
│   │   ├── announcement.ts
│   │   ├── user.ts
│   │   ├── stats.ts
│   │   └── common.ts
│   ├── utils/            # 工具函数
│   │   ├── auth.ts       # 权限工具
│   │   └── format.ts     # 格式化工具
│   ├── constants/        # 常量定义
│   │   └── index.ts
│   ├── App.tsx           # 应用根组件
│   ├── App.less          # 全局样式
│   └── main.tsx          # 应用入口
├── index.html            # HTML模板
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
├── package.json          # 项目配置
└── README.md            # 本文件
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3001

### 3. 构建生产版本

```bash
npm run build
```

### 4. 预览生产构建

```bash
npm run preview
```

---

## ✅ 已完成功能

### 核心架构
- [x] 项目初始化和配置
- [x] TypeScript类型系统
- [x] Vite构建配置
- [x] ESLint代码规范

### API服务层
- [x] Axios请求封装
- [x] 请求/响应拦截器
- [x] Token自动刷新机制
- [x] 统一错误处理
- [x] 完整的API接口定义

### 状态管理
- [x] Redux Toolkit配置
- [x] 认证状态管理
- [x] 公告状态管理
- [x] 用户状态管理
- [x] 举报状态管理

### 工具函数
- [x] 权限检查工具
- [x] 日期格式化
- [x] 数字格式化
- [x] 文本处理工具

### 页面组件
- [x] 登录页面（支持2FA）
- [x] 主布局（Sider + Header + Content）
- [x] 仪表盘（数据概览 + 图表）

### 权限系统
- [x] 路由守卫
- [x] 菜单权限过滤
- [x] 按钮权限控制

---

## 🚧 待开发功能

### 页面组件
- [ ] 公告管理页面
  - [ ] 公告列表
  - [ ] 创建/编辑公告
  - [ ] 公告统计
- [ ] 用户管理页面
  - [ ] 用户列表
  - [ ] 用户详情
  - [ ] 警告/封禁操作
- [ ] 内容管理页面
  - [ ] 帖子管理
  - [ ] 话题管理
- [ ] 举报管理页面
  - [ ] 举报列表
  - [ ] 举报处理
- [ ] 数据统计页面
  - [ ] 用户统计
  - [ ] 内容统计
  - [ ] 数据导出
- [ ] 审计日志页面
  - [ ] 日志列表
  - [ ] 日志详情
- [ ] 系统设置页面
  - [ ] 个人设置
  - [ ] 系统配置

### 通用组件
- [ ] 数据表格组件
- [ ] 搜索表单组件
- [ ] 富文本编辑器
- [ ] 图片上传组件
- [ ] 日期选择器
- [ ] 导出功能组件

---

## 🔑 登录信息

**默认管理员账户**:
- 邮箱: `admin@ieclub.com`
- 密码: 您在初始化时设置的密码

首次登录后，建议：
1. 修改默认密码
2. 启用双因素认证（2FA）
3. 完善个人信息

---

## 📖 开发指南

### 添加新页面

1. 在 `src/pages/` 下创建页面目录
2. 创建 `index.tsx` 和 `index.less`
3. 在 `App.tsx` 中添加路由
4. 在 `MainLayout.tsx` 中添加菜单项

**示例**:
```tsx
// src/pages/Example/index.tsx
import React from 'react';
import './index.less';

const Example: React.FC = () => {
  return (
    <div className="example-page">
      <h1>示例页面</h1>
    </div>
  );
};

export default Example;
```

### 添加新API

1. 在 `src/api/` 下创建API文件
2. 使用 `http` 工具发起请求
3. 定义请求/响应类型

**示例**:
```typescript
// src/api/example.ts
import { http } from './request';
import type { ApiResponse } from '@/types/common';

export const exampleApi = {
  getList: (params: any) => {
    return http.get<any>('/example', { params });
  },
  
  create: (data: any) => {
    return http.post<any>('/example', data);
  },
};
```

### 添加状态管理

1. 在 `src/store/slices/` 下创建slice
2. 在 `src/store/index.ts` 中注册reducer
3. 使用 `useAppSelector` 和 `useAppDispatch` hooks

**示例**:
```typescript
// src/store/slices/exampleSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExampleState {
  data: any[];
  loading: boolean;
}

const initialState: ExampleState = {
  data: [],
  loading: false,
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
    },
  },
});

export const { setData } = exampleSlice.actions;
export default exampleSlice.reducer;
```

---

## 🎨 UI设计规范

### 颜色
- 主色: #1890ff
- 成功: #52c41a
- 警告: #faad14
- 错误: #f5222d
- 链接: #1890ff

### 间距
- 页面边距: 24px
- 卡片间距: 16px
- 表单项间距: 16px

### 字体
- 标题: 24px / 20px / 16px
- 正文: 14px
- 辅助文字: 12px

---

## 🐛 常见问题

### Q: 登录后Token过期？
**A**: Token有效期为2小时，系统会自动使用RefreshToken刷新。如果RefreshToken也过期，需要重新登录。

### Q: 菜单项不显示？
**A**: 检查当前管理员角色是否有对应权限。菜单会根据权限自动过滤。

### Q: API请求失败？
**A**: 检查：
1. 后端服务是否启动
2. API地址是否正确
3. Token是否有效
4. 网络连接是否正常

### Q: 开发环境跨域问题？
**A**: Vite已配置代理，所有 `/api` 请求会自动转发到 `http://localhost:3000`

---

## 📦 依赖说明

### 核心依赖
- `react`: 18.2.0 - React核心库
- `react-dom`: 18.2.0 - React DOM渲染
- `react-router-dom`: 6.20.0 - 路由管理
- `@reduxjs/toolkit`: 2.0.1 - 状态管理
- `react-redux`: 9.0.4 - React Redux绑定
- `antd`: 5.12.0 - UI组件库
- `axios`: 1.6.2 - HTTP客户端
- `echarts`: 5.4.3 - 图表库
- `echarts-for-react`: 3.0.2 - React ECharts封装
- `dayjs`: 1.11.10 - 日期处理
- `qrcode.react`: 3.1.0 - 二维码生成

### 开发依赖
- `vite`: 5.0.8 - 构建工具
- `typescript`: 5.2.2 - TypeScript支持
- `eslint`: 8.55.0 - 代码检查
- `less`: 4.2.0 - CSS预处理器

---

## 🚀 部署指南

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

构建产物在 `dist/` 目录

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name admin.ieclub.com;

    root /var/www/admin-web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 更新日志

### v1.0.0 (2025-11-05)

**新增**:
- ✨ 完整的项目架构
- ✨ API服务层和请求拦截
- ✨ Redux状态管理
- ✨ 登录页面（支持2FA）
- ✨ 主布局和菜单系统
- ✨ 仪表盘页面
- ✨ 权限控制系统

**待开发**:
- 🚧 其他管理页面
- 🚧 通用组件库
- 🚧 完整的表单验证
- 🚧 错误边界处理
- 🚧 单元测试

---

## 👥 贡献

欢迎提交Issue和Pull Request！

---

## 📄 许可

IEclub © 2025

---

**文档版本**: v1.0  
**最后更新**: 2025-11-05  
**维护者**: IEclub技术团队

