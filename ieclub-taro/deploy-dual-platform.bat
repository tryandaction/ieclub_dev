@echo off
echo ========================================
echo 🚀 IEClub 双平台部署脚本
echo ========================================

cd /d "%~dp0"

echo.
echo 📋 步骤 1/4: 清理旧构建文件...
if exist dist rmdir /s /q dist
echo ✅ 清理完成

echo.
echo 📋 步骤 2/4: 构建 H5 网页版...
call npm run build:h5
if %errorlevel% neq 0 (
    echo ❌ H5 构建失败
    pause
    exit /b 1
)
echo ✅ H5 构建完成

echo.
echo 📋 步骤 3/4: 构建小程序版...
call npm run build:weapp:prod
if %errorlevel% neq 0 (
    echo ❌ 小程序构建失败
    pause
    exit /b 1
)
echo ✅ 小程序构建完成

echo.
echo 📋 步骤 4/4: 打包部署文件...
if exist dist.zip del dist.zip
powershell -Command "Compress-Archive -Path dist -DestinationPath dist.zip -Force"
echo ✅ 部署包创建完成

echo.
echo ========================================
echo 🎉 双平台构建完成！
echo ========================================
echo.
echo 📁 构建结果:
echo   - H5 网页版: dist\h5\
echo   - 小程序版: dist\ (微信开发者工具可直接导入)
echo   - 部署包: dist.zip
echo.
echo 📝 下一步操作:
echo   1. 网页版: 将 dist\h5\ 内容部署到服务器
echo   2. 小程序版: 用微信开发者工具打开 dist\ 目录
echo   3. 服务器部署: 上传 dist.zip 到服务器
echo.
pause
