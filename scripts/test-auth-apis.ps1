#!/usr/bin/env pwsh
# ================================================================
# 认证API综合测试脚本
# ================================================================
#
# 功能：测试所有认证相关API，验证CSRF和token处理是否正确
#
# ================================================================

param(
    [string]$BaseUrl = "https://ieclub.online/api",
    [string]$TestEmail = "test@ieclub.online"
)

# 设置控制台编码为UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  认证API综合测试" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$testResults = @()

function Test-API {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "POST",
        [hashtable]$Body = @{},
        [bool]$ShouldSucceed = $true,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "[测试] $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    Write-Host "  方法: $Method" -ForegroundColor Gray
    
    $result = @{
        Name = $Name
        Url = $Url
        Success = $false
        StatusCode = 0
        Message = ""
    }
    
    try {
        $jsonBody = $Body | ConvertTo-Json -Compress
        
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Body.Count -gt 0) {
            $params.Body = $jsonBody
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $result.StatusCode = 200
        $result.Success = $ShouldSucceed
        $result.Message = "成功"
        Write-Host "  ✅ 成功" -ForegroundColor Green
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $result.StatusCode = $statusCode
        $errorBody = $_.ErrorDetails.Message
        
        if ($statusCode -eq 400 -and $errorBody -match "验证码") {
            # 400验证码错误是预期的（因为我们用的是假验证码）
            $result.Success = $true
            $result.Message = "验证码错误（预期）"
            Write-Host "  ✅ 验证码错误（预期）" -ForegroundColor Green
        } elseif ($statusCode -eq 403 -and $errorBody -match "CSRF") {
            # 403 CSRF错误是不应该出现的
            $result.Success = $false
            $result.Message = "CSRF错误（不应该出现）"
            Write-Host "  ❌ CSRF错误（不应该出现）" -ForegroundColor Red
            Write-Host "     响应: $errorBody" -ForegroundColor Red
        } elseif (-not $ShouldSucceed) {
            # 预期失败
            $result.Success = $true
            $result.Message = "预期失败: $errorBody"
            Write-Host "  ✅ 预期失败" -ForegroundColor Green
        } else {
            $result.Success = $false
            $result.Message = "状态码: $statusCode, 错误: $errorBody"
            Write-Host "  ❌ 失败: $statusCode" -ForegroundColor Red
            Write-Host "     响应: $errorBody" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    $testResults += $result
    return $result
}

# ==================== 测试无需认证的API ====================
Write-Host "`n=== 测试无需认证的API（不应该有CSRF错误） ===" -ForegroundColor Cyan
Write-Host ""

# 1. 测试发送验证码
Test-API -Name "发送验证码" -Url "$BaseUrl/auth/send-verify-code" `
    -Body @{ email = $TestEmail; type = "login" }

# 2. 测试验证验证码
Test-API -Name "验证验证码" -Url "$BaseUrl/auth/verify-code" `
    -Body @{ email = $TestEmail; code = "123456" }

# 3. 测试注册
Test-API -Name "注册" -Url "$BaseUrl/auth/register" `
    -Body @{ 
        email = "newuser@ieclub.online"
        password = "Test123456"
        username = "TestUser"
        code = "123456"
    }

# 4. 测试密码登录
Test-API -Name "密码登录" -Url "$BaseUrl/auth/login" `
    -Body @{ email = $TestEmail; password = "wrongpass" } `
    -ShouldSucceed $false

# 5. 测试验证码登录
Test-API -Name "验证码登录" -Url "$BaseUrl/auth/login-with-code" `
    -Body @{ email = $TestEmail; code = "123456" }

# 6. 测试忘记密码
Test-API -Name "忘记密码" -Url "$BaseUrl/auth/forgot-password" `
    -Body @{ email = $TestEmail }

# 7. 测试重置密码（关键测试！）
Test-API -Name "重置密码" -Url "$BaseUrl/auth/reset-password" `
    -Body @{ 
        email = $TestEmail
        code = "123456"
        newPassword = "NewPass123456"
    }

# 8. 测试手机号登录
Test-API -Name "手机号登录" -Url "$BaseUrl/auth/login-with-phone" `
    -Body @{ phone = "13800138000"; code = "123456" }

# ==================== 测试健康检查 ====================
Write-Host "`n=== 测试健康检查API ===" -ForegroundColor Cyan
Write-Host ""

Test-API -Name "健康检查" -Url "$BaseUrl/health" -Method "GET"

# ==================== 测试结果汇总 ====================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  测试结果汇总" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Success }).Count
$failedTests = $totalTests - $passedTests

Write-Host "总测试数: $totalTests" -ForegroundColor White
Write-Host "通过: $passedTests" -ForegroundColor Green
Write-Host "失败: $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failedTests -gt 0) {
    Write-Host "失败的测试:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  ❌ $($_.Name) - $($_.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ==================== 关键检查 ====================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  关键检查" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$csrfTests = $testResults | Where-Object { $_.Message -match "CSRF" -and -not $_.Success }
if ($csrfTests.Count -gt 0) {
    Write-Host "⚠️  发现CSRF问题！以下API不应该要求CSRF token:" -ForegroundColor Red
    $csrfTests | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Url)" -ForegroundColor Red
    }
    Write-Host "`n💡 解决方案:" -ForegroundColor Yellow
    Write-Host "  1. 检查后端 src/routes/index.js 的 csrfIgnorePaths 配置" -ForegroundColor White
    Write-Host "  2. 确保所有公开API都在忽略列表中" -ForegroundColor White
    Write-Host "  3. 重启PM2: ssh root@ieclub.online 'pm2 restart ieclub-backend'" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "✅ 所有API的CSRF配置正确！" -ForegroundColor Green
    Write-Host ""
}

if ($failedTests -eq 0) {
    Write-Host "🎉 所有测试通过！认证系统工作正常！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  部分测试失败，请检查上述错误" -ForegroundColor Yellow
    exit 1
}
