# 重新部署前端文件
Write-Host "🚀 重新部署前端文件..." -ForegroundColor Green

# 1. 确保本地构建是最新的
Write-Host "➡️ 检查本地构建..." -ForegroundColor Cyan
if (Test-Path "ieclub-taro\dist\h5\index.html") {
    Write-Host "✅ 本地构建文件存在" -ForegroundColor Green
} else {
    Write-Host "❌ 本地构建文件不存在，需要先构建" -ForegroundColor Red
    Write-Host "请先运行: cd ieclub-taro && npm run build:h5:prod" -ForegroundColor Yellow
    exit 1
}

# 2. 压缩前端文件
Write-Host "➡️ 压缩前端文件..." -ForegroundColor Cyan
if (Test-Path "h5-deploy.zip") {
    Remove-Item "h5-deploy.zip" -Force
}

# 使用PowerShell内置压缩
Compress-Archive -Path "ieclub-taro\dist\h5\*" -DestinationPath "h5-deploy.zip" -Force
Write-Host "✅ 前端文件已压缩为 h5-deploy.zip" -ForegroundColor Green

# 3. 上传到服务器
Write-Host "➡️ 上传到服务器..." -ForegroundColor Cyan
try {
    scp h5-deploy.zip root@39.108.160.112:/tmp/
    Write-Host "✅ 文件上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 创建部署脚本
$deployScript = @"
#!/bin/bash
echo "🚀 部署前端文件..."

# 备份当前文件
if [ -d "/var/www/ieclub_dev/ieclub-taro/dist/h5" ]; then
    echo "➡️ 备份当前文件..."
    mv /var/www/ieclub_dev/ieclub-taro/dist/h5 /var/www/ieclub_dev/ieclub-taro/dist/h5.backup.`date +%Y%m%d_%H%M%S`
fi

# 创建目录
echo "➡️ 创建目录..."
mkdir -p /var/www/ieclub_dev/ieclub-taro/dist/h5

# 解压新文件
echo "➡️ 解压新文件..."
cd /var/www/ieclub_dev/ieclub-taro/dist/h5
unzip -o /tmp/h5-deploy.zip

# 检查文件
echo "➡️ 检查部署的文件:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/
echo ""
echo "➡️ 检查index.html:"
if [ -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ index.html 缺失"
fi

echo "➡️ 检查CSS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/css/

echo "➡️ 检查JS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/js/ | head -5

# 修复权限
echo "➡️ 修复权限..."
chown -R www-data:www-data /var/www/ieclub_dev/ieclub-taro/dist/h5/
chmod -R 755 /var/www/ieclub_dev/ieclub-taro/dist/h5/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;

# 重新加载Nginx
echo "➡️ 重新加载Nginx..."
systemctl reload nginx

# 测试访问
echo "➡️ 测试访问:"
curl -I http://localhost/
echo ""
echo "➡️ 测试CSS:"
curl -I http://localhost/css/styles.css

echo ""
echo "🎯 部署完成！"
"@

# 保存部署脚本
$deployScript | Out-File -FilePath "deploy-frontend.sh" -Encoding UTF8

# 上传部署脚本
try {
    scp deploy-frontend.sh root@39.108.160.112:/tmp/
    Write-Host "✅ 部署脚本上传成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 部署脚本上传失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 现在在服务器执行:" -ForegroundColor Cyan
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "chmod +x /tmp/deploy-frontend.sh" -ForegroundColor White
Write-Host "/tmp/deploy-frontend.sh" -ForegroundColor White

Write-Host "`n📋 这将:" -ForegroundColor Yellow
Write-Host "✅ 备份当前文件" -ForegroundColor Green
Write-Host "✅ 部署正确的文件结构" -ForegroundColor Green
Write-Host "✅ 修复所有权限" -ForegroundColor Green
Write-Host "✅ 测试访问" -ForegroundColor Green
