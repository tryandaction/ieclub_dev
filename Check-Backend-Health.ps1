# ============================================
# IEClub 后端健康检查脚本
# ============================================
# 用途：快速诊断后端服务问题
# 
# 使用方法：
#   .\Check-Backend-Health.ps1 -Environment <staging|production>
#
# 示例：
#   .\Check-Backend-Health.ps1 -Environment staging
#   .\Check-Backend-Health.ps1 -Environment production
# ============================================

# 🔧 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment
)

# --- Configuration ---
$ServerUser = "root"
$ServerHost = "ieclub.online"
$ServerPort = 22

if ($Environment -eq "staging") {
    $ServiceName = "staging-backend"
    $Port = 3001
    $BaseUrl = "https://test.ieclub.online"
    $DeployPath = "/root/IEclub_dev_staging/ieclub-backend"
} else {
    $ServiceName = "ieclub-backend"
    $Port = 3000
    $BaseUrl = "https://ieclub.online"
    $DeployPath = "/root/IEclub_dev/ieclub-backend"
}

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[✅] $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[❌] $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[⚠️ ] $Text" -ForegroundColor Yellow
}

# --- Main Execution ---
Write-Section "IEClub 后端健康检查 (${Environment})"
Write-Info "环境: $Environment"
Write-Info "服务: $ServiceName"
Write-Info "端口: $Port"
Write-Info "地址: $BaseUrl"
Write-Host ""

# 1️⃣ 检查 PM2 进程状态
Write-Section "1️⃣ PM2 进程状态"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 status" 2>&1
Write-Host ""

# 2️⃣ 检查特定服务详情
Write-Section "2️⃣ 服务详细信息 ($ServiceName)"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 show $ServiceName" 2>&1
Write-Host ""

# 3️⃣ 查看最近日志
Write-Section "3️⃣ 最近日志 (最新50行)"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs $ServiceName --lines 50 --nostream 2>&1 || echo '无法获取日志'" 2>&1
Write-Host ""

# 4️⃣ 检查端口占用
Write-Section "4️⃣ 端口占用情况 ($Port)"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "lsof -i :$Port 2>/dev/null || netstat -tlnp 2>/dev/null | grep $Port || echo '端口未被占用'" 2>&1
Write-Host ""

# 5️⃣ 测试本地健康检查
Write-Section "5️⃣ 本地健康检查"
Write-Info "测试: http://localhost:$Port/health"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "curl -s http://localhost:$Port/health 2>&1 || echo '本地健康检查失败'" 2>&1
Write-Host ""

# 6️⃣ 测试外部健康检查
Write-Section "6️⃣ 外部健康检查"
Write-Info "测试: ${BaseUrl}/api/health"
try {
    $response = Invoke-WebRequest -Uri "${BaseUrl}/api/health" -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "外部健康检查通过！"
        Write-Host "响应内容:" -ForegroundColor Gray
        Write-Host $response.Content -ForegroundColor Gray
    }
} catch {
    Write-Error "外部健康检查失败: $_"
}
Write-Host ""

# 7️⃣ 检查配置文件
Write-Section "7️⃣ 配置文件检查"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
cd $DeployPath
echo "配置文件:"
if [ -f .env.$Environment ]; then
    echo "✅ .env.$Environment 存在"
    echo ""
    echo "配置预览 (隐藏敏感信息):"
    grep -E '^[^#]' .env.$Environment | sed 's/=.*/=***/' | head -15
else
    echo "❌ .env.$Environment 不存在！"
fi
"@ 2>&1
Write-Host ""

# 8️⃣ 检查服务器资源
Write-Section "8️⃣ 服务器资源"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo "CPU和内存:"
top -bn1 | head -5
echo ""
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h | grep -E '^/dev|Filesystem'
"@ 2>&1
Write-Host ""

# 9️⃣ 检查数据库连接
Write-Section "9️⃣ 数据库连接测试"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
cd $DeployPath
source .env.$Environment 2>/dev/null
if [ -n "\$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL 已配置"
    # 不显示完整连接字符串，只显示主机
    echo "数据库主机: \$(echo \$DATABASE_URL | sed -n 's/.*@\([^:/]*\).*/\1/p')"
else
    echo "❌ DATABASE_URL 未配置"
fi
"@ 2>&1
Write-Host ""

# 🔟 检查 Redis 连接
Write-Section "🔟 Redis 连接测试"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo "Redis 服务状态:"
systemctl status redis-server --no-pager -l | head -10 || systemctl status redis --no-pager -l | head -10 || echo "无法检查 Redis 状态"
echo ""
echo "Redis 连接测试:"
redis-cli ping 2>&1 || echo "❌ Redis 连接失败"
"@ 2>&1
Write-Host ""

# 总结
Write-Section "📋 诊断总结"
Write-Info "已完成所有检查"
Write-Host ""
Write-Host "💡 常用命令:" -ForegroundColor Yellow
Write-Host "   查看实时日志: ssh root@ieclub.online 'pm2 logs $ServiceName'" -ForegroundColor Gray
Write-Host "   重启服务: ssh root@ieclub.online 'pm2 restart $ServiceName'" -ForegroundColor Gray
Write-Host "   查看配置: ssh root@ieclub.online 'cat $DeployPath/.env.$Environment'" -ForegroundColor Gray
Write-Host ""

