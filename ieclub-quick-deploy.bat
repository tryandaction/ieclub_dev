@echo off
chcp 65001 >nul
echo.
echo 🚀 IEClub 快速部署脚本
echo =====================
echo.

REM 检查PowerShell是否可用
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell不可用，请使用PowerShell运行 ieclub-smart-deploy.ps1
    pause
    exit /b 1
)

REM 运行智能部署脚本
echo 正在启动智能部署脚本...
powershell -ExecutionPolicy Bypass -File "ieclub-smart-deploy.ps1" %*

pause
