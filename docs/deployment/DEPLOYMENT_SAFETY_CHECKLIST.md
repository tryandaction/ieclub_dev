# 部署安全检查清单

> **最后更新**: 2025-11-05  
> **目的**: 确保部署脚本不会导致服务器崩溃，代码功能正常

---

## ✅ 已修复的问题

### 1. 测试环境部署脚本修复
- ✅ **修复启动文件路径**: `src/server-staging-simple.js` → `src/server-staging.js`
- ✅ **添加PM2内存限制**: `max_memory_restart: '500M'`
- ✅ **添加资源检查**: 部署前自动检查服务器资源

### 2. 生产环境部署脚本修复
- ✅ **添加PM2配置文件**: 使用 `ecosystem.production.config.js` 管理进程
- ✅ **添加内存限制**: `max_memory_restart: '1G'`
- ✅ **添加Node.js内存限制**: `--max-old-space-size=1024`
- ✅ **添加资源检查**: 部署前自动检查服务器资源
- ✅ **添加优雅关闭**: `kill_timeout: 5000`, `listen_timeout: 10000`

### 3. 新增安全检查机制
- ✅ **服务器资源检查脚本**: `scripts/health-check/Check-Server-Resources.ps1`
  - 检查内存使用率（警告 >80%, 严重 >90%）
  - 检查磁盘空间（警告 >80%, 严重 >90%）
  - 检查CPU负载
  - 检查端口占用
  - 检查PM2进程状态
  - 检查数据库连接
  - 检查Redis连接

---

## 🛡️ 安全机制

### 1. 内存保护
- **测试环境**: 最大内存 500MB，超过自动重启
- **生产环境**: 最大内存 1GB，超过自动重启
- **Node.js堆内存**: 限制为 1024MB

### 2. 进程管理
- **自动重启**: `autorestart: true`
- **最大重启次数**: `max_restarts: 10`
- **最小运行时间**: `min_uptime: '10s'`
- **优雅关闭**: 5秒超时

### 3. 资源检查
部署前自动检查：
- 内存使用率
- 磁盘空间
- CPU负载
- 端口占用
- PM2进程状态
- 数据库连接
- Redis连接

如果发现问题，会提示用户确认是否继续部署。

---

## 📋 部署前检查清单

### 自动检查（脚本自动执行）
- [x] 服务器资源（内存、磁盘、CPU）
- [x] 端口占用情况
- [x] PM2进程状态
- [x] 数据库连接
- [x] Redis连接

### 手动检查（建议执行）
- [ ] 代码已通过测试
- [ ] 已在测试环境验证
- [ ] 数据库迁移脚本已测试
- [ ] 配置文件已更新
- [ ] 备份已创建

---

## 🚀 部署流程

### 测试环境部署
```powershell
# 1. 检查服务器资源（自动执行）
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试"

# 部署流程：
# 1. 自动检查服务器资源
# 2. 提交代码到Git
# 3. 构建前端
# 4. 部署后端（使用PM2配置，内存限制500MB）
# 5. 健康检查
```

### 生产环境部署
```powershell
# 1. 检查服务器资源（自动执行）
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"

# 部署流程：
# 1. 自动检查服务器资源
# 2. 二次确认（输入 YES）
# 3. Git工作流（develop → main）
# 4. 构建前端
# 5. 部署后端（使用PM2配置，内存限制1GB）
# 6. 健康检查
```

---

## ⚠️ 注意事项

### 1. 内存限制
- **测试环境**: 500MB（适合测试）
- **生产环境**: 1GB（适合生产）
- 如果应用需要更多内存，可以调整 `max_memory_restart` 值

### 2. 资源检查
- 如果内存使用率 >90%，部署会被阻止
- 如果磁盘使用率 >90%，部署会被阻止
- 如果CPU负载过高，会提示警告

### 3. PM2配置
- 生产环境使用单实例模式（`instances: 1`）
- 如需集群模式，可以修改 `instances` 和 `exec_mode`
- 但要注意内存使用（集群模式会启动多个进程）

### 4. 数据库迁移
- 部署脚本会自动运行 `prisma migrate deploy`
- 确保迁移脚本已测试
- 生产环境迁移失败会导致部署失败

---

## 🔧 故障排查

### 问题1: 部署后服务无法启动
```bash
# 检查PM2状态
ssh root@ieclub.online 'pm2 status'

# 查看日志
ssh root@ieclub.online 'pm2 logs ieclub-backend --lines 50'

# 检查端口占用
ssh root@ieclub.online 'lsof -i :3000'
```

### 问题2: 内存使用过高
```bash
# 检查内存使用
ssh root@ieclub.online 'free -h'

# 检查PM2进程内存
ssh root@ieclub.online 'pm2 monit'

# 如果内存不足，可以：
# 1. 增加 max_memory_restart 值
# 2. 优化代码
# 3. 升级服务器配置
```

### 问题3: 资源检查失败
```powershell
# 手动运行资源检查
.\scripts\health-check\Check-Server-Resources.ps1

# 根据提示解决问题：
# - 清理磁盘空间
# - 停止不必要的进程
# - 等待CPU负载降低
```

---

## 📊 监控建议

### 1. 实时监控
```bash
# PM2监控
pm2 monit

# 系统资源
htop

# 日志监控
pm2 logs --lines 100
```

### 2. 告警设置
- 内存使用率 >85%: 警告
- 内存使用率 >90%: 严重
- 磁盘使用率 >80%: 警告
- 磁盘使用率 >90%: 严重
- CPU负载 > CPU核心数: 警告

---

## ✅ 验证清单

部署完成后，请验证：

- [ ] 服务正常启动（PM2状态为 online）
- [ ] 健康检查通过（`/api/health`）
- [ ] 前端可以访问
- [ ] API可以正常调用
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 日志无错误

---

## 📝 更新日志

### 2025-11-05
- ✅ 修复测试环境启动文件路径
- ✅ 添加生产环境PM2配置
- ✅ 添加内存限制保护
- ✅ 添加服务器资源检查
- ✅ 添加部署前自动检查机制

---

## 🔗 相关文档

- [部署指南](Deployment_guide.md)
- [环境配置](../configuration/ENVIRONMENT_CONFIG.md)
- [故障排查指南](../debugging/SERVER_CONNECTION_ISSUE_2025_11_05.md)

