# ==========================================================
# IEClub 双端一键部署脚本 v3.0
# ==========================================================
#
# 功能: 一条命令部署网页 + 小程序 + 后端
#
# 使用方法: 
#   .\一键部署.ps1 -Target "all"        # 部署网页 + 小程序 + 后端
#   .\一键部署.ps1 -Target "web"        # 仅部署网页
#   .\一键部署.ps1 -Target "weapp"      # 仅构建小程序
#   .\一键部署.ps1 -Target "backend"    # 仅部署后端
#
# v3.0 更新 (2025-10-29):
#   - 支持 React 网页版（ieclub-web）
#   - 支持原生微信小程序（ieclub-taro）
#   - 统一后端部署（ieclub-backend）
#   - 双端代码同步部署
# ==========================================================

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "web", "weapp", "backend")]
    [string]$Target = "all",
    
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = "部署更新"
)

# --- 配置 ---
$ProjectRoot = $PSScriptRoot
$WebDir = "${ProjectRoot}\ieclub-web"
$WeappDir = "${ProjectRoot}\ieclub-taro"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteProjectPath = "/root/IEclub_dev"

# --- 美化输出函数 ---
function Write-Title {
    param ([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param ([string]$Message)
    Write-Host "🔧 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param ([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param ([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param ([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor White
}

# --- 步骤函数 ---

# Git 提交和推送
function Invoke-GitPush {
    Write-Step "提交代码到 Git..."
    Set-Location -Path $ProjectRoot
    
    git add .
    $status = git status --porcelain
    
    if ($status) {
        git commit -m $CommitMessage
        git push origin main
        Write-Success "代码提交并推送成功"
    } else {
        Write-Info "没有需要提交的更改"
    }
}

# 部署网页版
function Deploy-Web {
    Write-Title "部署网页版 (React)"
    
    Set-Location -Path $WebDir
    
    # 检查依赖
    if (-not (Test-Path "node_modules")) {
        Write-Step "安装网页版依赖..."
        npm install
        if ($LASTEXITCODE -ne 0) { 
            Write-Error "依赖安装失败"
            exit 1 
        }
    }
    
    # 构建网页
    Write-Step "构建网页版..."
    if (Test-Path "dist") { Remove-Item -Path "dist" -Recurse -Force }
    
    npm run build
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "网页构建失败"
        exit 1 
    }
    Write-Success "网页构建完成"
    
    # 打包
    Write-Step "打包网页构建产物..."
    $ZipPath = "${WebDir}\dist.zip"
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    
    Compress-Archive -Path "${WebDir}\dist\*" -DestinationPath $ZipPath -Force
    Write-Success "网页打包完成"
    
    # 上传到服务器
    Write-Step "上传网页到服务器..."
    scp "$ZipPath" "${ServerUser}@${ServerIP}:/tmp/web-dist.zip"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "网页上传失败"
        exit 1 
    }
    
    # 上传源码
    Write-Step "上传网页源码..."
    scp -r "$WebDir\src" "$WebDir\public" "$WebDir\package.json" "$WebDir\vite.config.js" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-web/"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "网页源码上传失败"
        exit 1 
    }
    
    Write-Success "网页版部署完成"
}

# 构建小程序版
function Build-Weapp {
    Write-Title "构建微信小程序"
    
    Set-Location -Path $WeappDir
    
    # 检查依赖
    if (-not (Test-Path "node_modules")) {
        Write-Step "安装小程序依赖..."
        npm install
        if ($LASTEXITCODE -ne 0) { 
            Write-Error "依赖安装失败"
            exit 1 
        }
    }
    
    # 清理旧构建
    Write-Step "清理旧的构建产物..."
    if (Test-Path "dist") { Remove-Item -Path "dist" -Recurse -Force }
    
    # 检查是否有 app.json（原生小程序配置）
    if (Test-Path "app.json") {
        Write-Info "检测到原生微信小程序项目"
        Write-Info "小程序已准备就绪，请打开微信开发者工具预览和上传"
        Write-Info "项目路径: $WeappDir"
    } else {
        Write-Error "未找到小程序配置文件 app.json"
        exit 1
    }
    
    Write-Success "小程序构建完成"
    Write-Info ""
    Write-Info "下一步操作："
    Write-Info "1. 打开微信开发者工具"
    Write-Info "2. 导入项目: $WeappDir"
    Write-Info "3. 预览和上传代码"
}

# 部署后端
function Deploy-Backend {
    Write-Title "部署后端服务"
    
    Set-Location -Path $BackendDir
    
    # 检查 .env 文件
    if (-not (Test-Path ".env")) {
        Write-Error ".env 文件不存在！"
        Write-Info "请先创建 .env 文件或复制 .env.example"
        exit 1
    }
    
    # 上传后端代码
    Write-Step "上传后端源码..."
    scp -r "$BackendDir\src" "$BackendDir\prisma" "$BackendDir\scripts" "$BackendDir\package.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-backend/"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "后端代码上传失败"
        exit 1 
    }
    
    # 上传 .env（如果需要）
    Write-Step "上传环境配置..."
    scp "$BackendDir\.env" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-backend/.env"
    
    Write-Success "后端代码上传完成"
}

# 服务器端部署
function Invoke-ServerDeploy {
    param ([string]$DeployTarget)
    
    Write-Title "在服务器上执行部署"
    
    # 上传新的部署脚本
    Write-Step "上传部署脚本..."
    scp "$ProjectRoot\deploy-server.sh" "${ServerUser}@${ServerIP}:/root/"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "部署脚本上传失败"
        exit 1 
    }
    
    # 执行部署
    Write-Step "执行服务器端部署..."
    ssh "${ServerUser}@${ServerIP}" "chmod +x /root/deploy-server.sh; bash /root/deploy-server.sh $DeployTarget"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "服务器部署失败"
        exit 1 
    }
    
    Write-Success "服务器部署完成"
}

# --- 主流程 ---

Write-Title "🚀 IEClub 双端一键部署开始"
Write-Info "部署目标: $Target"
Write-Info "提交信息: $CommitMessage"

try {
    # Git 提交（可选）
    if ($Target -ne "weapp") {
        Invoke-GitPush
    }
    
    # 根据目标执行部署
    switch ($Target) {
        "all" {
            Deploy-Web
            Build-Weapp
            Deploy-Backend
            Invoke-ServerDeploy "all"
        }
        "web" {
            Deploy-Web
            Invoke-ServerDeploy "web"
        }
        "weapp" {
            Build-Weapp
        }
        "backend" {
            Deploy-Backend
            Invoke-ServerDeploy "backend"
        }
    }
    
    # 完成提示
    Write-Title "🎉 部署完成"
    
    if ($Target -eq "all" -or $Target -eq "web") {
        Write-Success "✅ 网页版已部署"
        Write-Info "   访问: https://ieclub.online"
    }
    
    if ($Target -eq "all" -or $Target -eq "weapp") {
        Write-Success "✅ 小程序已构建"
        Write-Info "   打开微信开发者工具: $WeappDir"
    }
    
    if ($Target -eq "all" -or $Target -eq "backend") {
        Write-Success "✅ 后端已部署"
        Write-Info "   API: https://ieclub.online/api"
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    
} catch {
    Write-Error "部署过程出错: $_"
    exit 1
}

