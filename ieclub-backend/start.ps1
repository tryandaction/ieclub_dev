# IEClub 后端启动脚本 (PowerShell)
# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 启动 IEClub 后端服务..." -ForegroundColor Green

# 检查 Node.js
Write-Host "📋 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装或不在 PATH 中" -ForegroundColor Red
    exit 1
}

# 检查 npm
Write-Host "📋 检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm 未安装或不在 PATH 中" -ForegroundColor Red
    exit 1
}

# 检查环境文件
Write-Host "📋 检查环境配置..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env 文件存在" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env 文件不存在，请确保环境变量已设置" -ForegroundColor Yellow
}

# 检查 package.json
if (Test-Path "package.json") {
    Write-Host "✅ package.json 存在" -ForegroundColor Green
} else {
    Write-Host "❌ package.json 不存在" -ForegroundColor Red
    exit 1
}

# 检查 node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 生成 Prisma Client
Write-Host "🔧 生成 Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma Client 生成失败" -ForegroundColor Red
    exit 1
}

# 检查端口是否被占用
$port = 3000
Write-Host "🔍 检查端口 $port..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "⚠️  端口 $port 被占用，正在停止相关进程..." -ForegroundColor Yellow
    $process | ForEach-Object {
        $processId = $_.OwningProcess
        try {
            Stop-Process -Id $processId -Force
            Write-Host "✅ 已停止进程 $processId" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  无法停止进程 $processId" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Seconds 2
}

# 启动服务
Write-Host "🚀 启动服务..." -ForegroundColor Green
Write-Host "📍 监听端口: $port" -ForegroundColor Cyan
Write-Host "🔗 API 地址: http://localhost:$port/api" -ForegroundColor Cyan
Write-Host "💊 健康检查: http://localhost:$port/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
Write-Host ""

# 启动服务器
node src/server.js
