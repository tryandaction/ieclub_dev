#!/bin/bash

# IEClub 后端部署脚本
# 用法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始 IEClub 后端部署..."

# 检查 Node.js 版本
echo "📋 检查 Node.js 版本..."
node --version

# 检查 npm 版本
echo "📋 检查 npm 版本..."
npm --version

# 清理 npm 缓存（解决依赖问题）
echo "🧹 清理 npm 缓存..."
npm cache clean --force

# 删除 node_modules 和 package-lock.json（强制重新安装）
echo "🗑️ 清理旧的依赖文件..."
rm -rf node_modules package-lock.json

# 安装依赖（使用正确的标志）
echo "📦 安装依赖..."
npm install --omit=dev

# 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
npx prisma generate

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
npx prisma migrate deploy

# 检查种子脚本是否存在
if [ -f "scripts/seed.js" ]; then
    echo "🌱 运行种子数据脚本..."
    node scripts/seed.js
else
    echo "⚠️ 警告: scripts/seed.js 文件不存在，跳过种子数据填充"
fi

# 检查端口是否被占用
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 端口 $PORT 被占用，正在停止现有服务..."
    lsof -ti:$PORT | xargs kill -9 || true
    sleep 2
fi

# 重启 PM2 服务
echo "🔄 重启 PM2 服务..."
pm2 delete ieclub-api 2>/dev/null || true
pm2 start src/server.js --name ieclub-api --time
pm2 save

echo "✅ 部署完成！"
echo "🔗 API 地址: http://localhost:3000/api"
echo "💊 健康检查: http://localhost:3000/health"

# 检查服务状态
echo "📊 检查服务状态..."
pm2 status ieclub-api

echo "🎉 部署成功！"