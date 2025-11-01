#!/bin/bash

# ========================================
# IEClub 数据库恢复脚本
# ========================================
# 用法: ./restore-database.sh <backup_file>
# 示例: ./restore-database.sh backups/ieclub_backup_20251101_120000.sql.gz
# ========================================

set -e

# ========================================
# 配置
# ========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 加载环境变量
if [ -f "$PROJECT_ROOT/ieclub-backend/.env" ]; then
    source "$PROJECT_ROOT/ieclub-backend/.env"
fi

# 数据库配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${MYSQL_DATABASE:-ieclub_dev}"
DB_USER="${MYSQL_USER:-root}"
DB_PASS="${MYSQL_PASSWORD}"

# 日志配置
LOG_DIR="$PROJECT_ROOT/ieclub-backend/logs"
LOG_FILE="$LOG_DIR/restore_$(date +"%Y%m%d_%H%M%S").log"

# ========================================
# 函数定义
# ========================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# ========================================
# 参数检查
# ========================================

if [ $# -eq 0 ]; then
    echo "用法: $0 <backup_file>"
    echo "示例: $0 backups/ieclub_backup_20251101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    error_exit "备份文件不存在: $BACKUP_FILE"
fi

# ========================================
# 确认操作
# ========================================

log "========================================="
log "数据库恢复操作"
log "========================================="
log "备份文件: $BACKUP_FILE"
log "目标数据库: $DB_NAME"
log ""
log "⚠️  警告: 此操作将覆盖当前数据库的所有数据！"
log ""

read -p "确认要继续吗？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "操作已取消"
    exit 0
fi

# ========================================
# 主流程
# ========================================

mkdir -p "$LOG_DIR"

# 1. 检查必要的命令
command -v mysql >/dev/null 2>&1 || error_exit "mysql 命令未找到"

# 2. 创建当前数据库备份（安全措施）
log "正在创建当前数据库的安全备份..."
SAFETY_BACKUP="$PROJECT_ROOT/backups/safety_backup_$(date +"%Y%m%d_%H%M%S").sql.gz"
mkdir -p "$(dirname "$SAFETY_BACKUP")"
mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --single-transaction \
    "$DB_NAME" | gzip > "$SAFETY_BACKUP" || error_exit "创建安全备份失败"
log "安全备份已创建: $SAFETY_BACKUP"

# 3. 解压备份文件（如果是压缩的）
TEMP_SQL="/tmp/ieclub_restore_$$.sql"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "正在解压备份文件..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL" || error_exit "解压备份文件失败"
else
    cp "$BACKUP_FILE" "$TEMP_SQL"
fi

# 4. 恢复数据库
log "正在恢复数据库..."
mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    "$DB_NAME" < "$TEMP_SQL" || {
        log "ERROR: 数据库恢复失败"
        log "正在从安全备份恢复..."
        gunzip -c "$SAFETY_BACKUP" | mysql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --user="$DB_USER" \
            --password="$DB_PASS" \
            "$DB_NAME"
        error_exit "数据库恢复失败，已回滚到安全备份"
    }

# 5. 清理临时文件
rm -f "$TEMP_SQL"

# 6. 验证恢复
log "正在验证数据库恢复..."
TABLE_COUNT=$(mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'")

if [ "$TABLE_COUNT" -gt 0 ]; then
    log "✅ 数据库恢复成功"
    log "表数量: $TABLE_COUNT"
else
    error_exit "数据库恢复验证失败"
fi

log "========================================="
log "✅ 数据库恢复完成"
log "安全备份保存在: $SAFETY_BACKUP"
log "========================================="

exit 0

