@echo off
echo ========================================
echo    IEClub 开发环境启动脚本
echo ========================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常

echo.
echo [2/4] 启动后端服务...
cd ieclub-backend
start "IEClub Backend" cmd /k "npm run dev"
cd ..

echo.
echo [3/4] 等待后端服务启动...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] 启动前端服务...
cd ieclub-taro
start "IEClub Frontend" cmd /k "npm run dev:h5"
cd ..

echo.
echo ========================================
echo    🚀 IEClub 开发环境已启动！
echo ========================================
echo.
echo 📱 前端地址: http://localhost:10086
echo 🔧 后端地址: http://localhost:3000
echo 📊 API文档: http://localhost:3000/api
echo.
echo 按任意键退出...
pause >nul
