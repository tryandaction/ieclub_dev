#!/bin/bash
# IEClub 测试环境交互式配置脚本

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "========================================="
echo "  IEClub 测试环境配置向导"
echo "========================================="
echo -e "${NC}"
echo ""

# 步骤 1: 获取 MySQL root 密码
echo -e "${YELLOW}请输入 MySQL root 密码:${NC}"
read -s MYSQL_ROOT_PASSWORD
echo ""

# 测试连接
if ! mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}✗ MySQL root 密码错误${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MySQL 连接成功${NC}"
echo ""

# 步骤 2: 配置数据库
echo -e "${YELLOW}配置测试数据库...${NC}"

DB_USER="ieclub_staging"
DB_NAME="ieclub_staging"
DB_PASSWORD=$(openssl rand -base64 20 | tr -d '/+=' | head -c 20)

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<MYSQL_SCRIPT
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';
DROP USER IF EXISTS '${DB_USER}'@'%';

CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✓ 数据库创建成功${NC}"
echo "  数据库: ${DB_NAME}"
echo "  用户: ${DB_USER}"
echo "  密码: ${DB_PASSWORD}"
echo ""

# 步骤 3: 更新环境配置
echo -e "${YELLOW}更新环境配置文件...${NC}"

PROJECT_DIR="/var/www/ieclub-backend-staging"
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/${DB_NAME}"

# 创建完整的配置文件
cat > ${PROJECT_DIR}/.env.staging <<EOF
# IEClub 测试环境配置 - 自动生成于 $(date)

# 环境配置
NODE_ENV=staging
PORT=3001

# 数据库配置
DATABASE_URL="${DATABASE_URL}"

# Redis 配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=1

# JWT 配置
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES_IN=30d

# 会话配置
SESSION_SECRET=$(openssl rand -base64 32)

# CORS 配置
CORS_ORIGIN=https://test.ieclub.online,http://127.0.0.1:5173,http://localhost:5173

# 文件上传配置
UPLOAD_DIR=/var/www/ieclub-uploads-staging
MAX_IMAGE_SIZE=5242880
MAX_DOCUMENT_SIZE=20971520
MAX_VIDEO_SIZE=104857600

# 日志配置
LOG_LEVEL=debug
LOG_DIR=/var/log/ieclub-staging
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 业务配置
TOPIC_TITLE_MIN_LENGTH=5
TOPIC_TITLE_MAX_LENGTH=100
TOPIC_CONTENT_MIN_LENGTH=10
TOPIC_CONTENT_MAX_LENGTH=10000
TOPIC_MAX_IMAGES=9
TOPIC_MAX_TAGS=5

COMMENT_MIN_LENGTH=1
COMMENT_MAX_LENGTH=1000
COMMENT_MAX_IMAGES=3

CREDITS_TOPIC_CREATE=10
CREDITS_COMMENT_CREATE=2
CREDITS_LIKE_RECEIVED=1
CREDITS_DAILY_LOGIN=5

# 缓存配置
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=3600
CACHE_TTL_LONG=86400

# 推荐配置
RECOMMEND_TOPICS_COUNT=20
RECOMMEND_REFRESH_INTERVAL=3600

# 热度算法
HOT_SCORE_GRAVITY=1.8
HOT_SCORE_VIEW_WEIGHT=1
HOT_SCORE_LIKE_WEIGHT=2
HOT_SCORE_COMMENT_WEIGHT=3
HOT_SCORE_BOOKMARK_WEIGHT=2

# WebSocket 配置
WS_ENABLED=true
WS_HEARTBEAT_INTERVAL=30000
WS_RECONNECT_INTERVAL=5000

# 定时任务配置
CRON_ENABLED=true
CRON_HOT_SCORE_UPDATE=*/30 * * * *
CRON_CACHE_CLEANUP=0 3 * * *
EOF

echo -e "${GREEN}✓ 环境配置文件创建完成${NC}"
echo ""

# 步骤 4: 创建目录结构
echo -e "${YELLOW}创建目录结构...${NC}"

mkdir -p /var/www/ieclub-uploads-staging/{images,documents,videos,temp,avatars}
mkdir -p /var/log/ieclub-staging
mkdir -p ${PROJECT_DIR}/tmp

chmod -R 755 /var/www/ieclub-uploads-staging
chmod -R 755 /var/log/ieclub-staging
chmod -R 755 ${PROJECT_DIR}/tmp

echo -e "${GREEN}✓ 目录结构创建完成${NC}"
echo ""

# 步骤 5: 数据库迁移
echo -e "${YELLOW}迁移数据库结构...${NC}"

cd ${PROJECT_DIR}

# 生成 Prisma 客户端
npm run prisma:generate > /dev/null 2>&1

# 执行迁移
if npx prisma migrate deploy > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 数据库迁移成功${NC}"
else
    echo -e "${YELLOW}⚠ 使用 db push 同步结构...${NC}"
    if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库结构同步成功${NC}"
    else
        echo -e "${RED}✗ 数据库结构同步失败${NC}"
        exit 1
    fi
fi

# 显示表
echo "数据库表:"
mysql -u ${DB_USER} -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SHOW TABLES;" 2>/dev/null | tail -n +2
echo ""

# 步骤 6: 配置 Nginx (WebSocket)
echo -e "${YELLOW}检查 Nginx WebSocket 配置...${NC}"

NGINX_CONF="/etc/nginx/sites-available/test.ieclub.online"
if [ -f "$NGINX_CONF" ]; then
    if ! grep -q "Upgrade" "$NGINX_CONF"; then
        echo "添加 WebSocket 支持..."
        cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%Y%m%d_%H%M%S)"
        
        sed -i '/proxy_pass http:\/\/localhost:3001;/a\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;' "$NGINX_CONF"
        
        nginx -t && systemctl reload nginx
        echo -e "${GREEN}✓ Nginx 配置更新完成${NC}"
    else
        echo "Nginx WebSocket 配置已存在"
    fi
fi
echo ""

# 步骤 7: 重启后端服务
echo -e "${YELLOW}重启后端服务...${NC}"

pm2 delete ieclub-backend-staging 2>/dev/null || echo "清理旧进程..."

pm2 start src/server.js \
    --name ieclub-backend-staging \
    --env staging \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
    --error /var/log/ieclub-staging/error.log \
    --output /var/log/ieclub-staging/output.log \
    --merge-logs

pm2 save

echo -e "${GREEN}✓ 后端服务启动成功${NC}"
echo ""

# 等待服务启动
echo "等待服务就绪..."
sleep 3

# 步骤 8: 健康检查
echo -e "${YELLOW}健康检查...${NC}"

# 本地检查
LOCAL_HEALTH=$(curl -s http://localhost:3001/health || echo "{\"error\":\"failed\"}")
if echo "$LOCAL_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ 本地服务正常${NC}"
else
    echo -e "${RED}✗ 本地服务异常: ${LOCAL_HEALTH}${NC}"
fi

# HTTPS 检查
HTTPS_HEALTH=$(curl -s https://test.ieclub.online/health || echo "{\"error\":\"failed\"}")
if echo "$HTTPS_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓ HTTPS 访问正常${NC}"
else
    echo -e "${RED}✗ HTTPS 访问异常: ${HTTPS_HEALTH}${NC}"
fi

echo ""

# 完成总结
echo -e "${BLUE}"
echo "========================================="
echo "  ✓ 测试环境配置完成！"
echo "========================================="
echo -e "${NC}"

echo "环境信息:"
echo "  访问地址: https://test.ieclub.online"
echo "  后端端口: 3001"
echo "  数据库: ${DB_NAME}"
echo "  Redis DB: 1"
echo ""

echo "功能特性:"
echo "  ✅ MySQL 数据库 (独立)"
echo "  ✅ Redis 缓存 (DB 1)"
echo "  ✅ WebSocket 实时通信"
echo "  ✅ 文件上传系统"
echo "  ✅ 日志系统"
echo "  ✅ 定时任务支持"
echo "  ✅ HTTPS/SSL"
echo ""

echo "管理命令:"
echo "  pm2 logs ieclub-backend-staging  # 查看日志"
echo "  pm2 restart ieclub-backend-staging  # 重启服务"
echo "  pm2 monit                        # 实时监控"
echo ""

echo -e "${GREEN}配置成功！访问 https://test.ieclub.online${NC}"
echo ""

