// ================================================================
// IEClub 测试环境 PM2 配置文件
// ================================================================
//
// 用途: 配置测试环境后端服务的 PM2 进程管理
// 环境: Staging (测试环境)
// 端口: 3001
// 数据库: ieclub_staging
//
// 使用方法:
//   pm2 start ecosystem.staging.config.js
//   pm2 restart staging-backend
//   pm2 logs staging-backend
//
// 更新日期: 2025-11-06
// ================================================================

module.exports = {
  apps: [{
    name: 'staging-backend',
    
    // ✅ 修复: 使用正确的启动脚本
    script: 'src/server-staging.js',
    
    // 工作目录
    cwd: '/root/IEclub_dev_staging/ieclub-backend',
    
    // 单实例运行（测试环境不需要集群）
    instances: 1,
    exec_mode: 'fork',
    
    // ✅ 修复: 从环境变量文件加载配置
    env_file: '/root/IEclub_dev_staging/ieclub-backend/.env.staging',
    
    // 环境变量（覆盖 env_file 中的值）
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    
    // 日志配置
    error_file: '/root/.pm2/logs/staging-backend-error.log',
    out_file: '/root/.pm2/logs/staging-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // 进程管理
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // 开发时可以启用 watch，生产/测试环境建议关闭
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
    
    // Node.js 参数
    node_args: '--max-old-space-size=512',
    
    // 进程退出时的操作
    kill_timeout: 5000,
    listen_timeout: 10000,
    
    // 启动延迟（等待数据库就绪）
    wait_ready: true,
    
    // 环境变量说明
    // ================================================================
    // 确保 .env.staging 文件包含以下必需的环境变量:
    // - DATABASE_URL: 数据库连接字符串
    // - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD: Redis 配置
    // - JWT_SECRET, JWT_REFRESH_SECRET: JWT 密钥
    // - 其他业务配置...
    // ================================================================
  }]
};

