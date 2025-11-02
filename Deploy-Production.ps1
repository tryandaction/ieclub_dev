# ============================================
# IEClub 生产环境部署脚本
# ============================================
# 用途：正式发布，所有用户可见
# 执行后：ieclub.online 和小程序都会更新
# 
# ⚠️ 警告：此脚本会影响所有线上用户！
# 
# 使用方法：
#   .\Deploy-Production.ps1 -Target <web|weapp|backend|all> [-Message "发布信息"]
#
# 示例：
#   .\Deploy-Production.ps1 -Target all -Message "v1.2.0 正式发布"
#   .\Deploy-Production.ps1 -Target web
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("web", "weapp", "backend", "all")]
    [string]$Target,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Production deployment",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfirm
)

# --- Configuration ---
$ProjectRoot = $PSScriptRoot
$WebDir = "${ProjectRoot}\ieclub-web"
$WeappDir = "${ProjectRoot}\ieclub-frontend"
$BackendDir = "${ProjectRoot}\ieclub-backend"

# 生产环境服务器配置
$ServerUser = "root"
$ServerHost = "ieclub.online"
$ServerPort = 22

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n================================================================" -ForegroundColor Magenta
    Write-Host "  $Text" -ForegroundColor Magenta
    Write-Host "================================================================`n" -ForegroundColor Magenta
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

# --- Pre-deployment Checks ---
function Check-PreDeployment {
    Write-Section "部署前检查"
    
    $hasErrors = $false
    
    # 检查是否在 main 分支
    Set-Location -Path $ProjectRoot
    $currentBranch = git branch --show-current
    
    if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
        Write-Warning "当前不在 main/master 分支！"
        Write-Info "当前分支: $currentBranch"
        Write-Warning "生产环境应该从 main/master 分支部署"
        $hasErrors = $true
    } else {
        Write-Success "分支检查通过: $currentBranch"
    }
    
    # 检查是否有未提交的更改
    $status = git status --porcelain
    if ($status) {
        Write-Warning "存在未提交的更改！"
        Write-Info "请先提交所有更改"
        $hasErrors = $true
    } else {
        Write-Success "工作区检查通过: 无未提交更改"
    }
    
    # 检查配置文件模板
    if ($Target -eq "web" -or $Target -eq "all") {
        if (-not (Test-Path "${WebDir}\env.production.template")) {
            Write-Error "缺少 env.production.template 文件！"
            $hasErrors = $true
        } else {
            Write-Success "前端配置模板存在"
        }
    }
    
    if ($Target -eq "backend" -or $Target -eq "all") {
        if (-not (Test-Path "${BackendDir}\env.production.template")) {
            Write-Error "缺少 env.production.template 文件！"
            $hasErrors = $true
        } else {
            Write-Success "后端配置模板存在"
        }
    }
    
    if ($hasErrors) {
        Write-Error "部署前检查失败！请修复上述问题后重试"
        exit 1
    }
    
    Write-Success "所有检查通过"
}

# --- Git Tag ---
function Create-ReleaseTag {
    Write-Section "创建发布标签"
    Set-Location -Path $ProjectRoot
    
    # 获取最新标签
    $latestTag = git describe --tags --abbrev=0 2>$null
    if ($latestTag) {
        Write-Info "最新标签: $latestTag"
    } else {
        Write-Info "尚无标签"
    }
    
    # 询问是否创建标签
    $createTag = Read-Host "是否创建新的发布标签? (y/n)"
    if ($createTag -eq "y") {
        $tagName = Read-Host "请输入标签名称 (例如: v1.2.0)"
        if ($tagName) {
            git tag -a $tagName -m "Release $tagName: $Message"
            git push origin $tagName
            Write-Success "已创建标签: $tagName"
        }
    }
}

# --- Git Commit ---
function Commit-Changes {
    Write-Section "提交代码到 Git (生产分支)"
    Set-Location -Path $ProjectRoot
    
    git add .
    git commit -m "[PRODUCTION] $Message"
    Write-Success "已提交更改: $Message"
    
    # 推送到远程
    Write-Info "推送到远程仓库..."
    git push origin main
    Write-Success "已推送到 GitHub"
}

# --- Build Web Frontend (Production) ---
function Build-Web-Production {
    Write-Section "构建前端 (生产环境)"
    Set-Location -Path $WebDir
    
    # 使用模板创建 .env.production 文件（如果不存在）
    if (-not (Test-Path ".env.production")) {
        if (Test-Path "env.production.template") {
            Write-Info "从模板创建 .env.production 文件..."
            Copy-Item "env.production.template" ".env.production"
            Write-Success "已创建 .env.production 文件"
        } else {
            Write-Error "env.production.template 文件不存在！"
            exit 1
        }
    }
    
    Write-Info "使用配置: .env.production"
    Get-Content ".env.production" | Write-Host -ForegroundColor Cyan
    Write-Host ""
    
    Write-Info "安装依赖..."
    npm install
    
    Write-Info "构建生产版本..."
    $env:NODE_ENV = "production"
    npm run build
    
    if (Test-Path "dist") {
        Write-Success "前端构建完成 (生产版)"
        
        # 显示构建信息
        Write-Info "构建产物:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
        
        # 检查关键文件
        if (Test-Path "dist\index.html") {
            Write-Success "index.html 验证通过"
        } else {
            Write-Error "index.html 不存在！"
            exit 1
        }
    } else {
        Write-Error "前端构建失败 - dist 目录不存在"
        exit 1
    }
}

# --- Build Mini Program ---
function Build-Weapp-Production {
    Write-Section "准备小程序 (生产环境)"
    Set-Location -Path $WeappDir
    
    # 检查小程序配置
    if (Test-Path "app.json") {
        Write-Info "检测到微信小程序项目"
        
        # 检查 API 配置
        $appJs = Get-Content "app.js" -Raw
        if ($appJs -match "ieclub\.online") {
            Write-Success "小程序 API 配置正确: ieclub.online"
        } else {
            Write-Warning "请检查小程序 API 配置"
        }
        
        Write-Host ""
        Write-Host "小程序发布步骤:" -ForegroundColor Yellow
        Write-Host "  1. 使用微信开发者工具打开项目: $WeappDir" -ForegroundColor White
        Write-Host "  2. 点击右上角 '上传' 按钮" -ForegroundColor White
        Write-Host "  3. 填写版本号和备注" -ForegroundColor White
        Write-Host "  4. 上传完成后，登录微信公众平台提交审核" -ForegroundColor White
        Write-Host ""
        
        $openDevTools = Read-Host "是否打开微信开发者工具? (y/n)"
        if ($openDevTools -eq "y") {
            Write-Info "正在打开微信开发者工具..."
            # 尝试打开微信开发者工具（需要已安装）
            Start-Process "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" -ArgumentList "open --project $WeappDir" -ErrorAction SilentlyContinue
        }
    } else {
        Write-Error "小程序配置文件 app.json 不存在"
        exit 1
    }
}

# --- Deploy Web to Production ---
function Deploy-Web-Production {
    Write-Section "部署前端到生产环境"
    
    Set-Location -Path $WebDir
    
    # 打包构建产物
    Write-Info "打包前端文件..."
    if (Test-Path "web-dist.zip") {
        Remove-Item "web-dist.zip" -Force
    }
    
    Compress-Archive -Path "dist\*" -DestinationPath "web-dist.zip"
    Write-Success "打包完成"
    
    # 备份当前生产环境
    Write-Info "备份当前生产环境..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -d /var/www/ieclub.online ]; then
    timestamp=\$(date +%Y%m%d_%H%M%S)
    cp -r /var/www/ieclub.online /var/www/ieclub.online.backup.\$timestamp
    echo '已备份到: /var/www/ieclub.online.backup.'\$timestamp
fi
"@
    
    # 上传到服务器
    Write-Info "上传到生产服务器..."
    scp -P $ServerPort "web-dist.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 部署到生产目录
    Write-Info "部署到生产目录..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
mkdir -p /var/www/ieclub.online
unzip -o /tmp/web-dist.zip -d /var/www/ieclub.online/
rm -f /tmp/web-dist.zip
chmod -R 755 /var/www/ieclub.online
chown -R www-data:www-data /var/www/ieclub.online
echo '生产环境前端部署完成'
"@
    
    Write-Success "前端部署完成 (生产环境)"
    Write-Info "访问地址: https://ieclub.online"
}

# --- Deploy Backend to Production ---
function Deploy-Backend-Production {
    Write-Section "部署后端到生产环境"
    
    Set-Location -Path $BackendDir
    
    # 使用模板创建 .env.production 文件（如果不存在）
    if (-not (Test-Path ".env.production")) {
        if (Test-Path "env.production.template") {
            Write-Info "从模板创建 .env.production 文件..."
            Copy-Item "env.production.template" ".env.production"
            Write-Warning "请检查并修改 .env.production 中的数据库密码等敏感信息！"
        } else {
            Write-Error "env.production.template 文件不存在！"
            exit 1
        }
    }
    
    # 打包后端代码
    Write-Info "打包后端代码..."
    if (Test-Path "backend-code.zip") {
        Remove-Item "backend-code.zip" -Force
    }
    
    $excludeItems = @("node_modules", ".git", "dist", "*.log", "*.zip", ".env*", "coverage", "uploads")
    Get-ChildItem -Path . -Exclude $excludeItems | Compress-Archive -DestinationPath "backend-code.zip" -Force
    Write-Success "后端打包完成"
    
    # 上传到服务器
    Write-Info "上传后端代码到生产服务器..."
    scp -P $ServerPort "backend-code.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # 上传生产环境配置模板（不覆盖现有 .env）
    Write-Info "上传生产环境配置模板..."
    scp -P $ServerPort "env.production.template" "${ServerUser}@${ServerHost}:/tmp/env.production.template"
    
    # 在服务器上部署
    Write-Info "部署后端到生产环境..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
cd /root/IEclub_dev/ieclub-backend

# 备份当前代码
timestamp=\$(date +%Y%m%d_%H%M%S)
tar -czf backup_\$timestamp.tar.gz src/ 2>/dev/null || true

# 解压新代码
unzip -o /tmp/backend-code.zip
rm -f /tmp/backend-code.zip

# 检查 .env 文件（如果不存在则使用模板）
if [ ! -f .env ]; then
    echo '警告: .env 文件不存在，使用模板创建'
    cp /tmp/env.production.template .env
    echo '⚠️  请手动编辑 .env 文件配置生产环境参数'
fi
rm -f /tmp/env.production.template

# 安装依赖
npm install --production

# 运行数据库迁移
npx prisma migrate deploy

# 重启生产环境后端服务
pm2 reload ieclub-backend || pm2 start npm --name 'ieclub-backend' -- start
pm2 save

echo '生产环境后端部署完成'
pm2 status
"@
    
    Write-Success "后端部署完成 (生产环境)"
    Write-Info "API地址: https://ieclub.online/api"
    Write-Info "健康检查: https://ieclub.online/api/health"
}

# --- Post-deployment Verification ---
function Verify-Deployment {
    Write-Section "部署验证"
    
    if ($Target -eq "web" -or $Target -eq "all") {
        Write-Info "验证前端部署..."
        try {
            $response = Invoke-WebRequest -Uri "https://ieclub.online" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "前端访问正常 (HTTP 200)"
            }
        } catch {
            Write-Warning "前端访问失败: $_"
        }
    }
    
    if ($Target -eq "backend" -or $Target -eq "all") {
        Write-Info "验证后端部署..."
        try {
            $response = Invoke-WebRequest -Uri "https://ieclub.online/api/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "后端 API 正常 (HTTP 200)"
                Write-Info "响应: $($response.Content)"
            }
        } catch {
            Write-Warning "后端 API 访问失败: $_"
        }
    }
}

# --- Main Execution ---
Write-Section "IEClub 生产环境部署"
Write-Host "🚀 生产环境部署" -ForegroundColor Magenta
Write-Host "   ⚠️  此操作会影响所有线上用户！" -ForegroundColor Red
Write-Host "   ⚠️  请确保已在测试环境验证通过！" -ForegroundColor Red
Write-Host ""
Write-Info "部署目标: $Target"
Write-Info "发布信息: $Message"

# 部署前检查
Check-PreDeployment

# 最终确认
if (-not $SkipConfirm) {
    Write-Host ""
    Write-Host "⚠️  最终确认 ⚠️" -ForegroundColor Red
    Write-Host "此操作将部署到生产环境，影响所有用户！" -ForegroundColor Yellow
    Write-Host ""
    $finalConfirm = Read-Host "确认部署到生产环境? 请输入 'YES' 确认"
    if ($finalConfirm -ne "YES") {
        Write-Info "已取消部署"
        exit 0
    }
}

# 提交代码
Commit-Changes

# 创建发布标签
Create-ReleaseTag

# 执行部署
switch ($Target) {
    "web" {
        Build-Web-Production
        Deploy-Web-Production
    }
    "weapp" {
        Build-Weapp-Production
    }
    "backend" {
        Deploy-Backend-Production
    }
    "all" {
        Build-Web-Production
        Deploy-Web-Production
        Build-Weapp-Production
        Deploy-Backend-Production
    }
}

# 部署验证
Verify-Deployment

Write-Section "生产环境部署完成"
Write-Host "✅ 部署成功！" -ForegroundColor Green
Write-Host ""
Write-Host "生产环境访问地址:" -ForegroundColor Cyan
Write-Host "  - 网站: https://ieclub.online" -ForegroundColor White
Write-Host "  - API: https://ieclub.online/api" -ForegroundColor White
if ($Target -eq "weapp" -or $Target -eq "all") {
    Write-Host "  - 小程序: 请在微信开发者工具中上传并提交审核" -ForegroundColor White
}
Write-Host ""
Write-Host "后续步骤:" -ForegroundColor Yellow
Write-Host "  1. 监控系统运行状态" -ForegroundColor White
Write-Host "  2. 检查用户反馈" -ForegroundColor White
Write-Host "  3. 如有问题，可回滚到备份版本" -ForegroundColor White
Write-Host ""

# 返回项目根目录
Set-Location -Path $ProjectRoot

