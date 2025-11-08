# ==========================================================
# 修复测试环境 Nginx 配置脚本
# ==========================================================
# 用途: 检查并修复 test.ieclub.online 的 Nginx API 代理配置
# ==========================================================

param(
    [string]$ServerHost = "ieclub.online",
    [int]$ServerPort = 22,
    [string]$ServerUser = "root"
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

Write-Section "修复测试环境 Nginx 配置"

# 1. 检查后端服务是否运行
Write-Info "1️⃣ 检查后端服务状态..."
$pm2Status = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 status staging-backend 2>&1"
if ($pm2Status -match "online") {
    Write-Success "后端服务正在运行"
} else {
    Write-Error "后端服务未运行！"
    Write-Info "尝试启动后端服务..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev_staging/ieclub-backend && pm2 start ecosystem.staging.config.js 2>&1"
    Start-Sleep -Seconds 3
}

# 2. 检查端口3001是否监听
Write-Info "2️⃣ 检查端口3001监听状态..."
$portCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "netstat -tlnp 2>/dev/null | grep ':3001 ' || ss -tlnp 2>/dev/null | grep ':3001 ' || echo 'NOT_FOUND'"
if ($portCheck -match "3001") {
    Write-Success "端口3001正在监听"
} else {
    Write-Error "端口3001未监听！"
    Write-Info "检查后端服务日志..."
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" "pm2 logs staging-backend --lines 20 --nostream 2>&1"
    exit 1
}

# 3. 测试本地API访问
Write-Info "3️⃣ 测试服务器本地API访问..."
$localTest = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "curl -s http://localhost:3001/api/health 2>&1"
if ($localTest -match "ok" -or $localTest -match "status") {
    Write-Success "本地API访问正常"
    Write-Host "  响应: $($localTest.Substring(0, [Math]::Min(100, $localTest.Length)))" -ForegroundColor Gray
} else {
    Write-Error "本地API访问失败！"
    Write-Host "  响应: $localTest" -ForegroundColor Red
    exit 1
}

# 4. 检查Nginx配置
Write-Info "4️⃣ 检查Nginx配置..."
$nginxConfigCheck = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "if [ -f /etc/nginx/sites-available/test.ieclub.online ]; then cat /etc/nginx/sites-available/test.ieclub.online; elif [ -f /etc/nginx/conf.d/test.ieclub.online.conf ]; then cat /etc/nginx/conf.d/test.ieclub.online.conf; else echo 'NOT_FOUND'; fi"
$nginxConfig = $nginxConfigCheck

if ($nginxConfig -eq "NOT_FOUND") {
    Write-Error "Nginx配置文件不存在！"
    Write-Info "创建Nginx配置文件..."
    
    $nginxConfigContent = @'
server {
    listen 80;
    listen [::]:80;
    server_name test.ieclub.online;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name test.ieclub.online;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/test.ieclub.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/test.ieclub.online/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 日志
    access_log /var/log/nginx/test.ieclub.online_access.log;
    error_log /var/log/nginx/test.ieclub.online_error.log;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;
    
    # 客户端请求大小限制
    client_max_body_size 50M;
    
    # ===== 前端静态文件 =====
    location / {
        root /var/www/test.ieclub.online;
        index index.html;
        
        # SPA 路由支持
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML 不缓存
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # ===== 管理后台静态文件 =====
    location /admin {
        alias /var/www/test.ieclub.online/admin;
        index index.html;
        
        # SPA 路由支持
        try_files $uri $uri/ /admin/index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # ===== 后端 API =====
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 连接保持
        proxy_set_header Connection "";
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # ===== WebSocket =====
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        # WebSocket 必需的头
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 超时（设置较长时间）
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
    
    # ===== 上传文件访问 =====
    location /uploads {
        alias /root/IEclub_dev_staging/ieclub-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
'@
    
    # 保存配置到临时文件
    $nginxConfigContent | Out-File -FilePath "nginx-test-config.conf" -Encoding UTF8 -NoNewline
    
    # 上传到服务器
    Write-Info "上传Nginx配置到服务器..."
    scp -P $ServerPort "nginx-test-config.conf" "${ServerUser}@${ServerHost}:/tmp/test.ieclub.online.conf"
    Remove-Item "nginx-test-config.conf" -Force
    
    # 移动到正确位置
    $moveConfigCmd = @'
        # 尝试 sites-available 目录
        if [ -d /etc/nginx/sites-available ]; then
            sudo mv /tmp/test.ieclub.online.conf /etc/nginx/sites-available/test.ieclub.online.conf
            sudo ln -sf /etc/nginx/sites-available/test.ieclub.online.conf /etc/nginx/sites-enabled/test.ieclub.online.conf
        # 尝试 conf.d 目录
        elif [ -d /etc/nginx/conf.d ]; then
            sudo mv /tmp/test.ieclub.online.conf /etc/nginx/conf.d/test.ieclub.online.conf
        else
            echo "无法找到Nginx配置目录"
            exit 1
        fi
'@
    ssh -p $ServerPort "${ServerUser}@${ServerHost}" $moveConfigCmd
    
    Write-Success "Nginx配置文件已创建"
} else {
    # 检查配置是否正确
    if ($nginxConfig -match "location /api" -and $nginxConfig -match "proxy_pass.*3001") {
        Write-Success "Nginx配置存在且包含API代理"
        
        # 检查是否有尾部斜杠问题
        if ($nginxConfig -match "proxy_pass.*3001/") {
            Write-Warning "发现潜在的proxy_pass路径问题（尾部斜杠）"
            Write-Info "当前配置: proxy_pass http://127.0.0.1:3001/;"
            Write-Info "应该改为: proxy_pass http://127.0.0.1:3001;"
            Write-Info "这将修复API路由404问题"
            
            # 修复配置
            Write-Info "修复Nginx配置..."
            ssh -p $ServerPort "${ServerUser}@${ServerHost}" @"
                # 修复proxy_pass路径（去掉尾部斜杠）
                sudo sed -i 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/sites-available/test.ieclub.online.conf 2>/dev/null
                sudo sed -i 's|proxy_pass http://127.0.0.1:3001/;|proxy_pass http://127.0.0.1:3001;|g' /etc/nginx/conf.d/test.ieclub.online.conf 2>/dev/null
                sudo sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/sites-available/test.ieclub.online.conf 2>/dev/null
                sudo sed -i 's|proxy_pass http://localhost:3001/;|proxy_pass http://localhost:3001;|g' /etc/nginx/conf.d/test.ieclub.online.conf 2>/dev/null
"@
            Write-Success "配置已修复"
        } else {
            Write-Success "Nginx配置看起来正确"
        }
    } else {
        Write-Error "Nginx配置缺少API代理设置！"
        Write-Info "需要手动添加 location /api 配置"
        exit 1
    }
}

# 5. 测试Nginx配置
Write-Info "5️⃣ 测试Nginx配置语法..."
$nginxTest = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "sudo nginx -t 2>&1"
if ($nginxTest -match "successful") {
    Write-Success "Nginx配置语法正确"
} else {
    Write-Error "Nginx配置语法错误！"
    Write-Host $nginxTest -ForegroundColor Red
    exit 1
}

# 6. 重载Nginx
Write-Info "6️⃣ 重载Nginx配置..."
$nginxReload = ssh -p $ServerPort "${ServerUser}@${ServerHost}" "sudo systemctl reload nginx 2>&1"
if ($LASTEXITCODE -eq 0) {
    Write-Success "Nginx已重载"
} else {
    Write-Error "Nginx重载失败！"
    Write-Host $nginxReload -ForegroundColor Red
    exit 1
}

# 7. 测试API访问
Write-Info "7️⃣ 测试外部API访问..."
Start-Sleep -Seconds 2

$apiTest = Invoke-WebRequest -Uri "https://test.ieclub.online/api/health" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
if ($apiTest -and $apiTest.StatusCode -eq 200) {
    Write-Success "外部API访问正常"
    Write-Host "  响应: $($apiTest.Content.Substring(0, [Math]::Min(100, $apiTest.Content.Length)))" -ForegroundColor Gray
} else {
    Write-Warning "外部API访问测试失败，可能需要等待SSL证书或DNS生效"
    Write-Info "尝试测试HTTP访问..."
    $httpTest = Invoke-WebRequest -Uri "http://test.ieclub.online/api/health" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($httpTest -and $httpTest.StatusCode -eq 200) {
        Write-Success "HTTP API访问正常（HTTPS可能需要SSL证书）"
    } else {
        Write-Error "API访问失败"
    }
}

# 8. 测试具体API路由
Write-Info "8️⃣ 测试具体API路由..."
$routes = @(
    "/api/health",
    "/api/test",
    "/api/auth/csrf-token"
)

foreach ($route in $routes) {
    $testUrl = "https://test.ieclub.online$route"
    $routeTest = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($routeTest -and $routeTest.StatusCode -eq 200) {
        Write-Success "$route 可访问"
    } else {
        Write-Warning "$route 访问失败 (状态码: $($routeTest.StatusCode))"
    }
}

Write-Section "修复完成"

Write-Success "Nginx配置已修复并重载"
Write-Info "请测试以下API端点："
Write-Host "  - https://test.ieclub.online/api/health" -ForegroundColor Cyan
Write-Host "  - https://test.ieclub.online/api/test" -ForegroundColor Cyan
Write-Host "  - https://test.ieclub.online/api/auth/csrf-token" -ForegroundColor Cyan
Write-Host ""
Write-Warning "如果仍然出现404错误，请检查："
Write-Host "  1. 后端服务是否正常运行: pm2 status staging-backend" -ForegroundColor Gray
Write-Host "  2. 端口3001是否监听: netstat -tlnp | grep 3001" -ForegroundColor Gray
Write-Host "  3. Nginx错误日志: sudo tail -f /var/log/nginx/test.ieclub.online_error.log" -ForegroundColor Gray
Write-Host "  4. 后端服务日志: pm2 logs staging-backend" -ForegroundColor Gray

