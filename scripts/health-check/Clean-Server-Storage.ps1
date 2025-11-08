#!/usr/bin/env pwsh
# ============================================
# 服务器存储清理脚本
# ============================================
# 用途：清理服务器上的冗余文件，释放磁盘空间
# 
# 功能：
#   - 清理旧的备份文件（保留最近3个）
#   - 清理临时文件
#   - 清理 PM2 日志（保留最近7天）
#   - 清理 node_modules 缓存
#   - 清理 npm 缓存
#
# 使用方法：
#   .\Clean-Server-Storage.ps1 [-ServerUser root] [-ServerHost ieclub.online] [-DryRun]
#
# 参数：
#   -DryRun: 仅显示将要删除的文件，不实际删除
# ============================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [switch]$DryRun
)

# 设置控制台编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

# --- 执行远程命令 ---
function Invoke-RemoteCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Info $Description
    
    try {
        $result = ssh -p $ServerPort "${ServerUser}@${ServerHost}" $Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "完成"
            if ($result) {
                Write-Host $result -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Warning "命令执行失败"
            if ($result) {
                Write-Host $result -ForegroundColor Yellow
            }
            return $false
        }
    } catch {
        Write-Error "执行失败: $_"
        return $false
    }
}

# --- 主函数 ---
Write-Section "服务器存储清理工具"

if ($DryRun) {
    Write-Warning "⚠️  DRY RUN 模式：仅显示将要删除的文件，不实际删除"
    Write-Host ""
}

Write-Info "连接到服务器: ${ServerUser}@${ServerHost}:${ServerPort}"
Write-Host ""

# 1. 检查当前磁盘使用情况
Write-Section "1️⃣ 当前磁盘使用情况"
Invoke-RemoteCommand "df -h | grep -E '^/dev|Filesystem'" "查询磁盘使用情况"

# 2. 清理旧备份文件
Write-Section "2️⃣ 清理旧备份文件（保留最近3个）"

$backupDirs = @(
    "/var/www",
    "/root/IEclub_dev",
    "/root/IEclub_dev_staging"
)

foreach ($dir in $backupDirs) {
    Write-Info "检查目录: $dir"
    
    if ($DryRun) {
        $listCmd = "cd $dir 2>/dev/null && ls -dt *.backup_* */ieclub-backend.backup_* 2>/dev/null | tail -n +4 || echo '无旧备份'"
        Invoke-RemoteCommand $listCmd "列出将要删除的备份"
    } else {
        $cleanCmd = "cd $dir 2>/dev/null && ls -dt *.backup_* */ieclub-backend.backup_* 2>/dev/null | tail -n +4 | xargs -r rm -rf && echo '已清理旧备份' || echo '无旧备份'"
        Invoke-RemoteCommand $cleanCmd "清理旧备份"
    }
}

# 3. 清理临时文件
Write-Section "3️⃣ 清理临时文件"

$tempFiles = @(
    "/tmp/*.zip",
    "/tmp/deploy-*.sh",
    "/tmp/web-dist",
    "/tmp/web-dist.zip",
    "/tmp/backend-code.zip",
    "/tmp/backend-staging.zip",
    "/tmp/backend-production.zip"
)

foreach ($pattern in $tempFiles) {
    Write-Info "清理: $pattern"
    
    if ($DryRun) {
        $listCmd = "ls -lh $pattern 2>/dev/null || echo '无匹配文件'"
        Invoke-RemoteCommand $listCmd "列出匹配文件"
    } else {
        $cleanCmd = "rm -rf $pattern 2>/dev/null && echo '已清理' || echo '无匹配文件'"
        Invoke-RemoteCommand $cleanCmd "删除文件"
    }
}

# 4. 清理 PM2 日志（保留最近7天）
Write-Section "4️⃣ 清理 PM2 日志（保留最近7天）"

if ($DryRun) {
    Invoke-RemoteCommand "find /root/.pm2/logs -name '*.log' -type f -mtime +7 2>/dev/null | head -20 || echo '无旧日志'" "列出旧日志文件"
} else {
    Invoke-RemoteCommand "find /root/.pm2/logs -name '*.log' -type f -mtime +7 -delete 2>/dev/null && echo '已清理旧日志' || echo '无旧日志'" "清理旧日志"
    
    # 清空当前日志文件（保留文件但清空内容）
    Write-Info "清空当前日志文件（保留最近100行）..."
    Invoke-RemoteCommand "pm2 flush" "清空 PM2 日志缓冲区"
}

# 5. 清理 npm 缓存
Write-Section "5️⃣ 清理 npm 缓存"

if ($DryRun) {
    Invoke-RemoteCommand "du -sh ~/.npm 2>/dev/null || echo '无 npm 缓存'" "查看 npm 缓存大小"
} else {
    Invoke-RemoteCommand "npm cache clean --force 2>&1 | head -5" "清理 npm 缓存"
}

# 6. 清理未使用的 Docker 资源（如果有）
Write-Section "6️⃣ 清理 Docker 资源（如果安装）"

$dockerCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "command -v docker" 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($DryRun) {
        Invoke-RemoteCommand "docker system df 2>/dev/null" "查看 Docker 磁盘使用"
    } else {
        Write-Warning "发现 Docker，是否清理未使用的镜像和容器？(Y/N)"
        $confirm = Read-Host
        if ($confirm -eq 'Y' -or $confirm -eq 'y') {
            Invoke-RemoteCommand "docker system prune -af --volumes 2>&1 | tail -10" "清理 Docker 资源"
        } else {
            Write-Info "跳过 Docker 清理"
        }
    }
} else {
    Write-Info "未安装 Docker，跳过"
}

# 7. 清理系统日志（可选）
Write-Section "7️⃣ 清理系统日志（保留最近30天）"

if ($DryRun) {
    Invoke-RemoteCommand "journalctl --disk-usage 2>/dev/null || echo '无法查询'" "查看系统日志大小"
} else {
    Write-Warning "是否清理系统日志（保留最近30天）？(Y/N)"
    $confirm = Read-Host
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        Invoke-RemoteCommand "journalctl --vacuum-time=30d 2>&1 | tail -5" "清理系统日志"
    } else {
        Write-Info "跳过系统日志清理"
    }
}

# 8. 最终磁盘使用情况
Write-Section "8️⃣ 清理后磁盘使用情况"
Invoke-RemoteCommand "df -h | grep -E '^/dev|Filesystem'" "查询磁盘使用情况"

# 9. 显示最大文件/目录
Write-Section "9️⃣ 最大的文件和目录（Top 10）"
Invoke-RemoteCommand "du -ah /root 2>/dev/null | sort -rh | head -10" "查找最大文件"

# 总结
Write-Section "✅ 清理完成"

if ($DryRun) {
    Write-Warning "这是 DRY RUN 模式，未实际删除任何文件"
    Write-Info "要实际执行清理，请运行: .\Clean-Server-Storage.ps1"
} else {
    Write-Success "服务器存储清理完成！"
    Write-Host ""
    Write-Info "建议："
    Write-Host "  1. 定期运行此脚本（每月一次）" -ForegroundColor Gray
    Write-Host "  2. 监控磁盘使用情况" -ForegroundColor Gray
    Write-Host "  3. 配置日志轮转策略" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 使用 -DryRun 参数预览将要删除的文件" -ForegroundColor Gray
Write-Host "   - 备份文件保留最近3个版本" -ForegroundColor Gray
Write-Host "   - PM2 日志保留最近7天" -ForegroundColor Gray
Write-Host "   - 系统日志保留最近30天" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan


