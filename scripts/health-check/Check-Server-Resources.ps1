# ============================================
# 服务器资源检查脚本
# ============================================
# 在部署前检查服务器资源，防止部署导致服务器崩溃
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online"
)

$ErrorActionPreference = "Continue"

# 定义百分号字符，避免PowerShell解析错误
$PercentChar = [char]0x25

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  服务器资源安全检查" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$Server = "${ServerUser}@${ServerHost}"
$hasIssues = $false
$warnings = @()

# 1. 检查SSH连接
Write-Host "[1/8] 检查SSH连接..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes $Server "echo 'SSH OK'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SSH连接: OK" -ForegroundColor Green
    } else {
        Write-Host "  SSH连接: FAILED" -ForegroundColor Red
        Write-Host "  错误: $sshTest" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "  SSH连接: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. 检查内存使用
Write-Host "[2/8] 检查内存使用..." -ForegroundColor Yellow
try {
    $memoryInfo = ssh $Server "free -m | grep Mem" 2>&1
    if ($memoryInfo -match 'Mem:\s+(\d+)\s+(\d+)\s+(\d+)') {
        $totalMem = [int]$matches[1]
        $usedMem = [int]$matches[2]
        $freeMem = [int]$matches[3]
        $memPercent = [math]::Round(($usedMem / $totalMem) * 100, 2)
        
        Write-Host "  总内存: ${totalMem}MB" -ForegroundColor Gray
        $memPercentStr = [math]::Round($memPercent, 2).ToString()
        $memUsageText = "${usedMem}MB (" + $memPercentStr + $PercentChar + ")"
        Write-Host "  已使用: $memUsageText" -ForegroundColor Gray
        Write-Host "  可用: ${freeMem}MB" -ForegroundColor Gray
        
        if ($memPercent -gt 90) {
            Write-Host "  内存使用: CRITICAL (>90%)" -ForegroundColor Red
            $hasIssues = $true
        } elseif ($memPercent -gt 80) {
            Write-Host "  内存使用: WARNING (>80%)" -ForegroundColor Yellow
            $memPercentStr = [math]::Round($memPercent, 2).ToString()
            $warnings += "内存使用率较高 (" + $memPercentStr + $PercentChar + ")"
        } else {
            Write-Host "  内存使用: OK" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  内存检查失败: $_" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 3. 检查磁盘空间
Write-Host "[3/8] 检查磁盘空间..." -ForegroundColor Yellow
try {
    $diskInfo = ssh $Server "df -h / | tail -1" 2>&1
    if ($diskInfo -match '(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)%') {
        $usedPercent = [int]$matches[5]
        $used = $matches[3]
        $avail = $matches[4]
        
        Write-Host "  已使用: $used" -ForegroundColor Gray
        Write-Host "  可用: $avail" -ForegroundColor Gray
        $diskUsageText = "使用率: " + $usedPercent.ToString() + $PercentChar
        Write-Host "  $diskUsageText" -ForegroundColor Gray
        
        if ($usedPercent -gt 90) {
            Write-Host "  磁盘空间: CRITICAL (>90%)" -ForegroundColor Red
            $hasIssues = $true
        } elseif ($usedPercent -gt 80) {
            Write-Host "  磁盘空间: WARNING (>80%)" -ForegroundColor Yellow
            $warnings += "磁盘使用率较高 (" + $usedPercent.ToString() + $PercentChar + ")"
        } else {
            Write-Host "  磁盘空间: OK" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  磁盘检查失败: $_" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 4. 检查CPU负载
Write-Host "[4/8] 检查CPU负载..." -ForegroundColor Yellow
try {
    # 使用更简单的方法获取负载平均值
    $uptimeOutput = ssh $Server "uptime" 2>&1
    
    # 处理数组输出，合并为字符串
    if ($uptimeOutput -is [Array]) {
        $uptimeOutput = ($uptimeOutput | Out-String).Trim()
    }
    
    # 从 uptime 输出中提取负载平均值
    if ($uptimeOutput -match 'load average:\s*([\d.]+)') {
        $load1Str = $matches[1]
        $load1 = 0.0
        if ([double]::TryParse($load1Str, [ref]$load1)) {
            $cpuCountOutput = ssh $Server "nproc" 2>&1
            
            # 处理数组输出
            if ($cpuCountOutput -is [Array]) {
                $cpuCountOutput = ($cpuCountOutput | Out-String).Trim()
            }
            
            $cpuCountStr = $cpuCountOutput.ToString().Trim()
            $cpuCount = 0
            
            if ([int]::TryParse($cpuCountStr, [ref]$cpuCount)) {
                Write-Host "  1分钟负载: $load1" -ForegroundColor Gray
                Write-Host "  CPU核心数: $cpuCount" -ForegroundColor Gray
                
                if ($load1 -gt ($cpuCount * 2)) {
                    Write-Host "  CPU负载: CRITICAL (负载 > 2x CPU核心数)" -ForegroundColor Red
                    $hasIssues = $true
                } elseif ($load1 -gt $cpuCount) {
                    Write-Host "  CPU负载: WARNING (负载 > CPU核心数)" -ForegroundColor Yellow
                    $warnings += "CPU负载较高 ($load1)"
                } else {
                    Write-Host "  CPU负载: OK" -ForegroundColor Green
                }
            } else {
                Write-Host "  CPU负载: 无法解析CPU核心数 (输出: $cpuCountStr)" -ForegroundColor Yellow
                $warnings += "无法解析CPU核心数"
            }
        } else {
            Write-Host "  CPU负载: 无法解析负载值 (输出: $load1Str)" -ForegroundColor Yellow
            $warnings += "无法解析CPU负载信息"
        }
    } else {
        Write-Host "  CPU负载: 无法从uptime输出中提取负载信息" -ForegroundColor Yellow
        Write-Host "  原始输出: $uptimeOutput" -ForegroundColor Gray
        $warnings += "无法解析CPU负载信息"
    }
} catch {
    Write-Host "  CPU检查失败: $_" -ForegroundColor Red
    $hasIssues = $true
}
Write-Host ""

# 5. 检查端口占用
Write-Host "[5/8] 检查端口占用..." -ForegroundColor Yellow
try {
    $ports = @(3000, 3001)
    foreach ($port in $ports) {
        $portCheck = ssh $Server "lsof -i :$port 2>/dev/null | wc -l" 2>&1
        $portCount = [int]$portCheck
        
        if ($portCount -gt 0) {
            Write-Host "  端口 ${port}: 已占用 ($portCount 个进程)" -ForegroundColor Yellow
            $portInfo = ssh $Server "lsof -i :${port} 2>/dev/null | head -3" 2>&1
            Write-Host "    $portInfo" -ForegroundColor Gray
        } else {
            Write-Host "  端口 ${port}: 可用" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "  端口检查失败: $_" -ForegroundColor Red
    $warnings += "无法检查端口占用情况"
}
Write-Host ""

# 6. 检查PM2进程
Write-Host "[6/8] 检查PM2进程..." -ForegroundColor Yellow
try {
    # 先检查PM2是否安装
    $pm2VersionCheck = ssh $Server "pm2 --version 2>&1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PM2已安装: 版本 $pm2VersionCheck" -ForegroundColor Green
        
        # 获取PM2进程列表
        $pm2Status = ssh $Server "pm2 list 2>&1" 2>&1
        
        # 检查是否有错误状态（但仍然是可用的）
        if ($pm2Status -match 'errored') {
            Write-Host "  PM2进程: 发现错误进程（需要修复）" -ForegroundColor Yellow
            $warnings += "PM2中有错误进程（后端服务可能未正常运行）"
        } elseif ($pm2Status -match 'stopped') {
            Write-Host "  PM2进程: 发现停止的进程" -ForegroundColor Yellow
            $warnings += "PM2中有停止的进程"
        } else {
            Write-Host "  PM2进程: 运行正常" -ForegroundColor Green
        }
    } else {
        Write-Host "  PM2未安装或无法访问" -ForegroundColor Yellow
        $warnings += "PM2未安装或无法访问"
    }
} catch {
    Write-Host "  PM2检查失败: $_" -ForegroundColor Red
    $warnings += "无法检查PM2状态"
}
Write-Host ""

# 7. 检查数据库连接
Write-Host "[7/8] 检查数据库连接..." -ForegroundColor Yellow
try {
    $dbCheckOutput = ssh $Server "mysql -u root -e 'SELECT 1' 2>&1" 2>&1
    
    # 处理数组输出
    if ($dbCheckOutput -is [Array]) {
        $dbCheckOutput = ($dbCheckOutput | Out-String).Trim()
    }
    
    $dbCheckStr = $dbCheckOutput.ToString()
    
    # 检查输出内容
    if ($dbCheckStr -match 'ERROR.*Access denied') {
        # 需要密码，这是正常的（数据库有密码保护）
        Write-Host "  数据库连接: 需要密码（正常，数据库有密码保护）" -ForegroundColor Green
    } elseif ($dbCheckStr -match 'ERROR.*Can.*t connect') {
        Write-Host "  数据库连接: 无法连接" -ForegroundColor Yellow
        $warnings += "数据库可能未运行或无法连接"
    } elseif ($LASTEXITCODE -eq 0) {
        Write-Host "  数据库连接: OK" -ForegroundColor Green
    } else {
        Write-Host "  数据库连接: 需要密码或无法连接" -ForegroundColor Yellow
        $warnings += "无法验证数据库连接（可能需要密码）"
    }
} catch {
    Write-Host "  数据库检查失败: $_" -ForegroundColor Yellow
    $warnings += "无法检查数据库连接"
}
Write-Host ""

# 8. 检查Redis连接
Write-Host "[8/8] 检查Redis连接..." -ForegroundColor Yellow
try {
    # 使用超时和错误处理
    $redisCheck = ssh -o ConnectTimeout=5 -o BatchMode=yes $Server "timeout 3 redis-cli ping 2>&1 || echo 'REDIS_ERROR'" 2>&1
    
    # 处理数组输出
    if ($redisCheck -is [Array]) {
        $redisCheck = ($redisCheck | Out-String).Trim()
    }
    
    $redisCheckStr = $redisCheck.ToString()
    
    # 检查是否包含连接超时错误
    if ($redisCheckStr -match 'Connection timed out|ssh: connect to host') {
        Write-Host "  Redis连接: SSH连接超时（可能是网络问题）" -ForegroundColor Yellow
        $warnings += "Redis检查时SSH连接超时（可能是网络问题，不影响部署）"
    } elseif ($redisCheckStr -match 'PONG') {
        Write-Host "  Redis连接: OK" -ForegroundColor Green
    } elseif ($redisCheckStr -match 'REDIS_ERROR|Could not connect|Connection refused') {
        Write-Host "  Redis连接: 无法连接或未运行" -ForegroundColor Yellow
        Write-Host "  输出: $redisCheckStr" -ForegroundColor Gray
        $warnings += "Redis可能未运行或无法连接"
    } else {
        Write-Host "  Redis连接: 无法验证（输出: $redisCheckStr）" -ForegroundColor Yellow
        $warnings += "无法验证Redis连接"
    }
} catch {
    Write-Host "  Redis检查失败: $_" -ForegroundColor Yellow
    $warnings += "无法检查Redis连接（可能是网络问题）"
}
Write-Host ""

# 总结
Write-Host "============================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Host "  ❌ 发现严重问题 - 不建议部署！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先解决以下问题：" -ForegroundColor Yellow
    Write-Host "  - 内存或磁盘空间不足" -ForegroundColor White
    Write-Host "  - CPU负载过高" -ForegroundColor White
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "  1. 清理磁盘空间" -ForegroundColor White
    Write-Host "  2. 检查并停止不必要的进程" -ForegroundColor White
    Write-Host "  3. 等待CPU负载降低" -ForegroundColor White
    Write-Host "  4. 重新运行此检查" -ForegroundColor White
    exit 1
} elseif ($warnings.Count -gt 0) {
    Write-Host "  ⚠️  发现警告 - 建议检查后部署" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "警告信息：" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "  1. 检查警告项" -ForegroundColor White
    Write-Host "  2. 确认可以继续部署" -ForegroundColor White
    exit 0
} else {
    Write-Host "  ✅ 所有检查通过 - 可以安全部署！" -ForegroundColor Green
    exit 0
}

