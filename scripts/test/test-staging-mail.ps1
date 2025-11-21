#!/usr/bin/env pwsh
# 测试Staging环境邮件发送

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 测试Staging环境邮件验证码" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$email = "12310203@mail.sustech.edu.cn"
$baseUrl = "https://test.ieclub.online/api"

Write-Host "测试邮箱: $email" -ForegroundColor Yellow
Write-Host ""

# 发送验证码
Write-Host "[1/2] 发送邮箱验证码..." -ForegroundColor Yellow
try {
    $body = @{
        email = $email
        type = "register"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/send-verify-code" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body $body
    
    if ($response.success) {
        Write-Host "  ✅ 验证码发送成功！" -ForegroundColor Green
        Write-Host "  消息: $($response.message)" -ForegroundColor Gray
        Write-Host "  过期时间: $($response.data.expiresIn) 秒" -ForegroundColor Gray
        
        if ($response.data.verificationCode) {
            Write-Host ""
            Write-Host "  🔐 验证码: $($response.data.verificationCode)" -ForegroundColor Yellow -BackgroundColor DarkBlue
            Write-Host ""
        } else {
            Write-Host "  📧 请检查邮箱 $email" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  ❌ $($response.message)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($_.ErrorDetails) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  ❌ HTTP $statusCode - $($errorDetails.message)" -ForegroundColor Red
        
        if ($errorDetails.error -and $errorDetails.error.code) {
            Write-Host "  错误代码: $($errorDetails.error.code)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# 检查邮件服务日志
Write-Host "[2/2] 检查邮件服务日志..." -ForegroundColor Yellow
ssh root@ieclub.online "cd /root/IEclub_dev_staging/ieclub-backend && pm2 logs staging-backend --lines 30 --nostream | grep -i -E 'email|邮件|验证码' | tail -15"
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
