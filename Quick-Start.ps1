# Quick-Start.ps1 - IEClub 快速启动脚本
# 用途：自动检测环境并启动开发服务器

param(
    [switch]$SkipDatabase,
    [switch]$UseDocker,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
🚀 IEClub 快速启动脚本

用法:
  .\Quick-Start.ps1              # 自动检测并启动
  .\Quick-Start.ps1 -UseDocker   # 强制使用 Docker
  .\Quick-Start.ps1 -SkipDatabase # 跳过数据库检查（仅启动服务）

说明:
  - 自动检测 Docker 是否可用
  - 启动 MySQL 和 Redis（如果需要）
  - 启动后端和前端开发服务器
  - 在浏览器中打开应用

"@
    exit 0
}

$ErrorActionPreference = "Stop"

Write-Host "🚀 IEClub 快速启动" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Cyan

# 检查 Node.js
Write-Host "1️⃣  检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    Write-Host "   请安装 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 检查数据库
if (-not $SkipDatabase) {
    Write-Host "`n2️⃣  检查数据库..." -ForegroundColor Yellow
    
    # 检查 Docker
    $dockerAvailable = $false
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerAvailable = $true
            Write-Host "✅ Docker 可用: $dockerVersion" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Docker 不可用" -ForegroundColor Yellow
    }
    
    if ($UseDocker -or $dockerAvailable) {
        Write-Host "   使用 Docker 启动数据库..." -ForegroundColor Cyan
        
        Push-Location ieclub-backend
        try {
            # 检查容器是否已运行
            $mysqlRunning = docker ps --filter "name=ieclub_mysql" --filter "status=running" --format "{{.Names}}"
            
            if ($mysqlRunning) {
                Write-Host "✅ MySQL 已在运行" -ForegroundColor Green
            } else {
                Write-Host "   启动 MySQL 和 Redis..." -ForegroundColor Cyan
                docker-compose up -d mysql redis
                
                Write-Host "   等待数据库启动（15秒）..." -ForegroundColor Cyan
                Start-Sleep -Seconds 15
                
                Write-Host "✅ 数据库启动完成" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Docker 启动失败: $_" -ForegroundColor Red
            Write-Host "   请查看 DATABASE_SETUP.md 了解其他方案" -ForegroundColor Yellow
            Pop-Location
            exit 1
        }
        Pop-Location
    } else {
        Write-Host "⚠️  未检测到 Docker" -ForegroundColor Yellow
        Write-Host "   请确保 MySQL 已安装并运行在 localhost:3306" -ForegroundColor Yellow
        Write-Host "   或查看 DATABASE_SETUP.md 了解安装方法" -ForegroundColor Yellow
        
        # 检查本地 MySQL
        $mysqlRunning = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($mysqlRunning) {
            Write-Host "✅ 检测到 MySQL 服务" -ForegroundColor Green
        } else {
            Write-Host "❌ MySQL 未运行" -ForegroundColor Red
            Write-Host "`n📖 请查看 DATABASE_SETUP.md 了解如何启动数据库" -ForegroundColor Cyan
            
            $response = Read-Host "`n是否继续启动（数据库功能将不可用）？(y/N)"
            if ($response -ne "y" -and $response -ne "Y") {
                exit 1
            }
        }
    }
}

# 检查依赖
Write-Host "`n3️⃣  检查项目依赖..." -ForegroundColor Yellow

# 后端依赖
if (-not (Test-Path "ieclub-backend/node_modules")) {
    Write-Host "   安装后端依赖..." -ForegroundColor Cyan
    Push-Location ieclub-backend
    npm install
    Pop-Location
    Write-Host "✅ 后端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✅ 后端依赖已安装" -ForegroundColor Green
}

# 前端依赖
if (-not (Test-Path "ieclub-web/node_modules")) {
    Write-Host "   安装前端依赖..." -ForegroundColor Cyan
    Push-Location ieclub-web
    npm install
    Pop-Location
    Write-Host "✅ 前端依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✅ 前端依赖已安装" -ForegroundColor Green
}

# 启动服务
Write-Host "`n4️⃣  启动开发服务器..." -ForegroundColor Yellow

# 启动后端
Write-Host "   启动后端服务..." -ForegroundColor Cyan
Push-Location ieclub-backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm start
}
Pop-Location

Start-Sleep -Seconds 3

# 启动前端
Write-Host "   启动前端服务..." -ForegroundColor Cyan
Push-Location ieclub-web
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}
Pop-Location

Start-Sleep -Seconds 3

# 显示状态
Write-Host "`n✅ 服务启动完成！" -ForegroundColor Green
Write-Host "`n📍 访问地址:" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:5173" -ForegroundColor White
Write-Host "   后端: http://localhost:3000" -ForegroundColor White
Write-Host "   健康检查: http://localhost:3000/health" -ForegroundColor White

Write-Host "`n📝 查看日志:" -ForegroundColor Cyan
Write-Host "   后端: Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "   前端: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor White

Write-Host "`n🛑 停止服务:" -ForegroundColor Cyan
Write-Host "   Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White
Write-Host "   Remove-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White

# 等待几秒后打开浏览器
Start-Sleep -Seconds 5
Write-Host "`n🌐 正在打开浏览器..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`n✨ 开发环境已就绪！按 Ctrl+C 退出" -ForegroundColor Green
Write-Host "   (注意：退出后需要手动停止后台任务)`n" -ForegroundColor Yellow

# 持续显示日志
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # 检查任务状态
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ 后端服务异常" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ 前端服务异常" -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
            break
        }
    }
} finally {
    Write-Host "`n🛑 正在停止服务..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id,$frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id,$frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "✅ 服务已停止" -ForegroundColor Green
}

