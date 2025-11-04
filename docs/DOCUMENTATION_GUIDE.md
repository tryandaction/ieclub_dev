# 文档维护指南

## 📋 文档分类

### 1. 核心文档（长期维护）
这些文档是项目的基础，需要持续更新：

- `README.md` - 项目总体介绍
- `REMIND.md` - 重要提醒和快速参考
- `docs/README.md` - 文档索引
- `docs/deployment/Deployment_guide.md` - 部署指南
- `ieclub-backend/README.md` - 后端项目说明
- `ieclub-backend/CHANGELOG.md` - 后端变更日志

### 2. 配置文档（需要时更新）
环境配置和设置相关：

- `docs/GIT_PROXY_SETUP.md` - Git代理配置
- `ieclub-backend/QUICK_START.md` - 快速开始指南
- `ieclub-backend/scripts/README.md` - 脚本工具说明

### 3. 临时文档（及时清理）
问题修复报告、一次性任务文档：

❌ **不应保留的文档示例**：
- `BUG_FIX_REPORT_2025_11_03.md`
- `STAGING_DEPLOYMENT_FIX_REPORT.md`
- `MINIPROGRAM_OPTIMIZATION_REPORT_2025_11_03.md`
- `LOGIN_REGISTER_REDESIGN_2025_11_03.md`

✅ **处理方式**：
- 问题解决后，将关键信息整合到 `REMIND.md` 或 `CHANGELOG.md`
- 删除临时报告文档
- 如有必要，在Git历史中保留记录

---

## 📝 文档命名规范

### 核心原则
1. **使用英文命名** - 避免中文文件名导致的编码问题
2. **描述性名称** - 文件名应清楚表明内容
3. **使用下划线或连字符** - 如 `Deployment_guide.md` 或 `deployment-guide.md`

### 命名模板

```
# 功能文档
<Feature>_<Type>.md
例如: Deployment_guide.md, API_reference.md

# 临时文档（应及时删除）
<Topic>_<Date>.md
例如: BUG_FIX_2025_11_04.md, HOTFIX_2025_11_04.md

# 配置文档
<Service>_<Config>.md
例如: GIT_PROXY_SETUP.md, NGINX_CONFIG.md
```

### 禁止的命名方式
- ❌ 中文文件名：`测试环境部署说明.md`
- ❌ 过长文件名：`COMPLETE_USER_ACCOUNT_MANAGEMENT_DEEP_OPTIMIZATION_REPORT.md`
- ❌ 无意义名称：`temp.md`, `new_file.md`

---

## 🗂️ 文档组织结构

```
IEclub_dev/
├── README.md                          # 项目总览
├── REMIND.md                          # 重要提醒（必读）
├── LICENSE                            # 开源协议
│
├── docs/                              # 📂 文档目录
│   ├── README.md                      # 文档索引
│   ├── DOCUMENTATION_GUIDE.md         # 文档维护指南（本文件）
│   ├── GIT_PROXY_SETUP.md            # Git配置指南
│   │
│   ├── deployment/                    # 部署相关
│   │   └── Deployment_guide.md
│   │
│   ├── development/                   # 开发相关（可选）
│   │   ├── API_reference.md
│   │   └── Database_schema.md
│   │
│   └── operations/                    # 运维相关（可选）
│       ├── Monitoring.md
│       └── Backup_restore.md
│
├── ieclub-backend/
│   ├── README.md                      # 后端说明
│   ├── QUICK_START.md                 # 快速开始
│   ├── CHANGELOG.md                   # 更新日志
│   └── scripts/
│       └── README.md                  # 脚本说明
│
└── ieclub-web/
    └── README.md                      # 前端说明
```

---

## ✍️ 文档编写规范

### 1. Markdown格式

#### 标题层级
```markdown
# 一级标题 - 文档标题
## 二级标题 - 主要章节
### 三级标题 - 子章节
#### 四级标题 - 详细内容
```

#### 代码块
````markdown
```bash
# 使用语言标识
npm install
```

```javascript
const app = express();
```
````

#### 强调和提示
```markdown
**重要**: 粗体强调
*斜体*: 次要强调

> 💡 **提示**: 使用引用块突出重要信息

⚠️ **警告**: 使用emoji增强可读性
✅ **成功**: 
❌ **错误**: 
```

### 2. 内容组织

#### 文档开头
```markdown
# 文档标题

> 📌 **最后更新**: 2025-11-04  
> 📌 **维护人**: 开发团队  
> 📌 **状态**: 活跃维护

## 概述
简短描述文档内容和目的...

## 目录
- [章节1](#章节1)
- [章节2](#章节2)
```

#### 代码示例
```markdown
## 使用示例

### 基本用法
\`\`\`bash
# 步骤1：准备环境
npm install

# 步骤2：启动服务
npm run dev
\`\`\`

### 高级用法
\`\`\`bash
# 自定义配置
npm run dev -- --port 3001
\`\`\`
```

#### 故障排查
```markdown
## 故障排查

### 问题1: 服务启动失败

**症状**: 
- 错误信息：`EADDRINUSE: address already in use`

**原因**: 
- 端口已被占用

**解决方案**:
\`\`\`bash
# 查找占用进程
lsof -i :3000

# 结束进程
kill -9 <PID>
\`\`\`
```

---

## 🔄 文档更新流程

### 日常更新

1. **修改文档**
   ```bash
   # 编辑相关文档
   vim REMIND.md
   ```

2. **更新时间戳**
   ```markdown
   > 📌 **最后更新**: 2025-11-04
   ```

3. **提交到Git**
   ```bash
   git add REMIND.md
   git commit -m "docs: 更新服务器配置说明"
   git push
   ```

### 重大更新

1. **创建分支**
   ```bash
   git checkout -b docs/update-deployment-guide
   ```

2. **更新文档**
   - 修改相关文档
   - 更新索引（`docs/README.md`）
   - 更新变更日志（如适用）

3. **审查和合并**
   ```bash
   git add .
   git commit -m "docs: 重构部署指南"
   git push origin docs/update-deployment-guide
   # 创建Pull Request进行审查
   ```

---

## 🧹 文档清理

### 清理时机
- 每次部署完成后
- 每周定期检查
- 项目milestone完成后

### 清理步骤

1. **识别临时文档**
   ```bash
   # 查找带日期的文档
   ls -la | grep "_2025_"
   
   # 查找临时文档
   ls -la | grep -E "(FIX|REPORT|TEMP)"
   ```

2. **提取有用信息**
   - 将关键信息整合到 `REMIND.md`
   - 重要变更记录到 `CHANGELOG.md`
   - 配置更新到相关文档

3. **删除临时文档**
   ```bash
   # 删除临时文档
   git rm STAGING_DEPLOYMENT_FIX_REPORT.md
   git commit -m "docs: 清理临时部署报告"
   ```

4. **更新索引**
   - 确保 `docs/README.md` 中的链接有效
   - 移除已删除文档的引用

### 清理检查清单

- [ ] 所有临时报告已整合或删除
- [ ] `REMIND.md` 包含最新信息
- [ ] `CHANGELOG.md` 记录了重要变更
- [ ] `docs/README.md` 索引准确
- [ ] 没有重复的文档
- [ ] 没有过时的信息

---

## 📊 文档质量标准

### 必须满足
1. ✅ 标题清晰，层级合理
2. ✅ 代码示例完整可运行
3. ✅ 步骤说明详细准确
4. ✅ 包含故障排查指南
5. ✅ 更新时间戳

### 应该具备
1. 📝 目录导航
2. 📝 相关链接
3. 📝 示例和截图
4. 📝 注意事项和警告
5. 📝 参考资料

### 避免问题
1. ❌ 信息过时
2. ❌ 步骤不完整
3. ❌ 无法运行的代码
4. ❌ 缺少上下文
5. ❌ 重复内容

---

## 🎯 特定文档更新规则

### REMIND.md
**更新频率**: 每次重要配置变更后

**包含内容**:
- 服务状态和访问地址
- 常用命令速查
- 最近的重要变更
- 故障排查指南

**不应包含**:
- 详细的API文档（应放在单独文档）
- 历史问题记录（应放在CHANGELOG）
- 临时的修复步骤（问题解决后删除）

### CHANGELOG.md
**更新频率**: 每次发布新版本

**格式**:
```markdown
## [版本号] - YYYY-MM-DD

### Added（新增）
- 新功能描述

### Changed（变更）
- 修改内容描述

### Fixed（修复）
- 修复的问题描述

### Removed（移除）
- 删除的功能描述
```

### Deployment_guide.md
**更新频率**: 部署流程变更后

**重点**:
- 保持与实际部署脚本同步
- 包含完整的前置条件
- 详细的步骤说明
- 回滚方案

---

## 🔗 相关资源

- [Markdown语法指南](https://www.markdownguide.org/)
- [语义化版本控制](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

---

## 📞 文档维护

如发现文档问题：
1. 创建Issue描述问题
2. 提交PR修复
3. 通知团队审查

**维护者**: 开发团队  
**最后审查**: 2025-11-04

