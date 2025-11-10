# ============================================
# Website Access Check Script
# ============================================
# Check if website is accessible and diagnose issues
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Website Access Diagnostic" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$Server = "${ServerUser}@${ServerHost}"
$hasIssues = $false

# 1. Check DNS Resolution
Write-Host "[1/6] Checking DNS Resolution..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name "ieclub.online" -ErrorAction Stop
    Write-Host "  DNS Resolution: OK" -ForegroundColor Green
    Write-Host "  IP Address: $($dnsResult[0].IPAddress)" -ForegroundColor Gray
} catch {
    Write-Host "  DNS Resolution: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 2. Check HTTPS Access
Write-Host "[2/6] Checking HTTPS Access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://ieclub.online" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Content Length: $($response.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "  HTTPS Access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 3. Check API Health Endpoint
Write-Host "[3/6] Checking API Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "https://ieclub.online/api/health" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  Status Code: $($healthResponse.StatusCode)" -ForegroundColor Green
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "  API Status: $($healthData.status)" -ForegroundColor Green
    Write-Host "  Service: $($healthData.service)" -ForegroundColor Gray
} catch {
    Write-Host "  API Health Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 4. Check SSH Connection
Write-Host "[4/6] Checking SSH Connection..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $Server "echo 'SSH OK'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SSH Connection: OK" -ForegroundColor Green
    } else {
        Write-Host "  SSH Connection: FAILED" -ForegroundColor Red
        Write-Host "  Error: $sshTest" -ForegroundColor Gray
        $hasIssues = $true
    }
} catch {
    Write-Host "  SSH Connection: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 5. Check PM2 Status (if SSH works)
if (-not $hasIssues -or $LASTEXITCODE -eq 0) {
    Write-Host "[5/6] Checking PM2 Status on Server..." -ForegroundColor Yellow
    try {
        $pm2Status = ssh $Server "pm2 list" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PM2 Status:" -ForegroundColor Green
            $pm2Status | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        } else {
            Write-Host "  PM2 Check: FAILED" -ForegroundColor Red
            Write-Host "  Error: $pm2Status" -ForegroundColor Gray
            $hasIssues = $true
        }
    } catch {
        Write-Host "  PM2 Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $hasIssues = $true
    }
} else {
    Write-Host "[5/6] Skipping PM2 Check (SSH not available)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Check Nginx Status (if SSH works)
if (-not $hasIssues -or $LASTEXITCODE -eq 0) {
    Write-Host "[6/6] Checking Nginx Status on Server..." -ForegroundColor Yellow
    try {
        $nginxStatus = ssh $Server "systemctl status nginx --no-pager -l" 2>&1
        if ($LASTEXITCODE -eq 0 -or $nginxStatus -match "active") {
            Write-Host "  Nginx Status: OK" -ForegroundColor Green
            if ($nginxStatus -match "active \(running\)") {
                Write-Host "    Nginx is running" -ForegroundColor Gray
            }
        } else {
            Write-Host "  Nginx Check: FAILED or not running" -ForegroundColor Red
            $hasIssues = $true
        }
    } catch {
        Write-Host "  Nginx Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $hasIssues = $true
    }
} else {
    Write-Host "[6/6] Skipping Nginx Check (SSH not available)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Host "  Issues Found - Website may not be accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    Write-Host "  1. Check server status: ssh $Server" -ForegroundColor White
    Write-Host "  2. Check PM2: ssh $Server 'pm2 status'" -ForegroundColor White
    Write-Host "  3. Check Nginx: ssh $Server 'systemctl status nginx'" -ForegroundColor White
    Write-Host "  4. Check logs: ssh $Server 'pm2 logs ieclub-backend --lines 50'" -ForegroundColor White
    exit 1
} else {
    Write-Host "  All checks passed - Website is accessible!" -ForegroundColor Green
    exit 0
}

