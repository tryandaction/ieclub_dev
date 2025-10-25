# ==========================================================
# IEClub 本地打包上传脚本 (在 Windows PowerShell 运行)
# ==========================================================
#
# 功能:
# 1. 自动提交代码到 Git。
# 2. 彻底清理并构建 H5 前端。
# 3. 规范地打包并上传到服务器。
#
# 使用方法:
# cd C:\universe\GitHub_try\IEclub_dev
# ./deploy-local.ps1 -commitMessage "up1"
# 服务器部署脚本: deploy-server.sh
# # 如果这次只更新了后端，不更新网站
#./deploy-server.sh

# 如果这次既更新了后端，也要更新网站
#./deploy-server.sh frontend
# ==========================================================

# --- 脚本参数定义 ---
param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

# --- 本地环境变量配置 ---
$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
# ==================== ✨ 核心修复在这里 ✨ ====================
# 使用 ${...} 的方式来安全地拼接路径，防止解析错误
$FrontendDir = "${ProjectRoot}\ieclub-taro"
# ===============================================================
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteTempPath = "/tmp/dist.zip"

# --- 函数：打印信息 ---
function Write-Log {
    param ([string]$Message, [string]$Color = "White")
    Write-Host "[LOG] $Message" -ForegroundColor $Color
}

# --- 脚本开始 ---
Write-Log "🚀 开始执行 IEClub 本地打包上传流程..." -Color Cyan

# --- 步骤 1: Git 推送 ---
Write-Log "➡️  步骤 1/3: 正在提交代码到 Git..." -Color Yellow
Set-Location -Path $ProjectRoot
git add .
git commit -m $commitMessage
git checkout main
git push origin main
Write-Log "✅ 代码提交完成。" -Color Green

# --- 步骤 2: 构建前端 H5 ---
Write-Log "➡️  步骤 2/3: 正在构建前端 H5 应用..." -Color Yellow
Set-Location -Path $FrontendDir

# 彻底清理环境
Write-Log "  - 清理旧的构建产物..."
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }
if (Test-Path -Path "dist.zip") { Remove-Item -Path "dist.zip" -Force }

# 构建 H5 版本
npm run build:h5
if ($LASTEXITCODE -ne 0) {
    Write-Log "❌ 前端构建失败！请检查错误信息。" -Color Red
    exit 1
}
Write-Log "✅ 前端构建完成。" -Color Green

# --- 步骤 3: 打包并上传 ---
Write-Log "➡️  步骤 3/3: 正在打包并上传前端文件..." -Color Yellow
Compress-Archive -Path "$FrontendDir\dist" -DestinationPath "$FrontendDir\dist.zip" -Force

# 使用 SCP 上传
scp "$FrontendDir\dist.zip" "${ServerUser}@${ServerIP}:${RemoteTempPath}"
if ($LASTEXITCODE -ne 0) {
    Write-Log "❌ 文件上传失败！请检查网络或密码。" -Color Red
    exit 1
}
Write-Log "✅ 文件上传成功。" -Color Green

# --- 结束 ---
Write-Log "🎉🎉🎉 本地流程已全部完成！" -Color Cyan
Write-Log "下一步：请登录服务器并运行部署脚本。" -Color Yellow