# ============================================
# IEClub 服务器维护脚本
# ============================================
# 功能：
#   - 监控服务器资源
#   - 清理缓存和临时文件
#   - 优化磁盘空间
# ============================================

param(
    [ValidateSet("check", "clean", "optimize", "all")]
    [string]$Action = "check"
)

$ServerUser = "root"
$ServerHost = "ieclub.online"

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

# --- 检查服务器资源 ---
function Check-ServerResources {
    Write-Host "`n=== 📊 服务器资源检查 ===" -ForegroundColor Cyan
    
    $checkScript = @"
#!/bin/bash

echo ''
echo '=== 内存使用 ==='
free -h

echo ''
echo '=== 磁盘使用 ==='
df -h | grep -E 'Filesystem|/dev/vda'

echo ''
echo '=== CPU负载 ==='
uptime

echo ''
echo '=== 进程状态 ==='
pm2 list

echo ''
echo '=== 最占内存的进程 (Top 5) ==='
ps aux --sort=-%mem | head -6

echo ''
echo '=== 磁盘空间占用 (Top 10) ==='
du -h /root 2>/dev/null | sort -rh | head -10

echo ''
echo '=== node_modules 大小 ==='
du -sh /root/IEclub_dev/ieclub-backend/node_modules 2>/dev/null || echo '未找到'
du -sh /root/IEclub_dev_staging/ieclub-backend/node_modules 2>/dev/null || echo '未找到'

echo ''
echo '=== PM2 日志大小 ==='
du -sh ~/.pm2/logs 2>/dev/null || echo '未找到'
"@
    
    ssh "${ServerUser}@${ServerHost}" "bash -c '$checkScript'"
}

# --- 清理缓存 ---
function Clean-ServerCache {
    Write-Host "`n=== 🧹 清理服务器缓存 ===" -ForegroundColor Cyan
    
    $cleanScript = @"
#!/bin/bash

echo '[INFO] 清理npm缓存...'
npm cache clean --force 2>/dev/null && echo '[SUCCESS] npm缓存已清理' || echo '[WARN] npm缓存清理失败'

echo ''
echo '[INFO] 清理PM2日志...'
pm2 flush && echo '[SUCCESS] PM2日志已清理'

echo ''
echo '[INFO] 清理旧备份文件 (>7天)...'
find /root -name '*.backup_*' -mtime +7 -delete 2>/dev/null && echo '[SUCCESS] 旧备份已清理'

echo ''
echo '[INFO] 清理临时文件...'
rm -rf /tmp/*.zip 2>/dev/null
rm -rf /tmp/deploy-*.sh 2>/dev/null
echo '[SUCCESS] 临时文件已清理'

echo ''
echo '[INFO] 清理apt缓存...'
apt-get clean 2>/dev/null && echo '[SUCCESS] apt缓存已清理' || echo '[WARN] apt缓存清理失败'

echo ''
echo '=== 清理后磁盘使用 ==='
df -h | grep -E 'Filesystem|/dev/vda'
"@
    
    Write-Warning "将清理：npm缓存、PM2日志、旧备份、临时文件"
    $confirm = Read-Host "继续? (Y/N)"
    if ($confirm -ne 'Y') {
        Write-Info "清理已取消"
        return
    }
    
    ssh "${ServerUser}@${ServerHost}" "bash -c '$cleanScript'"
    Write-Success "清理完成"
}

# --- 优化配置 ---
function Optimize-Server {
    Write-Host "`n=== ⚡ 优化服务器配置 ===" -ForegroundColor Cyan
    
    $optimizeScript = @"
#!/bin/bash

echo '[INFO] 检查测试环境node_modules...'
if [ -d '/root/IEclub_dev_staging/ieclub-backend/node_modules' ] && [ ! -L '/root/IEclub_dev_staging/ieclub-backend/node_modules' ]; then
    echo '[INFO] 测试环境有独立的node_modules，可以优化'
    echo '[ACTION] 将创建软链接到生产环境node_modules'
    
    cd /root/IEclub_dev_staging/ieclub-backend
    
    # 备份现有node_modules大小
    BEFORE_SIZE=\$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "[INFO] 当前测试环境node_modules大小: \$BEFORE_SIZE"
    
    # 删除并创建软链接
    rm -rf node_modules
    ln -s /root/IEclub_dev/ieclub-backend/node_modules node_modules
    
    echo '[SUCCESS] 软链接创建完成'
    echo '[INFO] 节省磁盘空间: \$BEFORE_SIZE'
else
    echo '[INFO] 测试环境已使用软链接，无需优化'
fi

echo ''
echo '[INFO] 配置PM2日志轮转...'
pm2 install pm2-logrotate 2>/dev/null || echo '[INFO] pm2-logrotate已安装'
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
echo '[SUCCESS] PM2日志轮转已配置 (单文件最大10M，保留5个)'

echo ''
echo '[INFO] Git仓库优化...'
cd /root/IEclub_dev && git gc --quiet && echo '[SUCCESS] 生产环境仓库已优化'
cd /root/IEclub_dev_staging && git gc --quiet && echo '[SUCCESS] 测试环境仓库已优化'

echo ''
echo '=== 优化后资源使用 ==='
df -h | grep -E 'Filesystem|/dev/vda'
free -h
"@
    
    Write-Info "将执行优化："
    Write-Info "  1. 测试环境node_modules改为软链接（节省空间）"
    Write-Info "  2. 配置PM2日志自动轮转"
    Write-Info "  3. Git仓库垃圾回收"
    
    $confirm = Read-Host "继续? (Y/N)"
    if ($confirm -ne 'Y') {
        Write-Info "优化已取消"
        return
    }
    
    ssh "${ServerUser}@${ServerHost}" "bash -c '$optimizeScript'"
    Write-Success "优化完成"
}

# --- Main ---
Write-Host "`n================================================================" -ForegroundColor Yellow
Write-Host "  IEClub 服务器维护工具" -ForegroundColor Yellow
Write-Host "================================================================`n" -ForegroundColor Yellow

switch ($Action) {
    "check" {
        Check-ServerResources
    }
    "clean" {
        Clean-ServerCache
    }
    "optimize" {
        Optimize-Server
    }
    "all" {
        Check-ServerResources
        Write-Host "`n按Enter继续清理..." -ForegroundColor Yellow
        Read-Host
        Clean-ServerCache
        Write-Host "`n按Enter继续优化..." -ForegroundColor Yellow
        Read-Host
        Optimize-Server
        Write-Host "`n最终检查..." -ForegroundColor Yellow
        Check-ServerResources
    }
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  维护完成" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green
