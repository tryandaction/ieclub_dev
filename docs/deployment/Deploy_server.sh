#!/bin/bash
# ==========================================================
# IEClub 服务器端部署脚本 v3.0
# ==========================================================
#
# 功能: 在服务器上部署网页、小程序、后端
#
# 使用方法:
#   ./Deploy_server.sh all      # 部署网页和后端
#   ./Deploy_server.sh web      # 仅部署网页
#   ./Deploy_server.sh backend  # 仅部署后端
#
# v3.0 更新 (2025-10-29):
#   - 支持 React 网页版部署
#   - 优化部署流程
#   - 统一错误处理
# ==========================================================

set -e  # 遇到错误立即退出

# --- 配置 ---
PROJECT_ROOT="/root/IEclub_dev"
WEB_DIR="${PROJECT_ROOT}/ieclub-web"
FRONTEND_DIR="${PROJECT_ROOT}/ieclub-frontend"
BACKEND_DIR="${PROJECT_ROOT}/ieclub-backend"
WEB_TEMP_ZIP="/tmp/web-dist.zip"
WEB_TEMP_EXTRACT="/tmp/web-dist"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- 部署网页版 ---
deploy_web() {
    log_info "========== 开始部署网页版 =========="
    
    # 检查是否有上传的压缩包
    if [ -f "${WEB_TEMP_ZIP}" ]; then
        log_info "发现上传的网页压缩包，使用上传的文件..."
        
        # 清理并创建解压目录
        rm -rf "${WEB_TEMP_EXTRACT}"
        mkdir -p "${WEB_TEMP_EXTRACT}"
        
        # 解压
        cd /tmp
        unzip -qq -o "${WEB_TEMP_ZIP}" -d "${WEB_TEMP_EXTRACT}" 2>&1 | grep -v "appears to use backslashes" || true
        
        # 验证解压结果
        if [ ! -d "${WEB_TEMP_EXTRACT}" ] || [ -z "$(ls -A ${WEB_TEMP_EXTRACT})" ]; then
            log_error "解压失败或压缩包为空"
            exit 1
        fi
        
        # 同步到网页目录（Nginx root 目录）
        log_info "同步网页文件到 ${WEB_DIR}/dist ..."
        rm -rf "${WEB_DIR}/dist"
        mkdir -p "${WEB_DIR}/dist"
        cp -r "${WEB_TEMP_EXTRACT}/"* "${WEB_DIR}/dist/"
        
        # 设置文件权限
        chmod -R 755 "${WEB_DIR}/dist"
        
        # 验证部署
        if [ -f "${WEB_DIR}/dist/index.html" ]; then
            log_success "✅ index.html 已成功部署到 ${WEB_DIR}/dist"
        else
            log_error "❌ index.html 未找到！部署可能失败"
            exit 1
        fi
        
        # 更新 Nginx 配置（如果提供）
        if [ -f "/tmp/ieclub-nginx.conf" ]; then
            log_info "更新 Nginx 配置..."
            cp /tmp/ieclub-nginx.conf /etc/nginx/sites-available/ieclub
            rm -f /tmp/ieclub-nginx.conf
        fi
        
        # 清理临时文件
        rm -rf "${WEB_TEMP_EXTRACT}"
        rm -f "${WEB_TEMP_ZIP}"
        
        log_success "网页部署完成（使用上传的文件）"
    else
        log_info "未发现上传的压缩包，从源码构建..."
        
        cd "${WEB_DIR}"
        
        # 安装依赖
        if [ ! -d "node_modules" ]; then
            log_info "安装网页依赖..."
            npm install
        fi
        
        # 构建
        log_info "构建网页版..."
        npm run build
        
        if [ ! -d "dist" ]; then
            log_error "构建失败 - dist 目录不存在"
            exit 1
        fi
        
        log_success "网页构建完成（从源码）"
    fi
    
    # 测试并重启 Nginx
    log_info "测试 Nginx 配置..."
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        log_success "✅ Nginx 重启成功"
        
        # 清除浏览器缓存提示
        log_info "================================================"
        log_success "🎉 网页已成功部署到服务器！"
        log_info "访问地址: https://ieclub.online"
        log_info "如果看不到更新，请按 Ctrl+F5 强制刷新浏览器缓存"
        log_info "================================================"
    else
        log_error "Nginx 配置测试失败"
        nginx -t
        exit 1
    fi
}

# --- 部署后端 ---
deploy_backend() {
    log_info "========== 开始部署后端 =========="
    
    cd "${BACKEND_DIR}"
    
    # 检查是否有上传的代码包
    if [ -f "/tmp/backend-code.zip" ]; then
        log_info "发现上传的后端代码包，解压部署..."
        unzip -o /tmp/backend-code.zip -d "${BACKEND_DIR}"
        rm -f /tmp/backend-code.zip
        log_success "代码包解压完成"
    fi
    
    # 如果是Git仓库，拉取最新代码（作为备用）
    if [ -d ".git" ] && [ ! -f "/tmp/backend-code.zip" ]; then
        log_info "拉取最新代码（从 main 分支）..."
        
        # 确保在 main 分支上
        CURRENT_BRANCH=$(git branch --show-current)
        if [ "$CURRENT_BRANCH" != "main" ]; then
            log_info "当前分支: $CURRENT_BRANCH，切换到 main 分支..."
            git checkout main || log_warning "切换到 main 分支失败"
        fi
        
        # 拉取最新代码
        git pull origin main || log_warning "Git pull 失败，跳过"
        log_success "已拉取 main 分支最新代码"
    fi
    
    # 检查必需文件
    log_info "检查必需配置文件..."
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在！请创建环境配置文件"
        exit 1
    fi
    
    if [ ! -f "src/config/database.js" ]; then
        log_error "src/config/database.js 不存在！路由将无法加载"
        exit 1
    fi
    
    # 检查Node版本
    log_info "检查Node版本..."
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_warning "Node版本过低 ($NODE_VERSION)，建议使用 v18 或更高版本"
    fi
    log_info "当前Node版本: $(node --version)"
    
    # 清理旧的node_modules（可选，避免依赖冲突）
    # rm -rf node_modules package-lock.json
    
    # 安装依赖
    log_info "安装后端依赖..."
    npm install --production=false
    
    # 验证关键依赖
    log_info "验证关键依赖..."
    MISSING_DEPS=""
    CRITICAL_DEPS=("@prisma/client" "express" "ioredis" "date-fns" "jsonwebtoken" "express-validator" "express-rate-limit" "winston")
    
    for pkg in "${CRITICAL_DEPS[@]}"; do
        if ! npm list "$pkg" &>/dev/null; then
            MISSING_DEPS="$MISSING_DEPS $pkg"
            log_warning "缺少依赖: $pkg"
        fi
    done
    
    if [ -n "$MISSING_DEPS" ]; then
        log_error "缺少关键依赖:$MISSING_DEPS"
        log_info "尝试重新安装所有依赖..."
        rm -rf node_modules package-lock.json
        npm install
        
        # 再次验证
        log_info "再次验证依赖..."
        for pkg in "${CRITICAL_DEPS[@]}"; do
            if npm list "$pkg" &>/dev/null; then
                log_success "✅ $pkg 已安装"
            else
                log_error "❌ $pkg 仍然缺失！"
            fi
        done
    else
        log_success "✅ 所有关键依赖已安装"
    fi
    
    # Prisma 生成客户端
    log_info "生成Prisma客户端..."
    npx prisma generate
    
    # 数据库迁移
    log_info "执行数据库迁移..."
    npx prisma migrate deploy || log_warning "数据库迁移失败，请手动检查"
    
    # 检查Redis连接（非阻塞）
    log_info "检查Redis连接..."
    REDIS_HOST=$(grep "^REDIS_HOST=" .env | cut -d'=' -f2 2>/dev/null || echo "localhost")
    REDIS_PORT=$(grep "^REDIS_PORT=" .env | cut -d'=' -f2 2>/dev/null || echo "6379")
    REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" .env | cut -d'=' -f2 2>/dev/null || echo "")
    
    if command -v redis-cli &> /dev/null; then
        if [ -n "$REDIS_PASSWORD" ]; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
                log_success "✅ Redis连接正常"
            else
                log_warning "⚠️  Redis连接失败，服务可能需要重启"
            fi
        else
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -q "PONG"; then
                log_success "✅ Redis连接正常"
            else
                log_warning "⚠️  Redis连接失败，服务可能需要重启"
            fi
        fi
    else
        log_warning "未安装redis-cli，跳过Redis检查"
    fi
    
    # 重启后端服务（使用正确的Node版本）
    log_info "重启后端服务..."
    if command -v pm2 &> /dev/null; then
        # 确保使用正确的Node路径
        NODE_PATH=$(which node)
        log_info "使用Node路径: $NODE_PATH"
        
        # 停止旧进程
        if pm2 describe ieclub-backend > /dev/null 2>&1; then
            pm2 delete ieclub-backend
            log_info "已停止旧进程"
        fi
        
        # 启动新进程
        pm2 start src/server.js --name ieclub-backend --node-args="--max-old-space-size=2048"
        pm2 save
        
        # 等待启动
        sleep 3
        
        # 检查进程状态
        if pm2 describe ieclub-backend | grep -q "online"; then
            log_success "✅ 后端服务启动成功（PM2）"
        else
            log_warning "⚠️  后端服务可能未正常启动，查看日志:"
            pm2 logs ieclub-backend --lines 20 --nostream || true
        fi
        
        # API健康检查
        log_info "执行API健康检查..."
        sleep 2
        
        if curl -sf http://127.0.0.1:3000/health > /dev/null 2>&1; then
            log_success "✅ API健康检查通过"
            log_info "API响应: $(curl -s http://127.0.0.1:3000/health)"
        else
            log_warning "⚠️  API健康检查失败，检查日志:"
            pm2 logs ieclub-backend --lines 30 --nostream
        fi
        
    else
        log_warning "未找到 PM2，请手动重启后端服务"
    fi
    
    log_success "========== 后端部署完成 =========="
}

# --- 主函数 ---
main() {
    local target="${1:-all}"
    
    log_info "================================================"
    log_info "  IEClub 服务器部署脚本"
    log_info "  目标: ${target}"
    log_info "================================================"
    
    case "${target}" in
        web)
            deploy_web
            ;;
        backend)
            deploy_backend
            ;;
        all)
            deploy_web
            deploy_backend
            ;;
        *)
            log_error "未知的部署目标: ${target}"
            log_info "用法: $0 {web|backend|all}"
            exit 1
            ;;
    esac
    
    log_success "================================================"
    log_success "  部署完成！"
    log_success "================================================"
}

# 执行主函数
main "$@"
