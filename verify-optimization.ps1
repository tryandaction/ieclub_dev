# ============================================
# IEClub 优化验证脚本
# ============================================
# 用途：验证所有优化是否正确实施
# 执行：.\verify-optimization.ps1

param(
    [Parameter(Mandatory=$false)]
    [switch]$Quick,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "================================================================`n" -ForegroundColor Cyan
}

function Write-Check {
    param([string]$Item, [bool]$Passed, [string]$Message = "")
    if ($Passed) {
        Write-Host "[✓] " -ForegroundColor Green -NoNewline
        Write-Host "$Item" -ForegroundColor White
        if ($Message -and $Verbose) {
            Write-Host "    $Message" -ForegroundColor Gray
        }
    } else {
        Write-Host "[✗] " -ForegroundColor Red -NoNewline
        Write-Host "$Item" -ForegroundColor White
        if ($Message) {
            Write-Host "    $Message" -ForegroundColor Yellow
        }
    }
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

# 统计变量
$script:TotalChecks = 0
$script:PassedChecks = 0
$script:FailedChecks = 0

function Test-Check {
    param([bool]$Result)
    $script:TotalChecks++
    if ($Result) {
        $script:PassedChecks++
    } else {
        $script:FailedChecks++
    }
    return $Result
}

# --- 验证项目 ---

# 1. 检查部署脚本
function Check-DeploymentScripts {
    Write-Section "1. 部署脚本检查"
    
    # Deploy-Staging.ps1
    $stagingExists = Test-Path "Deploy-Staging.ps1"
    Write-Check "Deploy-Staging.ps1 存在" (Test-Check $stagingExists)
    
    if ($stagingExists) {
        $stagingContent = Get-Content "Deploy-Staging.ps1" -Raw
        
        $hasTempDir = $stagingContent -match '\$tempDir'
        Write-Check "使用临时目录打包" (Test-Check $hasTempDir)
        
        $hasErrorHandling = $stagingContent -match 'try \{'
        Write-Check "包含错误处理" (Test-Check $hasErrorHandling)
        
        # 检查语法
        try {
            $null = Get-Command ".\Deploy-Staging.ps1" -Syntax -ErrorAction Stop
            Write-Check "语法正确" (Test-Check $true)
        } catch {
            Write-Check "语法正确" (Test-Check $false) "语法错误: $_"
        }
    }
    
    # Deploy-Production.ps1
    $prodExists = Test-Path "Deploy-Production.ps1"
    Write-Check "Deploy-Production.ps1 存在" (Test-Check $prodExists)
    
    if ($prodExists) {
        $prodContent = Get-Content "Deploy-Production.ps1" -Raw
        
        $hasTempDir = $prodContent -match '\$tempDir'
        Write-Check "使用临时目录打包" (Test-Check $hasTempDir)
        
        $hasErrorHandling = $prodContent -match 'try \{'
        Write-Check "包含错误处理" (Test-Check $hasErrorHandling)
        
        # 检查语法
        try {
            $null = Get-Command ".\Deploy-Production.ps1" -Syntax -ErrorAction Stop
            Write-Check "语法正确" (Test-Check $true)
        } catch {
            Write-Check "语法正确" (Test-Check $false) "语法错误: $_"
        }
    }
}

# 2. 检查工具脚本
function Check-UtilityScripts {
    Write-Section "2. 工具脚本检查"
    
    $scriptsDir = "ieclub-backend\scripts"
    
    $scripts = @(
        @{ Name = "performance-check.js"; Required = $true },
        @{ Name = "update-hot-scores.js"; Required = $true },
        @{ Name = "run-database-optimization.js"; Required = $true },
        @{ Name = "backup-restore.js"; Required = $true },
        @{ Name = "health-check.js"; Required = $true },
        @{ Name = "optimize-database.sql"; Required = $true }
    )
    
    foreach ($script in $scripts) {
        $scriptPath = Join-Path $scriptsDir $script.Name
        $exists = Test-Path $scriptPath
        Write-Check "$($script.Name) 存在" (Test-Check $exists)
        
        if ($exists -and $script.Name.EndsWith('.js')) {
            # 检查 JavaScript 语法
            try {
                $result = node -c $scriptPath 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Check "$($script.Name) 语法正确" (Test-Check $true)
                } else {
                    Write-Check "$($script.Name) 语法正确" (Test-Check $false) "语法错误"
                }
            } catch {
                Write-Check "$($script.Name) 语法正确" (Test-Check $false) "无法检查: $_"
            }
        }
    }
    
    # 检查 README
    $readmeExists = Test-Path (Join-Path $scriptsDir "README.md")
    Write-Check "scripts/README.md 存在" (Test-Check $readmeExists)
}

# 3. 检查 NPM 脚本
function Check-NpmScripts {
    Write-Section "3. NPM 脚本检查"
    
    $packageJsonPath = "ieclub-backend\package.json"
    
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
        
        $requiredScripts = @(
            "optimize:db",
            "check:performance",
            "update:hot-scores",
            "monitor",
            "backup",
            "backup:list",
            "backup:schema",
            "health",
            "health:api"
        )
        
        foreach ($scriptName in $requiredScripts) {
            $exists = $packageJson.scripts.PSObject.Properties.Name -contains $scriptName
            Write-Check "脚本 '$scriptName' 存在" (Test-Check $exists)
        }
    } else {
        Write-Check "package.json 存在" (Test-Check $false) "文件不存在"
    }
}

# 4. 检查环境配置模板
function Check-EnvTemplates {
    Write-Section "4. 环境配置模板检查"
    
    $templates = @(
        "ieclub-backend\env.staging.template",
        "ieclub-backend\env.production.template",
        "ieclub-web\env.staging.template",
        "ieclub-web\env.production.template"
    )
    
    foreach ($template in $templates) {
        $exists = Test-Path $template
        Write-Check "$template 存在" (Test-Check $exists)
        
        if ($exists -and $Verbose) {
            $content = Get-Content $template -Raw
            $hasDbUrl = $content -match 'DATABASE_URL'
            $hasJwtSecret = $content -match 'JWT_SECRET'
            Write-Check "  包含必要配置" (Test-Check ($hasDbUrl -and $hasJwtSecret))
        }
    }
}

# 5. 检查文档
function Check-Documentation {
    Write-Section "5. 文档检查"
    
    $docs = @(
        @{ Path = "OPTIMIZATION_COMPLETE.md"; Required = $true },
        @{ Path = "ieclub-backend\scripts\README.md"; Required = $true }
    )
    
    foreach ($doc in $docs) {
        $exists = Test-Path $doc.Path
        Write-Check "$($doc.Path) 存在" (Test-Check $exists)
        
        if ($exists -and $Verbose) {
            $size = (Get-Item $doc.Path).Length
            Write-Host "    大小: $([math]::Round($size/1024, 2)) KB" -ForegroundColor Gray
        }
    }
}

# 6. 检查数据库优化SQL
function Check-DatabaseOptimization {
    Write-Section "6. 数据库优化 SQL 检查"
    
    $sqlFile = "ieclub-backend\scripts\optimize-database.sql"
    $exists = Test-Path $sqlFile
    Write-Check "optimize-database.sql 存在" (Test-Check $exists)
    
    if ($exists) {
        $content = Get-Content $sqlFile -Raw
        
        $hasIndexes = $content -match 'ADD INDEX'
        Write-Check "包含索引创建" (Test-Check $hasIndexes)
        
        $hasViews = $content -match 'CREATE OR REPLACE VIEW'
        Write-Check "包含视图创建" (Test-Check $hasViews)
        
        $hasProcedures = $content -match 'CREATE PROCEDURE'
        Write-Check "包含存储过程" (Test-Check $hasProcedures)
        
        $hasAnalyze = $content -match 'ANALYZE TABLE'
        Write-Check "包含表分析" (Test-Check $hasAnalyze)
    }
}

# 7. 快速功能测试
function Check-QuickFunctional {
    Write-Section "7. 快速功能测试"
    
    if (-not $Quick) {
        Write-Info "跳过功能测试 (使用 -Quick 参数启用)"
        return
    }
    
    Write-Info "执行快速功能测试..."
    
    # 测试 Node.js 可用性
    try {
        $nodeVersion = node --version
        Write-Check "Node.js 可用" (Test-Check $true) "版本: $nodeVersion"
    } catch {
        Write-Check "Node.js 可用" (Test-Check $false) "未安装或不在 PATH 中"
    }
    
    # 测试 npm 可用性
    try {
        $npmVersion = npm --version
        Write-Check "npm 可用" (Test-Check $true) "版本: $npmVersion"
    } catch {
        Write-Check "npm 可用" (Test-Check $false) "未安装或不在 PATH 中"
    }
}

# --- 主执行流程 ---
function Main {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "  IEClub 优化验证工具" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host ""
    
    $startTime = Get-Date
    
    # 执行所有检查
    Check-DeploymentScripts
    Check-UtilityScripts
    Check-NpmScripts
    Check-EnvTemplates
    Check-Documentation
    Check-DatabaseOptimization
    Check-QuickFunctional
    
    # 生成报告
    $duration = (Get-Date) - $startTime
    
    Write-Section "验证报告"
    
    Write-Host "总检查项: $script:TotalChecks" -ForegroundColor White
    Write-Host "通过: $script:PassedChecks" -ForegroundColor Green
    Write-Host "失败: $script:FailedChecks" -ForegroundColor Red
    Write-Host ""
    
    $successRate = if ($script:TotalChecks -gt 0) {
        [math]::Round(($script:PassedChecks / $script:TotalChecks) * 100, 1)
    } else {
        0
    }
    
    Write-Host "成功率: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })
    Write-Host "耗时: $($duration.TotalSeconds.ToString('0.00')) 秒" -ForegroundColor Gray
    Write-Host ""
    
    if ($script:FailedChecks -eq 0) {
        Write-Host "✅ 所有检查通过！优化实施成功！" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "⚠️  存在 $script:FailedChecks 个问题，请检查上述失败项" -ForegroundColor Yellow
        exit 1
    }
}

# 执行
Main

