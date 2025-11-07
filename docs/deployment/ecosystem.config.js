// ================================================================
// IEClub 生产环境 PM2 配置文件
// ================================================================
//
// 用途: 配置生产环境后端服务的 PM2 进程管理
// 环境: Production (生产环境)
// 端口: 3000
// 数据库: ieclub_production
//
// 使用方法:
//   pm2 start ecosystem.config.js
//   pm2 restart ieclub-backend
//   pm2 logs ieclub-backend
//
// 更新日期: 2025-11-06
// ================================================================

module.exports = {
  apps: [{
    name: 'ieclub-backend',
    
    // ✅ 使用正确的启动脚本
    script: 'src/server.js',
    
    // 工作目录
    cwd: '/root/IEclub_dev/ieclub-backend',
    
    // 生产环境使用集群模式提高性能
    instances: 2,
    exec_mode: 'cluster',
    
    // ✅ 从环境变量文件加载配置
    env_file: '/root/IEclub_dev/ieclub-backend/.env.production',
    
    // 环境变量（覆盖 env_file 中的值）
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    error_file: '/root/.pm2/logs/ieclub-backend-error.log',
    out_file: '/root/.pm2/logs/ieclub-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // 进程管理
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // 生产环境不监听文件变化
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
    
    // Node.js 参数
    node_args: '--max-old-space-size=1024',
    
    // 进程退出时的操作
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // 启动延迟（等待数据库就绪）
    wait_ready: true,
    
    // 定时重启（每天凌晨3点，避开高峰期）
    cron_restart: '0 3 * * *',
    
    // 环境变量说明
    // ================================================================
    // 确保 .env.production 文件包含以下必需的环境变量:
    // - DATABASE_URL: 数据库连接字符串
    // - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD: Redis 配置
    // - JWT_SECRET, JWT_REFRESH_SECRET: JWT 密钥
    // - 其他业务配置...
    // ================================================================
  }]
};

