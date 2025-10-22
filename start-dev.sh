#!/bin/bash

echo "========================================"
echo "    IEClub 开发环境启动脚本"
echo "========================================"
echo

echo "[1/4] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi
echo "✅ Node.js 环境正常"

echo
echo "[2/4] 启动后端服务..."
cd ieclub-backend
gnome-terminal --title="IEClub Backend" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
xterm -title "IEClub Backend" -e "npm run dev" &
cd ..

echo
echo "[3/4] 等待后端服务启动..."
sleep 5

echo
echo "[4/4] 启动前端服务..."
cd ieclub-taro
gnome-terminal --title="IEClub Frontend" -- bash -c "npm run dev:h5; exec bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev:h5"' 2>/dev/null || \
xterm -title "IEClub Frontend" -e "npm run dev:h5" &
cd ..

echo
echo "========================================"
echo "    🚀 IEClub 开发环境已启动！"
echo "========================================"
echo
echo "📱 前端地址: http://localhost:10086"
echo "🔧 后端地址: http://localhost:3000"
echo "📊 API文档: http://localhost:3000/api"
echo
echo "按任意键退出..."
read -n 1
