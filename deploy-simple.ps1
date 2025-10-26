# IEClub Deploy Script
param (
    [Parameter(Mandatory=$true)]
    [string]$commitMessage
)

$ProjectRoot = "C:\universe\GitHub_try\IEclub_dev"
$FrontendDir = "${ProjectRoot}\ieclub-taro"
$BackendDir = "${ProjectRoot}\ieclub-backend"
$ServerUser = "root"
$ServerIP = "39.108.160.112"
$RemoteProjectPath = "/root/IEclub_dev"
$RemoteTempPath = "/tmp/dist.zip"

function Write-Log { 
    param ([string]$Message, [string]$Color = "White")
    Write-Host "[LOG] $Message" -ForegroundColor $Color 
}

Write-Log "Deploy started..." -Color Cyan

# Step 1: Git push
Write-Log "Step 1/5: Git commit and push..." -Color Yellow
Set-Location -Path $ProjectRoot
git add .
git commit -m $commitMessage
git push origin main
Write-Log "Git push completed" -Color Green

# Step 2: Build H5
Write-Log "Step 2/5: Building H5 app..." -Color Yellow
Set-Location -Path $FrontendDir
if (Test-Path -Path "dist") { Remove-Item -Path "dist" -Recurse -Force }

npm run build:h5
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Build failed" -Color Red
    exit 1 
}
Write-Log "Build completed" -Color Green

# Step 3: Upload frontend
Write-Log "Step 3/5: Uploading frontend..." -Color Yellow

$ZipPath = "$FrontendDir\dist.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Compress-Archive -Path "$FrontendDir\dist\*" -DestinationPath $ZipPath -Force
if ($LASTEXITCODE -ne 0 -and -not (Test-Path $ZipPath)) { 
    Write-Log "Package failed" -Color Red
    exit 1 
}

scp "$ZipPath" "${ServerUser}@${ServerIP}:${RemoteTempPath}"
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Upload failed" -Color Red
    exit 1 
}

scp -r "$FrontendDir\src" "$FrontendDir\config" "$FrontendDir\package.json" "$FrontendDir\package-lock.json" "$FrontendDir\project.config.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-taro/"
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Upload source failed" -Color Red
    exit 1 
}

Write-Log "Frontend uploaded" -Color Green

# Step 4: Upload backend
Write-Log "Step 4/5: Uploading backend..." -Color Yellow

scp -r "$BackendDir\src" "$BackendDir\prisma" "$BackendDir\scripts" "$BackendDir\package.json" "$BackendDir\package-lock.json" "${ServerUser}@${ServerIP}:${RemoteProjectPath}/ieclub-backend/"
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Backend upload failed" -Color Red
    exit 1 
}
Write-Log "Backend uploaded" -Color Green

# Step 5: Deploy on server
Write-Log "Step 5/5: Deploying on server..." -Color Yellow

scp "$ProjectRoot\deploy-master.sh" "${ServerUser}@${ServerIP}:/root/"
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Script upload failed" -Color Red
    exit 1 
}

ssh "${ServerUser}@${ServerIP}" "chmod +x /root/deploy-master.sh; bash /root/deploy-master.sh all"
if ($LASTEXITCODE -ne 0) { 
    Write-Log "Deploy failed" -Color Red
    exit 1 
}

Write-Log "Deploy completed" -Color Green
Write-Log "DONE! Visit: https://ieclub.online" -Color Cyan

