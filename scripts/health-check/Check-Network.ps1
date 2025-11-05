# ============================================
# Network Connection Diagnostics
# ============================================

Write-Host "IEClub Server Connection Diagnostics" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host ""

$server = "ieclub.online"
$ip = "39.108.160.112"

# 1. Check proxy settings
Write-Host "[1] Checking proxy settings..." -ForegroundColor Yellow
$clashDetected = $false
$netRoute = Test-NetConnection -ComputerName $server -Port 443 -InformationLevel Detailed -WarningAction SilentlyContinue
if ($netRoute.InterfaceAlias -eq "Clash") {
    Write-Host "  WARNING: Clash proxy detected" -ForegroundColor Red
    Write-Host "     Interface: $($netRoute.InterfaceAlias)" -ForegroundColor Gray
    Write-Host "     Source Address: $($netRoute.SourceAddress)" -ForegroundColor Gray
    $clashDetected = $true
} else {
    Write-Host "  OK: No proxy interference detected" -ForegroundColor Green
}
Write-Host ""

# 2. Ping test
Write-Host "[2] Ping test..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $server -Count 2 -Quiet
if ($ping) {
    Write-Host "  OK: Ping successful - server is reachable" -ForegroundColor Green
} else {
    Write-Host "  FAILED: Ping failed - server is unreachable" -ForegroundColor Red
}
Write-Host ""

# 3. Port connectivity test
Write-Host "[3] Port connectivity test..." -ForegroundColor Yellow

$ports = @(
    @{ Name="SSH"; Port=22 },
    @{ Name="HTTPS"; Port=443 },
    @{ Name="Test Environment API"; Port=3001 }
)

foreach ($portTest in $ports) {
    $result = Test-NetConnection -ComputerName $server -Port $portTest.Port -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "  OK: $($portTest.Name) (port $($portTest.Port)) - connected" -ForegroundColor Green
    } else {
        Write-Host "  FAILED: $($portTest.Name) (port $($portTest.Port)) - connection failed" -ForegroundColor Red
    }
}
Write-Host ""

# 4. HTTPS service test
Write-Host "[4] HTTPS service test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$server" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    Write-Host "  OK: HTTPS service is working (status code: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: HTTPS service error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. SSH connection test
Write-Host "[5] SSH connection test..." -ForegroundColor Yellow
Write-Host "  Testing (timeout 10s)..." -ForegroundColor Gray

$sshTest = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@$server "echo 'SSH_OK'" 2>&1
if ($LASTEXITCODE -eq 0 -and $sshTest -like "*SSH_OK*") {
    Write-Host "  OK: SSH connection successful" -ForegroundColor Green
} else {
    Write-Host "  FAILED: SSH connection failed" -ForegroundColor Red
    Write-Host "     Error: $sshTest" -ForegroundColor Gray
}
Write-Host ""

# Diagnosis Results
Write-Host ("=" * 60)
Write-Host "Diagnosis Results" -ForegroundColor Cyan
Write-Host ("=" * 60)

if ($clashDetected) {
    Write-Host ""
    Write-Host "WARNING: Clash proxy is interfering with connections" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor White
    Write-Host "  1. Add rule in Clash:" -ForegroundColor Gray
    Write-Host "     - Rule Type: DOMAIN" -ForegroundColor Gray
    Write-Host "     - Content: ieclub.online" -ForegroundColor Gray
    Write-Host "     - Policy: DIRECT" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Or temporarily disable Clash:" -ForegroundColor Gray
    Write-Host "     - Right-click Clash icon -> 'Exit System Proxy' or 'Quit Clash'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Re-run this script after making changes" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "OK: Network connection is normal, ready to deploy" -ForegroundColor Green
    Write-Host ""
}

Write-Host ("=" * 60)
