# IE Club Backend Environment Setup Script
# 自动创建 .env 文件

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   IE Club Backend Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 .env 是否已存在
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host ""
        Write-Host "Setup cancelled. Existing .env file preserved." -ForegroundColor Green
        Write-Host ""
        exit 0
    }
}

Write-Host "Creating .env file..." -ForegroundColor Yellow
Write-Host ""

# 询问用户使用哪种方案
Write-Host "Which setup are you using?" -ForegroundColor Cyan
Write-Host "1. Docker (recommended)" -ForegroundColor White
Write-Host "2. Manual installation (MySQL + Redis)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter your choice (1 or 2)"

$envContent = @"
# ========================================
# IE Club Backend Environment Configuration
# ========================================

"@

if ($choice -eq "1") {
    # Docker 配置
    $envContent += @"
# 数据库配置 (Database - Docker)
DATABASE_URL="mysql://ieclub_user:ieclub_user_pass@localhost:3306/ieclub"
MYSQL_ROOT_PASSWORD=ieclub_root_pass
MYSQL_PASSWORD=ieclub_user_pass

# Redis 配置 (Redis - Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=ieclub_redis_pass

"@
    Write-Host ""
    Write-Host "✅ Using Docker configuration" -ForegroundColor Green
} else {
    # 手动安装配置
    Write-Host ""
    Write-Host "Please enter your database configuration:" -ForegroundColor Cyan
    Write-Host ""
    
    $dbHost = Read-Host "Database host (default: localhost)"
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }
    
    $dbPort = Read-Host "Database port (default: 3306)"
    if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "3306" }
    
    $dbName = Read-Host "Database name (default: ieclub)"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "ieclub" }
    
    $dbUser = Read-Host "Database user (default: root)"
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "root" }
    
    $dbPass = Read-Host "Database password" -AsSecureString
    $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))
    
    Write-Host ""
    Write-Host "Redis configuration:" -ForegroundColor Cyan
    Write-Host ""
    
    $redisHost = Read-Host "Redis host (default: localhost)"
    if ([string]::IsNullOrWhiteSpace($redisHost)) { $redisHost = "localhost" }
    
    $redisPort = Read-Host "Redis port (default: 6379)"
    if ([string]::IsNullOrWhiteSpace($redisPort)) { $redisPort = "6379" }
    
    $redisPass = Read-Host "Redis password (leave empty if no password)"
    
    $envContent += @"
# 数据库配置 (Database - Manual)
DATABASE_URL="mysql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}"
MYSQL_ROOT_PASSWORD=${dbPassPlain}
MYSQL_PASSWORD=${dbPassPlain}

# Redis 配置 (Redis - Manual)
REDIS_HOST=${redisHost}
REDIS_PORT=${redisPort}
REDIS_PASSWORD=${redisPass}

"@
    Write-Host ""
    Write-Host "✅ Using manual configuration" -ForegroundColor Green
}

# 通用配置
$envContent += @"
# 服务器配置 (Server Configuration)
NODE_ENV=development
PORT=3000

# JWT 密钥 (JWT Secrets)
# ⚠️ 生产环境请修改为随机字符串！
JWT_SECRET=dev_jwt_secret_key_min_32_characters_long_change_in_prod
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_min_32_characters_long_change_in_prod
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 微信小程序配置 (WeChat Mini Program - Optional)
WECHAT_APPID=
WECHAT_SECRET=

# 阿里云 OSS 配置 (Aliyun OSS - Optional)
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=
OSS_ENDPOINT=
OSS_CDN_DOMAIN=

# 文件上传配置 (File Upload Configuration)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# 日志配置 (Logging Configuration)
LOG_LEVEL=info
LOG_DIR=./logs

# CORS 配置 (CORS Configuration)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# 速率限制 (Rate Limiting)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 缓存配置 (Cache Configuration)
CACHE_TTL=300
CACHE_ENABLED=true
"@

# 写入文件
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""

if ($choice -eq "1") {
    Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
    Write-Host "3. Wait for services to start" -ForegroundColor White
    Write-Host "4. Visit: http://localhost:3000/api/health" -ForegroundColor White
} else {
    Write-Host "1. Make sure MySQL is running" -ForegroundColor White
    Write-Host "2. Make sure Redis is running" -ForegroundColor White
    Write-Host "3. Run: npm install" -ForegroundColor White
    Write-Host "4. Run: npm run dev" -ForegroundColor White
    Write-Host "5. Visit: http://localhost:3000/api/health" -ForegroundColor White
}

Write-Host ""
Write-Host "For more help, see:" -ForegroundColor Yellow
Write-Host "- REMIND.md (in project root)" -ForegroundColor White
Write-Host "- INSTALL_DOCKER.md (for Docker setup)" -ForegroundColor White
Write-Host "- QUICK_START.md (in this directory)" -ForegroundColor White
Write-Host ""

