#!/usr/bin/env pwsh
# Deep Network Diagnostics for IEClub Server
# 深度诊断网络和服务器连接问题

param(
    [switch]$Verbose
)

$SERVER = "ieclub.online"
$SERVER_IP = "39.108.160.112"
$SSH_PORT = 22
$HTTPS_PORT = 443
$API_PORT = 3001

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "IEClub Server Deep Diagnostics" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$issues = @()
$criticalIssues = @()

# ============================================================
# 1. 检查所有代理设置（不仅是Clash）
# ============================================================
Write-Host "[1] Checking ALL proxy settings..." -ForegroundColor Yellow

# 检查系统代理
$systemProxy = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue
if ($systemProxy.ProxyEnable -eq 1) {
    Write-Host "  WARNING: System proxy is enabled" -ForegroundColor Red
    Write-Host "     Proxy Server: $($systemProxy.ProxyServer)" -ForegroundColor Gray
    $issues += "System proxy enabled: $($systemProxy.ProxyServer)"
}

# 检查环境变量代理
$envProxies = @("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY")
foreach ($envVar in $envProxies) {
    $value = [System.Environment]::GetEnvironmentVariable($envVar)
    if ($value) {
        Write-Host "  WARNING: Environment variable $envVar is set" -ForegroundColor Red
        Write-Host "     Value: $value" -ForegroundColor Gray
        $issues += "Environment proxy: $envVar=$value"
    }
}

# 检查Clash
$clashDetected = $false
try {
    $testConnection = Test-NetConnection -ComputerName $SERVER -Port $HTTPS_PORT -InformationLevel Detailed -WarningAction SilentlyContinue
    if ($testConnection.InterfaceAlias -like "*Clash*" -or $testConnection.SourceAddress -like "198.18.*") {
        Write-Host "  WARNING: Clash proxy detected" -ForegroundColor Red
        Write-Host "     Interface: $($testConnection.InterfaceAlias)" -ForegroundColor Gray
        Write-Host "     Source Address: $($testConnection.SourceAddress)" -ForegroundColor Gray
        $clashDetected = $true
        $issues += "Clash proxy active"
    }
} catch {
    # Ignore
}

if (-not $clashDetected -and $issues.Count -eq 0) {
    Write-Host "  OK: No proxy detected" -ForegroundColor Green
}

# ============================================================
# 2. DNS解析测试
# ============================================================
Write-Host "`n[2] DNS resolution test..." -ForegroundColor Yellow

try {
    $dnsResult = Resolve-DnsName -Name $SERVER -ErrorAction Stop
    $resolvedIP = ($dnsResult | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1).IPAddress
    
    if ($resolvedIP -eq $SERVER_IP) {
        Write-Host "  OK: DNS resolves correctly" -ForegroundColor Green
        Write-Host "     $SERVER -> $resolvedIP" -ForegroundColor Gray
    } else {
        Write-Host "  WARNING: DNS resolves to unexpected IP" -ForegroundColor Red
        Write-Host "     Expected: $SERVER_IP" -ForegroundColor Gray
        Write-Host "     Got: $resolvedIP" -ForegroundColor Gray
        $issues += "DNS mismatch: got $resolvedIP, expected $SERVER_IP"
    }
} catch {
    Write-Host "  FAILED: DNS resolution failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
    $criticalIssues += "DNS resolution failed"
}

# ============================================================
# 3. Ping测试（多次）
# ============================================================
Write-Host "`n[3] Ping test (5 attempts)..." -ForegroundColor Yellow

try {
    $pingResults = Test-Connection -ComputerName $SERVER -Count 5 -ErrorAction Stop
    $avgLatency = ($pingResults | Measure-Object -Property Latency -Average).Average
    $packetLoss = (5 - $pingResults.Count) / 5 * 100
    
    Write-Host "  OK: Ping successful" -ForegroundColor Green
    Write-Host "     Average latency: $([math]::Round($avgLatency, 2))ms" -ForegroundColor Gray
    Write-Host "     Packet loss: $packetLoss%" -ForegroundColor Gray
    
    if ($avgLatency -gt 500) {
        Write-Host "  WARNING: High latency detected (>500ms)" -ForegroundColor Yellow
        $issues += "High latency: $([math]::Round($avgLatency, 2))ms"
    }
    if ($packetLoss -gt 0) {
        Write-Host "  WARNING: Packet loss detected" -ForegroundColor Yellow
        $issues += "Packet loss: $packetLoss%"
    }
} catch {
    Write-Host "  FAILED: Ping failed" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Gray
    $criticalIssues += "Ping failed - server unreachable"
}

# ============================================================
# 4. 端口连通性测试（详细）
# ============================================================
Write-Host "`n[4] Port connectivity test (detailed)..." -ForegroundColor Yellow

$ports = @(
    @{Port = $SSH_PORT; Name = "SSH"; Critical = $true},
    @{Port = $HTTPS_PORT; Name = "HTTPS"; Critical = $false},
    @{Port = $API_PORT; Name = "Test API"; Critical = $false}
)

foreach ($portInfo in $ports) {
    Write-Host "  Testing $($portInfo.Name) (port $($portInfo.Port))..." -ForegroundColor Gray
    
    try {
        $result = Test-NetConnection -ComputerName $SERVER -Port $portInfo.Port -WarningAction SilentlyContinue -InformationLevel Detailed
        
        if ($result.TcpTestSucceeded) {
            Write-Host "    OK: Connected successfully" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "       Latency: $($result.PingReplyDetails.RoundtripTime)ms" -ForegroundColor DarkGray
                Write-Host "       Remote Address: $($result.RemoteAddress)" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "    FAILED: Cannot connect" -ForegroundColor Red
            if ($portInfo.Critical) {
                $criticalIssues += "$($portInfo.Name) port $($portInfo.Port) unreachable"
            } else {
                $issues += "$($portInfo.Name) port $($portInfo.Port) unreachable"
            }
        }
    } catch {
        Write-Host "    ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($portInfo.Critical) {
            $criticalIssues += "$($portInfo.Name) port test error: $($_.Exception.Message)"
        }
    }
}

# ============================================================
# 5. SSH连接详细测试
# ============================================================
Write-Host "`n[5] SSH connection detailed test..." -ForegroundColor Yellow

# 检查SSH客户端
$sshPath = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshPath) {
    Write-Host "  WARNING: SSH client not found in PATH" -ForegroundColor Red
    $issues += "SSH client not available"
} else {
    Write-Host "  Found SSH client: $($sshPath.Source)" -ForegroundColor Gray
    
    # 测试SSH连接（verbose mode）
    Write-Host "  Testing SSH connection (verbose, timeout 15s)..." -ForegroundColor Gray
    
    $sshTest = {
        $output = ssh -v -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@ieclub.online "echo 'SSH_OK'" 2>&1
        return $output
    }
    
    try {
        $job = Start-Job -ScriptBlock $sshTest
        $result = Wait-Job -Job $job -Timeout 20
        $output = Receive-Job -Job $job
        Remove-Job -Job $job -Force
        
        if ($output -match "SSH_OK") {
            Write-Host "  OK: SSH connection successful" -ForegroundColor Green
        } else {
            Write-Host "  FAILED: SSH connection failed" -ForegroundColor Red
            
            # 分析SSH详细输出
            $debugInfo = $output | Select-String -Pattern "(Connection|timeout|refused|reset|closed|Banner)" -AllMatches
            if ($debugInfo) {
                Write-Host "`n  SSH Debug Information:" -ForegroundColor Yellow
                foreach ($match in $debugInfo) {
                    Write-Host "    $match" -ForegroundColor Gray
                }
            }
            
            # 检查常见错误
            if ($output -match "Connection timed out") {
                $criticalIssues += "SSH connection timeout - network or firewall blocking"
            } elseif ($output -match "Connection refused") {
                $criticalIssues += "SSH connection refused - service may be down"
            } elseif ($output -match "Banner exchange") {
                $criticalIssues += "SSH banner exchange failed - proxy or firewall issue"
            } else {
                $criticalIssues += "SSH connection failed - unknown reason"
            }
            
            if ($Verbose) {
                Write-Host "`n  Full SSH Output:" -ForegroundColor DarkYellow
                Write-Host "$output" -ForegroundColor DarkGray
            }
        }
    } catch {
        Write-Host "  ERROR: SSH test error: $($_.Exception.Message)" -ForegroundColor Red
        $criticalIssues += "SSH test failed: $($_.Exception.Message)"
    }
}

# ============================================================
# 6. 防火墙检查
# ============================================================
Write-Host "`n[6] Windows Firewall check..." -ForegroundColor Yellow

try {
    $firewallProfiles = Get-NetFirewallProfile -ErrorAction Stop
    $blockingProfiles = $firewallProfiles | Where-Object { $_.Enabled -eq $true }
    
    if ($blockingProfiles) {
        Write-Host "  INFO: Active firewall profiles:" -ForegroundColor Cyan
        foreach ($profile in $blockingProfiles) {
            Write-Host "     $($profile.Name): Enabled" -ForegroundColor Gray
        }
        
        # 检查SSH规则
        $sshRules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object {
            $_.DisplayName -match "SSH" -and $_.Enabled -eq $true
        }
        
        if ($sshRules) {
            Write-Host "  INFO: Found SSH firewall rules:" -ForegroundColor Cyan
            foreach ($rule in $sshRules) {
                Write-Host "     $($rule.DisplayName) - Action: $($rule.Action)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  INFO: Windows Firewall is disabled" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  WARNING: Cannot check firewall status" -ForegroundColor Yellow
}

# ============================================================
# 7. 网络路由追踪
# ============================================================
Write-Host "`n[7] Network route trace (first 10 hops)..." -ForegroundColor Yellow

try {
    Write-Host "  Tracing route to $SERVER..." -ForegroundColor Gray
    $traceResult = Test-NetConnection -ComputerName $SERVER -TraceRoute -WarningAction SilentlyContinue
    
    if ($traceResult.TraceRoute) {
        $hopCount = $traceResult.TraceRoute.Count
        Write-Host "  Route completed in $hopCount hops:" -ForegroundColor Cyan
        
        for ($i = 0; $i -lt [Math]::Min(10, $hopCount); $i++) {
            Write-Host "     Hop $($i+1): $($traceResult.TraceRoute[$i])" -ForegroundColor Gray
        }
        
        if ($hopCount -gt 10) {
            Write-Host "     ... ($($hopCount - 10) more hops)" -ForegroundColor DarkGray
        }
        
        if ($hopCount -gt 30) {
            $issues += "Excessive routing hops: $hopCount (may indicate network issues)"
        }
    } else {
        Write-Host "  WARNING: Could not complete route trace" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  WARNING: Route trace failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================================
# 8. 本地SSH配置检查
# ============================================================
Write-Host "`n[8] Local SSH configuration check..." -ForegroundColor Yellow

$sshConfigPath = "$env:USERPROFILE\.ssh\config"
if (Test-Path $sshConfigPath) {
    Write-Host "  Found SSH config: $sshConfigPath" -ForegroundColor Cyan
    
    $sshConfig = Get-Content $sshConfigPath -ErrorAction SilentlyContinue
    $ieClubConfig = $sshConfig | Select-String -Pattern "ieclub" -Context 5
    
    if ($ieClubConfig) {
        Write-Host "  INFO: Found IEClub SSH configuration:" -ForegroundColor Cyan
        Write-Host "$ieClubConfig" -ForegroundColor Gray
    } else {
        Write-Host "  INFO: No specific IEClub configuration found" -ForegroundColor Gray
    }
} else {
    Write-Host "  INFO: No SSH config file found (this is normal)" -ForegroundColor Gray
}

# ============================================================
# 9. 系统资源检查
# ============================================================
Write-Host "`n[9] System resource check..." -ForegroundColor Yellow

$computerInfo = Get-ComputerInfo -ErrorAction SilentlyContinue
if ($computerInfo) {
    $freeMemoryGB = [math]::Round($computerInfo.OsFreePhysicalMemory / 1MB, 2)
    $totalMemoryGB = [math]::Round($computerInfo.OsTotalVisibleMemorySize / 1MB, 2)
    $memoryUsagePercent = [math]::Round((1 - ($freeMemoryGB / $totalMemoryGB)) * 100, 1)
    
    Write-Host "  Memory: $freeMemoryGB GB free / $totalMemoryGB GB total ($memoryUsagePercent% used)" -ForegroundColor Gray
    
    if ($memoryUsagePercent -gt 90) {
        Write-Host "  WARNING: High memory usage" -ForegroundColor Yellow
        $issues += "High memory usage: $memoryUsagePercent%"
    }
}

# ============================================================
# 诊断结果汇总
# ============================================================
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Diagnosis Results" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

if ($criticalIssues.Count -eq 0 -and $issues.Count -eq 0) {
    Write-Host "OK: No issues detected - network connection is normal" -ForegroundColor Green
    Write-Host "    You should be able to deploy successfully." -ForegroundColor Green
    exit 0
}

if ($criticalIssues.Count -gt 0) {
    Write-Host "CRITICAL ISSUES FOUND ($($criticalIssues.Count)):" -ForegroundColor Red
    foreach ($issue in $criticalIssues) {
        Write-Host "  X $issue" -ForegroundColor Red
    }
    Write-Host ""
}

if ($issues.Count -gt 0) {
    Write-Host "WARNINGS ($($issues.Count)):" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  ! $issue" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================================
# 智能建议
# ============================================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Recommended Solutions" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# 分析问题并提供建议
$hasProxyIssue = $issues -match "proxy|Clash" -or $criticalIssues -match "proxy|Clash"
$hasSSHIssue = $criticalIssues -match "SSH"
$hasDNSIssue = $criticalIssues -match "DNS"
$hasNetworkIssue = $criticalIssues -match "Ping|unreachable"

if ($hasProxyIssue) {
    Write-Host "[1] Proxy Issues Detected" -ForegroundColor Yellow
    Write-Host "    - Completely exit ALL proxy software (Clash, V2Ray, etc.)" -ForegroundColor White
    Write-Host "    - Run: netsh winhttp reset proxy" -ForegroundColor Cyan
    Write-Host "    - Restart PowerShell" -ForegroundColor White
    Write-Host ""
}

if ($hasDNSIssue) {
    Write-Host "[2] DNS Issues Detected" -ForegroundColor Yellow
    Write-Host "    - Run: ipconfig /flushdns" -ForegroundColor Cyan
    Write-Host "    - Try using IP directly: ssh root@$SERVER_IP" -ForegroundColor Cyan
    Write-Host "    - Check DNS server settings" -ForegroundColor White
    Write-Host ""
}

if ($hasSSHIssue -and -not $hasProxyIssue) {
    Write-Host "[3] SSH Connection Issues" -ForegroundColor Yellow
    Write-Host "    Possible causes:" -ForegroundColor White
    Write-Host "    - Server SSH service is down (contact server admin)" -ForegroundColor White
    Write-Host "    - Firewall blocking SSH (check Windows Firewall)" -ForegroundColor White
    Write-Host "    - Network provider blocking port 22 (try from different network)" -ForegroundColor White
    Write-Host "    - SSH key authentication issue (try with password)" -ForegroundColor White
    Write-Host ""
    Write-Host "    Quick test:" -ForegroundColor Cyan
    Write-Host "    ssh -v root@$SERVER" -ForegroundColor Cyan
    Write-Host ""
}

if ($hasNetworkIssue) {
    Write-Host "[4] Network Connectivity Issues" -ForegroundColor Yellow
    Write-Host "    - Check your internet connection" -ForegroundColor White
    Write-Host "    - Try from a different network (mobile hotspot?)" -ForegroundColor White
    Write-Host "    - Contact your ISP if problem persists" -ForegroundColor White
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "1. Apply the recommended solutions above" -ForegroundColor White
Write-Host "2. Run this diagnostic again: .\scripts\health-check\Deep-Diagnose.ps1" -ForegroundColor Cyan
Write-Host "3. If issues persist, try manual SSH connection:" -ForegroundColor White
Write-Host "   ssh -v root@$SERVER" -ForegroundColor Cyan
Write-Host "4. Share the output with your team for further diagnosis" -ForegroundColor White
Write-Host ""

if ($Verbose) {
    Write-Host "============================================================" -ForegroundColor DarkCyan
    Write-Host "Additional Information" -ForegroundColor DarkCyan
    Write-Host "============================================================`n" -ForegroundColor DarkCyan
    Write-Host "Run with -Verbose flag for more detailed output (you already did!)" -ForegroundColor DarkGray
}

exit 1

