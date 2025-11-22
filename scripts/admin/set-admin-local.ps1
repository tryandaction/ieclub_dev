#!/usr/bin/env pwsh
# 本地快速设置测试环境管理员脚本

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 测试环境管理员设置" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# 获取邮箱地址
$adminEmail = Read-Host "请输入管理员邮箱（学校邮箱）"

if (-not $adminEmail) {
    Write-Host ""
    Write-Host "❌ 邮箱不能为空" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# 验证是否是学校邮箱
if ($adminEmail -notmatch "@mail\.sustech\.edu\.cn$") {
    Write-Host ""
    Write-Host "⚠️  警告: 建议使用学校邮箱（@mail.sustech.edu.cn）" -ForegroundColor Yellow
    $confirm = Read-Host "是否继续？(Y/N)"
    if ($confirm -ne 'Y' -and $confirm -ne 'y') {
        Write-Host "已取消" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "正在设置管理员..." -ForegroundColor Yellow
Write-Host ""

# 在服务器上执行设置
ssh root@ieclub.online "cd /root/IEclub_dev_staging/ieclub-backend && node set-admin-staging.js '$adminEmail'"

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host " ✅ 设置完成！" -ForegroundColor Green
    Write-Host "=" * 60 -ForegroundColor Green
    Write-Host ""
    Write-Host "测试环境访问:" -ForegroundColor Cyan
    Write-Host "  用户端: https://test.ieclub.online" -ForegroundColor Gray
    Write-Host "  管理后台: https://test.ieclub.online/admin" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "=" * 60 -ForegroundColor Red
    Write-Host " ❌ 设置失败" -ForegroundColor Red
    Write-Host "=" * 60 -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "  1. 用户是否已在测试环境注册" -ForegroundColor Gray
    Write-Host "  2. 邮箱地址是否正确" -ForegroundColor Gray
    Write-Host "  3. 服务器连接是否正常" -ForegroundColor Gray
    Write-Host ""
}
