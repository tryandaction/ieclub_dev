#!/usr/bin/env pwsh
# Fix System Proxy Issues
# 一键修复系统代理问题

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "System Proxy Fix Tool" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "Checking current proxy settings..." -ForegroundColor Yellow

# 检查当前代理设置
$currentProxy = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue

if ($currentProxy.ProxyEnable -eq 1) {
    Write-Host "  System proxy is currently ENABLED" -ForegroundColor Red
    Write-Host "  Proxy Server: $($currentProxy.ProxyServer)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Disabling system proxy..." -ForegroundColor Yellow
    
    # 禁用系统代理
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
    
    Write-Host "  OK: System proxy disabled" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "  OK: System proxy is already disabled" -ForegroundColor Green
    Write-Host ""
}

# 重置WinHTTP代理
Write-Host "Resetting WinHTTP proxy..." -ForegroundColor Yellow
try {
    netsh winhttp reset proxy | Out-Null
    Write-Host "  OK: WinHTTP proxy reset" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  WARNING: Failed to reset WinHTTP proxy" -ForegroundColor Yellow
    Write-Host ""
}

# 清除环境变量代理
Write-Host "Clearing environment proxy variables..." -ForegroundColor Yellow
$envProxies = @("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY")
$clearedAny = $false

foreach ($envVar in $envProxies) {
    $value = [System.Environment]::GetEnvironmentVariable($envVar, "User")
    if ($value) {
        [System.Environment]::SetEnvironmentVariable($envVar, $null, "User")
        Write-Host "  Cleared: $envVar" -ForegroundColor Cyan
        $clearedAny = $true
    }
    
    $value = [System.Environment]::GetEnvironmentVariable($envVar, "Process")
    if ($value) {
        [System.Environment]::SetEnvironmentVariable($envVar, $null, "Process")
        $clearedAny = $true
    }
}

if ($clearedAny) {
    Write-Host "  OK: Environment variables cleared" -ForegroundColor Green
} else {
    Write-Host "  OK: No environment proxy variables found" -ForegroundColor Green
}
Write-Host ""

# 清除DNS缓存
Write-Host "Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    Write-Host "  OK: DNS cache flushed" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "  WARNING: Failed to flush DNS cache" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Proxy Fix Complete!" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "IMPORTANT: You must restart your terminal for changes to take effect!`n" -ForegroundColor Yellow

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Close this PowerShell window" -ForegroundColor White
Write-Host "  2. Open a NEW PowerShell window" -ForegroundColor White
Write-Host "  3. Run: .\scripts\health-check\Deep-Diagnose.ps1" -ForegroundColor Cyan
Write-Host "  4. Verify SSH connection is OK" -ForegroundColor White
Write-Host "  5. Run deployment script" -ForegroundColor White
Write-Host ""

Write-Host "If you still see Clash interface, you need to:" -ForegroundColor Yellow
Write-Host "  - Completely EXIT Clash (not just disable proxy)" -ForegroundColor White
Write-Host "  - Right-click Clash tray icon -> Quit/Exit" -ForegroundColor White
Write-Host ""

