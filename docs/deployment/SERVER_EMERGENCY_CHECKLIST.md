# 服务器应急检查清单

## 现象
- SSH连接在banner exchange阶段中断
- HTTPS请求超时
- TCP连接可以建立（端口通）
- 问题突然出现，之前一切正常

## 紧急访问方式

### 1. 阿里云控制台 VNC登录
```
1. 登录阿里云控制台: https://ecs.console.aliyun.com
2. 找到服务器实例 (IP: 39.108.160.112)
3. 点击"远程连接" > "VNC登录"
4. 输入VNC密码登录
```

## 服务器端检查命令

### 1. 检查系统资源

```bash
# CPU使用率
top -bn1 | head -20

# 内存使用
free -h

# 磁盘使用
df -h

# 磁盘IO
iostat -x 1 3
```

### 2. 检查SSH服务状态

```bash
# SSH服务是否运行
systemctl status sshd

# SSH服务日志（最近50行）
journalctl -u sshd -n 50 --no-pager

# SSH错误日志
tail -50 /var/log/auth.log
```

### 3. 检查fail2ban封禁

```bash
# 查看fail2ban状态
fail2ban-client status

# 查看SSH jail状态
fail2ban-client status sshd

# 查看被封禁的IP
fail2ban-client get sshd banned

# 如果你的IP被封，解封（替换YOUR_IP）
# fail2ban-client set sshd unbanip YOUR_IP
```

### 4. 检查防火墙规则

```bash
# 检查iptables规则
iptables -L -n -v | grep -E "22|80|443"

# 检查ufw状态
ufw status verbose
```

### 5. 检查网络连接数

```bash
# 当前连接数统计
ss -s

# SSH连接数
ss -tn | grep :22 | wc -l

# TIME_WAIT连接数
ss -tan | grep TIME_WAIT | wc -l

# 检查是否有大量半开连接
netstat -an | grep SYN_RECV | wc -l
```

### 6. 检查后端应用

```bash
# PM2应用状态
pm2 status

# PM2应用日志
pm2 logs --lines 50

# 检查端口占用
netstat -tlnp | grep -E "3000|80|443|22"
```

### 7. 检查Nginx

```bash
# Nginx状态
systemctl status nginx

# Nginx错误日志
tail -50 /var/log/nginx/error.log

# Nginx访问日志（最近的错误）
tail -100 /var/log/nginx/access.log | grep -E "499|500|502|503|504"
```

### 8. 检查系统日志

```bash
# 系统整体日志（最近错误）
journalctl -p err -n 50 --no-pager

# 内核日志（OOM killer等）
dmesg | tail -50
```

## 常见问题及解决方案

### A. 如果是fail2ban封禁

```bash
# 解封IP
fail2ban-client set sshd unbanip YOUR_IP

# 重启fail2ban
systemctl restart fail2ban
```

### B. 如果是资源耗尽

```bash
# 杀掉占用资源的进程
kill -9 PID

# 重启PM2应用
pm2 restart all

# 重启Nginx
systemctl restart nginx
```

### C. 如果是SSH服务挂了

```bash
# 重启SSH服务
systemctl restart sshd

# 检查SSH配置
sshd -t

# 如果配置有误，恢复备份
cp /etc/ssh/sshd_config.bak /etc/ssh/sshd_config
systemctl restart sshd
```

### D. 如果是连接数耗尽

```bash
# 增加系统限制（临时）
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 清理TIME_WAIT连接（调整内核参数）
echo 1 > /proc/sys/net/ipv4/tcp_tw_reuse
```

### E. 如果是DDoS攻击

```bash
# 查看连接数最多的IP
netstat -an | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# 临时封禁攻击IP
iptables -A INPUT -s ATTACKER_IP -j DROP
```

## 快速恢复步骤

如果所有检查都正常但问题依然存在：

```bash
# 1. 重启所有服务
systemctl restart sshd nginx
pm2 restart all

# 2. 如果还不行，检查阿里云安全组
# 登录控制台 > 网络与安全 > 安全组 > 检查入方向规则

# 3. 最后手段：重启服务器（数据会保留）
reboot
```

## 预防措施

```bash
# 1. 配置SSH保持连接
echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config
echo "ClientAliveCountMax 3" >> /etc/ssh/sshd_config
systemctl restart sshd

# 2. 增加fail2ban容错
vi /etc/fail2ban/jail.local
# 设置 maxretry = 10
# 设置 bantime = 600
systemctl restart fail2ban

# 3. 监控系统资源
# 安装监控工具
apt install htop iotop
```

## 联系方式

如果无法通过VNC登录，联系阿里云技术支持：
- 客服电话：95187
- 工单系统：https://workorder.console.aliyun.com

