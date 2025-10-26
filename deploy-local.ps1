# ==========================================================
# IEClub H5 网站部署 - 本地脚本 (v1.1)
# ==========================================================
#
# 功能: 提交代码、构建H5、打包并上传到服务器。
#
# 使用方法: ./deploy-local.ps1 -commitMessage "你的提交信息"
#
# v1.1 更新 (2025-10-26):
#   - 修复目录结构问题：自动将 dist/ 调整为 dist/h5/ 格式
#   - 服务器端脚本期望 h5 子目录，现在本地打包时自动处理
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

# --- 步骤 3: 调整目录结构并打包上传 ---
Write-Log "➡️  步骤 3/3: 调整目录结构并打包上传 H5 文件..." -Color Yellow

# 创建符合服务器期望的目录结构 dist/h5/
$TempDistPath = "$FrontendDir\temp_dist"
$H5Path = "$TempDistPath\h5"

Write-Log "  - 创建临时目录结构..."
if (Test-Path -Path $TempDistPath) { Remove-Item -Path $TempDistPath -Recurse -Force }
New-Item -Path $H5Path -ItemType Directory -Force | Out-Null

# 将构建产物移动到 h5 子目录
Write-Log "  - 复制构建产物到 h5 子目录..."
Copy-Item -Path "$FrontendDir\dist\*" -Destination $H5Path -Recurse -Force

# 打包 (只打包 h5 目录)
Write-Log "  - 打包文件..."
Compress-Archive -Path "$H5Path" -DestinationPath "$FrontendDir\dist.zip" -Force

# 清理临时目录
Remove-Item -Path $TempDistPath -Recurse -Force

# 上传
Write-Log "  - 上传到服务器..."
scp "$FrontendDir\dist.zip" "${ServerUser}@${ServerIP}:${RemoteTempPath}"
if ($LASTEXITCODE -ne 0) { Write-Log "❌ 文件上传失败！" -Color Red; exit 1 }
Write-Log "✅ 文件上传成功。" -Color Green

Write-Log "🎉🎉🎉 H5 本地流程已全部完成！" -Color Cyan
Write-Log "下一步：请登录服务器并运行 ./deploy-server.sh frontend" -Color Yellow