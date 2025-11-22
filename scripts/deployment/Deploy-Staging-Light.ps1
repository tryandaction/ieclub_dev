# ============================================
# IEClub 测试环境轻量部署脚本 v1.0
# ============================================
# 优化点：
#   - 共享生产环境的node_modules（软链接）
#   - 跳过npm install，节省内存和时间
#   - 只部署代码变更
# ============================================

param(
    [ValidateSet("web", "backend", "all")]
    [string]$Target = "all",
    
    [string]$Message = "快速部署"
)

# 🔧 设置编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# --- Configuration ---
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WebDir = "${ProjectRoot}\ieclub-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"

$ServerUser = "root"
$ServerHost = "ieclub.online"
$ServerPort = 22

# --- Helper Functions ---
function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

# --- 部署前端 ---
function Deploy-Web {
    Write-Info "开始部署前端（轻量模式）..."
    
    # 1. 构建前端
    Write-Info "构建前端..."
    Push-Location $WebDir
    
    try {
        npm run build -- --mode staging
        if ($LASTEXITCODE -ne 0) {
            throw "前端构建失败"
        }
        Write-Success "前端构建完成"
        
        # 2. 打包
        $zipFile = "web-staging-light.zip"
        if (Test-Path $zipFile) {
            Remove-Item $zipFile -Force
        }
        
        Compress-Archive -Path "dist\*" -DestinationPath $zipFile
        Write-Success "打包完成: $zipFile"
        
        # 3. 上传
        Write-Info "上传到服务器..."
        scp -P $ServerPort $zipFile "${ServerUser}@${ServerHost}:/tmp/"
        
        # 4. 部署
        $deployCmd = @"
cd /tmp &&
mkdir -p /var/www/test.ieclub.online.new &&
unzip -q -o web-staging-light.zip -d /var/www/test.ieclub.online.new &&
rm -rf /var/www/test.ieclub.online.backup &&
mv /var/www/test.ieclub.online /var/www/test.ieclub.online.backup 2>/dev/null || true &&
mv /var/www/test.ieclub.online.new /var/www/test.ieclub.online &&
rm web-staging-light.zip &&
echo '前端部署完成'
"@
        
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" $deployCmd
        
        # 5. 清理
        Remove-Item $zipFile -Force
        Write-Success "前端部署完成"
        
    } catch {
        Write-Error "前端部署失败: $_"
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
}

# --- 部署后端（轻量模式）---
function Deploy-Backend {
    Write-Info "开始部署后端（轻量模式 - 共享依赖）..."
    
    # 部署脚本
    $deployScript = @"
#!/bin/bash
set -e

echo '[INFO] 更新代码...'
cd /root/IEclub_dev_staging/ieclub-backend
git fetch origin develop
git reset --hard origin/develop

echo '[INFO] 设置node_modules软链接（共享生产依赖）...'
if [ ! -L 'node_modules' ]; then
    rm -rf node_modules
    ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules
    echo '[SUCCESS] 软链接创建成功'
else
    echo '[INFO] 软链接已存在'
fi

echo '[INFO] 复制环境配置...'
cp /root/IEclub_dev/ieclub-backend/.env.staging .env.staging || echo '[WARN] .env.staging不存在'

echo '[INFO] 重启PM2服务...'
pm2 delete staging-backend 2>/dev/null || true
NODE_ENV=staging PORT=3001 pm2 start src/server-staging.js --name staging-backend

echo '[INFO] 等待服务启动...'
sleep 5

echo '[INFO] 查看服务状态...'
pm2 list | grep staging

echo '[INFO] 查看最近日志...'
pm2 logs staging-backend --lines 10 --nostream

echo '[SUCCESS] 后端部署完成！'
"@
    
    # 上传并执行
    $scriptPath = "/tmp/deploy-staging-light.sh"
    
    Write-Info "上传部署脚本..."
    $deployScript | ssh -p $ServerPort "${ServerUser}@${ServerHost}" "cat > $scriptPath && chmod +x $scriptPath"
    
    Write-Info "执行部署..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "bash $scriptPath"
    
    Write-Success "后端部署完成"
}

# --- 健康检查 ---
function Test-Health {
    Write-Info "健康检查..."
    
    $maxRetries = 3
    for ($i = 1; $i -le $maxRetries; $i++) {
        Write-Info "第 $i/$maxRetries 次检查..."
        try {
            $response = Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "健康检查通过！"
                $content = $response.Content | ConvertFrom-Json
                Write-Host "服务状态: $($content.status)" -ForegroundColor Green
                Write-Host "运行时间: $($content.uptime)秒" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Warning "检查失败，等待重试..."
            Start-Sleep -Seconds 3
        }
    }
    
    Write-Error "健康检查失败"
    return $false
}

# --- Main ---
Write-Host "`n================================================================" -ForegroundColor Yellow
Write-Host "  IEClub 测试环境轻量部署 (共享依赖模式)" -ForegroundColor Yellow
Write-Host "================================================================`n" -ForegroundColor Yellow

Write-Info "部署目标: $Target"
Write-Info "提交信息: $Message"
Write-Info "优化模式: 共享生产环境依赖，无需npm install"

# 确认
Write-Warning "⚠️  将部署到测试环境 (https://test.ieclub.online)"
$confirm = Read-Host "继续? (Y/N)"
if ($confirm -ne 'Y') {
    Write-Info "部署已取消"
    exit 0
}

# 执行部署
try {
    if ($Target -eq "web" -or $Target -eq "all") {
        Deploy-Web
    }
    
    if ($Target -eq "backend" -or $Target -eq "all") {
        Deploy-Backend
    }
    
    # 健康检查
    if ($Target -eq "backend" -or $Target -eq "all") {
        Start-Sleep -Seconds 3
        Test-Health
    }
    
    Write-Host "`n================================================================" -ForegroundColor Green
    Write-Host "  🎉 测试环境部署完成" -ForegroundColor Green
    Write-Host "================================================================`n" -ForegroundColor Green
    
    Write-Host "📱 用户网页: https://test.ieclub.online" -ForegroundColor Cyan
    Write-Host "🔌 后端API:  https://test.ieclub.online/api" -ForegroundColor Cyan
    Write-Host "❤️  健康检查: https://test.ieclub.online/api/health" -ForegroundColor Cyan
    
} catch {
    Write-Error "部署失败: $_"
    exit 1
}
