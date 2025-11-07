# 邮件服务自动化测试脚本
# 用于验证邮件服务在不同环境下的行为

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('development', 'staging', 'production', 'all')]
    [string]$Environment = 'all',
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = 'http://localhost:3000/api',
    
    [Parameter(Mandatory=$false)]
    [string]$TestEmail = 'test@mail.sustech.edu.cn'
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   📧 邮件服务自动化测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试计数器
$script:totalTests = 0
$script:passedTests = 0
$script:failedTests = 0

# 测试结果记录
$script:results = @()

# 辅助函数：记录测试结果
function Record-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message,
        [object]$Response
    )
    
    $script:totalTests++
    
    if ($Passed) {
        $script:passedTests++
        Write-Host "  ✅ $TestName" -ForegroundColor Green
    } else {
        $script:failedTests++
        Write-Host "  ❌ $TestName" -ForegroundColor Red
    }
    
    if ($Message) {
        Write-Host "     $Message" -ForegroundColor Gray
    }
    
    $script:results += @{
        Test = $TestName
        Passed = $Passed
        Message = $Message
        Response = $Response
    }
}

# 测试函数：发送验证码
function Test-SendVerificationCode {
    param(
        [string]$ApiBase,
        [string]$Email
    )
    
    Write-Host ""
    Write-Host "📨 测试发送验证码..." -ForegroundColor Yellow
    
    try {
        $body = @{
            email = $Email
            type = "login"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod `
            -Uri "$ApiBase/auth/send-verify-code" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        # 检查响应
        if ($response.success -eq $true) {
            if ($response.data.emailSent -eq $true) {
                if ($response.data.mock -eq $true) {
                    Record-TestResult `
                        -TestName "发送验证码（模拟模式）" `
                        -Passed $true `
                        -Message "环境: $($response.data.env), 模拟发送成功" `
                        -Response $response
                } else {
                    Record-TestResult `
                        -TestName "发送验证码（真实发送）" `
                        -Passed $true `
                        -Message "邮件已真实发送到 $Email" `
                        -Response $response
                }
            } else {
                Record-TestResult `
                    -TestName "发送验证码" `
                    -Passed $false `
                    -Message "emailSent = false: $($response.message)" `
                    -Response $response
            }
        } else {
            Record-TestResult `
                -TestName "发送验证码" `
                -Passed $false `
                -Message $response.message `
                -Response $response
        }
    }
    catch {
        Record-TestResult `
            -TestName "发送验证码" `
            -Passed $false `
            -Message "请求失败: $($_.Exception.Message)" `
            -Response $null
    }
}

# 测试函数：健康检查
function Test-HealthCheck {
    param(
        [string]$ApiBase
    )
    
    Write-Host ""
    Write-Host "🏥 测试健康检查..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$ApiBase/health" `
            -Method Get `
            -ErrorAction Stop
        
        if ($response.status -eq "ok") {
            Record-TestResult `
                -TestName "健康检查" `
                -Passed $true `
                -Message "服务运行正常" `
                -Response $response
        } else {
            Record-TestResult `
                -TestName "健康检查" `
                -Passed $false `
                -Message "状态异常: $($response.status)" `
                -Response $response
        }
    }
    catch {
        Record-TestResult `
            -TestName "健康检查" `
            -Passed $false `
            -Message "请求失败: $($_.Exception.Message)" `
            -Response $null
    }
}

# 测试函数：测试接口
function Test-TestEndpoint {
    param(
        [string]$ApiBase
    )
    
    Write-Host ""
    Write-Host "🧪 测试测试接口..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$ApiBase/test" `
            -Method Get `
            -ErrorAction Stop
        
        if ($response.message) {
            Record-TestResult `
                -TestName "测试接口" `
                -Passed $true `
                -Message $response.message `
                -Response $response
        } else {
            Record-TestResult `
                -TestName "测试接口" `
                -Passed $false `
                -Message "响应格式异常" `
                -Response $response
        }
    }
    catch {
        Record-TestResult `
            -TestName "测试接口" `
            -Passed $false `
            -Message "请求失败: $($_.Exception.Message)" `
            -Response $null
    }
}

# 测试函数：检查环境配置
function Test-EnvironmentConfig {
    param(
        [string]$ApiBase
    )
    
    Write-Host ""
    Write-Host "⚙️  检查环境配置..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$ApiBase/health" `
            -Method Get `
            -ErrorAction Stop
        
        # 从响应中推断环境
        $detectedEnv = "unknown"
        if ($ApiBase -like "*localhost*") {
            $detectedEnv = "development"
        } elseif ($ApiBase -like "*test.ieclub.online*") {
            $detectedEnv = "staging"
        } elseif ($ApiBase -like "*ieclub.online*") {
            $detectedEnv = "production"
        }
        
        Record-TestResult `
            -TestName "环境检测" `
            -Passed $true `
            -Message "检测到环境: $detectedEnv" `
            -Response @{ environment = $detectedEnv }
    }
    catch {
        Record-TestResult `
            -TestName "环境检测" `
            -Passed $false `
            -Message "无法检测环境" `
            -Response $null
    }
}

# 主测试流程
function Run-Tests {
    param(
        [string]$ApiBase,
        [string]$Email
    )
    
    Write-Host "🎯 测试目标: $ApiBase" -ForegroundColor Cyan
    Write-Host "📧 测试邮箱: $Email" -ForegroundColor Cyan
    
    # 执行测试
    Test-EnvironmentConfig -ApiBase $ApiBase
    Test-HealthCheck -ApiBase $ApiBase
    Test-TestEndpoint -ApiBase $ApiBase
    Test-SendVerificationCode -ApiBase $ApiBase -Email $Email
}

# 执行测试
Write-Host "开始测试..." -ForegroundColor White
Write-Host ""

switch ($Environment) {
    'development' {
        Write-Host "📦 测试开发环境" -ForegroundColor Magenta
        Run-Tests -ApiBase "http://localhost:3000/api" -Email $TestEmail
    }
    'staging' {
        Write-Host "🧪 测试测试环境" -ForegroundColor Magenta
        Run-Tests -ApiBase "https://test.ieclub.online/api" -Email $TestEmail
    }
    'production' {
        Write-Host "🚀 测试生产环境" -ForegroundColor Magenta
        Run-Tests -ApiBase "https://ieclub.online/api" -Email $TestEmail
    }
    'all' {
        Write-Host "🌈 测试所有环境" -ForegroundColor Magenta
        
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Gray
        Write-Host "📦 开发环境" -ForegroundColor Magenta
        Write-Host "=" * 60 -ForegroundColor Gray
        Run-Tests -ApiBase "http://localhost:3000/api" -Email $TestEmail
        
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Gray
        Write-Host "🧪 测试环境" -ForegroundColor Magenta
        Write-Host "=" * 60 -ForegroundColor Gray
        Run-Tests -ApiBase "https://test.ieclub.online/api" -Email $TestEmail
        
        Write-Host ""
        Write-Host "=" * 60 -ForegroundColor Gray
        Write-Host "🚀 生产环境" -ForegroundColor Magenta
        Write-Host "=" * 60 -ForegroundColor Gray
        Run-Tests -ApiBase "https://ieclub.online/api" -Email $TestEmail
    }
}

# 显示测试结果摘要
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   📊 测试结果摘要" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "总测试数: $script:totalTests" -ForegroundColor White
Write-Host "通过: $script:passedTests" -ForegroundColor Green
Write-Host "失败: $script:failedTests" -ForegroundColor Red
Write-Host ""

if ($script:failedTests -eq 0) {
    Write-Host "✅ 所有测试通过！" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ 有 $script:failedTests 个测试失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "失败的测试:" -ForegroundColor Yellow
    foreach ($result in $script:results) {
        if (-not $result.Passed) {
            Write-Host "  • $($result.Test): $($result.Message)" -ForegroundColor Gray
        }
    }
    exit 1
}

