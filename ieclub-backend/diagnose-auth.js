#!/usr/bin/env node
/**
 * 认证系统诊断脚本
 * 检查所有可能导致登录/注册失败的问题
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 开始诊断认证系统...\n');

// 1. 检查环境变量
console.log('📋 检查环境变量:');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL'
];

const optionalEnvVars = [
  'ALLOWED_EMAIL_DOMAINS',
  'NODE_ENV',
  'PORT'
];

let envErrors = 0;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: 已配置`);
  } else {
    console.log(`  ❌ ${varName}: 未配置`);
    envErrors++;
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ℹ️  ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`  ⚠️  ${varName}: 未配置（可选）`);
  }
});

// 2. 检查数据库连接
console.log('\n🗄️  检查数据库连接:');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    await prisma.$connect();
    console.log('  ✅ 数据库连接成功');
    
    // 检查用户表
    const userCount = await prisma.user.count();
    console.log(`  ✅ 用户表可访问 (${userCount} 个用户)`);
    
    // 检查验证码表
    const codeCount = await prisma.verificationCode.count();
    console.log(`  ✅ 验证码表可访问 (${codeCount} 条记录)`);
    
    return true;
  } catch (error) {
    console.log('  ❌ 数据库连接失败:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// 3. 检查邮件服务
console.log('\n📧 检查邮件服务:');
function checkEmailService() {
  const config = require('./src/config');
  const emailConfig = config.email;
  
  if (!emailConfig) {
    console.log('  ❌ 邮件配置未找到');
    return false;
  }
  
  console.log(`  ℹ️  邮件主机: ${emailConfig.host || '未配置'}`);
  console.log(`  ℹ️  邮件端口: ${emailConfig.port || '未配置'}`);
  console.log(`  ℹ️  发件人: ${emailConfig.from || emailConfig.user || '未配置'}`);
  console.log(`  ℹ️  允许的域名: ${emailConfig.allowedDomains || '不限制'}`);
  
  if (emailConfig.user && emailConfig.password) {
    console.log('  ✅ 邮件认证信息已配置');
    return true;
  } else {
    console.log('  ⚠️  邮件认证信息未完全配置（开发环境可忽略）');
    return false;
  }
}

// 4. 检查邮箱域名验证
console.log('\n🔐 检查邮箱域名验证:');
function checkEmailDomainChecker() {
  try {
    const { checkEmailAllowed, getAllowedDomains } = require('./src/utils/emailDomainChecker');
    
    const allowedDomains = getAllowedDomains();
    if (allowedDomains === null) {
      console.log('  ℹ️  邮箱域名不限制');
    } else {
      console.log(`  ℹ️  允许的邮箱域名: ${allowedDomains.join(', ')}`);
    }
    
    // 测试邮箱验证
    const testEmails = [
      '12310203@mail.sustech.edu.cn',
      'test@gmail.com',
      'invalid-email'
    ];
    
    testEmails.forEach(email => {
      const result = checkEmailAllowed(email, 'login');
      console.log(`  ${result.valid ? '✅' : '❌'} ${email}: ${result.message}`);
    });
    
    return true;
  } catch (error) {
    console.log('  ❌ 邮箱域名验证器错误:', error.message);
    return false;
  }
}

// 5. 检查JWT配置
console.log('\n🔑 检查JWT配置:');
function checkJWT() {
  const config = require('./src/config');
  const jwtConfig = config.jwt;
  
  if (!jwtConfig || !jwtConfig.secret) {
    console.log('  ❌ JWT密钥未配置');
    return false;
  }
  
  console.log('  ✅ JWT密钥已配置');
  console.log(`  ℹ️  过期时间: ${jwtConfig.expiresIn || '未配置'}`);
  
  return true;
}

// 6. 测试密码加密
console.log('\n🔒 测试密码加密:');
async function testPasswordHash() {
  try {
    const bcrypt = require('bcryptjs');
    const testPassword = 'Test123456';
    
    const hash = await bcrypt.hash(testPassword, 10);
    console.log('  ✅ 密码加密成功');
    
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`  ${isValid ? '✅' : '❌'} 密码验证${isValid ? '成功' : '失败'}`);
    
    return isValid;
  } catch (error) {
    console.log('  ❌ 密码加密测试失败:', error.message);
    return false;
  }
}

// 7. 检查路由配置
console.log('\n🛣️  检查路由配置:');
function checkRoutes() {
  try {
    const routes = require('./src/routes');
    console.log('  ✅ 路由文件加载成功');
    return true;
  } catch (error) {
    console.log('  ❌ 路由文件加载失败:', error.message);
    return false;
  }
}

// 运行所有检查
async function runDiagnostics() {
  const results = {
    env: envErrors === 0,
    database: await checkDatabase(),
    email: checkEmailService(),
    emailDomain: checkEmailDomainChecker(),
    jwt: checkJWT(),
    password: await testPasswordHash(),
    routes: checkRoutes()
  };
  
  console.log('\n📊 诊断结果汇总:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✅ 通过' : '❌ 失败';
    const name = {
      env: '环境变量',
      database: '数据库连接',
      email: '邮件服务',
      emailDomain: '邮箱验证',
      jwt: 'JWT配置',
      password: '密码加密',
      routes: '路由配置'
    }[key];
    
    console.log(`  ${status} - ${name}`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const allPassed = Object.values(results).every(v => v);
  
  if (allPassed) {
    console.log('\n✅ 所有检查通过！系统应该可以正常工作。');
    console.log('\n💡 如果仍然有问题，请检查:');
    console.log('   1. 前端请求格式是否正确');
    console.log('   2. CORS配置是否正确');
    console.log('   3. 服务器日志中的详细错误信息');
  } else {
    console.log('\n⚠️  发现问题，请修复上述失败的检查项。');
  }
  
  console.log('\n');
  process.exit(allPassed ? 0 : 1);
}

// 执行诊断
runDiagnostics().catch(error => {
  console.error('\n💥 诊断过程出错:', error);
  process.exit(1);
});

