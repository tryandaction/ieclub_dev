# IEclub 403错误自动修复脚本
# 运行方式：在 PowerShell 中执行 .\自动修复部署.ps1

Write-Host "🚀 开始 IEclub 403错误自动修复..." -ForegroundColor Green

# 检查当前目录
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Yellow

# 进入前端项目目录
$frontendDir = "C:\universe\GitHub_try\IEclub_dev\ieclub-taro"
if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ 错误: 找不到前端项目目录 $frontendDir" -ForegroundColor Red
    exit 1
}

Set-Location $frontendDir
Write-Host "✅ 已进入前端目录: $frontendDir" -ForegroundColor Green

# 步骤1: 清理旧构建
Write-Host "`n🧹 步骤1: 清理旧构建文件..." -ForegroundColor Cyan
if (Test-Path -Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "✅ 已删除旧的 dist 目录" -ForegroundColor Green
}
if (Test-Path -Path "dist.zip") {
    Remove-Item -Path "dist.zip" -Force
    Write-Host "✅ 已删除旧的 dist.zip" -ForegroundColor Green
}

# 步骤2: 重新构建
Write-Host "`n🔨 步骤2: 重新构建前端（使用修复后的配置）..." -ForegroundColor Cyan
try {
    npm run build:h5
    Write-Host "✅ 前端构建完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 构建失败: $_" -ForegroundColor Red
    exit 1
}

# 步骤3: 验证构建结果
Write-Host "`n🔍 步骤3: 验证构建结果..." -ForegroundColor Cyan
if (-not (Test-Path "dist/h5/index.html")) {
    Write-Host "❌ 错误: index.html 不存在！" -ForegroundColor Red
    exit 1
}

$jsFiles = Get-ChildItem "dist/h5/js/" -Filter "*.js" | Measure-Object
Write-Host "✅ 找到 $($jsFiles.Count) 个 JS 文件" -ForegroundColor Green

$cssFiles = Get-ChildItem "dist/h5/css/" -Filter "*.css" | Measure-Object
Write-Host "✅ 找到 $($cssFiles.Count) 个 CSS 文件" -ForegroundColor Green

# 步骤4: 打包
Write-Host "`n📦 步骤4: 打包构建结果..." -ForegroundColor Cyan
try {
    Compress-Archive -Path "dist" -DestinationPath "dist.zip" -Force
    $zipSize = (Get-Item "dist.zip").Length / 1MB
    Write-Host "✅ 打包完成，文件大小: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
} catch {
    Write-Host "❌ 打包失败: $_" -ForegroundColor Red
    exit 1
}

# 步骤5: 上传到服务器
Write-Host "`n🚀 步骤5: 上传到服务器..." -ForegroundColor Cyan
try {
    scp dist.zip root@39.108.160.112:/tmp/
    Write-Host "✅ 文件已上传到服务器" -ForegroundColor Green
} catch {
    Write-Host "❌ 上传失败: $_" -ForegroundColor Red
    Write-Host "请手动执行: scp dist.zip root@39.108.160.112:/tmp/" -ForegroundColor Yellow
}

# 步骤6: 生成服务器命令
Write-Host "`n🖥️ 步骤6: 服务器部署命令..." -ForegroundColor Cyan
Write-Host "请在服务器上执行以下命令:" -ForegroundColor Yellow
Write-Host "ssh root@39.108.160.112" -ForegroundColor White
Write-Host "./deploy.sh frontend" -ForegroundColor White

# 步骤7: 创建服务器修复脚本
Write-Host "`n🔧 步骤7: 创建服务器修复脚本..." -ForegroundColor Cyan
$serverScript = @"
#!/bin/bash
echo "🔧 修复 Nginx 403/500 错误..."

# 1. 修复文件权限
chown -R www-data:www-data /var/www/ieclub_dev/
chmod -R 755 /var/www/ieclub_dev/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;

# 2. 创建 favicon.ico（如果不存在）
if [ ! -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico" ]; then
    touch /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    chmod 644 /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    echo "✅ 创建了 favicon.ico"
fi

# 3. 测试 Nginx 配置
nginx -t

# 4. 重启 Nginx
systemctl restart nginx

# 5. 检查服务状态
systemctl status nginx --no-pager

echo "🎉 修复完成！请测试访问 http://ieclub.online"
"@

Set-Content -Path "server_fix.sh" -Value $serverScript -Encoding UTF8
Write-Host "✅ 已创建 server_fix.sh 脚本" -ForegroundColor Green

# 上传修复脚本
try {
    scp server_fix.sh root@39.108.160.112:/tmp/
    Write-Host "✅ 修复脚本已上传到服务器" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 修复脚本上传失败，请手动上传" -ForegroundColor Yellow
}

# 总结
Write-Host "`n🎉 本地修复完成！" -ForegroundColor Green
Write-Host "`n📋 接下来的步骤:" -ForegroundColor Cyan
Write-Host "1. SSH 连接服务器: ssh root@39.108.160.112" -ForegroundColor White
Write-Host "2. 执行部署: ./deploy.sh frontend" -ForegroundColor White
Write-Host "3. 如果仍有问题，执行修复: chmod +x /tmp/server_fix.sh && /tmp/server_fix.sh" -ForegroundColor White
Write-Host "4. 测试访问: http://ieclub.online" -ForegroundColor White

Write-Host "`n🔍 修复的问题:" -ForegroundColor Cyan
Write-Host "✅ 路由模式从 browser 改为 hash（避免服务器配置问题）" -ForegroundColor Green
Write-Host "✅ 禁用了自动 favicon 生成（避免404错误）" -ForegroundColor Green
Write-Host "✅ 重新构建了前端文件" -ForegroundColor Green

# 返回原目录
Set-Location $currentDir
