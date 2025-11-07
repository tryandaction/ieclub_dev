# ================================================================
# IEClub 生产环境一键部署脚本
# ================================================================
# 功能: 从测试环境验证通过后，一键同步到生产环境
# 要求: 必须先通过测试环境验证
# ================================================================

param(
    [ValidateSet("all", "web", "backend")]
    [string]$Target = "all",
    
    [string]$Message = "Production deployment",
    
    [switch]$SkipVerification  # 跳过测试环境验证（不推荐）
)

# 编码设置
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 配置
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ProductionDeployScript = Join-Path $PSScriptRoot "Deploy-Production.ps1"

# 颜色输出函数
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Magenta
    Write-Host "  $Text" -ForegroundColor Magenta
    Write-Host "================================================================`n" -ForegroundColor Magenta
}

function Write-Info { param([string]$Text) Write-Host "[INFO] $Text" -ForegroundColor Blue }
function Write-Success { param([string]$Text) Write-Host "[✓] $Text" -ForegroundColor Green }
function Write-Error { param([string]$Text) Write-Host "[✗] $Text" -ForegroundColor Red }
function Write-Warning { param([string]$Text) Write-Host "[!] $Text" -ForegroundColor Yellow }

# ================================================================
# 检查测试环境是否可用
# ================================================================
function Test-StagingEnvironment {
    Write-Section "前置检查: 测试环境验证"
    
    if ($SkipVerification) {
        Write-Warning "跳过测试环境验证（使用了 -SkipVerification 参数）"
        Write-Warning "强烈建议先在测试环境验证功能！"
        Write-Host ""
        $confirm = Read-Host "确认跳过测试环境验证？(yes/no)"
        if ($confirm -ne "yes") {
            Write-Info "已取消部署"
            exit 0
        }
        return $true
    }
    
    Write-Info "检查测试环境状态..."
    
    $checks = @(
        @{
            Name = "测试环境网页"
            Url = "https://test.ieclub.online"
        },
        @{
            Name = "测试环境API"
            Url = "https://test.ieclub.online/api/health"
        }
    )
    
    $allOk = $true
    
    foreach ($check in $checks) {
        Write-Host "`n检查: $($check.Name)" -ForegroundColor Yellow
        
        try {
            $response = Invoke-WebRequest -Uri $check.Url -Method Get -TimeoutSec 10 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Success "测试环境运行正常"
            } else {
                Write-Warning "测试环境状态异常 (状态码: $($response.StatusCode))"
                $allOk = $false
            }
        } catch {
            Write-Error "测试环境无法访问: $($_.Exception.Message)"
            $allOk = $false
        }
    }
    
    Write-Host ""
    
    if (-not $allOk) {
        Write-Error "测试环境检查失败！"
        Write-Host ""
        Write-Host "建议操作:" -ForegroundColor Yellow
        Write-Host "  1. 先运行测试环境部署验证脚本:" -ForegroundColor White
        Write-Host "     .\scripts\deployment\Deploy-And-Verify.ps1" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  2. 确保所有测试通过后再部署生产环境" -ForegroundColor White
        Write-Host ""
        
        $forceDeploy = Read-Host "是否强制继续部署到生产环境？(yes/no)"
        if ($forceDeploy -ne "yes") {
            Write-Info "已取消部署"
            exit 0
        }
    }
    
    return $allOk
}

# ================================================================
# 安全确认
# ================================================================
function Confirm-ProductionDeploy {
    Write-Section "生产环境部署确认"
    
    Write-Host "⚠️  您即将部署到生产环境！" -ForegroundColor Red
    Write-Host ""
    Write-Host "目标环境: " -NoNewline -ForegroundColor Yellow
    Write-Host "生产环境 (ieclub.online)" -ForegroundColor Red
    Write-Host "部署范围: " -NoNewline -ForegroundColor Yellow
    Write-Host "$Target" -ForegroundColor White
    Write-Host "提交信息: " -NoNewline -ForegroundColor Yellow
    Write-Host "$Message" -ForegroundColor White
    Write-Host ""
    Write-Host "影响范围: " -NoNewline -ForegroundColor Yellow
    Write-Host "所有线上用户" -ForegroundColor Red
    Write-Host ""
    
    Write-Host "请确认以下事项:" -ForegroundColor Cyan
    Write-Host "  □ 已在测试环境验证所有功能" -ForegroundColor Gray
    Write-Host "  □ 代码已通过Code Review" -ForegroundColor Gray
    Write-Host "  □ 数据库迁移已测试" -ForegroundColor Gray
    Write-Host "  □ 已告知团队成员" -ForegroundColor Gray
    Write-Host "  □ 准备好回滚方案" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "输入 'YES' (全大写) 确认部署，其他任何输入取消: " -NoNewline -ForegroundColor Yellow
    $confirmation = Read-Host
    
    if ($confirmation -ne "YES") {
        Write-Info "已取消部署"
        exit 0
    }
    
    Write-Success "确认通过，开始部署..."
}

# ================================================================
# 执行生产环境部署
# ================================================================
function Deploy-ToProduction {
    Write-Section "执行生产环境部署"
    
    if (-not (Test-Path $ProductionDeployScript)) {
        Write-Error "找不到生产部署脚本: $ProductionDeployScript"
        exit 1
    }
    
    Write-Info "调用生产环境部署脚本..."
    
    # 根据目标执行相应的部署
    switch ($Target) {
        "web" {
            & $ProductionDeployScript -Frontend
        }
        "backend" {
            & $ProductionDeployScript -Backend
        }
        "all" {
            & $ProductionDeployScript
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "部署失败！"
        Write-Host ""
        Write-Host "请检查:" -ForegroundColor Yellow
        Write-Host "  - 服务器连接是否正常" -ForegroundColor Gray
        Write-Host "  - PM2进程状态: ssh root@ieclub.online 'pm2 status'" -ForegroundColor Gray
        Write-Host "  - Nginx状态: ssh root@ieclub.online 'systemctl status nginx'" -ForegroundColor Gray
        Write-Host "  - 查看部署日志以获取详细错误信息" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
    
    Write-Success "部署脚本执行完成"
}

# ================================================================
# 生产环境验证
# ================================================================
function Verify-Production {
    Write-Section "生产环境验证"
    
    Write-Info "等待服务完全启动..."
    Start-Sleep -Seconds 10
    
    $tests = @(
        @{
            Name = "生产环境网页"
            Url = "https://ieclub.online"
            Critical = $true
        },
        @{
            Name = "生产环境API健康检查"
            Url = "https://ieclub.online/api/health"
            Critical = $true
        },
        @{
            Name = "API登录功能"
            Url = "https://ieclub.online/api/auth/login"
            Method = "POST"
            Body = @{
                email = "admin@sustech.edu.cn"
                password = "Test123456"
            }
            Critical = $false
        }
    )
    
    $passed = 0
    $failed = 0
    $criticalFailed = $false
    
    foreach ($test in $tests) {
        Write-Host "`n验证: $($test.Name)" -ForegroundColor Yellow
        Write-Info "URL: $($test.Url)"
        
        try {
            if ($test.Method -eq "POST" -and $test.Body) {
                $body = $test.Body | ConvertTo-Json
                $response = Invoke-RestMethod -Uri $test.Url `
                    -Method Post `
                    -Body $body `
                    -ContentType "application/json" `
                    -TimeoutSec 10
                
                if ($response.success) {
                    Write-Success "通过"
                    $passed++
                } else {
                    Write-Error "失败"
                    $failed++
                    if ($test.Critical) { $criticalFailed = $true }
                }
            } else {
                $response = Invoke-WebRequest -Uri $test.Url -Method Get -TimeoutSec 10 -UseBasicParsing
                
                if ($response.StatusCode -eq 200) {
                    Write-Success "通过 (状态码: 200)"
                    $passed++
                } else {
                    Write-Error "失败 (状态码: $($response.StatusCode))"
                    $failed++
                    if ($test.Critical) { $criticalFailed = $true }
                }
            }
        } catch {
            Write-Error "失败: $($_.Exception.Message)"
            $failed++
            if ($test.Critical) { $criticalFailed = $true }
        }
    }
    
    Write-Host "`n验证结果: $passed 通过, $failed 失败" -ForegroundColor Cyan
    
    if ($criticalFailed) {
        Write-Host ""
        Write-Error "关键验证失败！生产环境可能存在问题！"
        Write-Host ""
        Write-Host "紧急措施:" -ForegroundColor Red
        Write-Host "  1. 立即检查服务器日志" -ForegroundColor White
        Write-Host "  2. 考虑回滚到上一版本" -ForegroundColor White
        Write-Host "  3. 通知团队成员" -ForegroundColor White
        Write-Host ""
        return $false
    }
    
    return $true
}

# ================================================================
# 生成部署报告
# ================================================================
function Generate-DeploymentReport {
    param([bool]$Success)
    
    Write-Section "部署报告"
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if ($Success) {
        Write-Host "┌────────────────────────────────────────────────┐" -ForegroundColor Green
        Write-Host "│   🎉 生产环境部署成功！                       │" -ForegroundColor Green
        Write-Host "└────────────────────────────────────────────────┘" -ForegroundColor Green
        Write-Host ""
        Write-Host "部署时间: " -NoNewline
        Write-Host "$timestamp" -ForegroundColor Cyan
        Write-Host "部署范围: " -NoNewline
        Write-Host "$Target" -ForegroundColor Cyan
        Write-Host "提交信息: " -NoNewline
        Write-Host "$Message" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "访问地址:" -ForegroundColor Yellow
        Write-Host "  前端: https://ieclub.online" -ForegroundColor White
        Write-Host "  API:  https://ieclub.online/api" -ForegroundColor White
        Write-Host ""
        Write-Host "后续操作:" -ForegroundColor Yellow
        Write-Host "  1. 在浏览器访问网站确认功能正常" -ForegroundColor White
        Write-Host "  2. 监控服务器日志: ssh root@ieclub.online 'pm2 logs ieclub-backend'" -ForegroundColor White
        Write-Host "  3. 通知团队成员部署完成" -ForegroundColor White
        Write-Host "  4. 如需发布小程序，参考: docs\deployment\WECHAT_MINIPROGRAM_GUIDE.md" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "┌────────────────────────────────────────────────┐" -ForegroundColor Red
        Write-Host "│   ⚠️  部署验证失败                            │" -ForegroundColor Red
        Write-Host "└────────────────────────────────────────────────┘" -ForegroundColor Red
        Write-Host ""
        Write-Host "请立即检查生产环境状态！" -ForegroundColor Red
        Write-Host ""
    }
}

# ================================================================
# 主流程
# ================================================================
Write-Section "IEClub 生产环境一键部署"

Write-Host "📋 部署流程：" -ForegroundColor Cyan
Write-Host "  1. 检查测试环境" -ForegroundColor White
Write-Host "  2. 安全确认" -ForegroundColor White
Write-Host "  3. 执行部署" -ForegroundColor White
Write-Host "  4. 验证生产环境" -ForegroundColor White
Write-Host "  5. 生成部署报告" -ForegroundColor White
Write-Host ""

# 步骤1: 检查测试环境
$stagingOk = Test-StagingEnvironment

# 步骤2: 安全确认
Confirm-ProductionDeploy

# 步骤3: 执行部署
Deploy-ToProduction

# 步骤4: 验证生产环境
$productionOk = Verify-Production

# 步骤5: 生成报告
Generate-DeploymentReport -Success $productionOk

# 返回状态码
if ($productionOk) {
    exit 0
} else {
    exit 1
}

