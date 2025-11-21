#!/usr/bin/env pwsh
# 完整的管理员设置流程

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host " IEClub 测试环境管理员设置" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$adminEmail = "12310203@mail.sustech.edu.cn"
$baseUrl = "https://test.ieclub.online/api"

Write-Host "管理员邮箱: $adminEmail" -ForegroundColor Yellow
Write-Host ""

# Step 1: 测试邮件发送
Write-Host "[步骤 1/3] 发送注册验证码..." -ForegroundColor Yellow
Write-Host ""

$sendSuccess = $false
try {
    $body = @{
        email = $adminEmail
        type = "register"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/send-verify-code" `
        -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Body $body -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "  ✅ 验证码已发送！" -ForegroundColor Green
        $sendSuccess = $true
        
        if ($response.data.verificationCode) {
            Write-Host ""
            Write-Host "  ================================" -ForegroundColor Yellow
            Write-Host "  验证码: $($response.data.verificationCode)" -ForegroundColor Yellow -BackgroundColor DarkBlue
            Write-Host "  有效期: $($response.data.expiresIn) 秒 (10分钟)" -ForegroundColor Yellow
            Write-Host "  ================================" -ForegroundColor Yellow
            Write-Host ""
            $verifyCode = $response.data.verificationCode
        } else {
            Write-Host "  📧 请检查邮箱: $adminEmail" -ForegroundColor Cyan
            Write-Host ""
            $verifyCode = Read-Host "  请输入收到的6位验证码"
        }
    }
} catch {
    if ($_.ErrorDetails) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  ⚠️  $($errorDetails.message)" -ForegroundColor Yellow
        
        if ($errorDetails.message -like "*频繁*") {
            Write-Host ""
            Write-Host "  请等待一分钟后重试，或手动访问 https://test.ieclub.online 注册" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Step 2: 提示注册
if ($sendSuccess) {
    Write-Host "[步骤 2/3] 完成注册..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  方式1（推荐）：使用API注册" -ForegroundColor Cyan
    Write-Host "    如果您已有验证码，输入密码后自动注册" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  方式2：手动注册" -ForegroundColor Cyan
    Write-Host "    访问 https://test.ieclub.online 使用验证码完成注册" -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "  使用API自动注册？(Y/N)"
    
    if ($choice -eq 'Y' -or $choice -eq 'y') {
        if (-not $verifyCode) {
            $verifyCode = Read-Host "  请输入验证码"
        }
        $password = Read-Host "  请输入密码（至少8位，含字母和数字）" -AsSecureString
        $password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        )
        
        try {
            $regBody = @{
                email = $adminEmail
                password = $password
                verifyCode = $verifyCode
                nickname = "管理员"
            } | ConvertTo-Json
            
            $regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
                -Method Post `
                -ContentType "application/json; charset=utf-8" `
                -Body $regBody
            
            if ($regResponse.success) {
                Write-Host ""
                Write-Host "  ✅ 注册成功！" -ForegroundColor Green
                Write-Host "  用户ID: $($regResponse.data.user.id)" -ForegroundColor Gray
                Write-Host ""
            }
        } catch {
            if ($_.ErrorDetails) {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "  ❌ 注册失败: $($errorDetails.message)" -ForegroundColor Red
            }
            Write-Host "  请手动访问 https://test.ieclub.online 完成注册" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[步骤 2/3] 请手动注册..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. 访问: https://test.ieclub.online" -ForegroundColor Gray
    Write-Host "  2. 使用邮箱: $adminEmail" -ForegroundColor Gray
    Write-Host "  3. 输入验证码完成注册" -ForegroundColor Gray
    Write-Host ""
}

# Step 3: 设置为管理员
Write-Host "[步骤 3/3] 设置为管理员..." -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "  是否继续设置管理员权限？(Y/N)"

if ($continue -eq 'Y' -or $continue -eq 'y') {
    Write-Host "  正在设置..." -ForegroundColor Gray
    ssh root@ieclub.online "cd /root/IEclub_dev_staging/ieclub-backend && node set-admin-staging.js"
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Green
Write-Host " 完成！" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""
Write-Host "测试环境访问:" -ForegroundColor Cyan
Write-Host "  用户端: https://test.ieclub.online" -ForegroundColor Gray
Write-Host "  管理后台: https://test.ieclub.online/admin" -ForegroundColor Gray
Write-Host ""
