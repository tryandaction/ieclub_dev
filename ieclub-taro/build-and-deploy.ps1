# IEClub 前端构建和部署脚本
# 支持 H5 和微信小程序双平台构建

param(
    [string]$Platform = "h5",  # h5, weapp, both
    [switch]$Production = $false,
    [switch]$Clean = $true
)

Write-Host "🚀 IEClub 前端构建脚本启动..." -ForegroundColor Green
Write-Host "平台: $Platform" -ForegroundColor Cyan
Write-Host "生产模式: $Production" -ForegroundColor Cyan

# 设置工作目录
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# 清理旧的构建文件
if ($Clean) {
    Write-Host "🧹 清理旧的构建文件..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "✅ 已清理 dist 目录" -ForegroundColor Green
    }
}

# 检查 Node.js 和 npm
Write-Host "🔍 检查环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 或 npm 未安装或不在 PATH 中" -ForegroundColor Red
    exit 1
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}

# 构建函数
function Build-Platform {
    param(
        [string]$Type,
        [string]$Command
    )
    
    Write-Host "🔨 构建 $Type 平台..." -ForegroundColor Yellow
    Write-Host "执行命令: $Command" -ForegroundColor Gray
    
    Invoke-Expression $Command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $Type 构建成功" -ForegroundColor Green
        
        # 检查构建输出
        if ($Type -eq "H5") {
            $h5Path = "dist/h5"
            if (Test-Path $h5Path) {
                $fileCount = (Get-ChildItem -Path $h5Path -Recurse -File).Count
                Write-Host "📁 H5 文件数量: $fileCount" -ForegroundColor Cyan
            } else {
                Write-Host "⚠️ H5 构建输出目录不存在: $h5Path" -ForegroundColor Yellow
            }
        } elseif ($Type -eq "WeApp") {
            $weappPath = "dist"
            if (Test-Path $weappPath) {
                $fileCount = (Get-ChildItem -Path $weappPath -Recurse -File).Count
                Write-Host "📁 小程序文件数量: $fileCount" -ForegroundColor Cyan
            }
        }
        
        return $true
    } else {
        Write-Host "❌ $Type 构建失败" -ForegroundColor Red
        return $false
    }
}

# 根据平台参数执行构建
$buildSuccess = $true

switch ($Platform.ToLower()) {
    "h5" {
        $command = if ($Production) { "npm run build:h5:prod" } else { "npm run build:h5" }
        $buildSuccess = Build-Platform "H5" $command
    }
    "weapp" {
        $command = if ($Production) { "npm run build:weapp:prod" } else { "npm run build:weapp" }
        $buildSuccess = Build-Platform "WeApp" $command
    }
    "both" {
        # 先构建 H5
        $h5Command = if ($Production) { "npm run build:h5:prod" } else { "npm run build:h5" }
        $h5Success = Build-Platform "H5" $h5Command
        
        # 再构建微信小程序
        $weappCommand = if ($Production) { "npm run build:weapp:prod" } else { "npm run build:weapp" }
        $weappSuccess = Build-Platform "WeApp" $weappCommand
        
        $buildSuccess = $h5Success -and $weappSuccess
    }
    default {
        Write-Host "❌ 不支持的平台: $Platform" -ForegroundColor Red
        Write-Host "支持的平台: h5, weapp, both" -ForegroundColor Yellow
        exit 1
    }
}

if (-not $buildSuccess) {
    Write-Host "❌ 构建失败，请检查错误信息" -ForegroundColor Red
    exit 1
}

# 创建压缩包
Write-Host "📦 创建部署包..." -ForegroundColor Yellow

if ($Platform -eq "h5" -or $Platform -eq "both") {
    $h5Path = "dist/h5"
    if (Test-Path $h5Path) {
        $zipName = "ieclub-h5-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
        Compress-Archive -Path $h5Path -DestinationPath $zipName -Force
        Write-Host "✅ H5 部署包已创建: $zipName" -ForegroundColor Green
    }
}

if ($Platform -eq "weapp" -or $Platform -eq "both") {
    $weappPath = "dist"
    if (Test-Path $weappPath) {
        # 排除 H5 目录（如果存在）
        $files = Get-ChildItem -Path $weappPath -Exclude "h5"
        if ($files.Count -gt 0) {
            $zipName = "ieclub-weapp-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
            Compress-Archive -Path $files.FullName -DestinationPath $zipName -Force
            Write-Host "✅ 微信小程序部署包已创建: $zipName" -ForegroundColor Green
        }
    }
}

Write-Host "🎉 构建完成！" -ForegroundColor Green
Write-Host "📁 构建输出目录: dist/" -ForegroundColor Cyan

# 显示构建结果
if (Test-Path "dist") {
    Write-Host "📊 构建结果统计:" -ForegroundColor Yellow
    Get-ChildItem -Path "dist" -Recurse -Directory | ForEach-Object {
        $fileCount = (Get-ChildItem -Path $_.FullName -Recurse -File).Count
        Write-Host "  $($_.Name): $fileCount 个文件" -ForegroundColor Cyan
    }
}

Write-Host "✨ 脚本执行完成！" -ForegroundColor Green
