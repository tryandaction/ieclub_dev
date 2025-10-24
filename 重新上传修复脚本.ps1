# 重新上传服务器修复脚本
Write-Host "🚀 重新上传服务器修复脚本..." -ForegroundColor Green

$currentDir = Get-Location
$scriptPath = "服务器紧急修复脚本.sh"

# 检查脚本是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 错误: 找不到修复脚本 $scriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 找到修复脚本: $scriptPath" -ForegroundColor Green

# 上传脚本到服务器
Write-Host "📤 上传修复脚本到服务器..." -ForegroundColor Cyan
try {
    scp $scriptPath root@39.108.160.112:/tmp/server_emergency_fix.sh
    Write-Host "✅ 修复脚本上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    Write-Host "请手动执行: scp $scriptPath root@39.108.160.112:/tmp/server_emergency_fix.sh" -ForegroundColor Yellow
    exit 1
}

# 检查 dist.zip 是否需要重新上传
$distZipPath = "ieclub-taro\dist.zip"
if (Test-Path $distZipPath) {
    Write-Host "📤 重新上传前端文件..." -ForegroundColor Cyan
    try {
        scp $distZipPath root@39.108.160.112:/tmp/dist.zip
        Write-Host "✅ 前端文件上传成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端文件上传失败: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ 警告: 找不到 dist.zip，请确保已执行构建" -ForegroundColor Yellow
}

Write-Host "`n🎯 接下来在服务器执行:" -ForegroundColor Cyan
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "chmod +x /tmp/server_emergency_fix.sh" -ForegroundColor White
Write-Host "/tmp/server_emergency_fix.sh" -ForegroundColor White

Write-Host "`n📋 这个脚本将修复:" -ForegroundColor Cyan
Write-Host "✅ PM2 安装和配置问题" -ForegroundColor Green
Write-Host "✅ 前端文件手动部署" -ForegroundColor Green
Write-Host "✅ 文件权限问题" -ForegroundColor Green
Write-Host "✅ Favicon 500错误" -ForegroundColor Green
Write-Host "✅ Nginx 重启" -ForegroundColor Green
