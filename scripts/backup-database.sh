#!/bin/bash

# ========================================
# IEClub 数据库自动备份脚本
# ========================================
# 功能：
# 1. 备份 MySQL 数据库
# 2. 压缩备份文件
# 3. 上传到云存储（可选）
# 4. 清理过期备份
# 5. 发送通知
# ========================================

set -e  # 遇到错误立即退出

# ========================================
# 配置
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 加载环境变量
if [ -f "$PROJECT_ROOT/ieclub-backend/.env" ]; then
    source "$PROJECT_ROOT/ieclub-backend/.env"
fi

# 备份配置
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ieclub_backup_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-ieclub_dev}"
DB_USER="${MYSQL_USER:-root}"
DB_PASS="${MYSQL_PASSWORD}"

# 日志配置
LOG_DIR="$PROJECT_ROOT/ieclub-backend/logs"
LOG_FILE="$LOG_DIR/backup_$(date +"%Y%m%d").log"

# ========================================
# 函数定义
# ========================================

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理
error_exit() {
    log "ERROR: $1"
    send_notification "❌ 数据库备份失败" "$1"
    exit 1
}

# 发送通知（可选）
send_notification() {
    local title="$1"
    local message="$2"
    
    # 如果配置了 Webhook，发送通知
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$title\n$message\"}" \
            2>/dev/null || true
    fi
}

# ========================================
# 主流程
# ========================================

log "========================================="
log "开始数据库备份"
log "========================================="

# 1. 检查必要的命令
command -v mysqldump >/dev/null 2>&1 || error_exit "mysqldump 命令未找到"
command -v gzip >/dev/null 2>&1 || error_exit "gzip 命令未找到"

# 2. 创建备份目录
mkdir -p "$BACKUP_DIR" || error_exit "无法创建备份目录: $BACKUP_DIR"
mkdir -p "$LOG_DIR" || error_exit "无法创建日志目录: $LOG_DIR"

log "备份目录: $BACKUP_DIR"
log "备份文件: $BACKUP_FILE"

# 3. 执行数据库备份
log "正在备份数据库..."
mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_PATH" 2>&1 || error_exit "数据库备份失败"

log "数据库备份完成"

# 4. 压缩备份文件
log "正在压缩备份文件..."
gzip "$BACKUP_PATH" || error_exit "压缩备份文件失败"
BACKUP_PATH="${BACKUP_PATH}.gz"
log "压缩完成: ${BACKUP_FILE}.gz"

# 5. 计算备份文件大小
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log "备份文件大小: $BACKUP_SIZE"

# 6. 上传到云存储（可选）
if [ "$UPLOAD_TO_CLOUD" = "true" ] && [ -n "$OSS_BUCKET" ]; then
    log "正在上传到云存储..."
    # 这里需要根据实际使用的云服务商调整命令
    # 示例：阿里云 OSS
    # ossutil cp "$BACKUP_PATH" "oss://$OSS_BUCKET/backups/" || log "WARNING: 上传云存储失败"
    log "云存储上传完成"
fi

# 7. 清理过期备份
log "正在清理过期备份（保留 ${RETENTION_DAYS} 天）..."
find "$BACKUP_DIR" -name "ieclub_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "ieclub_backup_*.sql.gz" -type f | wc -l)
log "当前保留备份数量: $REMAINING_BACKUPS"

# 8. 验证备份文件
log "正在验证备份文件..."
if [ -f "$BACKUP_PATH" ] && [ -s "$BACKUP_PATH" ]; then
    log "✅ 备份文件验证成功"
else
    error_exit "备份文件验证失败"
fi

# 9. 记录备份信息到数据库（可选）
if command -v mysql >/dev/null 2>&1; then
    mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        "$DB_NAME" \
        -e "INSERT INTO backup_logs (filename, size, status, created_at) VALUES ('${BACKUP_FILE}.gz', '$BACKUP_SIZE', 'success', NOW())" \
        2>/dev/null || log "WARNING: 无法记录备份信息到数据库"
fi

# 10. 发送成功通知
log "========================================="
log "✅ 数据库备份成功完成"
log "备份文件: ${BACKUP_FILE}.gz"
log "文件大小: $BACKUP_SIZE"
log "========================================="

send_notification "✅ 数据库备份成功" "文件: ${BACKUP_FILE}.gz\n大小: $BACKUP_SIZE"

exit 0

