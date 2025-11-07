# ================================================================
# IEClub 测试环境部署并验证脚本
# ================================================================
# 功能: 部署到测试环境后自动执行全面验证
# 确保: 网页可访问、API正常、适合小程序调试
# ================================================================

param(
    [ValidateSet("all", "web", "backend")]
    [string]$Target = "all",
    
    [string]$Message = "Staging deployment"
)

# 编码设置
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 配置
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$StagingDeployScript = Join-Path $PSScriptRoot "Deploy-Staging.ps1"

# 颜色输出函数
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
}

function Write-Info { param([string]$Text) Write-Host "[INFO] $Text" -ForegroundColor Blue }
function Write-Success { param([string]$Text) Write-Host "[✓] $Text" -ForegroundColor Green }
function Write-Error { param([string]$Text) Write-Host "[✗] $Text" -ForegroundColor Red }
function Write-Warning { param([string]$Text) Write-Host "[!] $Text" -ForegroundColor Yellow }

# ================================================================
# 第一步：执行部署
# ================================================================
function Deploy-ToStaging {
    Write-Section "第1步: 部署到测试环境"
    
    if (-not (Test-Path $StagingDeployScript)) {
        Write-Error "找不到部署脚本: $StagingDeployScript"
        exit 1
    }
    
    Write-Info "执行测试环境部署..."
    & $StagingDeployScript -Target $Target -Message $Message
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "部署失败！"
        exit 1
    }
    
    Write-Success "部署完成"
    Write-Info "等待服务完全启动..."
    Start-Sleep -Seconds 10
}

# ================================================================
# 第二步：验证网页端
# ================================================================
function Test-WebFrontend {
    Write-Section "第2步: 验证网页端"
    
    $tests = @(
        @{
            Name = "网页首页访问"
            Url = "https://test.ieclub.online"
            ExpectedStatus = 200
        },
        @{
            Name = "网页资源加载"
            Url = "https://test.ieclub.online/assets/"
            ExpectedStatus = 200
            Optional = $true
        }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        Write-Host "`n测试: $($test.Name)" -ForegroundColor Yellow
        Write-Info "URL: $($test.Url)"
        
        try {
            $response = Invoke-WebRequest -Uri $test.Url -Method Get -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq $test.ExpectedStatus) {
                Write-Success "通过 (状态码: $($response.StatusCode))"
                $passed++
            } else {
                Write-Error "失败 (状态码: $($response.StatusCode), 期望: $($test.ExpectedStatus))"
                if (-not $test.Optional) { $failed++ }
            }
        } catch {
            if ($test.Optional) {
                Write-Warning "跳过 (可选测试)"
            } else {
                Write-Error "失败: $($_.Exception.Message)"
                $failed++
            }
        }
    }
    
    Write-Host "`n网页端测试结果: $passed 通过, $failed 失败" -ForegroundColor Cyan
    return ($failed -eq 0)
}

# ================================================================
# 第三步：验证API后端
# ================================================================
function Test-ApiBackend {
    Write-Section "第3步: 验证API后端"
    
    $apiTests = @(
        @{
            Name = "健康检查"
            Url = "https://test.ieclub.online/api/health"
            Method = "GET"
            ExpectedField = "status"
            ExpectedValue = "ok"
        },
        @{
            Name = "登录功能"
            Url = "https://test.ieclub.online/api/auth/login"
            Method = "POST"
            Body = @{
                email = "admin@sustech.edu.cn"
                password = "Test123456"
            }
            ExpectedField = "success"
            ExpectedValue = $true
        }
    )
    
    $passed = 0
    $failed = 0
    $token = $null
    
    foreach ($test in $apiTests) {
        Write-Host "`n测试: $($test.Name)" -ForegroundColor Yellow
        Write-Info "URL: $($test.Url)"
        
        try {
            $params = @{
                Uri = $test.Url
                Method = $test.Method
                TimeoutSec = 10
            }
            
            if ($test.Body) {
                $params.Body = ($test.Body | ConvertTo-Json)
                $params.ContentType = "application/json"
            }
            
            $response = Invoke-RestMethod @params
            
            # 检查响应字段
            if ($response.$($test.ExpectedField) -eq $test.ExpectedValue) {
                Write-Success "通过"
                $passed++
                
                # 保存token用于后续测试
                if ($test.Name -eq "登录功能" -and $response.data.token) {
                    $script:token = $response.data.token
                    Write-Info "已获取登录Token"
                }
            } else {
                Write-Error "失败 (字段: $($test.ExpectedField), 值: $($response.$($test.ExpectedField)), 期望: $($test.ExpectedValue))"
                $failed++
            }
        } catch {
            Write-Error "失败: $($_.Exception.Message)"
            $failed++
        }
    }
    
    # Token验证测试
    if ($script:token) {
        Write-Host "`n测试: Token验证" -ForegroundColor Yellow
        Write-Info "URL: https://test.ieclub.online/api/auth/profile"
        
        try {
            $headers = @{
                "Authorization" = "Bearer $($script:token)"
            }
            
            $profile = Invoke-RestMethod -Uri "https://test.ieclub.online/api/auth/profile" `
                -Method Get `
                -Headers $headers `
                -TimeoutSec 10
            
            if ($profile.success) {
                Write-Success "通过 (用户: $($profile.data.email))"
                $passed++
            } else {
                Write-Error "失败: Token验证失败"
                $failed++
            }
        } catch {
            Write-Error "失败: $($_.Exception.Message)"
            $failed++
        }
    }
    
    Write-Host "`nAPI后端测试结果: $passed 通过, $failed 失败" -ForegroundColor Cyan
    return ($failed -eq 0)
}

# ================================================================
# 第四步：验证小程序兼容性
# ================================================================
function Test-MiniProgramCompatibility {
    Write-Section "第4步: 验证小程序兼容性"
    
    Write-Info "检查API响应格式是否符合小程序规范..."
    
    $tests = @(
        @{
            Name = "API返回格式检查"
            Url = "https://test.ieclub.online/api/health"
            CheckFields = @("status", "timestamp")
        },
        @{
            Name = "CORS配置检查"
            Url = "https://test.ieclub.online/api/health"
            CheckHeaders = $true
        }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($test in $tests) {
        Write-Host "`n检查: $($test.Name)" -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri $test.Url -Method Get -TimeoutSec 10
            $json = $response.Content | ConvertFrom-Json
            
            if ($test.CheckFields) {
                $allFieldsPresent = $true
                foreach ($field in $test.CheckFields) {
                    if (-not $json.$field) {
                        Write-Warning "缺少字段: $field"
                        $allFieldsPresent = $false
                    }
                }
                
                if ($allFieldsPresent) {
                    Write-Success "所有必需字段存在"
                    $passed++
                } else {
                    $failed++
                }
            }
            
            if ($test.CheckHeaders) {
                $corsHeader = $response.Headers['Access-Control-Allow-Origin']
                if ($corsHeader) {
                    Write-Success "CORS已配置: $corsHeader"
                    $passed++
                } else {
                    Write-Warning "未检测到CORS头部（可能在实际请求时才设置）"
                }
            }
        } catch {
            Write-Error "检查失败: $($_.Exception.Message)"
            $failed++
        }
    }
    
    Write-Host "`n小程序兼容性检查结果: $passed 通过, $failed 失败" -ForegroundColor Cyan
    return ($failed -eq 0)
}

# ================================================================
# 第五步：生成验证报告
# ================================================================
function Generate-Report {
    param(
        [bool]$WebOk,
        [bool]$ApiOk,
        [bool]$MiniProgramOk
    )
    
    Write-Section "验证报告"
    
    $allPassed = $WebOk -and $ApiOk -and $MiniProgramOk
    
    Write-Host "┌─────────────────────────────────────────┐" -ForegroundColor Cyan
    Write-Host "│          测试环境验证报告              │" -ForegroundColor Cyan
    Write-Host "├─────────────────────────────────────────┤" -ForegroundColor Cyan
    
    $webStatus = if ($WebOk) { "✓ 通过" } else { "✗ 失败" }
    $webColor = if ($WebOk) { "Green" } else { "Red" }
    Write-Host "│ 网页端:     " -NoNewline -ForegroundColor Cyan
    Write-Host "$webStatus" -ForegroundColor $webColor -NoNewline
    Write-Host "                       │" -ForegroundColor Cyan
    
    $apiStatus = if ($ApiOk) { "✓ 通过" } else { "✗ 失败" }
    $apiColor = if ($ApiOk) { "Green" } else { "Red" }
    Write-Host "│ API后端:    " -NoNewline -ForegroundColor Cyan
    Write-Host "$apiStatus" -ForegroundColor $apiColor -NoNewline
    Write-Host "                       │" -ForegroundColor Cyan
    
    $mpStatus = if ($MiniProgramOk) { "✓ 通过" } else { "✗ 失败" }
    $mpColor = if ($MiniProgramOk) { "Green" } else { "Red" }
    Write-Host "│ 小程序兼容: " -NoNewline -ForegroundColor Cyan
    Write-Host "$mpStatus" -ForegroundColor $mpColor -NoNewline
    Write-Host "                       │" -ForegroundColor Cyan
    
    Write-Host "└─────────────────────────────────────────┘" -ForegroundColor Cyan
    
    Write-Host ""
    
    if ($allPassed) {
        Write-Host "🎉 所有测试通过！可以进行以下操作：" -ForegroundColor Green
        Write-Host ""
        Write-Host "  1. 网页端测试: https://test.ieclub.online" -ForegroundColor White
        Write-Host "  2. 小程序调试: 在微信开发者工具中连接测试环境" -ForegroundColor White
        Write-Host "  3. 生产部署:   运行 .\Deploy-Production.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 查看小程序调试指南: docs\deployment\WECHAT_MINIPROGRAM_GUIDE.md" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "⚠️ 部分测试失败，请检查以下内容：" -ForegroundColor Yellow
        Write-Host ""
        if (-not $WebOk) {
            Write-Host "  - 检查Nginx配置" -ForegroundColor Gray
            Write-Host "  - 检查前端构建产物" -ForegroundColor Gray
        }
        if (-not $ApiOk) {
            Write-Host "  - 检查后端服务状态: ssh root@ieclub.online 'pm2 logs staging-backend'" -ForegroundColor Gray
            Write-Host "  - 检查.env.staging配置" -ForegroundColor Gray
        }
        if (-not $MiniProgramOk) {
            Write-Host "  - 检查API响应格式" -ForegroundColor Gray
            Write-Host "  - 检查CORS配置" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    return $allPassed
}

# ================================================================
# 主流程
# ================================================================
Write-Section "IEClub 测试环境部署 & 验证"

Write-Host "📋 本脚本将执行以下步骤：" -ForegroundColor Cyan
Write-Host "  1. 部署到测试环境" -ForegroundColor White
Write-Host "  2. 验证网页端访问" -ForegroundColor White
Write-Host "  3. 验证API后端功能" -ForegroundColor White
Write-Host "  4. 验证小程序兼容性" -ForegroundColor White
Write-Host "  5. 生成验证报告" -ForegroundColor White
Write-Host ""

# 执行部署
Deploy-ToStaging

# 执行验证
$webOk = Test-WebFrontend
$apiOk = Test-ApiBackend
$mpOk = Test-MiniProgramCompatibility

# 生成报告
$allOk = Generate-Report -WebOk $webOk -ApiOk $apiOk -MiniProgramOk $mpOk

# 返回状态码
if ($allOk) {
    exit 0
} else {
    exit 1
}

