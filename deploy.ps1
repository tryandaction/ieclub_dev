# IEclub 完整部署脚本
# 功能完善版本 - 解决所有部署问题
# 
# 🚀 使用方法:
#   .\deploy.ps1                                    # 完整部署（自动提交代码）
#   .\deploy.ps1 -CommitMessage "修复bug"          # 自定义提交信息
#   .\deploy.ps1 -AutoCommit:$false                # 禁用自动提交
#   .\deploy.ps1 -Action build                     # 仅构建
#   .\deploy.ps1 -Action health                    # 健康检查
#   .\deploy.ps1 -Branch dev -Environment dev      # 部署到开发环境
#
# 📋 新增功能:
#   - ✅ 自动提交未暂存的代码更改 (git add . && git commit)
#   - ✅ 支持自定义提交信息
#   - ✅ 智能分支切换和代码同步
#   - ✅ 详细的操作日志和状态反馈

param(
    [string]$Action = "full",           # full, build, upload, server, health, rollback
    [string]$Environment = "prod",      # prod, dev, test
    [string]$Branch = "main",          # Git分支
    [string]$CommitMessage = "",       # 提交信息（为空时自动生成）
    [switch]$Force = $false,           # 强制执行
    [switch]$SkipBackup = $false,      # 跳过备份
    [switch]$AutoCommit,               # 自动提交未暂存的更改（默认启用）
    [switch]$Verbose = $false          # 详细输出
)

# 设置默认值
if (-not $PSBoundParameters.ContainsKey('AutoCommit')) {
    $AutoCommit = $true  # 默认启用自动提交
}

# 加载配置
if (-not (Test-Path "deploy-config.json")) {
    Write-Error "❌ 配置文件 deploy-config.json 不存在！"
    exit 1
}

$config = Get-Content "deploy-config.json" | ConvertFrom-Json
$serverHost = $config.server.host
$serverUser = $config.server.username
$serverPath = $config.server.projectPath
$sshKey = $config.server.sshKeyPath

# 全局变量
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "deploy_$timestamp.log"
$backupDir = "backup_$timestamp"

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Write-Success { param([string]$Message) Write-Log $Message "SUCCESS" }
function Write-Warning { param([string]$Message) Write-Log $Message "WARNING" }
function Write-Error-Log { param([string]$Message) Write-Log $Message "ERROR" }

# 错误处理
function Handle-Error {
    param([string]$ErrorMessage, [string]$Action = "")
    Write-Error-Log $ErrorMessage
    if ($Action -eq "rollback" -and -not $SkipBackup) {
        Write-Warning "尝试回滚到备份版本..."
        Invoke-Rollback
    }
    exit 1
}

# 检查依赖
function Test-Dependencies {
    Write-Log "🔍 检查依赖环境..."
    
    # 检查Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Handle-Error "Git 未安装或不在PATH中"
    }
    
    # 检查Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Handle-Error "Node.js 未安装或不在PATH中"
    }
    
    # 检查Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warning "Docker 未安装，将跳过容器化部署"
    }
    
    # 检查SSH连接
    if ($sshKey -and (Test-Path $sshKey)) {
        $sshTest = ssh -i $sshKey -o ConnectTimeout=5 "$serverUser@$serverHost" "echo 'SSH连接测试成功'" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "SSH连接测试失败，请检查密钥和网络"
        } else {
            Write-Success "SSH连接正常"
        }
    }
    
    Write-Success "依赖检查完成"
}

# Git操作
function Invoke-GitOperations {
    Write-Log "📦 执行Git操作..."
    
    # 检查工作区状态
    $gitStatus = git status --porcelain
    $hasUncommittedChanges = $null -ne $gitStatus -and $gitStatus.Length -gt 0
    
    if ($hasUncommittedChanges) {
        Write-Log "检测到未提交的更改："
        git status --short
        
        if ($AutoCommit) {
            Write-Log "🔄 自动提交更改..."
            
            # 添加所有更改到暂存区
            git add .
            if ($LASTEXITCODE -ne 0) {
                Handle-Error "添加文件到暂存区失败"
                return
            }
            
            # 生成提交信息
            $finalCommitMessage = if ($CommitMessage) { 
                $CommitMessage 
            } else { 
                "Auto deploy commit - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 
            }
            
            # 提交更改
            git commit -m $finalCommitMessage
            if ($LASTEXITCODE -ne 0) {
                Handle-Error "提交更改失败"
                return
            }
            
            Write-Success "✅ 代码已自动提交: $finalCommitMessage"
        } else {
            Write-Warning "⚠️ 工作区有未提交的更改，但自动提交已禁用"
            if (-not $Force) {
                $continue = Read-Host "是否继续？(y/N)"
                if ($continue -ne "y" -and $continue -ne "Y") {
                    Handle-Error "用户取消操作"
                    return
                }
            }
        }
    } else {
        Write-Log "✅ 工作区干净，无需提交"
    }
    
    # 切换分支
    $currentBranch = git branch --show-current
    if ($Branch -ne $currentBranch) {
        Write-Log "🔄 切换到分支: $Branch (当前: $currentBranch)"
        git checkout $Branch
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "切换分支失败: $Branch"
            return
        }
        Write-Success "✅ 已切换到分支: $Branch"
    } else {
        Write-Log "✅ 已在目标分支: $Branch"
    }
    
    # 拉取最新代码
    Write-Log "📥 拉取最新代码..."
    git pull origin $Branch
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️ 拉取代码失败，可能是网络问题或冲突"
        if (-not $Force) {
            $continue = Read-Host "是否继续部署？(y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Handle-Error "用户取消操作"
                return
            }
        }
    } else {
        Write-Success "✅ 代码拉取完成"
    }
    
    # 推送到远程（如果有本地提交）
    $unpushedCommits = git log origin/$Branch..HEAD --oneline 2>$null
    if ($unpushedCommits -and $unpushedCommits.Length -gt 0) {
        Write-Log "📤 推送本地提交到远程..."
        Write-Log "待推送的提交:"
        $unpushedCommits | ForEach-Object { Write-Log "  - $_" }
        
        git push origin $Branch
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "推送代码失败"
            return
        }
        Write-Success "✅ 代码推送完成"
    } else {
        Write-Log "✅ 无需推送，远程已是最新"
    }
    
    Write-Success "🎉 Git操作完成"
}

# 创建备份
function New-Backup {
    if ($SkipBackup) {
        Write-Log "跳过备份创建"
        return
    }
    
    Write-Log "📋 创建备份..."
    
    # 本地备份
    if (Test-Path $backupDir) {
        Remove-Item $backupDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    
    # 备份关键文件
    $backupItems = @(
        "ieclub-taro/dist",
        "ieclub-backend/dist",
        "docker-compose.yml",
        "deploy-config.json"
    )
    
    foreach ($item in $backupItems) {
        if (Test-Path $item) {
            $destPath = Join-Path $backupDir (Split-Path $item -Leaf)
            Copy-Item $item $destPath -Recurse -Force
            Write-Log "已备份: $item"
        }
    }
    
    # 服务器备份
    if ($sshKey -and (Test-Path $sshKey)) {
        Write-Log "创建服务器备份..."
        $remoteBackupCmd = @"
cd $serverPath && 
mkdir -p backups/backup_$timestamp && 
cp -r ieclub-taro/dist backups/backup_$timestamp/ 2>/dev/null || true &&
cp -r ieclub-backend/dist backups/backup_$timestamp/ 2>/dev/null || true &&
cp docker-compose.yml backups/backup_$timestamp/ 2>/dev/null || true &&
echo "服务器备份完成"
"@
        ssh -i $sshKey "$serverUser@$serverHost" $remoteBackupCmd
    }
    
    Write-Success "备份创建完成: $backupDir"
}

# 构建项目
function Invoke-Build {
    Write-Log "🏗️ 构建项目..."
    
    # 构建前端
    Write-Log "构建前端项目..."
    Set-Location "ieclub-taro"
    
    # 安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-Log "安装前端依赖..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Set-Location ".."
            Handle-Error "前端依赖安装失败"
        }
    }
    
    # 清理旧构建
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
    }
    
    # 执行构建
    Write-Log "执行前端构建 (环境: $Environment)..."
    switch ($Environment) {
        "prod" { npm run build:h5:prod }
        "dev" { npm run build:h5:dev }
        "test" { npm run build:h5:test }
        default { npm run build:h5 }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Set-Location ".."
        Handle-Error "前端构建失败"
    }
    
    # 验证构建结果
    if (-not (Test-Path "dist")) {
        Set-Location ".."
        Handle-Error "前端构建产物不存在"
    }
    
    Set-Location ".."
    Write-Success "前端构建完成"
    
    # 构建后端
    Write-Log "构建后端项目..."
    Set-Location "ieclub-backend"
    
    # 安装依赖
    if (-not (Test-Path "node_modules")) {
        Write-Log "安装后端依赖..."
        npm install --production
        if ($LASTEXITCODE -ne 0) {
            Set-Location ".."
            Handle-Error "后端依赖安装失败"
        }
    }
    
    # 生成Prisma客户端
    Write-Log "生成Prisma客户端..."
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        Set-Location ".."
        Handle-Error "Prisma客户端生成失败"
    }
    
    # 如果有TypeScript构建
    if (Test-Path "tsconfig.json") {
        Write-Log "编译TypeScript..."
        npx tsc
        if ($LASTEXITCODE -ne 0) {
            Set-Location ".."
            Handle-Error "TypeScript编译失败"
        }
    }
    
    Set-Location ".."
    Write-Success "后端构建完成"
}

# 上传到服务器
function Invoke-Upload {
    Write-Log "📤 上传文件到服务器..."
    
    if (-not $sshKey -or -not (Test-Path $sshKey)) {
        Handle-Error "SSH密钥不存在或未配置"
    }
    
    # 确保服务器目录存在
    $setupCmd = @"
mkdir -p $serverPath &&
cd $serverPath &&
mkdir -p ieclub-taro ieclub-backend backups logs
"@
    ssh -i $sshKey "$serverUser@$serverHost" $setupCmd
    
    # 上传前端构建产物
    if (Test-Path "ieclub-taro/dist") {
        Write-Log "上传前端文件..."
        scp -i $sshKey -r "ieclub-taro/dist" "$serverUser@$serverHost`:$serverPath/ieclub-taro/"
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "前端文件上传失败"
        }
    }
    
    # 上传后端文件
    Write-Log "上传后端文件..."
    $backendFiles = @(
        "ieclub-backend/package.json",
        "ieclub-backend/package-lock.json",
        "ieclub-backend/prisma",
        "ieclub-backend/src",
        "ieclub-backend/dist"
    )
    
    foreach ($file in $backendFiles) {
        if (Test-Path $file) {
            $fileName = Split-Path $file -Leaf
            scp -i $sshKey -r $file "$serverUser@$serverHost`:$serverPath/ieclub-backend/"
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "文件上传失败: $file"
            }
        }
    }
    
    # 上传配置文件
    Write-Log "上传配置文件..."
    $configFiles = @(
        "docker-compose.yml",
        "deploy-config.json"
    )
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            scp -i $sshKey $file "$serverUser@$serverHost`:$serverPath/"
        }
    }
    
    Write-Success "文件上传完成"
}

# 服务器部署
function Invoke-ServerDeploy {
    Write-Log "🚀 执行服务器部署..."
    
    if (-not $sshKey -or -not (Test-Path $sshKey)) {
        Handle-Error "SSH密钥不存在或未配置"
    }
    
    $deployCmd = @"
cd $serverPath &&
echo "开始服务器部署..." &&

# 停止现有服务
echo "停止现有服务..." &&
docker-compose down 2>/dev/null || true &&

# 安装后端依赖
echo "安装后端依赖..." &&
cd ieclub-backend &&
npm install --production &&
npx prisma generate &&
cd .. &&

# 启动服务
echo "启动服务..." &&
docker-compose up -d --build &&

# 等待服务启动
echo "等待服务启动..." &&
sleep 15 &&

# 检查服务状态
echo "检查服务状态..." &&
docker-compose ps &&

echo "服务器部署完成"
"@
    
    Write-Log "连接服务器执行部署..."
    ssh -i $sshKey "$serverUser@$serverHost" $deployCmd
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "服务器部署失败" "rollback"
    }
    
    Write-Success "服务器部署完成"
}

# 健康检查
function Invoke-HealthCheck {
    Write-Log "🏥 执行健康检查..."
    
    $healthResults = @()
    
    # 检查前端服务
    try {
        Write-Log "检查前端服务..."
        $frontendUrl = "http://$serverHost"
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ 前端服务正常 ($frontendUrl)"
            $healthResults += "前端: ✅ 正常"
        }
    } catch {
        Write-Error-Log "❌ 前端服务异常: $($_.Exception.Message)"
        $healthResults += "前端: ❌ 异常"
    }
    
    # 检查后端API
    try {
        Write-Log "检查后端API..."
        $backendUrl = "http://$serverHost`:3000/api/health"
        $response = Invoke-WebRequest -Uri $backendUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ 后端API正常 ($backendUrl)"
            $healthResults += "后端API: ✅ 正常"
        }
    } catch {
        Write-Error-Log "❌ 后端API异常: $($_.Exception.Message)"
        $healthResults += "后端API: ❌ 异常"
    }
    
    # 检查数据库连接
    if ($sshKey -and (Test-Path $sshKey)) {
        try {
            Write-Log "检查数据库连接..."
            $dbCheckCmd = "cd $serverPath && docker-compose exec -T db mysql -u root -p\$MYSQL_ROOT_PASSWORD -e 'SELECT 1;' 2>/dev/null && echo 'DB_OK' || echo 'DB_ERROR'"
            $dbResult = ssh -i $sshKey "$serverUser@$serverHost" $dbCheckCmd 2>$null
            if ($dbResult -match "DB_OK") {
                Write-Success "✅ 数据库连接正常"
                $healthResults += "数据库: ✅ 正常"
            } else {
                Write-Warning "⚠️ 数据库连接异常"
                $healthResults += "数据库: ⚠️ 异常"
            }
        } catch {
            Write-Warning "⚠️ 无法检查数据库状态"
            $healthResults += "数据库: ⚠️ 无法检查"
        }
    }
    
    # 检查Redis连接
    if ($sshKey -and (Test-Path $sshKey)) {
        try {
            Write-Log "检查Redis连接..."
            $redisCheckCmd = "cd $serverPath && docker-compose exec -T redis redis-cli ping 2>/dev/null && echo 'REDIS_OK' || echo 'REDIS_ERROR'"
            $redisResult = ssh -i $sshKey "$serverUser@$serverHost" $redisCheckCmd 2>$null
            if ($redisResult -match "PONG" -or $redisResult -match "REDIS_OK") {
                Write-Success "✅ Redis连接正常"
                $healthResults += "Redis: ✅ 正常"
            } else {
                Write-Warning "⚠️ Redis连接异常"
                $healthResults += "Redis: ⚠️ 异常"
            }
        } catch {
            Write-Warning "⚠️ 无法检查Redis状态"
            $healthResults += "Redis: ⚠️ 无法检查"
        }
    }
    
    # 输出健康检查摘要
    Write-Log "📊 健康检查摘要:"
    foreach ($result in $healthResults) {
        Write-Log "  $result"
    }
    
    # 检查是否有异常
    $hasErrors = $healthResults | Where-Object { $_ -match "❌" }
    if ($hasErrors) {
        Write-Warning "⚠️ 发现服务异常，请检查日志"
        return $false
    } else {
        Write-Success "🎉 所有服务运行正常！"
        return $true
    }
}

# 回滚操作
function Invoke-Rollback {
    Write-Log "🔄 执行回滚操作..."
    
    if ($SkipBackup) {
        Write-Error-Log "无法回滚：已跳过备份创建"
        return
    }
    
    if (-not (Test-Path $backupDir)) {
        Write-Error-Log "无法回滚：备份目录不存在"
        return
    }
    
    # 本地回滚
    Write-Log "回滚本地文件..."
    $backupItems = Get-ChildItem $backupDir
    foreach ($item in $backupItems) {
        $targetPath = $item.Name
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Recurse -Force
        }
        Copy-Item $item.FullName $targetPath -Recurse -Force
        Write-Log "已回滚: $targetPath"
    }
    
    # 服务器回滚
    if ($sshKey -and (Test-Path $sshKey)) {
        Write-Log "回滚服务器文件..."
        $rollbackCmd = @"
cd $serverPath &&
if [ -d "backups/backup_$timestamp" ]; then
    echo "回滚服务器文件..." &&
    cp -r backups/backup_$timestamp/* . &&
    docker-compose down &&
    docker-compose up -d &&
    echo "服务器回滚完成"
else
    echo "服务器备份不存在，跳过回滚"
fi
"@
        ssh -i $sshKey "$serverUser@$serverHost" $rollbackCmd
    }
    
    Write-Success "回滚操作完成"
}

# 清理操作
function Invoke-Cleanup {
    Write-Log "🧹 执行清理操作..."
    
    # 清理旧日志（保留最近10个）
    $logFiles = Get-ChildItem "deploy_*.log" | Sort-Object LastWriteTime -Descending
    if ($logFiles.Count -gt 10) {
        $oldLogs = $logFiles | Select-Object -Skip 10
        foreach ($log in $oldLogs) {
            Remove-Item $log.FullName
            Write-Log "删除旧日志: $($log.Name)"
        }
    }
    
    # 清理旧备份（保留最近5个）
    $backupDirs = Get-ChildItem "backup_*" -Directory | Sort-Object LastWriteTime -Descending
    if ($backupDirs.Count -gt 5) {
        $oldBackups = $backupDirs | Select-Object -Skip 5
        foreach ($backup in $oldBackups) {
            Remove-Item $backup.FullName -Recurse -Force
            Write-Log "删除旧备份: $($backup.Name)"
        }
    }
    
    # 服务器清理
    if ($sshKey -and (Test-Path $sshKey)) {
        Write-Log "清理服务器旧文件..."
        $cleanupCmd = @"
cd $serverPath &&
# 清理旧备份（保留最近5个）
cd backups 2>/dev/null && 
ls -t | tail -n +6 | xargs rm -rf 2>/dev/null || true &&
cd .. &&
# 清理Docker镜像
docker image prune -f 2>/dev/null || true &&
echo "服务器清理完成"
"@
        ssh -i $sshKey "$serverUser@$serverHost" $cleanupCmd
    }
    
    Write-Success "清理操作完成"
}

# 主函数
function Main {
    Write-Log "🚀 IEclub 完整部署开始..."
    Write-Log "参数: Action=$Action, Environment=$Environment, Branch=$Branch, Force=$Force"
    
    try {
        # 检查依赖
        Test-Dependencies
        
        switch ($Action.ToLower()) {
            "full" {
                Write-Log "执行完整部署流程..."
                New-Backup
                Invoke-GitOperations
                Invoke-Build
                Invoke-Upload
                Invoke-ServerDeploy
                Start-Sleep -Seconds 5
                $healthOk = Invoke-HealthCheck
                if (-not $healthOk -and -not $Force) {
                    Handle-Error "健康检查失败，部署可能有问题" "rollback"
                }
                Invoke-Cleanup
            }
            
            "build" {
                Write-Log "仅执行构建..."
                Invoke-Build
            }
            
            "upload" {
                Write-Log "仅执行上传..."
                Invoke-Upload
            }
            
            "server" {
                Write-Log "仅执行服务器部署..."
                Invoke-ServerDeploy
            }
            
            "health" {
                Write-Log "仅执行健康检查..."
                Invoke-HealthCheck
            }
            
            "rollback" {
                Write-Log "执行回滚操作..."
                Invoke-Rollback
            }
            
            default {
                Write-Error-Log "未知操作: $Action"
                Write-Log "可用操作: full, build, upload, server, health, rollback"
                exit 1
            }
        }
        
        Write-Success "🎉 操作完成！"
        Write-Log "访问地址: http://$serverHost"
        Write-Log "后端API: http://$serverHost`:3000"
        Write-Log "日志文件: $logFile"
        
    } catch {
        Handle-Error "执行过程中发生错误: $($_.Exception.Message)"
    }
}

# 执行主函数
Main