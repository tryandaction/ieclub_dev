#!/bin/bash
echo "🔧 修复 Nginx 403/500 错误..."

# 1. 修复文件权限
chown -R www-data:www-data /var/www/ieclub_dev/
chmod -R 755 /var/www/ieclub_dev/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;

# 2. 创建 favicon.ico（如果不存在）
if [ ! -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico" ]; then
    touch /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    chmod 644 /var/www/ieclub_dev/ieclub-taro/dist/h5/favicon.ico
    echo "✅ 创建了 favicon.ico"
fi

# 3. 测试 Nginx 配置
nginx -t

# 4. 重启 Nginx
systemctl restart nginx

# 5. 检查服务状态
systemctl status nginx --no-pager

echo "🎉 修复完成！请测试访问 http://ieclub.online"
