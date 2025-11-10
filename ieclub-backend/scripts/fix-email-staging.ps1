# ieclub-backend/scripts/fix-email-staging.ps1
# 修复测试环境邮件服务配置

Write-Host "`n📧 测试环境邮件服务配置修复工具`n" -ForegroundColor Cyan
Write-Host "=" * 60

$backendPath = Join-Path $PSScriptRoot ".."
$envFile = Join-Path $backendPath ".env.staging"

# 检查 .env.staging 文件是否存在
if (-not (Test-Path $envFile)) {
    Write-Host "`n❌ 未找到 .env.staging 文件" -ForegroundColor Red
    Write-Host "📝 正在从模板创建..." -ForegroundColor Yellow
    
    $templateFile = Join-Path $backendPath "env.staging.template"
    if (Test-Path $templateFile) {
        Copy-Item $templateFile $envFile
        Write-Host "✅ 已创建 .env.staging 文件" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到 env.staging.template 文件" -ForegroundColor Red
        exit 1
    }
}

# 读取当前配置
Write-Host "`n📋 当前邮件配置:" -ForegroundColor Cyan
$envContent = Get-Content $envFile -Raw
$lines = Get-Content $envFile

$emailConfig = @{
    EMAIL_HOST = $null
    EMAIL_PORT = $null
    EMAIL_SECURE = $null
    EMAIL_USER = $null
    EMAIL_PASSWORD = $null
    EMAIL_FROM = $null
}

foreach ($line in $lines) {
    if ($line -match '^EMAIL_') {
        $key = ($line -split '=')[0].Trim()
        $value = ($line -split '=', 2)[1].Trim()
        if ($emailConfig.ContainsKey($key)) {
            $emailConfig[$key] = $value
        }
    }
}

Write-Host "  EMAIL_HOST: $($emailConfig.EMAIL_HOST -replace '^$', '未设置')"
Write-Host "  EMAIL_PORT: $($emailConfig.EMAIL_PORT -replace '^$', '未设置')"
Write-Host "  EMAIL_SECURE: $($emailConfig.EMAIL_SECURE -replace '^$', '未设置')"
Write-Host "  EMAIL_USER: $($emailConfig.EMAIL_USER -replace '^$', '未设置')"
Write-Host "  EMAIL_PASSWORD: $($emailConfig.EMAIL_PASSWORD -replace '^$', '未设置')"
Write-Host "  EMAIL_FROM: $($emailConfig.EMAIL_FROM -replace '^$', '未设置')"

# 检查配置完整性
$missing = @()
if (-not $emailConfig.EMAIL_HOST -or $emailConfig.EMAIL_HOST -eq 'your_email@gmail.com') {
    $missing += "EMAIL_HOST"
}
if (-not $emailConfig.EMAIL_USER -or $emailConfig.EMAIL_USER -eq 'your_email@gmail.com') {
    $missing += "EMAIL_USER"
}
if (-not $emailConfig.EMAIL_PASSWORD -or $emailConfig.EMAIL_PASSWORD -eq 'your_app_specific_password') {
    $missing += "EMAIL_PASSWORD"
}

if ($missing.Count -gt 0) {
    Write-Host "`n⚠️  检测到未配置的邮件参数: $($missing -join ', ')" -ForegroundColor Yellow
    Write-Host "`n📝 配置选项:" -ForegroundColor Cyan
    Write-Host "  1. 使用 Gmail SMTP (推荐用于测试)"
    Write-Host "  2. 使用 SendGrid (推荐用于生产)"
    Write-Host "  3. 手动编辑 .env.staging 文件"
    Write-Host "  4. 跳过配置（使用模拟模式）"
    
    $choice = Read-Host "`n请选择 (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "`n📧 配置 Gmail SMTP" -ForegroundColor Cyan
            Write-Host "`n⚠️  注意: Gmail 需要应用专用密码" -ForegroundColor Yellow
            Write-Host "   1. 登录 Google 账号"
            Write-Host "   2. 启用两步验证"
            Write-Host "   3. 生成应用专用密码: https://myaccount.google.com/apppasswords"
            Write-Host ""
            
            $gmailUser = Read-Host "Gmail 地址"
            $gmailPassword = Read-Host "应用专用密码" -AsSecureString
            $gmailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($gmailPassword)
            )
            
            # 更新配置
            $newContent = $envContent
            $newContent = $newContent -replace 'EMAIL_HOST=.*', "EMAIL_HOST=smtp.gmail.com"
            $newContent = $newContent -replace 'EMAIL_PORT=.*', "EMAIL_PORT=587"
            $newContent = $newContent -replace 'EMAIL_SECURE=.*', "EMAIL_SECURE=false"
            $newContent = $newContent -replace 'EMAIL_USER=.*', "EMAIL_USER=$gmailUser"
            $newContent = $newContent -replace 'EMAIL_PASSWORD=.*', "EMAIL_PASSWORD=$gmailPasswordPlain"
            $newContent = $newContent -replace 'EMAIL_FROM=.*', "EMAIL_FROM=`"IEClub Staging <$gmailUser>`""
            
            Set-Content $envFile $newContent
            Write-Host "✅ Gmail SMTP 配置已更新" -ForegroundColor Green
        }
        "2" {
            Write-Host "`n📧 配置 SendGrid" -ForegroundColor Cyan
            Write-Host "`n⚠️  注意: 需要 SendGrid API Key" -ForegroundColor Yellow
            Write-Host "   1. 登录 SendGrid: https://app.sendgrid.com"
            Write-Host "   2. 创建 API Key: Settings > API Keys"
            Write-Host ""
            
            $sendgridKey = Read-Host "SendGrid API Key" -AsSecureString
            $sendgridKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sendgridKey)
            )
            $sendgridFrom = Read-Host "发件人邮箱 (已验证的)"
            
            # 注意: 当前代码使用 nodemailer，SendGrid 需要特殊配置
            Write-Host "`n⚠️  当前邮件服务使用 nodemailer，SendGrid 需要额外配置" -ForegroundColor Yellow
            Write-Host "   建议: 使用 Gmail SMTP 或修改代码支持 SendGrid API" -ForegroundColor Yellow
        }
        "3" {
            Write-Host "`n📝 请手动编辑文件: $envFile" -ForegroundColor Cyan
            Write-Host "   必需的配置项:" -ForegroundColor Yellow
            Write-Host "   - EMAIL_HOST (例如: smtp.gmail.com)"
            Write-Host "   - EMAIL_PORT (例如: 587)"
            Write-Host "   - EMAIL_USER (您的邮箱地址)"
            Write-Host "   - EMAIL_PASSWORD (邮箱密码或应用专用密码)"
            Write-Host "   - EMAIL_FROM (发件人显示名称和邮箱)"
            notepad $envFile
        }
        "4" {
            Write-Host "`n✅ 将使用模拟模式（开发/测试环境）" -ForegroundColor Green
            Write-Host "   邮件不会真正发送，但会记录日志" -ForegroundColor Yellow
        }
        default {
            Write-Host "`n❌ 无效选择" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "`n✅ 邮件配置看起来完整" -ForegroundColor Green
}

# 运行诊断
Write-Host "`n🔍 运行邮件服务诊断..." -ForegroundColor Cyan
Set-Location $backendPath
$env:NODE_ENV = "staging"
node scripts/diagnose-email.js

Write-Host "`n✅ 配置修复完成" -ForegroundColor Green
Write-Host "`n📝 下一步:" -ForegroundColor Cyan
Write-Host "   1. 如果配置了邮件服务，重启后端服务"
Write-Host "   2. 测试发送验证码邮件"
Write-Host "   3. 检查日志确认邮件发送状态"

