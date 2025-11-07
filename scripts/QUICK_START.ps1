# IE Club - 一键启动脚本
# 自动检测并启动项目

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   IE Club - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否安装
$dockerInstalled = $false
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerInstalled = $true
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
}

Write-Host ""

# 检查 MySQL 是否运行
$mysqlRunning = $false
$mysqlCheck = netstat -ano | findstr ":3306"
if ($mysqlCheck) {
    $mysqlRunning = $true
    Write-Host "✅ MySQL is running on port 3306" -ForegroundColor Green
} else {
    Write-Host "❌ MySQL is not running on port 3306" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 决定使用哪种方式启动
if ($dockerInstalled) {
    Write-Host "🐳 Docker detected! Using Docker setup..." -ForegroundColor Cyan
    Write-Host ""
    
    # 进入后端目录
    Set-Location ieclub-backend
    
    # 检查 .env 文件
    if (-not (Test-Path ".env")) {
        Write-Host "⚙️  Setting up environment..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Running setup script..." -ForegroundColor White
        Write-Host ""
        
        # 自动创建 Docker 配置的 .env
        $envContent = @"
DATABASE_URL="mysql://ieclub_user:ieclub_user_pass@localhost:3306/ieclub"
MYSQL_ROOT_PASSWORD=ieclub_root_pass
MYSQL_PASSWORD=ieclub_user_pass
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
NODE_ENV=development
PORT=3000
JWT_SECRET=dev_jwt_secret_key_min_32_characters_long_change_in_prod
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_min_32_characters_long_change_in_prod
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
WECHAT_APPID=
WECHAT_SECRET=
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
LOG_LEVEL=info
LOG_DIR=./logs
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=300
CACHE_ENABLED=true
"@
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ Environment configured" -ForegroundColor Green
        Write-Host ""
    }
    
    # 检查 Docker Desktop 是否运行
    Write-Host "Checking Docker Desktop..." -ForegroundColor Yellow
    $dockerRunning = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "1. Open Docker Desktop" -ForegroundColor White
        Write-Host "2. Wait for it to start (icon turns green)" -ForegroundColor White
        Write-Host "3. Run this script again" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    Write-Host ""
    
    # 只启动 MySQL 和 Redis（不启动后端容器）
    Write-Host "🚀 Starting MySQL and Redis with Docker..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    
    docker-compose up -d mysql redis
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   Database Services Started!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Waiting for MySQL to initialize (this may take 30-60 seconds)..." -ForegroundColor Yellow
        Write-Host "Please be patient..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host ""
        Write-Host "Service Status:" -ForegroundColor Cyan
        docker-compose ps
        
        Write-Host ""
        Write-Host "✅ MySQL: localhost:3306" -ForegroundColor Green
        Write-Host "✅ Redis: localhost:6379" -ForegroundColor Green
        Write-Host ""
        
        # 检查依赖
        if (-not (Test-Path "node_modules")) {
            Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
            npm install
            Write-Host ""
        }
        
        # 运行数据库迁移
        Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
        Write-Host ""
        
        # 启动后端服务
        Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ Backend will start at: http://localhost:3000" -ForegroundColor Green
        Write-Host "✅ Health Check: http://localhost:3000/api/health" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the backend" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To stop database services: docker-compose stop" -ForegroundColor White
        Write-Host "To view database logs: docker-compose logs -f mysql redis" -ForegroundColor White
        Write-Host ""
        
        npm run dev
        
    } else {
        Write-Host ""
        Write-Host "❌ Failed to start database services" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check logs with: docker-compose logs mysql redis" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
} elseif ($mysqlRunning) {
    Write-Host "🔧 MySQL detected! Using manual setup..." -ForegroundColor Cyan
    Write-Host ""
    
    # 检查 Redis
    $redisCheck = netstat -ano | findstr ":6379"
    if (-not $redisCheck) {
        Write-Host "⚠️  Warning: Redis is not running on port 6379" -ForegroundColor Yellow
        Write-Host "   Some features may not work properly" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "✅ Redis is running" -ForegroundColor Green
        Write-Host ""
    }
    
    # 进入后端目录
    Set-Location ieclub-backend
    
    # 检查 .env 文件
    if (-not (Test-Path ".env")) {
        Write-Host "⚙️  Environment not configured!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run: .\setup-env.ps1" -ForegroundColor Yellow
        Write-Host "Then run this script again" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    # 检查依赖
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
        npm install
        Write-Host ""
    }
    
    # 启动服务
    Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    
    npm run dev
    
} else {
    Write-Host "❌ No database found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to install either:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 (Recommended): Docker Desktop" -ForegroundColor White
    Write-Host "  - Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host "  - See: INSTALL_DOCKER.md for detailed guide" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 2: MySQL + Redis manually" -ForegroundColor White
    Write-Host "  - See: REMIND.md for installation guide" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again!" -ForegroundColor Green
    Write-Host ""
    exit 1
}

