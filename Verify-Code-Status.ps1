# ============================================
# IEClub 代码状态验证脚本
# ============================================
# 用途：在部署前检查本地代码是否是最新的
# 确保不会部署旧代码
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$Detailed
)

$ProjectRoot = $PSScriptRoot
$WebDir = "${ProjectRoot}\ieclub-web"
$BackendDir = "${ProjectRoot}\ieclub-backend"

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[✓] $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "[!] $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "[✗] $Text" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IEClub 代码状态验证" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

# --- 1. Git 状态检查 ---
Write-Info "检查 Git 状态..."
Set-Location -Path $ProjectRoot

$currentBranch = git branch --show-current
Write-Host "  当前分支: $currentBranch" -ForegroundColor Cyan

$status = git status --porcelain
if ($status) {
    Write-Warning "存在未提交的更改"
    if ($Detailed) {
        git status --short
    }
    $hasIssues = $true
} else {
    Write-Success "工作区干净，无未提交更改"
}

# 检查最近提交
$lastCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
if ($lastCommit) {
    Write-Host "  最近提交: $lastCommit" -ForegroundColor Gray
}

Write-Host ""

# --- 2. 后端代码检查 ---
Write-Info "检查后端代码状态..."
Set-Location -Path $BackendDir

if (Test-Path "src") {
    $latestSrc = Get-ChildItem "src" -Recurse -Filter "*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestSrc) {
        $srcTime = $latestSrc.LastWriteTime
        $timeDiff = (Get-Date) - $srcTime
        
        Write-Host "  最新源文件: $($latestSrc.Name)" -ForegroundColor Gray
        Write-Host "  修改时间: $srcTime" -ForegroundColor Gray
        
        if ($timeDiff.TotalHours -lt 24) {
            if ($timeDiff.TotalHours -lt 1) {
                $timeStr = "$([math]::Round($timeDiff.TotalMinutes)) 分钟前"
            } else {
                $timeStr = "$([math]::Round($timeDiff.TotalHours, 1)) 小时前"
            }
            Write-Success "后端代码是最新的（最后修改: $timeStr）"
        } else {
            Write-Warning "后端代码可能不是最新的（最后修改: $([math]::Round($timeDiff.TotalDays, 1)) 天前）"
            $hasIssues = $true
        }
    }
} else {
    Write-Error "后端源代码目录不存在！"
    $hasIssues = $true
}

# 检查旧的打包文件
$oldZips = @()
if (Test-Path "backend-code.zip") {
    $zipTime = (Get-Item "backend-code.zip").LastWriteTime
    $oldZips += "backend-code.zip (修改于: $zipTime)"
}
if (Test-Path "backend-staging.zip") {
    $zipTime = (Get-Item "backend-staging.zip").LastWriteTime
    $oldZips += "backend-staging.zip (修改于: $zipTime)"
}

if ($oldZips.Count -gt 0) {
    Write-Warning "发现旧的打包文件，建议删除："
    foreach ($zip in $oldZips) {
        Write-Host "  - $zip" -ForegroundColor Yellow
    }
    $hasIssues = $true
}

Write-Host ""

# --- 3. 前端代码检查 ---
Write-Info "检查前端代码状态..."
Set-Location -Path $WebDir

if (Test-Path "src") {
    $latestSrc = Get-ChildItem "src" -Recurse -Include "*.jsx","*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestSrc) {
        $srcTime = $latestSrc.LastWriteTime
        $timeDiff = (Get-Date) - $srcTime
        
        Write-Host "  最新源文件: $($latestSrc.Name)" -ForegroundColor Gray
        Write-Host "  修改时间: $srcTime" -ForegroundColor Gray
        
        if ($timeDiff.TotalHours -lt 24) {
            if ($timeDiff.TotalHours -lt 1) {
                $timeStr = "$([math]::Round($timeDiff.TotalMinutes)) 分钟前"
            } else {
                $timeStr = "$([math]::Round($timeDiff.TotalHours, 1)) 小时前"
            }
            Write-Success "前端源代码是最新的（最后修改: $timeStr）"
        } else {
            Write-Warning "前端源代码可能不是最新的（最后修改: $([math]::Round($timeDiff.TotalDays, 1)) 天前）"
            $hasIssues = $true
        }
    }
}

# 检查构建产物
if (Test-Path "dist") {
    $distTime = (Get-Item "dist").LastWriteTime
    $timeDiff = (Get-Date) - $distTime
    
    Write-Host "  构建产物修改时间: $distTime" -ForegroundColor Gray
    
    if ($timeDiff.TotalMinutes -lt 30) {
        if ($timeDiff.TotalMinutes -lt 1) {
            $timeStr = "刚刚构建"
        } else {
            $timeStr = "$([math]::Round($timeDiff.TotalMinutes)) 分钟前"
        }
        Write-Success "前端构建产物是最新的（$timeStr）"
    } else {
        Write-Warning "前端构建产物可能不是最新的，建议重新构建"
        $hasIssues = $true
    }
} else {
    Write-Warning "前端构建产物不存在，需要先构建"
    $hasIssues = $true
}

# 检查旧的打包文件
$oldZips = @()
if (Test-Path "web-dist.zip") {
    $zipTime = (Get-Item "web-dist.zip").LastWriteTime
    $oldZips += "web-dist.zip (修改于: $zipTime)"
}
if (Test-Path "web-staging.zip") {
    $zipTime = (Get-Item "web-staging.zip").LastWriteTime
    $oldZips += "web-staging.zip (修改于: $zipTime)"
}

if ($oldZips.Count -gt 0) {
    Write-Warning "发现旧的打包文件，建议删除："
    foreach ($zip in $oldZips) {
        Write-Host "  - $zip" -ForegroundColor Yellow
    }
    $hasIssues = $true
}

Write-Host ""

# --- 4. 总结 ---
Write-Host "============================================" -ForegroundColor Cyan
if ($hasIssues) {
    Write-Warning "发现潜在问题，建议处理后再部署"
    Write-Host ""
    Write-Host "建议操作:" -ForegroundColor Yellow
    Write-Host "  1. 如有未提交更改，先提交代码" -ForegroundColor White
    Write-Host "  2. 删除旧的打包文件" -ForegroundColor White
    Write-Host "  3. 重新构建前端（如需要）" -ForegroundColor White
    Write-Host "  4. 再次运行此脚本验证" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Success "所有检查通过，代码状态良好"
    Write-Host ""
    Write-Host "✅ 可以安全部署！" -ForegroundColor Green
    Write-Host ""
    exit 0
}

