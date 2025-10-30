# IEclub 快速参考卡

## 🔗 访问地址
- **网站**: https://ieclub.online
- **服务器**: root@39.108.160.112

---

## 📋 服务状态 (2025-10-30)

| 服务 | 状态 | 端口 | 进程 |
|-----|------|------|------|
| Nginx | ✅ Active | 80, 443 | nginx |
| 后端API | ✅ Online | 3001 | PM2: ieclub-backend |
| MySQL | ✅ Running | 3306 | mysqld |
| Redis | ✅ Running | 6379 | redis-server |

---

## 🚀 常用命令速查

### SSH连接
```bash
ssh root@39.108.160.112
```

### 后端服务 (PM2)
```bash
pm2 status                    # 查看状态
pm2 logs ieclub-backend      # 查看日志
pm2 restart ieclub-backend   # 重启
pm2 save                      # 保存配置
```

### Nginx
```bash
systemctl status nginx        # 查看状态
nginx -t                      # 测试配置
systemctl reload nginx        # 重载配置
systemctl restart nginx       # 重启服务
```

### 健康检查
```bash
# 后端直接访问
curl http://localhost:3001/health

# Nginx代理访问
curl http://127.0.0.1/health

# HTTPS访问
curl https://ieclub.online/health
```

---

## 📧 修改邮箱配置

### 1. 编辑配置
```bash
ssh root@39.108.160.112
nano /root/IEclub_dev/ieclub-backend/.env
```

### 2. 修改这些行
```bash
EMAIL_USER=你的邮箱@qq.com
EMAIL_PASS=你的QQ邮箱授权码  # ⚠️ 不是密码！
EMAIL_FROM=IEclub <你的邮箱@qq.com>
```

### 3. 重启服务
```bash
pm2 restart ieclub-backend
```

📖 **详细指南**: 见 `SERVER_EMAIL_CONFIGURATION.md`

---

## 📁 重要文件位置

```
服务器文件结构:
/root/IEclub_dev/
├── ieclub-backend/
│   ├── .env                    # ⭐ 环境变量配置
│   ├── ecosystem.config.js     # ⭐ PM2配置
│   └── src/server.js           # 主程序入口
│
/usr/share/nginx/html/
└── ieclub-web/                 # 前端静态文件
    └── index.html
│
/etc/nginx/
└── sites-available/
    └── ieclub.online           # ⭐ Nginx配置
│
/root/.pm2/logs/
├── ieclub-backend-out.log      # 标准输出日志
├── ieclub-backend-error.log    # 错误日志
└── ieclub-backend-combined.log # 合并日志
```

---

## 🔧 关键配置参数

### 后端 (.env)
```bash
PORT=3001                       # ⚠️ 已改为3001
NODE_ENV=production
DB_HOST=localhost
DB_NAME=ieclub_db
DB_USER=ieclub_user
EMAIL_PASS=<QQ邮箱授权码>      # ⚠️ 重要
REDIS_PASSWORD=W24BUwD4vnEcfMpXoMqv
```

### PM2 (ecosystem.config.js)
```javascript
{
  name: "ieclub-backend",
  script: "./src/server.js",
  env: {
    NODE_ENV: "production",
    PORT: 3001                  # ⚠️ 确保端口一致
  }
}
```

---

## 🔍 故障排查速查

### 问题: 后端无法访问
```bash
# 1. 检查进程
pm2 status

# 2. 查看日志
pm2 logs ieclub-backend --err

# 3. 检查端口
netstat -tlnp | grep 3001

# 4. 重启服务
pm2 restart ieclub-backend
```

### 问题: 前端404
```bash
# 1. 检查文件
ls /usr/share/nginx/html/ieclub-web/

# 2. 检查Nginx
nginx -t
systemctl status nginx

# 3. 重启Nginx
systemctl restart nginx
```

### 问题: 邮件发送失败
```bash
# 1. 检查授权码
grep EMAIL_PASS /root/IEclub_dev/ieclub-backend/.env

# 2. 查看错误
pm2 logs ieclub-backend --err --lines 50

# 3. 修改配置后重启
pm2 restart ieclub-backend
```

---

## 📊 监控命令

```bash
# 实时查看后端日志
pm2 logs ieclub-backend

# 实时查看Nginx访问日志
tail -f /var/log/nginx/access.log

# 实时查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 查看系统资源
htop  # 或 top

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

---

## 🔄 更新部署流程

### 更新后端代码
```bash
ssh root@39.108.160.112
cd /root/IEclub_dev/ieclub-backend
git pull origin main
npm install
pm2 restart ieclub-backend
pm2 logs ieclub-backend  # 查看启动日志
```

### 更新前端代码
```bash
# 本地构建
cd ieclub-web
npm run build

# 上传到服务器
scp -r dist/* root@39.108.160.112:/usr/share/nginx/html/ieclub-web/

# 清除浏览器缓存后访问
```

---

## ⚡ 一键命令

### 查看所有服务状态
```bash
ssh root@39.108.160.112 'pm2 status && echo "---" && systemctl status nginx --no-pager | head -10 && echo "---" && netstat -tlnp | grep LISTEN | grep -E ":(80|443|3001|3306|6379) "'
```

### 重启所有服务
```bash
ssh root@39.108.160.112 'pm2 restart all && systemctl restart nginx && echo "All services restarted!"'
```

### 查看所有日志
```bash
ssh root@39.108.160.112 'pm2 logs ieclub-backend --lines 20 && tail -20 /var/log/nginx/error.log'
```

---

## 📚 相关文档

- `DEPLOYMENT_SUCCESS_FINAL.md` - 完整部署报告
- `SERVER_EMAIL_CONFIGURATION.md` - 邮箱配置详细指南
- `PROJECT_STATUS.md` - 项目总体状态
- `README.md` - 项目说明

---

## ⚠️ 重要提醒

1. **端口已改**: 后端从 3000 改为 **3001**
2. **邮箱配置**: `EMAIL_PASS` 使用**授权码**，不是密码
3. **环境变量**: 修改 `.env` 后必须重启 PM2
4. **Nginx配置**: 修改后执行 `nginx -t && systemctl reload nginx`
5. **定期备份**: 记得备份数据库和配置文件

---

## 🆘 紧急联系

如果遇到严重问题：
1. 查看错误日志定位问题
2. 尝试重启相关服务
3. 检查配置文件是否正确
4. 参考 `DEPLOYMENT_SUCCESS_FINAL.md` 中的故障排查章节

---

📝 **最后更新**: 2025-10-30  
✅ **部署状态**: 生产环境运行中  
🔗 **在线地址**: https://ieclub.online

