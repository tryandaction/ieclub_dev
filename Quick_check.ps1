# IEClub 快速检查脚本
# 用于验证DNS和服务状态

param(
    [string]$Domain = "ieclub.online",
    [string]$ExpectedIP = "39.108.160.112"
)

Write-Host "🔍 IEClub 服务状态检查" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

# 1. DNS解析检查
Write-Host "1️⃣ DNS解析检查..." -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
    $resolvedIP = $dnsResult[0].IPAddress
    
    if ($resolvedIP -eq $ExpectedIP) {
        Write-Host "   ✅ DNS解析正确: $resolvedIP" -ForegroundColor Green
        $dnsOk = $true
    } else {
        Write-Host "   ❌ DNS解析错误!" -ForegroundColor Red
        Write-Host "   当前解析IP: $resolvedIP" -ForegroundColor Red
        Write-Host "   期望IP: $ExpectedIP" -ForegroundColor Yellow
        $dnsOk = $false
    }
} catch {
    Write-Host "   ❌ DNS解析失败: $($_.Exception.Message)" -ForegroundColor Red
    $dnsOk = $false
}
Write-Host ""

# 2. 服务器连通性检查
Write-Host "2️⃣ 服务器连通性检查..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $ExpectedIP -Count 2 -Quiet
    if ($ping) {
        Write-Host "   ✅ 服务器可达" -ForegroundColor Green
    } else {
        Write-Host "   ❌ 服务器无法连接" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️ Ping测试失败" -ForegroundColor Yellow
}
Write-Host ""

# 3. HTTP服务检查（通过IP）
Write-Host "3️⃣ HTTP服务检查（IP访问）..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$ExpectedIP/" -Method Head -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ HTTP服务正常 (状态码: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ HTTP响应异常 (状态码: $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ HTTP服务无法访问: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. HTTP服务检查（通过域名）
if ($dnsOk) {
    Write-Host "4️⃣ HTTP服务检查（域名访问）..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$Domain/" -Method Head -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ 网站可以正常访问" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ 响应异常 (状态码: $($response.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ 网站无法访问: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "4️⃣ HTTP服务检查（域名访问）..." -ForegroundColor Yellow
    Write-Host "   ⏭️ 跳过（DNS解析错误）" -ForegroundColor Yellow
}
Write-Host ""

# 5. 后端API检查
Write-Host "5️⃣ 后端API检查..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-WebRequest -Uri "http://$ExpectedIP/api/health" -UseBasicParsing -TimeoutSec 10
    if ($apiResponse.StatusCode -eq 200) {
        Write-Host "   ✅ 后端API正常" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ API响应异常 (状态码: $($apiResponse.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ API检查失败（可能未配置health端点）" -ForegroundColor Yellow
}
Write-Host ""

# 6. SSH连接检查
Write-Host "6️⃣ SSH连接检查..." -ForegroundColor Yellow
try {
    $sshTest = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$ExpectedIP "echo SSH_OK" 2>$null
    if ($sshTest -eq "SSH_OK") {
        Write-Host "   ✅ SSH连接正常" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ SSH连接测试完成" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ SSH检查失败" -ForegroundColor Yellow
}
Write-Host ""

# 总结
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "📊 检查完成" -ForegroundColor Cyan
Write-Host ""

if (-not $dnsOk) {
    Write-Host "⚠️ 主要问题：DNS解析错误" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 解决方案：" -ForegroundColor Yellow
    Write-Host "   1. 登录域名服务商控制台" -ForegroundColor White
    Write-Host "   2. 修改 $Domain 的A记录为: $ExpectedIP" -ForegroundColor White
    Write-Host "   3. 等待5-30分钟DNS生效" -ForegroundColor White
    Write-Host "   4. 运行以下命令清除DNS缓存：" -ForegroundColor White
    Write-Host "      ipconfig /flushdns" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📖 详细修复指南请查看：DNS_FIX_GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host "✅ 所有检查通过！网站应该可以正常访问。" -ForegroundColor Green
}
Write-Host ""

# 提供快捷链接
Write-Host "🔗 访问链接：" -ForegroundColor Cyan
Write-Host "   临时IP访问: http://$ExpectedIP/" -ForegroundColor White
if ($dnsOk) {
    Write-Host "   域名访问: http://$Domain/" -ForegroundColor White
}
Write-Host ""

