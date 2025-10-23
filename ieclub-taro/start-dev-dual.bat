@echo off
echo ========================================
echo 🚀 IEClub 双平台开发环境启动脚本
echo ========================================

cd /d "%~dp0"

echo.
echo 📋 启动 H5 开发服务器...
echo 🌐 网页版将在 http://localhost:10086 启动
echo.
echo 📋 启动小程序开发模式...
echo 📱 请用微信开发者工具打开 dist 目录
echo.

echo 🔄 正在启动 H5 开发服务器...
start "IEClub H5 Dev Server" cmd /k "npm run dev:h5"

echo.
echo ⏳ 等待 3 秒后启动小程序构建...
timeout /t 3 /nobreak >nul

echo 🔄 正在构建小程序...
start "IEClub Weapp Build" cmd /k "npm run build:weapp -- --watch"

echo.
echo ========================================
echo 🎉 开发环境启动完成！
echo ========================================
echo.
echo 📝 访问地址:
echo   - H5 网页版: http://localhost:10086
echo   - 小程序版: 用微信开发者工具打开 dist 目录
echo.
echo 💡 提示:
echo   - H5 开发服务器支持热重载
echo   - 小程序构建支持文件监听
echo   - 按 Ctrl+C 可停止对应服务
echo.
pause
