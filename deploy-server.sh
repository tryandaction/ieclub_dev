#!/bin/bash
# ==========================================================
# IEClub 服务器端部署脚本 v3.0
# ==========================================================
#
# 功能: 在服务器上部署网页、小程序、后端
#
# 使用方法:
#   ./deploy-server.sh all      # 部署网页和后端
#   ./deploy-server.sh web      # 仅部署网页
#   ./deploy-server.sh backend  # 仅部署后端
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
            log_error "解压失败或压缩包为空！"
            exit 1
        fi
        
        # 同步到网页目录
        log_info "同步网页文件..."
        rm -rf "${WEB_DIR}/dist"
        mkdir -p "${WEB_DIR}/dist"
        cp -r "${WEB_TEMP_EXTRACT}/"* "${WEB_DIR}/dist/"
        
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
        log_info "构建网页..."
        npm run build
        
        log_success "网页部署完成（从源码构建）"
    fi
    
    # 配置 Nginx
    log_info "配置 Nginx..."
    
    # 使用新的 Nginx 配置
    if [ -f "${PROJECT_ROOT}/nginx-dual-platform.conf" ]; then
        log_info "使用双平台 Nginx 配置..."
        cp "${PROJECT_ROOT}/nginx-dual-platform.conf" /etc/nginx/sites-available/ieclub
    elif [ -f "${PROJECT_ROOT}/nginx-http-only.conf" ]; then
        log_info "使用 HTTP-only 配置..."
        cp "${PROJECT_ROOT}/nginx-http-only.conf" /etc/nginx/sites-available/ieclub
    fi
    
    # 创建软链接
    ln -sf /etc/nginx/sites-available/ieclub /etc/nginx/sites-enabled/ieclub
    
    # 测试并重启 Nginx
    log_info "测试 Nginx 配置..."
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        log_success "Nginx 重启成功"
    else
        log_error "Nginx 配置测试失败"
        nginx -t
        exit 1
    fi
    
    log_success "========== 网页部署完成 =========="
}

# --- 部署后端 ---
deploy_backend() {
    log_info "========== 开始部署后端 =========="
    
    cd "${BACKEND_DIR}"
    
    # 检查 .env 文件
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在！"
        log_error "请先上传 .env 文件到: ${BACKEND_DIR}/.env"
        exit 1
    fi
    
    log_success ".env 文件已存在"
    
    # 安装依赖
    log_info "安装后端依赖..."
    npm install --production
    
    # 检查是否缺少 date-fns
    if ! npm list date-fns > /dev/null 2>&1; then
        log_info "安装缺失的依赖 date-fns..."
        npm install date-fns
    fi
    
    # Prisma 迁移
    log_info "执行数据库迁移..."
    npx prisma generate
    
    # 重启 PM2
    log_info "重启后端服务..."
    if pm2 describe ieclub-backend > /dev/null 2>&1; then
        pm2 restart ieclub-backend
    else
        log_info "首次启动后端服务..."
        pm2 start src/server.js --name ieclub-backend
    fi
    
    pm2 save
    
    log_success "========== 后端部署完成 =========="
}

# --- 主流程 ---

MODE="${1:-all}"

log_info "🚀 IEClub 服务器端部署开始 (模式: ${MODE})"

case "${MODE}" in
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
        log_error "无效的参数！"
        echo "使用方法:"
        echo "  $0 all      # 部署网页和后端"
        echo "  $0 web      # 仅部署网页"
        echo "  $0 backend  # 仅部署后端"
        exit 1
        ;;
esac

log_success "🎉 部署完成！"
log_info "网页访问: https://ieclub.online"
log_info "API 地址: https://ieclub.online/api"

