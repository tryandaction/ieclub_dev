@echo off
echo ========================================
echo    清理多余代码文件
echo ========================================
echo.

echo [1/4] 删除 v2版社区 文件夹...
if exist "v2版社区" (
    rmdir /s /q "v2版社区"
    echo ✅ 已删除 v2版社区 文件夹
) else (
    echo ⚠️  v2版社区 文件夹不存在
)

echo.
echo [2/4] 删除 v3版社区 文件夹...
if exist "v3版社区" (
    rmdir /s /q "v3版社区"
    echo ✅ 已删除 v3版社区 文件夹
) else (
    echo ⚠️  v3版社区 文件夹不存在
)

echo.
echo [3/4] 删除 开发代码 文件夹...
if exist "开发代码" (
    rmdir /s /q "开发代码"
    echo ✅ 已删除 开发代码 文件夹
) else (
    echo ⚠️  开发代码 文件夹不存在
)

echo.
echo [4/4] 清理完成！
echo ========================================
echo    🧹 多余代码清理完成！
echo ========================================
echo.
echo 已删除的文件夹：
echo - v2版社区/
echo - v3版社区/
echo - 开发代码/
echo.
echo 按任意键退出...
pause >nul
