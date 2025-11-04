# Git 代理配置指南

## 问题描述

如果你遇到以下错误：
```
fatal: unable to access 'https://github.com/...': Failed to connect to 127.0.0.1 port 7890
```

这说明Git配置了代理，但代理服务（如Clash）已关闭。

## 解决方案

### 方案一：移除Git代理配置（推荐）

如果你不需要使用代理访问GitHub，可以直接移除代理配置：

```powershell
# 移除HTTP代理
git config --global --unset http.proxy

# 移除HTTPS代理
git config --global --unset https.proxy

# 验证代理已移除
git config --global --list | Select-String proxy
```

### 方案二：动态代理配置（高级）

如果你有时需要使用代理，可以：

#### 1. 仅对GitHub使用代理
```bash
# 仅GitHub使用代理
git config --global http.https://github.com.proxy http://127.0.0.1:7890

# 移除GitHub特定代理
git config --global --unset http.https://github.com.proxy
```

#### 2. 使用环境变量（临时）
```powershell
# 临时启用代理（当前会话）
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"

# 临时禁用代理
Remove-Item env:HTTP_PROXY
Remove-Item env:HTTPS_PROXY
```

#### 3. 创建代理开关脚本

**启用代理：**
```powershell
# Enable-GitProxy.ps1
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
Write-Host "✅ Git 代理已启用" -ForegroundColor Green
```

**禁用代理：**
```powershell
# Disable-GitProxy.ps1
git config --global --unset http.proxy
git config --global --unset https.proxy
Write-Host "✅ Git 代理已禁用" -ForegroundColor Green
```

## 检查当前配置

```powershell
# 查看所有全局配置
git config --global --list

# 只查看代理相关配置
git config --global --list | Select-String proxy

# 查看特定配置
git config --global --get http.proxy
git config --global --get https.proxy
```

## 最佳实践

### 国内开发环境

如果你在国内开发，推荐：

1. **不使用代理**（如果网络稳定）
   - 移除所有Git代理配置
   - GitHub在国内访问已经相对稳定

2. **使用Gitee镜像**（备选方案）
   ```bash
   # 添加Gitee作为备用远程仓库
   git remote add gitee https://gitee.com/your-username/your-repo.git
   
   # 同时推送到GitHub和Gitee
   git push origin main
   git push gitee main
   ```

3. **使用SSH而非HTTPS**
   ```bash
   # 切换到SSH（不受HTTP代理影响）
   git remote set-url origin git@github.com:username/repo.git
   ```

### 需要代理的场景

如果必须使用代理（如公司网络环境）：

1. 确保代理服务稳定运行
2. 使用GitHub特定代理配置（不影响其他Git操作）
3. 定期检查代理配置是否有效

## 故障排查

### 测试网络连接
```powershell
# 测试GitHub连接
Test-NetConnection github.com -Port 443

# 测试Git连接
git ls-remote https://github.com/tryandaction/ieclub_dev.git
```

### 测试代理连接
```powershell
# 测试代理是否可用
Test-NetConnection 127.0.0.1 -Port 7890

# 通过代理测试GitHub
$env:HTTP_PROXY = "http://127.0.0.1:7890"
Invoke-WebRequest -Uri "https://github.com" -UseBasicParsing
```

## 相关文档

- [Git官方文档 - 代理配置](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httpproxy)
- [GitHub SSH设置](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

