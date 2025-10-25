# IEClub Taro 快速启动脚本 (PowerShell)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  IEClub Taro 开发环境启动" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了pnpm
$pnpmVersion = pnpm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误: 未找到pnpm" -ForegroundColor Red
    Write-Host "请先安装pnpm: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 检测到 pnpm 版本: $pnpmVersion" -ForegroundColor Green
Write-Host ""

# 检查node_modules是否存在
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 显示启动选项
Write-Host "请选择启动模式:" -ForegroundColor Cyan
Write-Host "  [1] H5 开发模式 (推荐，快速调试)" -ForegroundColor White
Write-Host "  [2] 微信小程序模式" -ForegroundColor White
Write-Host "  [3] 支付宝小程序模式" -ForegroundColor White
Write-Host "  [4] 构建生产版本" -ForegroundColor White
Write-Host "  [5] 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 启动 H5 开发服务器..." -ForegroundColor Green
        Write-Host "访问地址: http://localhost:10086" -ForegroundColor Yellow
        Write-Host ""
        pnpm dev:h5
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 编译到微信小程序..." -ForegroundColor Green
        Write-Host "请在微信开发者工具中打开 dist 目录" -ForegroundColor Yellow
        Write-Host ""
        pnpm dev:weapp
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 编译到支付宝小程序..." -ForegroundColor Green
        Write-Host ""
        pnpm dev:alipay
    }
    "4" {
        Write-Host ""
        Write-Host "🏗️  构建生产版本..." -ForegroundColor Green
        Write-Host ""
        pnpm build:h5
    }
    "5" {
        Write-Host "👋 再见!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "❌ 无效的选项" -ForegroundColor Red
        exit 1
    }
}

