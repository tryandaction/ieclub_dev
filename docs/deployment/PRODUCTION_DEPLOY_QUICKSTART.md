# 生产环境部署快速指南 🚀

> **最后更新**: 2025-11-06  
> **版本**: v2.0 - 新增自动 Git 工作流  
> **用时**: 约 5-10 分钟

---

## ⚡ 快速部署（一条命令）

```powershell
# 在项目根目录执行
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布 v1.2.0"
```

**脚本会自动完成**:
- ✅ 检查并提交未保存的更改
- ✅ 从 develop 分支推送到远程
- ✅ 自动切换到 main 分支
- ✅ 合并 develop → main
- ✅ 推送 main 到 GitHub
- ✅ 构建并部署所有端
- ✅ 健康检查验证

---

## 🔄 完整的 Git 工作流

### 脚本自动执行的步骤

```
第1步: 检查工作区状态 ✅
  ├─ 如有未提交更改 → 提示提交
  └─ 工作区干净 → 继续

第2步: 推送 develop 分支（如在 develop） ✅
  └─ git push origin develop

第3步: 切换到 main 分支 ✅
  └─ git checkout main

第4步: 更新 main 分支 ✅
  └─ git pull origin main

第5步: 合并 develop 到 main ✅
  └─ git merge develop --no-ff

第6步: 推送 main 到 GitHub ✅
  └─ git push origin main

第7步: 构建和部署 ✅
  ├─ 构建用户网页
  ├─ 部署用户网页
  ├─ 构建管理后台
  ├─ 部署管理后台
  └─ 部署后端服务

第8步: 健康检查 ✅
  ├─ https://ieclub.online
  ├─ https://ieclub.online/admin
  └─ https://ieclub.online/api/health
```

---

## 📋 部署前检查清单

### ✅ 必须完成

- [ ] 在测试环境验证所有功能正常
- [ ] 数据库备份已完成
- [ ] 知道当前 main 分支的最后提交（回滚用）
- [ ] 确认 develop 分支所有更改已提交

### ✅ 推荐完成

- [ ] 通知团队即将部署
- [ ] 查看 develop 和 main 的差异
- [ ] 准备回滚方案

---

## 💻 执行命令详解

### 部署所有端（推荐）

```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布"
```

### 仅部署用户网页

```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target web -Message "更新用户界面"
```

### 仅部署管理后台

```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target admin -Message "更新管理后台"
```

### 仅部署后端

```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target backend -Message "修复后端 bug"
```

---

## ⚠️ 重要提示

### 1. 生产确认

脚本会要求输入 `YES`（大写）确认：

```
⚠️  您正在部署到生产环境！

请输入 'YES' 确认部署（大写）：
```

### 2. 分支检查

- ✅ 脚本会自动处理分支切换
- ✅ 自动合并 develop → main
- ⚠️ 如有冲突，脚本会停止并提示解决

### 3. 合并冲突处理

如果出现合并冲突：

```bash
# 1. 查看冲突文件
git status

# 2. 编辑并解决冲突（搜索 <<<<<<<, =======, >>>>>>>）

# 3. 标记为已解决
git add <冲突文件>

# 4. 完成合并
git commit -m "resolve merge conflict"

# 5. 重新运行部署脚本
.\scripts\deployment\Deploy-Production.ps1 -Target all
```

---

## 📊 部署后验证

### 自动健康检查

脚本会自动检查以下URL：

- ✅ https://ieclub.online（用户网页）
- ✅ https://ieclub.online/admin（管理后台）
- ✅ https://ieclub.online/api/health（后端API）

### 手动验证

```bash
# 查看后端日志
ssh root@ieclub.online 'pm2 logs ieclub-backend --lines 50'

# 查看服务状态
ssh root@ieclub.online 'pm2 status'

# 查看系统资源
ssh root@ieclub.online 'htop'
```

---

## 🔙 紧急回滚

### 方法1: 快速回滚到上一个版本

```bash
# SSH 登录服务器
ssh root@ieclub.online

# 查看提交历史
cd /root/IEclub_dev/ieclub-backend
git log --oneline -10

# 回滚到指定版本
git checkout main
git reset --hard <上一个稳定版本的 commit-hash>
git push origin main --force

# 重新部署
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "回滚到稳定版本"
```

### 方法2: 使用 Git revert（推荐，保留历史）

```bash
# 本地执行
git checkout main
git revert <有问题的 commit-hash>
git push origin main

# 重新部署
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "修复问题"
```

---

## 🎯 使用场景示例

### 场景1: 日常功能发布

```bash
# 1. 在 develop 开发完成
git checkout develop
git add .
git commit -m "feat: 添加新功能"
git push origin develop

# 2. 部署测试环境验证
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"

# 3. 测试通过，部署生产
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "发布新功能 v1.2.0"
```

### 场景2: 紧急修复

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/critical-bug

# 2. 快速修复
# ... 修复代码 ...
git add .
git commit -m "hotfix: 修复关键 bug"

# 3. 合并到 main 和 develop
git checkout main
git merge hotfix/critical-bug --no-ff
git push origin main

git checkout develop
git merge hotfix/critical-bug --no-ff
git push origin develop

# 4. 立即部署
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "紧急修复"
```

### 场景3: 仅更新前端

```bash
# 仅修改了前端代码
.\scripts\deployment\Deploy-Production.ps1 -Target web -Message "更新用户界面"
```

---

## 📞 常见问题

### Q1: 部署卡在某个步骤怎么办？

按 `Ctrl+C` 中断脚本，检查日志后重新运行。

### Q2: 忘记在哪个分支了？

```bash
git branch --show-current
```

### Q3: 如何查看 develop 和 main 的差异？

```bash
git log main..develop --oneline
```

### Q4: 部署失败如何回滚？

参考上面的"紧急回滚"部分。

### Q5: 如何跳过确认直接部署？

```powershell
# ⚠️ 不推荐用于生产环境
.\scripts\deployment\Deploy-Production.ps1 -Target all -SkipConfirmation
```

---

## 📚 相关文档

- **完整指南**: [Deployment_guide.md](./Deployment_guide.md)
- **Git 工作流**: [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) ⭐⭐⭐
- **检查清单**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **快速参考**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## ✅ 总结

**一键部署命令**:
```powershell
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "发布消息"
```

**核心特性**:
- ✅ 自动 Git 工作流（develop → main）
- ✅ 安全确认机制
- ✅ 自动健康检查
- ✅ 完整错误处理

**记住**:
- 🧪 先在测试环境验证
- 🔒 生产部署需要输入 YES 确认
- 📊 部署后检查日志和服务状态
- 🔙 准备好回滚方案

---

**准备好了吗？开始部署吧！** 🚀

