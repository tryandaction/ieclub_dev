#!/usr/bin/env pwsh
<#
.SYNOPSIS
    快速重新部署脚本（不升级Node.js）
.DESCRIPTION
    快速版本，只重启服务，不升级依赖
.EXAMPLE
    .\Quick-Redeploy.ps1
    .\Quick-Redeploy.ps1 -ProductionOnly
#>

param(
    [switch]$ProductionOnly = $false,
    [switch]$StagingOnly = $false
)

$SERVER = "root@ieclub.online"
$BACKEND_DIR = "/root/ieclub-backend"

function Write-Step { param([string]$Message); Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message); Write-Host "✓ $Message" -ForegroundColor Green }

Write-Host "`n╔══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    IEClub 快速重新部署脚本            ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════╝`n" -ForegroundColor Magenta

if (-not $StagingOnly) {
    Write-Step "重启生产环境"
    ssh $SERVER "cd $BACKEND_DIR && pm2 restart ieclub-backend"
    Start-Sleep -Seconds 2
    $health = ssh $SERVER "curl -s http://localhost:3000/api/health"
    if ($health -match "ok") {
        Write-Success "生产环境运行正常: https://ieclub.online"
    }
}

if (-not $ProductionOnly) {
    Write-Step "重启测试环境"
    ssh $SERVER "cd $BACKEND_DIR && pm2 restart ieclub-staging"
    Start-Sleep -Seconds 2
    $health = ssh $SERVER "curl -s http://localhost:3001/api/health"
    if ($health -match "ok") {
        Write-Success "测试环境运行正常: http://ieclub.online:3001"
    }
}

Write-Step "当前服务状态"
ssh $SERVER "pm2 list"

Write-Host "`n✓ 快速重新部署完成！`n" -ForegroundColor Green

