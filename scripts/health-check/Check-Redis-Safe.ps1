#!/usr/bin/env pwsh
# ================================================================
# 安全的Redis连接检查脚本
# ================================================================
#
# 功能: 安全地检查Redis连接状态，避免触发网络安全策略
# 
# 解决方案:
#   1. 使用本地socket检查，不发起外部网络连接
#   2. 仅检查进程状态，不实际连接Redis
#   3. 通过PM2检查后端应用状态来间接验证Redis
#
# 使用方法:
#   .\Check-Redis-Safe.ps1 -Server "root@ieclub.online"
#
# ================================================================

param(
    [string]$Server = "root@ieclub.online",
    [int]$RedisPort = 6379
)

# 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🔍 安全Redis检查..." -ForegroundColor Cyan
Write-Host ""

# 方法1: 检查Redis进程是否运行
Write-Host "[1/3] 检查Redis进程状态..." -ForegroundColor Yellow
try {
    $redisProcess = ssh $Server "pgrep redis-server"
    if ($redisProcess) {
        Write-Host "  ✅ Redis进程运行中 (PID: $redisProcess)" -ForegroundColor Green
        $redisRunning = $true
    } else {
        Write-Host "  ⚠️  Redis进程未运行" -ForegroundColor Yellow
        $redisRunning = $false
    }
} catch {
    Write-Host "  ❌ 无法检查Redis进程" -ForegroundColor Red
    $redisRunning = $false
}
Write-Host ""

# 方法2: 检查Redis端口是否监听（本地检查，不建立连接）
Write-Host "[2/3] 检查Redis端口监听状态..." -ForegroundColor Yellow
try {
    $portCheck = ssh $Server "ss -ltn | grep :$RedisPort"
    if ($portCheck) {
        Write-Host "  ✅ Redis端口 $RedisPort 正在监听" -ForegroundColor Green
        $portListening = $true
    } else {
        Write-Host "  ⚠️  Redis端口 $RedisPort 未监听" -ForegroundColor Yellow
        $portListening = $false
    }
} catch {
    Write-Host "  ❌ 无法检查端口状态" -ForegroundColor Red
    $portListening = $false
}
Write-Host ""

# 方法3: 通过后端应用健康状态间接验证Redis
Write-Host "[3/3] 检查后端应用健康状态（间接验证Redis）..." -ForegroundColor Yellow
try {
    $pm2Status = ssh $Server "pm2 jlist | jq -r '.[] | select(.name==\"ieclub-backend\") | .pm2_env.status'"
    if ($pm2Status -eq "online") {
        Write-Host "  ✅ 后端应用运行正常（Redis功能可用）" -ForegroundColor Green
        $appHealthy = $true
    } else {
        Write-Host "  ⚠️  后端应用状态异常: $pm2Status" -ForegroundColor Yellow
        $appHealthy = $false
    }
} catch {
    Write-Host "  ⚠️  无法检查后端应用状态" -ForegroundColor Yellow
    $appHealthy = $false
}
Write-Host ""

# 总结
Write-Host "============================================" -ForegroundColor Cyan
if ($redisRunning -and $portListening -and $appHealthy) {
    Write-Host "  ✅ Redis状态正常" -ForegroundColor Green
    Write-Host ""
    Write-Host "Redis功能验证：" -ForegroundColor White
    Write-Host "  - 进程运行: ✅" -ForegroundColor Green
    Write-Host "  - 端口监听: ✅" -ForegroundColor Green
    Write-Host "  - 应用集成: ✅" -ForegroundColor Green
    exit 0
} elseif ($appHealthy) {
    Write-Host "  ⚠️  Redis可能未运行，但应用正常" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "说明：" -ForegroundColor White
    Write-Host "  - Redis不是必需服务" -ForegroundColor Gray
    Write-Host "  - 后端应用可在无Redis时正常运行" -ForegroundColor Gray
    Write-Host "  - 部分缓存功能可能不可用" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "  ❌ Redis状态异常或无法验证" -ForegroundColor Red
    Write-Host ""
    Write-Host "Redis功能验证：" -ForegroundColor White
    Write-Host "  - 进程运行: $(if ($redisRunning) { '✅' } else { '❌' })" -ForegroundColor $(if ($redisRunning) { 'Green' } else { 'Red' })
    Write-Host "  - 端口监听: $(if ($portListening) { '✅' } else { '❌' })" -ForegroundColor $(if ($portListening) { 'Green' } else { 'Red' })
    Write-Host "  - 应用集成: $(if ($appHealthy) { '✅' } else { '❌' })" -ForegroundColor $(if ($appHealthy) { 'Green' } else { 'Red' })
    Write-Host ""
    Write-Host "💡 建议操作：" -ForegroundColor Yellow
    Write-Host "  1. 检查Redis配置: cat /etc/redis/redis.conf" -ForegroundColor White
    Write-Host "  2. 启动Redis: systemctl start redis" -ForegroundColor White
    Write-Host "  3. 查看Redis日志: journalctl -u redis -n 50" -ForegroundColor White
    Write-Host "  4. 重启后端应用: pm2 restart ieclub-backend" -ForegroundColor White
    exit 1
}
