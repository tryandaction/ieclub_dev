# 上传静态资源修复脚本
Write-Host "🚨 上传静态资源修复脚本..." -ForegroundColor Red

$scriptPath = "紧急修复静态资源.sh"

# 上传脚本
try {
    scp $scriptPath root@39.108.160.112:/tmp/fix_static.sh
    Write-Host "✅ 静态资源修复脚本上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 在服务器执行:" -ForegroundColor Cyan
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "chmod +x /tmp/fix_static.sh" -ForegroundColor White
Write-Host "/tmp/fix_static.sh" -ForegroundColor White

Write-Host "`n📋 这个脚本将:" -ForegroundColor Yellow
Write-Host "✅ 检查静态资源的实际位置" -ForegroundColor Green
Write-Host "✅ 创建必要的软链接" -ForegroundColor Green
Write-Host "✅ 修复文件权限" -ForegroundColor Green
Write-Host "✅ 测试静态资源访问" -ForegroundColor Green
