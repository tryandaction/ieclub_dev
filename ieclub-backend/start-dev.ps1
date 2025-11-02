# IE Club Backend Development Startup Script

Write-Host "Starting IE Club Backend..." -ForegroundColor Cyan
Write-Host ""

# Check Redis
Write-Host "Checking Redis..." -ForegroundColor Yellow
$redisRunning = netstat -ano | findstr ":6379"
if ($redisRunning) {
    Write-Host "Redis is running" -ForegroundColor Green
} else {
    Write-Host "Redis is NOT running. Please start Redis first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check MySQL
Write-Host "Checking MySQL..." -ForegroundColor Yellow
$mysqlRunning = netstat -ano | findstr ":3306"
if ($mysqlRunning) {
    Write-Host "MySQL is running" -ForegroundColor Green
} else {
    Write-Host "MySQL is NOT running. Trying to start..." -ForegroundColor Yellow
    
    $mysqlServices = @("MySQL", "MySQL80", "MySQL57")
    $started = $false
    
    foreach ($serviceName in $mysqlServices) {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service -and $service.Status -ne "Running") {
            try {
                Start-Service -Name $serviceName -ErrorAction Stop
                Write-Host "MySQL service started: $serviceName" -ForegroundColor Green
                $started = $true
                break
            } catch {
                Write-Host "Cannot start $serviceName" -ForegroundColor Red
            }
        }
    }
    
    if (-not $started) {
        Write-Host "Cannot start MySQL. Please start it manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check database connection
Write-Host ""
Write-Host "Checking database connection..." -ForegroundColor Yellow
node scripts/check-db.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Database connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Write-Host ""
    
    npm run dev
} else {
    Write-Host ""
    Write-Host "Database connection failed!" -ForegroundColor Red
    Write-Host "Please check your .env configuration" -ForegroundColor Yellow
    exit 1
}
