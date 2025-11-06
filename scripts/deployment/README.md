# 部署脚本说明

本目录包含所有部署和维护相关的PowerShell脚本。

## 📋 脚本列表

### 🚀 部署脚本

#### Deploy-Staging.ps1
测试环境部署脚本

```powershell
# 部署后端
.\scripts\deployment\Deploy-Staging.ps1 -Target backend

# 部署前端
.\scripts\deployment\Deploy-Staging.ps1 -Target frontend

# 部署全部
.\scripts\deployment\Deploy-Staging.ps1 -Target all
```

**特性**：
- ✅ 自动检测并创建配置文件（从生产环境复制）
- ✅ 智能Git同步（避免不必要的推送）
- ✅ 完整的健康检查
- ✅ 详细的日志输出

#### Deploy-Production.ps1
生产环境部署脚本（暂未更新）

### 🔧 维护脚本

#### Fix-Staging-All.ps1 ⭐ 推荐
**一键诊断并修复测试环境所有常见问题**

```powershell
# 交互式诊断和修复（推荐）
.\scripts\deployment\Fix-Staging-All.ps1

# 自动修复所有问题（不询问）
.\scripts\deployment\Fix-Staging-All.ps1 -AutoFix
```

**自动检查并修复**：
1. SSH连接
2. 目录结构
3. 配置文件（自动从生产环境复制）
4. 数据库创建
5. PM2进程状态
6. 端口占用
7. 健康检查
8. 依赖安装
9. Prisma客户端

**适用场景**：
- 🆕 首次部署测试环境
- 🔄 重置测试环境
- ❌ 部署失败后快速修复
- 🚨 测试环境无法访问

#### Diagnose-Staging.ps1
**仅诊断问题，不做任何修复**

```powershell
.\scripts\deployment\Diagnose-Staging.ps1
```

**检查项目**：
- SSH连接
- 目录结构
- 配置文件
- PM2进程状态
- 端口占用
- 健康检查
- 最近的错误日志

**适用场景**：
- 🔍 快速了解测试环境状态
- 📊 生成诊断报告
- 🎯 定位问题而不修改环境

#### Fix-Staging-Env.ps1
**修复配置文件和环境设置**

```powershell
.\scripts\deployment\Fix-Staging-Env.ps1
```

**功能**：
- 从生产环境复制配置
- 自动修改为测试环境参数
- 创建测试数据库
- 验证配置正确性

**适用场景**：
- 📝 配置文件丢失或损坏
- 🔄 需要从生产环境同步配置
- 🆕 手动创建测试环境

## 🎯 常见使用场景

### 场景1: 首次部署测试环境
```powershell
# 1. 一键修复（创建所有必需的资源）
.\scripts\deployment\Fix-Staging-All.ps1 -AutoFix

# 2. 部署代码
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
```

### 场景2: 测试环境出问题了
```powershell
# 直接运行一键修复
.\scripts\deployment\Fix-Staging-All.ps1

# 按提示选择是否修复各项问题
```

### 场景3: 只想查看状态
```powershell
# 仅诊断，不修复
.\scripts\deployment\Diagnose-Staging.ps1
```

### 场景4: 日常部署更新
```powershell
# 直接部署即可（会自动检测配置）
.\scripts\deployment\Deploy-Staging.ps1 -Target backend
```

### 场景5: 配置文件丢失
```powershell
# 方法1: 使用专门的配置修复脚本
.\scripts\deployment\Fix-Staging-Env.ps1

# 方法2: 使用一键修复（推荐）
.\scripts\deployment\Fix-Staging-All.ps1
```

## ⚙️ 技术细节

### SSH连接
所有脚本都通过SSH连接到服务器：
- Host: `ieclub.online`
- User: `root`
- Port: `22`

### 目录结构
- 生产环境：`/root/IEclub_dev/ieclub-backend`
- 测试环境：`/root/IEclub_dev_staging/ieclub-backend`

### 关键配置差异

| 配置项 | 生产环境 | 测试环境 |
|--------|----------|----------|
| NODE_ENV | production | staging |
| PORT | 3000 | 3001 |
| DATABASE | ieclub | ieclub_staging |
| REDIS_DB | 0 | 1 |
| PM2名称 | ieclub-backend | staging-backend |

## 🔍 故障排查

### SSH连接失败
1. 检查网络连接
2. 确认SSH密钥已配置
3. 如使用Clash代理，确保TUN模式已关闭

### 配置文件问题
```powershell
# 使用一键修复，选择修复配置文件
.\scripts\deployment\Fix-Staging-All.ps1
```

### 数据库问题
```powershell
# 一键修复会自动创建数据库
.\scripts\deployment\Fix-Staging-All.ps1
```

### PM2进程问题
```powershell
# 一键修复会检测并尝试修复PM2问题
.\scripts\deployment\Fix-Staging-All.ps1
```

## 📝 脚本开发规范

### 命名约定
- `Deploy-*.ps1`: 部署相关
- `Fix-*.ps1`: 修复相关
- `Diagnose-*.ps1`: 诊断相关
- `Check-*.ps1`: 检查相关

### 输出规范
使用统一的颜色编码：
- ✅ 绿色：成功/正常
- ❌ 红色：错误/失败
- ⚠️ 黄色：警告
- ℹ️ 蓝色/青色：信息
- 🔧 蓝色：步骤开始

### SSH命令执行
使用 `Invoke-SSH` 函数（如果有定义）或标准SSH命令：
```powershell
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "command"
```

## 🚀 最佳实践

1. **部署前检查**：使用 `Diagnose-Staging.ps1` 了解当前状态
2. **遇到问题**：优先使用 `Fix-Staging-All.ps1` 一键修复
3. **手动介入**：如自动修复失败，使用 `Fix-Staging-Env.ps1` 等专门脚本
4. **定期检查**：定期运行 `Diagnose-Staging.ps1` 了解环境健康状况

## 📚 相关文档

- [部署指南](../../docs/deployment/Deployment_guide.md)
- [快速提醒](../../REMIND.md)
- [健康检查脚本](../health-check/)
