#!/usr/bin/env pwsh
<#
.SYNOPSIS
    通过Web API部署（避免SSH问题）
.DESCRIPTION
    如果SSH有问题，可以通过Web界面部署
#>

param(
    [switch]$CheckOnly = $false
)

$SERVER = "http://ieclub.online:3000"
$STAGING_SERVER = "http://ieclub.online:3001"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    IEClub Web部署检查工具               ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "检查服务器状态..." -ForegroundColor Cyan

# 检查生产环境
Write-Host "`n生产环境 (https://ieclub.online):" -ForegroundColor Yellow
try {
    $prod = Invoke-RestMethod -Uri "$SERVER/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ 状态: " -NoNewline -ForegroundColor Green
    Write-Host ($prod | ConvertTo-Json -Compress)
} catch {
    Write-Host "  ✗ 无法连接: $_" -ForegroundColor Red
}

# 检查测试环境
Write-Host "`n测试环境 (http://ieclub.online:3001):" -ForegroundColor Yellow
try {
    $staging = Invoke-RestMethod -Uri "$STAGING_SERVER/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ 状态: " -NoNewline -ForegroundColor Green
    Write-Host ($staging | ConvertTo-Json -Compress)
} catch {
    Write-Host "  ✗ 无法连接: $_" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host "SSH连接问题诊断:" -ForegroundColor Yellow
Write-Host "  当前通过Clash代理连接，这可能导致SSH超时"
Write-Host "  建议解决方案："
Write-Host "  1. 临时关闭Clash代理后重试SSH"
Write-Host "  2. 在Clash中添加SSH规则：DOMAIN,ieclub.online,DIRECT"
Write-Host "  3. 或者直接在服务器上手动执行命令"
Write-Host ""

if (-not $CheckOnly) {
    Write-Host "手动部署命令（直接在服务器上执行）:" -ForegroundColor Cyan
    Write-Host @"

# 连接到服务器后执行：
cd /root/ieclub-backend

# 停止服务
pm2 delete all

# 升级Node.js（如果需要）
node --version  # 检查版本
# 如果不是v20，执行：
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt-get install -y nodejs

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install --production

# 启动测试环境
pm2 start src/server.js --name ieclub-staging --node-args='--max-old-space-size=512' -- --port=3001

# 启动生产环境
pm2 start src/server.js --name ieclub-backend --node-args='--max-old-space-size=1024' -- --port=3000

# 保存配置
pm2 save
pm2 list

"@ -ForegroundColor White
}

Write-Host ""

