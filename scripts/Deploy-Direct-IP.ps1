#!/usr/bin/env pwsh
<parameter name="file_path">#!/usr/bin/env pwsh
<#
.SYNOPSIS
    直接使用IP地址部署（绕过Clash代理）
.DESCRIPTION
    使用服务器IP 39.108.160.112 直接连接
#>

param(
    [switch]$SkipProduction = $false
)

$SERVER_IP = "39.108.160.112"
$SERVER_USER = "root"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║    IEClub 直接IP部署脚本                ║" -ForegroundColor Magenta
Write-Host "║    服务器: $SERVER_IP          ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Write-Host "提示: 如果SSH仍然超时，请临时关闭Clash代理" -ForegroundColor Yellow
Write-Host "正在连接服务器IP: $SERVER_IP ..." -ForegroundColor Cyan
Write-Host ""

# 创建部署脚本
$deployScript = @'
#!/bin/bash
set -e

echo "========================================="
echo "  IEClub 服务器端部署脚本"
echo "========================================="
echo ""

BACKEND_DIR="/root/ieclub-backend"
cd $BACKEND_DIR

echo "[1/9] 停止所有PM2服务..."
pm2 delete all 2>/dev/null || echo "  没有运行的进程"
pm2 save --force

echo ""
echo "[2/9] 检查Node.js版本..."
NODE_VERSION=$(node --version)
echo "  当前版本: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "  需要升级到Node.js v20..."
    
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
    
    echo "  ✓ Node.js升级完成: $(node --version)"
fi

echo ""
echo "[3/9] 清理旧依赖..."
rm -rf node_modules package-lock.json
echo "  ✓ 清理完成"

echo ""
echo "[4/9] 安装生产依赖..."
npm install --production
echo "  ✓ 依赖安装完成"

echo ""
echo "[5/9] 验证环境变量..."
if [ ! -f .env ]; then
    echo "  ✗ 错误: .env文件不存在！"
    exit 1
fi
echo "  ✓ .env文件存在"

echo ""
echo "[6/9] 测试数据库连接..."
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
    console.log('OK');
  } catch (err) {
    console.log('ERROR:', err.message);
    process.exit(1);
  }
})();
" 2>&1)

if [[ "$DB_TEST" == *"OK"* ]]; then
    echo "  ✓ 数据库连接正常"
else
    echo "  ✗ 数据库连接失败: $DB_TEST"
    exit 1
fi

echo ""
echo "[7/9] 启动测试环境 (端口 3001)..."
pm2 start src/server.js \
  --name ieclub-staging \
  --node-args='--max-old-space-size=512' \
  -- --port=3001

sleep 3

STAGING_HEALTH=$(curl -s http://localhost:3001/api/health 2>&1 || echo 'FAILED')
if [[ "$STAGING_HEALTH" == *"ok"* ]] || [[ "$STAGING_HEALTH" == *"healthy"* ]]; then
    echo "  ✓ 测试环境启动成功"
    echo "    http://ieclub.online:3001"
else
    echo "  ✗ 测试环境启动失败"
    pm2 logs ieclub-staging --lines 10 --nostream
    exit 1
fi

SKIP_PROD="$1"
if [ "$SKIP_PROD" != "skip" ]; then
    echo ""
    echo "[8/9] 启动生产环境 (端口 3000)..."
    pm2 start src/server.js \
      --name ieclub-backend \
      --node-args='--max-old-space-size=1024' \
      -- --port=3000
    
    sleep 3
    
    PROD_HEALTH=$(curl -s http://localhost:3000/api/health 2>&1 || echo 'FAILED')
    if [[ "$PROD_HEALTH" == *"ok"* ]] || [[ "$PROD_HEALTH" == *"healthy"* ]]; then
        echo "  ✓ 生产环境启动成功"
        echo "    https://ieclub.online"
    else
        echo "  ✗ 生产环境启动失败"
        pm2 logs ieclub-backend --lines 10 --nostream
        exit 1
    fi
else
    echo ""
    echo "[8/9] 跳过生产环境部署"
fi

echo ""
echo "[9/9] 保存PM2配置..."
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
echo "  ✓ PM2配置已保存"

echo ""
echo "========================================="
echo "  部署完成！当前服务状态："
echo "========================================="
pm2 list

echo ""
echo "访问地址:"
echo "  测试环境: http://ieclub.online:3001"
if [ "$SKIP_PROD" != "skip" ]; then
    echo "  生产环境: https://ieclub.online"
fi
echo ""
'@

# 执行部署
$skipArg = if ($SkipProduction) { "skip" } else { "" }

try {
    Write-Host "正在上传并执行部署脚本..." -ForegroundColor Cyan
    
    # 使用IP地址连接
    $result = $deployScript | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${SERVER_USER}@${SERVER_IP}" "cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh && bash /tmp/deploy.sh $skipArg 2>&1; rm -f /tmp/deploy.sh"
    
    Write-Host $result
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║          部署成功完成！                 ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
        
        # 验证服务
        Write-Host "`n正在验证服务..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        
        try {
            $staging = Invoke-RestMethod -Uri "http://${SERVER_IP}:3001/api/health" -TimeoutSec 10
            Write-Host "  ✓ 测试环境: " -NoNewline -ForegroundColor Green
            Write-Host "http://ieclub.online:3001"
        } catch {
            Write-Host "  ⚠ 测试环境验证失败（可能需要等待）" -ForegroundColor Yellow
        }
        
        if (-not $SkipProduction) {
            try {
                $prod = Invoke-RestMethod -Uri "http://${SERVER_IP}:3000/api/health" -TimeoutSec 10
                Write-Host "  ✓ 生产环境: " -NoNewline -ForegroundColor Green
                Write-Host "https://ieclub.online"
            } catch {
                Write-Host "  ⚠ 生产环境验证失败（可能需要等待）" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
    } else {
        Write-Host "`n✗ 部署失败，退出码: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`n✗ SSH连接失败: $_" -ForegroundColor Red
    Write-Host "`n可能的解决方案:" -ForegroundColor Yellow
    Write-Host "  1. 临时关闭Clash代理" -ForegroundColor White
    Write-Host "  2. 在Clash配置中添加规则：" -ForegroundColor White
    Write-Host "     - IP-CIDR,39.108.160.112/32,DIRECT" -ForegroundColor Cyan
    Write-Host "  3. 或使用其他SSH客户端（如PuTTY）手动连接" -ForegroundColor White
    Write-Host ""
    exit 1
}

