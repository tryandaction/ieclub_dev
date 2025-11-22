$body = @{
    email = '12310203@mail.sustech.edu.cn'
    code = '000000'
    newPassword = 'Test123456'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'https://ieclub.online/api/auth/reset-password' -Method Post -Body $body -ContentType 'application/json'
    Write-Host "✅ 成功:" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ 错误:" -ForegroundColor Red
    Write-Host "状态码: $($_.Exception.Response.StatusCode.value__)"
    $errorBody = $_.ErrorDetails.Message
    Write-Host "响应: $errorBody"
}
