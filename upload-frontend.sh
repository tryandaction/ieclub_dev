#!/bin/bash
# 上传前端文件到服务器

SERVER="root@39.108.160.112"
REMOTE_PATH="/usr/share/nginx/html"
LOCAL_PATH="ieclub-taro/dist"

echo "📤 正在上传前端文件到服务器..."

# 使用 scp 上传
scp -r ${LOCAL_PATH}/* ${SERVER}:${REMOTE_PATH}/

echo "✅ 前端文件上传完成！"
echo "🌐 访问地址: https://ieclub.online"

