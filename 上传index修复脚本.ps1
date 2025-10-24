# 上传 index.html 修复脚本
Write-Host "🚨 上传 index.html 紧急修复脚本..." -ForegroundColor Red

$scriptPath = "紧急修复index问题.sh"

# 检查脚本是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ 错误: 找不到修复脚本 $scriptPath" -ForegroundColor Red
    exit 1
}

# 上传脚本
Write-Host "📤 上传修复脚本..." -ForegroundColor Cyan
try {
    scp $scriptPath root@39.108.160.112:/tmp/fix_index.sh
    Write-Host "✅ 修复脚本上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 在服务器执行以下命令:" -ForegroundColor Cyan
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "chmod +x /tmp/fix_index.sh" -ForegroundColor White
Write-Host "/tmp/fix_index.sh" -ForegroundColor White

Write-Host "`n📋 这个脚本将:" -ForegroundColor Yellow
Write-Host "✅ 修复所有文件权限为 www-data" -ForegroundColor Green
Write-Host "✅ 检查 index.html 内容和大小" -ForegroundColor Green
Write-Host "✅ 验证 Nginx 配置" -ForegroundColor Green
Write-Host "✅ 测试本地访问" -ForegroundColor Green
