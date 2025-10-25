# IEClub H5 快速部署脚本
# 用法：在ieclub-taro目录下运行此脚本

Write-Host "🚀 IEClub H5 快速部署开始..." -ForegroundColor Green
Write-Host ""

# 1. 检查dist目录
if (-not (Test-Path -Path "dist")) {
    Write-Host "❌ 错误: dist目录不存在，请先运行 npm run build:h5" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 步骤1: 检查构建产物" -ForegroundColor Cyan
Get-ChildItem -Path "dist" -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object {
    Write-Host "   发现 $_ 个文件" -ForegroundColor Gray
}

# 2. 清理旧的zip文件
Write-Host ""
Write-Host "✅ 步骤2: 清理旧的压缩包" -ForegroundColor Cyan
if (Test-Path -Path "dist.zip") {
    Remove-Item -Path "dist.zip" -Force
    Write-Host "   已删除旧的 dist.zip" -ForegroundColor Gray
}

# 3. 打包dist目录
Write-Host ""
Write-Host "✅ 步骤3: 打包构建产物" -ForegroundColor Cyan
Compress-Archive -Path "dist" -DestinationPath "dist.zip" -Force
$zipSize = (Get-Item "dist.zip").Length / 1MB
Write-Host "   压缩包大小: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray

# 4. 上传到服务器
Write-Host ""
Write-Host "✅ 步骤4: 上传到服务器" -ForegroundColor Cyan
Write-Host "   目标: root@39.108.160.112:/tmp/" -ForegroundColor Gray

$uploadResult = scp dist.zip root@39.108.160.112:/tmp/ 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ 上传成功" -ForegroundColor Green
} else {
    Write-Host "   ❌ 上传失败: $uploadResult" -ForegroundColor Red
    exit 1
}

# 5. 服务器部署
Write-Host ""
Write-Host "✅ 步骤5: 服务器端部署" -ForegroundColor Cyan
Write-Host "   请手动SSH到服务器执行以下命令:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ssh root@39.108.160.112" -ForegroundColor White
Write-Host "   ./deploy.sh frontend" -ForegroundColor White
Write-Host ""

# 6. 提示验证
Write-Host "✅ 步骤6: 部署后验证" -ForegroundColor Cyan
Write-Host "   1. 访问测试页面: https://ieclub.online/test-page" -ForegroundColor White
Write-Host "   2. 访问主页: https://ieclub.online/" -ForegroundColor White
Write-Host "   3. 检查浏览器控制台（F12）是否有错误" -ForegroundColor White
Write-Host ""

Write-Host "🎉 本地准备工作完成！" -ForegroundColor Green
Write-Host "📝 详细说明请查看：网页空白问题修复说明.md" -ForegroundColor Gray

