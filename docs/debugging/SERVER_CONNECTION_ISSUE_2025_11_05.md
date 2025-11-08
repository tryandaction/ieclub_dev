# 服务器连接问题诊断报告

**日期**: 2025-11-05  
**问题**: 无法连接到生产服务器，网页无法访问

## 🔍 诊断结果

### 检查项目

1. ✅ **DNS解析**: 正常
   - 域名: ieclub.online
   - IP地址: 39.108.160.112

2. ❌ **HTTPS访问**: 超时
   - https://ieclub.online - 连接超时
   - https://ieclub.online/api/health - 连接超时

3. ❌ **SSH连接**: 超时
   - ssh root@ieclub.online - 连接超时
   - 错误: "Connection timed out during banner exchange"

### 可能原因

1. **服务器宕机**
   - 服务器可能已停止运行
   - 需要检查云服务商控制台

2. **防火墙规则变更**
   - SSH端口(22)可能被阻止
   - HTTPS端口(443)可能被阻止
   - 需要检查安全组/防火墙设置

3. **网络问题**
   - 本地网络问题
   - 服务器网络问题

4. **服务未启动**
   - Nginx可能未运行
   - PM2进程可能已停止

## 🔧 解决方案

### 方案1: 检查云服务商控制台

1. 登录阿里云/腾讯云控制台
2. 检查服务器状态
3. 检查安全组规则
4. 检查服务器资源使用情况（CPU、内存、磁盘）

### 方案2: 尝试其他连接方式

如果SSH端口被更改，可能需要：
- 通过云服务商控制台的Web终端连接
- 使用VNC连接
- 检查是否有备用SSH端口

### 方案3: 检查服务器日志

如果可以通过其他方式连接：
```bash
# 检查系统日志
journalctl -xe

# 检查Nginx状态
systemctl status nginx

# 检查PM2状态
pm2 status
pm2 logs

# 检查端口监听
netstat -tulpn | grep -E ':(80|443|3000|3001)'

# 检查防火墙
iptables -L -n
ufw status
```

### 方案4: 重启服务

如果服务器正常运行但服务未启动：
```bash
# 重启Nginx
systemctl restart nginx
systemctl status nginx

# 重启PM2进程
pm2 restart all
pm2 save

# 检查服务状态
pm2 status
pm2 logs --lines 50
```

## 📋 下一步行动

1. **立即行动**:
   - [ ] 检查云服务商控制台，确认服务器状态
   - [ ] 检查安全组规则，确保22和443端口开放
   - [ ] 尝试通过Web终端连接服务器

2. **如果服务器正常**:
   - [ ] 检查Nginx服务状态
   - [ ] 检查PM2进程状态
   - [ ] 检查后端服务日志
   - [ ] 重启必要的服务

3. **如果服务器异常**:
   - [ ] 联系云服务商技术支持
   - [ ] 检查服务器资源使用情况
   - [ ] 考虑重启服务器

## 🔗 相关资源

- 部署文档: `docs/deployment/Deployment_guide.md`
- 健康检查脚本: `scripts/health-check/Check-Website-Access.ps1`
- 快速部署脚本: `scripts/deployment/Quick-Deploy-Backend.ps1`

## 📝 备注

- 服务器IP: 39.108.160.112
- 生产环境端口: 3000
- 测试环境端口: 3001
- PM2进程名: ieclub-backend (生产), ieclub-backend-staging (测试)

