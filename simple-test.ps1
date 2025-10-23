# Simple Upload Test Script
Write-Host "Testing IEClub Upload Function" -ForegroundColor Cyan

# Test 1: Check frontend upload service
$uploadServicePath = "ieclub-taro\src\services\upload.ts"
if (Test-Path $uploadServicePath) {
    Write-Host "✅ Frontend upload service exists" -ForegroundColor Green
    $content = Get-Content $uploadServicePath -Raw
    if ($content -match "function getApiBaseUrl") {
        Write-Host "✅ getApiBaseUrl function found" -ForegroundColor Green
    } else {
        Write-Host "❌ getApiBaseUrl function missing" -ForegroundColor Red
    }
    if ($content -match "Taro\.uploadFile") {
        Write-Host "✅ Taro.uploadFile found" -ForegroundColor Green
    } else {
        Write-Host "❌ Taro.uploadFile missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Frontend upload service not found" -ForegroundColor Red
}

# Test 2: Check backend upload controller
$uploadControllerPath = "ieclub-backend\src\controllers\uploadController.js"
if (Test-Path $uploadControllerPath) {
    Write-Host "✅ Backend upload controller exists" -ForegroundColor Green
} else {
    Write-Host "❌ Backend upload controller not found" -ForegroundColor Red
}

# Test 3: Check routes
$routesPath = "ieclub-backend\src\routes\index.js"
if (Test-Path $routesPath) {
    Write-Host "✅ Routes file exists" -ForegroundColor Green
    $content = Get-Content $routesPath -Raw
    if ($content -match "/upload/images") {
        Write-Host "✅ Upload route configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload route missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Routes file not found" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Cyan
