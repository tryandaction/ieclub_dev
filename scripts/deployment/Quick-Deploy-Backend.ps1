#!/usr/bin/env pwsh
# 快速部署后端到生产环境（跳过Git流程）

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  快速部署后端到生产环境" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$Server = "${ServerUser}@${ServerHost}"
$BackendDir = "/root/IEclub_dev/ieclub-backend"

try {
    Write-Host "[1/7] 连接服务器..." -ForegroundColor Yellow
    ssh -o ConnectTimeout=10 $Server "echo '连接成功'" | Out-Null
    Write-Host "✅ 服务器连接正常" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[2/7] 检查PM2进程状态..." -ForegroundColor Yellow
    ssh $Server "pm2 list" | Write-Host
    Write-Host ""
    
    Write-Host "[3/7] 停止旧进程..." -ForegroundColor Yellow
    ssh $Server "pm2 delete ieclub-backend 2>&1; exit 0" | Write-Host
    Write-Host "✅ 旧进程已停止" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[4/7] 检查代码目录..." -ForegroundColor Yellow
    $dirCheck = ssh $Server "cd $BackendDir; pwd; ls -la src/server.js 2>&1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: 后端目录或文件不存在" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ 代码目录正常" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[5/7] 安装依赖和生成Prisma..." -ForegroundColor Yellow
    $deployScript = "cd $BackendDir; echo 'Installing dependencies...'; npm install --production=false --loglevel=error; echo 'Generating Prisma client...'; npx prisma generate; echo 'Running migrations...'; npx prisma migrate deploy 2>&1; exit 0"
    ssh $Server $deployScript | Write-Host
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[6/7] 启动后端服务..." -ForegroundColor Yellow
    $startScript = @"
cd $BackendDir
pm2 start src/server.js --name ieclub-backend --time
pm2 save
"@
    ssh $Server $startScript | Write-Host
    Write-Host "✅ 服务已启动" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "[7/7] 等待服务启动并检查状态..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    ssh $Server "pm2 status" | Write-Host
    Write-Host ""
    
    Write-Host "查看最近日志..." -ForegroundColor Yellow
    ssh $Server "pm2 logs ieclub-backend --lines 30 --nostream" | Write-Host
    Write-Host ""
    
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  ✅ 部署完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "查看实时日志: ssh $Server 'pm2 logs ieclub-backend'" -ForegroundColor Cyan
    Write-Host "健康检查: curl https://ieclub.online/api/health" -ForegroundColor Cyan
    Write-Host "PM2状态: ssh $Server 'pm2 status'" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ 部署失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动检查:" -ForegroundColor Yellow
    Write-Host "  1. 服务器连接: ssh $Server" -ForegroundColor White
    Write-Host "  2. 后端目录: cd $BackendDir" -ForegroundColor White
    Write-Host "  3. 查看日志: pm2 logs ieclub-backend" -ForegroundColor White
    exit 1
}

