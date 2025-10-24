#!/bin/bash
# 恢复正确的文件结构

echo "🔧 恢复正确的文件结构..."

# 1. 检查当前状态
echo "➡️ 当前h5目录结构:"
find /var/www/ieclub_dev/ieclub-taro/dist/h5 -type f | head -10

# 2. 检查备份目录
echo "➡️ 备份目录内容:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5.backup.20251024_171030/

# 3. 清空当前h5目录
echo "➡️ 清空当前h5目录..."
rm -rf /var/www/ieclub_dev/ieclub-taro/dist/h5/*

# 4. 从备份恢复所有文件
echo "➡️ 从备份恢复文件..."
cp -r /var/www/ieclub_dev/ieclub-taro/dist/h5.backup.20251024_171030/* /var/www/ieclub_dev/ieclub-taro/dist/h5/

# 5. 检查恢复后的结构
echo "➡️ 恢复后的h5目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/

# 6. 确认index.html存在
echo "➡️ 检查index.html:"
if [ -f "/var/www/ieclub_dev/ieclub-taro/dist/h5/index.html" ]; then
    echo "✅ index.html 存在"
    ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/index.html
else
    echo "❌ index.html 仍然缺失"
fi

# 7. 检查CSS和JS目录
echo "➡️ 检查CSS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/css/ | head -3

echo "➡️ 检查JS目录:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/js/ | head -3

# 8. 修复权限
echo "➡️ 修复权限..."
chown -R www-data:www-data /var/www/ieclub_dev/ieclub-taro/dist/h5/
chmod -R 755 /var/www/ieclub_dev/ieclub-taro/dist/h5/
find /var/www/ieclub_dev/ieclub-taro/dist/h5/ -type f -exec chmod 644 {} \;

# 9. 重新加载Nginx
echo "➡️ 重新加载Nginx..."
systemctl reload nginx

# 10. 测试访问
echo "➡️ 测试访问:"
curl -I http://localhost/
echo ""
echo "➡️ 测试CSS访问:"
curl -I http://localhost/css/styles.css

echo ""
echo "🎯 文件结构恢复完成！"
