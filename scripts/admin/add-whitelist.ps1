#!/usr/bin/env pwsh
# ================================================================
# 测试环境邮箱白名单一键添加脚本
# ================================================================
# 用途: 快速添加邮箱到测试环境白名单，允许其注册
# 用法: .\add-whitelist.ps1
#       然后输入邮箱，多个邮箱用分号(;)分隔
# ================================================================

param(
    [string]$Emails = ""
)

$ServerUser = "root"
$ServerHost = "ieclub.online"

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host " 测试环境邮箱白名单管理" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# 如果没有通过参数传入，则提示输入
if (-not $Emails) {
    Write-Host "请输入要添加到白名单的邮箱:" -ForegroundColor Yellow
    Write-Host "  - 多个邮箱用分号(;)分隔" -ForegroundColor Gray
    Write-Host "  - 例如: user1@qq.com;user2@gmail.com" -ForegroundColor Gray
    Write-Host ""
    $Emails = Read-Host "邮箱地址"
}

if (-not $Emails) {
    Write-Host "❌ 未输入邮箱，退出" -ForegroundColor Red
    exit 1
}

# 分割邮箱
$emailList = $Emails -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

if ($emailList.Count -eq 0) {
    Write-Host "❌ 没有有效的邮箱地址" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "将添加以下邮箱到白名单:" -ForegroundColor Yellow
$emailList | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Gray }
Write-Host ""

$confirm = Read-Host "确认添加？(Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "正在添加到测试环境..." -ForegroundColor Yellow
Write-Host ""

# 创建Node.js脚本（在服务器端运行，不需要dotenv）
$nodeScript = @"
process.env.NODE_ENV = 'staging';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emails = process.argv.slice(2);

(async () => {
  try {
    console.log('');
    console.log('=' + '='.repeat(50));
    console.log(' 批量添加邮箱白名单');
    console.log('=' + '='.repeat(50));
    console.log('');
    
    const results = {
      added: [],
      updated: [],
      failed: []
    };
    
    for (const email of emails) {
      try {
        const lowerEmail = email.toLowerCase().trim();
        
        // 检查是否已存在
        const existing = await prisma.emailWhitelist.findUnique({
          where: { email: lowerEmail }
        });
        
        if (existing) {
          if (existing.status === 'approved') {
            console.log('⚠️  已存在: ' + email + ' (状态: approved)');
            results.updated.push(email);
          } else {
            // 更新为approved
            await prisma.emailWhitelist.update({
              where: { email: lowerEmail },
              data: {
                status: 'approved',
                approvedAt: new Date(),
                note: '管理员手动批准'
              }
            });
            console.log('✅ 已更新: ' + email + ' (状态: pending -> approved)');
            results.updated.push(email);
          }
        } else {
          // 新增
          await prisma.emailWhitelist.create({
            data: {
              email: lowerEmail,
              status: 'approved',
              approvedAt: new Date(),
              note: '管理员手动添加',
              reason: '测试环境白名单'
            }
          });
          console.log('✅ 已添加: ' + email);
          results.added.push(email);
        }
      } catch (err) {
        console.error('❌ 失败: ' + email + ' - ' + err.message);
        results.failed.push(email);
      }
    }
    
    console.log('');
    console.log('=' + '='.repeat(50));
    console.log(' 添加完成');
    console.log('=' + '='.repeat(50));
    console.log('');
    console.log('统计:');
    console.log('  新增: ' + results.added.length + ' 个');
    console.log('  更新: ' + results.updated.length + ' 个');
    console.log('  失败: ' + results.failed.length + ' 个');
    console.log('');
    
    if (results.added.length > 0 || results.updated.length > 0) {
      console.log('✅ 这些邮箱现在可以在测试环境注册了！');
      console.log('   测试地址: https://test.ieclub.online');
    }
    
    console.log('');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ 错误:', error.message);
    console.error('');
    await prisma.$disconnect();
    process.exit(1);
  }
})();
"@

# 构建邮箱参数
$emailArgs = ($emailList | ForEach-Object { "'$_'" }) -join ' '

# 直接在服务器上创建并执行脚本
try {
    # 创建临时脚本文件
    $tempFile = "temp-whitelist-$(Get-Date -Format 'yyyyMMddHHmmss').js"
    $nodeScript | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
    
    # 上传到服务器
    scp -P 22 $tempFile "${ServerUser}@${ServerHost}:/root/IEclub_dev_staging/ieclub-backend/$tempFile" 2>$null
    
    # 执行
    ssh "${ServerUser}@${ServerHost}" "cd /root/IEclub_dev_staging/ieclub-backend && node $tempFile $emailArgs && rm $tempFile"
    
    # 删除本地临时文件
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host " 完成！" -ForegroundColor Green
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ 执行失败: $_" -ForegroundColor Red
    Write-Host ""
}
