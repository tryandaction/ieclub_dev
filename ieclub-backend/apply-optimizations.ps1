# IEClub 后端优化应用脚本 (PowerShell 版本)
# 用途：自动应用所有优化配置

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  IEClub 后端优化应用脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误: 请在 ieclub-backend 目录下运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "步骤 1/5: 检查依赖..." -ForegroundColor Yellow
# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm 已安装: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未安装 npm" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "步骤 2/5: 安装/更新依赖..." -ForegroundColor Yellow
npm install
Write-Host "✓ 依赖安装完成" -ForegroundColor Green
Write-Host ""

Write-Host "步骤 3/5: 检查数据库连接..." -ForegroundColor Yellow
# 读取 .env 文件
if (Test-Path ".env") {
    Write-Host "✓ 已找到 .env 配置文件" -ForegroundColor Green
    
    # 询问是否应用数据库索引优化
    Write-Host ""
    $applyIndex = Read-Host "是否应用数据库索引优化？(y/n)"
    
    if ($applyIndex -eq "y" -or $applyIndex -eq "Y") {
        Write-Host "正在应用数据库索引优化..." -ForegroundColor Yellow
        
        # 检查 MySQL 客户端
        try {
            $mysqlVersion = mysql --version
            Write-Host "✓ MySQL 客户端已安装" -ForegroundColor Green
            
            # 获取数据库配置
            Write-Host ""
            Write-Host "请输入数据库配置:" -ForegroundColor Cyan
            $dbHost = Read-Host "数据库主机 (默认: localhost)"
            if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = "localhost" }
            
            $dbPort = Read-Host "数据库端口 (默认: 3306)"
            if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = "3306" }
            
            $dbName = Read-Host "数据库名称 (默认: ieclub_db)"
            if ([string]::IsNullOrEmpty($dbName)) { $dbName = "ieclub_db" }
            
            $dbUser = Read-Host "数据库用户 (默认: root)"
            if ([string]::IsNullOrEmpty($dbUser)) { $dbUser = "root" }
            
            $dbPassword = Read-Host "数据库密码" -AsSecureString
            $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
            )
            
            Write-Host ""
            Write-Host "数据库配置:" -ForegroundColor Cyan
            Write-Host "  主机: $dbHost"
            Write-Host "  端口: $dbPort"
            Write-Host "  数据库: $dbName"
            Write-Host "  用户: $dbUser"
            Write-Host ""
            
            # 执行索引优化脚本
            $mysqlCmd = "mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPasswordPlain $dbName"
            Get-Content "scripts\optimize-database-indexes.sql" | & mysql -h $dbHost -P $dbPort -u $dbUser "-p$dbPasswordPlain" $dbName
            
            Write-Host "✓ 数据库索引优化完成" -ForegroundColor Green
        } catch {
            Write-Host "✗ 数据库索引优化失败: $_" -ForegroundColor Red
            Write-Host "  请手动执行: mysql -u root -p ieclub_db < scripts\optimize-database-indexes.sql" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⊘ 跳过数据库索引优化" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ 未找到 .env 文件，将使用默认配置" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "步骤 4/5: 检查配置文件..." -ForegroundColor Yellow

# 检查必需的环境变量
$requiredVars = @("DATABASE_URL", "JWT_SECRET", "SESSION_SECRET")
$missingVars = @()

if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    foreach ($var in $requiredVars) {
        $found = $false
        foreach ($line in $envContent) {
            if ($line -match "^$var=") {
                $found = $true
                break
            }
        }
        if (-not $found) {
            $missingVars += $var
        }
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠ 缺少以下环境变量:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "  - $var"
    }
    Write-Host ""
    Write-Host "  请在 .env 文件中配置这些变量" -ForegroundColor Yellow
} else {
    Write-Host "✓ 所有必需的环境变量已配置" -ForegroundColor Green
}
Write-Host ""

Write-Host "步骤 5/5: 验证优化文件..." -ForegroundColor Yellow

# 检查优化文件是否存在
$optimizationFiles = @(
    "src\utils\common.js",
    "src\utils\errorHandler.js",
    "src\utils\queryTimeout.js",
    "src\utils\performanceMonitor.js",
    "src\middleware\requestLogger.js",
    "src\controllers\BaseController.js",
    "scripts\optimize-database-indexes.sql"
)

$missingFiles = @()
foreach ($file in $optimizationFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "✗ 缺少以下优化文件:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "  - $file"
    }
    Write-Host ""
    Write-Host "  请确保所有优化文件都已正确创建" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ 所有优化文件已就绪" -ForegroundColor Green
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  优化应用完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "优化内容:"
Write-Host "  ✓ 通用工具函数库"
Write-Host "  ✓ 统一错误处理"
Write-Host "  ✓ 查询超时控制"
Write-Host "  ✓ 性能监控工具"
Write-Host "  ✓ 请求日志中间件"
Write-Host "  ✓ 控制器基类"
Write-Host "  ✓ 速率限制"
Write-Host "  ✓ 数据库索引优化（如已应用）"
Write-Host ""
Write-Host "下一步:"
Write-Host "  1. 启动服务: npm start"
Write-Host "  2. 查看性能报告: curl http://localhost:3000/performance"
Write-Host "  3. 查看 API 文档: curl http://localhost:3000/api/docs"
Write-Host "  4. 阅读优化文档: Get-Content README_OPTIMIZATION.md"
Write-Host ""
Write-Host "监控端点:"
Write-Host "  - GET /health - 健康检查"
Write-Host "  - GET /performance - 性能报告（开发环境）"
Write-Host "  - GET /api/test - API 测试"
Write-Host "  - GET /api/docs - API 文档"
Write-Host ""
Write-Host "祝您使用愉快！" -ForegroundColor Green
Write-Host ""

