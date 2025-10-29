# IEClub One-Click Deployment Script
# Description: Deploy web frontend, mini program, and backend with a single command
# Usage: .\Deploy.ps1 -Target <web|weapp|backend|all> [-Message <commit message>]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("web", "weapp", "backend", "all")]
    [string]$Target,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Deploy update"
)

# --- Configuration ---
$ProjectRoot = $PSScriptRoot
$WebDir = "${ProjectRoot}\ieclub-web"
$WeappDir = "${ProjectRoot}\ieclub-frontend"  # Native WeChat Mini Program
$BackendDir = "${ProjectRoot}\ieclub-backend"

# Server configuration
$ServerUser = "root"
$ServerHost = "ieclub.online"
$ServerPort = 22

# --- Helper Functions ---
function Write-Section {
    param([string]$Text)
    Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

# --- Git Commit ---
function Commit-Changes {
    Write-Section "Commit code to Git"
    Set-Location -Path $ProjectRoot
    
    git add .
    $status = git status --porcelain
    
    if ($status) {
        git commit -m $Message
        Write-Success "Committed changes: $Message"
    } else {
        Write-Info "No changes to commit"
    }
}

# --- Build Web Frontend ---
function Build-Web {
    Write-Section "Build web frontend (React)"
    Set-Location -Path $WebDir
    
    Write-Info "Installing dependencies..."
    npm install
    
    Write-Info "Building web frontend..."
    npm run build
    
    if (Test-Path "dist") {
        Write-Success "Web build completed"
        
        # 验证关键文件
        if (Test-Path "dist\index.html") {
            Write-Success "✅ index.html found"
        } else {
            Write-Error "❌ index.html not found in dist!"
            exit 1
        }
        
        # 显示构建产物
        Write-Info "Build artifacts:"
        Get-ChildItem dist | Select-Object Name | ForEach-Object { Write-Host "  - $($_.Name)" }
    } else {
        Write-Error "Web build failed - dist directory not found"
        exit 1
    }
}

# --- Build Mini Program ---
function Build-Weapp {
    Write-Section "Build mini program (Native WeChat)"
    Set-Location -Path $WeappDir
    
    # Check for native mini program config
    if (Test-Path "app.json") {
        Write-Info "Detected native WeChat Mini Program project"
        Write-Info "Mini program is ready, please open WeChat DevTools to preview and upload"
        Write-Info "Mini program path: $WeappDir"
    } else {
        Write-Error "Mini program config file app.json not found"
        exit 1
    }
}

# --- Deploy Web to Server ---
function Deploy-Web {
    Write-Section "Deploy web to server"
    
    # Package build artifacts
    Write-Info "Packaging web build artifacts..."
    Set-Location -Path $WebDir
    
    if (Test-Path "dist.zip") {
        Remove-Item "dist.zip" -Force
    }
    
    Compress-Archive -Path "dist\*" -DestinationPath "dist.zip"
    Write-Success "Web packaging completed"
    
    # Upload to server
    Write-Info "Uploading web to server..."
    scp -P $ServerPort "dist.zip" "${ServerUser}@${ServerHost}:/tmp/"
    
    # Upload source code
    Write-Info "Uploading web source code..."
    $SourceFiles = @("src", "api")
    foreach ($file in $SourceFiles) {
        if (Test-Path $file) {
            scp -r -P $ServerPort $file "${ServerUser}@${ServerHost}:/root/IEclub_dev/ieclub-web/"
        }
    }
    
    # Check for public directory before uploading
    if (Test-Path "public") {
        scp -r -P $ServerPort "public" "${ServerUser}@${ServerHost}:/root/IEclub_dev/ieclub-web/"
    }
    
    Write-Success "Web upload completed"
    
    # Execute server-side deployment script
    Write-Info "Executing server-side deployment..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev; ./Deploy_server.sh web"
    
    Write-Success "Web deployment completed"
    Write-Info "Visit: https://ieclub.online"
}

# --- Deploy Backend ---
function Deploy-Backend {
    Write-Section "Deploy backend"
    
    Set-Location -Path $ProjectRoot
    
    # Upload backend code
    Write-Info "Uploading backend code..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev/ieclub-backend; git pull"
    
    # Execute server-side deployment
    Write-Info "Deploying backend..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev; ./Deploy_server.sh backend"
    
    Write-Success "Backend deployment completed"
    Write-Info "API: https://ieclub.online/api"
}

# --- Main Execution ---
Write-Section "🚀 IEClub Dual-Platform One-Click Deployment"
Write-Info "Deployment target: $Target"
Write-Info "Commit message: $Message"

# Commit changes
Commit-Changes

# Execute deployment based on target
switch ($Target) {
    "web" {
        Build-Web
        Deploy-Web
    }
    "weapp" {
        Build-Weapp
    }
    "backend" {
        Deploy-Backend
    }
    "all" {
        Build-Web
        Deploy-Web
        Build-Weapp
        Deploy-Backend
    }
}

Write-Section "✅ Deployment Completed"
Write-Host "Done!" -ForegroundColor Green

# Return to project root
Set-Location -Path $ProjectRoot

