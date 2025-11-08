# ============================================
# IEClub 测试环境一键部署脚本 v3.0
# ============================================
# 用途：内部测试，不影响线上用户
# 执行后：仅团队内部可访问，用于调试和验证
# 
# 支持部署：
#   - 用户网页端（React Web）
#   - 管理员网页端（React Admin）
#   - 后端API服务
#   - 小程序（仅显示配置说明）
# 
# 使用方法：
#   .\Deploy-Staging.ps1 -Target <web|admin|backend|all> [-Message "提交信息"]
#
# 示例：
#   .\Deploy-Staging.ps1 -Target all -Message "测试新功能"      # 全部部署
#   .\Deploy-Staging.ps1 -Target web                           # 仅用户网页
#   .\Deploy-Staging.ps1 -Target admin                         # 仅管理员网页
#   .\Deploy-Staging.ps1 -Target backend                       # 仅后端
# ============================================

# param 块必须是脚本的第一个可执行语句
param(
    [ValidateSet("web", "admin", "backend", "all")]
    [string]$Target,
    
    [string]$Message
)

# 🔧 设置控制台编码为UTF-8，解决中文乱码问题
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# 设置默认值
if (-not $Target) { $Target = "all" }
if (-not $Message) { $Message = "Staging deployment" }

# --- Configuration ---
# 脚本在 scripts/deployment/ 下，需要向上两级到达项目根目录
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WebDir = "${ProjectRoot}\ieclub-web"
$AdminWebDir = "${ProjectRoot}\admin-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$MiniprogramDir = "${ProjectRoot}\ieclub-frontend"

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
    Write-Info "推送到远程仓库 (origin/$currentBranch)..."
    
    # 检查远程分支是否存在
    $remoteBranch = git ls-remote --heads origin $currentBranch
    if ($remoteBranch) {
        # 远程分支存在，直接推送
        git push origin $currentBranch
    } else {
        # 远程分支不存在，创建并设置上游
        Write-Info "首次推送此分支，设置上游..."
        git push -u origin $currentBranch
    }
    
        if ($LASTEXITCODE -ne 0) {
            Write-Error "推送失败！请检查网络连接和 GitHub 权限"
        Write-Warning "可能的原因："
        Write-Warning "  1. 网络连接问题"
        Write-Warning "  2. GitHub 凭证过期"
        Write-Warning "  3. 代码中包含敏感信息（API Key、密码等）"
        Write-Warning "  4. 仓库规则限制"
            exit 1
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
    
    Write-Success "用户前端部署完成并通过健康检查 (测试环境)"
    Write-Info "访问地址: https://test.ieclub.online"
    Write-Warning "注意: 这是测试环境，仅供内部使用"
    
    # 清理本地临时文件
    Write-Info "清理本地临时文件..."
    if (Test-Path "web-staging.zip") {
        Remove-Item "web-staging.zip" -Force
        Write-Host "  已删除 web-staging.zip" -ForegroundColor Gray
    }
}

# --- Build Admin Web (Staging) ---
function Build-Admin-Web-Staging {
    Write-Section "构建管理员前端 (测试环境)"
    Set-Location -Path $AdminWebDir
    
    Write-Info "检查管理员前端项目..."
    if (-not (Test-Path "package.json")) {
        Write-Error "管理员前端项目不存在！路径: $AdminWebDir"
        Write-Info "请确保 admin-web 目录存在并已初始化"
        exit 1
    }
    
    Write-Info "安装依赖..."
    npm install
    
    Write-Info "构建管理员前端 (测试版)..."
    # 设置环境变量指向测试环境
    $env:VITE_API_URL = "https://test.ieclub.online/api"
    npm run build
    
    if (Test-Path "dist") {
        Write-Success "管理员前端构建完成 (测试版)"
        
        # 添加测试环境标识
        $indexPath = "dist\index.html"
        if (Test-Path $indexPath) {
            $content = Get-Content $indexPath -Raw
            $content = $content -replace '<title>(.*?)</title>', '<title>$1 - 管理后台 (测试版)</title>'
            $content | Out-File -FilePath $indexPath -Encoding UTF8 -NoNewline
            Write-Success "已添加管理后台测试环境标识"
        }
        
        Write-Info "构建产物:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
    } else {
        Write-Error "管理员前端构建失败 - dist 目录不存在"
        exit 1
    }
}

# --- Deploy Admin Web to Staging ---
function Deploy-Admin-Web-Staging {
    Write-Section "部署管理员前端到测试环境"
    
    Set-Location -Path $AdminWebDir
    
    # 验证构建产物存在
    if (-not (Test-Path "dist")) {
        Write-Error "构建产物不存在！"
        exit 1
    }
    
    if (-not (Test-Path "dist\index.html")) {
        Write-Error "构建产物不完整！缺少 index.html"
        exit 1
    }
    
    Write-Success "构建产物验证通过"
    
    # 强制删除旧的打包文件
    Write-Info "清理旧的打包文件..."
    if (Test-Path "admin-web-staging.zip") {
        Remove-Item "admin-web-staging.zip" -Force
    }
    
    # 打包构建产物
    Write-Info "打包管理员前端文件..."
    Compress-Archive -Path "dist\*" -DestinationPath "admin-web-staging.zip" -Force
    
    # 验证打包文件
    if (Test-Path "admin-web-staging.zip") {
        $zipSize = (Get-Item "admin-web-staging.zip").Length / 1KB
        Write-Success "打包完成: admin-web-staging.zip ($('{0:N2}' -f $zipSize) KB)"
    } else {
        Write-Error "打包失败！"
        exit 1
    }
    
    # 上传到服务器
    Write-Info "上传到测试服务器..."
    scp -P $ServerPort "admin-web-staging.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 备份当前部署
    $adminBackupPath = Backup-Deployment -Target "admin-web" -RemotePath "/var/www/test.ieclub.online/admin"
    
    # 在服务器上部署到测试目录
    Write-Info "部署到测试目录..."
    $adminDeployCmd = "mkdir -p /var/www/test.ieclub.online/admin && unzip -oq /tmp/admin-web-staging.zip -d /var/www/test.ieclub.online/admin/ && rm -f /tmp/admin-web-staging.zip && chmod -R 755 /var/www/test.ieclub.online/admin && echo '管理员前端部署完成'"
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" $adminDeployCmd
    
    # 健康检查
    Write-Info "等待服务启动..."
    Start-Sleep -Seconds 3
    
    $healthCheckPassed = Test-HealthCheck -Url "https://test.ieclub.online/admin" -MaxRetries 3 -RetryDelay 2
    
    if (-not $healthCheckPassed) {
        Write-Error "管理员前端健康检查失败！"
        if ($adminBackupPath) {
            Write-Warning "是否回滚到上一版本？(Y/N)"
            $rollback = Read-Host
            if ($rollback -eq 'Y' -or $rollback -eq 'y') {
                Rollback-Deployment -Target "admin-web" -BackupPath $adminBackupPath -RemotePath "/var/www/test.ieclub.online/admin"
            }
        }
        exit 1
    }
    
    Write-Success "管理员前端部署完成并通过健康检查 (测试环境)"
    Write-Info "访问地址: https://test.ieclub.online/admin"
    Write-Info "默认账号: admin@ieclub.com (需先在服务器初始化)"
    Write-Warning "注意: 这是测试环境，仅供内部使用"
    
    # 清理本地临时文件
    Write-Info "清理本地临时文件..."
    if (Test-Path "admin-web-staging.zip") {
        Remove-Item "admin-web-staging.zip" -Force
        Write-Host "  已删除 admin-web-staging.zip" -ForegroundColor Gray
    }
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

echo "========================================"
echo "  测试环境后端部署开始"
echo "========================================"

# 步骤 1: 创建目录
echo ""
echo "[1/8] 创建测试环境目录..."
mkdir -p /root/IEclub_dev_staging/ieclub-backend
cd /root/IEclub_dev_staging/ieclub-backend

# 步骤 2: 解压代码
echo "[2/8] 解压代码..."
unzip -oq /tmp/backend-staging.zip
rm -f /tmp/backend-staging.zip
echo "✅ 代码解压完成"

# 步骤 3: 检查并创建配置文件
echo "[3/8] 检查配置文件..."
if [ ! -f .env.staging ]; then
    echo "⚠️  .env.staging 文件不存在，尝试从生产环境复制配置..."
    
    if [ -f /root/IEclub_dev/ieclub-backend/.env ]; then
        # 从生产环境复制并修改为测试环境配置
        cp /root/IEclub_dev/ieclub-backend/.env .env.staging
        
        # 修改关键配置
        sed -i 's/NODE_ENV=production/NODE_ENV=staging/' .env.staging
        sed -i 's/PORT=3000/PORT=3001/' .env.staging
        sed -i 's/ieclub"/ieclub_staging"/' .env.staging  # 数据库名
        sed -i 's/REDIS_DB=0/REDIS_DB=1/' .env.staging
        
        echo "✅ 已从生产环境创建测试配置"
        echo "⚠️  请检查并手动调整 .env.staging 中的配置"
    else
        echo "❌ 错误: .env.staging 文件不存在，且无法从生产环境复制！"
        echo ""
        echo "请执行以下步骤之一："
        echo "  1. 在本地运行: .\scripts\deployment\Fix-Staging-Env.ps1"
        echo "  2. 手动创建: cp env.staging.template .env.staging"
        echo ""
    exit 1
fi
else
echo "✅ 配置文件已存在"
fi

# 步骤 4: 安装依赖
echo "[4/8] 安装依赖..."
npm install --omit=dev --loglevel=error 2>&1 | head -20
if [ $? -eq 0 ]; then
echo "✅ 依赖安装完成"
else
    echo "❌ 依赖安装失败！"
    exit 1
fi

# 步骤 5: 数据库迁移
echo "[5/8] 运行数据库迁移..."
npx prisma migrate deploy 2>&1 | tail -10
if [ $? -eq 0 ]; then
echo "✅ 数据库迁移完成"
else
    echo "⚠️  数据库迁移失败（继续部署）"
fi

# 步骤 6: 生成 Prisma 客户端
echo "[6/8] 生成 Prisma 客户端..."
npx prisma generate 2>&1 | tail -5
if [ $? -eq 0 ]; then
    echo "✅ Prisma 客户端生成完成"
else
    echo "❌ Prisma 客户端生成失败！"
    exit 1
fi

# 步骤 7: 更新PM2配置并重启服务
echo "[7/8] 更新PM2配置并重启服务..."

# 创建ecosystem配置文件
cat > ecosystem.staging.config.js << 'ECOSYSTEM_EOF'
const path = require('path');
const dotenv = require('dotenv');

// Load .env.staging
const envConfig = dotenv.config({ path: path.resolve(__dirname, '.env.staging') });

if (envConfig.error) {
  console.error('Error loading .env.staging:', envConfig.error);
  process.exit(1);
}

module.exports = {
  apps: [{
    name: 'staging-backend',
    script: 'src/server-staging.js',
    cwd: '/root/IEclub_dev_staging/ieclub-backend',
    instances: 1,
    exec_mode: 'fork',
    env: envConfig.parsed,
    error_file: '/root/.pm2/logs/staging-backend-error.log',
    out_file: '/root/.pm2/logs/staging-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false
  }]
};
ECOSYSTEM_EOF

# 删除旧进程并启动新进程
pm2 delete staging-backend 2>/dev/null || true
pm2 start ecosystem.staging.config.js
pm2 save

# 步骤 8: 等待启动并检查
echo "[8/8] 等待服务启动..."
sleep 5

echo ""
echo "========================================"
echo "  测试环境后端部署完成"
echo "========================================"
echo ""
echo "📊 PM2 状态:"
pm2 status

echo ""
echo "📋 最近日志 (最新15行):"
pm2 logs staging-backend --lines 15 --nostream 2>&1 || echo "暂无日志"

echo ""
echo "💡 查看完整日志: pm2 logs staging-backend"
echo "💡 查看实时日志: pm2 logs staging-backend --lines 50"
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
        Write-Host ""
        Write-Section "🔍 诊断信息"
        
        # 1. 检查 PM2 状态
        Write-Info "1️⃣ 检查 PM2 进程状态..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 status" 2>&1
        
        # 2. 查看最近日志
        Write-Host ""
        Write-Info "2️⃣ 查看最近日志 (最新30行)..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs staging-backend --lines 30 --nostream 2>&1 || echo '无法获取日志'" 2>&1
        
        # 3. 检查端口占用
        Write-Host ""
        Write-Info "3️⃣ 检查端口占用情况 (${StagingPort})..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "lsof -i :${StagingPort} 2>/dev/null || netstat -tlnp 2>/dev/null | grep ${StagingPort} || echo '端口未被占用'" 2>&1
        
        # 4. 检查服务器资源
        Write-Host ""
        Write-Info "4️⃣ 检查服务器资源..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "echo '内存使用:' && free -h && echo '' && echo '磁盘使用:' && df -h | grep -E '^/dev|使用率'" 2>&1
        
        # 5. 测试本地健康检查
        Write-Host ""
        Write-Info "5️⃣ 测试服务器本地健康检查..."
        ssh -p $ServerPort "${ServerUser}@${ServerHost}" "curl -s http://localhost:${StagingPort}/health 2>&1 || echo '本地健康检查失败'" 2>&1
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        Write-Host "💡 诊断提示:" -ForegroundColor Yellow
        Write-Host "   - 检查 .env.staging 配置是否正确" -ForegroundColor Gray
        Write-Host "   - 检查数据库连接 (DATABASE_URL)" -ForegroundColor Gray
        Write-Host "   - 检查 Redis 连接 (REDIS_HOST)" -ForegroundColor Gray
        Write-Host "   - 查看完整日志: ssh root@ieclub.online 'pm2 logs staging-backend'" -ForegroundColor Gray
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
        Write-Host ""
        
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
    
    # 清理本地临时文件
    Write-Info "清理本地临时文件..."
    Set-Location -Path $BackendDir
    if (Test-Path "backend-staging.zip") {
        Remove-Item "backend-staging.zip" -Force
        Write-Host "  已删除 backend-staging.zip" -ForegroundColor Gray
    }
    if (Test-Path "deploy-backend-staging.sh") {
        Remove-Item "deploy-backend-staging.sh" -Force
        Write-Host "  已删除 deploy-backend-staging.sh" -ForegroundColor Gray
    }
}

# --- 服务器资源检查 ---
function Check-ServerResources {
    Write-Section "服务器资源检查"
    Write-Info "检查服务器资源状态..."
    
    # 暂时跳过资源检查（避免编码问题）
    # 资源检查脚本已修复，但PowerShell编码问题导致无法直接调用
    # 可以手动运行: .\scripts\health-check\Check-Server-Resources.ps1
    Write-Warning "资源检查暂时跳过（已修复脚本，但存在编码问题）"
    Write-Info "可以手动运行资源检查: .\scripts\health-check\Check-Server-Resources.ps1"
    Write-Info "继续部署..."
    Write-Host ""
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

# 检查服务器资源
Check-ServerResources

# 提交代码
Commit-Changes

# 执行部署
switch ($Target) {
    "web" {
        Build-Web-Staging
        Deploy-Web-Staging
    }
    "admin" {
        Build-Admin-Web-Staging
        Deploy-Admin-Web-Staging
    }
    "backend" {
        Deploy-Backend-Staging
    }
    "all" {
        # 部署所有端
        Build-Web-Staging
        Deploy-Web-Staging
        
        Build-Admin-Web-Staging
        Deploy-Admin-Web-Staging
        
        Deploy-Backend-Staging
        
        # 显示小程序配置说明
        Write-Section "📱 小程序配置说明"
        Write-Host "小程序需要在微信开发者工具中手动配置：" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1️⃣ 打开项目目录: $MiniprogramDir" -ForegroundColor White
        Write-Host ""
        Write-Host "2️⃣ 修改 API 地址（测试环境）:" -ForegroundColor White
        Write-Host "   文件: ieclub-frontend/utils/config.js" -ForegroundColor Gray
        Write-Host "   const API_BASE_URL = 'https://test.ieclub.online/api'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "3️⃣ 在微信开发者工具中:" -ForegroundColor White
        Write-Host "   - 导入项目" -ForegroundColor Gray
        Write-Host "   - AppID: [你的测试环境 AppID]" -ForegroundColor Gray
        Write-Host "   - 点击「上传」按钮发布体验版" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4️⃣ 在微信公众平台:" -ForegroundColor White
        Write-Host "   - 登录 mp.weixin.qq.com" -ForegroundColor Gray
        Write-Host "   - 进入「版本管理」" -ForegroundColor Gray
        Write-Host "   - 将体验版设置为体验版本" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📝 详细文档: docs/deployment/WECHAT_MINIPROGRAM_GUIDE.md" -ForegroundColor Cyan
        Write-Host ""
    }
}

Write-Section "🎉 测试环境部署完成"
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 测试环境访问地址" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  📱 用户网页: https://test.ieclub.online" -ForegroundColor White
Write-Host "  🔧 管理后台: https://test.ieclub.online/admin" -ForegroundColor White
Write-Host "  🔌 后端API:  https://test.ieclub.online/api" -ForegroundColor White
Write-Host "  ❤️  健康检查: https://test.ieclub.online/api/health" -ForegroundColor White
Write-Host "  📱 小程序:   手动配置（见上方说明）" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 管理员账号设置" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "首次使用需要初始化管理员账号：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. SSH 登录服务器：" -ForegroundColor White
Write-Host "     ssh root@ieclub.online" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. 进入测试环境目录：" -ForegroundColor White
Write-Host "     cd /root/IEclub_dev_staging/ieclub-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. 初始化管理员：" -ForegroundColor White
Write-Host "     NODE_ENV=staging node scripts/init-admin.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. 按提示设置管理员账号和密码" -ForegroundColor White
Write-Host ""
Write-Host "  5. 使用管理员账号登录: https://test.ieclub.online/admin" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host " 下一步" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  1. 在测试环境进行功能验证" -ForegroundColor White
Write-Host "  2. 测试管理后台功能" -ForegroundColor White
Write-Host "  3. 确认无误后使用以下命令发布到生产环境：" -ForegroundColor White
Write-Host "     .\scripts\deployment\Deploy-Production.ps1 -Target all" -ForegroundColor Cyan
Write-Host ""

# 返回项目根目录
Set-Location -Path $ProjectRoot

