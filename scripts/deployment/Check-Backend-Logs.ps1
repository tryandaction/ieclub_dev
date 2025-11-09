#!/usr/bin/env pwsh
# ================================================================
# IEClub 后端日志检查脚本
# ================================================================
# 用于检查后端服务的错误日志，帮助诊断问题
# ================================================================

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "test.ieclub.online"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  IEClub 后端日志检查脚本" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$Server = "${ServerUser}@${ServerHost}"

# 1. 检查 PM2 日志
Write-Host "[1/4] 检查 PM2 错误日志（最近50行）..." -ForegroundColor Yellow
try {
    $errorLogs = ssh $Server "pm2 logs ieclub-backend --lines 50 --nostream --err 2>&1 | tail -50" 2>&1
    Write-Host $errorLogs
} catch {
    Write-Host "  ⚠️  无法获取错误日志: $_" -ForegroundColor Yellow
}
Write-Host ""

# 2. 检查 PM2 输出日志
Write-Host "[2/4] 检查 PM2 输出日志（最近50行）..." -ForegroundColor Yellow
try {
    $outLogs = ssh $Server "pm2 logs ieclub-backend --lines 50 --nostream --out 2>&1 | tail -50" 2>&1
    Write-Host $outLogs
} catch {
    Write-Host "  ⚠️  无法获取输出日志: $_" -ForegroundColor Yellow
}
Write-Host ""

# 3. 检查系统日志
Write-Host "[3/4] 检查系统日志（最近20行）..." -ForegroundColor Yellow
try {
    $sysLogs = ssh $Server "journalctl -u ieclub-backend -n 20 --no-pager 2>&1 || tail -20 /var/log/syslog 2>&1" 2>&1
    Write-Host $sysLogs
} catch {
    Write-Host "  ⚠️  无法获取系统日志: $_" -ForegroundColor Yellow
}
Write-Host ""

# 4. 检查数据库连接
Write-Host "[4/4] 检查数据库连接..." -ForegroundColor Yellow
try {
    $dbCheck = ssh $Server "cd /root/IEclub_dev/ieclub-backend && node -e \"require('dotenv').config({path: '.env.staging'}); const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => {console.log('✅ 数据库连接成功'); prisma.\$disconnect()}).catch(e => {console.error('❌ 数据库连接失败:', e.message); process.exit(1)});\"" 2>&1
    Write-Host $dbCheck
} catch {
    Write-Host "  ⚠️  无法检查数据库连接: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  日志检查完成" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示：如果看到数据库连接错误，请检查：" -ForegroundColor Yellow
Write-Host "  1. .env.staging 文件中的 DATABASE_URL 配置" -ForegroundColor Gray
Write-Host "  2. 数据库服务是否正常运行" -ForegroundColor Gray
Write-Host "  3. 数据库网络连接是否正常" -ForegroundColor Gray
Write-Host ""

