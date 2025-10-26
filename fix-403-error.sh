#!/bin/bash

# ==========================================
# IEClub 403 错误修复脚本
# ==========================================

set -e  # 遇到错误立即退出

echo "🔧 开始修复 403 Forbidden 错误..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 检查前端文件是否存在
echo "📁 [1/8] 检查前端文件..."
if [ ! -f "/root/IEclub_dev/ieclub-taro/dist/index.html" ]; then
    echo -e "${RED}❌ 错误: 前端文件不存在！${NC}"
    echo "请先运行部署脚本构建前端文件"
    exit 1
fi
echo -e "${GREEN}✅ 前端文件存在${NC}"
echo ""

# 2. 修复目录权限
echo "🔐 [2/8] 修复目录权限..."
chmod 755 /root
chmod 755 /root/IEclub_dev
chmod -R 755 /root/IEclub_dev/ieclub-taro/dist/
echo -e "${GREEN}✅ 权限已修复${NC}"
echo ""

# 3. 备份当前 nginx 配置
echo "💾 [3/8] 备份当前 nginx 配置..."
if [ -f "/etc/nginx/sites-available/default" ]; then
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ 配置已备份${NC}"
else
    echo -e "${YELLOW}⚠️  没有找到 default 配置文件${NC}"
fi
echo ""

# 4. 检查是否有 SSL 证书
echo "🔍 [4/8] 检查 SSL 证书..."
if [ -f "/etc/letsencrypt/live/ieclub.online/fullchain.pem" ]; then
    echo -e "${GREEN}✅ 发现 SSL 证书，使用 HTTPS 配置${NC}"
    NGINX_CONFIG="nginx-production.conf"
else
    echo -e "${YELLOW}⚠️  未发现 SSL 证书，使用 HTTP 配置${NC}"
    NGINX_CONFIG="nginx-http-only.conf"
fi
echo ""

# 5. 复制正确的 nginx 配置
echo "📝 [5/8] 应用正确的 nginx 配置..."
if [ -f "/root/IEclub_dev/$NGINX_CONFIG" ]; then
    cp /root/IEclub_dev/$NGINX_CONFIG /etc/nginx/sites-available/ieclub.online
    echo -e "${GREEN}✅ 配置文件已复制${NC}"
else
    echo -e "${RED}❌ 错误: 找不到配置文件 $NGINX_CONFIG${NC}"
    exit 1
fi
echo ""

# 6. 创建软链接
echo "🔗 [6/8] 创建配置软链接..."
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/ieclub.online
ln -sf /etc/nginx/sites-available/ieclub.online /etc/nginx/sites-enabled/
echo -e "${GREEN}✅ 软链接已创建${NC}"
echo ""

# 7. 测试 nginx 配置
echo "🧪 [7/8] 测试 nginx 配置..."
if nginx -t 2>&1; then
    echo -e "${GREEN}✅ Nginx 配置测试通过${NC}"
else
    echo -e "${RED}❌ Nginx 配置测试失败${NC}"
    echo "请检查配置文件"
    exit 1
fi
echo ""

# 8. 重启 nginx
echo "🔄 [8/8] 重启 nginx..."
systemctl restart nginx

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx 已成功重启${NC}"
else
    echo -e "${RED}❌ Nginx 重启失败${NC}"
    systemctl status nginx
    exit 1
fi
echo ""

# 显示最终状态
echo "=========================================="
echo -e "${GREEN}🎉 修复完成！${NC}"
echo "=========================================="
echo ""
echo "📊 配置信息:"
echo "   - 配置文件: $NGINX_CONFIG"
echo "   - 前端路径: /root/IEclub_dev/ieclub-taro/dist/"
echo "   - Nginx 状态: $(systemctl is-active nginx)"
echo ""
echo "🌐 访问测试:"
if [ "$NGINX_CONFIG" = "nginx-production.conf" ]; then
    echo "   - HTTPS: https://ieclub.online"
    echo "   - HTTP: http://ieclub.online (会重定向到 HTTPS)"
else
    echo "   - HTTP: http://ieclub.online"
fi
echo ""
echo "📝 查看日志:"
echo "   sudo tail -f /var/log/nginx/ieclub-error.log"
echo ""

