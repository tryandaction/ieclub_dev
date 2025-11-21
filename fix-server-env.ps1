#!/usr/bin/env pwsh
# ================================================================
# 修复服务器邮件配置
# ================================================================

$ServerUser = "root"
$ServerHost = "ieclub.online"
$Server = "${ServerUser}@${ServerHost}"

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 修复服务器邮件配置" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 备份当前配置..." -ForegroundColor Yellow
ssh $Server "cp /root/IEclub_dev/ieclub-backend/.env /root/IEclub_dev/ieclub-backend/.env.backup.`$(date +%Y%m%d_%H%M%S)"
Write-Host "  ✅ 已备份" -ForegroundColor Green
Write-Host ""

Write-Host "[2/3] 修复生产环境配置..." -ForegroundColor Yellow
$fixScript = @'
cd /root/IEclub_dev/ieclub-backend

# 修复邮件配置
sed -i 's/^EMAIL_PORT=465$/EMAIL_PORT=587/' .env
sed -i 's/^EMAIL_SECURE=true$/EMAIL_SECURE=false/' .env
sed -i 's/^EMAIL_PASS=/EMAIL_PASSWORD=/' .env

# 显示修改后的配置
echo "修改后的邮件配置:"
grep -E '^EMAIL_' .env | grep -v PASSWORD
echo ""
echo "邮件密码:"
grep '^EMAIL_PASSWORD=' .env | cut -d'=' -f2 | awk '{print "  长度: " length($0) " 位"}'
'@

ssh $Server $fixScript
Write-Host ""

Write-Host "[3/3] 重启后端服务..." -ForegroundColor Yellow
ssh $Server "cd /root/IEclub_dev/ieclub-backend && pm2 restart ieclub-backend"
Write-Host "  ✅ 服务已重启" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Green
Write-Host " 修复完成！" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "现在测试发送邮件:" -ForegroundColor Yellow
Write-Host "  curl -X POST https://ieclub.online/api/auth/send-verify-code \" -ForegroundColor Gray
Write-Host "       -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "       -d '{\"email\":\"your@email.com\",\"type\":\"register\"}'" -ForegroundColor Gray
Write-Host ""
