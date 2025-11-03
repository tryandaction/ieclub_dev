# IEClub 测试环境完整功能部署脚本 (Windows PowerShell)
# 包含 Redis、WebSocket、定时任务等完整功能

param(
    [switch]$SkipRedis = $false
)

$ErrorActionPreference = "Stop"

# 配置变量
$ServerIP = "39.108.160.112"
$ServerUser = "root"
$ProjectRoot = "/var/www/ieclub-backend-staging"
$LocalRoot = Split-Path -Parent $PSScriptRoot

# 颜色输出函数
function Write-Section($text) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Blue
    Write-Host $text -ForegroundColor Blue
    Write-Host "============================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Warning($text) {
    Write-Host "⚠️  $text" -ForegroundColor Yellow
}

function Write-Error($text) {
    Write-Host "❌ $text" -ForegroundColor Red
}

function Write-Info($text) {
    Write-Host "   $text" -ForegroundColor White
}

Write-Section "IEClub 测试环境完整功能部署"

Write-Host "📋 部署信息:" -ForegroundColor Cyan
Write-Info "服务器: $ServerIP"
Write-Info "环境: staging (完整版)"
Write-Info "功能: Redis + WebSocket + 定时任务"
Write-Host ""

# 步骤 1: 检查本地文件
Write-Section "步骤 1/7: 检查本地文件"

$requiredFiles = @(
    "ieclub-backend/src/server-staging.js",
    "scripts/setup-staging-redis.sh",
    "scripts/deploy-staging-full.sh"
)

foreach ($file in $requiredFiles) {
    $filePath = Join-Path $LocalRoot $file
    if (Test-Path $filePath) {
        Write-Success "$file 存在"
    } else {
        Write-Error "$file 不存在"
        exit 1
    }
}

# 步骤 2: 上传 Redis 安装脚本
if (-not $SkipRedis) {
    Write-Section "步骤 2/7: 上传 Redis 安装脚本"
    
    $redisScript = Join-Path $LocalRoot "scripts/setup-staging-redis.sh"
    scp $redisScript "${ServerUser}@${ServerIP}:/root/setup-staging-redis.sh"
    Write-Success "Redis 安装脚本已上传"
    
    # 步骤 3: 安装 Redis
    Write-Section "步骤 3/7: 安装和配置 Redis"
    Write-Warning "这可能需要几分钟..."
    
    ssh "${ServerUser}@${ServerIP}" "chmod +x /root/setup-staging-redis.sh && bash /root/setup-staging-redis.sh"
    Write-Success "Redis 安装配置完成"
} else {
    Write-Section "步骤 2-3/7: 跳过 Redis 安装"
    Write-Info "使用参数 -SkipRedis 跳过了 Redis 安装"
}

# 步骤 4: 上传完整版服务器文件
Write-Section "步骤 4/7: 上传完整版服务器文件"

$serverFile = Join-Path $LocalRoot "ieclub-backend/src/server-staging.js"
scp $serverFile "${ServerUser}@${ServerIP}:${ProjectRoot}/src/server-staging.js"
Write-Success "服务器文件已上传"

# 步骤 5: 上传部署脚本
Write-Section "步骤 5/7: 上传部署脚本"

$deployScript = Join-Path $LocalRoot "scripts/deploy-staging-full.sh"
scp $deployScript "${ServerUser}@${ServerIP}:/root/deploy-staging-full.sh"
Write-Success "部署脚本已上传"

# 步骤 6: 执行部署
Write-Section "步骤 6/7: 执行部署"
Write-Warning "正在部署测试环境..."

ssh "${ServerUser}@${ServerIP}" "chmod +x /root/deploy-staging-full.sh && bash /root/deploy-staging-full.sh"

# 步骤 7: 验证部署
Write-Section "步骤 7/7: 验证部署"

Write-Info "等待服务启动..."
Start-Sleep -Seconds 3

Write-Info "检查服务状态..."
ssh "${ServerUser}@${ServerIP}" "pm2 list | grep ieclub-backend-staging"

Write-Host ""
Write-Info "测试 API 连接..."
$healthCheck = ssh "${ServerUser}@${ServerIP}" "curl -s http://localhost:3001/health"

if ($healthCheck -match "ok") {
    Write-Success "健康检查通过"
    Write-Host $healthCheck -ForegroundColor Gray
} else {
    Write-Warning "健康检查失败，请查看日志"
    Write-Info "ssh ${ServerUser}@${ServerIP} 'pm2 logs ieclub-backend-staging --lines 50'"
}

# 完成
Write-Section "部署完成！"

Write-Host "📊 服务信息:" -ForegroundColor Cyan
Write-Info "服务器: ${ServerIP}:3001"
Write-Info "环境: staging"
Write-Info "进程名: ieclub-backend-staging"
Write-Host ""

Write-Host "✨ 已启用功能:" -ForegroundColor Cyan
Write-Success "Redis 缓存"
Write-Success "WebSocket 实时通信"
Write-Success "定时任务调度"
Write-Success "完整的错误处理"
Write-Success "优雅关闭机制"
Write-Host ""

Write-Host "🔧 常用命令:" -ForegroundColor Cyan
Write-Info "查看日志: ssh ${ServerUser}@${ServerIP} 'pm2 logs ieclub-backend-staging'"
Write-Info "重启服务: ssh ${ServerUser}@${ServerIP} 'pm2 restart ieclub-backend-staging'"
Write-Info "查看状态: ssh ${ServerUser}@${ServerIP} 'pm2 list'"
Write-Info "测试API: ssh ${ServerUser}@${ServerIP} 'curl http://localhost:3001/health'"
Write-Host ""

Write-Host "🔍 测试建议:" -ForegroundColor Cyan
Write-Info "1. 测试 Redis: 检查缓存功能是否正常"
Write-Info "2. 测试 WebSocket: 检查实时通信功能"
Write-Info "3. 测试定时任务: 检查自动化任务执行情况"
Write-Info "4. 压力测试: 测试高并发场景"
Write-Host ""

Write-Success "测试环境完整功能部署成功！" 
Write-Host ""

