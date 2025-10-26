#!/bin/bash
# ==========================================================
# IEClub 服务器部署脚本 (在 Linux 服务器运行) - 完整版
# ==========================================================
#
# 功能:
# 1. 拉取 Git 最新代码。
# 2. 智能更新后端服务 (自动判断是否需要 npm install)。
# 3. 部署从本地上传的前端 H5 文件。
# 4. 修复 Prisma CLI 权限问题。
#
# 使用方法:
# ./deploy-server.sh            (默认更新后端和前端)
# ./deploy-server.sh backend    (仅更新后端，跳过前端)
#
# ==========================================================

# 如果任何命令失败，脚本将立即停止执行
set -e

# --- 配置变量 ---
PROJECT_DIR="/var/www/ieclub_dev"
BACKEND_DIR="$PROJECT_DIR/ieclub-backend"
FRONTEND_TARGET_DIR="$PROJECT_DIR/ieclub-taro"
WEB_USER="www-data"

# --- 函数：打印信息 ---
log() {
    echo -e "\n\e[1m\e[32m[LOG] $1\e[0m"
}

# --- 函数：打印错误 ---
error() {
    echo -e "\n\e[1m\e[31m[ERROR] $1\e[0m"
}

# --- 函数：打印警告 ---
warn() {
    echo -e "\n\e[1m\e[33m[WARN] $1\e[0m"
}

# --- 函数：修复 Prisma CLI 权限 ---
fix_prisma_permissions() {
    PRISMA_CLI_PATH="$BACKEND_DIR/node_modules/.bin/prisma"
    if [ -f "$PRISMA_CLI_PATH" ]; then
        echo "  - 修复 Prisma CLI 执行权限..."
        chmod +x "$PRISMA_CLI_PATH"
        # 同时修复实际的 Prisma 可执行文件
        if [ -f "$BACKEND_DIR/node_modules/prisma/build/index.js" ]; then
            chmod +x "$BACKEND_DIR/node_modules/prisma/build/index.js"
        fi
        # 修复 @prisma/engines 下的二进制文件
        find "$BACKEND_DIR/node_modules/@prisma" -type f \( -name "*.node" -o -name "prisma-*" \) 2>/dev/null | while read file; do
            chmod +x "$file" 2>/dev/null || true
        done
        echo "  - ✅ Prisma CLI 权限修复完成。"
    else
        warn "未找到 Prisma CLI，可能需要先执行 npm install。"
    fi
}

# --- 脚本开始 ---
log "🚀 开始执行 IEClub 服务器部署流程..."

# --- 步骤 1: 更新后端代码 ---
log "➡️  步骤 1/4: 拉取 Git 最新代码..."
cd "$PROJECT_DIR"
# 记录拉取前的 commit ID，用于后续智能判断
OLD_HEAD=$(git rev-parse HEAD)
echo "  - 当前 commit: $(git log -1 --oneline)"
# 先暂存服务器上可能存在的意外修改
if [ -n "$(git status --porcelain)" ]; then
    echo "  - 检测到本地修改，暂存中..."
    git stash
fi
git pull origin main
# 记录拉取后的 commit ID
NEW_HEAD=$(git rev-parse HEAD)
echo "  - 更新后 commit: $(git log -1 --oneline)"
if [ "$OLD_HEAD" == "$NEW_HEAD" ]; then
    echo "  - ℹ️  代码已是最新，无需更新。"
else
    echo "  - ✅ 代码已更新。"
fi
log "✅ 代码拉取完成。"

# --- 步骤 2: 更新后端服务 ---
log "➡️  步骤 2/4: 智能更新后端服务..."
cd "$BACKEND_DIR"

# 智能判断是否需要重新安装依赖
NEED_NPM_INSTALL=false
if git diff --name-only "$OLD_HEAD" "$NEW_HEAD" -- "$BACKEND_DIR/package-lock.json" "$BACKEND_DIR/package.json" | grep -q .; then
    echo "  - 检测到依赖变更，正在执行 npm install..."
    npm install --production
    echo "  - ✅ 依赖安装完成。"
    NEED_NPM_INSTALL=true
else
    echo "  - ℹ️  未检测到依赖变更，跳过 npm install。"
fi

# 无论是否重新安装，都修复 Prisma CLI 权限（因为 git pull 会重置权限）
fix_prisma_permissions

# 智能判断是否需要重新生成 Prisma Client
if git diff --name-only "$OLD_HEAD" "$NEW_HEAD" -- "$BACKEND_DIR/prisma/schema.prisma" | grep -q . || [ "$NEED_NPM_INSTALL" = true ]; then
    echo "  - 检测到 schema.prisma 变更或依赖更新，正在执行 prisma generate..."
    npx prisma generate
    echo "  - ✅ Prisma Client 生成完毕。"
    # 生成后再次修复权限
    fix_prisma_permissions
fi

echo "  - 应用数据库迁移..."
npx prisma migrate deploy

echo "  - 平滑重启 PM2 服务..."
pm2 reload ieclub-api
log "✅ 后端服务更新完成。"

# --- 步骤 3: 部署前端文件 ---
# 默认部署前端，除非明确传入 "backend" 参数
if [ "$1" == "backend" ]; then
    log "↪️  步骤 3/4: 跳过前端部署（仅后端模式）。"
else
    log "➡️  步骤 3/4: 部署前端 H5 文件..."
    
    # 检查前端压缩包是否存在
    if [ ! -f /tmp/dist.zip ]; then
        error "在 /tmp 目录下未找到 dist.zip 文件！"
        echo "  - 请先从本地运行 deploy-local.ps1 上传前端文件。"
        echo "  - 或者使用 './deploy-server.sh backend' 仅更新后端。"
        exit 1
    fi

    # 检查压缩包完整性
    echo "  - 检查 dist.zip 完整性..."
    if ! unzip -t /tmp/dist.zip > /dev/null 2>&1; then
        error "dist.zip 文件已损坏，请重新上传！"
        rm -f /tmp/dist.zip
        exit 1
    fi
    echo "  - ✅ 压缩包完整性验证通过。"

    # 显示压缩包信息
    echo "  - 压缩包大小: $(du -h /tmp/dist.zip | cut -f1)"
    echo "  - 上传时间: $(stat -c %y /tmp/dist.zip | cut -d. -f1)"

    # 清理旧的解压产物
    cd /tmp
    if [ -d dist ]; then
        echo "  - 清理旧的解压文件..."
        rm -rf dist
    fi

    # 解压
    echo "  - 正在解压 dist.zip..."
    unzip -o dist.zip > /dev/null
    
    # 验证解压结果
    if [ ! -d /tmp/dist ]; then
        error "解压失败，未找到 dist 目录！"
        exit 1
    fi
    echo "  - ✅ 解压完成。"

    # 显示解压后的文件结构（前5个文件）
    echo "  - 前端文件预览:"
    ls -lh /tmp/dist | head -6

    # 备份旧的前端文件（可选）
    if [ -d "$FRONTEND_TARGET_DIR/dist" ]; then
        BACKUP_DIR="$FRONTEND_TARGET_DIR/dist.backup.$(date +%Y%m%d_%H%M%S)"
        echo "  - 备份旧的前端文件到: $BACKUP_DIR"
        mv "$FRONTEND_TARGET_DIR/dist" "$BACKUP_DIR"
        # 只保留最近3个备份
        cd "$FRONTEND_TARGET_DIR"
        ls -dt dist.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
    fi

    # 部署新的前端文件
    echo "  - 部署新的前端文件..."
    mv /tmp/dist "$FRONTEND_TARGET_DIR/"
    
    # 验证部署结果
    if [ ! -d "$FRONTEND_TARGET_DIR/dist" ]; then
        error "前端部署失败，目标目录不存在！"
        exit 1
    fi
    echo "  - ✅ 前端文件已部署到: $FRONTEND_TARGET_DIR/dist"

    # 清理临时文件
    echo "  - 清理临时文件..."
    rm -f /tmp/dist.zip

    # 重启 Nginx
    echo "  - 重启 Nginx..."
    if systemctl restart nginx; then
        echo "  - ✅ Nginx 重启成功。"
    else
        error "Nginx 重启失败，请检查配置！"
        systemctl status nginx
        exit 1
    fi
    
    # 验证 Nginx 状态
    if systemctl is-active --quiet nginx; then
        echo "  - ✅ Nginx 运行正常。"
    else
        error "Nginx 未运行，请检查日志！"
        exit 1
    fi

    log "✅ 前端部署完成。"
fi

# --- 步骤 4: 最终化处理 ---
log "➡️  步骤 4/4: 修复项目文件权限..."
chown -R "$WEB_USER":"$WEB_USER" "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"
# 再次确保 Prisma CLI 权限正确（防止被 chmod -R 覆盖）
fix_prisma_permissions
log "✅ 权限修复完成。"

# --- 结束 ---
echo ""
log "🎉🎉🎉 IEClub 服务器部署成功！"
echo ""
echo "--- 部署摘要 ---"
echo "📦 后端服务:"
pm2 status ieclub-api
echo ""
echo "🌐 Nginx 状态:"
systemctl status nginx --no-pager -l | head -5
echo ""
echo "📁 前端文件:"
if [ -d "$FRONTEND_TARGET_DIR/dist" ]; then
    echo "  - 路径: $FRONTEND_TARGET_DIR/dist"
    echo "  - 大小: $(du -sh $FRONTEND_TARGET_DIR/dist | cut -f1)"
    echo "  - 文件数: $(find $FRONTEND_TARGET_DIR/dist -type f | wc -l)"
else
    echo "  - ⚠️  未部署前端文件"
fi

