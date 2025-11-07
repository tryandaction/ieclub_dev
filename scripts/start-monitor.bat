@echo off
REM Quick start script for Staging Environment Monitor
REM Windows Batch version

echo.
echo ========================================
echo  IEClub Staging Monitor Quick Start
echo ========================================
echo.
echo Please select monitoring mode:
echo.
echo 1. Basic Check (one-time)
echo 2. Detailed Check (with metrics)
echo 3. Auto-Fix Mode (restart on failure)
echo 4. Continuous Monitor (every 5 minutes)
echo 5. Continuous + Auto-Fix (recommended)
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "%~dp0Monitor-Staging.ps1"
) else if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "%~dp0Monitor-Staging.ps1" -Detailed
) else if "%choice%"=="3" (
    powershell -ExecutionPolicy Bypass -File "%~dp0Monitor-Staging.ps1" -AutoFix
) else if "%choice%"=="4" (
    powershell -ExecutionPolicy Bypass -File "%~dp0Monitor-Staging.ps1" -Continuous
) else if "%choice%"=="5" (
    echo.
    echo Starting continuous monitoring with auto-fix...
    echo Press Ctrl+C to stop
    echo.
    powershell -ExecutionPolicy Bypass -File "%~dp0Monitor-Staging.ps1" -Detailed -AutoFix -Continuous
) else if "%choice%"=="6" (
    exit
) else (
    echo Invalid choice!
    pause
)

pause

