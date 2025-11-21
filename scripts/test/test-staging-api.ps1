#!/usr/bin/env pwsh
# 测试Staging环境API

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 测试Staging环境认证功能" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://test.ieclub.online/api"

# 1. 测试健康检查
Write-Host "[1/4] 测试健康检查..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "  ✅ 健康检查通过" -ForegroundColor Green
    Write-Host "  状态: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ 健康检查失败: $_" -ForegroundColor Red
}
Write-Host ""

# 2. 测试图形验证码生成
Write-Host "[2/4] 测试图形验证码生成..." -ForegroundColor Yellow
try {
    $captcha = Invoke-RestMethod -Uri "$baseUrl/captcha/generate?type=math" -Method Get
    if ($captcha.success) {
        Write-Host "  ✅ 图形验证码生成成功" -ForegroundColor Green
        Write-Host "  Key: $($captcha.data.key)" -ForegroundColor Gray
        Write-Host "  过期时间: $($captcha.data.expiresIn) 秒" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ 生成失败: $($captcha.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ 请求失败: $_" -ForegroundColor Red
}
Write-Host ""

# 3. 测试邮件验证码发送
Write-Host "[3/4] 测试邮件验证码发送..." -ForegroundColor Yellow
try {
    $body = @{
        email = "2812149844@qq.com"
        type = "register"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/send-verify-code" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    if ($response.success) {
        Write-Host "  ✅ 验证码发送成功" -ForegroundColor Green
        Write-Host "  消息: $($response.message)" -ForegroundColor Gray
        if ($response.data.verificationCode) {
            Write-Host "  验证码: $($response.data.verificationCode)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠️  $($response.message)" -ForegroundColor Yellow
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.ErrorDetails) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  ❌ $($errorDetails.message)" -ForegroundColor Red
    } else {
        Write-Host "  ❌ 请求失败: $errorMsg" -ForegroundColor Red
    }
}
Write-Host ""

# 4. 检查后端日志
Write-Host "[4/4] 检查后端日志（最近10行）..." -ForegroundColor Yellow
try {
    ssh root@ieclub.online "pm2 logs staging-backend --lines 10 --nostream | tail -10"
} catch {
    Write-Host "  ⚠️  无法获取日志" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
