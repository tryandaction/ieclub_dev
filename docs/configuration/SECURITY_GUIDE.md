# 🔐 代码安全指南

## ⚠️ 重要提醒

**永远不要将敏感信息提交到 Git 仓库！**

GitHub 和其他代码托管平台会自动扫描代码中的敏感信息，一旦检测到会阻止推送。

---

## 🚫 绝对不能提交的敏感信息

### 1. API Keys 和密钥
- ❌ SendGrid API Key: `SG.xxxxx...`
- ❌ 微信小程序密钥: `AppSecret`
- ❌ 支付密钥: 支付宝、微信支付的 API Key
- ❌ 云服务密钥: 阿里云、腾讯云、AWS 等
- ❌ 第三方服务密钥: 短信服务、对象存储等

### 2. 数据库凭证
- ❌ 数据库密码
- ❌ 数据库连接字符串（包含密码）
- ❌ Redis 密码

### 3. 系统凭证
- ❌ JWT Secret
- ❌ Session Secret
- ❌ 加密盐值

### 4. 个人信息
- ❌ 邮箱地址
- ❌ 手机号码
- ❌ 身份证号
- ❌ 真实姓名（非必要情况下）

### 5. 服务器信息
- ❌ 服务器 SSH 密码
- ❌ 服务器 IP（非必要情况下）
- ❌ 内网地址

---

## ✅ 正确的做法

### 1. 使用环境变量

**在代码中使用占位符**：

```javascript
// ✅ 正确
const apiKey = process.env.SENDGRID_API_KEY;
const dbPassword = process.env.DB_PASSWORD;

// ❌ 错误
const apiKey = 'SG.xxxxx...';
const dbPassword = 'mypassword123';
```

### 2. 使用配置模板

**提交模板文件，不提交实际配置**：

```bash
# ✅ 提交到 Git
.env.template
.env.example
env.production.template

# ❌ 不提交
.env
.env.local
.env.production
.env.staging
```

**模板文件示例** (`.env.template`):

```env
# SendGrid 邮件服务
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key_here
EMAIL_FROM=IEClub <your-verified-email@example.com>

# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/database_name

# JWT 密钥
JWT_SECRET=your_jwt_secret_here
```

### 3. 使用 .gitignore

**确保敏感文件不会被提交**：

```gitignore
# 环境变量文件
.env
.env.local
.env.*.local
.env.production
.env.staging

# 配置文件
config/production.json
config/secrets.json

# 临时文件
*.log
*.key
*.pem
```

### 4. 文档中使用占位符

**在文档中展示配置时，使用占位符**：

```markdown
# ✅ 正确的文档示例

## SendGrid 配置

\`\`\`env
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=IEClub <your-verified-email@example.com>
\`\`\`

# ❌ 错误的文档示例（真实值）

## SendGrid 配置

\`\`\`env
EMAIL_PASSWORD=SG.REAL_API_KEY_SHOWN_HERE_BAD_PRACTICE
EMAIL_FROM=IEClub <real-email@example.com>
\`\`\`
```

---

## 🔍 如何检查是否泄露敏感信息

### 方法1：使用 grep 搜索

```bash
# 搜索可能的 API Key
git grep -i "api[_-]key"
git grep -i "sendgrid"
git grep -i "SG\."

# 搜索可能的密码
git grep -i "password.*="
git grep -i "secret.*="

# 搜索邮箱和手机号
git grep -E "[0-9]{11}"
git grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
```

### 方法2：使用工具

```bash
# 安装 gitleaks (敏感信息扫描工具)
# Windows (使用 Chocolatey)
choco install gitleaks

# 扫描当前仓库
gitleaks detect --source .

# 扫描历史提交
gitleaks detect --source . --verbose
```

---

## 🚨 如果已经提交了敏感信息怎么办？

### 1. 立即撤销密钥

如果是 API Key：
- ✅ **立即前往服务商平台撤销该密钥**
- ✅ **生成新的密钥并更新服务器配置**

如果是密码：
- ✅ **立即修改密码**
- ✅ **检查是否有未授权访问**

### 2. 从 Git 历史中删除

**警告**: 以下操作会改写 Git 历史，需要谨慎操作！

```bash
# 方法1: 使用 git filter-branch (不推荐，已过时)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# 方法2: 使用 BFG Repo-Cleaner (推荐)
# 1. 下载 BFG: https://rtyley.github.io/bfg-repo-cleaner/
# 2. 创建敏感信息列表
echo "your-leaked-api-key-here" > passwords.txt

# 3. 运行 BFG
java -jar bfg.jar --replace-text passwords.txt

# 4. 清理并强制推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

### 3. 通知团队

- ✅ 通知所有有权限访问的团队成员
- ✅ 告知他们需要更新本地配置
- ✅ 确认没有使用旧的密钥

---

## 📋 GitHub Push Protection

GitHub 会自动检测并阻止包含以下敏感信息的推送：

1. **API Keys**
   - AWS Access Key
   - Azure Connection String
   - Google API Key
   - SendGrid API Key
   - 等等...

2. **密钥和令牌**
   - GitHub Token
   - GitLab Token
   - Slack Token
   - 等等...

3. **数据库凭证**
   - MongoDB Connection String
   - PostgreSQL Connection String
   - MySQL Connection String

**当推送被阻止时**：

```bash
remote: error: GH013: Repository rule violations found for refs/heads/develop.
remote:
remote: - GITHUB PUSH PROTECTION
remote:   —————————————————————————————————————————
remote:     Resolve the following violations before pushing again
remote:
remote:     - Push cannot contain secrets
```

**解决方案**：
1. 撤销该密钥
2. 从代码中删除敏感信息
3. 使用环境变量替代
4. 重新提交

---

## 📚 最佳实践总结

### ✅ DO（应该做的）

1. **使用环境变量** 存储所有敏感信息
2. **提交模板文件** 而不是实际配置
3. **配置 .gitignore** 忽略敏感文件
4. **定期扫描** 检查是否有敏感信息泄露
5. **使用占位符** 在文档中展示配置示例
6. **最小权限原则** 只给必要的服务器和人员分配权限
7. **定期轮换密钥** 定期更新 API Key 和密码

### ❌ DON'T（不应该做的）

1. **不要硬编码** 敏感信息在代码中
2. **不要提交** 包含敏感信息的文件
3. **不要在文档中** 展示真实的密钥和密码
4. **不要共享** 生产环境的密钥
5. **不要使用** 简单或默认密码
6. **不要忽略** GitHub 的安全警告
7. **不要在公开场合** 讨论具体的密钥值

---

## 🔗 相关资源

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Push Protection](https://docs.github.com/en/code-security/secret-scanning/working-with-secret-scanning-and-push-protection)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitLeaks](https://github.com/gitleaks/gitleaks)

---

## 💡 额外建议

### 对于团队协作

1. **建立安全规范** 文档，要求所有成员遵守
2. **Code Review** 在合并前检查是否有敏感信息
3. **CI/CD 集成** 在 CI 流程中自动扫描敏感信息
4. **使用密钥管理服务** 如 AWS Secrets Manager、HashiCorp Vault

### 对于服务器部署

1. **使用环境变量注入** 通过 CI/CD 工具注入环境变量
2. **使用云服务的密钥管理** 利用云平台的密钥管理服务
3. **限制文件权限** 确保配置文件只有运行用户可读

```bash
# 设置 .env 文件权限
chmod 600 /path/to/.env
chown www-data:www-data /path/to/.env
```

---

**记住**: 一旦敏感信息泄露，最好的做法是立即撤销并更换，而不是试图"隐藏"它！🔒

