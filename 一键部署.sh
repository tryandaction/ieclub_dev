#!/bin/bash
# IEClub H5 一键部署脚本

SERVER="root@47.103.76.149"
REMOTE_DIR="/www/wwwroot/ieclub.cn"
LOCAL_DIR="./ieclub-taro/dist"

echo "📦 开始部署..."

# 1. 直接使用rsync同步文件（最简单）
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  ${LOCAL_DIR}/ ${SERVER}:${REMOTE_DIR}/

# 2. 设置权限
ssh ${SERVER} "cd ${REMOTE_DIR} && chmod -R 755 * && chown -R www:www * 2>/dev/null || true"

echo "✅ 部署完成！"
echo "🌐 访问地址: http://47.103.76.149"

