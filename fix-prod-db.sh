#!/bin/bash
# 修复生产环境数据库配置

cd /root/IEclub_dev/ieclub-backend

# 备份
cp .env .env.backup-prod

# 更新DATABASE_URL - 使用staging数据库作为临时方案
sed -i 's|^DATABASE_URL=.*|DATABASE_URL="mysql://ieclub_user:St%40g%21ng2025%23IEclub@localhost:3306/ieclub_staging"|' .env

echo "=============== 数据库配置已更新 ==============="
grep DATABASE_URL .env

echo "=============== 重启后端服务 ==============="
pm2 restart ieclub-backend

sleep 5

echo "=============== 检查服务状态 ==============="
pm2 list

echo "=============== 检查API健康 ==============="
curl -s http://127.0.0.1:3000/health | head -50

echo "=============== 查看最新日志 ==============="
pm2 logs ieclub-backend --lines 30 --nostream

