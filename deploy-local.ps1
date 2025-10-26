# ==========================================================
# IEClub 一键部署脚本 (v2.0)
# ==========================================================
#
# 功能: 提交代码、构建、上传、部署 - 一条命令完成所有事情！
#
# 使用方法: ./deploy-local.ps1 -commitMessage "你的提交信息"
#
# v2.0 更新 (2025-10-26):
#   - 一键完成：本地构建 + 上传代码 + 服务器部署
#   - 自动上传前后端代码到服务器
#   - 自动在服务器上执行部署脚本
# ==========================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

# --- 配置 ---
$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
$FrontendDir = "${ProjectRoot}\ieclub-taro"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteProjectPath = "/root/IEclub_dev"
$RemoteTempPath = "/tmp/dist.zip"

function Write-Log { param ([string]$Message, [string]$Color = "White"); Write-Host "[LOG] $Message" -ForegroundColor $Color }

Write-Log "🚀 IEClub 一键部署开始..." -Color Cyan

# --- 步骤 1: Git 推送 ---
Write-Log "➡️  步骤 1/5: 提交代码到 Git..." -Color Yellow
Set-Location -Path $ProjectRoot
git add .
git commit -m $commitMessage
git push origin main
Write-Log "✅ 代码提交完成。" -Color Green

# --- 步骤 2: 构建 H5 应用 ---
Write-Log "➡️  步骤 2/5: 构建 H5 应用..." -Color Yellow
Set-Location -Path $FrontendDir
Write-Log "  - 清理旧的构建产物..."
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

npm run build:h5
if ($LASTEXITCODE -ne 0) { Write-Log "❌ H5 构建失败！" -Color Red; exit 1 }
Write-Log "✅ H5 构建完成。本地 'dist' 目录现在是 H5 版本。" -Color Green

# --- 步骤 3: 上传前端代码到服务器 ---
Write-Log "➡️  步骤 3/5: 上传前端代码到服务器..." -Color Yellow

# 排除 node_modules 和其他不需要的文件
Write-Log "  - 上传前端源码 (排除 node_modules)..."
scp -r "$FrontendDir\src" "$FrontendDir\config" "$FrontendDir\package.json" "$FrontendDir\package-lock.json" "$FrontendDir\project.config.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-taro/"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 前端代码上传失败！" -Color Red; exit 1 }
Write-Log "✅ 前端代码上传成功。" -Color Green

# --- 步骤 4: 上传后端代码到服务器 ---
Write-Log "➡️  步骤 4/5: 上传后端代码到服务器..." -Color Yellow

Write-Log "  - 上传后端源码 (排除 node_modules 和敏感文件)..."
scp -r "$BackendDir\src" "$BackendDir\prisma" "$BackendDir\scripts" "$BackendDir\package.json" "$BackendDir\package-lock.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-backend/"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 后端代码上传失败！" -Color Red; exit 1 }
Write-Log "✅ 后端代码上传成功。" -Color Green

# --- 步骤 5: 在服务器上执行部署 ---
Write-Log "➡️  步骤 5/5: 在服务器上执行部署..." -Color Yellow

# 上传部署脚本
Write-Log "  - 上传部署脚本..."
scp "$ProjectRoot\deploy-master.sh" "${ServerUser}@${ServerIP}:/root/"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 部署脚本上传失败！" -Color Red; exit 1 }

# 执行部署
Write-Log "  - 执行服务器端部署..."
ssh "${ServerUser}@${ServerIP}" "chmod +x /root/deploy-master.sh; bash /root/deploy-master.sh all"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 服务器部署失败！" -Color Red; exit 1 }

Write-Log "✅ 服务器部署完成。" -Color Green

Write-Log "🎉🎉🎉 一键部署全部完成！" -Color Cyan
Write-Log "访问: https://ieclub.online" -Color Yellow