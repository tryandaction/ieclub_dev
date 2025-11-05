#!/bin/bash
# 修复测试服务器邮件服务问题

set -e

echo "🔧 开始修复测试服务器邮件服务..."

# 1. 备份当前文件
echo "📦 备份当前文件..."
ssh root@test.ieclub.online "cd /root/ieclub_backend && \
  cp src/controllers/authController.js src/controllers/authController.js.backup && \
  cp src/services/emailService.js src/services/emailService.js.backup"

# 2. 上传修复后的文件
echo "📤 上传修复后的文件..."
scp ieclub-backend/src/controllers/authController.js root@test.ieclub.online:/root/ieclub_backend/src/controllers/
scp ieclub-backend/src/services/emailService.js root@test.ieclub.online:/root/ieclub_backend/src/services/

# 3. 重启服务
echo "🔄 重启后端服务..."
ssh root@test.ieclub.online "cd /root/ieclub_backend && pm2 restart ieclub-backend"

# 4. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 5. 检查服务状态
echo "✅ 检查服务状态..."
ssh root@test.ieclub.online "pm2 status ieclub-backend"

# 6. 查看最新日志
echo "📋 查看最新日志..."
ssh root@test.ieclub.online "pm2 logs ieclub-backend --lines 50 --nostream"

echo "✨ 修复完成！请测试邮件发送功能"

