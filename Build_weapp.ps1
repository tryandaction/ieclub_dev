# ==========================================================
# IEClub 微信小程�?- 本地构建脚本 (v1.0)
# ==========================================================
#
# 功能: 提交代码，然后清理并构建小程序版本�?
#       运行完毕后，请手动打开微信开发者工具进行后续操作�?
#
# 使用方法: ./build-weapp-local.ps1 -commitMessage "你的提交信息"
# ==========================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

# --- 配置 ---
$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
$FrontendDir = "${ProjectRoot}\ieclub-frontend"

function Write-Log { param ([string]$Message, [string]$Color = "White"); Write-Host "[LOG] $Message" -ForegroundColor $Color }

Write-Log "🚀 开始微信小程序的本地构建流�?.." -Color Cyan

# --- 步骤 1: Git 推�?(如果两个脚本都用，这步可能会重复，但安全) ---
#Write-Log "➡️  步骤 1/2: 提交代码�?Git..." -Color Yellow
#Set-Location -Path $ProjectRoot
#git add .
#git commit -m $commitMessage
#git push origin main
#Write-Log "�?代码提交完成�? -Color Green

# --- 步骤 2: 构建小程序应�?---
Write-Log "➡️  步骤 2/2: 构建小程序应�?.." -Color Yellow
Set-Location -Path $FrontendDir
Write-Log "  - 清理旧的构建产物..."
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

npm run build:weapp:prod
if ($LASTEXITCODE -ne 0) { Write-Log "�?小程序构建失败！" -Color Red; exit 1 }
Write-Log "�?小程序构建完成�? -Color Green

Write-Log "🎉🎉🎉 小程序本地构建流程已全部完成�? -Color Cyan
Write-Log "下一步：请打开微信开发者工具导入项�? ieclub-frontend" -Color Yellow
