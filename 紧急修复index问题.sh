#!/bin/bash
# 紧急修复 index.html 和权限问题

echo "🚨 紧急修复 index.html 和权限问题..."

# 1. 检查当前文件状态
echo "➡️ 当前文件状态:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/

# 2. 修复文件权限（统一为 www-data）
echo "➡️ 修复文件权限..."
chown -R www-data:www-data /var/www/ieclub_dev/ieclub-taro/dist/
chmod -R 755 /var/www/ieclub_dev/ieclub-taro/dist/
find /var/www/ieclub_dev/ieclub-taro/dist/ -type f -exec chmod 644 {} \;

# 3. 检查 index.html 内容
echo "➡️ 检查 index.html 内容..."
if [ -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/index.html" ]; then
    echo "✅ index.html 存在"
    echo "文件大小: $(stat -c%s /var/www/ieclub_dev/ieclub-taro/dist/h5/index.html) bytes"
    echo "前10行内容:"
    head -10 /var/www/ieclub_dev/ieclub-taro/dist/h5/index.html
else
    echo "❌ index.html 不存在！"
    exit 1
fi

# 4. 检查 Nginx 配置中的 index 指令
echo "➡️ 检查 Nginx 配置..."
nginx -T 2>/dev/null | grep -A 10 -B 5 "server_name.*ieclub.online"

# 5. 测试 Nginx 配置
echo "➡️ 测试 Nginx 配置..."
nginx -t

# 6. 重新加载 Nginx
echo "➡️ 重新加载 Nginx..."
systemctl reload nginx

# 7. 测试本地访问
echo "➡️ 测试本地访问..."
echo "HTTP 响应头:"
curl -I http://localhost/ 2>/dev/null

echo "HTTP 响应内容（前200字符）:"
curl -s http://localhost/ 2>/dev/null | head -c 200

# 8. 检查是否有其他 index 文件
echo "➡️ 检查目录中的所有文件:"
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -name "index*" -type f

echo ""
echo "🎉 修复完成！请测试访问 http://ieclub.online"
