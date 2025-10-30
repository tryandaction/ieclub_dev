# IEclub 项目部署成功报告

📅 **报告日期**: 2025-10-30  
🚀 **部署状态**: ✅ 成功运行  
🔗 **线上地址**: https://ieclub.online

---

## 一、部署概览

### 1.1 服务器信息
- **服务器IP**: 39.108.160.112
- **操作系统**: Ubuntu (Linux)
- **域名**: ieclub.online
- **SSL证书**: ✅ 已配置（Let's Encrypt）
- **Web服务器**: Nginx 1.24.0

### 1.2 应用架构
```
用户浏览器
    ↓ HTTPS (443)
Nginx反向代理
    ├─→ 前端静态文件 (/usr/share/nginx/html/ieclub-web)
    └─→ 后端API (localhost:3001)
          ↓
    后端Node.js服务 (PM2管理)
          ↓
    ├─→ MySQL数据库 (localhost:3306)
    └─→ Redis缓存 (localhost:6379)
```

---

## 二、各组件状态

### 2.1 前端服务 ✅
- **部署路径**: `/usr/share/nginx/html/ieclub-web`
- **访问地址**: https://ieclub.online
- **状态**: 正常运行
- **验证结果**: 
  ```bash
  curl https://ieclub.online
  # 返回前端HTML页面
  ```

### 2.2 后端服务 ✅
- **部署路径**: `/root/IEclub_dev/ieclub-backend`
- **运行端口**: 3001
- **进程管理**: PM2 (进程名: ieclub-backend)
- **Node版本**: 18.20.8
- **环境**: production
- **状态**: online (正常运行)
- **验证结果**:
  ```bash
  # 直接访问后端
  curl http://localhost:3001/health
  # {"status":"ok","timestamp":"...","environment":"production"}
  
  # 通过Nginx访问
  curl http://127.0.0.1/health
  # healthy
  ```

### 2.3 数据库服务 ✅
- **类型**: MySQL 8.0+
- **端口**: 3306
- **数据库名**: ieclub_db
- **用户**: ieclub_user
- **状态**: 运行中

### 2.4 缓存服务 ✅
- **类型**: Redis
- **端口**: 6379
- **密码**: 已配置 (W24BUwD4vnEcfMpXoMqv)
- **状态**: 运行中

---

## 三、邮件服务配置

### 3.1 当前配置 ✅
```bash
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=2812149844@qq.com
EMAIL_PASS=ncampdyedrchddfd  # QQ邮箱授权码
EMAIL_FROM=IEclub <2812149844@qq.com>
```

### 3.2 配置文件位置
- **路径**: `/root/IEclub_dev/ieclub-backend/.env`
- **修改方式**: SSH连接服务器后编辑
- **详细指南**: 参见 `SERVER_EMAIL_CONFIGURATION.md`

### 3.3 重要提示
⚠️ `EMAIL_PASS` 使用的是 QQ 邮箱**授权码**，不是登录密码！

获取授权码步骤：
1. 登录QQ邮箱网页版
2. 设置 → 账户 → POP3/IMAP/SMTP服务
3. 开启服务并获取授权码
4. 将授权码填入配置文件

---

## 四、PM2进程管理

### 4.1 PM2配置
**配置文件**: `/root/IEclub_dev/ieclub-backend/ecosystem.config.js`

```javascript
{
  name: "ieclub-backend",
  script: "./src/server.js",
  env: {
    NODE_ENV: "production",
    PORT: 3001
  },
  autorestart: true,
  max_memory_restart: "1G"
}
```

### 4.2 常用命令
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs ieclub-backend

# 重启服务
pm2 restart ieclub-backend

# 停止服务
pm2 stop ieclub-backend

# 启动服务 (使用ecosystem配置)
cd /root/IEclub_dev/ieclub-backend
pm2 start ecosystem.config.js

# 保存配置 (开机自启)
pm2 save
```

---

## 五、Nginx配置

### 5.1 配置文件
**路径**: `/etc/nginx/sites-available/ieclub.online`

### 5.2 关键配置
```nginx
server {
    listen 80;
    server_name ieclub.online www.ieclub.online;
    return 301 https://$server_name$request_uri;  # HTTP → HTTPS重定向
}

server {
    listen 443 ssl http2;
    server_name ieclub.online www.ieclub.online;
    
    # SSL证书
    ssl_certificate /etc/letsencrypt/live/ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ieclub.online/privkey.pem;
    
    # 前端静态文件
    location / {
        root /usr/share/nginx/html/ieclub-web;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API代理
    location ~ ^/(api|health|socket\.io) {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.3 Nginx命令
```bash
# 测试配置
nginx -t

# 重载配置
systemctl reload nginx

# 重启服务
systemctl restart nginx

# 查看状态
systemctl status nginx

# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

---

## 六、端口映射

| 服务 | 端口 | 访问方式 | 状态 |
|-----|------|---------|------|
| Nginx (HTTP) | 80 | 公网 | ✅ (重定向到HTTPS) |
| Nginx (HTTPS) | 443 | 公网 | ✅ 正常运行 |
| 后端API | 3001 | 本地 | ✅ 正常运行 |
| MySQL | 3306 | 本地 | ✅ 正常运行 |
| Redis | 6379 | 本地 | ✅ 正常运行 |

---

## 七、环境变量配置

### 7.1 后端环境变量 (.env)
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=ieclub_user
DB_PASSWORD=ieclub_password_2024
DB_NAME=ieclub_db

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# 服务器配置
PORT=3001                    # ⚠️ 已改为3001
NODE_ENV=production

# 邮件配置 (QQ邮箱)
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=2812149844@qq.com
EMAIL_PASS=ncampdyedrchddfd  # ⚠️ 这是授权码
EMAIL_FROM=IEclub <2812149844@qq.com>

# CORS配置
ALLOWED_ORIGINS=https://ieclub.online,https://www.ieclub.online,http://localhost:5173

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=W24BUwD4vnEcfMpXoMqv

# 验证码配置
VERIFY_CODE_EXPIRE=300
VERIFY_CODE_LENGTH=6

# 密码重置链接过期时间（秒）
RESET_PASSWORD_EXPIRE=3600

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 八、部署修复记录

### 8.1 主要修复 (2025-10-30)

#### 问题1: 环境变量名称错误
**症状**: 邮件服务无法正常工作  
**原因**: `.env`文件中使用 `EMAIL_PASSWORD`，但代码期望 `EMAIL_PASS`  
**解决方案**:
```bash
ssh root@39.108.160.112 'sed -i "s/^EMAIL_PASSWORD=/EMAIL_PASS=/" /root/IEclub_dev/ieclub-backend/.env'
```

#### 问题2: 端口冲突
**症状**: 后端无法启动，报 `EADDRINUSE: address already in use :::3000`  
**原因**: 3000端口已被占用  
**解决方案**:
1. 修改后端端口为3001
   ```bash
   sed -i "s/PORT=3000/PORT=3001/" /root/IEclub_dev/ieclub-backend/.env
   ```
2. 更新Nginx配置
   ```bash
   sed -i "s/127.0.0.1:3000/127.0.0.1:3001/g" /etc/nginx/sites-available/ieclub.online
   nginx -t && systemctl reload nginx
   ```
3. 使用环境变量启动PM2
   ```bash
   PORT=3001 NODE_ENV=production pm2 start src/server.js --name ieclub-backend
   ```

#### 问题3: PM2配置持久化
**症状**: PM2重启后不加载最新环境变量  
**解决方案**: 创建 `ecosystem.config.js` 配置文件

---

## 九、验证测试

### 9.1 健康检查 ✅
```bash
# 后端直接访问
curl http://localhost:3001/health
# 响应: {"status":"ok","timestamp":"...","environment":"production"}

# Nginx代理访问
curl http://127.0.0.1/health
# 响应: healthy

# HTTPS访问 (外网)
curl https://ieclub.online/health
# 响应: healthy
```

### 9.2 前端访问 ✅
```bash
curl https://ieclub.online
# 返回HTML页面（包含React应用）
```

### 9.3 WebSocket测试
```bash
# WebSocket端点应该可访问
wss://ieclub.online/socket.io
```

---

## 十、维护指南

### 10.1 日常维护

#### 查看服务状态
```bash
# SSH连接
ssh root@39.108.160.112

# 检查后端服务
pm2 status
pm2 logs ieclub-backend --lines 50

# 检查Nginx
systemctl status nginx

# 检查MySQL
systemctl status mysql

# 检查Redis
systemctl status redis-server
```

#### 重启服务
```bash
# 重启后端
pm2 restart ieclub-backend

# 重启Nginx
systemctl restart nginx

# 重启MySQL
systemctl restart mysql

# 重启Redis
systemctl restart redis-server
```

### 10.2 更新代码

#### 更新后端
```bash
ssh root@39.108.160.112
cd /root/IEclub_dev/ieclub-backend
git pull origin main
npm install
pm2 restart ieclub-backend
```

#### 更新前端
```bash
# 本地构建
cd ieclub-web
npm run build

# 上传到服务器
scp -r dist/* root@39.108.160.112:/usr/share/nginx/html/ieclub-web/
```

### 10.3 备份

#### 数据库备份
```bash
mysqldump -u ieclub_user -p ieclub_db > backup_$(date +%Y%m%d).sql
```

#### 配置文件备份
```bash
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  /root/IEclub_dev/ieclub-backend/.env \
  /root/IEclub_dev/ieclub-backend/ecosystem.config.js \
  /etc/nginx/sites-available/ieclub.online
```

---

## 十一、故障排查

### 11.1 后端无法访问

**检查步骤**:
1. 检查PM2进程状态
   ```bash
   pm2 status
   pm2 logs ieclub-backend --err
   ```

2. 检查端口监听
   ```bash
   netstat -tlnp | grep 3001
   ```

3. 检查环境变量
   ```bash
   pm2 env 0  # 0是进程ID
   cat /root/IEclub_dev/ieclub-backend/.env
   ```

4. 手动测试
   ```bash
   cd /root/IEclub_dev/ieclub-backend
   PORT=3001 NODE_ENV=production node src/server.js
   ```

### 11.2 前端404错误

**检查步骤**:
1. 确认文件存在
   ```bash
   ls -la /usr/share/nginx/html/ieclub-web/
   ```

2. 检查Nginx配置
   ```bash
   nginx -t
   cat /etc/nginx/sites-available/ieclub.online
   ```

3. 检查文件权限
   ```bash
   chmod -R 755 /usr/share/nginx/html/ieclub-web/
   ```

### 11.3 邮件发送失败

**检查步骤**:
1. 确认授权码正确
   ```bash
   grep EMAIL_PASS /root/IEclub_dev/ieclub-backend/.env
   ```

2. 查看错误日志
   ```bash
   pm2 logs ieclub-backend --err --lines 100
   ```

3. 测试SMTP连接
   ```bash
   telnet smtp.qq.com 465
   ```

---

## 十二、安全建议

### 12.1 已实施
- ✅ HTTPS加密通信
- ✅ 数据库密码保护
- ✅ Redis密码认证
- ✅ JWT令牌认证
- ✅ CORS限制
- ✅ 限流保护

### 12.2 建议加强
- 🔄 定期更新系统补丁
- 🔄 配置防火墙规则
- 🔄 设置自动备份
- 🔄 启用日志监控
- 🔄 配置告警通知

---

## 十三、联系信息

### 项目信息
- **项目名称**: IEclub (Innovation & Entrepreneurship Club)
- **代码仓库**: GitHub (待添加链接)
- **线上地址**: https://ieclub.online

### 技术栈
- **前端**: React + Vite + Tailwind CSS
- **后端**: Node.js (Express)
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **Web服务器**: Nginx
- **进程管理**: PM2
- **SSL**: Let's Encrypt

---

## 十四、总结

✅ **部署状态**: 完全成功  
✅ **服务运行**: 所有组件正常  
✅ **域名访问**: HTTPS正常工作  
✅ **邮件服务**: 配置完成（需要更换授权码时参考文档）

**下一步**:
1. 根据 `SERVER_EMAIL_CONFIGURATION.md` 更新邮箱配置（如需要）
2. 配置自动备份脚本
3. 设置监控告警
4. 进行负载测试

**重要文件**:
- `SERVER_EMAIL_CONFIGURATION.md` - 邮箱配置详细指南
- `ecosystem.config.js` - PM2配置文件
- `.env` - 环境变量配置

---

📝 **报告生成时间**: 2025-10-30  
👨‍💻 **部署完成**: AI Assistant  
🎉 **状态**: 生产环境运行中

