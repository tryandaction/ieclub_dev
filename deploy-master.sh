#!/bin/bash
# ==========================================================
# IEClub 部署主脚本 - 服务器端 (v2.0)
# ==========================================================
#
# 功能: 在服务器上部署前端和后端
#
# 使用方法:
#   ./deploy-master.sh all       # 部署前端和后端
#   ./deploy-master.sh frontend  # 仅部署前端
#   ./deploy-master.sh backend   # 仅部署后端
#
# v2.0 更新 (2025-10-26):
#   - 使用 Git 拉取最新代码
#   - 简化部署流程
#   - 支持前端/后端独立部署
# ==========================================================

set -e  # 遇到错误立即退出

# --- 配置 ---
PROJECT_ROOT="/root/IEclub_dev"
FRONTEND_DIR="${PROJECT_ROOT}/ieclub-taro"
BACKEND_DIR="${PROJECT_ROOT}/ieclub-backend"
TEMP_ZIP="/tmp/dist.zip"
TEMP_EXTRACT="/tmp/dist"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- 函数定义 ---

# 部署前端
deploy_frontend() {
    log_info "========== 开始部署前端 =========="
    
    # 检查是否有上传的压缩包
    if [ -f "${TEMP_ZIP}" ]; then
        log_info "发现上传的前端压缩包，使用上传的文件..."
        
        # 清理旧的解压目录
        rm -rf "${TEMP_EXTRACT}"
        mkdir -p "${TEMP_EXTRACT}"
        
        # 解压（-qq 静默模式，忽略路径分隔符警告）
        cd /tmp
        unzip -qq -o "${TEMP_ZIP}" -d "${TEMP_EXTRACT}" 2>/dev/null || unzip -o "${TEMP_ZIP}" -d "${TEMP_EXTRACT}" > /dev/null
        
        # 验证解压结果
        if [ ! -d "${TEMP_EXTRACT}" ] || [ -z "$(ls -A ${TEMP_EXTRACT})" ]; then
            log_error "解压失败或压缩包为空！"
            exit 1
        fi
        
        # 同步到 Nginx 目录
        log_info "同步前端文件到 Nginx 目录..."
        rm -rf "${FRONTEND_DIR}/dist"
        mkdir -p "${FRONTEND_DIR}/dist"
        
        # 直接复制解压出来的所有文件（因为我们压缩的是 dist/* 的内容）
        cp -r "${TEMP_EXTRACT}/"* "${FRONTEND_DIR}/dist/"
        
        # 清理临时文件
        rm -rf "${TEMP_EXTRACT}"
        rm -f "${TEMP_ZIP}"
        
        log_success "前端部署完成（使用上传的文件）。"
    else
        log_info "未发现上传的压缩包，从 Git 仓库构建..."
        
        # 确保在前端目录
        cd "${FRONTEND_DIR}"
        
        # 安装依赖（如果需要）
        if [ ! -d "node_modules" ]; then
            log_info "安装前端依赖..."
            npm install
        fi
        
        # 构建前端
        log_info "构建前端 H5..."
        npm run build:h5
        
        log_success "前端部署完成（从源码构建）。"
    fi
    
    # 重启 Nginx
    log_info "重启 Nginx..."
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        log_success "Nginx 已重启。"
    else
        log_error "Nginx 配置测试失败，跳过重启。请检查 SSL 证书配置。"
        log_info "提示: 如果没有 SSL 证书，请使用 HTTP-only 配置或生成自签名证书。"
    fi
    
    log_success "========== 前端部署完成 =========="
}

# 部署后端
deploy_backend() {
    log_info "========== 开始部署后端 =========="
    
    cd "${BACKEND_DIR}"
    
    # 检查 .env 文件是否存在（必须手动上传）
    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在！请先手动上传 .env 文件到服务器"
        log_error "使用命令: scp ieclub-backend/.env root@39.108.160.112:/root/ieclub/ieclub-backend/.env"
        exit 1
    else
        log_success ".env 文件已存在，继续部署。"
    fi
    
    # 安装依赖
    log_info "安装后端依赖..."
    npm install --production
    
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

log_info "🚀 IEClub 部署脚本启动 (模式: ${MODE})"

case "${MODE}" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_frontend
        deploy_backend
        ;;
    *)
        log_error "无效的参数！"
        echo "使用方法:"
        echo "  $0 all       # 部署前端和后端"
        echo "  $0 frontend  # 仅部署前端"
        echo "  $0 backend   # 仅部署后端"
        exit 1
        ;;
esac

log_success "🎉 部署完成！"
log_info "访问: https://ieclub.online"

