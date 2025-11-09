# Complete Auth Flow Test
# 完整的认证流程测试：登录、获取个人信息、错误密码验证、发送验证码、不存在的用户测试

$baseUrl = "https://test.ieclub.online/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IE Club Complete Auth Flow Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Login
Write-Host "[Test 1] Login..." -ForegroundColor Yellow
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
        Write-Host "User Info:" -ForegroundColor Gray
        Write-Host "  - ID: $($result.data.id)" -ForegroundColor Gray
        Write-Host "  - Email: $($result.data.email)" -ForegroundColor Gray
        Write-Host "  - Nickname: $($result.data.nickname)" -ForegroundColor Gray
        Write-Host "  - School: $($result.data.school)" -ForegroundColor Gray
        Write-Host "  - Major: $($result.data.major)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Profile failed: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: Send Verification Code
Write-Host "`n[Test 3] Send Verification Code..." -ForegroundColor Yellow
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

# Test 4: Wrong Password
Write-Host "`n[Test 4] Wrong Password..." -ForegroundColor Yellow
$wrongLoginBody = @{
    email = "test@sustech.edu.cn"
    password = "WrongPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $wrongLoginBody -ContentType "application/json"
    Write-Host "[FAIL] Should have failed but succeeded!" -ForegroundColor Red
} catch {
    Write-Host "[OK] Correctly rejected wrong password" -ForegroundColor Green
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

# Test 5: Non-existent User
Write-Host "`n[Test 5] Non-existent User..." -ForegroundColor Yellow
$nonExistLoginBody = @{
    email = "nonexist@sustech.edu.cn"
    password = "SomePassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $nonExistLoginBody -ContentType "application/json"
    Write-Host "[FAIL] Should have failed but succeeded!" -ForegroundColor Red
} catch {
    Write-Host "[OK] Correctly rejected non-existent user" -ForegroundColor Green
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
