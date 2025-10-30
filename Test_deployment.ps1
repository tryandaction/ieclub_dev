# IEClub Deployment Test Script
param(
    [string]$Domain = "ieclub.online",
    [string]$IP = "39.108.160.112"
)

Write-Host "==================================================`n" -ForegroundColor Cyan
Write-Host "IEClub Deployment Status Check`n" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Gray

# Test 1: DNS Resolution
Write-Host "[1] DNS Resolution Test..." -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
    $resolvedIP = $dns[0].IPAddress
    
    if ($resolvedIP -eq $IP) {
        Write-Host "    [OK] DNS is correct: $resolvedIP`n" -ForegroundColor Green
    } else {
        Write-Host "    [ERROR] DNS mismatch!" -ForegroundColor Red
        Write-Host "    Current IP: $resolvedIP" -ForegroundColor Red
        Write-Host "    Expected IP: $IP`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    [ERROR] DNS resolution failed`n" -ForegroundColor Red
}

# Test 2: Server Ping
Write-Host "[2] Server Connectivity Test..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $IP -Count 2 -Quiet
if ($ping) {
    Write-Host "    [OK] Server is reachable`n" -ForegroundColor Green
} else {
    Write-Host "    [ERROR] Server is not reachable`n" -ForegroundColor Red
}

# Test 3: HTTP via IP
Write-Host "[3] HTTP Service Test (via IP)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$IP/" -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "    [OK] HTTP service is running (Status: $($response.StatusCode))`n" -ForegroundColor Green
} catch {
    Write-Host "    [ERROR] HTTP service test failed`n" -ForegroundColor Red
}

# Test 4: HTTP via Domain
Write-Host "[4] HTTP Service Test (via domain)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$Domain/" -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "    [OK] Website is accessible via domain`n" -ForegroundColor Green
} catch {
    Write-Host "    [ERROR] Website is not accessible via domain`n" -ForegroundColor Red
}

# Test 5: Backend API
Write-Host "[5] Backend API Test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$IP/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "    [OK] Backend API is running`n" -ForegroundColor Green
} catch {
    Write-Host "    [WARNING] Backend API test failed (health endpoint may not exist)`n" -ForegroundColor Yellow
}

# Summary
Write-Host "==================================================`n" -ForegroundColor Gray
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Temporary (IP): http://$IP/" -ForegroundColor White
Write-Host "  Production (Domain): http://$Domain/`n" -ForegroundColor White
Write-Host "Documentation: DNS_FIX_GUIDE.md`n" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Gray

