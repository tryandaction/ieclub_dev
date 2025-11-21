# ⚠️ IEClub 待办事项

> 📌 **更新**: 2025-11-21  
> �� **状态**: ✅ 测试环境就绪，待验证后部署生产

---

## 🎯 您需要完成的操作（共3步，约10分钟）

### 步骤1：测试环境注册管理员（5分钟）

```powershell
cd c:\universe\GitHub_try\IEclub_dev
pwsh .\scripts\admin\setup-admin-complete.ps1
```

- 脚本会自动发送验证码、注册、设置管理员权限
- 邮箱：`12310203@mail.sustech.edu.cn`
- 跟随提示输入密码即可

---

### 步骤2：测试功能（3分钟）

```powershell
pwsh .\scripts\test\test-staging-api.ps1
```

测试项目：
- ✅ 健康检查
- ✅ 图形验证码
- ✅ 邮件验证码
- ✅ 注册登录

---

### 步骤3：部署到生产环境（2分钟）

确认测试无误后：

```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target backend -Message "修复验证码+新增图形验证码"
```

- 需要输入 `YES` 确认
- 自动合并分支、部署、重启服务

---

## 🔧 可选操作

### 添加测试环境白名单

```powershell
pwsh .\scripts\admin\add-whitelist.ps1
```

- 输入邮箱，多个用分号 `;` 分隔
- 例如：`test1@qq.com;test2@gmail.com`

---

## 📊 环境状态

| 环境 | 地址 | 状态 |
|------|------|------|
| **测试** | https://test.ieclub.online | ✅ 已部署 |
| **生产** | https://ieclub.online | ⏳ 待部署 |

### 已完成配置（无需操作）

- ✅ 图形验证码服务
- ✅ 邮件服务（QQ邮箱）
- ✅ 测试环境白名单（您的邮箱已添加）
- ✅ 生产环境邮箱策略（只允许学校邮箱）
- ✅ PM2服务配置

---

## 📂 重要文件位置

- `README.md` - 项目介绍
- `DEVELOPMENT_ROADMAP.md` - 开发规划
- `docs/AUTH_QUICK_START.md` - API文档
- `scripts/admin/` - 管理员工具
- `scripts/deployment/` - 部署脚本
- `scripts/test/` - 测试脚本

---

**下一步**: 完成步骤1-3后，生产环境即可正常使用 ✅
