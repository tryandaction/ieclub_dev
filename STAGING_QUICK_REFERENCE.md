# IEClub 测试环境快速参考

## 🌐 访问地址
- **测试环境**: https://test.ieclub.online
- **健康检查**: https://test.ieclub.online/health
- **API 健康**: https://test.ieclub.online/api/health

## 🔑 服务器信息
```bash
IP: 39.108.160.112
SSH: ssh root@39.108.160.112
目录: /var/www/ieclub-backend-staging
```

## 📊 常用命令

### PM2 管理
```bash
# 查看进程状态
pm2 list

# 查看日志（实时）
pm2 logs ieclub-backend-staging

# 查看详细信息
pm2 info ieclub-backend-staging

# 重启服务
pm2 restart ieclub-backend-staging

# 停止服务
pm2 stop ieclub-backend-staging

# 启动服务
pm2 start ieclub-backend-staging

# 查看监控
pm2 monit
```

### 数据库操作
```bash
# 连接数据库
mysql -u ieclub_staging -pIEClubYuQoSYpUnL57@2024 ieclub_staging

# 查看表
SHOW TABLES;

# 查看用户数
SELECT COUNT(*) FROM users;

# 运行 Prisma 迁移
cd /var/www/ieclub-backend-staging
npx prisma migrate deploy
```

### Redis 操作
```bash
# 连接 Redis
redis-cli

# 测试连接
redis-cli ping

# 查看信息
redis-cli info

# 查看所有键
redis-cli keys '*'
```

### Nginx 操作
```bash
# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# 查看状态
systemctl status nginx

# 查看日志
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/staging.access.log
```

### 系统监控
```bash
# 查看系统资源
htop

# 查看内存
free -h

# 查看磁盘
df -h

# 查看端口
netstat -tlnp | grep -E ':(80|443|3001)'

# 查看进程
ps aux | grep node
```

## 🔧 故障排查

### 服务无法访问
```bash
# 1. 检查 PM2 状态
pm2 list

# 2. 查看日志
pm2 logs ieclub-backend-staging --lines 100

# 3. 检查端口
netstat -tlnp | grep 3001

# 4. 测试本地访问
curl http://localhost:3001/health

# 5. 检查 Nginx
systemctl status nginx
nginx -t
```

### 数据库连接失败
```bash
# 1. 检查 MySQL 服务
systemctl status mysql

# 2. 测试连接
mysql -u ieclub_staging -pIEClubYuQoSYpUnL57@2024 ieclub_staging -e "SELECT 1"

# 3. 检查环境变量
cat /var/www/ieclub-backend-staging/.env.staging | grep DATABASE_URL

# 4. 重新生成 Prisma Client
cd /var/www/ieclub-backend-staging
npx prisma generate
```

### Redis 连接失败
```bash
# 1. 检查 Redis 服务
systemctl status redis-server

# 2. 测试连接
redis-cli ping

# 3. 重启 Redis
systemctl restart redis-server

# 4. 检查配置
cat /etc/redis/redis.conf | grep bind
```

### HTTPS 证书问题
```bash
# 1. 检查证书
openssl x509 -in /etc/letsencrypt/live/test.ieclub.online/fullchain.pem -noout -dates

# 2. 续期证书
certbot renew --dry-run
certbot renew

# 3. 重启 Nginx
systemctl restart nginx
```

## 📝 部署流程

### 更新代码
```bash
# 1. 进入目录
cd /var/www/ieclub-backend-staging

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖（如需要）
npm install

# 4. 重新生成 Prisma Client
npx prisma generate

# 5. 运行迁移（如需要）
npx prisma migrate deploy

# 6. 重启服务
pm2 restart ieclub-backend-staging
```

### 完整重新部署
```bash
# 1. 停止服务
pm2 stop ieclub-backend-staging

# 2. 备份数据库
mysqldump -u ieclub_staging -pIEClubYuQoSYpUnL57@2024 ieclub_staging > backup.sql

# 3. 更新代码
cd /var/www/ieclub-backend-staging
git pull origin main

# 4. 安装依赖
npm install

# 5. 生成 Prisma Client
npx prisma generate

# 6. 运行迁移
npx prisma migrate deploy

# 7. 启动服务
pm2 start ieclub-backend-staging

# 8. 验证
curl https://test.ieclub.online/api/health
```

## ⚙️ 环境变量

关键环境变量位置: `/var/www/ieclub-backend-staging/.env.staging`

```bash
NODE_ENV=staging
PORT=3001
DATABASE_URL=mysql://ieclub_staging:IEClubYuQoSYpUnL57%402024@127.0.0.1:3306/ieclub_staging
REDIS_URL=redis://127.0.0.1:6379
```

## 🔒 安全注意事项

1. ✅ 使用 HTTPS（Let's Encrypt）
2. ✅ 数据库用户权限隔离
3. ✅ 复杂密码（20+ 字符）
4. ✅ SSH 密钥认证
5. ⚠️ 建议配置防火墙（UFW）
6. ⚠️ 建议定期备份数据库

## 📈 性能基准

| 指标 | 当前值 | 目标 |
|------|--------|------|
| HTTP 平均延迟 | 15 ms | < 100 ms |
| HTTP P95 延迟 | 179 ms | < 500 ms |
| 内存使用 | 82 MB | < 500 MB |
| CPU 使用 | 0% | < 50% |
| 可用性 | 100% | > 99% |

## 🎯 健康检查

快速健康检查脚本：
```bash
#!/bin/bash
echo "PM2 状态:"
pm2 list | grep ieclub

echo ""
echo "API 健康:"
curl -s https://test.ieclub.online/api/health | jq .

echo ""
echo "数据库:"
mysql -u ieclub_staging -pIEClubYuQoSYpUnL57@2024 ieclub_staging -e "SELECT 1" 2>&1 | grep -v Warning

echo ""
echo "Redis:"
redis-cli ping

echo ""
echo "Nginx:"
systemctl is-active nginx
```

## 📞 紧急联系

如遇严重问题：
1. 查看 PM2 日志：`pm2 logs ieclub-backend-staging --lines 100`
2. 查看系统日志：`journalctl -xe`
3. 查看 Nginx 错误日志：`tail -100 /var/log/nginx/error.log`
4. 联系管理员

---

**最后更新**: 2025-11-03
**文档版本**: 1.0
**测试环境状态**: ✅ 正常运行

