#!/usr/bin/env pwsh
<#
.SYNOPSIS
    完整重新部署脚本 - 测试环境和生产环境
.DESCRIPTION
    此脚本将：
    1. 停止所有PM2服务
    2. 升级Node.js到v20 LTS
    3. 清理并重新安装依赖
    4. 重新部署测试环境
    5. 可选：部署到生产环境（需要确认）
.EXAMPLE
    .\Redeploy-All.ps1
#>

param(
    [switch]$SkipProduction = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"
$SERVER = "root@ieclub.online"
$BACKEND_DIR = "/root/ieclub-backend"
$STAGING_PORT = 3001
$PROD_PORT = 3000

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{
        "Red" = "91"; "Green" = "92"; "Yellow" = "93"; 
        "Blue" = "94"; "Magenta" = "95"; "Cyan" = "96"; "White" = "97"
    }
    Write-Host "`e[$($colors[$Color])m$Message`e[0m"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n==> $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" "Yellow"
}

# 执行SSH命令
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$IgnoreError
    )
    
    Write-Host "  执行: $Description"
    $result = ssh $SERVER "bash -c `"$Command`"" 2>&1
    
    if ($LASTEXITCODE -ne 0 -and -not $IgnoreError) {
        Write-Error "命令失败: $Description"
        Write-Host $result
        throw "SSH命令执行失败"
    }
    
    return $result
}

# 主流程开始
Write-ColorOutput @"

╔════════════════════════════════════════════════════════════╗
║         IEClub 完整重新部署脚本                              ║
║         服务器: ieclub.online                               ║
╚════════════════════════════════════════════════════════════╝

"@ "Magenta"

# 步骤1: 停止所有PM2服务
Write-Step "步骤 1/8: 停止所有PM2服务"
try {
    Invoke-SSHCommand "pm2 delete all" "删除所有PM2进程" -IgnoreError
    Invoke-SSHCommand "pm2 save --force" "保存PM2配置"
    Write-Success "PM2服务已停止"
} catch {
    Write-Warning "PM2服务停止时出现警告（可能已经停止）"
}

# 步骤2: 检查当前Node.js版本
Write-Step "步骤 2/8: 检查Node.js版本"
$nodeVersion = Invoke-SSHCommand "node --version" "获取Node版本"
Write-Host "  当前版本: $nodeVersion"

if ($nodeVersion -notmatch "v20\.") {
    Write-Step "升级Node.js到v20 LTS"
    
    # 使用nvm升级（如果已安装）
    $nvmExists = Invoke-SSHCommand "command -v nvm" "检查nvm" -IgnoreError
    
    if ($nvmExists) {
        Write-Host "  使用nvm升级..."
        Invoke-SSHCommand "source ~/.nvm/nvm.sh && nvm install 20 && nvm use 20 && nvm alias default 20" "nvm安装Node 20"
    } else {
        Write-Host "  使用apt升级..."
        Invoke-SSHCommand "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs" "apt安装Node 20"
    }
    
    $newVersion = Invoke-SSHCommand "node --version" "确认新版本"
    Write-Success "Node.js已升级到: $newVersion"
} else {
    Write-Success "Node.js版本已经是v20"
}

# 步骤3: 清理并重新安装依赖
Write-Step "步骤 3/8: 清理并重新安装后端依赖"
Invoke-SSHCommand "cd $BACKEND_DIR && rm -rf node_modules package-lock.json" "清理旧依赖"
Invoke-SSHCommand "cd $BACKEND_DIR && npm install --production" "安装生产依赖"
Write-Success "依赖安装完成"

# 步骤4: 验证环境变量
Write-Step "步骤 4/8: 验证环境变量配置"
$envCheck = Invoke-SSHCommand "cd $BACKEND_DIR && test -f .env && echo 'EXISTS' || echo 'MISSING'" "检查.env文件"

if ($envCheck -match "MISSING") {
    Write-Error ".env文件不存在！"
    Write-Host "请先配置环境变量文件"
    exit 1
}

# 检查关键环境变量
$requiredVars = @("JWT_SECRET", "SENDGRID_API_KEY", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME")
foreach ($var in $requiredVars) {
    $check = Invoke-SSHCommand "cd $BACKEND_DIR && grep -q '^$var=' .env && echo 'OK' || echo 'MISSING'" "检查$var" -IgnoreError
    if ($check -match "MISSING") {
        Write-Warning "环境变量 $var 可能未配置"
    }
}
Write-Success "环境变量验证完成"

# 步骤5: 测试数据库连接
Write-Step "步骤 5/8: 测试数据库连接"
$dbTest = Invoke-SSHCommand @"
cd $BACKEND_DIR && node -e \"
const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await conn.end();
    console.log('DB_OK');
  } catch (err) {
    console.log('DB_ERROR:', err.message);
    process.exit(1);
  }
})();
\"
"@ "测试数据库连接"

if ($dbTest -match "DB_OK") {
    Write-Success "数据库连接正常"
} else {
    Write-Error "数据库连接失败: $dbTest"
    exit 1
}

# 步骤6: 部署测试环境
Write-Step "步骤 6/8: 部署测试环境 (端口 $STAGING_PORT)"
Invoke-SSHCommand "cd $BACKEND_DIR && pm2 delete ieclub-staging" "删除旧的staging进程" -IgnoreError
Invoke-SSHCommand @"
cd $BACKEND_DIR && pm2 start src/server.js \
  --name ieclub-staging \
  --node-args='--max-old-space-size=512' \
  -- --port=$STAGING_PORT
"@ "启动staging环境"

Start-Sleep -Seconds 3

# 验证staging
$stagingHealth = Invoke-SSHCommand "curl -s http://localhost:$STAGING_PORT/api/health || echo 'FAILED'" "检查staging健康状态"
if ($stagingHealth -match "ok|healthy") {
    Write-Success "测试环境部署成功！"
    Write-Host "  访问地址: http://ieclub.online:$STAGING_PORT"
} else {
    Write-Error "测试环境启动失败"
    Invoke-SSHCommand "pm2 logs ieclub-staging --lines 20 --nostream" "查看日志"
    exit 1
}

# 步骤7: 部署生产环境（需要确认）
if (-not $SkipProduction) {
    Write-Step "步骤 7/8: 部署生产环境 (端口 $PROD_PORT)"
    
    if (-not $Force) {
        Write-Warning "即将部署到生产环境！"
        Write-Host "  这将影响正在运行的服务"
        Write-Host "  生产环境地址: https://ieclub.online"
        Write-Host ""
        
        $confirmation = Read-Host "是否继续部署到生产环境? (输入 YES 继续)"
        
        if ($confirmation -ne "YES") {
            Write-Warning "已取消生产环境部署"
            Write-Success "测试环境已成功部署"
            exit 0
        }
    }
    
    Write-Host "  开始部署生产环境..."
    Invoke-SSHCommand "cd $BACKEND_DIR && pm2 delete ieclub-backend" "删除旧的生产进程" -IgnoreError
    Invoke-SSHCommand @"
cd $BACKEND_DIR && pm2 start src/server.js \
  --name ieclub-backend \
  --node-args='--max-old-space-size=1024' \
  -- --port=$PROD_PORT
"@ "启动生产环境"
    
    Start-Sleep -Seconds 3
    
    # 验证生产环境
    $prodHealth = Invoke-SSHCommand "curl -s http://localhost:$PROD_PORT/api/health || echo 'FAILED'" "检查生产环境健康状态"
    if ($prodHealth -match "ok|healthy") {
        Write-Success "生产环境部署成功！"
        Write-Host "  访问地址: https://ieclub.online"
    } else {
        Write-Error "生产环境启动失败"
        Invoke-SSHCommand "pm2 logs ieclub-backend --lines 20 --nostream" "查看日志"
        exit 1
    }
} else {
    Write-Warning "已跳过生产环境部署（使用 -SkipProduction 参数）"
}

# 步骤8: 保存PM2配置并设置开机自启
Write-Step "步骤 8/8: 保存PM2配置"
Invoke-SSHCommand "pm2 save" "保存PM2进程列表"
Invoke-SSHCommand "pm2 startup systemd -u root --hp /root" "设置PM2开机自启" -IgnoreError
Write-Success "PM2配置已保存"

# 最终状态
Write-Step "部署完成！查看服务状态"
$pmStatus = Invoke-SSHCommand "pm2 list" "获取PM2状态"
Write-Host $pmStatus

Write-ColorOutput @"

╔════════════════════════════════════════════════════════════╗
║                   部署成功完成！                             ║
╚════════════════════════════════════════════════════════════╝

测试环境: http://ieclub.online:$STAGING_PORT
生产环境: https://ieclub.online

常用命令:
  查看日志: ssh $SERVER "pm2 logs"
  重启服务: ssh $SERVER "pm2 restart all"
  查看状态: ssh $SERVER "pm2 status"

"@ "Green"

exit 0

