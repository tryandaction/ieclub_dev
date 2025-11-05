# IEclub管理员系统 - 快速启动脚本
# Windows PowerShell版本

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       IEclub 管理员系统 - 快速启动                    " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 获取项目根目录
$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

# 检查Node.js
Write-Host "[1/6] 检查Node.js环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 未找到Node.js，请先安装Node.js 18+" -ForegroundColor Red
    exit 1
}

# 检查npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 未找到npm" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 检查后端依赖
Write-Host "[2/6] 检查后端依赖..." -ForegroundColor Yellow
Set-Location "$RootDir\ieclub-backend"

if (-Not (Test-Path "node_modules")) {
    Write-Host "  ! 后端依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 后端依赖安装失败" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  ✓ 后端依赖已就绪" -ForegroundColor Green

Write-Host ""

# 检查前端依赖
Write-Host "[3/6] 检查前端依赖..." -ForegroundColor Yellow
Set-Location "$RootDir\admin-web"

if (-Not (Test-Path "node_modules")) {
    Write-Host "  ! 前端依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  ✓ 前端依赖已就绪" -ForegroundColor Green

Write-Host ""

# 检查数据库
Write-Host "[4/6] 检查数据库配置..." -ForegroundColor Yellow
Set-Location "$RootDir\ieclub-backend"

if (-Not (Test-Path ".env")) {
    Write-Host "  ! 未找到.env文件" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ℹ 已从.env.example复制配置文件" -ForegroundColor Cyan
        Write-Host "  ⚠ 请编辑.env文件配置数据库信息" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ 数据库配置已存在" -ForegroundColor Green
}

Write-Host ""

# 运行数据库迁移
Write-Host "[5/6] 运行数据库迁移..." -ForegroundColor Yellow
Set-Location "$RootDir\ieclub-backend"

Write-Host "  ℹ 运行Prisma迁移..." -ForegroundColor Cyan
npx prisma migrate dev --name add_admin_system 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ 数据库迁移成功" -ForegroundColor Green
} else {
    Write-Host "  ⚠ 数据库迁移失败或已存在" -ForegroundColor Yellow
}

Write-Host ""

# 初始化管理员
Write-Host "[6/6] 初始化管理员账号..." -ForegroundColor Yellow
Write-Host "  ℹ 如果已有管理员账号，可以跳过此步骤" -ForegroundColor Cyan
Write-Host ""

$createAdmin = Read-Host "是否需要创建新的管理员账号？(y/n)"

if ($createAdmin -eq "y" -or $createAdmin -eq "Y") {
    npm run init:admin
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       准备启动服务...                                " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# 启动后端
Write-Host "启动后端服务 (端口: 3000)..." -ForegroundColor Green
Set-Location "$RootDir\ieclub-backend"

# 在新窗口启动后端
$backendScript = @"
Set-Location '$RootDir\ieclub-backend'
Write-Host '后端服务启动中...' -ForegroundColor Green
npm run dev
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $backendScript

Write-Host "  ✓ 后端服务已在新窗口启动" -ForegroundColor Green
Write-Host "  URL: http://localhost:3000" -ForegroundColor Cyan

Start-Sleep -Seconds 3

# 启动前端
Write-Host ""
Write-Host "启动前端服务 (端口: 3001)..." -ForegroundColor Green
Set-Location "$RootDir\admin-web"

# 在新窗口启动前端
$frontendScript = @"
Set-Location '$RootDir\admin-web'
Write-Host '前端服务启动中...' -ForegroundColor Green
npm run dev
"@

Start-Process pwsh -ArgumentList "-NoExit", "-Command", $frontendScript

Write-Host "  ✓ 前端服务已在新窗口启动" -ForegroundColor Green
Write-Host "  URL: http://localhost:3001" -ForegroundColor Cyan

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "       🎉 启动完成！                                   " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  后端API: http://localhost:3000" -ForegroundColor Green
Write-Host "  管理后台: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "  默认账号: admin@ieclub.com" -ForegroundColor Yellow
Write-Host "  默认密码: (您在初始化时设置的密码)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ℹ 后端和前端已在新窗口中启动" -ForegroundColor Cyan
Write-Host "  ℹ 关闭窗口即可停止服务" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📖 完整文档请查看: START_ADMIN_SYSTEM.md" -ForegroundColor Cyan
Write-Host ""

# 等待3秒后自动打开浏览器
Write-Host "3秒后将自动打开浏览器..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

