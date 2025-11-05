#!/usr/bin/env pwsh
# ================================================================
# IEClub 生产环境部署脚本 v2.0
# ================================================================
#
# 功能: 部署前端和后端到正式生产环境
# 服务器: ieclub.online
# 用途: 正式环境部署
#
# 使用方法:
#   .\Deploy-Production.ps1           # 部署前端和后端
#   .\Deploy-Production.ps1 -Frontend # 仅部署前端
#   .\Deploy-Production.ps1 -Backend  # 仅部署后端
#
# v2.0 更新 (2025-11-05):
#   - 修复环境变量配置问题
#   - 使用正确的生产环境域名
#   - 优化部署流程
# ================================================================

param(
    [switch]$Frontend,
    [switch]$Backend,
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [switch]$SkipTests
)

# --- 配置 ---
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WebDir = Join-Path $ProjectRoot "ieclub-web"
$BackendDir = Join-Path $ProjectRoot "ieclub-backend"

# 颜色输出函数
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host "[WARNING] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

# --- 检查必需工具 ---
function Test-Prerequisites {
    Write-Info "检查必需工具..."
    
    $tools = @(
        @{Name="Node.js"; Command="node"; MinVersion="18.0.0"},
        @{Name="npm"; Command="npm"},
        @{Name="scp"; Command="scp"},
        @{Name="ssh"; Command="ssh"}
    )
    
    $missing = @()
    foreach ($tool in $tools) {
        if (-not (Get-Command $tool.Command -ErrorAction SilentlyContinue)) {
            $missing += $tool.Name
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "缺少必需工具: $($missing -join ', ')"
        exit 1
    }
    
    Write-Success "所有必需工具已安装"
}

# --- 部署前端 ---
function Deploy-Frontend {
    Write-Info "========== 开始部署前端 =========="
    
    # 切换到 Web 目录
    Push-Location $WebDir
    
    try {
        # 检查环境配置文件
        if (-not (Test-Path ".env.production")) {
            Write-Info "创建生产环境配置文件..."
            Copy-Item "env.production.template" ".env.production"
        }
        
        Write-Info "生产环境配置:"
        Get-Content ".env.production" | Select-String "VITE_" | ForEach-Object { 
            Write-Host "  $_" -ForegroundColor Gray 
        }
        
        # 构建前端
        Write-Info "构建前端 (生产模式)..."
        npm run build
        
        if (-not (Test-Path "dist\index.html")) {
            Write-Error "构建失败: dist/index.html 不存在"
            exit 1
        }
        
        Write-Success "前端构建完成"
        
        # 验证构建结果
        Write-Info "验证构建结果..."
        $indexHtml = Get-Content "dist\index.html" -Raw
        if ($indexHtml -match 'ieclub\.online') {
            Write-Success "✅ 检测到生产环境域名配置"
        } else {
            Write-Warning "⚠️ 未检测到生产环境域名，请检查配置"
        }
        
        # 打包
        Write-Info "打包前端文件..."
        $zipPath = "web-production.zip"
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        Compress-Archive -Path "dist\*" -DestinationPath $zipPath
        
        $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
        Write-Success "打包完成: $zipPath ($zipSize MB)"
        
        # 上传到服务器
        Write-Info "上传前端到服务器..."
        scp $zipPath "${ServerUser}@${ServerHost}:/tmp/web-dist.zip"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "上传失败"
            exit 1
        }
        
        Write-Success "上传完成"
        
        # 在服务器上部署
        Write-Info "在服务器上部署前端..."
        
        ssh "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev && chmod +x Deploy_server.sh && ./Deploy_server.sh web"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "服务器部署失败"
            exit 1
        }
        
        Write-Success "========== 前端部署完成 =========="
        Write-Info "访问地址: https://ieclub.online"
        Write-Info "如果看不到更新，请按 Ctrl+F5 强制刷新浏览器缓存"
        
    } finally {
        Pop-Location
    }
}

# --- 部署后端 ---
function Deploy-Backend {
    Write-Info "========== 开始部署后端 =========="
    
    Push-Location $BackendDir
    
    try {
        # 检查环境配置
        Write-Info "检查后端配置..."
        
        if (-not (Test-Path "package.json")) {
            Write-Error "package.json 不存在"
            exit 1
        }
        
        # 打包后端代码
        Write-Info "打包后端代码..."
        $backendZip = "backend-production.zip"
        
        $excludeItems = @(
            "node_modules",
            "logs",
            "uploads",
            ".env*",
            "*.zip",
            "*.log"
        )
        
        # 创建临时目录
        $tempDir = Join-Path $env:TEMP "ieclub-backend-temp"
        if (Test-Path $tempDir) {
            Remove-Item $tempDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $tempDir | Out-Null
        
        # 复制文件（排除指定项）
        Write-Info "复制后端文件..."
        Get-ChildItem -Path . | Where-Object {
            $item = $_
            $exclude = $false
            foreach ($pattern in $excludeItems) {
                if ($item.Name -like $pattern) {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        } | Copy-Item -Destination $tempDir -Recurse -Force
        
        # 打包
        if (Test-Path $backendZip) {
            Remove-Item $backendZip -Force
        }
        Compress-Archive -Path "$tempDir\*" -DestinationPath $backendZip
        
        # 清理临时目录
        Remove-Item $tempDir -Recurse -Force
        
        $zipSize = [math]::Round((Get-Item $backendZip).Length / 1MB, 2)
        Write-Success "后端打包完成: $backendZip ($zipSize MB)"
        
        # 上传到服务器
        Write-Info "上传后端到服务器..."
        scp $backendZip "${ServerUser}@${ServerHost}:/tmp/backend-code.zip"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "上传失败"
            exit 1
        }
        
        Write-Success "上传完成"
        
        # 在服务器上部署
        Write-Info "在服务器上部署后端..."
        
        ssh "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev && chmod +x Deploy_server.sh && ./Deploy_server.sh backend"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "服务器部署失败"
            exit 1
        }
        
        Write-Success "========== 后端部署完成 =========="
        
        # 健康检查
        Write-Info "执行健康检查..."
        Start-Sleep -Seconds 5
        
        try {
            $health = Invoke-RestMethod -Uri "https://ieclub.online/api/health" -TimeoutSec 10
            Write-Success "✅ 后端服务健康检查通过"
            Write-Host ($health | ConvertTo-Json -Depth 3) -ForegroundColor Gray
        } catch {
            Write-Warning "⚠️ 健康检查失败: $_"
            Write-Info "查看服务器日志: ssh $ServerUser@$ServerHost 'pm2 logs ieclub-backend --lines 50'"
        }
        
    } finally {
        Pop-Location
    }
}

# --- 主函数 ---
function Main {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  IEClub 生产环境部署" -ForegroundColor Cyan
    Write-Host "  服务器: $ServerHost" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # 确认部署
    Write-Warning "您正在部署到生产环境！"
    Write-Host "目标服务器: $ServerHost" -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "确认继续部署？(yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "部署已取消"
        exit 0
    }
    
    # 检查工具
    Test-Prerequisites
    
    # 确定部署目标
    $deployFrontend = $Frontend -or (-not $Backend)
    $deployBackend = $Backend -or (-not $Frontend)
    
    if ($deployFrontend) {
        Deploy-Frontend
    }
    
    if ($deployBackend) {
        Deploy-Backend
    }
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  🎉 生产环境部署完成！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址:" -ForegroundColor Cyan
    Write-Host "  前端: https://ieclub.online" -ForegroundColor White
    Write-Host "  API: https://ieclub.online/api" -ForegroundColor White
    Write-Host ""
    Write-Host "管理命令:" -ForegroundColor Cyan
    Write-Host "  查看后端日志: ssh $ServerUser@$ServerHost 'pm2 logs ieclub-backend'" -ForegroundColor Gray
    Write-Host "  查看服务状态: ssh $ServerUser@$ServerHost 'pm2 status'" -ForegroundColor Gray
    Write-Host "  Nginx 状态: ssh $ServerUser@$ServerHost 'systemctl status nginx'" -ForegroundColor Gray
    Write-Host ""
}

# 执行主函数
Main
