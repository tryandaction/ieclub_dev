#!/usr/bin/env pwsh
# ==========================================
# 🔥 核弹级彻底清理并重新部署脚本
# ==========================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🚀 开始核弹级彻底清理和部署流程" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. 进入前端目录
Write-Host "📁 步骤 1/8: 进入前端目录..." -ForegroundColor Yellow
Set-Location "C:\universe\GitHub_try\IEclub_dev\ieclub-taro"
Write-Host "✅ 当前目录: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 2. 删除所有构建产物和依赖
Write-Host "🧹 步骤 2/8: 删除所有构建产物和依赖..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force dist.zip -ErrorAction SilentlyContinue
Write-Host "✅ 构建产物已清理" -ForegroundColor Green
Write-Host ""

# 3. 清理npm缓存
Write-Host "🧹 步骤 3/8: 清理npm缓存..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ npm缓存已清理" -ForegroundColor Green
Write-Host ""

# 4. 重新安装依赖
Write-Host "📦 步骤 4/8: 重新安装所有依赖（这可能需要几分钟）..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install 失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依赖安装完成" -ForegroundColor Green
Write-Host ""

# 5. 构建生产版本
Write-Host "🏗️ 步骤 5/8: 构建H5生产版本..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
npm run build:h5
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 构建完成" -ForegroundColor Green
Write-Host ""

# 6. 验证构建结果
Write-Host "🔍 步骤 6/8: 验证构建结果..." -ForegroundColor Yellow
if (Test-Path "dist/index.html") {
    Write-Host "✅ index.html 存在" -ForegroundColor Green
    
    # 检查index.html中是否有正确的配置
    $indexContent = Get-Content "dist/index.html" -Raw
    if ($indexContent -match "ieclub.online") {
        Write-Host "✅ 检测到生产域名配置" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 警告：未检测到生产域名配置" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 构建产物不完整：index.html 不存在" -ForegroundColor Red
    exit 1
}

# 检查关键JS文件
$jsFiles = Get-ChildItem "dist" -Filter "*.js" -Recurse | Measure-Object
Write-Host "✅ 找到 $($jsFiles.Count) 个 JS 文件" -ForegroundColor Green
Write-Host ""

# 7. 打包并上传
Write-Host "📦 步骤 7/8: 打包并上传到服务器..." -ForegroundColor Yellow
Compress-Archive -Path "dist/*" -DestinationPath "dist.zip" -Force
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 打包失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 打包完成: dist.zip" -ForegroundColor Green

Write-Host "📤 上传到服务器..." -ForegroundColor Yellow
scp dist.zip root@39.108.160.112:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 上传完成" -ForegroundColor Green
Write-Host ""

# 8. 在服务器上部署
Write-Host "🚀 步骤 8/8: 在服务器上部署..." -ForegroundColor Yellow
ssh root@39.108.160.112 @"
cd /root
echo '🔥 开始服务器端部署...'

# 备份旧版本
if [ -d /www/wwwroot/ieclub.online ]; then
    echo '📦 备份旧版本...'
    mv /www/wwwroot/ieclub.online /www/wwwroot/ieclub.online.backup.\$(date +%Y%m%d_%H%M%S)
fi

# 创建新目录
echo '📁 创建新目录...'
mkdir -p /www/wwwroot/ieclub.online

# 解压新版本
echo '📦 解压新版本...'
unzip -o /tmp/dist.zip -d /www/wwwroot/ieclub.online/

# 设置权限
echo '🔐 设置权限...'
chown -R www:www /www/wwwroot/ieclub.online
chmod -R 755 /www/wwwroot/ieclub.online

# 重启Nginx
echo '🔄 重启Nginx...'
nginx -t && nginx -s reload

echo '✅ 服务器端部署完成！'
"@

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 服务器部署失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 验证步骤：" -ForegroundColor Cyan
Write-Host "1. 打开无痕窗口访问: https://ieclub.online/" -ForegroundColor White
Write-Host "2. 按 F12 打开开发者工具，查看控制台" -ForegroundColor White
Write-Host "3. 确认以下内容：" -ForegroundColor White
Write-Host "   ✓ URL地址栏中 没有 # 号" -ForegroundColor White
Write-Host "   ✓ 控制台显示: 🔧 H5生产环境，使用绝对域名: https://ieclub.online" -ForegroundColor White
Write-Host "   ✓ 页面正常显示内容（不是空白）" -ForegroundColor White
Write-Host ""
Write-Host "如果仍有问题，请提供完整的控制台日志。" -ForegroundColor Yellow

