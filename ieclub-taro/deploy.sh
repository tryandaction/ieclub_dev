#!/bin/bash
# ============================================
# IEClub H5 一键部署脚本 (Bash)
# ============================================

set -e

echo ""
echo "================================="
echo "  IEClub H5 一键部署工具"
echo "================================="
echo ""

# 配置
SERVER_IP="39.108.160.112"
SERVER_USER="root"
DEPLOY_PATH="/www/wwwroot/ieclub.cn"
TEMP_PATH="/tmp/h5_deploy_$(date +%Y%m%d_%H%M%S).zip"
ZIP_FILE="h5_deploy.zip"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 ieclub-taro 目录下运行此脚本"
    exit 1
fi

# 步骤 1: 清理旧的构建文件
echo "📦 [1/5] 清理旧的构建文件..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✅ 已清理 dist 目录"
fi

# 步骤 2: 构建 H5 项目
echo ""
echo "🔨 [2/5] 开始构建 H5 项目..."
npm run build:h5
echo "   ✅ 构建成功"

# 检查构建产物（支持 dist 或 dist/h5）
INDEX_PATH=""
if [ -f "dist/index.html" ]; then
    INDEX_PATH="dist"
    echo "   ✅ 找到构建产物: dist/index.html"
elif [ -f "dist/h5/index.html" ]; then
    INDEX_PATH="dist/h5"
    echo "   ✅ 找到构建产物: dist/h5/index.html"
else
    echo "   ❌ 错误: 构建产物不存在"
    echo "   已检查: dist/index.html 和 dist/h5/index.html"
    exit 1
fi

# 步骤 3: 压缩构建产物
echo ""
echo "📦 [3/5] 压缩构建产物..."
cd "$INDEX_PATH"
zip -r -q "../$ZIP_FILE" .
cd ..

if [ ! -f "$ZIP_FILE" ]; then
    echo "   ❌ 压缩失败"
    exit 1
fi

FILE_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "   ✅ 压缩成功 (大小: $FILE_SIZE)"

# 步骤 4: 上传到服务器
echo ""
echo "☁️  [4/5] 上传到服务器 $SERVER_IP ..."
scp "$ZIP_FILE" "${SERVER_USER}@${SERVER_IP}:${TEMP_PATH}"
echo "   ✅ 上传成功"

# 步骤 5: 服务器端部署
echo ""
echo "🚀 [5/5] 服务器端部署..."

ssh "${SERVER_USER}@${SERVER_IP}" << EOF
# 备份当前版本
if [ -d "$DEPLOY_PATH" ] && [ "\$(ls -A $DEPLOY_PATH 2>/dev/null)" ]; then
    BACKUP_PATH="/tmp/ieclub_backup_\$(date +%Y%m%d_%H%M%S)"
    echo "   📦 备份当前版本到: \$BACKUP_PATH"
    mkdir -p "\$BACKUP_PATH"
    cp -r $DEPLOY_PATH/* "\$BACKUP_PATH/"
fi

# 清理旧文件
echo "   🧹 清理旧文件..."
rm -rf $DEPLOY_PATH/*

# 解压新文件
echo "   📂 解压新文件..."
unzip -q -o "$TEMP_PATH" -d "$DEPLOY_PATH"

# 设置权限
echo "   🔐 设置文件权限..."
chmod -R 755 "$DEPLOY_PATH"
chown -R www:www "$DEPLOY_PATH" 2>/dev/null || chown -R nginx:nginx "$DEPLOY_PATH" 2>/dev/null || true

# 清理临时文件
rm -f "$TEMP_PATH"

echo "   ✅ 部署完成！"
EOF

# 清理本地临时文件
rm -f "$ZIP_FILE"

# 完成
echo ""
echo "================================="
echo "  ✅ 部署成功！"
echo "================================="
echo ""
echo "🌐 访问地址: http://$SERVER_IP"
echo "📁 部署路径: $DEPLOY_PATH"
echo ""

