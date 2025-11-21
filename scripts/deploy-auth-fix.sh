#!/bin/bash
# 部署认证系统修复到测试服务器

echo "🚀 开始部署认证系统修复..."

# 服务器信息
SERVER="root@test.ieclub.online"
PROJECT_DIR="/root/IEclub_dev_staging"

# 1. 上传修复的文件
echo "📤 上传修复文件..."

# 上传 emailDomainChecker
scp ieclub-backend/src/utils/emailDomainChecker.js $SERVER:$PROJECT_DIR/ieclub-backend/src/utils/

# 上传 handleValidation 中间件
scp ieclub-backend/src/middleware/handleValidation.js $SERVER:$PROJECT_DIR/ieclub-backend/src/middleware/

# 上传 authController
scp ieclub-backend/src/controllers/authController.js $SERVER:$PROJECT_DIR/ieclub-backend/src/controllers/

# 上传 routes/index.js
scp ieclub-backend/src/routes/index.js $SERVER:$PROJECT_DIR/ieclub-backend/src/routes/

# 上传 config/index.js
scp ieclub-backend/src/config/index.js $SERVER:$PROJECT_DIR/ieclub-backend/src/config/

# 上传诊断脚本
scp ieclub-backend/diagnose-auth.js $SERVER:$PROJECT_DIR/ieclub-backend/

echo "✅ 文件上传完成"

# 2. 在服务器上运行诊断
echo ""
echo "🔍 运行诊断脚本..."
ssh $SERVER "cd $PROJECT_DIR/ieclub-backend && node diagnose-auth.js"

# 3. 重启服务
echo ""
echo "🔄 重启服务..."
ssh $SERVER "cd $PROJECT_DIR/ieclub-backend && pm2 restart ieclub-backend"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 查看日志:"
echo "   ssh $SERVER 'pm2 logs ieclub-backend --lines 50'"
echo ""
echo "🧪 测试登录:"
echo "   curl -X POST https://test.ieclub.online/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"12310203@mail.sustech.edu.cn\",\"password\":\"123123123\"}'"

