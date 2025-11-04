# ============================================
# IEClub 测试环境部署脚本
# ============================================
# 用途：内部测试，不影响线上用户
# 执行后：仅团队内部可访问，用于调试和验证
# 
# 使用方法：
#   .\Deploy-Staging.ps1 -Target <web|backend|all> [-Message "提交信息"]
#
# 示例：
#   .\Deploy-Staging.ps1 -Target all -Message "测试新功能"
#   .\Deploy-Staging.ps1 -Target web
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("web", "backend", "all")]
    [string]$Target,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Staging deployment"
)

# --- Configuration ---
$ProjectRoot = $PSScriptRoot
$WebDir = "${ProjectRoot}\ieclub-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"

# 测试环境服务器配置
$ServerUser = "root"
$ServerHost = "ieclub.online"  # 或使用测试服务器IP
$ServerPort = 22
$StagingPort = 3001  # 测试环境后端端口

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Yellow
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "================================================================`n" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

# --- 健康检查函数 ---
function Test-HealthCheck {
    param(
        [string]$Url,
        [int]$MaxRetries = 5,
        [int]$RetryDelay = 3
    )
    
    Write-Info "健康检查: $Url"
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        Write-Info "第 $i/$MaxRetries 次检查..."
        try {
            $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "健康检查通过！"
                return $true
            }
        } catch {
            Write-Warning "健康检查失败: $_"
        }
        
        if ($i -lt $MaxRetries) {
            Write-Info "等待 $RetryDelay 秒后重试..."
            Start-Sleep -Seconds $RetryDelay
        }
    }
    
    Write-Error "健康检查失败（已重试 $MaxRetries 次）"
    return $false
}

# --- 备份和回滚函数 ---
function Backup-Deployment {
    param(
        [string]$Target,
        [string]$RemotePath
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = "${RemotePath}.backup_${timestamp}"
    
    Write-Info "备份当前部署: $backupPath"
    
    try {
        $backupCmd = "if [ -d '$RemotePath' ]; then cp -r '$RemotePath' '$backupPath' && echo 'Backup created: $backupPath'; else echo 'No existing deployment to backup'; fi"
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" $backupCmd
        Write-Success "备份完成"
        return $backupPath
    } catch {
        Write-Warning "备份失败（继续部署）: $_"
        return $null
    }
}

function Rollback-Deployment {
    param(
        [string]$Target,
        [string]$BackupPath,
        [string]$RemotePath
    )
    
    if (-not $BackupPath) {
        Write-Error "没有备份可以回滚"
        return $false
    }
    
    Write-Warning "开始回滚到: $BackupPath"
    
    try {
        $rollbackCmd = "if [ -d '$BackupPath' ]; then rm -rf '$RemotePath' && mv '$BackupPath' '$RemotePath' && echo 'Rollback completed'; if [[ '$Target' == 'backend' ]]; then pm2 restart staging-backend; fi; else echo 'Backup not found: $BackupPath' && exit 1; fi"
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" $rollbackCmd
        Write-Success "回滚成功"
        return $true
    } catch {
        Write-Error "回滚失败: $_"
        return $false
    }
}

# --- Git Commit ---
function Commit-Changes {
    Write-Section "提交代码到 Git (测试分支)"
    Set-Location -Path $ProjectRoot
    
    # 切换到 develop 分支（如果存在）
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "develop") {
        Write-Info "当前分支: $currentBranch，尝试切换到 develop 分支..."
        
        # 检查本地是否有 develop 分支
        $localDevelop = git branch --list develop
        if ($localDevelop) {
            # 本地有 develop 分支，直接切换
            git switch develop
            if ($LASTEXITCODE -eq 0) {
                Write-Success "已切换到 develop 分支"
                $currentBranch = "develop"
            } else {
                Write-Warning "切换到 develop 分支失败，继续使用当前分支: $currentBranch"
            }
        } else {
            # 检查远程是否有 develop 分支
            git fetch origin develop 2>$null
            $remoteDevelop = git branch -r --list "origin/develop"
            if ($remoteDevelop) {
                # 远程有 develop 分支，从远程创建本地分支
                Write-Info "从远程创建 develop 分支..."
                git checkout -b develop origin/develop
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "已创建并切换到 develop 分支"
                    $currentBranch = "develop"
                } else {
                    Write-Warning "创建 develop 分支失败，继续使用当前分支: $currentBranch"
                }
            } else {
                # 远程也没有，创建新的 develop 分支
                Write-Info "创建新的 develop 分支..."
                git checkout -b develop
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "已创建并切换到新的 develop 分支"
                    $currentBranch = "develop"
                } else {
                    Write-Warning "创建 develop 分支失败，继续使用当前分支: $currentBranch"
                }
            }
        }
    } else {
        Write-Success "已在 develop 分支"
    }
    
    # 检查是否在测试分支
    if ($currentBranch -ne "staging" -and $currentBranch -ne "develop") {
        Write-Warning "当前不在标准测试分支 (staging/develop)"
        Write-Info "当前分支: $currentBranch"
        Write-Info "测试环境允许从任意分支部署，继续执行..."
    }
    
    git add .
    git commit -m "[STAGING] $Message"
    Write-Success "已提交更改: $Message"
    
    # 推送到远程
    Write-Info "推送到远程仓库..."
    
    # 尝试推送，如果失败则设置上游分支后重试
    git push origin $currentBranch 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Info "设置上游分支并推送..."
        git push -u origin $currentBranch
        if ($LASTEXITCODE -ne 0) {
            Write-Error "推送失败！请检查网络连接和 GitHub 权限"
            exit 1
        }
    }
    Write-Success "已推送到 GitHub (origin/$currentBranch)"
}

# --- Build Web Frontend (Staging) ---
function Build-Web-Staging {
    Write-Section "构建前端 (测试环境)"
    Set-Location -Path $WebDir
    
    # 使用模板创建 .env.staging 文件（如果不存在）
    if (-not (Test-Path ".env.staging")) {
        if (Test-Path "env.staging.template") {
            Write-Info "从模板创建 .env.staging 文件..."
            Copy-Item "env.staging.template" ".env.staging"
            Write-Success "已创建 .env.staging 文件"
        } else {
            Write-Error "env.staging.template 文件不存在！"
            exit 1
        }
    }
    
    Write-Info "使用配置: .env.staging"
    Get-Content ".env.staging" | Write-Host -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "安装依赖..."
    npm install
    
    Write-Info "构建测试版本..."
    # 使用 staging 模式构建
    $env:NODE_ENV = "staging"
    npm run build -- --mode staging
    
    if (Test-Path "dist") {
        Write-Success "前端构建完成 (测试版)"
        
        # 添加测试环境标识
        $indexPath = "dist\index.html"
        if (Test-Path $indexPath) {
            $content = Get-Content $indexPath -Raw
            $content = $content -replace '<title>IEClub</title>', '<title>IEClub (测试版)</title>'
            $content | Out-File -FilePath $indexPath -Encoding UTF8 -NoNewline
            Write-Success "已添加测试环境标识"
        }
        
        Write-Info "构建产物:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
    } else {
        Write-Error "前端构建失败 - dist 目录不存在"
        exit 1
    }
}

# --- Deploy Web to Staging ---
function Deploy-Web-Staging {
    Write-Section "部署前端到测试环境"
    
    Set-Location -Path $WebDir
    
    # 验证构建产物存在
    if (-not (Test-Path "dist")) {
        Write-Error "构建产物不存在！部署流程异常"
        Write-Info "正常情况下，Build-Web-Staging 应该已经创建了 dist 目录"
        exit 1
    }
    
    # 验证构建产物（由于刚刚构建，不再检查时间戳）
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "构建产物不完整！缺少 index.html"
        exit 1
    }
    
    Write-Success "构建产物验证通过"
    
    # 强制删除旧的打包文件
    Write-Info "清理旧的打包文件..."
    if (Test-Path "web-staging.zip") {
        Remove-Item "web-staging.zip" -Force
        Write-Host "  已删除旧的 web-staging.zip" -ForegroundColor Gray
    }
    
    # 打包构建产物
    Write-Info "打包前端文件（基于最新构建）..."
    Compress-Archive -Path "dist\*" -DestinationPath "web-staging.zip" -Force
    
    # 验证打包文件
    if (Test-Path "web-staging.zip") {
        $zipSize = (Get-Item "web-staging.zip").Length / 1KB
        $zipTime = (Get-Item "web-staging.zip").LastWriteTime
        Write-Success "打包完成: web-staging.zip ($('{0:N2}' -f $zipSize) KB, $zipTime)"
    } else {
        Write-Error "打包失败！web-staging.zip 不存在"
        exit 1
    }
    
    # 上传到服务器
    Write-Info "上传到测试服务器..."
    scp -P $ServerPort "web-staging.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 📦 备份当前部署
    $webBackupPath = Backup-Deployment -Target "web" -RemotePath "/var/www/test.ieclub.online"
    
    # 在服务器上部署到测试目录
    Write-Info "部署到测试目录..."
    $webDeployCmd = "mkdir -p /var/www/test.ieclub.online && unzip -oq /tmp/web-staging.zip -d /var/www/test.ieclub.online/ && rm -f /tmp/web-staging.zip && chmod -R 755 /var/www/test.ieclub.online && echo '测试环境前端部署完成'"
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" $webDeployCmd
    
    # 🔍 健康检查
    Write-Info "等待服务启动..."
    Start-Sleep -Seconds 3
    
    $healthCheckPassed = Test-HealthCheck -Url "https://test.ieclub.online" -MaxRetries 3 -RetryDelay 2
    
    if (-not $healthCheckPassed) {
        Write-Error "前端健康检查失败！"
        if ($webBackupPath) {
            Write-Warning "是否回滚到上一版本？(Y/N)"
            $rollback = Read-Host
            if ($rollback -eq 'Y' -or $rollback -eq 'y') {
                $rollbackSuccess = Rollback-Deployment -Target "web" -BackupPath $webBackupPath -RemotePath "/var/www/test.ieclub.online"
                if ($rollbackSuccess) {
                    Write-Success "已回滚到上一版本"
                }
            }
        }
        exit 1
    }
    
    Write-Success "前端部署完成并通过健康检查 (测试环境)"
    Write-Info "访问地址: https://test.ieclub.online"
    Write-Warning "注意: 这是测试环境，仅供内部使用"
}

# --- Deploy Backend to Staging ---
function Deploy-Backend-Staging {
    Write-Section "部署后端到测试环境"
    
    Set-Location -Path $BackendDir
    
    # 使用模板创建 .env.staging 文件（如果不存在）
    if (-not (Test-Path ".env.staging")) {
        if (Test-Path "env.staging.template") {
            Write-Info "从模板创建 .env.staging 文件..."
            Copy-Item "env.staging.template" ".env.staging"
            Write-Warning "请检查并修改 .env.staging 中的数据库密码等敏感信息！"
        } else {
            Write-Error "env.staging.template 文件不存在！"
            exit 1
        }
    }
    
    # 验证源代码存在
    if (-not (Test-Path "src")) {
        Write-Error "源代码目录不存在！"
        exit 1
    }
    
    # 检查源代码是否最新（确保不是旧代码）
    $srcModified = (Get-ChildItem "src" -Recurse -Filter "*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
    $timeDiff = (Get-Date) - $srcModified
    Write-Info "最新源代码文件修改时间: $srcModified"
    # 检查代码是否是最近修改的（24小时内）
    if ($timeDiff.TotalHours -gt 24) {
        Write-Warning "源代码上次修改: $srcModified (超过24小时前)"
        Write-Warning "测试环境建议使用最新代码"
        # 不再退出，仅警告
    } else {
        Write-Success "代码是最新的 (修改于 $([int]$timeDiff.TotalHours) 小时前)"
    }
    
    # 打包后端代码
    Write-Info "打包后端代码（确保使用最新源代码）..."
    
    # 强制删除旧的打包文件
    if (Test-Path "backend-staging.zip") {
        Remove-Item "backend-staging.zip" -Force
        Write-Host "  已删除旧的 backend-staging.zip" -ForegroundColor Gray
    }
    
    # 创建临时目录用于打包（避免包含日志文件和其他不需要的文件）
    $tempDir = "temp-staging-backend"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # 只复制需要的文件和目录（不包含.env.staging，避免覆盖服务器配置）
    $includeItems = @(
        "src",
        "prisma",
        "package.json",
        "package-lock.json"
    )
    
    Write-Info "复制必要文件到临时目录..."
    foreach ($item in $includeItems) {
        if (Test-Path $item) {
            Copy-Item -Path $item -Destination $tempDir -Recurse -Force
            Write-Host "  ✓ $item" -ForegroundColor Gray
        }
    }
    
    # 打包临时目录（不包含日志等文件）
    Compress-Archive -Path "$tempDir\*" -DestinationPath "backend-staging.zip" -Force
    
    # 清理临时目录
    Remove-Item $tempDir -Recurse -Force
    
    # 验证打包文件
    if (Test-Path "backend-staging.zip") {
        $zipSize = (Get-Item "backend-staging.zip").Length / 1KB
        $zipTime = (Get-Item "backend-staging.zip").LastWriteTime
        Write-Success "后端打包完成: backend-staging.zip ($('{0:N2}' -f $zipSize) KB, $zipTime)"
        Write-Info "已排除: logs、node_modules 等文件"
    } else {
        Write-Error "打包失败！backend-staging.zip 不存在"
        exit 1
    }
    
    # 上传到服务器
    Write-Info "上传后端代码到测试服务器..."
    scp -P $ServerPort "backend-staging.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 不上传.env文件，保留服务器上的现有配置
    
    # 在服务器上部署
    Write-Info "部署后端到测试环境..."
    
    # 创建部署脚本（避免 Windows 换行符问题）
    $backendScript = @'
#!/bin/bash
set -e
echo "创建测试环境目录..."
mkdir -p /root/IEclub_dev_staging/ieclub-backend
cd /root/IEclub_dev_staging/ieclub-backend
echo "解压代码..."
unzip -oq /tmp/backend-staging.zip
rm -f /tmp/backend-staging.zip
echo "检查配置文件..."
if [ ! -f .env.staging ]; then
    echo "⚠️  错误: .env.staging 文件不存在！"
    echo "请先在服务器上创建 .env.staging 文件"
    exit 1
fi
echo "✅ 配置文件已存在"
echo "安装依赖..."
npm install --omit=dev --loglevel=error 2>&1 | head -20
echo "✅ 依赖安装完成"
echo "运行数据库迁移..."
npx prisma migrate deploy 2>&1 | tail -10
echo "✅ 数据库迁移完成"
echo "生成 Prisma 客户端..."
npx prisma generate 2>&1 | tail -5
echo "✅ Prisma 客户端生成完成"
echo "重启后端服务..."
pm2 delete staging-backend 2>/dev/null || true
pm2 start src/server-staging.js --name "staging-backend" --time
pm2 save
sleep 3
echo ""
echo "=========================================="
echo "  测试环境后端部署完成"
echo "=========================================="
pm2 status
pm2 logs staging-backend --lines 10 --nostream
'@
    
    # 保存为 Unix 格式并上传
    $backendScript -replace "`r`n", "`n" | Out-File -FilePath "deploy-backend-staging.sh" -Encoding UTF8 -NoNewline
    
    # 📦 备份当前部署
    $backendBackupPath = Backup-Deployment -Target "backend" -RemotePath "/root/IEclub_dev_staging/ieclub-backend"
    
    try {
        scp -P $ServerPort "deploy-backend-staging.sh" "${ServerUser}@${ServerHost}:/tmp/"
        Remove-Item "deploy-backend-staging.sh" -Force
        
        # 执行部署
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "bash /tmp/deploy-backend-staging.sh && rm -f /tmp/deploy-backend-staging.sh"
    } catch {
        Write-Error "后端部署失败: $_"
        Remove-Item "deploy-backend-staging.sh" -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # 🔍 健康检查
    Write-Info "等待后端服务启动..."
    Start-Sleep -Seconds 8
    
    $apiHealthCheckPassed = Test-HealthCheck -Url "https://test.ieclub.online/api/health" -MaxRetries 6 -RetryDelay 5
    
    if (-not $apiHealthCheckPassed) {
        Write-Error "后端健康检查失败！"
        Write-Info "查看最近日志..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs staging-backend --lines 20 --nostream"
        
        if ($backendBackupPath) {
            Write-Warning "是否回滚到上一版本？(Y/N)"
            $rollback = Read-Host
            if ($rollback -eq 'Y' -or $rollback -eq 'y') {
                $rollbackSuccess = Rollback-Deployment -Target "backend" -BackupPath $backendBackupPath -RemotePath "/root/IEclub_dev_staging/ieclub-backend"
                if ($rollbackSuccess) {
                    Write-Success "已回滚到上一版本"
                }
            }
        }
        exit 1
    }
    
    Write-Success "后端部署完成并通过健康检查 (测试环境)"
    Write-Info "API地址: https://test.ieclub.online/api"
    Write-Info "健康检查: https://test.ieclub.online/api/health"
    Write-Info "内部端口: $StagingPort (通过Nginx代理访问)"
    Write-Warning "注意: 使用独立的测试数据库 (ieclub_staging)"
}

# --- Main Execution ---
Write-Section "IEClub 测试环境部署"
Write-Host "🧪 测试环境部署" -ForegroundColor Yellow
Write-Host "   - 用于内部测试和调试" -ForegroundColor Yellow
Write-Host "   - 不影响线上用户" -ForegroundColor Yellow
Write-Host "   - 使用独立的测试数据库" -ForegroundColor Yellow
Write-Host ""
Write-Info "部署目标: $Target"
Write-Info "提交信息: $Message"
Write-Info "测试环境自动部署，无需确认"
Write-Host ""

# 提交代码
Commit-Changes

# 执行部署
switch ($Target) {
    "web" {
        Build-Web-Staging
        Deploy-Web-Staging
    }
    "backend" {
        Deploy-Backend-Staging
    }
    "all" {
        Build-Web-Staging
        Deploy-Web-Staging
        Deploy-Backend-Staging
    }
}

Write-Section "测试环境部署完成"
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "测试环境访问地址:" -ForegroundColor Cyan
Write-Host "  - 前端: https://test.ieclub.online" -ForegroundColor White
Write-Host "  - API: https://test.ieclub.online/api" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 在测试环境进行功能验证" -ForegroundColor White
Write-Host "  2. 确认无误后使用 Deploy-Production.ps1 发布到生产环境" -ForegroundColor White
Write-Host ""

# 返回项目根目录
Set-Location -Path $ProjectRoot

