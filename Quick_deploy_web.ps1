# Quick Web Deployment Script
param(
    [string]$Message = "Update web"
)

$WebDir = ".\ieclub-web"
$ServerUser = "root"
$ServerHost = "ieclub.online"
$ServerPort = 22

Write-Host "Building web..." -ForegroundColor Cyan
cd $WebDir
npm run build

Write-Host "Packaging..." -ForegroundColor Cyan
if (Test-Path "dist.zip") { Remove-Item "dist.zip" -Force }
Compress-Archive -Path "dist\*" -DestinationPath "dist.zip"

Write-Host "Uploading..." -ForegroundColor Cyan
scp -P $ServerPort "dist.zip" "${ServerUser}@${ServerHost}:/tmp/web-dist.zip"

Write-Host "Deploying on server..." -ForegroundColor Cyan
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "bash -c 'cd /root/IEclub_dev && ./Deploy_server.sh web'"

Write-Host "Done! Visit https://ieclub.online" -ForegroundColor Green
cd ..

