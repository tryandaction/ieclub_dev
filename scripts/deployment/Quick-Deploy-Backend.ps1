# ============================================
# IEClub 快速部署后端代码到测试环境
# ============================================
# 用途：快速部署修复后的后端代码
# 使用方法：.\scripts\deployment\Quick-Deploy-Backend.ps1
# ============================================

# 🔧 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 项目根目录
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackendDir = "${ProjectRoot}\ieclub-backend"

# 服务器配置
$ServerHost = "ieclub.online"
$ServerUser = "root"
$ServerBackendDir = "/root/IEclub_dev_staging/ieclub-backend"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IEClub 快速部署后端代码到测试环境" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 检查文件是否存在
$AuthControllerFile = "${BackendDir}\src\controllers\authController.js"
if (-not (Test-Path $AuthControllerFile)) {
    Write-Host "[ERROR] 找不到文件: $AuthControllerFile" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] 准备部署文件: $AuthControllerFile" -ForegroundColor Yellow
Write-Host ""

# 复制文件到服务器
Write-Host "[INFO] 正在复制文件到服务器..." -ForegroundColor Yellow
$RemotePath = "${ServerUser}@${ServerHost}:${ServerBackendDir}/src/controllers/authController.js"

try {
    scp -o StrictHostKeyChecking=no $AuthControllerFile $RemotePath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 文件复制失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "[SUCCESS] 文件复制成功！" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] 文件复制失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 重启服务
Write-Host "[INFO] 正在重启后端服务..." -ForegroundColor Yellow
$RestartCommand = "cd ${ServerBackendDir} && pm2 restart staging-backend && pm2 logs staging-backend --lines 30 --nostream"

try {
    ssh -o StrictHostKeyChecking=no "${ServerUser}@${ServerHost}" $RestartCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 服务重启失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "[SUCCESS] 服务重启成功！" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] 服务重启失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ 部署完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] 测试接口: https://test.ieclub.online/api/auth/send-verify-code" -ForegroundColor Yellow
Write-Host "[INFO] 查看日志: ssh ${ServerUser}@${ServerHost} 'pm2 logs staging-backend --lines 50'" -ForegroundColor Yellow
Write-Host ""

