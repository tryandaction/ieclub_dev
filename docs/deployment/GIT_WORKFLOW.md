# IEClub Git 工作流程 🌿

> **最后更新**: 2025-11-06
> **版本**: v2.0 - 增强生产部署安全性

---

## 📋 分支策略

IEClub 项目采用 **Git Flow** 分支管理策略：

```
develop (开发分支) ──→ main (生产分支) ──→ 服务器部署
    ↑                      ↑
    │                      │
  日常开发              正式发布
```

### 分支说明

| 分支 | 用途 | 部署环境 | 保护级别 |
|------|------|----------|----------|
| `develop` | 日常开发、测试 | 测试环境 (test.ieclub.online) | ⚠️ 中等 |
| `main` | 生产发布 | 生产环境 (ieclub.online) | 🔒 严格 |
| `feature/*` | 功能开发 | 本地 | 无 |
| `hotfix/*` | 紧急修复 | 本地 | 无 |

---

## 🔄 标准工作流程

### 1️⃣ 日常开发（本地 + develop）

```bash
# 在 develop 分支开发
git checkout develop

# 进行开发工作
# ... 编写代码、测试 ...

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到远程 develop
git push origin develop
```

### 2️⃣ 部署到测试环境

```powershell
# 从 develop 分支部署到测试环境
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试新功能"
```

**测试环境特点**:
- ✅ 从 `develop` 分支直接部署
- ✅ 无需合并到 main
- ✅ 快速迭代
- ✅ 内部测试

### 3️⃣ 部署到生产环境 ⚠️

```powershell
# 生产部署会自动执行 Git 工作流
cd C:\universe\GitHub_try\IEclub_dev
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "正式发布 v1.2.0"
```

**脚本自动执行的步骤**:

```
步骤1: 检查工作区状态
  ↓ 如有未提交更改，提示提交
  
步骤2: 推送 develop 分支（如果在 develop）
  ↓ git push origin develop
  
步骤3: 切换到 main 分支
  ↓ git checkout main
  
步骤4: 拉取远程 main 最新代码
  ↓ git pull origin main
  
步骤5: 合并 develop 到 main
  ↓ git merge develop --no-ff -m "[RELEASE] ..."
  
步骤6: 推送 main 分支到远程
  ↓ git push origin main
  
步骤7: 从 main 分支构建并部署
  ↓ 构建前端 → 部署前端 → 部署后端
  
步骤8: 健康检查
  ✅ 验证服务正常运行
```

---

## 🛡️ 安全机制

### 生产部署确认

生产部署需要输入 `YES`（大写）确认：

```
⚠️  您正在部署到生产环境！

请输入 'YES' 确认部署（大写）：
```

### 合并冲突处理

如果 `develop` 和 `main` 存在冲突，脚本会停止并提示：

```
❌ 合并失败！请解决冲突后重试

解决冲突步骤：
  1. 查看冲突文件: git status
  2. 编辑并解决冲突
  3. 标记为已解决: git add <文件>
  4. 完成合并: git commit
  5. 重新运行部署脚本
```

### 回滚机制

如果需要回滚到之前的版本：

```bash
# 查看提交历史
git log --oneline

# 回滚到指定版本
git checkout main
git reset --hard <commit-hash>
git push origin main --force

# 重新部署
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "回滚到稳定版本"
```

⚠️ **注意**: 强制推送 (--force) 需要谨慎操作！

---

## 🌳 完整工作流示例

### 场景：开发并发布新功能

```bash
# === 第一步：开发阶段 ===
git checkout develop
git pull origin develop

# 开发新功能
# ... 编写代码 ...

git add .
git commit -m "feat: 实现用户头像上传功能"
git push origin develop

# === 第二步：测试环境验证 ===
# 部署到测试环境
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "测试头像上传"

# 在 https://test.ieclub.online 测试功能
# 发现 bug，继续修复

git add .
git commit -m "fix: 修复头像上传大小限制问题"
git push origin develop

# 再次部署测试
.\scripts\deployment\Deploy-Staging.ps1 -Target all -Message "修复头像上传 bug"

# === 第三步：生产环境发布 ===
# 测试通过，部署到生产环境
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "发布头像上传功能 v1.2.0"

# 脚本会自动：
# 1. 合并 develop → main
# 2. 推送到 GitHub
# 3. 部署到生产服务器
```

---

## 🚨 紧急修复 (Hotfix)

如果生产环境出现紧急 bug：

```bash
# 从 main 创建 hotfix 分支
git checkout main
git checkout -b hotfix/critical-login-bug

# 快速修复
# ... 修复代码 ...

git add .
git commit -m "hotfix: 修复登录验证漏洞"

# 合并到 main
git checkout main
git merge hotfix/critical-login-bug --no-ff

# 同时合并回 develop
git checkout develop
git merge hotfix/critical-login-bug --no-ff

# 推送
git push origin main
git push origin develop

# 删除 hotfix 分支
git branch -d hotfix/critical-login-bug

# 立即部署
.\scripts\deployment\Deploy-Production.ps1 -Target all -Message "紧急修复：登录验证漏洞"
```

---

## 📊 分支状态查看

### 查看本地分支

```bash
git branch
# * develop
#   main
```

### 查看远程分支

```bash
git branch -r
# origin/develop
# origin/main
```

### 查看所有分支（包括远程）

```bash
git branch -a
```

### 查看分支提交历史

```bash
# 图形化查看
git log --graph --oneline --all --decorate

# 比较 develop 和 main 的差异
git log main..develop --oneline
```

---

## 🔧 常用命令速查

| 操作 | 命令 |
|------|------|
| 切换到 develop | `git checkout develop` |
| 切换到 main | `git checkout main` |
| 查看当前分支 | `git branch --show-current` |
| 查看工作区状态 | `git status` |
| 拉取最新代码 | `git pull origin develop` |
| 推送到远程 | `git push origin develop` |
| 合并分支 | `git merge develop --no-ff` |
| 查看提交历史 | `git log --oneline` |
| 撤销未提交更改 | `git checkout -- <file>` |
| 重置到某个提交 | `git reset --hard <commit>` |

---

## ✅ 最佳实践

1. **永远在 develop 分支开发**
   - ❌ 不要直接在 main 分支修改代码
   - ✅ 所有开发工作在 develop 完成

2. **先测试后发布**
   - ❌ 不要跳过测试环境直接部署生产
   - ✅ 总是先在测试环境验证功能

3. **使用有意义的提交信息**
   - ❌ `git commit -m "update"`
   - ✅ `git commit -m "feat: 添加用户头像上传功能"`

4. **提交信息格式**
   ```
   feat: 新功能
   fix: 修复 bug
   docs: 文档更新
   style: 代码格式调整
   refactor: 代码重构
   test: 测试相关
   chore: 构建/工具相关
   ```

5. **小步提交，频繁推送**
   - ✅ 每完成一个小功能就提交
   - ✅ 每天至少推送一次到远程

6. **保持 develop 和 main 同步**
   - ✅ 定期将 develop 合并到 main
   - ✅ 避免两个分支差异过大

---

## 📞 遇到问题？

### 问题1: 忘记在哪个分支了

```bash
git branch --show-current
# 输出: develop 或 main
```

### 问题2: 不小心在 main 分支修改了代码

```bash
# 保存更改
git stash

# 切换到 develop
git checkout develop

# 恢复更改
git stash pop
```

### 问题3: 合并冲突了

```bash
# 查看冲突文件
git status

# 编辑冲突文件，搜索 <<<<<<<, =======, >>>>>>>
# 解决冲突后：
git add <冲突文件>
git commit -m "resolve merge conflict"
```

### 问题4: 推送失败

```bash
# 先拉取远程更改
git pull origin develop

# 再推送
git push origin develop
```

---

## 🎯 总结

**IEClub Git 工作流核心原则**:

1. ✅ **develop** = 开发分支（日常工作）
2. ✅ **main** = 生产分支（正式发布）
3. ✅ **测试环境** ← develop
4. ✅ **生产环境** ← main (自动合并 develop)
5. ✅ **安全第一** - 生产部署需要确认

**一键部署**:
```powershell
# 测试环境（快速）
.\scripts\deployment\Deploy-Staging.ps1 -Target all

# 生产环境（安全）
.\scripts\deployment\Deploy-Production.ps1 -Target all
```

**记住**: 
- 🔧 develop 用于开发
- 🚀 main 用于发布
- 🧪 先测试后发布
- 🛡️ 生产部署需确认

---

## 📚 相关文档

- [部署指南](./Deployment_guide.md)
- [环境配置](../configuration/README.md)
- [快速开始](../../scripts/README.md)

