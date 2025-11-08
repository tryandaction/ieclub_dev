# ============================================
# IEClub Code Status Check
# ============================================
# Check if local code is ready for deployment
# ============================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$Detailed
)

# Get project root (two levels up from script location)
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$WebDir = Join-Path $ProjectRoot "ieclub-web"
$BackendDir = Join-Path $ProjectRoot "ieclub-backend"

function Write-Status {
    param([string]$Icon, [string]$Text, [string]$Color)
    Write-Host "$Icon $Text" -ForegroundColor $Color
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  IEClub Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$hasIssues = $false

# Check Git Status
Write-Host "[1/4] Checking Git Status..." -ForegroundColor Blue
Set-Location -Path $ProjectRoot

$currentBranch = git branch --show-current
Write-Host "  Branch: $currentBranch" -ForegroundColor Gray

$status = git status --porcelain
if ($status) {
    Write-Status "[!]" "Uncommitted changes found" "Yellow"
    $hasIssues = $true
} else {
    Write-Status "[OK]" "Working tree clean" "Green"
}

$lastCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null
if ($lastCommit) {
    Write-Host "  Last commit: $lastCommit" -ForegroundColor Gray
}
Write-Host ""

# Check Backend Code
Write-Host "[2/4] Checking Backend Code..." -ForegroundColor Blue
Set-Location -Path $BackendDir

if (Test-Path "src") {
    $latestSrc = Get-ChildItem "src" -Recurse -Filter "*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestSrc) {
        $srcTime = $latestSrc.LastWriteTime
        $hours = ((Get-Date) - $srcTime).TotalHours
        
        Write-Host "  Latest file: $($latestSrc.Name)" -ForegroundColor Gray
        Write-Host "  Modified: $srcTime" -ForegroundColor Gray
        
        if ($hours -lt 24) {
            Write-Status "[OK]" "Backend code is fresh" "Green"
        } else {
            Write-Status "[!]" "Backend code may be outdated ($([math]::Round($hours/24, 1)) days old)" "Yellow"
            $hasIssues = $true
        }
    }
} else {
    Write-Status "[X]" "Backend source code not found!" "Red"
    $hasIssues = $true
}

# Check for old zip files
$oldZips = @()
if (Test-Path "backend-code.zip") { $oldZips += "backend-code.zip" }
if (Test-Path "backend-staging.zip") { $oldZips += "backend-staging.zip" }

if ($oldZips.Count -gt 0) {
    Write-Status "[!]" "Old backend zip files found: $($oldZips -join ', ')" "Yellow"
    $hasIssues = $true
}
Write-Host ""

# Check Frontend Code
Write-Host "[3/4] Checking Frontend Code..." -ForegroundColor Blue
Set-Location -Path $WebDir

if (Test-Path "src") {
    $latestSrc = Get-ChildItem "src" -Recurse -Include "*.jsx","*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestSrc) {
        $srcTime = $latestSrc.LastWriteTime
        $hours = ((Get-Date) - $srcTime).TotalHours
        
        Write-Host "  Latest file: $($latestSrc.Name)" -ForegroundColor Gray
        Write-Host "  Modified: $srcTime" -ForegroundColor Gray
        
        if ($hours -lt 24) {
            Write-Status "[OK]" "Frontend source is fresh" "Green"
        } else {
            Write-Status "[!]" "Frontend source may be outdated ($([math]::Round($hours/24, 1)) days old)" "Yellow"
            $hasIssues = $true
        }
    }
}

# Check build output
if (Test-Path "dist") {
    $distTime = (Get-Item "dist").LastWriteTime
    $minutes = ((Get-Date) - $distTime).TotalMinutes
    
    Write-Host "  Build time: $distTime" -ForegroundColor Gray
    
    if ($minutes -lt 30) {
        Write-Status "[OK]" "Build is fresh ($([math]::Round($minutes)) minutes old)" "Green"
    } else {
        Write-Status "[!]" "Build may be outdated, consider rebuilding" "Yellow"
        $hasIssues = $true
    }
} else {
    Write-Status "[!]" "Build output not found, need to build first" "Yellow"
    $hasIssues = $true
}

# Check for old zip files
$oldZips = @()
if (Test-Path "web-dist.zip") { $oldZips += "web-dist.zip" }
if (Test-Path "web-staging.zip") { $oldZips += "web-staging.zip" }

if ($oldZips.Count -gt 0) {
    Write-Status "[!]" "Old frontend zip files found: $($oldZips -join ', ')" "Yellow"
    $hasIssues = $true
}
Write-Host ""

# Summary
Write-Host "[4/4] Summary" -ForegroundColor Blue
Write-Host "============================================" -ForegroundColor Cyan

if ($hasIssues) {
    Write-Status "[!]" "Issues found - Review before deployment" "Yellow"
    Write-Host ""
    Write-Host "Recommended actions:" -ForegroundColor Yellow
    Write-Host "  1. Commit any pending changes" -ForegroundColor White
    Write-Host "  2. Delete old zip files" -ForegroundColor White
    Write-Host "  3. Rebuild frontend if needed" -ForegroundColor White
    Write-Host "  4. Run this check again" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Status "[OK]" "All checks passed - Ready to deploy!" "Green"
    Write-Host ""
    exit 0
}

