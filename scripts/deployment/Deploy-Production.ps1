#!/usr/bin/env pwsh
# ================================================================
# IEClub 生产环境一键部署脚本 v3.0
# ================================================================
#
# 功能: 部署所有端到正式生产环境
# 服务器: ieclub.online
# 用途: 正式环境部署
#
# 支持部署：
#   - 用户网页端（React Web）
#   - 管理员网页端（React Admin）
#   - 后端API服务
#   - 小程序（仅显示配置说明）
#
# 使用方法:
#   .\Deploy-Production.ps1 -Target <web|admin|backend|all> [-Message "提交信息"]
#
# 示例:
#   .\Deploy-Production.ps1 -Target all -Message "正式发布"    # 全部部署
#   .\Deploy-Production.ps1 -Target web                        # 仅用户网页
#   .\Deploy-Production.ps1 -Target admin                      # 仅管理员网页
#   .\Deploy-Production.ps1 -Target backend                    # 仅后端
#
# v3.0 更新 (2025-11-05):
#   - 支持管理员网页部署
#   - 统一的一键部署所有端
#   - 添加小程序配置说明
#   - 完善管理员初始化指导
# ================================================================

param(
    [ValidateSet("web", "admin", "backend", "all")]
    [string]$Target,
    
    [string]$Message,
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [switch]$SkipConfirmation
)

# 🔧 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 设置默认值
if (-not $Target) { $Target = "all" }
if (-not $Message) { $Message = "Production deployment" }

# --- Configuration ---
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WebDir = "${ProjectRoot}\ieclub-web"
$AdminWebDir = "${ProjectRoot}\admin-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$MiniprogramDir = "${ProjectRoot}\ieclub-frontend"

# 生产环境服务器配置
$ServerPort = 22
$ProductionPort = 3000  # 生产环境后端端口

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Magenta
    Write-Host "  $Text" -ForegroundColor Magenta
    Write-Host "================================================================`n" -ForegroundColor Magenta
}

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

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

# --- 健康检查函数 ---
function Test-HealthCheck {
    param(
        [string]$Url,
        [int]$MaxRetries = 5,
        [int]$RetryDelay = 3
    )
    
    Write-Info "健康检查: $Url"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        Write-Info "第 $i/$MaxRetries 次检查..."
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "健康检查通过！"
                return $true
            }
        } catch {
            Write-Warning "健康检查失败: $_"
        }
        
        if ($i -lt $MaxRetries) {
            Write-Info "等待 $RetryDelay 秒后重试..."
            Start-Sleep -Seconds $RetryDelay
        }
    }
    
    Write-Error "健康检查失败（已重试 $MaxRetries 次）"
    return $false
}

# --- Git Workflow for Production ---
function Sync-ProductionBranch {
    Write-Section "同步代码到生产分支 (develop → main)"
    Set-Location -Path $ProjectRoot
    
    # 获取当前分支
    $currentBranch = git branch --show-current
    Write-Info "当前分支: $currentBranch"
    
    # 检查工作区状态
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "工作区有未提交的更改："
        git status --short
        Write-Host ""
        
        $commitChanges = Read-Host "是否提交这些更改到 $currentBranch 分支？(Y/N)"
        if ($commitChanges -eq 'Y' -or $commitChanges -eq 'y') {
            git add .
            git commit -m "[PRE-DEPLOY] $Message"
            Write-Success "已提交更改到 $currentBranch"
        } else {
            Write-Error "请先提交或暂存您的更改"
            exit 1
        }
    } else {
        Write-Success "工作区干净，没有未提交的更改"
    }
    
    # 推送当前分支到远程
    if ($currentBranch -eq "develop") {
        Write-Info "推送 develop 分支到远程..."
        git push origin develop
        if ($LASTEXITCODE -ne 0) {
            Write-Error "推送 develop 分支失败！"
        exit 1
    }
        Write-Success "已推送 develop 分支"
    }
    
    # 确保 main 分支存在
    $hasMasterBranch = git branch --list master
    $hasMainBranch = git branch --list main
    $targetBranch = "main"
    
    if (-not $hasMainBranch -and $hasMasterBranch) {
        $targetBranch = "master"
    }
    
    Write-Info "目标生产分支: $targetBranch"
    
    # 切换到目标分支
    Write-Info "切换到 $targetBranch 分支..."
    git checkout $targetBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Error "切换到 $targetBranch 分支失败！"
        Write-Warning "如果 $targetBranch 分支不存在，请先创建：git checkout -b $targetBranch"
        exit 1
    }
    Write-Success "已切换到 $targetBranch 分支"
    
    # 从远程更新 main 分支
    Write-Info "从远程更新 $targetBranch 分支..."
    git pull origin $targetBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "从远程拉取 $targetBranch 失败，可能是首次推送"
    }
    
    # 合并 develop 到 main
    Write-Section "合并 develop 分支到 $targetBranch"
    Write-Info "执行合并: develop → $targetBranch"
    
    git merge develop --no-ff -m "[RELEASE] $Message - Merge develop to $targetBranch"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "合并失败！请解决冲突后重试"
        Write-Warning "解决冲突步骤："
        Write-Host "  1. 查看冲突文件: git status"
        Write-Host "  2. 编辑并解决冲突"
        Write-Host "  3. 标记为已解决: git add <文件>"
        Write-Host "  4. 完成合并: git commit"
        Write-Host "  5. 重新运行部署脚本"
        exit 1
    }
    
    Write-Success "成功合并 develop → $targetBranch"
    
    # 推送 main 分支到远程
    Write-Info "推送 $targetBranch 分支到远程..."
    git push origin $targetBranch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "推送 $targetBranch 分支失败！"
        exit 1
    }
    
    Write-Success "✅ 代码同步完成！$targetBranch 分支已更新"
    Write-Host ""
    Write-Info "Git 工作流:"
    Write-Host "  develop (开发分支) → $targetBranch (生产分支) → 部署到服务器" -ForegroundColor Cyan
    Write-Host ""
}

# --- Build Web Frontend (Production) ---
function Build-Web-Production {
    Write-Section "构建用户前端 (生产环境)"
    Set-Location -Path $WebDir
    
    # 使用模板创建 .env.production 文件（如果不存在）
    if (-not (Test-Path ".env.production")) {
        if (Test-Path "env.production.template") {
            Write-Info "从模板创建 .env.production 文件..."
            Copy-Item "env.production.template" ".env.production"
            Write-Success "已创建 .env.production 文件"
        } else {
            Write-Error "env.production.template 文件不存在！"
            exit 1
        }
    }
    
    Write-Info "使用配置: .env.production"
    Get-Content ".env.production" | Write-Host -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "安装依赖..."
    npm install
    
    Write-Info "构建生产版本..."
    npm run build
    
    if (Test-Path "dist") {
        Write-Success "用户前端构建完成 (生产版)"
        Write-Info "构建产物:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
    } else {
        Write-Error "前端构建失败 - dist 目录不存在"
        exit 1
    }
}

# --- Deploy Web to Production ---
function Deploy-Web-Production {
    Write-Section "部署用户前端到生产环境"
    
    Set-Location -Path $WebDir
    
    # 验证构建产物
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "构建产物不完整！"
        exit 1
    }
    
    # 打包
    Write-Info "打包前端文件..."
    if (Test-Path "web-production.zip") {
        Remove-Item "web-production.zip" -Force
    }
    Compress-Archive -Path "dist\*" -DestinationPath "web-production.zip" -Force
    
    $zipSize = (Get-Item "web-production.zip").Length / 1KB
    Write-Success "打包完成: web-production.zip ($('{0:N2}' -f $zipSize) KB)"
    
    # 上传到服务器
    Write-Info "上传到生产服务器..."
    scp -P $ServerPort "web-production.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 部署
    Write-Info "部署到生产目录..."
    $webDeployCmd = "mkdir -p /var/www/ieclub.online && unzip -oq /tmp/web-production.zip -d /var/www/ieclub.online/ && rm -f /tmp/web-production.zip && chmod -R 755 /var/www/ieclub.online && echo '用户前端部署完成'"
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" $webDeployCmd
    
    # 健康检查
    Start-Sleep -Seconds 3
    $healthCheckPassed = Test-HealthCheck -Url "https://ieclub.online" -MaxRetries 3 -RetryDelay 2
    
    if (-not $healthCheckPassed) {
        Write-Error "用户前端健康检查失败！"
        exit 1
    }
    
    Write-Success "用户前端部署完成并通过健康检查"
    Write-Info "访问地址: https://ieclub.online"
}

# --- Build Admin Web (Production) ---
function Build-Admin-Web-Production {
    Write-Section "构建管理员前端 (生产环境)"
    Set-Location -Path $AdminWebDir
    
    Write-Info "检查管理员前端项目..."
    if (-not (Test-Path "package.json")) {
        Write-Error "管理员前端项目不存在！路径: $AdminWebDir"
        exit 1
    }
    
    Write-Info "安装依赖..."
    npm install
    
    Write-Info "构建管理员前端 (生产版)..."
    $env:VITE_API_URL = "https://ieclub.online/api"
    npm run build
    
    if (Test-Path "dist") {
        Write-Success "管理员前端构建完成 (生产版)"
        Write-Info "构建产物:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
    } else {
        Write-Error "管理员前端构建失败"
        exit 1
    }
}

# --- Deploy Admin Web to Production ---
function Deploy-Admin-Web-Production {
    Write-Section "部署管理员前端到生产环境"
    
    Set-Location -Path $AdminWebDir
    
    # 验证构建产物
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "构建产物不完整！"
        exit 1
    }
    
    # 打包
    Write-Info "打包管理员前端文件..."
    if (Test-Path "admin-web-production.zip") {
        Remove-Item "admin-web-production.zip" -Force
    }
    Compress-Archive -Path "dist\*" -DestinationPath "admin-web-production.zip" -Force
    
    $zipSize = (Get-Item "admin-web-production.zip").Length / 1KB
    Write-Success "打包完成: admin-web-production.zip ($('{0:N2}' -f $zipSize) KB)"
    
    # 上传到服务器
    Write-Info "上传到生产服务器..."
    scp -P $ServerPort "admin-web-production.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 部署
    Write-Info "部署到生产目录..."
    $adminDeployCmd = "mkdir -p /var/www/ieclub.online/admin && unzip -oq /tmp/admin-web-production.zip -d /var/www/ieclub.online/admin/ && rm -f /tmp/admin-web-production.zip && chmod -R 755 /var/www/ieclub.online/admin && echo '管理员前端部署完成'"
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" $adminDeployCmd
    
    # 健康检查
    Start-Sleep -Seconds 3
    $healthCheckPassed = Test-HealthCheck -Url "https://ieclub.online/admin" -MaxRetries 3 -RetryDelay 2
    
    if (-not $healthCheckPassed) {
        Write-Error "管理员前端健康检查失败！"
        exit 1
    }
    
    Write-Success "管理员前端部署完成并通过健康检查"
    Write-Info "访问地址: https://ieclub.online/admin"
}

# --- Deploy Backend to Production ---
function Deploy-Backend-Production {
    Write-Section "部署后端到生产环境"
    
    Set-Location -Path $BackendDir
    
    # 打包后端代码
    Write-Info "打包后端代码..."
    
    if (Test-Path "backend-production.zip") {
        Remove-Item "backend-production.zip" -Force
    }
    
    # 创建临时目录
    $tempDir = "temp-production-backend"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # 只复制需要的文件
    $includeItems = @("src", "prisma", "package.json", "package-lock.json")
    
    foreach ($item in $includeItems) {
        if (Test-Path $item) {
            Copy-Item -Path $item -Destination $tempDir -Recurse -Force
        }
    }
    
    Compress-Archive -Path "$tempDir\*" -DestinationPath "backend-production.zip" -Force
    Remove-Item $tempDir -Recurse -Force
    
    $zipSize = (Get-Item "backend-production.zip").Length / 1KB
    Write-Success "后端打包完成: backend-production.zip ($('{0:N2}' -f $zipSize) KB)"
    
    # 上传到服务器
    Write-Info "上传后端代码到生产服务器..."
    scp -P $ServerPort "backend-production.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 部署脚本
    $backendScript = @'
#!/bin/bash
set -e

echo "========================================"
echo "  生产环境后端部署开始"
echo "========================================"

echo "[1/8] 创建生产环境目录..."
mkdir -p /root/IEclub_dev/ieclub-backend
cd /root/IEclub_dev/ieclub-backend

echo "[2/8] 解压代码..."
unzip -oq /tmp/backend-production.zip
rm -f /tmp/backend-production.zip

echo "[3/8] 检查配置文件..."
if [ ! -f .env.production ]; then
    echo "❌ 错误: .env.production 文件不存在！"
    exit 1
fi

echo "[4/8] 安装依赖..."
npm install --omit=dev --loglevel=error

echo "[5/8] 运行数据库迁移..."
npx prisma migrate deploy

echo "[6/8] 生成 Prisma 客户端..."
npx prisma generate

echo "[7/8] 重启后端服务..."

# 创建生产环境 PM2 配置文件
cat > ecosystem.production.config.js << 'ECOSYSTEM_EOF'
const path = require('path');
const dotenv = require('dotenv');

// Load .env.production
const envConfig = dotenv.config({ path: path.resolve(__dirname, '.env.production') });

if (envConfig.error) {
  console.error('Error loading .env.production:', envConfig.error);
  process.exit(1);
}

module.exports = {
  apps: [{
    name: 'ieclub-backend',
    script: 'src/server.js',
    cwd: '/root/IEclub_dev/ieclub-backend',
    instances: 1,
    exec_mode: 'fork',
    env: envConfig.parsed,
    error_file: '/root/.pm2/logs/ieclub-backend-error.log',
    out_file: '/root/.pm2/logs/ieclub-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false,
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    listen_timeout: 10000
  }]
};
ECOSYSTEM_EOF

# 删除旧进程并启动新进程
pm2 delete ieclub-backend 2>/dev/null || true
pm2 start ecosystem.production.config.js
pm2 save

echo "[8/8] 等待服务启动..."
sleep 5

echo "========================================"
echo "  生产环境后端部署完成"
echo "========================================"
pm2 status
'@
    
    $backendScript -replace "`r`n", "`n" | Out-File -FilePath "deploy-backend-production.sh" -Encoding UTF8 -NoNewline
    
        scp -P $ServerPort "deploy-backend-production.sh" "${ServerUser}@${ServerHost}:/tmp/"
        Remove-Item "deploy-backend-production.sh" -Force
        
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "bash /tmp/deploy-backend-production.sh && rm -f /tmp/deploy-backend-production.sh"
    
    # 健康检查
    Start-Sleep -Seconds 8
    $apiHealthCheckPassed = Test-HealthCheck -Url "https://ieclub.online/api/health" -MaxRetries 6 -RetryDelay 5
    
    if (-not $apiHealthCheckPassed) {
        Write-Error "后端健康检查失败！"
        Write-Host ""
        Write-Info "查看日志: ssh root@ieclub.online 'pm2 logs ieclub-backend --lines 50'"
        exit 1
    }
    
    Write-Success "后端部署完成并通过健康检查"
}

# --- 服务器资源检查 ---
function Check-ServerResources {
    Write-Section "服务器资源检查"
    Write-Info "检查服务器资源状态..."
    
    $checkScript = Join-Path $PSScriptRoot "..\health-check\Check-Server-Resources.ps1"
    if (Test-Path $checkScript) {
        & $checkScript -ServerUser $ServerUser -ServerHost $ServerHost
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "服务器资源检查发现问题"
            Write-Warning "是否继续部署？(Y/N)"
            $continue = Read-Host
            if ($continue -ne 'Y' -and $continue -ne 'y') {
                Write-Info "部署已取消"
                exit 0
            }
        }
    } else {
        Write-Warning "资源检查脚本不存在，跳过检查"
    }
    Write-Host ""
}

# --- Main Execution ---
Write-Section "IEClub 生产环境部署"
Write-Host "🚀 生产环境部署" -ForegroundColor Red
Write-Host "   - 正式环境，影响所有用户" -ForegroundColor Red
Write-Host "   - 部署前请确保已在测试环境验证" -ForegroundColor Red
Write-Host ""
Write-Info "部署目标: $Target"
Write-Info "提交信息: $Message"
Write-Info "服务器: $ServerHost"
Write-Host ""

# 检查服务器资源
Check-ServerResources

# 生产环境需要二次确认
if (-not $SkipConfirmation) {
    Write-Warning "⚠️  您正在部署到生产环境！"
    Write-Host ""
    Write-Host "请输入 'YES' 确认部署（大写）：" -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host
    
    if ($confirmation -ne "YES") {
        Write-Info "部署已取消"
        exit 0
    }
    Write-Success "确认通过，开始部署..."
    Write-Host ""
}

# Git 工作流：develop → main
Sync-ProductionBranch

# 执行部署
switch ($Target) {
    "web" {
        Build-Web-Production
        Deploy-Web-Production
    }
    "admin" {
        Build-Admin-Web-Production
        Deploy-Admin-Web-Production
    }
    "backend" {
        Deploy-Backend-Production
    }
    "all" {
        # 部署所有端
        Build-Web-Production
        Deploy-Web-Production
        
        Build-Admin-Web-Production
        Deploy-Admin-Web-Production
        
        Deploy-Backend-Production
        
        # 显示小程序配置说明
        Write-Section "📱 小程序配置说明"
        Write-Host "小程序需要在微信开发者工具中手动配置：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1️⃣ 打开项目目录: $MiniprogramDir" -ForegroundColor White
        Write-Host ""
        Write-Host "2️⃣ 修改 API 地址（生产环境）:" -ForegroundColor White
        Write-Host "   文件: ieclub-frontend/utils/config.js" -ForegroundColor Gray
        Write-Host "   const API_BASE_URL = 'https://ieclub.online/api'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3️⃣ 在微信开发者工具中:" -ForegroundColor White
        Write-Host "   - 导入项目" -ForegroundColor Gray
        Write-Host "   - AppID: [你的正式 AppID]" -ForegroundColor Gray
        Write-Host "   - 点击「上传」按钮" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4️⃣ 在微信公众平台:" -ForegroundColor White
        Write-Host "   - 登录 mp.weixin.qq.com" -ForegroundColor Gray
        Write-Host "   - 进入「版本管理」" -ForegroundColor Gray
        Write-Host "   - 提交审核并发布" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📝 详细文档: docs/deployment/WECHAT_MINIPROGRAM_GUIDE.md" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Section "🎉 生产环境部署完成"
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host " 生产环境访问地址" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "  📱 用户网页: https://ieclub.online" -ForegroundColor White
Write-Host "  🔧 管理后台: https://ieclub.online/admin" -ForegroundColor White
Write-Host "  🔌 后端API:  https://ieclub.online/api" -ForegroundColor White
Write-Host "  ❤️  健康检查: https://ieclub.online/api/health" -ForegroundColor White
Write-Host "  📱 小程序:   手动配置（见上方说明）" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host " 管理员账号设置" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "首次使用需要初始化管理员账号：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. SSH 登录服务器：" -ForegroundColor White
Write-Host "     ssh root@ieclub.online" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. 进入生产环境目录：" -ForegroundColor White
Write-Host "     cd /root/IEclub_dev/ieclub-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. 初始化管理员：" -ForegroundColor White
Write-Host "     NODE_ENV=production node scripts/init-admin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. 按提示设置管理员账号和密码（建议使用强密码）" -ForegroundColor White
Write-Host ""
Write-Host "  5. 使用管理员账号登录: https://ieclub.online/admin" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host " 用户与管理员区分" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "  👤 普通用户:" -ForegroundColor White
Write-Host "     - 数据库表: User" -ForegroundColor Gray
Write-Host "     - 登录接口: /api/auth/login" -ForegroundColor Gray
Write-Host "     - 使用场景: 小程序、用户网页" -ForegroundColor Gray
Write-Host ""
Write-Host "  👨‍💼 管理员:" -ForegroundColor White
Write-Host "     - 数据库表: Admin" -ForegroundColor Gray
Write-Host "     - 登录接口: /api/admin/auth/login" -ForegroundColor Gray
Write-Host "     - 使用场景: 管理后台网页" -ForegroundColor Gray
Write-Host "     - 初始化方法: node scripts/init-admin.js" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host " 监控和维护" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "  查看后端日志: ssh root@ieclub.online 'pm2 logs ieclub-backend'" -ForegroundColor Gray
Write-Host "  查看服务状态: ssh root@ieclub.online 'pm2 status'" -ForegroundColor Gray
Write-Host "  重启后端服务: ssh root@ieclub.online 'pm2 restart ieclub-backend'" -ForegroundColor Gray
Write-Host "  查看系统资源: ssh root@ieclub.online 'htop'" -ForegroundColor Gray
Write-Host ""

# 返回项目根目录
Set-Location -Path $ProjectRoot
