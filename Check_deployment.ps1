# IEClub 部署诊断脚本
# 用于检查服务器端的配置和服务状态

param(
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [string]$ServerUser = "root"
)

Write-Host "🔍 开始诊断部署问题..." -ForegroundColor Cyan
Write-Host ""

# 1. 测试服务器连接
Write-Host "1️⃣ 测试服务器连接..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" "echo '✅ SSH 连接成功'"

# 2. 检查网页文件
Write-Host "`n2️⃣ 检查网页文件..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -f /root/IEclub_dev/ieclub-web/dist/index.html ]; then
    echo '✅ 网页文件存在'
    ls -lh /root/IEclub_dev/ieclub-web/dist/
else
    echo '❌ 网页文件不存在'
fi
"@

# 3. 检查 Nginx 状态
Write-Host "`n3️⃣ 检查 Nginx 状态..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if systemctl is-active --quiet nginx; then
    echo '✅ Nginx 正在运行'
    nginx -t
else
    echo '❌ Nginx 未运行'
fi
"@

# 4. 检查 Nginx 配置
Write-Host "`n4️⃣ 检查 Nginx 配置..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -f /etc/nginx/sites-available/ieclub ]; then
    echo '✅ Nginx 配置文件存在'
    echo '--- 配置内容 ---'
    cat /etc/nginx/sites-available/ieclub
else
    echo '❌ Nginx 配置文件不存在'
fi
"@

# 5. 检查后端服务
Write-Host "`n5️⃣ 检查后端服务..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if command -v pm2 &> /dev/null; then
    echo '✅ PM2 已安装'
    pm2 list
else
    echo '❌ PM2 未安装'
fi
"@

# 6. 检查端口占用
Write-Host "`n6️⃣ 检查端口占用..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo '--- 端口 80 (HTTP) ---'
netstat -tlnp | grep ':80 ' || echo '端口 80 未监听'
echo '--- 端口 443 (HTTPS) ---'
netstat -tlnp | grep ':443 ' || echo '端口 443 未监听'
echo '--- 端口 3000 (Backend) ---'
netstat -tlnp | grep ':3000 ' || echo '端口 3000 未监听'
"@

# 7. 检查防火墙
Write-Host "`n7️⃣ 检查防火墙..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if command -v ufw &> /dev/null; then
    echo '✅ UFW 防火墙'
    ufw status
elif command -v firewalld &> /dev/null; then
    echo '✅ FirewallD'
    firewall-cmd --list-all
else
    echo 'ℹ️ 未检测到防火墙'
fi
"@

# 8. 检查 SSL 证书
Write-Host "`n8️⃣ 检查 SSL 证书..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
if [ -f /etc/letsencrypt/live/ieclub.online/fullchain.pem ]; then
    echo '✅ SSL 证书存在'
    openssl x509 -in /etc/letsencrypt/live/ieclub.online/fullchain.pem -noout -dates
else
    echo '❌ SSL 证书不存在'
fi
"@

# 9. 测试本地网络访问
Write-Host "`n9️⃣ 测试从服务器访问网站..." -ForegroundColor Yellow
ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
echo '--- HTTP 访问测试 ---'
curl -I http://localhost/ 2>&1 | head -n 5
echo '--- HTTPS 访问测试 ---'
curl -I -k https://localhost/ 2>&1 | head -n 5
"@

Write-Host "`n✅ 诊断完成！" -ForegroundColor Green
Write-Host ""
Write-Host "如果发现问题，请根据上述信息进行修复。" -ForegroundColor Cyan

