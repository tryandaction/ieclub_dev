# 部署脚本修复记录

**日期**: 2025-11-05  
**修复内容**: Deploy-Staging.ps1 和 Deploy-Production.ps1 路径配置和语法错误

---

## 🐛 问题描述

运行部署脚本时遇到两个关键问题：

### 1. param 语法错误
```
param: C:\universe\GitHub_try\IEclub_dev\scripts\deployment\Deploy-Staging.ps1:21
Line |
  21 |  param(
     |  ~~~~~
     | The term 'param' is not recognized...
```

**原因**: PowerShell 的 `param` 块必须是脚本的第一个可执行语句，但脚本中将编码设置代码放在了 param 之前。

### 2. 路径配置错误
```
Cannot find path 'C:\universe\GitHub_try\IEclub_dev\scripts\deployment\ieclub-web' because it does not exist.
```

**原因**: 脚本使用 `$PSScriptRoot` 作为项目根目录，但 `$PSScriptRoot` 指向的是脚本所在目录（`scripts/deployment/`），而不是项目根目录。

---

## ✅ 修复方案

### 1. 修复 param 块位置

**修改前**:
```powershell
# 🔧 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

param(
    [ValidateSet("web", "backend", "all")]
    [string]$Target,
    [string]$Message
)
```

**修改后**:
```powershell
# param 块必须是脚本的第一个可执行语句
param(
    [ValidateSet("web", "backend", "all")]
    [string]$Target,
    [string]$Message
)

# 🔧 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
```

### 2. 修复路径配置

**修改前**:
```powershell
# --- Configuration ---
$ProjectRoot = $PSScriptRoot  # ❌ 指向 scripts/deployment/
$WebDir = "${ProjectRoot}\ieclub-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"
```

**修改后**:
```powershell
# --- Configuration ---
# 脚本在 scripts/deployment/ 下，需要向上两级到达项目根目录
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)  # ✅ 指向项目根目录
$WebDir = "${ProjectRoot}\ieclub-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"
```

---

## 📝 修复的文件

1. **scripts/deployment/Deploy-Staging.ps1**
   - ✅ 将 param 块移到脚本顶部
   - ✅ 修正项目根目录路径计算

2. **scripts/deployment/Deploy-Production.ps1**
   - ✅ 将 param 块移到脚本顶部
   - ✅ 修正项目根目录路径计算

---

## 🧪 验证结果

### 路径验证
```powershell
cd C:\universe\GitHub_try\IEclub_dev\scripts\deployment
.\test-paths.ps1

# 输出:
=== Path Validation Test ===
Path Configuration:
  Script location: C:\universe\GitHub_try\IEclub_dev\scripts\deployment
  Project root: C:\universe\GitHub_try\IEclub_dev  ✅
  Web directory: C:\universe\GitHub_try\IEclub_dev\ieclub-web  ✅
  Backend directory: C:\universe\GitHub_try\IEclub_dev\ieclub-backend  ✅

[SUCCESS] All paths are configured correctly!
```

### 脚本语法验证
```powershell
Get-Command .\Deploy-Staging.ps1 | Format-List Name,Parameters

# 输出:
Name       : Deploy-Staging.ps1
Parameters : {Target, Message}  ✅
```

---

## 🚀 使用方法

现在可以正常使用部署脚本了：

### 测试环境部署
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"
```

### 生产环境部署
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"
```

---

## 💡 技术要点

1. **PowerShell param 块规则**:
   - `param()` 必须是脚本中的第一个可执行语句
   - 只能放在注释和 `#Requires` 语句之后
   - 不能在任何其他代码之后

2. **路径计算**:
   - `$PSScriptRoot`: 当前脚本所在目录
   - `Split-Path -Parent`: 获取父目录
   - 向上两级: `Split-Path -Parent (Split-Path -Parent $PSScriptRoot)`

3. **项目结构**:
   ```
   IEclub_dev/                      ← 项目根目录
   ├── scripts/
   │   └── deployment/
   │       ├── Deploy-Staging.ps1   ← 脚本位置
   │       └── Deploy-Production.ps1
   ├── ieclub-web/                  ← 前端目录
   └── ieclub-backend/              ← 后端目录
   ```

---

## 📚 相关文档

- [部署指南](../deployment/Deployment_guide.md)
- [脚本使用说明](../../scripts/README.md)
- [项目快速启动](../../QUICK_START.md)

---

**修复完成** ✅  
现在部署脚本可以正常工作了！

