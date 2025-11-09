#!/usr/bin/env pwsh
# ================================================================
# IEClub 生产环境 PM2 修复脚本
# ================================================================
# 用于诊断和修复生产环境的 PM2 进程问题
# ================================================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  IEClub 生产环境 PM2 修复脚本" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$Server = "${ServerUser}@${ServerHost}"

# 1. 检查 PM2 状态
Write-Host "[1/6] 检查 PM2 状态..." -ForegroundColor Yellow
try {
    $pm2Status = ssh $Server "pm2 list" 2>&1
    Write-Host $pm2Status
} catch {
    Write-Host "  ❌ PM2 检查失败: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. 查看错误日志
Write-Host "[2/6] 查看最近的错误日志..." -ForegroundColor Yellow
try {
    $errorLogs = ssh $Server "pm2 logs ieclub-backend --lines 50 --nostream --err 2>&1 | tail -30" 2>&1
    Write-Host $errorLogs
} catch {
    Write-Host "  ⚠️  无法获取错误日志: $_" -ForegroundColor Yellow
}
Write-Host ""

# 3. 检查进程状态
Write-Host "[3/6] 检查进程状态..." -ForegroundColor Yellow
try {
    $processInfo = ssh $Server "ps aux | grep 'node.*ieclub-backend' | grep -v grep" 2>&1
    if ($processInfo) {
        Write-Host $processInfo
    } else {
        Write-Host "  ⚠️  未找到运行中的进程" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  无法检查进程: $_" -ForegroundColor Yellow
}
Write-Host ""

# 4. 检查配置文件
Write-Host "[4/6] 检查配置文件..." -ForegroundColor Yellow
try {
    $configCheck = ssh $Server "cd /root/IEclub_dev/ieclub-backend && ls -la ecosystem*.config.js .env.production 2>&1" 2>&1
    Write-Host $configCheck
} catch {
    Write-Host "  ⚠️  无法检查配置文件: $_" -ForegroundColor Yellow
}
Write-Host ""

# 5. 检查数据库连接
Write-Host "[5/6] 检查数据库连接..." -ForegroundColor Yellow
try {
    $dbCheck = ssh $Server "cd /root/IEclub_dev/ieclub-backend && node -e \"require('dotenv').config({path: '.env.production'}); const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => {console.log('✅ 数据库连接成功'); prisma.\$disconnect()}).catch(e => {console.error('❌ 数据库连接失败:', e.message); process.exit(1)});\"" 2>&1
    Write-Host $dbCheck
} catch {
    Write-Host "  ⚠️  无法检查数据库连接: $_" -ForegroundColor Yellow
}
Write-Host ""

# 6. 修复建议
Write-Host "[6/6] 修复建议..." -ForegroundColor Yellow
Write-Host ""
Write-Host "如果 PM2 进程状态为 errored，请执行以下步骤：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 停止所有 PM2 进程：" -ForegroundColor White
Write-Host "   ssh $Server 'pm2 delete all'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 检查并修复配置文件：" -ForegroundColor White
Write-Host "   ssh $Server 'cd /root/IEclub_dev/ieclub-backend && cat .env.production | grep -E \"DATABASE_URL|JWT_SECRET|NODE_ENV\"'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 重新生成 Prisma 客户端：" -ForegroundColor White
Write-Host "   ssh $Server 'cd /root/IEclub_dev/ieclub-backend && npx prisma generate'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 重新启动服务：" -ForegroundColor White
Write-Host "   ssh $Server 'cd /root/IEclub_dev/ieclub-backend && pm2 start ecosystem.production.config.js'" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 查看日志：" -ForegroundColor White
Write-Host "   ssh $Server 'pm2 logs ieclub-backend --lines 100'" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  诊断完成" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

