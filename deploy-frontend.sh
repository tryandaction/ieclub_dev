#!/bin/bash
echo "🚀 部署前端文件..."

# 备份当前文件
if [ -d "/var/www/ieclub_dev/ieclub-taro/dist/h5" ]; then
    echo "➡️ 备份当前文件..."
    mv /var/www/ieclub_dev/ieclub-taro/dist/h5 /var/www/ieclub_dev/ieclub-taro/dist/h5.backup.date +%Y%m%d_%H%M%S
fi

# 创建目录
echo "➡️ 创建目录..."
mkdir -p /var/www/ieclub_dev/ieclub-taro/dist/h5

# 解压新文件
echo "➡️ 解压新文件..."
cd /var/www/ieclub_dev/ieclub-taro/dist/h5
unzip -o /tmp/h5-deploy.zip

# 检查文件
echo "➡️ 检查部署的文件:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/
echo ""
echo "➡️ 检查index.html:"
if [ -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ index.html 缺失"
fi

echo "➡️ 检查CSS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/css/

echo "➡️ 检查JS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/js/ | head -5

# 修复权限
echo "➡️ 修复权限..."
chown -R www-data:www-data /var/www/ieclub_dev/ieclub-taro/dist/h5/
chmod -R 755 /var/www/ieclub_dev/ieclub-taro/dist/h5/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;

# 重新加载Nginx
echo "➡️ 重新加载Nginx..."
systemctl reload nginx

# 测试访问
echo "➡️ 测试访问:"
curl -I http://localhost/
echo ""
echo "➡️ 测试CSS:"
curl -I http://localhost/css/styles.css

echo ""
echo "🎯 部署完成！"
