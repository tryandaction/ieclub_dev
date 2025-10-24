#!/bin/bash
# 调试外部访问空白问题

echo "🔍 调试外部访问空白问题..."

# 1. 检查防火墙状态
echo "➡️ 检查防火墙状态:"
ufw status
iptables -L -n | head -20

# 2. 检查端口监听
echo "➡️ 检查端口监听:"
netstat -tlnp | grep :80
ss -tlnp | grep :80

# 3. 测试不同的访问方式
echo "➡️ 测试不同访问方式:"
echo "本地localhost:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}, 响应时间: %{time_total}s\n" http://localhost/

echo "本地IP:"
curl -s -o /dev/null -w "HTTP状态码: %{http_code}, 响应时间: %{time_total}s\n" http://127.0.0.1/

echo "内网IP:"
LOCAL_IP=$(hostname -I | awk '{print $1}')
curl -s -o /dev/null -w "HTTP状态码: %{http_code}, 响应时间: %{time_total}s\n" http://$LOCAL_IP/

# 4. 检查DNS解析
echo "➡️ 检查DNS解析:"
nslookup ieclub.online
dig ieclub.online

# 5. 检查Nginx访问日志
echo "➡️ 最近的访问日志:"
tail -10 /var/log/nginx/access.log

# 6. 检查Nginx错误日志
echo "➡️ 最新的错误日志:"
tail -5 /var/log/nginx/error.log

# 7. 检查静态资源
echo "➡️ 检查静态资源:"
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/css/
ls -la /var/www/ieclub_dev/ieclub-taro/dist/h5/js/ | head -5

# 8. 测试静态资源访问
echo "➡️ 测试CSS文件访问:"
curl -I http://localhost/css/styles.css

# 9. 检查浏览器缓存问题
echo "➡️ 生成带时间戳的测试URL:"
echo "测试URL: http://ieclub.online/?t=$(date +%s)"
echo "测试URL: http://39.108.160.112/?t=$(date +%s)"

# 10. 检查Content-Type
echo "➡️ 检查Content-Type:"
curl -I http://localhost/ | grep -i content-type

echo ""
echo "🎯 请在浏览器中测试以下操作:"
echo "1. 硬刷新 (Ctrl+F5 或 Ctrl+Shift+R)"
echo "2. 清除浏览器缓存"
echo "3. 使用隐私/无痕模式访问"
echo "4. 打开开发者工具查看网络请求"
