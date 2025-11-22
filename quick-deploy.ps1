#!/usr/bin/env pwsh
# ================================================================
# 快速部署脚本 - Git提交后立即部署
# ================================================================
#
# 使用方法：
#   .\quick-deploy.ps1 "提交信息"
#
# 功能：
#   1. Git add + commit + push
#   2. 立即部署到生产环境（使用极简安全检查）
#
# ================================================================

param(
    [string]$Message = "更新",
    [ValidateSet("web", "all")]
    [string]$Target = "all"
)

# 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 快速部署流程开始..." -ForegroundColor Cyan
Write-Host ""

# 步骤1: Git提交
Write-Host "📦 [1/2] Git提交..." -ForegroundColor Yellow
Write-Host ""

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ git add 失败" -ForegroundColor Red
    exit 1
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  没有需要提交的更改，或提交失败" -ForegroundColor Yellow
}

git push origin develop
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ git push 失败" -ForegroundColor Red
    Write-Host "提示：检查网络连接或使用 -SkipGitPush 参数" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git提交完成" -ForegroundColor Green
Write-Host ""

# 步骤2: 部署到生产环境
Write-Host "🚀 [2/2] 部署到生产环境..." -ForegroundColor Yellow
Write-Host ""

# 进入部署脚本目录
cd scripts\deployment

# 使用极简安全检查，避免触发网络安全策略
.\Deploy-Production.ps1 `
    -Target $Target `
    -Message $Message `
    -MinimalHealthCheck `
    -SkipGitPush `
    -SkipConfirmation

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 部署失败" -ForegroundColor Red
    cd ..\..
    exit 1
}

cd ..\..

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  🎉 部署完成！" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  📱 用户网页: https://ieclub.online" -ForegroundColor White
Write-Host "  🔧 管理后台: https://ieclub.online/admin" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  重要提示：" -ForegroundColor Yellow
Write-Host "  1. 清除浏览器缓存（Ctrl+Shift+Delete）" -ForegroundColor White
Write-Host "  2. 强制刷新页面（Ctrl+Shift+R）" -ForegroundColor White
Write-Host ""
