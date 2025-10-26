# ==========================================================
# IEClub H5 网站部署 - 本地脚本 (v1.0)
# ==========================================================
#
# 功能: 提交代码、构建H5、打包并上传到服务器。
#
# 使用方法: ./deploy-local.ps1 -commitMessage "你的提交信息"
# ==========================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

# --- 配置 ---
$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
$FrontendDir = "${ProjectRoot}\ieclub-taro"
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteTempPath = "/tmp/dist.zip"

function Write-Log { param ([string]$Message, [string]$Color = "White"); Write-Host "[LOG] $Message" -ForegroundColor $Color }

Write-Log "🚀 开始 H5 网站部署的本地流程..." -Color Cyan

# --- 步骤 1: Git 推送 ---
Write-Log "➡️  步骤 1/3: 提交代码到 Git..." -Color Yellow
Set-Location -Path $ProjectRoot
git add .
git commit -m $commitMessage
git push origin main
Write-Log "✅ 代码提交完成。" -Color Green

# --- 步骤 2: 构建 H5 应用 ---
Write-Log "➡️  步骤 2/3: 构建 H5 应用..." -Color Yellow
Set-Location -Path $FrontendDir
Write-Log "  - 清理旧的构建产物..."
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

npm run build:h5
if ($LASTEXITCODE -ne 0) { Write-Log "❌ H5 构建失败！" -Color Red; exit 1 }
Write-Log "✅ H5 构建完成。本地 'dist' 目录现在是 H5 版本。" -Color Green

# --- 步骤 3: 打包并上传 ---
Write-Log "➡️  步骤 3/3: 打包并上传 H5 文件..." -Color Yellow
Compress-Archive -Path "$FrontendDir\dist" -DestinationPath "$FrontendDir\dist.zip" -Force
scp "$FrontendDir\dist.zip" "${ServerUser}@${ServerIP}:${RemoteTempPath}"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 文件上传失败！" -Color Red; exit 1 }
Write-Log "✅ 文件上传成功。" -Color Green

Write-Log "🎉🎉🎉 H5 本地流程已全部完成！" -Color Cyan
Write-Log "下一步：请登录服务器并运行 ./deploy-server.sh frontend" -Color Yellow