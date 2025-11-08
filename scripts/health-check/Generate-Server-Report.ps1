#!/usr/bin/env pwsh
# ============================================
# 服务器资源诊断报告生成器
# ============================================
# 用途：生成完整的服务器资源和健康状况报告
# 
# 功能：
#   - 系统资源使用情况
#   - 磁盘空间分析
#   - 服务运行状态
#   - 数据库连接状态
#   - 网络连接状态
#   - 最近的错误日志
#   - 性能指标
#
# 使用方法：
#   .\Generate-Server-Report.ps1 [-ServerUser root] [-ServerHost ieclub.online] [-OutputFile report.txt]
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [string]$OutputFile = "server-report-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
)

# 设置控制台编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$report = @()

# --- Helper Functions ---
function Add-ReportSection {
    param([string]$Title)
    $script:report += ""
    $script:report += "=" * 80
    $script:report += "  $Title"
    $script:report += "=" * 80
    $script:report += ""
}

function Add-ReportLine {
    param([string]$Text)
    $script:report += $Text
}

function Invoke-RemoteCommand {
    param([string]$Command)
    
    try {
        $result = ssh -p $ServerPort "${ServerUser}@${ServerHost}" $Command 2>&1
        return $result
    } catch {
        return "ERROR: $_"
    }
}

# --- 开始生成报告 ---
Write-Host "正在生成服务器诊断报告..." -ForegroundColor Cyan
Write-Host "服务器: ${ServerUser}@${ServerHost}:${ServerPort}" -ForegroundColor Gray
Write-Host ""

# 报告头部
Add-ReportLine "╔════════════════════════════════════════════════════════════════════════════╗"
Add-ReportLine "║                     IEClub 服务器诊断报告                                  ║"
Add-ReportLine "╚════════════════════════════════════════════════════════════════════════════╝"
Add-ReportLine ""
Add-ReportLine "生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-ReportLine "服务器: ${ServerHost}"
Add-ReportLine ""

# 1. 系统信息
Write-Host "[1/10] 收集系统信息..." -ForegroundColor Yellow
Add-ReportSection "1. 系统信息"
$result = Invoke-RemoteCommand "uname -a && cat /etc/os-release | grep PRETTY_NAME"
Add-ReportLine $result

# 2. 系统资源
Write-Host "[2/10] 收集系统资源..." -ForegroundColor Yellow
Add-ReportSection "2. 系统资源使用情况"

Add-ReportLine "--- CPU 信息 ---"
$result = Invoke-RemoteCommand "lscpu | grep -E 'Model name|CPU\(s\)|Thread|Core'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 内存使用 ---"
$result = Invoke-RemoteCommand "free -h"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 负载情况 ---"
$result = Invoke-RemoteCommand "uptime"
Add-ReportLine $result

# 3. 磁盘空间
Write-Host "[3/10] 分析磁盘空间..." -ForegroundColor Yellow
Add-ReportSection "3. 磁盘空间分析"

Add-ReportLine "--- 磁盘使用情况 ---"
$result = Invoke-RemoteCommand "df -h"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 最大的目录 (Top 10) ---"
$result = Invoke-RemoteCommand "du -h /root --max-depth=2 2>/dev/null | sort -rh | head -10"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- /var/www 目录大小 ---"
$result = Invoke-RemoteCommand "du -sh /var/www/* 2>/dev/null"
Add-ReportLine $result

# 4. 服务状态
Write-Host "[4/10] 检查服务状态..." -ForegroundColor Yellow
Add-ReportSection "4. 服务运行状态"

Add-ReportLine "--- Nginx 状态 ---"
$result = Invoke-RemoteCommand "systemctl status nginx --no-pager | head -20"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- MySQL 状态 ---"
$result = Invoke-RemoteCommand "systemctl status mysql --no-pager | head -20"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- PM2 进程列表 ---"
$result = Invoke-RemoteCommand "pm2 list"
Add-ReportLine $result

# 5. PM2 详细信息
Write-Host "[5/10] 收集 PM2 信息..." -ForegroundColor Yellow
Add-ReportSection "5. PM2 应用详情"

Add-ReportLine "--- ieclub-backend (生产) ---"
$result = Invoke-RemoteCommand "pm2 info ieclub-backend 2>/dev/null || echo '未运行'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- ieclub-backend-staging (测试) ---"
$result = Invoke-RemoteCommand "pm2 info ieclub-backend-staging 2>/dev/null || echo '未运行'"
Add-ReportLine $result

# 6. 数据库状态
Write-Host "[6/10] 检查数据库..." -ForegroundColor Yellow
Add-ReportSection "6. 数据库状态"

Add-ReportLine "--- MySQL 进程 ---"
$result = Invoke-RemoteCommand "ps aux | grep mysql | grep -v grep"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 数据库连接数 ---"
$result = Invoke-RemoteCommand "mysql -e 'SHOW STATUS LIKE \"%Threads_connected%\";' 2>/dev/null || echo '无法连接'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 数据库列表 ---"
$result = Invoke-RemoteCommand "mysql -e 'SHOW DATABASES;' 2>/dev/null || echo '无法连接'"
Add-ReportLine $result

# 7. 网络状态
Write-Host "[7/10] 检查网络连接..." -ForegroundColor Yellow
Add-ReportSection "7. 网络连接状态"

Add-ReportLine "--- 监听端口 ---"
$result = Invoke-RemoteCommand "ss -tlnp | grep -E 'LISTEN|:80|:443|:3000|:3001|:3306'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 活动连接数 ---"
$result = Invoke-RemoteCommand "ss -s"
Add-ReportLine $result

# 8. 日志分析
Write-Host "[8/10] 分析日志..." -ForegroundColor Yellow
Add-ReportSection "8. 最近的错误日志"

Add-ReportLine "--- PM2 错误日志 (最近20行) ---"
$result = Invoke-RemoteCommand "pm2 logs ieclub-backend --err --lines 20 --nostream 2>/dev/null || echo '无日志'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- Nginx 错误日志 (最近10行) ---"
$result = Invoke-RemoteCommand "tail -10 /var/log/nginx/error.log 2>/dev/null || echo '无法访问'"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 系统日志错误 (最近10条) ---"
$result = Invoke-RemoteCommand "journalctl -p err -n 10 --no-pager 2>/dev/null || echo '无法访问'"
Add-ReportLine $result

# 9. 安全检查
Write-Host "[9/10] 执行安全检查..." -ForegroundColor Yellow
Add-ReportSection "9. 安全检查"

Add-ReportLine "--- 防火墙状态 ---"
$result = Invoke-RemoteCommand "ufw status 2>/dev/null || iptables -L -n | head -20"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 最近的登录 ---"
$result = Invoke-RemoteCommand "last -10"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 失败的登录尝试 ---"
$result = Invoke-RemoteCommand "lastb -10 2>/dev/null || echo '无记录'"
Add-ReportLine $result

# 10. 性能指标
Write-Host "[10/10] 收集性能指标..." -ForegroundColor Yellow
Add-ReportSection "10. 性能指标"

Add-ReportLine "--- 最消耗 CPU 的进程 (Top 10) ---"
$result = Invoke-RemoteCommand "ps aux --sort=-%cpu | head -11"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- 最消耗内存的进程 (Top 10) ---"
$result = Invoke-RemoteCommand "ps aux --sort=-%mem | head -11"
Add-ReportLine $result
Add-ReportLine ""

Add-ReportLine "--- I/O 统计 ---"
$result = Invoke-RemoteCommand "iostat -x 1 2 2>/dev/null || echo 'iostat 未安装'"
Add-ReportLine $result

# 健康评分
Add-ReportSection "11. 健康评分"

$healthScore = 100
$issues = @()

# 检查磁盘使用率
$diskUsage = Invoke-RemoteCommand "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'"
if ([int]$diskUsage -gt 80) {
    $healthScore -= 20
    $issues += "⚠️  磁盘使用率过高: ${diskUsage}%"
}

# 检查内存使用率
$memUsage = Invoke-RemoteCommand "free | grep Mem | awk '{printf(\"%d\", \$3/\$2*100)}'"
if ([int]$memUsage -gt 85) {
    $healthScore -= 15
    $issues += "⚠️  内存使用率过高: ${memUsage}%"
}

# 检查服务状态
$nginxStatus = Invoke-RemoteCommand "systemctl is-active nginx"
if ($nginxStatus -ne "active") {
    $healthScore -= 25
    $issues += "❌ Nginx 未运行"
}

$mysqlStatus = Invoke-RemoteCommand "systemctl is-active mysql"
if ($mysqlStatus -ne "active") {
    $healthScore -= 25
    $issues += "❌ MySQL 未运行"
}

$pm2Status = Invoke-RemoteCommand "pm2 list | grep -c online"
if ([int]$pm2Status -eq 0) {
    $healthScore -= 15
    $issues += "⚠️  没有 PM2 进程在运行"
}

Add-ReportLine "总体健康评分: $healthScore / 100"
Add-ReportLine ""

if ($issues.Count -eq 0) {
    Add-ReportLine "✅ 服务器状态良好，未发现明显问题"
} else {
    Add-ReportLine "发现以下问题："
    foreach ($issue in $issues) {
        Add-ReportLine "  $issue"
    }
}

Add-ReportLine ""
Add-ReportLine "建议："
if ($healthScore -ge 90) {
    Add-ReportLine "  ✅ 服务器运行状况优秀"
} elseif ($healthScore -ge 70) {
    Add-ReportLine "  ⚠️  服务器运行基本正常，但有改进空间"
} else {
    Add-ReportLine "  ❌ 服务器存在严重问题，需要立即处理"
}

# 报告尾部
Add-ReportLine ""
Add-ReportLine "╔════════════════════════════════════════════════════════════════════════════╗"
Add-ReportLine "║                         报告生成完成                                       ║"
Add-ReportLine "╚════════════════════════════════════════════════════════════════════════════╝"

# 保存报告
$report | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "✅ 报告已生成: $OutputFile" -ForegroundColor Green
Write-Host ""
Write-Host "健康评分: $healthScore / 100" -ForegroundColor $(if ($healthScore -ge 90) { "Green" } elseif ($healthScore -ge 70) { "Yellow" } else { "Red" })

if ($issues.Count -gt 0) {
    Write-Host ""
    Write-Host "发现的问题:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  $issue" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 查看完整报告: cat $OutputFile" -ForegroundColor Gray
Write-Host "   - 定期生成报告以跟踪服务器健康状况" -ForegroundColor Gray
Write-Host "   - 健康评分低于70时应立即检查" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

