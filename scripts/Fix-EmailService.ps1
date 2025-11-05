# ===== 修复测试服务器邮件服务 500 错误 =====
# 日期: 2025-11-05
# 用途: 部署邮件服务修复补丁到测试环境

param(
    [string]$ServerHost = "test.ieclub.online",
    [string]$ServerUser = "root",
    [string]$BackendPath = "/root/ieclub_backend"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🔧 开始修复测试服务器邮件服务..." -ForegroundColor Cyan

# 检查SSH连接
Write-Host "`n1️⃣  检查SSH连接..." -ForegroundColor Yellow
try {
    ssh "${ServerUser}@${ServerHost}" "echo '连接成功'" | Out-Null
    Write-Host "✅ SSH连接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法连接到服务器，请检查网络和SSH配置" -ForegroundColor Red
    exit 1
}

# 备份当前文件
Write-Host "`n2️⃣  备份当前文件..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" @"
cd $BackendPath && \
cp src/controllers/authController.js src/controllers/authController.js.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss') && \
cp src/services/emailService.js src/services/emailService.js.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss') && \
echo '备份完成'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 文件备份成功" -ForegroundColor Green
} else {
    Write-Host "❌ 文件备份失败" -ForegroundColor Red
    exit 1
}

# 上传修复后的文件
Write-Host "`n3️⃣  上传修复后的文件..." -ForegroundColor Yellow
scp ieclub-backend/src/controllers/authController.js "${ServerUser}@${ServerHost}:${BackendPath}/src/controllers/"
scp ieclub-backend/src/services/emailService.js "${ServerUser}@${ServerHost}:${BackendPath}/src/services/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 文件上传成功" -ForegroundColor Green
} else {
    Write-Host "❌ 文件上传失败" -ForegroundColor Red
    exit 1
}

# 重启服务
Write-Host "`n4️⃣  重启后端服务..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" "cd $BackendPath && pm2 restart ieclub-backend"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 服务重启成功" -ForegroundColor Green
} else {
    Write-Host "❌ 服务重启失败" -ForegroundColor Red
    exit 1
}

# 等待服务启动
Write-Host "`n5️⃣  等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✅ 等待完成" -ForegroundColor Green

# 检查服务状态
Write-Host "`n6️⃣  检查服务状态..." -ForegroundColor Yellow
ssh "${ServerUser}@${ServerHost}" "pm2 status ieclub-backend"

# 查看最新日志
Write-Host "`n7️⃣  查看最新日志..." -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
ssh "${ServerUser}@${ServerHost}" "pm2 logs ieclub-backend --lines 30 --nostream"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 完成提示
Write-Host "`n✨ 修复部署完成！" -ForegroundColor Green
Write-Host "`n📋 后续测试步骤：" -ForegroundColor Yellow
Write-Host "1. 访问测试网站：https://test.ieclub.online" -ForegroundColor White
Write-Host "2. 尝试发送验证码（会在响应中返回验证码）" -ForegroundColor White
Write-Host "3. 使用验证码登录" -ForegroundColor White
Write-Host "4. 检查控制台日志是否有错误" -ForegroundColor White

Write-Host "`n💡 提示：" -ForegroundColor Yellow
Write-Host "- 开发环境会直接返回验证码（无需查看邮箱）" -ForegroundColor White
Write-Host "- 生产环境需要配置真实邮件服务" -ForegroundColor White
Write-Host "- 如需回滚，备份文件位于服务器的 .backup-* 文件" -ForegroundColor White

Write-Host "`n📚 详细文档：" -ForegroundColor Yellow
Write-Host "docs/debugging/EMAIL_SERVICE_FIX_2025_11_05.md" -ForegroundColor White

# API测试示例
Write-Host "`n🧪 API测试命令：" -ForegroundColor Yellow
Write-Host @"

# 1. 发送验证码
curl -X POST https://test.ieclub.online/api/auth/send-verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"12310203@mail.sustech.edu.cn","type":"login"}'

# 2. 验证码登录（使用上面返回的验证码）
curl -X POST https://test.ieclub.online/api/auth/login-with-code \
  -H "Content-Type: application/json" \
  -d '{"email":"12310203@mail.sustech.edu.cn","code":"YOUR_CODE_HERE"}'

"@ -ForegroundColor Gray

Write-Host "`n✅ 所有步骤完成！`n" -ForegroundColor Green

