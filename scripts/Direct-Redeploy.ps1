#!/usr/bin/env pwsh
<#
.SYNOPSIS
    直接SSH重新部署脚本 - 使用单一SSH会话
.DESCRIPTION
    在一个SSH会话中完成所有操作，避免多次连接
#>

param(
    [switch]$SkipProduction = $false
)

$SERVER = "root@ieclub.online"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    IEClub 直接重新部署脚本              ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "正在连接服务器..." -ForegroundColor Cyan

# 创建部署脚本内容
$deployScript = @'
#!/bin/bash
set -e

BACKEND_DIR="/root/ieclub-backend"
STAGING_PORT=3001
PROD_PORT=3000

echo ""
echo "==> 步骤 1/8: 停止所有PM2服务"
pm2 delete all 2>/dev/null || echo "  (没有运行的进程)"
pm2 save --force

echo ""
echo "==> 步骤 2/8: 检查Node.js版本"
NODE_VERSION=$(node --version)
echo "  当前版本: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "  升级Node.js到v20 LTS..."
    
    # 尝试使用nvm
    if command -v nvm &> /dev/null; then
        echo "  使用nvm升级..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        nvm alias default 20
    else
        echo "  使用apt升级..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    NODE_VERSION=$(node --version)
    echo "  ✓ Node.js已升级到: $NODE_VERSION"
else
    echo "  ✓ Node.js版本已经是v20"
fi

echo ""
echo "==> 步骤 3/8: 清理并重新安装后端依赖"
cd $BACKEND_DIR
rm -rf node_modules package-lock.json
npm install --production
echo "  ✓ 依赖安装完成"

echo ""
echo "==> 步骤 4/8: 验证环境变量配置"
if [ ! -f .env ]; then
    echo "  ✗ .env文件不存在！"
    exit 1
fi

# 检查关键环境变量
for var in JWT_SECRET SENDGRID_API_KEY DB_HOST DB_USER DB_PASSWORD DB_NAME; do
    if ! grep -q "^$var=" .env; then
        echo "  ⚠ 警告: $var 可能未配置"
    fi
done
echo "  ✓ 环境变量验证完成"

echo ""
echo "==> 步骤 5/8: 测试数据库连接"
DB_TEST=$(node -e "
const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await conn.end();
    console.log('DB_OK');
  } catch (err) {
    console.log('DB_ERROR:', err.message);
    process.exit(1);
  }
})();
" 2>&1)

if [[ "$DB_TEST" == *"DB_OK"* ]]; then
    echo "  ✓ 数据库连接正常"
else
    echo "  ✗ 数据库连接失败: $DB_TEST"
    exit 1
fi

echo ""
echo "==> 步骤 6/8: 部署测试环境 (端口 $STAGING_PORT)"
pm2 delete ieclub-staging 2>/dev/null || true
pm2 start src/server.js \
  --name ieclub-staging \
  --node-args='--max-old-space-size=512' \
  -- --port=$STAGING_PORT

sleep 3

STAGING_HEALTH=$(curl -s http://localhost:$STAGING_PORT/api/health || echo 'FAILED')
if [[ "$STAGING_HEALTH" == *"ok"* ]] || [[ "$STAGING_HEALTH" == *"healthy"* ]]; then
    echo "  ✓ 测试环境部署成功！"
    echo "    访问地址: http://ieclub.online:$STAGING_PORT"
else
    echo "  ✗ 测试环境启动失败"
    pm2 logs ieclub-staging --lines 20 --nostream
    exit 1
fi

SKIP_PROD="$1"
if [ "$SKIP_PROD" != "skip" ]; then
    echo ""
    echo "==> 步骤 7/8: 部署生产环境 (端口 $PROD_PORT)"
    echo "  开始部署生产环境..."
    
    pm2 delete ieclub-backend 2>/dev/null || true
    pm2 start src/server.js \
      --name ieclub-backend \
      --node-args='--max-old-space-size=1024' \
      -- --port=$PROD_PORT
    
    sleep 3
    
    PROD_HEALTH=$(curl -s http://localhost:$PROD_PORT/api/health || echo 'FAILED')
    if [[ "$PROD_HEALTH" == *"ok"* ]] || [[ "$PROD_HEALTH" == *"healthy"* ]]; then
        echo "  ✓ 生产环境部署成功！"
        echo "    访问地址: https://ieclub.online"
    else
        echo "  ✗ 生产环境启动失败"
        pm2 logs ieclub-backend --lines 20 --nostream
        exit 1
    fi
else
    echo ""
    echo "  ⚠ 已跳过生产环境部署"
fi

echo ""
echo "==> 步骤 8/8: 保存PM2配置"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "  ✓ PM2配置已保存"

echo ""
echo "==> 部署完成！查看服务状态"
pm2 list

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   部署成功完成！                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "测试环境: http://ieclub.online:$STAGING_PORT"
if [ "$SKIP_PROD" != "skip" ]; then
    echo "生产环境: https://ieclub.online"
fi
echo ""
'@

# 执行部署
$skipArg = if ($SkipProduction) { "skip" } else { "" }

try {
    # 使用单一SSH会话执行整个脚本
    $deployScript | ssh $SERVER "cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh && bash /tmp/deploy.sh $skipArg; rm /tmp/deploy.sh"
    
    Write-Host "`n✓ 部署完成！" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "`n✗ 部署失败: $_" -ForegroundColor Red
    exit 1
}

