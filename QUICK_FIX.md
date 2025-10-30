# 🚨 API 404 快速修复指南

## 服务器端检查 (5分钟)

### 1. SSH连接
```bash
ssh root@ieclub.online
```

### 2. 快速诊断
```bash
# 检查PM2进程
pm2 status

# 检查端口监听
netstat -tlnp | grep 3000

# 测试API
curl http://localhost:3000/health
curl http://localhost:3000/api/test
```

### 3. 快速修复

**如果PM2进程停止：**
```bash
pm2 restart ieclub-backend
pm2 logs ieclub-backend --lines 20
```

**如果端口未监听：**
```bash
cd /root/IEclub_dev/ieclub-backend
pm2 delete ieclub-backend
pm2 start src/server.js --name ieclub-backend
pm2 save
```

**如果API返回错误：**
```bash
cd /root/IEclub_dev
git pull origin main
cd ieclub-backend
npm install
pm2 restart ieclub-backend
```

### 4. 一键部署
```bash
cd /root/IEclub_dev
chmod +x SERVER_DEPLOY.sh
./SERVER_DEPLOY.sh
```

## 验证修复

### 后端验证
```bash
# 1. 健康检查
curl http://localhost:3000/health
# 期望: {"status":"ok",...}

# 2. API测试
curl http://localhost:3000/api/test
# 期望: {"message":"IEClub API is running",...}

# 3. PM2状态
pm2 status
# 期望: ieclub-backend [online]
```

### 前端验证
1. 访问 https://ieclub.online
2. 打开浏览器控制台 (F12)
3. 查看Network标签，API请求应该返回200

---

## 已完成的优化

✅ 后端添加 `/health` 和 `/api/test` 端点  
✅ 网页端生产环境使用完整URL  
✅ 小程序修复登录路径  
✅ 增强404错误调试信息  
✅ 添加请求日志  

**下一步**: 在服务器执行上述检查和修复

