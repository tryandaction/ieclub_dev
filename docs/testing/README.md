# 测试文档目录

本目录包含IEClub项目的测试文档和测试结果报告。

## 📁 文档列表

### 测试报告

- **[登录功能测试结果 (2025-11-05)](./LOGIN_TEST_RESULTS_2025_11_05.md)**
  - 完整的登录功能测试报告
  - 包含4项测试的详细结果
  - Content-Type问题分析与解决方案
  - 测试工具使用说明

## 🧪 测试工具

测试脚本位于 `scripts/health-check/` 目录：

### 1. create-test-user-simple.js
创建测试用户的脚本

**使用方法**:
```bash
scp scripts/health-check/create-test-user-simple.js root@ieclub.online:/root/IEclub_dev/ieclub-backend/
ssh root@ieclub.online 'cd /root/IEclub_dev/ieclub-backend && node create-test-user-simple.js'
```

### 2. test-login.sh
自动化登录测试脚本

**使用方法**:
```bash
scp scripts/health-check/test-login.sh root@ieclub.online:/tmp/
ssh root@ieclub.online 'bash /tmp/test-login.sh production'
```

### 3. Check-Backend-Health.ps1
Windows环境的健康检查脚本

**使用方法**:
```powershell
cd scripts
.\Check-Backend-Health.ps1
```

## 📊 测试覆盖范围

### 已测试功能

- ✅ 健康检查端点
- ✅ 用户登录 (正常流程)
- ✅ 用户登录 (错误处理)
- ✅ JWT Token生成
- ✅ JWT Token验证
- ✅ 用户信息获取

### 待测试功能

- ⏳ 用户注册
- ⏳ 邮箱验证码发送
- ⏳ 密码重置
- ⏳ 用户信息更新
- ⏳ 积分系统
- ⏳ 活动管理

## 🔗 相关文档

- **部署指南**: `docs/deployment/Deployment_guide.md`
- **测试工具文档**: `scripts/health-check/README.md`
- **API文档**: TBD

---

**最后更新**: 2025-11-05

