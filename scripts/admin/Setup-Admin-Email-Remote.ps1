#!/usr/bin/env pwsh
# ============================================
# 远程设置管理员邮箱脚本
# ============================================
# 用途：通过 SSH 在服务器上设置管理员邮箱
# 
# 使用方法：
#   .\scripts\admin\Setup-Admin-Email-Remote.ps1
#   .\scripts\admin\Setup-Admin-Email-Remote.ps1 -ServerHost ieclub.online -ServerUser root
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [string]$TargetEmail = "12310203@mail.sustech.edu.cn",
    [switch]$VerifyOnly = $false
)

$ErrorActionPreference = "Continue"

# 设置控制台编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色输出函数
function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

# 执行远程命令
function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [string]$Description = "",
        [switch]$ShowOutput
    )
    
    if (-not $PSBoundParameters.ContainsKey('ShowOutput')) {
        $ShowOutput = $true
    }
    
    if ($Description) {
        Write-Info $Description
    }
    
    try {
        $fullCommand = "ssh -p $ServerPort -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${ServerUser}@${ServerHost} `"$Command`""
        
        if ($ShowOutput) {
            Invoke-Expression $fullCommand
        } else {
            $result = Invoke-Expression $fullCommand 2>&1
            return $result
        }
        
        if ($LASTEXITCODE -eq 0) {
            return $true
        } else {
            return $false
        }
    } catch {
        Write-Error "执行失败: $_"
        return $false
    }
}

# 主函数
Write-Section "远程设置管理员邮箱"

Write-Info "服务器: ${ServerUser}@${ServerHost}:${ServerPort}"
Write-Info "目标邮箱: $TargetEmail"
Write-Host ""

# 1. 检查 SSH 连接
Write-Section "1️⃣  检查 SSH 连接"
$null = Invoke-RemoteCommand "echo 'SSH连接成功'" "测试SSH连接" -ShowOutput:$false

if ($LASTEXITCODE -ne 0) {
    Write-Error "无法连接到服务器，请检查："
    Write-Host "  1. SSH 密钥是否已配置" -ForegroundColor Gray
    Write-Host "  2. 服务器地址是否正确: $ServerHost" -ForegroundColor Gray
    Write-Host "  3. 用户名是否正确: $ServerUser" -ForegroundColor Gray
    Write-Host "  4. 网络连接是否正常" -ForegroundColor Gray
    exit 1
}

Write-Success "SSH 连接成功"
Write-Host ""

# 2. 检查项目目录
Write-Section "2️⃣  检查项目目录"
$projectPath = "/root/IEclub_dev_staging/ieclub-backend"
$checkDirCmd = "if [ -d `"$projectPath`" ]; then echo 'EXISTS'; else echo 'NOT_EXISTS'; fi"
$checkDir = Invoke-RemoteCommand $checkDirCmd "检查项目目录" -ShowOutput:$false

if ($checkDir -notmatch "EXISTS") {
    Write-Error "项目目录不存在: $projectPath"
    Write-Info "尝试查找项目目录..."
    $findResult = Invoke-RemoteCommand "find /root -name 'ieclub-backend' -type d 2>/dev/null | head -1" "查找项目目录" -ShowOutput:$true
    if ($findResult) {
        $projectPath = $findResult.Trim()
        Write-Success "找到项目目录: $projectPath"
    } else {
        Write-Error "无法找到项目目录，请手动指定"
        exit 1
    }
} else {
    Write-Success "项目目录存在: $projectPath"
}

Write-Host ""

# 3. 检查脚本文件
Write-Section "3️⃣  检查脚本文件"
$scriptPath = "$projectPath/scripts/setup-admin-email.js"
$checkScriptCmd = "if [ -f `"$scriptPath`" ]; then echo 'EXISTS'; else echo 'NOT_EXISTS'; fi"
$checkScript = Invoke-RemoteCommand $checkScriptCmd "检查设置脚本" -ShowOutput:$false

if ($checkScript -notmatch "EXISTS") {
    Write-Error "设置脚本不存在: $scriptPath"
    Write-Info "请确保脚本已部署到服务器"
    exit 1
}

Write-Success "设置脚本存在"
Write-Host ""

# 4. 执行设置或验证
if ($VerifyOnly) {
    Write-Section "4️⃣  验证管理员邮箱状态"
    $verifyScript = "$projectPath/scripts/verify-admin-email.js"
    $checkVerifyCmd = "if [ -f `"$verifyScript`" ]; then echo 'EXISTS'; else echo 'NOT_EXISTS'; fi"
    $checkVerify = Invoke-RemoteCommand $checkVerifyCmd "检查验证脚本" -ShowOutput:$false
    
    if ($checkVerify -match "EXISTS") {
        Write-Info "运行验证脚本..."
        Invoke-RemoteCommand "cd $projectPath; node scripts/verify-admin-email.js" "验证管理员邮箱"
    } else {
        Write-Warning "验证脚本不存在，使用设置脚本检查状态..."
        Invoke-RemoteCommand "cd $projectPath; node scripts/setup-admin-email.js" "检查管理员状态"
    }
} else {
    Write-Section "4️⃣  执行管理员邮箱设置"
    Write-Info "正在设置管理员邮箱: $TargetEmail"
    Write-Host ""
    
    # 使用远程脚本执行
    $remoteScript = "cd $projectPath; node scripts/setup-admin-email.js"
    
    Invoke-RemoteCommand $remoteScript "执行设置脚本"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "设置完成！"
        Write-Host ""
        Write-Section "📋 登录信息"
        Write-Host "   管理后台: https://test.ieclub.online/admin" -ForegroundColor Cyan
        Write-Host "   邮箱: $TargetEmail" -ForegroundColor Cyan
        Write-Host "   默认密码: Admin@123456 (如果是新创建)" -ForegroundColor Yellow
        Write-Host "   ⚠️  请尽快登录并修改密码！" -ForegroundColor Yellow
        Write-Host ""
        
        # 询问是否验证
        Write-Info "是否验证设置结果？(Y/N)"
        $verify = Read-Host
        if ($verify -eq "Y" -or $verify -eq "y") {
            Write-Host ""
            $verifyScript = "$projectPath/scripts/verify-admin-email.js"
            $checkVerifyCmd = "if [ -f `"$verifyScript`" ]; then echo 'EXISTS'; else echo 'NOT_EXISTS'; fi"
            $checkVerify = Invoke-RemoteCommand $checkVerifyCmd "检查验证脚本" -ShowOutput:$false
            
            if ($checkVerify -match "EXISTS") {
                Invoke-RemoteCommand "cd $projectPath; node scripts/verify-admin-email.js" "验证管理员邮箱"
            }
        }
    } else {
        Write-Error "设置失败，请检查错误信息"
        exit 1
    }
}

Write-Host ""
Write-Success "操作完成！"

