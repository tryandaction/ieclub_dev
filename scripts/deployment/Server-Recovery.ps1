# ============================================
# IEClub 服务器自动恢复脚本
# ============================================
# 用途：服务器重启后快速恢复生产和测试环境
# 策略：生产优先 + 测试轻量化（共享依赖）
# ============================================

param(
    [switch]$ProductionOnly = $false,
    [switch]$SkipNpmInstall = $false
)

$ErrorActionPreference = "Continue"
$ServerUser = "root"
$ServerHost = "ieclub.online"

# 颜色输出
function Write-Step {
    param([string]$Text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] ✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] ❌ $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARNING] ⚠️  $Text" -ForegroundColor Yellow
}

# 等待服务器就绪
function Wait-ServerReady {
    Write-Step "检查服务器状态"
    
    $maxRetries = 10
    for ($i = 1; $i -le $maxRetries; $i++) {
        Write-Info "尝试连接服务器 ($i/$maxRetries)..."
        try {
            $result = Test-NetConnection $ServerHost -Port 22 -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($result) {
                Write-Success "服务器SSH端口已开放"
                Start-Sleep -Seconds 2
                
                # 测试SSH登录
                $testResult = ssh -o ConnectTimeout=10 "${ServerUser}@${ServerHost}" "echo 'OK'" 2>&1
                if ($testResult -match "OK") {
                    Write-Success "SSH连接成功"
                    return $true
                }
            }
        } catch {
            Write-Warning "连接失败，等待重试..."
        }
        Start-Sleep -Seconds 5
    }
    
    Write-Error "服务器未就绪"
    return $false
}

# 检查服务器资源
function Check-ServerResources {
    Write-Step "检查服务器资源"
    
    $checkScript = @'
echo "=== 内存 ==="
free -h | grep -E "Mem|Swap"
echo ""
echo "=== 磁盘 ==="
df -h | grep -E "Filesystem|/dev/vda"
echo ""
echo "=== 负载 ==="
uptime
'@
    
    ssh "${ServerUser}@${ServerHost}" $checkScript
}

# 恢复生产环境后端
function Restore-ProductionBackend {
    Write-Step "恢复生产环境后端"
    
    $restoreScript = @'
#!/bin/bash
set -e

cd /root/IEclub_dev/ieclub-backend

echo "[INFO] 检查代码完整性..."
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json 不存在！"
    exit 1
fi

if [ ! -f "src/server.js" ]; then
    echo "[ERROR] src/server.js 不存在！"
    exit 1
fi

echo "[SUCCESS] 代码文件完整"

# 检查package.json是否被破坏
PKG_SIZE=$(wc -l < package.json)
if [ "$PKG_SIZE" -lt 50 ]; then
    echo "[ERROR] package.json 可能已损坏（只有 $PKG_SIZE 行）"
    exit 1
fi

echo "[INFO] package.json 正常（$PKG_SIZE 行）"

# 清理旧依赖
if [ -d "node_modules" ] && [ ! -L "node_modules" ]; then
    MODULE_COUNT=$(ls node_modules 2>/dev/null | wc -l)
    if [ "$MODULE_COUNT" -lt 100 ]; then
        echo "[WARN] node_modules 可能不完整（只有 $MODULE_COUNT 个包），将重新安装"
        rm -rf node_modules package-lock.json
    else
        echo "[INFO] node_modules 存在（$MODULE_COUNT 个包）"
    fi
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ] || [ "$FORCE_INSTALL" = "1" ]; then
    echo "[INFO] 清理npm缓存..."
    npm cache clean --force
    
    echo "[INFO] 开始安装依赖（这可能需要3-5分钟）..."
    npm install --loglevel=error
    
    MODULE_COUNT=$(ls node_modules 2>/dev/null | wc -l)
    echo "[SUCCESS] 依赖安装完成（$MODULE_COUNT 个包）"
    
    # 验证关键依赖
    for pkg in express prisma bcrypt jsonwebtoken hpp; do
        if [ ! -d "node_modules/$pkg" ]; then
            echo "[ERROR] 关键依赖 $pkg 未安装！"
            exit 1
        fi
    done
    echo "[SUCCESS] 关键依赖验证通过"
else
    echo "[INFO] 跳过依赖安装（已存在）"
fi

# 启动服务
echo "[INFO] 启动生产环境..."
pm2 delete ieclub-backend 2>/dev/null || true
NODE_ENV=production PORT=3000 pm2 start src/server.js --name ieclub-backend

sleep 5

# 检查状态
if pm2 list | grep -q "ieclub-backend.*online"; then
    echo "[SUCCESS] 生产环境启动成功"
    pm2 logs ieclub-backend --lines 10 --nostream
else
    echo "[ERROR] 生产环境启动失败"
    pm2 logs ieclub-backend --err --lines 20 --nostream
    exit 1
fi
'@
    
    if ($SkipNpmInstall) {
        $restoreScript = $restoreScript -replace 'FORCE_INSTALL="1"', 'FORCE_INSTALL="0"'
    } else {
        $restoreScript = "export FORCE_INSTALL=1`n" + $restoreScript
    }
    
    $restoreScript | ssh "${ServerUser}@${ServerHost}" "cat > /tmp/restore-production.sh && chmod +x /tmp/restore-production.sh && bash /tmp/restore-production.sh"
}

# 恢复测试环境后端（轻量模式）
function Restore-StagingBackend {
    Write-Step "恢复测试环境后端（轻量模式）"
    
    $restoreScript = @'
#!/bin/bash
set -e

cd /root/IEclub_dev_staging/ieclub-backend

echo "[INFO] 更新测试环境代码..."
git fetch origin develop 2>/dev/null || true
git reset --hard origin/develop 2>/dev/null || git pull origin develop

echo "[INFO] 配置软链接到生产环境依赖..."
if [ -L "node_modules" ]; then
    echo "[INFO] 软链接已存在"
else
    rm -rf node_modules
    ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules
    echo "[SUCCESS] 软链接创建成功"
fi

# 验证软链接
if [ ! -L "node_modules" ]; then
    echo "[ERROR] node_modules 不是软链接！"
    exit 1
fi

MODULE_COUNT=$(ls node_modules 2>/dev/null | wc -l)
echo "[INFO] 共享 $MODULE_COUNT 个依赖包"

echo "[INFO] 复制环境配置..."
if [ -f "/root/IEclub_dev/ieclub-backend/.env.staging" ]; then
    cp /root/IEclub_dev/ieclub-backend/.env.staging .env.staging
    echo "[SUCCESS] 环境配置已复制"
fi

echo "[INFO] 启动测试环境..."
pm2 delete staging-backend 2>/dev/null || true
NODE_ENV=staging PORT=3001 pm2 start src/server-staging.js --name staging-backend

sleep 5

# 检查状态
if pm2 list | grep -q "staging-backend.*online"; then
    echo "[SUCCESS] 测试环境启动成功"
    pm2 logs staging-backend --lines 10 --nostream
else
    echo "[ERROR] 测试环境启动失败"
    pm2 logs staging-backend --err --lines 20 --nostream
    exit 1
fi
'@
    
    $restoreScript | ssh "${ServerUser}@${ServerHost}" "cat > /tmp/restore-staging.sh && chmod +x /tmp/restore-staging.sh && bash /tmp/restore-staging.sh"
}

# 验证环境
function Test-Environments {
    Write-Step "验证环境"
    
    # 生产环境
    Write-Info "检查生产环境..."
    try {
        $prodHealth = Invoke-WebRequest -Uri "https://ieclub.online/api/health" -TimeoutSec 10 -UseBasicParsing
        if ($prodHealth.StatusCode -eq 200) {
            Write-Success "生产环境健康检查通过"
        }
    } catch {
        Write-Error "生产环境健康检查失败: $_"
    }
    
    if (-not $ProductionOnly) {
        # 测试环境
        Write-Info "检查测试环境..."
        try {
            $stagingHealth = Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -TimeoutSec 10 -UseBasicParsing
            if ($stagingHealth.StatusCode -eq 200) {
                Write-Success "测试环境健康检查通过"
            }
        } catch {
            Write-Error "测试环境健康检查失败: $_"
        }
    }
}

# 优化配置
function Optimize-Server {
    Write-Step "优化服务器配置"
    
    $optimizeScript = @'
echo "[INFO] 配置PM2日志轮转..."
pm2 install pm2-logrotate 2>/dev/null || echo "[INFO] pm2-logrotate已安装"
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5

echo "[INFO] 保存PM2配置..."
pm2 save

echo "[INFO] 清理临时文件..."
rm -rf /tmp/*.zip /tmp/*.sh
npm cache clean --force

echo "[SUCCESS] 优化完成"
'@
    
    ssh "${ServerUser}@${ServerHost}" $optimizeScript
}

# ============================================
# 主流程
# ============================================

Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║         IEClub 服务器自动恢复脚本 v1.0                    ║
║                                                            ║
║  策略：生产优先 + 测试轻量化（共享依赖）                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Yellow

Write-Info "目标：恢复 $(if($ProductionOnly){'生产环境'}else{'生产+测试环境'})"
Write-Info "跳过npm install：$(if($SkipNpmInstall){'是'}else{'否'})"

# 确认
Write-Warning "⚠️  即将开始恢复服务器"
$confirm = Read-Host "继续? (Y/N)"
if ($confirm -ne 'Y') {
    Write-Info "操作已取消"
    exit 0
}

try {
    # 步骤1：等待服务器就绪
    if (-not (Wait-ServerReady)) {
        throw "服务器未就绪，无法继续"
    }
    
    # 步骤2：检查资源
    Check-ServerResources
    
    # 步骤3：恢复生产环境
    Restore-ProductionBackend
    Write-Success "生产环境恢复完成"
    
    # 步骤4：恢复测试环境（可选）
    if (-not $ProductionOnly) {
        Restore-StagingBackend
        Write-Success "测试环境恢复完成"
    }
    
    # 步骤5：验证
    Start-Sleep -Seconds 3
    Test-Environments
    
    # 步骤6：优化
    Optimize-Server
    
    # 最终报告
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "║         🎉 服务器恢复完成！                                ║" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    
    Write-Host "📱 生产环境: https://ieclub.online" -ForegroundColor Cyan
    Write-Host "🔌 生产API:  https://ieclub.online/api/health" -ForegroundColor Cyan
    
    if (-not $ProductionOnly) {
        Write-Host "🧪 测试环境: https://test.ieclub.online" -ForegroundColor Cyan
        Write-Host "🔌 测试API:  https://test.ieclub.online/api/health" -ForegroundColor Cyan
    }
    
    Write-Host "`n查看服务状态：ssh root@ieclub.online 'pm2 list'" -ForegroundColor Gray
    
} catch {
    Write-Error "恢复失败: $_"
    Write-Host "`n请查看日志并手动处理" -ForegroundColor Yellow
    exit 1
}
