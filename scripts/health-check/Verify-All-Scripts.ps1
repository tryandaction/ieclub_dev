# ============================================
# 验证所有部署脚本和健康检查脚本
# ============================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  脚本完整性验证" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$allPassed = $true

# 1. 检查健康检查脚本
Write-Host "[1/4] 检查健康检查脚本..." -ForegroundColor Yellow
$healthCheckScripts = @(
    "Check-Server-Resources.ps1",
    "Check-Deploy-Ready.ps1",
    "Check-Website-Access.ps1"
)

foreach ($script in $healthCheckScripts) {
    $scriptPath = Join-Path $PSScriptRoot $script
    if (Test-Path $scriptPath) {
        Write-Host "  ✓ $script" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $script (缺失)" -ForegroundColor Red
        $allPassed = $false
    }
}
Write-Host ""

# 2. 检查部署脚本
Write-Host "[2/4] 检查部署脚本..." -ForegroundColor Yellow
$deploymentScripts = @(
    "Deploy-Staging.ps1",
    "Deploy-Production.ps1"
)

$deploymentDir = Join-Path $ProjectRoot "scripts\deployment"
foreach ($script in $deploymentScripts) {
    $scriptPath = Join-Path $deploymentDir $script
    if (Test-Path $scriptPath) {
        Write-Host "  ✓ $script" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $script (缺失)" -ForegroundColor Red
        $allPassed = $false
    }
}
Write-Host ""

# 3. 验证脚本路径引用
Write-Host "[3/4] 验证脚本路径引用..." -ForegroundColor Yellow
$deployStagingPath = Join-Path $deploymentDir "Deploy-Staging.ps1"
if (Test-Path $deployStagingPath) {
    $content = Get-Content $deployStagingPath -Raw
    if ($content -match 'Join-Path.*health-check') {
        Write-Host "  ✓ Deploy-Staging.ps1 正确引用健康检查脚本" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Deploy-Staging.ps1 未找到健康检查脚本引用" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "  ✗ Deploy-Staging.ps1 不存在" -ForegroundColor Red
    $allPassed = $false
}
Write-Host ""

# 4. 检查关键目录
Write-Host "[4/4] 检查项目目录结构..." -ForegroundColor Yellow
$requiredDirs = @(
    "ieclub-backend",
    "ieclub-web",
    "admin-web"
)

foreach ($dir in $requiredDirs) {
    $dirPath = Join-Path $ProjectRoot $dir
    if (Test-Path $dirPath) {
        Write-Host "  ✓ $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir (缺失)" -ForegroundColor Red
        $allPassed = $false
    }
}
Write-Host ""

# 总结
Write-Host "============================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  ✅ 所有检查通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "可以使用以下命令进行部署：" -ForegroundColor Yellow
    Write-Host "  .\scripts\deployment\Deploy-Staging.ps1 -Target all -Message '测试部署'" -ForegroundColor Cyan
    Write-Host ""
    exit 0
} else {
    Write-Host "  ❌ 发现问题，请修复后重试" -ForegroundColor Red
    Write-Host ""
    exit 1
}

