# 配置文档

本目录包含 IEClub 后端系统的关键配置说明文档。

## 📋 核心配置文档

### [环境变量配置说明](./ENVIRONMENT_VARIABLES.md) ⭐⭐⭐
**用途**: 完整的环境变量配置指南

**内容包括**：
- 所有环境变量的详细说明
- 必需和可选配置项
- 安全最佳实践
- 配置示例

**快速开始**：
```bash
cd ieclub-backend
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

---

### [邮件服务配置指南](./EMAIL_SETUP_GUIDE.md) ⭐⭐⭐
**用途**: QQ邮箱和学校邮箱的详细配置说明

**内容包括**：
- QQ 邮箱配置步骤（获取授权码）
- 学校邮箱配置方法
- 常见问题排查
- 安全最佳实践

**快速开始**：
```env
# QQ 邮箱配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_USER=your_qq_number@qq.com
EMAIL_PASSWORD=your_qq_email_auth_code
```

---

### [环境配置对照表](./ENVIRONMENT_CONFIG.md) ⭐⭐
**用途**: 开发/测试/生产三环境的配置对比

**内容包括**：
- 三环境配置差异对比
- 配置检查清单
- 常见配置错误
- 配置文件模板

**适用场景**：
- 部署前检查配置
- 理解不同环境的差异
- 避免配置错误

---

### [邮箱域名白名单配置](./EMAIL_DOMAIN_WHITELIST.md) ⭐
**用途**: 限制注册邮箱域名

**快速开始**：
```env
# 在 .env 文件中配置
ALLOWED_EMAIL_DOMAINS=sustech.edu.cn,mail.sustech.edu.cn
```

---

### [安全配置指南](./SECURITY_GUIDE.md)
**用途**: 系统安全配置说明

---

### [Clash代理配置](./CLASH_PROXY_SETUP.md)
**用途**: 解决SSH连接问题的代理配置

---

## 🔒 安全提示

⚠️ **重要**：
- `.env` 文件已在 `.gitignore` 中，**不会被提交到 Git**
- 你的密码和敏感信息只会保存在本地的 `.env` 文件中
- 永远不要将包含真实密码的文件提交到 Git

---

## 📚 相关文档

- [部署指南](../deployment/Deployment_guide.md) - 完整的部署流程
- [开发者指南](../DEVELOPER_GUIDE.md) - 开发者完整指南
- [文档索引](../INDEX.md) - 所有文档的索引

---

## 🆘 需要帮助？

如果遇到配置问题：
1. 查看对应的配置文档
2. 检查 `.env` 文件配置是否正确
3. 查看后端日志：`pm2 logs ieclub-backend`
4. 运行测试脚本：`node scripts/test-email-service.js`

---

**最后更新**: 2025-11-09
