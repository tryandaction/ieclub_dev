#!/usr/bin/env pwsh
<#
.SYNOPSIS
    一键诊断并修复测试环境所有问题
    
.DESCRIPTION
    自动检查测试环境的所有常见问题并尝试修复
    
.PARAMETER AutoFix
    自动修复所有发现的问题(不询问)
    
.EXAMPLE
    .\Fix-Staging-All.ps1
    交互式诊断和修复
    
.EXAMPLE
    .\Fix-Staging-All.ps1 -AutoFix
    自动修复所有问题
#>

param(
    [switch]$AutoFix
)

$ErrorActionPreference = "Stop"

# 配置
$ServerHost = "ieclub.online"
$ServerUser = "root"
$ServerPort = 22

# 颜色输出
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error-Custom { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning-Custom { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "`n🔧 $Message" -ForegroundColor Blue }

# 问题计数器
$script:IssuesFound = 0
$script:IssuesFixed = 0
$script:IssuesFailed = 0

# 记录问题
function Add-Issue {
    param($Description)
    $script:IssuesFound++
    Write-Warning-Custom $Description
}

# 记录修复
function Add-Fix {
    param($Description, $Success = $true)
    if ($Success) {
        $script:IssuesFixed++
        Write-Success $Description
    } else {
        $script:IssuesFailed++
        Write-Error-Custom $Description
    }
}

# 询问是否修复
function Confirm-Fix {
    param($Question)
    if ($AutoFix) { return $true }
    $response = Read-Host "$Question (Y/n)"
    return ($response -eq '' -or $response -eq 'Y' -or $response -eq 'y')
}

# SSH执行
function Invoke-SSH {
    param($Command)
    try {
        $result = ssh -p $ServerPort "${ServerUser}@${ServerHost}" $Command 2>&1
        return @{ Success = $?; Output = $result }
    } catch {
        return @{ Success = $false; Output = $_.Exception.Message }
    }
}

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🔧 测试环境一键诊断与修复工具                          ║
║                                                            ║
║     自动检查并修复所有常见问题                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# 1. 检查SSH连接
Write-Step "检查SSH连接..."
$sshTest = Invoke-SSH "echo OK"
if (-not $sshTest.Success) {
    Add-Issue "SSH连接失败"
    Write-Error-Custom "无法连接到服务器"
    exit 1
}
Write-Success "SSH连接正常"

# 2. 检查目录结构
Write-Step "检查目录结构..."
$dirCheck = Invoke-SSH "test -d /root/IEclub_dev_staging/ieclub-backend && echo EXISTS || echo MISSING"
if ($dirCheck.Output -match "MISSING") {
    Add-Issue "测试环境目录不存在"
    if (Confirm-Fix "是否创建测试环境目录?") {
        $createDir = Invoke-SSH "mkdir -p /root/IEclub_dev_staging/ieclub-backend"
        Add-Fix "创建目录结构" $createDir.Success
    }
} else {
    Write-Success "目录结构正常"
}

# 3. 检查配置文件
Write-Step "检查配置文件..."
$envCheck = Invoke-SSH "test -f /root/IEclub_dev_staging/ieclub-backend/.env.staging && echo EXISTS || echo MISSING"
if ($envCheck.Output -match "MISSING") {
    Add-Issue "配置文件 .env.staging 不存在"
    if (Confirm-Fix "是否创建配置文件?") {
        Write-Info "请运行: .\scripts\deployment\Fix-Staging-Env.ps1"
    }
} else {
    Write-Success "配置文件存在"
}

# 4. 检查数据库
Write-Step "检查数据库..."
$dbCheck = Invoke-SSH "bash -c 'mysql -u root -e \"SHOW DATABASES LIKE \\\"ieclub_staging\\\";\" 2>/dev/null | grep -q ieclub_staging && echo EXISTS || echo MISSING'"
if ($dbCheck.Output -match "MISSING") {
    Add-Issue "测试数据库不存在"
    Write-Info "数据库需要手动创建或通过部署脚本创建"
} else {
    Write-Success "数据库存在"
}

# 5. 检查PM2进程
Write-Step "检查PM2进程..."
$pm2Check = Invoke-SSH "pm2 describe staging-backend 2>&1"
if ($pm2Check.Output -match "doesn't exist") {
    Add-Issue "PM2进程不存在"
    Write-Info "需要重新部署后端"
} else {
    $pm2Status = Invoke-SSH "pm2 jlist | jq -r '.[] | select(.name==\"staging-backend\") | .pm2_env.status'"
    if ($pm2Status.Output -match "online") {
        Write-Success "PM2进程运行中"
    } else {
        Add-Issue "PM2进程未运行"
        if (Confirm-Fix "是否尝试启动进程?") {
            $start = Invoke-SSH "pm2 start staging-backend"
            Add-Fix "启动PM2进程" $start.Success
        }
    }
}

# 6. 检查端口占用
Write-Step "检查端口占用..."
$portCheck = Invoke-SSH "netstat -tlnp 2>/dev/null | grep ':3001 ' | grep LISTEN"
if ($portCheck.Success -and $portCheck.Output) {
    if ($portCheck.Output -match "node") {
        Write-Success "端口3001正常监听"
    } else {
        Add-Issue "端口3001被其他进程占用"
    }
} else {
    Add-Issue "端口3001未监听"
}

# 7. 健康检查
Write-Step "执行健康检查..."
$healthCheck = Invoke-SSH "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health"
if ($healthCheck.Output -eq "200") {
    Write-Success "健康检查通过"
} else {
    Add-Issue "健康检查失败 (HTTP $($healthCheck.Output))"
}

# 8. 检查依赖
Write-Step "检查依赖..."
$nodeModulesCheck = Invoke-SSH "test -d /root/IEclub_dev_staging/ieclub-backend/node_modules && echo EXISTS || echo MISSING"
if ($nodeModulesCheck.Output -match "MISSING") {
    Add-Issue "依赖未安装"
    if (Confirm-Fix "是否安装依赖?") {
        Write-Info "正在安装依赖(可能需要几分钟)..."
        $install = Invoke-SSH "cd /root/IEclub_dev_staging/ieclub-backend && npm install --omit=dev"
        Add-Fix "安装依赖" $install.Success
    }
}

# 总结报告
Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     诊断报告                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($script:IssuesFound -eq 0) {
    Write-Success "未发现任何问题！测试环境运行正常 🎉"
} else {
    Write-Host "发现问题: $script:IssuesFound 个" -ForegroundColor Yellow
    Write-Host "已修复: $script:IssuesFixed 个" -ForegroundColor Green
    if ($script:IssuesFailed -gt 0) {
        Write-Host "修复失败: $script:IssuesFailed 个" -ForegroundColor Red
    }
}

Write-Host ""

if ($script:IssuesFixed -gt 0 -or $script:IssuesFound -gt 0) {
    Write-Host "📋 建议的下一步操作:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 重新部署后端:" -ForegroundColor White
    Write-Host "   .\scripts\deployment\Deploy-Staging.ps1 -Target backend" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 查看服务状态:" -ForegroundColor White
    Write-Host "   ssh root@ieclub.online `"pm2 status`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. 详细诊断:" -ForegroundColor White
    Write-Host "   .\scripts\deployment\Diagnose-Staging.ps1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

