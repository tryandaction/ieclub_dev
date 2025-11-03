#!/bin/bash
# 测试环境数据库完整配置脚本

set -e

echo "========================================="
echo "IEClub 测试环境数据库配置"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 数据库配置
DB_USER="ieclub_staging"
DB_PASSWORD=$(openssl rand -base64 20 | tr -d '/+=' | head -c 20)
DB_NAME="ieclub_staging"
DB_ROOT_PASSWORD=""

echo -e "${YELLOW}请输入 MySQL root 密码:${NC}"
read -s DB_ROOT_PASSWORD
echo ""

# 1. 创建数据库和用户
echo -e "${YELLOW}步骤 1/5: 创建数据库和用户...${NC}"

mysql -u root -p"$DB_ROOT_PASSWORD" <<MYSQL_SCRIPT
-- 删除旧的测试数据库和用户（如果存在）
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';
DROP USER IF EXISTS '${DB_USER}'@'%';

-- 创建新数据库
CREATE DATABASE ${DB_NAME} 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASSWORD}';

-- 授予权限
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示结果
SELECT user, host FROM mysql.user WHERE user = '${DB_USER}';
SHOW DATABASES LIKE '${DB_NAME}';
MYSQL_SCRIPT

echo -e "${GREEN}✓ 数据库和用户创建成功${NC}"
echo ""

# 2. 更新 .env.staging 文件
echo -e "${YELLOW}步骤 2/5: 更新环境配置文件...${NC}"

ENV_FILE="/var/www/ieclub-backend-staging/.env.staging"
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/${DB_NAME}"

# 备份现有配置
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
fi

# 更新 DATABASE_URL
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$ENV_FILE"
else
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> "$ENV_FILE"
fi

echo -e "${GREEN}✓ 环境配置文件更新成功${NC}"
echo ""

# 3. 安装依赖（如果需要）
echo -e "${YELLOW}步骤 3/5: 检查依赖...${NC}"
cd /var/www/ieclub-backend-staging

if [ ! -d "node_modules" ]; then
    echo "安装 Node.js 依赖..."
    npm install --production
else
    echo "依赖已存在，跳过安装"
fi

# 确保 Prisma 客户端已生成
npm run prisma:generate
echo -e "${GREEN}✓ 依赖检查完成${NC}"
echo ""

# 4. 迁移数据库结构
echo -e "${YELLOW}步骤 4/5: 迁移数据库结构...${NC}"

# 检查 prisma 目录
if [ ! -d "prisma" ]; then
    echo -e "${RED}✗ Prisma 配置目录不存在${NC}"
    exit 1
fi

# 执行数据库迁移
if npx prisma migrate deploy; then
    echo -e "${GREEN}✓ 数据库结构迁移成功${NC}"
else
    echo -e "${YELLOW}⚠ 迁移可能有问题，尝试重置...${NC}"
    npx prisma db push --force-reset
fi

echo ""

# 5. 初始化测试数据（可选）
echo -e "${YELLOW}步骤 5/5: 初始化测试数据（可选）...${NC}"
echo "是否要初始化测试数据？(y/n)"
read -r INIT_DATA

if [ "$INIT_DATA" = "y" ] || [ "$INIT_DATA" = "Y" ]; then
    if [ -f "scripts/seed.js" ]; then
        node scripts/seed.js
        echo -e "${GREEN}✓ 测试数据初始化成功${NC}"
    else
        echo -e "${YELLOW}⚠ 未找到种子数据脚本${NC}"
    fi
else
    echo "跳过测试数据初始化"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ 测试环境数据库配置完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "数据库信息："
echo "  数据库名: ${DB_NAME}"
echo "  用户名: ${DB_USER}"
echo "  密码: ${DB_PASSWORD}"
echo ""
echo "连接字符串已保存到: $ENV_FILE"
echo ""
echo "验证数据库连接："
mysql -u ${DB_USER} -p"${DB_PASSWORD}" -e "USE ${DB_NAME}; SHOW TABLES;" 2>/dev/null
echo ""
echo -e "${YELLOW}请保存数据库凭据！${NC}"
echo ""

