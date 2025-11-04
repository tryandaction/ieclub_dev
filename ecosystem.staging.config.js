module.exports = {
  apps: [{
    name: 'staging-backend',
    script: 'server-simple.js',
    cwd: '/root/IEclub_dev_staging/ieclub-backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001
    },
    error_file: '/root/.pm2/logs/staging-backend-error.log',
    out_file: '/root/.pm2/logs/staging-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false
  }]
};

