# IEClub Simple Deploy Script
param(
    [string]$Action = "auto"
)

Write-Host "🚀 IEClub Simple Deploy Script" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Test prerequisites
Write-Host "`n➡️  Checking prerequisites..." -ForegroundColor Yellow

$tools = @("git", "npm", "node")
$missing = @()

foreach ($tool in $tools) {
    if (!(Get-Command $tool -ErrorAction SilentlyContinue)) {
        $missing += $tool
    }
}

if ($missing.Count -gt 0) {
    Write-Host "❌ Missing tools: $($missing -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tools available" -ForegroundColor Green
}

# Check Git status
Write-Host "`n➡️  Checking Git status..." -ForegroundColor Yellow
Set-Location "C:\universe\GitHub_try\IEclub_dev"

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes detected" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Yellow
} else {
    Write-Host "✅ Git working directory clean" -ForegroundColor Green
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor White

if ($currentBranch -ne "main") {
    Write-Host "⚠️  Switching to main branch..." -ForegroundColor Yellow
    git checkout main
}

# Test server connection
Write-Host "`n➡️  Testing server connection..." -ForegroundColor Yellow
try {
    $result = ssh -o ConnectTimeout=10 -o BatchMode=yes root@39.108.160.112 "echo 'connection-test'" 2>$null
    if ($result -eq "connection-test") {
        Write-Host "✅ Server connection OK" -ForegroundColor Green
        $serverOk = $true
    } else {
        Write-Host "❌ Server connection failed" -ForegroundColor Red
        $serverOk = $false
    }
} catch {
    Write-Host "❌ Server connection failed: $($_.Exception.Message)" -ForegroundColor Red
    $serverOk = $false
}

# Build frontend
if ($Action -eq "auto" -or $Action -eq "frontend") {
    Write-Host "`n➡️  Building frontend..." -ForegroundColor Yellow
    Set-Location "ieclub-taro"
    
    # Clean old build
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "Cleaned old build" -ForegroundColor Yellow
    }
    
    # Build H5
    npm run build:h5
    
    if (Test-Path "dist\h5") {
        Write-Host "✅ Frontend build successful" -ForegroundColor Green
        
        # Create zip
        if (Test-Path "dist.zip") {
            Remove-Item "dist.zip"
        }
        Compress-Archive -Path "dist" -DestinationPath "dist.zip" -Force
        Write-Host "✅ Frontend zip created" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
    }
}

# Deploy to server
if ($serverOk -and (Test-Path "ieclub-taro\dist.zip")) {
    Write-Host "`n➡️  Deploying to server..." -ForegroundColor Yellow
    
    # Upload file
    scp "ieclub-taro\dist.zip" "root@39.108.160.112:/tmp/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ File uploaded to server" -ForegroundColor Green
        
        # Deploy on server
        ssh root@39.108.160.112 "cd /var/www/ieclub_dev && ./deploy.sh frontend"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Server deployment successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Server deployment failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ File upload failed" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Deploy completed!" -ForegroundColor Green
