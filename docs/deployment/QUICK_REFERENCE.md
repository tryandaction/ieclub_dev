# 🚀 IEClub 部署快速参考卡

> 常用部署命令速查表，打印或收藏备用

---

## ⚡ 最常用命令（Top 3）

### 1️⃣ 测试环境部署 + 验证
```powershell
cd C:\universe\GitHub_try\IEclub_dev\scripts\deployment
.\Deploy-And-Verify.ps1 -Target all -Message "描述本次更新"
```

### 2️⃣ 生产环境一键部署
```powershell
cd C:\universe\GitHub_try\IEclub_dev\scripts\deployment
.\Deploy-Production-OneClick.ps1 -Target all -Message "v1.0.0 描述"
```

### 3️⃣ 本地开发环境快速启动
```powershell
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\QUICK_START.ps1
```

---

## 📦 分类命令

### 本地开发

| 操作 | 命令 |
|------|------|
| 启动开发环境 | `.\scripts\QUICK_START.ps1` |
| 仅启动后端 | `cd ieclub-backend && npm run dev` |
| 仅启动前端 | `cd ieclub-web && npm run dev` |

### 测试环境

| 操作 | 命令 |
|------|------|
| 部署全部 + 验证 | `.\scripts\deployment\Deploy-And-Verify.ps1 -Target all` |
| 部署全部 | `.\scripts\deployment\Deploy-Staging.ps1 -Target all` |
| 仅部署前端 | `.\scripts\deployment\Deploy-Staging.ps1 -Target web` |
| 仅部署后端 | `.\scripts\deployment\Deploy-Staging.ps1 -Target backend` |

### 生产环境

| 操作 | 命令 |
|------|------|
| 一键部署（推荐） | `.\scripts\deployment\Deploy-Production-OneClick.ps1` |
| 传统部署 | `.\scripts\deployment\Deploy-Production.ps1` |
| 仅前端 | `.\Deploy-Production.ps1 -Frontend` |
| 仅后端 | `.\Deploy-Production.ps1 -Backend` |

---

## 🔍 服务器检查命令

### 连接服务器
```bash
ssh root@ieclub.online
```

### 查看服务状态
```bash
pm2 status                         # PM2 进程列表
pm2 logs ieclub-backend            # 生产日志
pm2 logs staging-backend           # 测试日志
systemctl status nginx             # Nginx 状态
```

### 查看实时日志
```bash
pm2 logs ieclub-backend --lines 50  # 最新50行
pm2 logs ieclub-backend             # 实时滚动
pm2 flush                           # 清空日志
```

### 重启服务
```bash
pm2 restart ieclub-backend         # 重启生产后端
pm2 restart staging-backend        # 重启测试后端
systemctl reload nginx             # 重启 Nginx
```

### 健康检查
```bash
# 生产环境
curl https://ieclub.online/api/health

# 测试环境
curl https://test.ieclub.online/api/health

# 本地健康检查
curl http://localhost:3000/health   # 生产后端
curl http://localhost:3001/health   # 测试后端
```

### 查看服务器资源
```bash
htop                               # 资源监控
df -h                              # 磁盘空间
free -h                            # 内存使用
netstat -tlnp | grep 3000          # 端口监听
```

---

## 🗄️ 数据库操作

### 连接数据库
```bash
mysql -u root -p
```

### 常用 SQL
```sql
-- 切换数据库
USE ieclub;              -- 生产
USE ieclub_staging;      -- 测试

-- 查看表
SHOW TABLES;

-- 查看用户
SELECT id, email, nickname, created_at FROM users LIMIT 10;

-- 查看帖子
SELECT id, title, author, created_at FROM topics ORDER BY created_at DESC LIMIT 10;
```

### 数据库备份
```bash
# 备份生产数据库
mysqldump -u root -p ieclub > /root/backups/ieclub_$(date +%Y%m%d_%H%M%S).sql

# 备份测试数据库
mysqldump -u root -p ieclub_staging > /root/backups/staging_$(date +%Y%m%d_%H%M%S).sql

# 查看备份文件
ls -lh /root/backups/
```

### 数据库恢复
```bash
mysql -u root -p ieclub < /root/backups/ieclub_YYYYMMDD_HHMMSS.sql
```

---

## 🔧 Prisma 命令

### 本地开发
```bash
cd ieclub-backend

npx prisma studio                  # 打开数据库可视化界面
npx prisma generate               # 生成 Prisma Client
npx prisma migrate dev            # 开发环境迁移
npx prisma db push                # 快速同步（不创建迁移）
```

### 服务器端
```bash
ssh root@ieclub.online
cd /root/IEclub_dev/ieclub-backend

npx prisma migrate deploy         # 生产环境迁移
npx prisma generate               # 生成客户端
npx prisma studio                 # 可视化界面（需端口转发）
```

---

## 🐛 故障排查速查

### 问题：网站无法访问

```bash
# 1. 检查 Nginx
systemctl status nginx
nginx -t

# 2. 检查文件
ls -la /var/www/ieclub.online/
ls -la /var/www/test.ieclub.online/

# 3. 检查日志
tail -f /var/log/nginx/error.log
```

### 问题：API 错误

```bash
# 1. 查看后端日志
pm2 logs ieclub-backend --lines 100

# 2. 检查进程
pm2 status

# 3. 重启后端
pm2 restart ieclub-backend

# 4. 本地测试
curl http://localhost:3000/health
```

### 问题：数据库连接失败

```bash
# 1. 检查 MySQL 服务
systemctl status mysql

# 2. 测试连接
mysql -u root -p -e "SELECT 1"

# 3. 检查环境变量
cd /root/IEclub_dev/ieclub-backend
cat .env | grep DATABASE_URL

# 4. 查看 MySQL 日志
tail -f /var/log/mysql/error.log
```

---

## 📱 小程序快速操作

### 上传代码
```
1. 打开微信开发者工具
2. 点击 "上传" 按钮
3. 填写版本号和备注
4. 点击确定
```

### 提交审核
```
1. 登录 mp.weixin.qq.com
2. 进入 "版本管理"
3. 点击 "提交审核"
4. 填写功能页面和测试账号
5. 提交
```

### 发布上线
```
1. 等待审核通过
2. 登录微信公众平台
3. 点击 "发布" 按钮
4. 确认发布
```

---

## ⏱️ 部署时间参考

| 操作 | 耗时 |
|------|------|
| 测试环境部署 | 5-8 分钟 |
| 生产环境部署 | 8-12 分钟 |
| 健康检查 | 1-2 分钟 |
| 数据库备份 | 1-5 分钟 |
| 小程序审核 | 1-7 工作日 |

---

## 🔗 快速链接

| 资源 | 地址 |
|------|------|
| 生产网页 | https://ieclub.online |
| 测试网页 | https://test.ieclub.online |
| 生产 API | https://ieclub.online/api |
| 测试 API | https://test.ieclub.online/api |
| 微信公众平台 | https://mp.weixin.qq.com/ |
| 服务器 SSH | `ssh root@ieclub.online` |

---

## 📞 紧急联系

- **立即回滚**: 见 [部署检查清单 - 紧急回滚](./DEPLOYMENT_CHECKLIST.md#紧急回滚清单)
- **查看日志**: `ssh root@ieclub.online "pm2 logs ieclub-backend --lines 100"`
- **重启服务**: `ssh root@ieclub.online "pm2 restart ieclub-backend"`

---

## 💡 小贴士

1. ✅ 始终先在测试环境验证
2. ✅ 生产部署选择低峰时段
3. ✅ 部署前备份数据库
4. ✅ 部署后监控日志
5. ✅ 遇到问题不要慌，先查日志

---

**打印此页面，贴在显示器旁边 📋**

