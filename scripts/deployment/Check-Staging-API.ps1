# ==========================================================
# 检查测试环境 API 配置
# ==========================================================

param(
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [string]$ServerUser = "root"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  检查测试环境 API 配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查后端服务
Write-Host "1️⃣ 检查后端服务..." -ForegroundColor Yellow
$pm2Status = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 status staging-backend 2>&1"
Write-Host $pm2Status

# 2. 检查端口
Write-Host ""
Write-Host "2️⃣ 检查端口3001..." -ForegroundColor Yellow
$portCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "netstat -tlnp 2>/dev/null | grep ':3001 ' || ss -tlnp 2>/dev/null | grep ':3001 ' || echo 'NOT_FOUND'"
Write-Host $portCheck

# 3. 测试本地API
Write-Host ""
Write-Host "3️⃣ 测试本地API..." -ForegroundColor Yellow
$localTest = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "curl -s http://localhost:3001/api/health 2>&1"
Write-Host $localTest

# 4. 检查Nginx配置
Write-Host ""
Write-Host "4️⃣ 检查Nginx配置..." -ForegroundColor Yellow
$nginxConfig = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "if [ -f /etc/nginx/sites-available/test.ieclub.online ]; then cat /etc/nginx/sites-available/test.ieclub.online; elif [ -f /etc/nginx/conf.d/test.ieclub.online.conf ]; then cat /etc/nginx/conf.d/test.ieclub.online.conf; else echo 'NOT_FOUND'; fi"
if ($nginxConfig -match "location /api") {
    Write-Host "✅ 找到 /api 配置" -ForegroundColor Green
    if ($nginxConfig -match "proxy_pass.*3001") {
        Write-Host "✅ proxy_pass 指向 3001 端口" -ForegroundColor Green
    } else {
        Write-Host "❌ proxy_pass 未指向 3001 端口" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 未找到 /api 配置" -ForegroundColor Red
}

# 5. 测试外部API
Write-Host ""
Write-Host "5️⃣ 测试外部API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ 外部API访问成功 (状态码: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "响应: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
} catch {
    Write-Host "❌ 外部API访问失败: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  检查完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

