#!/bin/bash
# IEclub 服务器紧急修复脚本
# 解决 PM2 和前端部署问题

echo "🚨 IEclub 服务器紧急修复开始..."

# 1. 检查并安装 PM2
echo "➡️ 步骤 1: 检查 PM2 状态..."
if ! command -v pm2 &> /dev/null; then
    echo "⚠️ PM2 未安装，正在安装..."
    npm install -g pm2
    echo "✅ PM2 安装完成"
else
    echo "✅ PM2 已存在"
fi

# 2. 手动部署前端文件
echo "➡️ 步骤 2: 手动部署前端文件..."

# 检查上传的文件
if [ -f "/tmp/dist.zip" ]; then
    echo "✅ 找到上传的 dist.zip"
    
    # 备份现有文件
    if [ -d "/var/www/ieclub_dev/ieclub-taro/dist" ]; then
        mv /var/www/ieclub_dev/ieclub-taro/dist /var/www/ieclub_dev/ieclub-taro/dist.backup.$(date +%Y%m%d_%H%M%S)
        echo "✅ 已备份现有 dist 目录"
    fi
    
    # 解压新文件
    cd /var/www/ieclub_dev/ieclub-taro/
    unzip -o /tmp/dist.zip
    echo "✅ 新前端文件解压完成"
else
    echo "❌ 错误: /tmp/dist.zip 不存在！"
    echo "请重新上传文件: scp dist.zip root@39.108.160.112:/tmp/"
    exit 1
fi

# 3. 修复文件权限
echo "➡️ 步骤 3: 修复文件权限..."
chown -R www-data:www-data /var/www/ieclub_dev/
chmod -R 755 /var/www/ieclub_dev/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;
echo "✅ 文件权限修复完成"

# 4. 创建 favicon.ico（避免500错误）
echo "➡️ 步骤 4: 处理 favicon..."
if [ ! -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico" ]; then
    touch /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    chmod 644 /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    echo "✅ 创建了 favicon.ico"
else
    echo "✅ favicon.ico 已存在"
fi

# 5. 检查关键文件
echo "➡️ 步骤 5: 验证部署文件..."
if [ -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ 错误: index.html 不存在！"
    exit 1
fi

JS_COUNT=$(find /var/www/ieclub_dev/ieclub-taro/dist/h5/js/ -name "*.js" 2>/dev/null | wc -l)
echo "✅ 找到 $JS_COUNT 个 JS 文件"

CSS_COUNT=$(find /var/www/ieclub_dev/ieclub-taro/dist/h5/css/ -name "*.css" 2>/dev/null | wc -l)
echo "✅ 找到 $CSS_COUNT 个 CSS 文件"

# 6. 重启后端服务（如果 PM2 可用）
echo "➡️ 步骤 6: 重启后端服务..."
cd /var/www/ieclub_dev/ieclub-backend/
if command -v pm2 &> /dev/null; then
    pm2 restart all || pm2 start npm --name "ieclub-backend" -- start
    echo "✅ 后端服务重启完成"
else
    echo "⚠️ PM2 不可用，跳过后端重启"
fi

# 7. 测试并重启 Nginx
echo "➡️ 步骤 7: 重启 Nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "✅ Nginx 重启成功"
else
    echo "❌ Nginx 配置有错误！"
    nginx -t
fi

# 8. 检查服务状态
echo "➡️ 步骤 8: 检查服务状态..."
echo "Nginx 状态:"
systemctl status nginx --no-pager -l

if command -v pm2 &> /dev/null; then
    echo "PM2 进程:"
    pm2 list
fi

# 9. 测试访问
echo "➡️ 步骤 9: 测试本地访问..."
curl -I http://localhost/ 2>/dev/null | head -1

echo ""
echo "🎉 修复完成！"
echo "📋 请测试以下URL:"
echo "   - http://ieclub.online"
echo "   - http://39.108.160.112"
echo ""
echo "🔍 如果仍有问题，请检查:"
echo "   - Nginx 错误日志: tail -f /var/log/nginx/error.log"
echo "   - 访问日志: tail -f /var/log/nginx/access.log"
