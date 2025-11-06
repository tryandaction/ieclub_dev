#!/usr/bin/env pwsh
<#
.SYNOPSIS
    完整的测试环境部署脚本（本地 + 远程）
    
.DESCRIPTION
    一键完成测试环境的打包、上传、部署全流程
    支持增量部署和完整部署
    
.PARAMETER Target
    部署目标: backend, web, all (默认: all)
    
.PARAMETER SkipBuild
    跳过本地构建，直接上传现有文件
    
.PARAMETER SkipUpload
    跳过上传，仅在服务器上部署
    
.EXAMPLE
    .\Deploy-Staging-Complete.ps1
    完整部署后端和前端
    
.EXAMPLE
    .\Deploy-Staging-Complete.ps1 -Target backend
    仅部署后端
    
.EXAMPLE
    .\Deploy-Staging-Complete.ps1 -SkipBuild
    跳过构建，使用现有文件
#>

param(
    [ValidateSet('backend', 'web', 'all')]
    [string]$Target = 'backend',  # 默认只部署后端
    
    [switch]$SkipBuild,
    [switch]$SkipUpload,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# ============================================================
# 配置
# ============================================================
$ServerHost = "ieclub.online"
$ServerUser = "root"
$ServerPort = 22

$ProjectRoot = $PSScriptRoot + "/../.."
$BackendDir = "$ProjectRoot/ieclub-backend"
$WebDir = "$ProjectRoot/ieclub-web"

$RemoteRoot = "/root/IEclub_dev_staging"
$RemoteBackendDir = "$RemoteRoot/ieclub-backend"
$RemoteWebDir = "$RemoteRoot/ieclub-web"

# ============================================================
# 工具函数
# ============================================================
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error-Custom { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning-Custom { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "`n🔧 $Message" -ForegroundColor Blue }

function Invoke-SSH {
    param([string]$Command, [switch]$IgnoreError)
    
    try {
        $result = ssh -p $ServerPort "${ServerUser}@${ServerHost}" $Command 2>&1
        if ($LASTEXITCODE -ne 0 -and -not $IgnoreError) {
            throw "SSH command failed: $result"
        }
        return $result
    } catch {
        if (-not $IgnoreError) {
            throw
        }
        return $null
    }
}

function Copy-ToServer {
    param([string]$LocalPath, [string]$RemotePath)
    
    Write-Info "上传: $LocalPath -> $RemotePath"
    scp -P $ServerPort -r "$LocalPath" "${ServerUser}@${ServerHost}:$RemotePath"
    
    if ($LASTEXITCODE -ne 0) {
        throw "SCP upload failed"
    }
}

# ============================================================
# 检查环境
# ============================================================
Write-Host @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 IEClub 测试环境完整部署工具                         ║
║                                                            ║
║     目标: $Target                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Step "检查本地环境..."

# 检查必要的命令
$requiredCommands = @('ssh', 'scp', 'node', 'npm')
foreach ($cmd in $requiredCommands) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "缺少必要命令: $cmd"
        exit 1
    }
}
Write-Success "本地环境检查通过"

# 测试 SSH 连接
Write-Step "测试 SSH 连接..."
try {
    $sshTest = Invoke-SSH "echo OK"
    if ($sshTest -match "OK") {
        Write-Success "SSH 连接正常"
    } else {
        throw "SSH test failed"
    }
} catch {
    Write-Error-Custom "无法连接到服务器: $ServerHost"
    Write-Info "请检查:"
    Write-Info "  1. 服务器是否在线"
    Write-Info "  2. SSH 密钥是否配置正确"
    Write-Info "  3. 防火墙是否允许连接"
    exit 1
}

# ============================================================
# 部署后端
# ============================================================
if ($Target -eq 'backend' -or $Target -eq 'all') {
    Write-Step "开始部署后端..."
    
    # 1. 准备后端代码
    if (-not $SkipBuild) {
        Write-Info "准备后端代码包..."
        Push-Location $BackendDir
        
        # 创建临时目录
        $tempDir = "$env:TEMP/ieclub-staging-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        
        # 复制必要文件
        Write-Info "复制文件..."
        $itemsToCopy = @(
            'src',
            'prisma',
            'scripts',
            'package.json',
            'package-lock.json',
            'healthcheck.js'
        )
        
        foreach ($item in $itemsToCopy) {
            if (Test-Path $item) {
                Copy-Item -Path $item -Destination $tempDir -Recurse -Force
            }
        }
        
        # 复制配置文件模板
        if (Test-Path 'env.staging.template') {
            Copy-Item 'env.staging.template' "$tempDir/.env.staging.template" -Force
        }
        
        # 创建压缩包
        Write-Info "创建压缩包..."
        $zipPath = "$env:TEMP/staging-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
        Compress-Archive -Path "$tempDir/*" -DestinationPath $zipPath -Force
        
        # 清理临时目录
        Remove-Item $tempDir -Recurse -Force
        
        Write-Success "后端代码包准备完成: $zipPath"
        Pop-Location
    }
    
    # 2. 上传到服务器
    if (-not $SkipUpload) {
        Write-Info "上传后端代码包..."
        Copy-ToServer $zipPath "/tmp/staging-backend.zip"
        Write-Success "上传完成"
    }
    
    # 3. 在服务器上部署
    Write-Info "在服务器上部署后端..."
    
    $deployScript = @"
#!/bin/bash
set -e

echo "========================================="
echo "🚀 开始部署测试环境后端"
echo "========================================="

# 创建目录
mkdir -p $RemoteBackendDir
cd $RemoteBackendDir

# 备份当前版本
if [ -d "src" ]; then
    echo "📦 备份当前版本..."
    tar -czf ../backup-backend-\$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || true
fi

# 解压新代码
echo "📂 解压新代码..."
unzip -o /tmp/staging-backend.zip -d . 2>&1 | grep -v "inflating:" || true
rm -f /tmp/staging-backend.zip

# 检查环境变量文件
if [ ! -f ".env.staging" ]; then
    echo "⚠️  .env.staging 不存在"
    if [ -f ".env.staging.template" ]; then
        echo "📝 从模板创建 .env.staging..."
        cp .env.staging.template .env.staging
        echo "❗ 请编辑 .env.staging 填入正确的配置！"
    else
        echo "❌ 缺少 .env.staging 和模板文件"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."
npm install --production --no-audit --no-fund

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 数据库迁移
echo "🗄️  执行数据库迁移..."
npx prisma migrate deploy || echo "⚠️  数据库迁移失败（可能需要手动处理）"

# 重启 PM2 服务
echo "🔄 重启服务..."
if pm2 describe staging-backend > /dev/null 2>&1; then
    pm2 delete staging-backend
fi

# 使用正确的配置文件启动
if [ -f "/root/IEclub_dev_staging/ieclub-backend/ecosystem.staging.config.js" ]; then
    pm2 start /root/IEclub_dev_staging/ieclub-backend/ecosystem.staging.config.js
else
    # 备用方案：直接启动
    pm2 start src/server-staging.js --name staging-backend
fi

pm2 save

# 等待启动
sleep 3

# 检查状态
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
pm2 status staging-backend

# 健康检查
echo ""
echo "🔍 健康检查..."
sleep 2
curl -sf http://localhost:3001/health || echo "⚠️  健康检查失败"

echo ""
echo "📋 查看日志:"
echo "   pm2 logs staging-backend"
echo ""
"@

    # 执行部署脚本
    $deployScript | Invoke-SSH "bash -s"
    
    Write-Success "后端部署完成！"
    Write-Info "测试环境后端: https://ieclub.online/api (端口 3001)"
    
    # 清理本地临时文件
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
}

# ============================================================
# 部署前端
# ============================================================
if ($Target -eq 'web' -or $Target -eq 'all') {
    Write-Step "开始部署前端..."
    Write-Warning-Custom "前端部署功能待实现"
    Write-Info "建议手动部署前端，或使用独立的前端部署脚本"
}

# ============================================================
# 完成
# ============================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║     ✅ 测试环境部署完成！                                  ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Info "后续操作:"
Write-Host "  1. 检查服务状态: ssh root@ieclub.online 'pm2 status'" -ForegroundColor Gray
Write-Host "  2. 查看日志: ssh root@ieclub.online 'pm2 logs staging-backend'" -ForegroundColor Gray
Write-Host "  3. 健康检查: curl https://ieclub.online/health" -ForegroundColor Gray
Write-Host "  4. 测试 API: curl https://ieclub.online/api/test" -ForegroundColor Gray
Write-Host ""

Write-Success "部署工具执行完毕！"

