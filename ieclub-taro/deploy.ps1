# IEClub Taro 项目部署脚本
# 自动构建、压缩并部署到服务器

# 配置参数
$SERVER_IP = "39.108.160.112"
$SERVER_USER = "root"
$DEPLOY_PATH = "/www/wwwroot/ieclub.cn"
$TEMP_PATH = "/tmp/ieclub_h5.zip"

Write-Host ""
Write-Host "🚀 IEClub Taro 项目部署开始..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 步骤 1: 检查环境
Write-Host ""
Write-Host "🔍 [1/5] 检查环境..." -ForegroundColor Yellow

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 错误: 未找到 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 npm
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 错误: 未找到 npm" -ForegroundColor Red
    exit 1
}

# 步骤 2: 构建项目
Write-Host ""
Write-Host "🔨 [2/5] 构建项目..." -ForegroundColor Yellow

Write-Host "   正在执行: npm run build:h5" -ForegroundColor Gray
npm run build:h5

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 构建失败" -ForegroundColor Red
    exit 1
}

# 检查构建产物
if (Test-Path "dist\index.html") {
    Write-Host "   ✅ 构建成功: dist\index.html" -ForegroundColor Green
} else {
    Write-Host "   ❌ 错误: 构建产物不存在" -ForegroundColor Red
    Write-Host "   已检查: dist\index.html" -ForegroundColor Red
    exit 1
}

# 步骤 3: 压缩构建产物
Write-Host ""
Write-Host "📦 [3/5] 压缩构建产物..." -ForegroundColor Yellow

$zipFile = "h5_deploy.zip"
if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
    Write-Host "   🗑️ 删除旧压缩包" -ForegroundColor Gray
}

# 使用 PowerShell 压缩
Compress-Archive -Path "dist\*" -DestinationPath $zipFile -Force
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 压缩失败" -ForegroundColor Red
    exit 1
}

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host "   ✅ 压缩完成: $zipFile ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green

# 步骤 4: 上传到服务器
Write-Host ""
Write-Host "📤 [4/5] 上传到服务器..." -ForegroundColor Yellow

Write-Host "   服务器: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Gray
Write-Host "   目标路径: $TEMP_PATH" -ForegroundColor Gray

scp $zipFile "${SERVER_USER}@${SERVER_IP}:${TEMP_PATH}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 上传失败" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ 上传成功" -ForegroundColor Green

# 步骤 5: 服务器端部署
Write-Host ""
Write-Host "🚀 [5/5] 服务器端部署..." -ForegroundColor Yellow

# 构建部署命令（移除可能有问题的chown，添加错误处理）
$remoteScript = 'bash -c ''set -e && if [ -d ' + $DEPLOY_PATH + ' ] && [ "$(ls -A ' + $DEPLOY_PATH + ' 2>/dev/null)" ]; then BACKUP_PATH=/tmp/ieclub_backup_$(date +%Y%m%d_%H%M%S) && echo "   📦 备份当前版本..." && mkdir -p $BACKUP_PATH && cp -r ' + $DEPLOY_PATH + '/* $BACKUP_PATH/; fi && echo "   🧹 清理旧文件..." && rm -rf ' + $DEPLOY_PATH + '/* && echo "   📂 解压新文件..." && unzip -q -o ' + $TEMP_PATH + ' -d ' + $DEPLOY_PATH + ' && echo "   🔐 设置文件权限..." && chmod -R 755 ' + $DEPLOY_PATH + ' && echo "   🗑️ 清理临时文件..." && rm -f ' + $TEMP_PATH + ' && echo "   ✅ 部署完成！"'''

Write-Host "   执行命令: $remoteScript" -ForegroundColor Gray
ssh "${SERVER_USER}@${SERVER_IP}" $remoteScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ 部署失败" -ForegroundColor Red
    Write-Host "   🔍 正在诊断问题..." -ForegroundColor Yellow
    
    # 检查服务器状态
    Write-Host "   检查服务器连接..." -ForegroundColor Gray
    ssh "${SERVER_USER}@${SERVER_IP}" "echo 'SSH连接正常' && pwd && whoami"
    
    Write-Host "   检查部署目录..." -ForegroundColor Gray
    ssh "${SERVER_USER}@${SERVER_IP}" "ls -la $DEPLOY_PATH 2>/dev/null || echo '目录不存在或无法访问'"
    
    Write-Host "   检查临时文件..." -ForegroundColor Gray
    ssh "${SERVER_USER}@${SERVER_IP}" "ls -la $TEMP_PATH 2>/dev/null || echo '临时文件不存在'"
    
    exit 1
}

# 清理本地临时文件
Remove-Item -Force $zipFile

# 完成
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "  ✅ 部署成功！" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 访问地址: http://$SERVER_IP" -ForegroundColor Cyan
Write-Host "📁 部署路径: $DEPLOY_PATH" -ForegroundColor Gray
Write-Host ""