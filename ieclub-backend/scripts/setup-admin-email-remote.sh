#!/bin/bash
# 在服务器上设置管理员邮箱的脚本
# 使用方法: bash scripts/setup-admin-email-remote.sh

set -e

echo ""
echo "🔧 设置管理员邮箱脚本（服务器版）"
echo "============================================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 ieclub-backend 目录下运行此脚本"
    exit 1
fi

# 检查环境
ENV_FILE=".env.staging"
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  警告: 未找到 .env.staging 文件，尝试使用 .env"
    ENV_FILE=".env"
    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ 错误: 未找到环境配置文件"
        exit 1
    fi
fi

echo "📋 使用环境配置: $ENV_FILE"
echo ""

# 1. 检查并运行数据库迁移
echo "1️⃣  检查数据库迁移状态..."
echo ""

# 检查 EmailWhitelist 表是否存在
echo "   检查 EmailWhitelist 表..."
if npx prisma db execute --stdin <<< "SHOW TABLES LIKE 'email_whitelist';" 2>/dev/null | grep -q "email_whitelist"; then
    echo "   ✅ EmailWhitelist 表已存在"
else
    echo "   ⚠️  EmailWhitelist 表不存在，运行数据库迁移..."
    npx prisma db push --accept-data-loss || {
        echo "   ❌ 数据库迁移失败"
        echo "   请手动运行: npx prisma db push"
        exit 1
    }
    echo "   ✅ 数据库迁移完成"
fi

echo ""

# 2. 运行设置脚本
echo "2️⃣  运行管理员设置脚本..."
echo ""

node scripts/setup-admin-email.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✅ 设置完成！"
    echo "============================================================"
    echo ""
    echo "📋 下一步:"
    echo "   1. 访问管理后台: https://test.ieclub.online/admin"
    echo "   2. 使用邮箱 12310203@mail.sustech.edu.cn 登录"
    echo "   3. 如果是新创建的管理员，默认密码为: Admin@123456"
    echo "   4. 请尽快修改密码！"
    echo ""
else
    echo ""
    echo "❌ 设置失败，请检查错误信息"
    exit $EXIT_CODE
fi

