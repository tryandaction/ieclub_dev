#!/usr/bin/env pwsh
# ================================================================
# 服务器资源检查脚本 - 极简安全版
# ================================================================
#
# 功能: 最小化SSH命令，避免触发网络安全策略
# 
# 策略:
#   1. 只检查最关键的资源（内存、磁盘）
#   2. 避免使用lsof、netstat等网络命令
#   3. 不检查进程状态（通过部署后的API健康检查来验证）
#
# ================================================================

param(
    [string]$Server = "root@ieclub.online"
)

# 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$hasIssues = $false
$warnings = @()

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  服务器资源安全检查（极简版）" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查SSH连接
Write-Host "[1/3] 检查SSH连接..." -ForegroundColor Yellow
try {
    $testConnection = ssh $Server "echo 'OK'" 2>&1
    if ($testConnection -eq "OK") {
        Write-Host "  SSH连接: OK" -ForegroundColor Green
    } else {
        Write-Host "  SSH连接: 失败" -ForegroundColor Red
        $hasIssues = $true
    }
} catch {
    Write-Host "  SSH连接: 失败 - $($_.Exception.Message)" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 2. 检查内存使用（单条命令）
Write-Host "[2/3] 检查内存使用..." -ForegroundColor Yellow
try {
    $memoryInfo = ssh $Server "free -m | grep Mem" 2>&1
    if ($memoryInfo -match 'Mem:\s+(\d+)\s+(\d+)\s+(\d+)') {
        $totalMem = [int]$matches[1]
        $usedMem = [int]$matches[2]
        $freeMem = [int]$matches[3]
        $usedPercent = [math]::Round(($usedMem / $totalMem) * 100, 2)
        
        Write-Host "  总内存: ${totalMem}MB" -ForegroundColor White
        Write-Host "  已使用: ${usedMem}MB ($usedPercent%)" -ForegroundColor White
        Write-Host "  可用: ${freeMem}MB" -ForegroundColor White
        
        if ($usedPercent -gt 90) {
            Write-Host "  内存使用: 严重不足 - 不建议部署！" -ForegroundColor Red
            $hasIssues = $true
        } elseif ($usedPercent -gt 80) {
            Write-Host "  内存使用: 偏高" -ForegroundColor Yellow
            $warnings += "内存使用率 ${usedPercent}% (建议低于80%)"
        } else {
            Write-Host "  内存使用: OK" -ForegroundColor Green
        }
    } else {
        Write-Host "  内存使用: 无法解析" -ForegroundColor Yellow
        $warnings += "无法解析内存信息"
    }
} catch {
    Write-Host "  内存使用: 检查失败" -ForegroundColor Red
    $warnings += "内存检查失败"
}
Write-Host ""

# 3. 检查磁盘空间（单条命令）
Write-Host "[3/3] 检查磁盘空间..." -ForegroundColor Yellow
try {
    $diskInfo = ssh $Server "df -h / | tail -1" 2>&1
    if ($diskInfo -match '(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%') {
        $usedPercent = [int]$matches[5]
        $used = $matches[3]
        $available = $matches[4]
        
        Write-Host "  已使用: $used" -ForegroundColor White
        Write-Host "  可用: $available" -ForegroundColor White
        Write-Host "  使用率: $usedPercent%" -ForegroundColor White
        
        if ($usedPercent -gt 90) {
            Write-Host "  磁盘空间: 严重不足 - 不建议部署！" -ForegroundColor Red
            $hasIssues = $true
        } elseif ($usedPercent -gt 80) {
            Write-Host "  磁盘空间: 偏高" -ForegroundColor Yellow
            $warnings += "磁盘使用率 ${usedPercent}% (建议低于80%)"
        } else {
            Write-Host "  磁盘空间: OK" -ForegroundColor Green
        }
    } else {
        Write-Host "  磁盘空间: 无法解析" -ForegroundColor Yellow
        $warnings += "无法解析磁盘信息"
    }
} catch {
    Write-Host "  磁盘空间: 检查失败" -ForegroundColor Red
    $warnings += "磁盘检查失败"
}
Write-Host ""

# 总结
Write-Host "============================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Host "  ❌ 发现严重问题 - 不建议部署！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先解决以下问题：" -ForegroundColor Yellow
    Write-Host "  - 内存或磁盘空间严重不足" -ForegroundColor White
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "  1. 清理磁盘空间" -ForegroundColor White
    Write-Host "  2. 检查并停止不必要的进程" -ForegroundColor White
    Write-Host "  3. 重新运行此检查" -ForegroundColor White
    exit 1
} elseif ($warnings.Count -gt 0) {
    Write-Host "  ⚠️  发现警告 - 可以部署但需注意" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "警告信息：" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "💡 说明：" -ForegroundColor Cyan
    Write-Host "  - 极简检查已通过基本验证" -ForegroundColor White
    Write-Host "  - 服务状态将在部署后通过API验证" -ForegroundColor White
    Write-Host "  - 建议部署后访问: https://ieclub.online/api/health" -ForegroundColor White
    exit 0
} else {
    Write-Host "  ✅ 健康检查通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 说明：" -ForegroundColor Cyan
    Write-Host "  - 基本资源检查正常" -ForegroundColor White
    Write-Host "  - 服务状态将在部署后通过API验证" -ForegroundColor White
    Write-Host "  - 建议部署后访问: https://ieclub.online/api/health" -ForegroundColor White
    exit 0
}
