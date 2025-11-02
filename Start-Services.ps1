# Start-Services.ps1 - 简单的服务启动脚本
# 在两个独立的窗口中启动后端和前端

Write-Host "🚀 启动 IEClub 开发服务器`n" -ForegroundColor Cyan

# 启动后端（新窗口）
Write-Host "1️⃣  启动后端服务..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\ieclub-backend'; Write-Host '🔧 后端服务启动中...' -ForegroundColor Cyan; npm start"

Start-Sleep -Seconds 2

# 启动前端（新窗口）
Write-Host "2️⃣  启动前端服务..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\ieclub-web'; Write-Host '🎨 前端服务启动中...' -ForegroundColor Cyan; npm run dev"

Write-Host "`n✅ 服务启动命令已发送！" -ForegroundColor Green
Write-Host "`n📍 访问地址:" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:5173" -ForegroundColor White
Write-Host "   后端: http://localhost:3000" -ForegroundColor White
Write-Host "`n💡 提示: 两个服务在独立窗口中运行，关闭窗口即可停止服务`n" -ForegroundColor Yellow

