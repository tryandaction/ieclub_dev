# DNS 和部署问题修复指南

## 问题总结

### 1. HTTPS 未配置 ✅ 已修复
- **问题**: Nginx只配置了HTTP，没有配置HTTPS
- **影响**: 小程序要求HTTPS，无法访问API
- **修复**: 已配置HTTPS，使用Let's Encrypt证书

### 2. 小程序使用IP地址 ✅ 已修复
- **问题**: 小程序配置使用 `http://39.108.160.112/api`
- **影响**: 不在微信小程序合法域名列表中
- **修复**: 已更新为 `https://www.ieclub.online/api`

### 3. 本地DNS解析问题 ⚠️ 需要用户处理
- **问题**: 本地DNS将 `ieclub.online` 解析到内网地址 `198.18.0.56`
- **影响**: 从你的电脑无法访问域名
- **原因**: 可能是本地网络代理或DNS劫持

## 已完成的修复

### 1. Nginx HTTPS 配置

已更新 `/etc/nginx/sites-available/ieclub`，配置包括：

- ✅ HTTP到HTTPS自动重定向
- ✅ SSL证书配置（ieclub.online 和 www.ieclub.online）
- ✅ API反向代理到后端端口3000
- ✅ 前端静态文件服务
- ✅ 健康检查端点

**验证命令**:
```bash
# 从服务器测试HTTPS
ssh root@39.108.160.112 "curl -k -I https://ieclub.online/health"
ssh root@39.108.160.112 "curl -k -I https://www.ieclub.online/health"
```

### 2. 小程序配置更新

已更新 `ieclub-frontend/app.js`：

```javascript
// 旧配置
apiBase: 'http://39.108.160.112/api'

// 新配置
apiBase: 'https://www.ieclub.online/api'
```

**需要做的**: 
1. 重新编译小程序代码
2. 在微信开发者工具中上传新版本

### 3. 服务器端验证

所有服务正常运行：

```bash
✅ Nginx - 运行中 (端口80, 443)
✅ 后端服务 - 运行中 (端口3000, PM2管理)
✅ MySQL - 运行中 (端口3306)
✅ Redis - 运行中 (端口6379)
```

## DNS 问题解决方案

### 问题诊断

你的本地DNS查询结果：
```
ieclub.online -> 198.18.0.56 (错误，这是内网地址)
```

正确的解析应该是：
```
ieclub.online -> 39.108.160.112 (服务器公网IP)
```

### 解决方法

#### 方法1: 修改本地hosts文件（临时方案）

**Windows**:
1. 以管理员身份打开记事本
2. 打开文件: `C:\Windows\System32\drivers\etc\hosts`
3. 添加以下行:
```
39.108.160.112 ieclub.online
39.108.160.112 www.ieclub.online
```
4. 保存并关闭

**验证**:
```powershell
ping ieclub.online
# 应该显示 39.108.160.112
```

#### 方法2: 更换DNS服务器（推荐）

你的本地DNS可能被劫持或使用了有问题的代理。建议更换为：

**公共DNS服务器**:
- Google DNS: `8.8.8.8`, `8.8.4.4`
- Cloudflare DNS: `1.1.1.1`, `1.0.0.1`
- 阿里DNS: `223.5.5.5`, `223.6.6.6`

**Windows设置步骤**:
1. 打开"设置" -> "网络和Internet"
2. 点击"更改适配器选项"
3. 右键点击你的网络连接 -> "属性"
4. 选择"Internet协议版本4 (TCP/IPv4)" -> "属性"
5. 选择"使用下面的DNS服务器地址"
6. 首选DNS服务器: `8.8.8.8`
7. 备用DNS服务器: `8.8.4.4`
8. 点击"确定"

**刷新DNS缓存**:
```powershell
ipconfig /flushdns
```

#### 方法3: 检查代理设置

如果你使用了VPN或代理软件：
1. 暂时关闭代理
2. 检查代理软件的DNS设置
3. 添加 `ieclub.online` 到代理白名单

## 域名验证

### 从服务器端访问（已验证 ✅）

```bash
# HTTP (会自动重定向到HTTPS)
curl -I http://ieclub.online
# 返回: 301 Moved Permanently

# HTTPS
curl -k -I https://ieclub.online/health
# 返回: 200 OK

# API测试
curl -k https://www.ieclub.online/api/auth/send-verify-code
# 返回: JSON响应
```

### 从外部访问（需要你验证）

修复DNS后，在浏览器访问：
- https://ieclub.online
- https://www.ieclub.online

应该能看到IEClub网站首页。

## 小程序部署检查清单

完成DNS修复后：

- [x] 更新小程序API配置为HTTPS域名
- [x] 配置Nginx HTTPS反向代理
- [ ] 在微信小程序管理后台配置合法域名
  - 登录: https://mp.weixin.qq.com
  - 开发 -> 开发管理 -> 开发设置 -> 服务器域名
  - request合法域名: `https://www.ieclub.online`
- [ ] 重新编译并上传小程序代码
- [ ] 在微信开发者工具中测试

## 常见问题

### Q1: 为什么从服务器能访问，但我的电脑不能？
**A**: 这是本地DNS问题，不是服务器问题。按照上面的DNS解决方案操作。

### Q2: 小程序还是报错"不在合法域名列表"？
**A**: 需要在微信小程序管理后台添加 `https://www.ieclub.online` 到request合法域名。

### Q3: HTTPS证书会过期吗？
**A**: Let's Encrypt证书90天有效期。建议设置自动续期：
```bash
# 测试续期
certbot renew --dry-run

# 设置自动续期（crontab）
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```

### Q4: 后端运行在哪个端口？
**A**: 后端运行在3000端口（不是.env文件中的3001）。Nginx配置已正确反向代理到3000。

## 下一步操作

1. **修复DNS**（按照上面的方法1或2）
2. **验证访问**:
   ```bash
   # 在PowerShell中
   nslookup ieclub.online 8.8.8.8
   # 应该返回 39.108.160.112
   ```
3. **在微信小程序管理后台配置域名**
4. **重新上传小程序代码**

## 技术细节

### Nginx配置位置
- 配置文件: `/etc/nginx/sites-available/ieclub`
- 软链接: `/etc/nginx/sites-enabled/ieclub`
- SSL证书: `/etc/letsencrypt/live/ieclub.online/`
- SSL证书(www): `/etc/letsencrypt/live/www.ieclub.online/`

### 服务管理命令
```bash
# Nginx
sudo nginx -t                  # 测试配置
sudo systemctl reload nginx    # 重载配置
sudo systemctl status nginx    # 查看状态

# 后端服务
pm2 status                     # 查看PM2进程
pm2 logs ieclub-backend        # 查看日志
pm2 restart ieclub-backend     # 重启服务
```

## 联系支持

如果遇到其他问题，请提供：
1. DNS查询结果: `nslookup ieclub.online`
2. 访问测试结果: 浏览器访问 https://ieclub.online 的截图
3. 错误信息: 完整的错误提示

