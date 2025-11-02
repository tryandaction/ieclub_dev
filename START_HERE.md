# 👋 从这里开始

## 🚀 快速启动（3 步）

### 1️⃣ 确保已安装 Node.js
```powershell
node --version  # 应该 >= 18.0.0
```
如果未安装：https://nodejs.org/

### 2️⃣ 安装依赖（首次运行）
```powershell
# 后端
cd ieclub-backend
npm install

# 前端
cd ../ieclub-web
npm install
```

### 3️⃣ 启动服务
```powershell
# 回到项目根目录
cd ..

# 一键启动
.\Start-Services.ps1
```

✅ 完成！浏览器会自动打开 http://localhost:5173

---

## ⚠️ 遇到问题？

### 数据库连接错误
```
❌ Can't reach database server at `127.0.0.1:3306`
```

**解决方案**：查看 [DATABASE_SETUP.md](DATABASE_SETUP.md)

快速方案：
```powershell
# 安装 Docker Desktop: https://www.docker.com/products/docker-desktop/
cd ieclub-backend
docker-compose up -d mysql redis
Start-Sleep -Seconds 15
npm run migrate
npm run init:rbac
```

### PowerShell 语法错误
```
错误："&&"不是此版本中的有效语句分隔符
```

**解决方案**：使用 `;` 代替 `&&`
```powershell
# ❌ 错误
cd ieclub-web && npm run dev

# ✅ 正确
cd ieclub-web; npm run dev

# 或使用启动脚本
.\Start-Services.ps1
```

### 其他问题
查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 获取完整的故障排除指南。

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| **[STARTUP_GUIDE.md](STARTUP_GUIDE.md)** | 📖 详细启动指南 |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | ⚡ 快速参考卡片 |
| **[DATABASE_SETUP.md](DATABASE_SETUP.md)** | 🗄️ 数据库设置 |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 🔧 故障排除 |
| **[README.md](README.md)** | 📋 项目总览 |

---

## 🎯 访问地址

启动成功后：

- **前端**：http://localhost:5173
- **后端**：http://localhost:3000
- **健康检查**：http://localhost:3000/health

---

## 💡 提示

1. **首次启动**需要安装依赖和设置数据库
2. **日常开发**直接运行 `.\Start-Services.ps1`
3. **遇到问题**先查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**祝开发顺利！** 🚀

