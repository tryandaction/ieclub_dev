#!/bin/bash
# IEClub 服务器快速部署脚本

echo "🚀 IEClub 服务器部署开始..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
cd /root/IEclub_dev
git pull origin main

# 2. 检查PM2状态
echo "🔍 检查PM2进程..."
pm2 status

# 3. 部署后端
echo "🔧 部署后端..."
cd /root/IEclub_dev/ieclub-backend
npm install --production
pm2 restart ieclub-backend

# 4. 部署网页
echo "🌐 部署网页..."
cd /root/IEclub_dev/ieclub-web

# 如果有zip文件则解压，否则构建
if [ -f "web-dist.zip" ]; then
  echo "📦 解压web-dist.zip..."
  unzip -o web-dist.zip -d dist/
else
  echo "🔨 构建网页..."
  npm install
  npm run build
fi

# 5. 重载Nginx
echo "♻️  重载Nginx..."
nginx -t && nginx -s reload

# 6. 测试健康检查
echo "🏥 测试健康检查..."
sleep 2
curl -s http://localhost:3000/health | jq .
curl -s http://localhost:3000/api/test | jq .

# 7. 查看日志
echo "📋 查看后端日志..."
pm2 logs ieclub-backend --lines 20 --nostream

echo "✅ 部署完成！"

