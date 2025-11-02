# start-dev.ps1 - IEClub 开发环境一键启动脚本

Write-Host "🚀 IEClub 开发环境启动脚本" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. 检查 Docker
Write-Host "1️⃣  检查 Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker 已安装: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker 未安装或未启动" -ForegroundColor Red
    Write-Host "   请安装 Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# 2. 启动数据库
Write-Host "`n2️⃣  启动 MySQL 数据库..." -ForegroundColor Yellow
Set-Location ieclub-backend

$mysqlRunning = docker-compose ps mysql | Select-String "Up"
if ($mysqlRunning) {
    Write-Host "✅ MySQL 已在运行" -ForegroundColor Green
} else {
    Write-Host "   正在启动 MySQL..." -ForegroundColor Cyan
    docker-compose up -d mysql
    Write-Host "   等待 MySQL 启动（15秒）..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
    Write-Host "✅ MySQL 启动完成" -ForegroundColor Green
}

# 3. 检查环境变量
Write-Host "`n3️⃣  检查环境变量..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env 文件存在" -ForegroundColor Green
} else {
    Write-Host "❌ .env 文件不存在" -ForegroundColor Red
    Write-Host "   请复制 .env.example 并配置" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ 已创建 .env 文件，请编辑配置" -ForegroundColor Green
    }
}

# 4. 初始化数据库（首次运行）
Write-Host "`n4️⃣  检查数据库状态..." -ForegroundColor Yellow
try {
    node check-backend.js 2>&1 | Out-Null
    $checkResult = $LASTEXITCODE
    if ($checkResult -eq 0) {
        Write-Host "✅ 数据库已初始化" -ForegroundColor Green
    } else {
        Write-Host "⚠️  数据库未初始化，正在初始化..." -ForegroundColor Yellow
        npm run prisma:push
        Write-Host "✅ 数据库初始化完成" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  无法检查数据库状态，尝试初始化..." -ForegroundColor Yellow
    npm run prisma:push
}

# 5. 启动后端
Write-Host "`n5️⃣  启动后端服务..." -ForegroundColor Yellow
Write-Host "   后端将在 http://localhost:3000 运行" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
Start-Sleep -Seconds 3

# 6. 启动前端
Write-Host "`n6️⃣  启动前端服务..." -ForegroundColor Yellow
Set-Location ../ieclub-web
Write-Host "   前端将在 http://localhost:10086 运行" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# 完成
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🎉 启动完成！" -ForegroundColor Green
Write-Host "`n📱 访问地址:" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:10086" -ForegroundColor White
Write-Host "   后端: http://localhost:3000" -ForegroundColor White
Write-Host "   API健康检查: http://localhost:3000/health" -ForegroundColor White
Write-Host "   Prisma Studio: npx prisma studio" -ForegroundColor White
Write-Host "`n⚠️  注意: 两个 PowerShell 窗口已打开，请勿关闭" -ForegroundColor Yellow
Write-Host "   按 Ctrl+C 可停止服务" -ForegroundColor Yellow
Write-Host "`n================================`n" -ForegroundColor Cyan

