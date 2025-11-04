# Staging Environment Health Monitor
# PowerShell version for Windows

param(
    [switch]$AutoFix,
    [switch]$Detailed,
    [switch]$Continuous,
    [int]$Interval = 300
)

# Configuration
$ServerHost = "ieclub.online"
$StagingPort = 3001
$HealthEndpoint = "/health"
$PM2ProcessName = "staging-backend"
$SSHUser = "root"

# Create logs directory
$LogDir = Join-Path $PSScriptRoot "..\logs"
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$LogFile = Join-Path $LogDir "staging-monitor.log"

# Color output functions
function Write-Info { param([string]$msg) Write-Host "INFO: $msg" -ForegroundColor Cyan }
function Write-Success { param([string]$msg) Write-Host "SUCCESS: $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) Write-Host "ERROR: $msg" -ForegroundColor Red }
function Write-Warn { param([string]$msg) Write-Host "WARNING: $msg" -ForegroundColor Yellow }

# Test health endpoint
function Test-Health {
    Write-Info "Checking staging environment health..."
    
    try {
        # Use SSH to check health on the server directly
        $healthCheck = ssh ${SSHUser}@${ServerHost} "curl -s http://localhost:${StagingPort}${HealthEndpoint}"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Failed to connect to health endpoint"
            return $false
        }
        
        $response = $healthCheck | ConvertFrom-Json
        
        if ($response.status -eq "ok") {
            Write-Success "Health check passed"
            
            if ($Detailed) {
                Write-Host "  Environment: $($response.environment)" -ForegroundColor Gray
                Write-Host "  Uptime: $([math]::Round($response.uptime, 0)) seconds" -ForegroundColor Gray
            }
            
            return $true
        }
        else {
            Write-Warn "Health check returned abnormal status: $($response.status)"
            return $false
        }
    }
    catch {
        Write-Fail "Health check failed: $($_.Exception.Message)"
        return $false
    }
}

# Test PM2 status
function Test-PM2Status {
    Write-Info "Checking PM2 process status..."
    
    try {
        $command = "pm2 jlist"
        $pm2Output = ssh ${SSHUser}@${ServerHost} $command 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Failed to get PM2 status"
            return $false
        }
        
        $pm2Status = $pm2Output | ConvertFrom-Json
        $process = $pm2Status | Where-Object { $_.name -eq $PM2ProcessName }
        
        if ($process) {
            $status = $process.pm2_env.status
            
            if ($status -eq "online") {
                Write-Success "PM2 process is online"
                
                if ($Detailed) {
                    $restarts = $process.pm2_env.restart_time
                    $memory = [math]::Round($process.monit.memory / 1MB, 2)
                    $cpu = $process.monit.cpu
                    
                    Write-Host "  Restarts: $restarts" -ForegroundColor Gray
                    Write-Host "  Memory: ${memory} MB" -ForegroundColor Gray
                    Write-Host "  CPU: ${cpu}%" -ForegroundColor Gray
                }
                
                return $true
            }
            else {
                Write-Fail "PM2 process status abnormal: $status"
                return $false
            }
        }
        else {
            Write-Fail "PM2 process not found: $PM2ProcessName"
            return $false
        }
    }
    catch {
        Write-Fail "Failed to check PM2 status: $($_.Exception.Message)"
        return $false
    }
}

# Auto fix
function Invoke-AutoFix {
    Write-Info "Attempting auto-fix..."
    
    try {
        Write-Info "Restarting PM2 process..."
        $command = "pm2 restart $PM2ProcessName"
        ssh ${SSHUser}@${ServerHost} $command
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PM2 process restarted successfully"
            
            Write-Info "Waiting for service to start..."
            Start-Sleep -Seconds 10
            
            if (Test-Health) {
                Write-Success "Fix successful! Service restored"
                return $true
            }
            else {
                Write-Warn "Service still abnormal after restart"
                return $false
            }
        }
        else {
            Write-Fail "Failed to restart PM2 process"
            return $false
        }
    }
    catch {
        Write-Fail "Auto-fix failed: $($_.Exception.Message)"
        return $false
    }
}

# Generate report
function New-MonitorReport {
    param(
        [bool]$HealthOK,
        [bool]$PM2OK
    )
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Staging Environment Monitor Report" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host ""
    
    Write-Host "Check Items:" -ForegroundColor Yellow
    Write-Host -NoNewline "  Health Check: "
    if ($HealthOK) { 
        Write-Host "PASS" -ForegroundColor Green 
    } else { 
        Write-Host "FAIL" -ForegroundColor Red 
    }
    
    Write-Host -NoNewline "  PM2 Status:   "
    if ($PM2OK) { 
        Write-Host "NORMAL" -ForegroundColor Green 
    } else { 
        Write-Host "ABNORMAL" -ForegroundColor Red 
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    
    $overallOK = $HealthOK -and $PM2OK
    
    if ($overallOK) {
        Write-Success "Staging environment running normally"
    }
    else {
        Write-Fail "Staging environment has issues"
    }
    
    Write-Host ""
    
    return $overallOK
}

# Single check
function Invoke-Check {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Starting Monitor Check" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $healthOK = Test-Health
    $pm2OK = Test-PM2Status
    
    $overallOK = New-MonitorReport -HealthOK $healthOK -PM2OK $pm2OK
    
    if (-not $overallOK -and $AutoFix) {
        Write-Warn "Issues detected, starting auto-fix..."
        Invoke-AutoFix
    }
    
    return $overallOK
}

# Continuous monitoring
function Start-ContinuousMonitoring {
    Write-Info "Starting continuous monitoring mode (interval: ${Interval}s)"
    Write-Info "Press Ctrl+C to stop"
    Write-Host ""
    
    while ($true) {
        Invoke-Check
        
        Write-Host ""
        Write-Info "Waiting ${Interval} seconds for next check..."
        Write-Host ""
        
        Start-Sleep -Seconds $Interval
    }
}

# Main
function Main {
    Write-Host "IEClub Staging Environment Monitor" -ForegroundColor Cyan
    Write-Host "Server: $ServerHost" -ForegroundColor Gray
    Write-Host "Port: $StagingPort" -ForegroundColor Gray
    Write-Host ""
    
    if ($Continuous) {
        Start-ContinuousMonitoring
    }
    else {
        $result = Invoke-Check
        
        if ($result) {
            exit 0
        }
        else {
            exit 1
        }
    }
}

# Run
Main
