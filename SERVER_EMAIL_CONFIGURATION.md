# 服务器邮箱配置指南

## 配置位置
服务器后端环境变量配置文件：`/root/IEclub_dev/ieclub-backend/.env`

## 当前邮箱配置

```bash
# 邮件配置 (QQ邮箱)
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=2812149844@qq.com
EMAIL_PASS=ncampdyedrchddfd
EMAIL_FROM=IEclub <2812149844@qq.com>
```

## 如何修改邮箱配置

### 方法1：SSH直接编辑

```bash
# 1. SSH连接到服务器
ssh root@39.108.160.112

# 2. 编辑配置文件
nano /root/IEclub_dev/ieclub-backend/.env

# 3. 修改邮箱相关配置
EMAIL_HOST=smtp.qq.com          # SMTP服务器地址
EMAIL_PORT=465                   # SMTP端口
EMAIL_SECURE=true                # 是否使用SSL
EMAIL_USER=你的邮箱@qq.com       # 发件邮箱
EMAIL_PASS=你的授权码            # QQ邮箱授权码（不是密码！）
EMAIL_FROM=IEclub <你的邮箱@qq.com>  # 发件人显示名称

# 4. 保存后重启后端服务
pm2 restart ieclub-backend
```

### 方法2：使用sed命令修改

```bash
ssh root@39.108.160.112 'sed -i "s/EMAIL_USER=.*/EMAIL_USER=新邮箱@qq.com/" /root/IEclub_dev/ieclub-backend/.env'
ssh root@39.108.160.112 'sed -i "s/EMAIL_PASS=.*/EMAIL_PASS=新授权码/" /root/IEclub_dev/ieclub-backend/.env'
ssh root@39.108.160.112 'pm2 restart ieclub-backend'
```

## 获取QQ邮箱授权码

1. 登录QQ邮箱网页版
2. 进入 **设置** → **账户**
3. 找到 **POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务**
4. 开启 **IMAP/SMTP服务** 或 **POP3/SMTP服务**
5. 按提示发送短信验证
6. 获取授权码（16位字符串，例如：ncampdyedrchddfd）
7. 将授权码填入 `EMAIL_PASS` 配置项

⚠️ **重要提示**：
- `EMAIL_PASS` 填写的是**授权码**，不是邮箱登录密码！
- 授权码一旦生成要保存好，关闭页面后无法再次查看
- 如果忘记授权码，需要重新生成

## 其他邮箱配置示例

### 163邮箱
```bash
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=你的邮箱@163.com
EMAIL_PASS=163授权码
EMAIL_FROM=IEclub <你的邮箱@163.com>
```

### Gmail
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=你的邮箱@gmail.com
EMAIL_PASS=应用专用密码
EMAIL_FROM=IEclub <你的邮箱@gmail.com>
```

### 企业邮箱
```bash
EMAIL_HOST=smtp.exmail.qq.com    # 腾讯企业邮箱
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=你的邮箱@yourdomain.com
EMAIL_PASS=邮箱密码或授权码
EMAIL_FROM=IEclub <你的邮箱@yourdomain.com>
```

## 验证配置

修改配置后，可以通过注册功能测试邮件发送：

```bash
# 1. 测试邮件发送API
curl -X POST https://ieclub.online/api/v1/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"测试邮箱@example.com","type":"register"}'

# 2. 检查后端日志
ssh root@39.108.160.112 'pm2 logs ieclub-backend --lines 50'
```

## 当前部署状态

- **后端服务端口**: 3001
- **PM2进程名称**: ieclub-backend
- **配置文件**: `/root/IEclub_dev/ieclub-backend/.env`
- **Ecosystem配置**: `/root/IEclub_dev/ieclub-backend/ecosystem.config.js`
- **日志位置**: `/root/.pm2/logs/ieclub-backend-*.log`

## PM2配置

后端服务使用PM2管理，配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: "ieclub-backend",
    script: "./src/server.js",
    cwd: "/root/IEclub_dev/ieclub-backend",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3001
    },
    error_file: "/root/.pm2/logs/ieclub-backend-error.log",
    out_file: "/root/.pm2/logs/ieclub-backend-out.log",
    log_file: "/root/.pm2/logs/ieclub-backend-combined.log",
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
};
```

## 常用PM2命令

```bash
# 查看服务状态
pm2 status

# 查看详细信息
pm2 describe ieclub-backend

# 查看日志
pm2 logs ieclub-backend

# 重启服务
pm2 restart ieclub-backend

# 停止服务
pm2 stop ieclub-backend

# 启动服务
pm2 start ieclub-backend

# 使用ecosystem配置启动
pm2 start ecosystem.config.js

# 保存当前PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

## 故障排查

### 邮件发送失败

1. **检查授权码是否正确**
   ```bash
   ssh root@39.108.160.112 'grep EMAIL_PASS /root/IEclub_dev/ieclub-backend/.env'
   ```

2. **查看错误日志**
   ```bash
   pm2 logs ieclub-backend --err --lines 100
   ```

3. **常见错误**
   - `Invalid login` - 邮箱账号或授权码错误
   - `Connection timeout` - SMTP服务器地址或端口错误
   - `Authentication failed` - 未开启SMTP服务或授权码过期

### 服务无法启动

1. **检查端口占用**
   ```bash
   netstat -tlnp | grep 3001
   ```

2. **查看PM2日志**
   ```bash
   pm2 logs ieclub-backend --lines 50
   ```

3. **检查环境变量**
   ```bash
   pm2 env 0  # 查看进程环境变量
   ```

## 更新记录

- **2025-10-30**: 
  - ✅ 修正环境变量名称 `EMAIL_PASSWORD` → `EMAIL_PASS`
  - ✅ 修改后端端口从 3000 → 3001
  - ✅ 更新Nginx配置代理到3001端口
  - ✅ 创建ecosystem.config.js配置文件
  - ✅ 服务正常运行，健康检查通过

