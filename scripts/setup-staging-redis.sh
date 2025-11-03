#!/bin/bash
# 测试环境 Redis 安装和配置脚本

set -e  # 遇到错误立即退出

echo "============================================"
echo "IEClub 测试环境 Redis 安装配置"
echo "============================================"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo "❌ 请使用 root 用户运行此脚本"
  echo "   sudo bash setup-staging-redis.sh"
  exit 1
fi

echo "📦 步骤 1/5: 更新系统包"
apt update

echo ""
echo "📦 步骤 2/5: 安装 Redis"
# 检查 Redis 是否已安装
if command -v redis-server &> /dev/null; then
    echo "✅ Redis 已安装"
    redis-server --version
else
    echo "正在安装 Redis..."
    apt install -y redis-server
    echo "✅ Redis 安装完成"
fi

echo ""
echo "⚙️  步骤 3/5: 配置 Redis"

# 备份原配置文件
if [ -f /etc/redis/redis.conf ]; then
    cp /etc/redis/redis.conf /etc/redis/redis.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 已备份原配置文件"
fi

# 配置 Redis
cat > /etc/redis/redis.conf <<'EOF'
# Redis 配置文件 - IEClub 测试环境
# 生成时间: $(date)

# 网络配置
bind 127.0.0.1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# 通用配置
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# 持久化配置
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# 复制配置
replica-serve-stale-data yes
replica-read-only yes

# 安全配置
# requirepass your_redis_password_here

# 内存管理
maxmemory 256mb
maxmemory-policy allkeys-lru

# AOF 持久化
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 慢查询日志
slowlog-log-slower-than 10000
slowlog-max-len 128

# 客户端输出缓冲区
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
EOF

echo "✅ Redis 配置完成"

echo ""
echo "🔧 步骤 4/5: 启动 Redis 服务"
systemctl enable redis-server
systemctl restart redis-server
sleep 2

echo ""
echo "✅ 步骤 5/5: 验证 Redis 状态"
if systemctl is-active --quiet redis-server; then
    echo "✅ Redis 服务运行正常"
    redis-cli ping
    echo ""
    echo "Redis 信息:"
    redis-cli info server | grep redis_version
    redis-cli info memory | grep used_memory_human
else
    echo "❌ Redis 服务启动失败"
    systemctl status redis-server
    exit 1
fi

echo ""
echo "============================================"
echo "✅ Redis 安装配置完成！"
echo "============================================"
echo ""
echo "📝 Redis 配置信息:"
echo "   主机: localhost"
echo "   端口: 6379"
echo "   密码: 未设置（仅本地访问）"
echo "   最大内存: 256MB"
echo "   持久化: RDB + AOF"
echo ""
echo "🔧 常用命令:"
echo "   查看状态: systemctl status redis-server"
echo "   重启服务: systemctl restart redis-server"
echo "   查看日志: tail -f /var/log/redis/redis-server.log"
echo "   连接 Redis: redis-cli"
echo "   测试连接: redis-cli ping"
echo ""
echo "⚠️  注意事项:"
echo "   1. Redis 仅监听本地连接 (127.0.0.1)"
echo "   2. 最大内存设置为 256MB，超出后自动清理旧数据"
echo "   3. 已启用 RDB 和 AOF 双重持久化"
echo "   4. 如需设置密码，请编辑 /etc/redis/redis.conf"
echo ""

