# 📦 IEClub 部署脚本说明

> 本目录包含 IEClub 项目的所有部署相关脚本

---

## 📋 脚本列表

### 🧪 测试环境部署

#### 1. `Deploy-Staging.ps1` - 标准测试环境部署
**用途**: 部署代码到测试环境 (test.ieclub.online)

**使用方法**:
```powershell
# 部署全部（前端+后端）
.\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 仅部署前端
.\Deploy-Staging.ps1 -Target web -Message "修复样式问题"

# 仅部署后端
.\Deploy-Staging.ps1 -Target backend -Message "优化API性能"
```

**特点**:
- ✅ 自动 Git 提交和推送
- ✅ 自动构建前端
- ✅ 自动部署到服务器
- ✅ 包含健康检查
- ✅ 支持自动回滚

---

#### 2. `Deploy-And-Verify.ps1` - 部署并全面验证（推荐）
**用途**: 部署到测试环境后自动执行全面验证

**使用方法**:
```powershell
.\Deploy-And-Verify.ps1 -Target all -Message "完成用户模块开发"
```

**验证内容**:
- ✓ 网页端访问验证
- ✓ API 后端功能验证
- ✓ 小程序兼容性验证
- ✓ 自动生成验证报告

**适用场景**:
- 日常开发测试
- 发布前最终验证
- CI/CD 流水线

---

### 🚀 生产环境部署

#### 3. `Deploy-Production.ps1` - 传统生产部署
**用途**: 手动部署到生产环境 (ieclub.online)

**使用方法**:
```powershell
# 部署全部
.\Deploy-Production.ps1

# 仅部署前端
.\Deploy-Production.ps1 -Frontend

# 仅部署后端
.\Deploy-Production.ps1 -Backend
```

**特点**:
- ⚠️ 需要手动确认
- ✅ 包含健康检查
- ✅ 详细的部署日志

---

#### 4. `Deploy-Production-OneClick.ps1` - 一键生产部署（推荐）
**用途**: 从测试环境验证通过后，安全地一键部署到生产环境

**使用方法**:
```powershell
.\Deploy-Production-OneClick.ps1 -Target all -Message "v1.0.0 正式发布"
```

**流程**:
1. 🔍 检查测试环境状态
2. ⚠️ 安全确认（需输入 YES）
3. 📦 执行部署
4. ✅ 验证生产环境
5. 📊 生成部署报告

**安全特性**:
- ✓ 强制测试环境验证
- ✓ 多重确认机制
- ✓ 自动健康检查
- ✓ 回滚建议

---

## 🔄 推荐工作流程

### 日常开发流程

```powershell
# 1. 本地开发
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\QUICK_START.ps1

# 2. 功能开发完成后，部署到测试环境并验证
cd C:\universe\GitHub_try\IEclub_dev\scripts\deployment
.\Deploy-And-Verify.ps1 -Target all -Message "新增XXX功能"

# 3. 测试环境验证通过（建议至少24小时）

# 4. 部署到生产环境
.\Deploy-Production-OneClick.ps1 -Target all -Message "v1.0.0 新增XXX功能"
```

### 快速修复流程（Hot Fix）

```powershell
# 1. 修复代码后，先部署到测试环境
.\Deploy-Staging.ps1 -Target backend -Message "修复XXX严重bug"

# 2. 快速验证
curl https://test.ieclub.online/api/health

# 3. 确认修复成功后，立即部署生产
.\Deploy-Production-OneClick.ps1 -Target backend -Message "紧急修复XXX"
```

### 仅前端更新流程

```powershell
# 1. 测试环境
.\Deploy-Staging.ps1 -Target web -Message "优化UI样式"

# 2. 验证并部署生产
.\Deploy-Production-OneClick.ps1 -Target web -Message "UI优化"
```

---

## 📊 脚本对比

| 脚本 | 环境 | 自动验证 | 安全检查 | 推荐度 |
|------|------|----------|----------|--------|
| `Deploy-Staging.ps1` | 测试 | ✓ 基础 | - | ⭐⭐⭐ |
| `Deploy-And-Verify.ps1` | 测试 | ✓ 全面 | - | ⭐⭐⭐⭐⭐ |
| `Deploy-Production.ps1` | 生产 | ✓ 基础 | ✓ 手动 | ⭐⭐⭐ |
| `Deploy-Production-OneClick.ps1` | 生产 | ✓ 全面 | ✓ 多重 | ⭐⭐⭐⭐⭐ |

---

## 🛠️ 脚本参数说明

### Target 参数

| 值 | 说明 | 部署范围 |
|----|------|----------|
| `all` | 全部 | 前端 + 后端 |
| `web` | 前端 | 仅网页静态文件 |
| `backend` | 后端 | 仅 Node.js API 服务 |

### Message 参数

提交信息，用于 Git commit 和部署日志。

**建议格式**:
- 功能开发: `"新增XXX功能"`
- Bug修复: `"修复XXX问题"`
- 优化: `"优化XXX性能"`
- 版本发布: `"v1.0.0 正式发布"`

---

## ⚙️ 环境要求

### Windows PowerShell 环境

```powershell
# 检查 PowerShell 版本
$PSVersionTable.PSVersion
# 需要 5.1 或更高版本

# 检查执行策略
Get-ExecutionPolicy
# 如果是 Restricted，需要修改:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 必需工具

- ✅ Node.js >= 18.0
- ✅ npm
- ✅ Git
- ✅ ssh (OpenSSH)
- ✅ scp

**检查工具**:
```powershell
node --version
npm --version
git --version
ssh -V
scp
```

### SSH 密钥配置

确保已配置到服务器的 SSH 免密登录：

```powershell
# 生成密钥（如果没有）
ssh-keygen -t rsa -b 4096

# 复制公钥到服务器
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@ieclub.online "cat >> ~/.ssh/authorized_keys"

# 测试连接
ssh root@ieclub.online "echo 'SSH连接成功'"
```

---

## 🔍 故障排查

### 1. "无法运行脚本"

**错误**: `因为在此系统上禁止运行脚本`

**解决**:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. "SSH 连接失败"

**错误**: `Permission denied (publickey)`

**解决**:
```powershell
# 检查 SSH 密钥
ls $env:USERPROFILE\.ssh\

# 重新配置密钥
ssh-copy-id root@ieclub.online
```

### 3. "健康检查失败"

**排查**:
```powershell
# 查看服务器日志
ssh root@ieclub.online "pm2 logs ieclub-backend --lines 50"

# 检查服务状态
ssh root@ieclub.online "pm2 status"

# 手动测试健康检查
curl https://ieclub.online/api/health
```

### 4. "部署后无法访问"

**检查清单**:
```bash
# 1. Nginx 状态
ssh root@ieclub.online "systemctl status nginx"

# 2. PM2 进程
ssh root@ieclub.online "pm2 status"

# 3. 端口监听
ssh root@ieclub.online "netstat -tlnp | grep 3000"

# 4. 防火墙
ssh root@ieclub.online "ufw status"
```

---

## 📚 相关文档

- [部署指南](../../docs/deployment/Deployment_guide.md)
- [部署检查清单](../../docs/deployment/DEPLOYMENT_CHECKLIST.md)
- [微信小程序发布指南](../../docs/deployment/WECHAT_MINIPROGRAM_GUIDE.md)
- [快速开始](../QUICK_START.ps1)

---

## 🆘 获取帮助

### 查看脚本帮助

```powershell
Get-Help .\Deploy-Staging.ps1 -Detailed
Get-Help .\Deploy-Production-OneClick.ps1 -Examples
```

### 常见问题

有问题请查看：
- [部署检查清单 - 问题排查部分](../../docs/deployment/DEPLOYMENT_CHECKLIST.md#问题排查)
- [部署指南 - 常见问题](../../docs/deployment/Deployment_guide.md#常见问题)

---

## 🎯 最佳实践

1. ✅ **始终先在测试环境验证**
   ```powershell
   .\Deploy-And-Verify.ps1 -Target all -Message "描述"
   ```

2. ✅ **生产部署使用一键脚本**
   ```powershell
   .\Deploy-Production-OneClick.ps1 -Target all -Message "v1.0.0"
   ```

3. ✅ **重要更新前备份数据库**
   ```bash
   ssh root@ieclub.online
   mysqldump -u root -p ieclub > /root/backups/ieclub_$(date +%Y%m%d).sql
   ```

4. ✅ **选择低峰时段部署生产环境**
   - 建议时间：凌晨 2:00-5:00 或周末

5. ✅ **部署后持续监控24小时**
   ```bash
   ssh root@ieclub.online "pm2 logs ieclub-backend"
   ```

---

**Happy Deploying! 🚀**

