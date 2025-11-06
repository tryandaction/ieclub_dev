# ================================================================
# IEClub 服务器完整修复脚本
# ================================================================
#
# 用途: 彻底修复服务器连不上的问题
# 功能: 
#   1. 检查并修复 Clash 代理干扰
#   2. 验证 SSH 连接
#   3. 修复 PM2 配置文件
#   4. 重启所有服务
#   5. 验证服务健康状态
#
# 使用方法: .\scripts\health-check\Fix-Server-Complete.ps1
#
# 更新日期: 2025-11-06
# ================================================================

param(
    [switch]$SkipProxyCheck,
    [switch]$ProductionOnly,
    [switch]$StagingOnly
)

$ErrorActionPreference = "Continue"
$SERVER = "ieclub.online"
$USER = "root"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  IEClub 服务器完整修复工具" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ================================================================
# 步骤 1: 检查 Clash 代理
# ================================================================
if (-not $SkipProxyCheck) {
    Write-Host "[1/6] 检查 Clash 代理干扰..." -ForegroundColor Yellow
    
    $netTest = Test-NetConnection -ComputerName $SERVER -Port 22 -InformationLevel Detailed -ErrorAction SilentlyContinue
    
    if ($netTest.InterfaceAlias -eq "Clash") {
        Write-Host ""
        Write-Host "❌ 警告: 检测到 Clash 代理正在干扰连接！" -ForegroundColor Red
        Write-Host ""
        Write-Host "解决方案：" -ForegroundColor Yellow
        Write-Host "  1. 配置 Clash 规则（推荐）- 参考 docs/configuration/CLASH_PROXY_SETUP.md" -ForegroundColor White
        Write-Host "  2. 临时关闭 Clash - 完全退出 Clash 程序（不是关闭系统代理）" -ForegroundColor White
        Write-Host ""
        
        $continue = Read-Host "是否继续修复？(y/n)"
        if ($continue -ne 'y') {
            Write-Host "❌ 已取消" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ 未检测到代理干扰" -ForegroundColor Green
    }
} else {
    Write-Host "[1/6] 跳过代理检查" -ForegroundColor Gray
}

Write-Host ""

# ================================================================
# 步骤 2: 测试 SSH 连接
# ================================================================
Write-Host "[2/6] 测试 SSH 连接..." -ForegroundColor Yellow

$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $USER@$SERVER "echo 'SSH OK'" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH 连接失败！" -ForegroundColor Red
    Write-Host $sshTest -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH 连接正常" -ForegroundColor Green
Write-Host ""

# ================================================================
# 步骤 3: 上传正确的 PM2 配置文件
# ================================================================
Write-Host "[3/6] 修复 PM2 配置文件..." -ForegroundColor Yellow

if (-not $StagingOnly) {
    Write-Host "  → 上传生产环境配置..." -ForegroundColor Gray
    scp docs/deployment/ecosystem.config.js ${USER}@${SERVER}:/root/IEclub_dev/ieclub-backend/ecosystem.config.js
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 上传生产环境配置失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ 生产环境配置已更新" -ForegroundColor Green
}

if (-not $ProductionOnly) {
    Write-Host "  → 上传测试环境配置..." -ForegroundColor Gray
    
    # 确保测试环境目录存在
    ssh $USER@$SERVER "mkdir -p /root/IEclub_dev_staging/ieclub-backend"
    
    scp docs/deployment/ecosystem.staging.config.js ${USER}@${SERVER}:/root/IEclub_dev_staging/ieclub-backend/ecosystem.staging.config.js
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  上传测试环境配置失败（可能目录不存在）" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ 测试环境配置已更新" -ForegroundColor Green
    }
}

Write-Host ""

# ================================================================
# 步骤 4: 检查服务状态
# ================================================================
Write-Host "[4/6] 检查服务状态..." -ForegroundColor Yellow

$services = ssh $USER@$SERVER @"
echo '=== PM2 进程状态 ==='
pm2 status 2>&1
echo ''
echo '=== MySQL 状态 ==='
systemctl is-active mysql
echo ''
echo '=== Nginx 状态 ==='
systemctl is-active nginx
echo ''
echo '=== Redis 状态 ==='
systemctl is-active redis 2>/dev/null || echo 'not-installed'
"@

Write-Host $services -ForegroundColor Gray
Write-Host ""

# ================================================================
# 步骤 5: 重启服务
# ================================================================
Write-Host "[5/6] 重启服务..." -ForegroundColor Yellow

if (-not $StagingOnly) {
    Write-Host "  → 重启生产环境..." -ForegroundColor Gray
    
    $prodRestart = ssh $USER@$SERVER @"
cd /root/IEclub_dev/ieclub-backend
pm2 delete ieclub-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
"@
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ 生产环境已启动" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 生产环境启动失败" -ForegroundColor Red
        Write-Host $prodRestart -ForegroundColor Red
    }
}

if (-not $ProductionOnly) {
    Write-Host "  → 重启测试环境..." -ForegroundColor Gray
    
    $stagingRestart = ssh $USER@$SERVER @"
if [ -d /root/IEclub_dev_staging/ieclub-backend ]; then
    cd /root/IEclub_dev_staging/ieclub-backend
    pm2 delete staging-backend 2>/dev/null || true
    if [ -f ecosystem.staging.config.js ]; then
        pm2 start ecosystem.staging.config.js
        pm2 save
        echo 'staging-started'
    else
        echo 'config-missing'
    fi
else
    echo 'directory-missing'
fi
"@
    
    if ($stagingRestart -match "staging-started") {
        Write-Host "  ✅ 测试环境已启动" -ForegroundColor Green
    } elseif ($stagingRestart -match "config-missing") {
        Write-Host "  ⚠️  测试环境配置文件缺失" -ForegroundColor Yellow
    } elseif ($stagingRestart -match "directory-missing") {
        Write-Host "  ⚠️  测试环境目录不存在" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ 测试环境启动失败" -ForegroundColor Red
    }
}

Write-Host ""

# 等待服务启动
Write-Host "  ⏳ 等待服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# ================================================================
# 步骤 6: 验证服务健康状态
# ================================================================
Write-Host "[6/6] 验证服务健康状态..." -ForegroundColor Yellow
Write-Host ""

# 检查 PM2 进程
$pm2Status = ssh $USER@$SERVER "pm2 status"
Write-Host $pm2Status

Write-Host ""

# 检查生产环境健康接口
if (-not $StagingOnly) {
    Write-Host "  → 测试生产环境 API..." -ForegroundColor Gray
    try {
        $prodHealth = Invoke-RestMethod -Uri "https://ieclub.online/api/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ 生产环境 API 正常: $($prodHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  生产环境 API 暂时无响应（可能需要等待）" -ForegroundColor Yellow
    }
}

# 检查测试环境健康接口
if (-not $ProductionOnly) {
    Write-Host "  → 测试测试环境 API..." -ForegroundColor Gray
    try {
        $stagingHealth = Invoke-RestMethod -Uri "https://ieclub.online/health/staging" -TimeoutSec 10 -ErrorAction Stop
        Write-Host "  ✅ 测试环境 API 正常: $($stagingHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  测试环境 API 暂时无响应（可能未部署）" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  修复完成！" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "后续步骤：" -ForegroundColor Yellow
Write-Host "  1. 运行 .\scripts\health-check\Check-Backend-Health.ps1 -Environment production" -ForegroundColor White
Write-Host "  2. 如需部署代码: .\scripts\deployment\Deploy-Production.ps1 -Target backend" -ForegroundColor White
Write-Host "  3. 查看日志: ssh root@ieclub.online 'pm2 logs ieclub-backend --lines 50'" -ForegroundColor White
Write-Host ""

