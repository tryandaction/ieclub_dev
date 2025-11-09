# Simple Auth Flow Test
# 测试认证流程：登录、获取个人信息、错误密码验证、发送验证码

$baseUrl = "https://test.ieclub.online/api"

Write-Host "`n=== IE Club Auth Test ===" -ForegroundColor Cyan

# Test 1: Login
Write-Host "`n[Test 1] Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@sustech.edu.cn"
    password = "Test123456"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $result = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Login successful!" -ForegroundColor Green
    Write-Host "Token: $($result.data.token.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "User: $($result.data.user.nickname) ($($result.data.user.email))" -ForegroundColor Gray
    $token = $result.data.token
} catch {
    Write-Host "[FAIL] Login failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test 2: Get Profile
if ($token) {
    Write-Host "`n[Test 2] Get Profile..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $response = Invoke-WebRequest -Uri "$baseUrl/auth/profile" -Method Get -Headers $headers
        $result = $response.Content | ConvertFrom-Json
        Write-Host "[OK] Profile retrieved!" -ForegroundColor Green
        Write-Host "ID: $($result.data.id)" -ForegroundColor Gray
        Write-Host "Email: $($result.data.email)" -ForegroundColor Gray
        Write-Host "Nickname: $($result.data.nickname)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Profile failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: Wrong Password
Write-Host "`n[Test 3] Wrong Password..." -ForegroundColor Yellow
$wrongLoginBody = @{
    email = "test@sustech.edu.cn"
    password = "WrongPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $wrongLoginBody -ContentType "application/json"
    Write-Host "[FAIL] Should have failed but succeeded!" -ForegroundColor Red
} catch {
    Write-Host "[OK] Correctly rejected wrong password" -ForegroundColor Green
}

# Test 4: Send Verification Code
Write-Host "`n[Test 4] Send Verification Code..." -ForegroundColor Yellow
$sendCodeBody = @{
    email = "newuser@sustech.edu.cn"
    type = "register"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/send-verify-code" -Method Post -Body $sendCodeBody -ContentType "application/json"
    $result = $response.Content | ConvertFrom-Json
    Write-Host "[OK] Code sent successfully!" -ForegroundColor Green
    Write-Host "Message: $($result.message)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Send code failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

