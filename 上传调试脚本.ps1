# 上传调试外部访问问题脚本
Write-Host "🔍 上传调试脚本..." -ForegroundColor Cyan

$scriptPath = "调试外部访问问题.sh"

# 上传脚本
try {
    scp $scriptPath root@39.108.160.112:/tmp/debug_access.sh
    Write-Host "✅ 调试脚本上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 在服务器执行:" -ForegroundColor Cyan
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "chmod +x /tmp/debug_access.sh" -ForegroundColor White
Write-Host "/tmp/debug_access.sh" -ForegroundColor White
