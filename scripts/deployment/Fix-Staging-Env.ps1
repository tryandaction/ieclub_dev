# Fix Staging Environment Configuration
# This script creates .env.staging file on the server

param(
    [string]$ServerUser = "root",
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BackendDir = "${ProjectRoot}\ieclub-backend"

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

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "  Fix Staging Environment Configuration" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Yellow

# Check local template file
Set-Location -Path $BackendDir
if (-not (Test-Path "env.staging.template")) {
    Write-Error "Local env.staging.template file not found!"
    exit 1
}

Write-Info "Uploading configuration template to server..."
scp -P $ServerPort "env.staging.template" "${ServerUser}@${ServerHost}:/tmp/env.staging.template"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed!"
    exit 1
}

Write-Success "Configuration template uploaded"

Write-Info "Creating .env.staging file on server..."

# Create remote script
$remoteScriptContent = @'
#!/bin/bash
set -e

STAGING_DIR="/root/IEclub_dev_staging/ieclub-backend"
TEMPLATE_FILE="/tmp/env.staging.template"

if [ ! -d "$STAGING_DIR" ]; then
    echo "ERROR: Staging directory does not exist: $STAGING_DIR"
    echo "Please run deployment script first to create the directory"
    exit 1
fi

if [ -f "$STAGING_DIR/.env.staging" ]; then
    echo "WARNING: .env.staging already exists, creating backup..."
    cp "$STAGING_DIR/.env.staging" "$STAGING_DIR/.env.staging.backup.$(date +%Y%m%d_%H%M%S)"
    echo "SUCCESS: Backup created"
fi

echo "INFO: Creating .env.staging from template..."
cp "$TEMPLATE_FILE" "$STAGING_DIR/.env.staging"

PROD_ENV="/root/IEclub_dev/ieclub-backend/.env"
if [ -f "$PROD_ENV" ]; then
    echo "INFO: Copying sensitive configuration from production..."
    
    DB_PASSWORD=$(grep "^DATABASE_URL=" "$PROD_ENV" | sed -n 's/.*:\([^@]*\)@.*/\1/p')
    JWT_SECRET=$(grep "^JWT_SECRET=" "$PROD_ENV" | cut -d'=' -f2-)
    JWT_REFRESH_SECRET=$(grep "^JWT_REFRESH_SECRET=" "$PROD_ENV" | cut -d'=' -f2-)
    WECHAT_APPID=$(grep "^WECHAT_APPID=" "$PROD_ENV" | cut -d'=' -f2-)
    WECHAT_SECRET=$(grep "^WECHAT_SECRET=" "$PROD_ENV" | cut -d'=' -f2-)
    
    if [ -n "$DB_PASSWORD" ]; then
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://ieclub_user:${DB_PASSWORD}@localhost:3306/ieclub_staging\"|" "$STAGING_DIR/.env.staging"
        echo "  SUCCESS: Database password configured"
    fi
    
    if [ -n "$JWT_SECRET" ]; then
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}_staging|" "$STAGING_DIR/.env.staging"
        echo "  SUCCESS: JWT secret configured"
    fi
    
    if [ -n "$JWT_REFRESH_SECRET" ]; then
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}_staging|" "$STAGING_DIR/.env.staging"
        echo "  SUCCESS: JWT refresh secret configured"
    fi
    
    if [ -n "$WECHAT_APPID" ]; then
        sed -i "s|WECHAT_APPID=.*|WECHAT_APPID=${WECHAT_APPID}|" "$STAGING_DIR/.env.staging"
        echo "  SUCCESS: WeChat AppID configured"
    fi
    
    if [ -n "$WECHAT_SECRET" ]; then
        sed -i "s|WECHAT_SECRET=.*|WECHAT_SECRET=${WECHAT_SECRET}|" "$STAGING_DIR/.env.staging"
        echo "  SUCCESS: WeChat Secret configured"
    fi
else
    echo "WARNING: Production environment config not found, using template defaults"
    echo "WARNING: Please manually update sensitive information in $STAGING_DIR/.env.staging"
fi

echo "INFO: Checking staging database..."
if [ -n "$DB_PASSWORD" ]; then
    mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ieclub_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        echo "SUCCESS: Staging database is ready"
    else
        echo "WARNING: Cannot create staging database, please create manually: CREATE DATABASE ieclub_staging;"
    fi
fi

echo ""
echo "SUCCESS: .env.staging file created: $STAGING_DIR/.env.staging"
echo ""
echo "Configuration summary:"
grep -E "^(NODE_ENV|PORT|DATABASE_URL|REDIS_HOST|CORS_ORIGIN)=" "$STAGING_DIR/.env.staging" | sed 's/^/   /' || true
echo ""

rm -f "$TEMPLATE_FILE"
'@

# Save remote script to temp file (Unix format, no BOM)
$tempScript = New-TemporaryFile
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tempScript.FullName, $remoteScriptContent.Replace("`r`n", "`n"), $utf8NoBom)

Write-Info "Executing configuration script on server..."
scp -P $ServerPort $tempScript.FullName "${ServerUser}@${ServerHost}:/tmp/setup-staging-env.sh"
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "bash /tmp/setup-staging-env.sh"

# Clean up local temp file
Remove-Item $tempScript.FullName -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Success "Staging environment config file created successfully!"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "   1. Deploy backend: .\scripts\deployment\Deploy-Staging.ps1 -Target backend" -ForegroundColor Cyan
    Write-Host "   2. Deploy all: .\scripts\deployment\Deploy-Staging.ps1 -Target all" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Error "Configuration failed! Please check error messages"
    exit 1
}
