#!/usr/bin/env pwsh
# ================================================================
# 检查服务器 .env 配置
# ================================================================

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 检查服务器邮件配置" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$ServerUser = "root"
$ServerHost = "ieclub.online"  # 或 39.108.160.112
$Server = "${ServerUser}@${ServerHost}"

# 生产环境 .env
Write-Host "[1/2] 检查生产环境邮件配置..." -ForegroundColor Yellow
Write-Host "路径: /root/IEclub_dev/ieclub-backend/.env" -ForegroundColor Gray
Write-Host ""
ssh $Server "cat /root/IEclub_dev/ieclub-backend/.env | grep -E '^EMAIL_|^SMTP_' | grep -v PASSWORD"
Write-Host ""

# 显示邮件密码长度（不显示实际密码）
Write-Host "邮件密码检查:" -ForegroundColor Cyan
ssh $Server "grep -E '^EMAIL_PASSWORD=' /root/IEclub_dev/ieclub-backend/.env | cut -d'=' -f2 | awk '{print \"  长度: \" length(\$0) \" 位\"}'"
Write-Host ""

# 测试环境 .env（如果存在）
Write-Host "[2/2] 检查测试环境邮件配置..." -ForegroundColor Yellow
Write-Host "路径: /root/IEclub_dev/ieclub-backend/.env.staging" -ForegroundColor Gray
Write-Host ""
ssh $Server "if [ -f /root/IEclub_dev/ieclub-backend/.env.staging ]; then cat /root/IEclub_dev/ieclub-backend/.env.staging | grep -E '^EMAIL_|^SMTP_' | grep -v PASSWORD; else echo '  文件不存在'; fi"
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "  1. EMAIL_HOST 应该是: smtp.qq.com" -ForegroundColor Gray
Write-Host "  2. EMAIL_PORT 应该是: 587" -ForegroundColor Gray
Write-Host "  3. EMAIL_PASSWORD 长度应该是: 16 位" -ForegroundColor Gray
Write-Host "  4. EMAIL_USER 应该是完整邮箱地址" -ForegroundColor Gray
Write-Host ""
