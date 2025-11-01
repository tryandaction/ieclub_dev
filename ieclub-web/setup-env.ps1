# IEClub Web 环境配置设置脚本
# 用于快速创建 .env.development 和 .env.production 文件

Write-Host "🚀 IEClub Web 环境配置设置" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误: 请在 ieclub-web 目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 创建 .env.development
Write-Host "📝 创建 .env.development..." -ForegroundColor Yellow
$devEnv = @"
# 开发环境配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
VITE_WS_URL=ws://localhost:3000
"@

$devEnv | Out-File -FilePath ".env.development" -Encoding UTF8 -NoNewline
Write-Host "✅ .env.development 创建成功" -ForegroundColor Green

# 创建 .env.production
Write-Host "📝 创建 .env.production..." -ForegroundColor Yellow
$prodEnv = @"
# 生产环境配置
VITE_API_BASE_URL=https://ieclub.online/api
VITE_APP_ENV=production
VITE_WS_URL=wss://ieclub.online
"@

$prodEnv | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline
Write-Host "✅ .env.production 创建成功" -ForegroundColor Green

# 创建 .env.example
Write-Host "📝 创建 .env.example..." -ForegroundColor Yellow
$exampleEnv = @"
# 环境配置示例文件
# 复制此文件为 .env.development 或 .env.production 并填写实际值

# API 基础地址
VITE_API_BASE_URL=https://ieclub.online/api

# 运行环境
VITE_APP_ENV=production

# WebSocket 地址
VITE_WS_URL=wss://ieclub.online
"@

$exampleEnv | Out-File -FilePath ".env.example" -Encoding UTF8 -NoNewline
Write-Host "✅ .env.example 创建成功" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ 所有环境配置文件已创建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📁 创建的文件:" -ForegroundColor Cyan
Write-Host "  - .env.development  (开发环境)" -ForegroundColor White
Write-Host "  - .env.production   (生产环境)" -ForegroundColor White
Write-Host "  - .env.example      (配置模板)" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "  - 开发时运行 'npm run dev' 会自动使用 .env.development" -ForegroundColor White
Write-Host "  - 构建时运行 'npm run build' 会自动使用 .env.production" -ForegroundColor White
Write-Host "  - 如需修改配置，请编辑对应的 .env 文件" -ForegroundColor White
Write-Host ""

