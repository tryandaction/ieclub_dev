# ✅ Prisma CLI 权限问题修复完成

## 问题描述
在服务器部署过程中，每次执行 `git pull` 后，Prisma CLI 会失去执行权限，导致 `npx prisma migrate deploy` 命令失败，错误信息为：
```
EACCES: permission denied, open '/var/www/ieclub_dev/ieclub-backend/node_modules/.bin/prisma'
```

## 根本原因
Git 不会跟踪和恢复文件的执行权限。当从远程仓库拉取代码时，`node_modules/.bin/prisma` 文件会被重置为没有执行权限的状态。

## 解决方案
更新了服务器部署脚本 `/root/deploy-server.sh`，在以下三个关键节点修复 Prisma CLI 权限：

1. **Git pull 之后**: 立即修复因代码拉取而丢失的权限
2. **Prisma generate 之后**: 确保生成的文件有正确权限
3. **最终权限修复之后**: 防止批量权限设置覆盖 Prisma CLI 权限

### 修复函数
```bash
fix_prisma_permissions() {
    PRISMA_CLI_PATH="$BACKEND_DIR/node_modules/.bin/prisma"
    if [ -f "$PRISMA_CLI_PATH" ]; then
        chmod +x "$PRISMA_CLI_PATH"
        # 同时修复相关的 Prisma 二进制文件
        if [ -f "$BACKEND_DIR/node_modules/prisma/build/index.js" ]; then
            chmod +x "$BACKEND_DIR/node_modules/prisma/build/index.js"
        fi
        find "$BACKEND_DIR/node_modules/@prisma" -type f -name "*.node" -o -name "prisma-*" 2>/dev/null | while read file; do
            chmod +x "$file" 2>/dev/null || true
        done
    fi
}
```

## 验证结果
✅ Prisma CLI 权限已修复：
```bash
$ ls -la /var/www/ieclub_dev/ieclub-backend/node_modules/.bin/prisma
-rwxr-xr-x 1 www-data www-data 391 Oct 26 14:38 prisma
```

✅ 部署脚本测试成功：
- `npx prisma migrate deploy` 正常执行
- PM2 服务平滑重启成功
- 服务状态：online

## 部署脚本位置
- **当前脚本**: `/root/deploy-server.sh`（服务器）
- **备份脚本**: `/root/deploy-server.sh.backup`（服务器）

## 后续维护
此修复是永久性的，不需要手动干预。每次部署时脚本会自动确保 Prisma CLI 有正确的执行权限。

---
**修复日期**: 2025-10-26  
**修复人**: AI Assistant  
**测试状态**: ✅ 已通过完整部署测试

