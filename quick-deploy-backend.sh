#!/bin/bash
# 快速部署后端到生产环境

set -e

echo "=========================================="
echo "  快速部署后端到生产环境"
echo "=========================================="

SERVER="root@ieclub.online"
BACKEND_DIR="/root/IEclub_dev/ieclub-backend"

echo "[1/6] 连接服务器并检查状态..."
ssh $SERVER "cd $BACKEND_DIR && pwd"

echo "[2/6] 检查PM2进程..."
ssh $SERVER "pm2 list | grep ieclub-backend || echo '未找到进程'"

echo "[3/6] 停止旧进程..."
ssh $SERVER "pm2 delete ieclub-backend 2>/dev/null || true"

echo "[4/6] 检查代码和依赖..."
ssh $SERVER "cd $BACKEND_DIR && \
  if [ -f package.json ]; then \
    echo '安装依赖...' && \
    npm install --production=false --loglevel=error && \
    echo '生成Prisma客户端...' && \
    npx prisma generate && \
    echo '执行数据库迁移...' && \
    npx prisma migrate deploy || echo '迁移跳过'; \
  else \
    echo '错误: package.json不存在'; \
    exit 1; \
  fi"

echo "[5/6] 启动后端服务..."
ssh $SERVER "cd $BACKEND_DIR && \
  pm2 start src/server.js --name ieclub-backend --time && \
  pm2 save"

echo "[6/6] 等待服务启动并检查状态..."
sleep 5
ssh $SERVER "pm2 status"
ssh $SERVER "pm2 logs ieclub-backend --lines 20 --nostream"

echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo "查看日志: ssh $SERVER 'pm2 logs ieclub-backend'"
echo "健康检查: curl https://ieclub.online/api/health"

