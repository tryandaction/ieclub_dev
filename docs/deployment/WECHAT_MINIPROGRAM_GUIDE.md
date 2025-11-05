# 微信小程序开发与发布指南

> 📱 本指南详细说明如何配置微信开发者工具、调试小程序、以及发布到线上

---

## 📋 目录

1. [前置准备](#前置准备)
2. [配置微信开发者工具](#配置微信开发者工具)
3. [连接测试环境调试](#连接测试环境调试)
4. [连接生产环境](#连接生产环境)
5. [发布流程](#发布流程)
6. [常见问题](#常见问题)

---

## 🎯 前置准备

### 1. 注册微信小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 使用管理员微信扫码注册小程序账号
3. 完成小程序信息填写（名称、图标、简介等）
4. 获取 **AppID** (在"开发 → 开发管理 → 开发设置"中查看)

### 2. 下载微信开发者工具

1. 访问 [微信开发者工具下载页](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 根据操作系统下载对应版本：
   - Windows: 稳定版 (Stable Build)
   - macOS: 选择 Intel 或 Apple Silicon 版本
   - Linux: 支持主流发行版

3. 安装并启动

### 3. 添加开发者

在微信公众平台：
1. 进入"管理 → 成员管理"
2. 添加团队成员为"项目成员"或"体验成员"
3. 分配权限（开发者、体验者、数据分析等）

---

## 🔧 配置微信开发者工具

### 步骤 1: 创建小程序项目

1. **打开微信开发者工具**
2. **点击「+」新建项目**
3. **填写项目信息：**
   ```
   项目名称: IEClub
   目录: C:\universe\GitHub_try\IEclub_dev\ieclub-frontend
   AppID: 使用你注册的小程序AppID (wx...)
   开发模式: 小程序
   后端服务: 不使用云服务
   ```

4. **点击"新建"**

### 步骤 2: 项目配置文件

确保 `ieclub-frontend/project.config.json` 存在并正确配置：

```json
{
  "description": "IEClub小程序项目配置文件",
  "packOptions": {
    "ignore": [],
    "include": []
  },
  "setting": {
    "bundle": false,
    "userConfirmedBundleSwitch": false,
    "urlCheck": false,
    "scopeDataCheck": false,
    "coverView": true,
    "es6": true,
    "postcss": true,
    "compileHotReLoad": true,
    "lazyloadPlaceholderEnable": false,
    "preloadBackgroundData": false,
    "minified": true,
    "autoAudits": false,
    "newFeature": false,
    "uglifyFileName": false,
    "uploadWithSourceMap": true,
    "useIsolateContext": true,
    "nodeModules": false,
    "enhance": true,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "showShadowRootInWxmlPanel": true,
    "packNpmManually": false,
    "enableEngineNative": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "showES6CompileOption": false,
    "minifyWXML": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "condition": false
  },
  "compileType": "miniprogram",
  "libVersion": "3.5.7",
  "appid": "wxYOUR_APPID_HERE",
  "projectname": "IEClub",
  "condition": {},
  "editorSetting": {
    "tabIndent": "insertSpaces",
    "tabSize": 2
  }
}
```

**重要配置说明：**
- `appid`: 替换为你的小程序AppID
- `urlCheck: false`: 开发时关闭域名校验（正式版需要配置合法域名）
- `es6: true`: 启用ES6转ES5
- `minified: true`: 上传代码时自动压缩

### 步骤 3: 配置合法域名（生产环境必需）

在微信公众平台：
1. 进入"开发 → 开发管理 → 开发设置 → 服务器域名"
2. 配置以下域名：

```
request合法域名:
  https://ieclub.online
  https://test.ieclub.online  (可选，用于测试)

uploadFile合法域名:
  https://ieclub.online

downloadFile合法域名:
  https://ieclub.online

socket合法域名:
  wss://ieclub.online  (如果使用WebSocket)
```

**注意：**
- 域名必须使用HTTPS/WSS协议
- 每月可修改5次
- 配置后需要等待几分钟生效

---

## 🧪 连接测试环境调试

### 1. 配置测试环境API地址

在 `ieclub-frontend/config/env.js` 中设置：

```javascript
// 环境配置
const ENV = {
  // 开发环境（连接测试服务器）
  development: {
    apiBaseUrl: 'https://test.ieclub.online/api',
    websocketUrl: 'wss://test.ieclub.online/ws'
  },
  
  // 生产环境
  production: {
    apiBaseUrl: 'https://ieclub.online/api',
    websocketUrl: 'wss://ieclub.online/ws'
  }
};

// 根据编译模式选择环境
const currentEnv = ENV[process.env.NODE_ENV] || ENV.development;

module.exports = currentEnv;
```

### 2. 在微信开发者工具中调试

#### 启用开发模式：

1. **点击右上角"详情"**
2. **勾选以下选项：**
   ```
   ✓ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
   ✓ 启用调试
   ✓ 自动编译
   ```

#### 调试工具：

| 工具 | 说明 |
|------|------|
| **Console** | 查看日志、错误信息 |
| **Network** | 查看网络请求、响应数据 |
| **Storage** | 查看缓存数据、Storage |
| **AppData** | 查看页面数据绑定 |
| **Wxml** | 查看页面结构 |
| **Sensor** | 模拟地理位置、重力感应等 |

#### 测试流程：

```bash
1. 确保测试环境后端正常运行:
   curl https://test.ieclub.online/api/health

2. 在微信开发者工具中点击"编译"

3. 测试核心功能:
   - 用户注册/登录
   - 数据加载
   - 图片上传
   - 消息推送

4. 检查Console中是否有错误

5. 使用Network面板确认API请求是否正常
```

### 3. 真机预览调试

1. **点击工具栏"预览"按钮**
2. **用微信扫描生成的二维码**
3. **在手机上实际测试**

**真机调试优势：**
- 测试真实性能
- 测试手机特有功能（摄像头、位置、陀螺仪等）
- 测试网络环境（4G、WiFi切换）

**开启真机调试（查看日志）：**
1. 点击工具栏"真机调试"
2. 扫码后可在电脑上查看手机日志

---

## 🚀 连接生产环境

### 1. 切换到生产配置

修改 `ieclub-frontend/config/env.js`:

```javascript
// 强制使用生产环境
const currentEnv = ENV.production;
```

或在编译时设置：
```bash
NODE_ENV=production npm run build
```

### 2. 构建生产版本

```bash
# 进入小程序目录
cd C:\universe\GitHub_try\IEclub_dev\ieclub-frontend

# 清理缓存
npm run clean  # 如果有此脚本

# 构建
npm run build:weapp  # 如果有此脚本
```

### 3. 上传代码

1. **点击工具栏"上传"按钮**
2. **填写版本信息：**
   ```
   版本号: 1.0.0 (遵循语义化版本)
   项目备注: 修复了登录bug，优化了性能
   ```
3. **点击"上传"**

上传后代码会出现在微信公众平台的"版本管理"中。

---

## 📦 发布流程

### 完整发布检查清单

```
□ 1. 后端已部署到生产环境并通过健康检查
□ 2. 前端API地址已切换到生产环境
□ 3. 小程序已配置合法域名
□ 4. 代码已在测试环境充分测试
□ 5. 代码已通过Code Review
□ 6. 版本号已更新
```

### 步骤 1: 确保生产环境正常

```powershell
# 运行生产环境部署并验证
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production-OneClick.ps1 -Target all
```

### 步骤 2: 上传代码到微信后台

按照上一节"上传代码"的步骤操作。

### 步骤 3: 提交审核

1. **登录微信公众平台**
2. **进入"版本管理"**
3. **找到刚上传的版本，点击"提交审核"**
4. **填写审核信息：**
   
   ```
   功能页面:
   - 首页: pages/index/index
   - 登录页: pages/login/login
   - 个人中心: pages/profile/profile
   
   测试账号: (提供一个可用的测试账号)
   用户名: test@sustech.edu.cn
   密码: Test123456
   
   补充说明:
   - 简述小程序的核心功能
   - 说明特殊权限的用途（如位置、相机等）
   ```

5. **勾选"已阅读并同意《微信小程序平台服务条款》"**
6. **提交审核**

### 步骤 4: 等待审核

- **审核时间**: 通常1-7个工作日
- **审核状态**: 在"版本管理"中查看
- **可能结果**:
  - ✅ **审核通过**: 可以发布
  - ❌ **审核失败**: 根据反馈修改后重新提交

### 步骤 5: 发布上线

审核通过后：

1. **进入"版本管理"**
2. **点击"发布"按钮**
3. **确认发布**
4. **等待5-10分钟，小程序正式上线**

### 步骤 6: 验证发布

1. **在微信中搜索小程序**
2. **测试核心功能**
3. **检查版本号是否正确**（在"关于"页面）

---

## 🔥 快速部署命令

### 完整工作流（从开发到发布）

```powershell
# 1. 测试环境部署并验证
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-And-Verify.ps1 -Target all -Message "新功能开发完成"

# 2. 小程序连接测试环境调试
# (在微信开发者工具中手动操作)

# 3. 确认无误后部署到生产环境
.\scripts\deployment\Deploy-Production-OneClick.ps1 -Target all -Message "v1.0.0 正式发布"

# 4. 小程序切换到生产环境并上传
# (在微信开发者工具中手动操作)

# 5. 微信公众平台提交审核
# (在网页端手动操作)
```

---

## 🛠️ 常见问题

### 1. **"不在以下 request 合法域名列表中"**

**原因**: 未配置合法域名或开发时未关闭域名校验

**解决方案**:
- 开发阶段: 在微信开发者工具"详情"中勾选"不校验合法域名"
- 生产环境: 在微信公众平台配置合法域名

### 2. **"网络请求失败"**

**排查步骤**:
```bash
# 1. 检查后端是否正常
curl https://ieclub.online/api/health

# 2. 检查API地址配置
# 查看 ieclub-frontend/config/env.js

# 3. 检查网络请求代码
# 查看 Console 中的具体错误信息

# 4. 检查服务器HTTPS证书
openssl s_client -connect ieclub.online:443
```

### 3. **"上传代码包大小超过限制"**

**限制**: 小程序代码包总大小不超过 **16MB**，分包后单个包不超过 **2MB**

**优化方案**:
- 压缩图片（使用 WebP 格式）
- 删除未使用的库和文件
- 使用分包加载（按需加载）
- 图片使用CDN，不要直接打包到代码中

### 4. **"Appid不匹配"**

**原因**: `project.config.json` 中的 `appid` 与登录的账号不匹配

**解决**:
- 确认登录的微信账号是否为小程序管理员
- 检查 `project.config.json` 中的 `appid` 是否正确

### 5. **"审核被拒"**

**常见原因**:
- 功能描述不清晰
- 未提供测试账号或测试账号无法使用
- 涉及未申请的类目（如金融、教育需要资质）
- 包含不合规内容

**解决方案**:
- 仔细阅读拒绝原因
- 根据反馈修改
- 补充必要的说明和资质
- 重新提交审核

### 6. **小程序打开空白或加载失败**

**排查清单**:
```
□ 检查API地址是否正确
□ 检查网络请求是否成功（Network面板）
□ 检查Console是否有JavaScript错误
□ 检查小程序基础库版本是否兼容
□ 尝试真机调试查看日志
```

---

## 📚 参考资源

| 资源 | 链接 |
|------|------|
| 微信小程序官方文档 | https://developers.weixin.qq.com/miniprogram/dev/framework/ |
| 微信开发者工具文档 | https://developers.weixin.qq.com/miniprogram/dev/devtools/devtools.html |
| 微信公众平台 | https://mp.weixin.qq.com/ |
| 小程序审核规范 | https://developers.weixin.qq.com/miniprogram/product/index.html |

---

## 🎯 总结

### 开发阶段
1. 使用测试环境 (`test.ieclub.online`)
2. 关闭域名校验
3. 频繁使用真机预览测试

### 发布阶段
1. 切换到生产环境 (`ieclub.online`)
2. 配置合法域名
3. 上传代码 → 提交审核 → 发布

### 最佳实践
- ✅ 先在测试环境充分测试
- ✅ 版本号遵循语义化（major.minor.patch）
- ✅ 每次发布前运行完整的部署验证脚本
- ✅ 保持代码体积小（< 2MB per package）
- ✅ 详细填写审核信息，提供可用的测试账号

---

**有问题？** 查看 [常见问题](#常见问题) 或联系团队成员。

