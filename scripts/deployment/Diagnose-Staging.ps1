# ============================================
# 测试环境诊断脚本
# ============================================
# 用途：快速诊断测试环境部署问题
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22
)

# 设置控制台编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Section {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Check {
    param([string]$Text, [bool]$Pass)
    if ($Pass) {
        Write-Host "✅ $Text" -ForegroundColor Green
    } else {
        Write-Host "❌ $Text" -ForegroundColor Red
    }
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Blue
}

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   测试环境诊断工具                     ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Yellow

# 1. 检查SSH连接
Write-Section "1. SSH连接测试"
try {
    $sshTest = ssh -p $ServerPort -o ConnectTimeout=5 "${ServerUser}@${ServerHost}" "echo 'connected'" 2>&1
    if ($sshTest -match "connected") {
        Write-Check "SSH连接正常" $true
    } else {
        Write-Check "SSH连接失败" $false
        Write-Info "错误: $sshTest"
        exit 1
    }
} catch {
    Write-Check "SSH连接失败" $false
    Write-Info "错误: $_"
    exit 1
}

# 2. 检查目录结构
Write-Section "2. 目录结构检查"
$dirCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo "=== 检查目录 ==="
if [ -d /root/IEclub_dev_staging ]; then
    echo "PASS:测试环境根目录存在"
else
    echo "FAIL:测试环境根目录不存在"
fi

if [ -d /root/IEclub_dev_staging/ieclub-backend ]; then
    echo "PASS:后端目录存在"
else
    echo "FAIL:后端目录不存在"
fi

if [ -f /root/IEclub_dev_staging/ieclub-backend/.env.staging ]; then
    echo "PASS:配置文件存在"
else
    echo "FAIL:配置文件不存在 ⚠️ 这是关键问题！"
fi

if [ -d /var/www/test.ieclub.online ]; then
    echo "PASS:前端目录存在"
else
    echo "FAIL:前端目录不存在"
fi
"@

$dirCheck -split "`n" | ForEach-Object {
    if ($_ -match "^PASS:(.+)") {
        Write-Check $matches[1] $true
    } elseif ($_ -match "^FAIL:(.+)") {
        Write-Check $matches[1] $false
    } elseif ($_ -match "^===") {
        # 跳过分隔符
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

# 3. 检查PM2进程
Write-Section "3. PM2进程状态"
$pm2Status = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 jlist" 2>&1

if ($pm2Status) {
    try {
        $processes = $pm2Status | ConvertFrom-Json
        $stagingBackend = $processes | Where-Object { $_.name -eq "staging-backend" }
        
        if ($stagingBackend) {
            Write-Info "进程名称: $($stagingBackend.name)"
            Write-Info "进程ID: $($stagingBackend.pm_id)"
            Write-Info "PID: $($stagingBackend.pid)"
            
            $isOnline = $stagingBackend.pm2_env.status -eq "online"
            Write-Check "状态: $($stagingBackend.pm2_env.status)" $isOnline
            
            $restarts = $stagingBackend.pm2_env.restart_time
            Write-Info "重启次数: $restarts"
            
            if ($restarts -gt 5) {
                Write-Host "  ⚠️  重启次数过多，说明服务不稳定！" -ForegroundColor Yellow
            }
            
            $uptime = [math]::Round($stagingBackend.pm2_env.pm_uptime / 1000)
            Write-Info "运行时间: $uptime 秒"
            
            if ($uptime -lt 60 -and $restarts -gt 0) {
                Write-Host "  ⚠️  运行时间短且有重启，可能存在启动问题！" -ForegroundColor Yellow
            }
        } else {
            Write-Check "staging-backend 进程不存在" $false
        }
    } catch {
        Write-Host "无法解析PM2状态: $_" -ForegroundColor Yellow
    }
} else {
    Write-Check "PM2未运行或无进程" $false
}

# 4. 检查端口监听
Write-Section "4. 端口监听检查"
$portCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo "=== 端口检查 ==="
if netstat -tlnp 2>/dev/null | grep -q ':3001'; then
    echo "PASS:3001端口正在监听（测试环境后端）"
else
    echo "FAIL:3001端口未监听 ⚠️ 服务未启动！"
fi

if netstat -tlnp 2>/dev/null | grep -q ':3000'; then
    echo "PASS:3000端口正在监听（生产环境后端）"
else
    echo "INFO:3000端口未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ':80'; then
    echo "PASS:80端口正在监听（Nginx）"
else
    echo "FAIL:80端口未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ':443'; then
    echo "PASS:443端口正在监听（Nginx HTTPS）"
else
    echo "FAIL:443端口未监听"
fi
"@

$portCheck -split "`n" | ForEach-Object {
    if ($_ -match "^PASS:(.+)") {
        Write-Check $matches[1] $true
    } elseif ($_ -match "^FAIL:(.+)") {
        Write-Check $matches[1] $false
    } elseif ($_ -match "^INFO:(.+)") {
        Write-Info $matches[1]
    } elseif ($_ -match "^===") {
        # 跳过分隔符
    }
}

# 5. 检查配置文件内容
Write-Section "5. 配置文件检查"
$configCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -f /root/IEclub_dev_staging/ieclub-backend/.env.staging ]; then
    echo "=== 配置文件存在 ==="
    echo "关键配置项:"
    grep -E "^(NODE_ENV|PORT|DATABASE_URL|REDIS_HOST|JWT_SECRET|CORS_ORIGIN)=" /root/IEclub_dev_staging/ieclub-backend/.env.staging 2>/dev/null | sed 's/=.*/=***/' || echo "无法读取配置"
else
    echo "FAIL:配置文件不存在"
fi
"@

$configCheck -split "`n" | ForEach-Object {
    if ($_ -match "^FAIL:") {
        Write-Check "配置文件不存在" $false
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

# 6. 检查最近的日志
Write-Section "6. 最近日志（最后20行）"
Write-Info "错误日志:"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs staging-backend --err --lines 20 --nostream 2>/dev/null || echo '无日志'" | ForEach-Object {
    if ($_ -match "error|Error|ERROR|fail|Fail|FAIL") {
        Write-Host "  $_" -ForegroundColor Red
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Info "输出日志:"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs staging-backend --out --lines 20 --nostream 2>/dev/null || echo '无日志'" | ForEach-Object {
    if ($_ -match "✅|success|Success|SUCCESS|started") {
        Write-Host "  $_" -ForegroundColor Green
    } elseif ($_ -match "⚠️|warn|Warn|WARN") {
        Write-Host "  $_" -ForegroundColor Yellow
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

# 7. 健康检查
Write-Section "7. 健康检查"
Write-Info "本地健康检查（服务器内部）:"
$localHealth = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "curl -s http://localhost:3001/health 2>&1"
if ($localHealth -match '"status":"ok"' -or $localHealth -match 'status.*ok') {
    Write-Check "本地健康检查通过" $true
    Write-Host "  响应: $localHealth" -ForegroundColor Gray
} else {
    Write-Check "本地健康检查失败" $false
    Write-Host "  响应: $localHealth" -ForegroundColor Gray
}

Write-Host ""
Write-Info "外部健康检查（通过域名）:"
try {
    $response = Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -Method GET -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Check "外部健康检查通过" $true
        Write-Host "  响应: $($response.Content)" -ForegroundColor Gray
    } else {
        Write-Check "外部健康检查失败 (状态码: $($response.StatusCode))" $false
    }
} catch {
    Write-Check "外部健康检查失败" $false
    Write-Host "  错误: $_" -ForegroundColor Gray
}

# 8. 系统资源检查
Write-Section "8. 系统资源"
$resourceCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo "=== 内存使用 ==="
free -h | grep -E 'Mem:|Swap:'

echo ""
echo "=== 磁盘使用 ==="
df -h / | tail -1

echo ""
echo "=== CPU负载 ==="
uptime
"@

Write-Host $resourceCheck -ForegroundColor Gray

# 9. 数据库连接检查
Write-Section "9. 数据库检查"
$dbCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -f /root/IEclub_dev_staging/ieclub-backend/.env.staging ]; then
    DB_URL=\$(grep '^DATABASE_URL=' /root/IEclub_dev_staging/ieclub-backend/.env.staging | cut -d'=' -f2- | tr -d '"')
    DB_NAME=\$(echo "\$DB_URL" | sed -n 's|.*@.*/\([^?]*\).*|\1|p')
    
    if [ -n "\$DB_NAME" ]; then
        echo "数据库名称: \$DB_NAME"
        
        # 提取密码
        DB_PASS=\$(echo "\$DB_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p')
        
        # 检查数据库是否存在
        if mysql -u root -p"\$DB_PASS" -e "USE \$DB_NAME" 2>/dev/null; then
            echo "PASS:数据库连接成功"
            
            # 检查表数量
            TABLE_COUNT=\$(mysql -u root -p"\$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='\$DB_NAME'" 2>/dev/null)
            echo "表数量: \$TABLE_COUNT"
        else
            echo "FAIL:数据库连接失败或数据库不存在"
        fi
    else
        echo "FAIL:无法解析数据库名称"
    fi
else
    echo "FAIL:配置文件不存在，无法检查数据库"
fi
"@

$dbCheck -split "`n" | ForEach-Object {
    if ($_ -match "^PASS:(.+)") {
        Write-Check $matches[1] $true
    } elseif ($_ -match "^FAIL:(.+)") {
        Write-Check $matches[1] $false
    } else {
        Write-Host "  $_" -ForegroundColor Gray
    }
}

# 总结和建议
Write-Section "诊断总结"

Write-Host "📋 常见问题修复方案:`n" -ForegroundColor Yellow

Write-Host "1️⃣  如果配置文件不存在:" -ForegroundColor Cyan
Write-Host "   .\scripts\deployment\Fix-Staging-Env.ps1`n" -ForegroundColor White

Write-Host "2️⃣  如果PM2进程不断重启:" -ForegroundColor Cyan
Write-Host "   ssh root@ieclub.online 'pm2 logs staging-backend --lines 50'`n" -ForegroundColor White

Write-Host "3️⃣  如果端口未监听:" -ForegroundColor Cyan
Write-Host "   ssh root@ieclub.online 'pm2 restart staging-backend'`n" -ForegroundColor White

Write-Host "4️⃣  如果数据库连接失败:" -ForegroundColor Cyan
Write-Host "   检查 .env.staging 中的 DATABASE_URL 配置`n" -ForegroundColor White

Write-Host "5️⃣  重新部署全部:" -ForegroundColor Cyan
Write-Host "   .\scripts\deployment\Deploy-Staging.ps1 -Target all`n" -ForegroundColor White

Write-Host "📖 详细文档: docs\deployment\STAGING_DEPLOYMENT_FIX.md`n" -ForegroundColor Blue

