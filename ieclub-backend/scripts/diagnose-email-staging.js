#!/usr/bin/env node
/**
 * 测试环境邮件服务诊断脚本
 * 用于检查测试环境邮件配置和发送功能
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.staging') });
const emailService = require('../src/services/emailService');
const config = require('../src/config');
const logger = require('../src/utils/logger');

async function diagnose() {
  console.log('\n🔍 测试环境邮件服务诊断\n');
  console.log('='.repeat(60));
  
  // 1. 检查环境变量
  console.log('\n📋 1. 检查环境变量配置:');
  console.log('-'.repeat(60));
  
  const emailConfig = config.email || {};
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const optionalVars = ['EMAIL_PORT', 'EMAIL_SECURE', 'EMAIL_FROM'];
  
  let hasAllRequired = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName] || emailConfig[varName.toLowerCase().replace('EMAIL_', '')];
    if (value) {
      if (varName === 'EMAIL_PASSWORD') {
        console.log(`  ✅ ${varName}: 已配置 (${'*'.repeat(Math.min(value.length, 10))})`);
      } else {
        console.log(`  ✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`  ❌ ${varName}: 未配置`);
      hasAllRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    const value = process.env[varName] || emailConfig[varName.toLowerCase().replace('EMAIL_', '')];
    if (value) {
      console.log(`  ℹ️  ${varName}: ${value}`);
    } else {
      console.log(`  ⚠️  ${varName}: 未配置（使用默认值）`);
    }
  });
  
  // 2. 检查邮件服务初始化状态
  console.log('\n📧 2. 检查邮件服务初始化状态:');
  console.log('-'.repeat(60));
  
  if (!emailService.initialized) {
    console.log('  ❌ 邮件服务未初始化');
    if (!hasAllRequired) {
      console.log('  💡 原因: 缺少必要的环境变量配置');
      console.log('  💡 解决: 配置 EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD');
    } else {
      console.log('  💡 原因: 邮件服务初始化失败');
      console.log('  💡 解决: 检查 SMTP 服务器连接和认证信息');
    }
  } else {
    console.log('  ✅ 邮件服务已初始化');
    if (emailService.transporter) {
      console.log('  ✅ 邮件传输器已创建');
    } else {
      console.log('  ❌ 邮件传输器未创建');
    }
  }
  
  // 3. 测试邮件发送（如果配置了测试邮箱）
  const testEmail = process.env.TEST_EMAIL;
  if (testEmail) {
    console.log('\n📨 3. 测试邮件发送:');
    console.log('-'.repeat(60));
    console.log(`  测试邮箱: ${testEmail}`);
    
    try {
      const result = await emailService.sendVerificationCode(testEmail, '123456', 'register');
      
      if (result.success) {
        console.log('  ✅ 邮件发送成功');
        if (result.mock) {
          console.log('  ⚠️  注意: 这是模拟发送（开发环境）');
        } else {
          console.log(`  ✅ 消息ID: ${result.messageId}`);
        }
      } else {
        console.log('  ❌ 邮件发送失败');
        console.log(`  错误: ${result.error || result.message}`);
      }
    } catch (error) {
      console.log('  ❌ 邮件发送异常');
      console.log(`  错误: ${error.message}`);
    }
  } else {
    console.log('\n📨 3. 测试邮件发送:');
    console.log('-'.repeat(60));
    console.log('  ⚠️  未设置 TEST_EMAIL 环境变量，跳过测试');
    console.log('  💡 提示: 设置 TEST_EMAIL=your@email.com 来测试邮件发送');
  }
  
  // 4. 环境行为说明
  console.log('\n📝 4. 环境行为说明:');
  console.log('-'.repeat(60));
  const env = process.env.NODE_ENV || 'development';
  console.log(`  当前环境: ${env}`);
  
  if (env === 'staging') {
    console.log('  ✅ 测试环境必须真实发送邮件（与生产环境一致）');
    console.log('  ❌ 如果邮件服务未配置或初始化失败，会返回失败');
    console.log('  ✅ 这确保了测试环境能真实验证邮件功能');
  } else if (env === 'production') {
    console.log('  ✅ 生产环境必须真实发送邮件');
    console.log('  ❌ 如果邮件服务未配置或初始化失败，会返回失败');
  } else {
    console.log('  ⚠️  开发环境允许模拟发送（未配置时）');
    console.log('  ✅ 这方便本地开发测试');
  }
  
  // 5. 总结和建议
  console.log('\n💡 5. 诊断总结:');
  console.log('-'.repeat(60));
  
  if (!hasAllRequired) {
    console.log('  ❌ 邮件服务配置不完整');
    console.log('  📋 需要配置:');
    console.log('     - EMAIL_HOST (例如: smtp.gmail.com)');
    console.log('     - EMAIL_USER (您的邮箱地址)');
    console.log('     - EMAIL_PASSWORD (密码或应用专用密码)');
    console.log('  📚 详细配置指南: docs/debugging/EMAIL_SERVICE_FIX_STAGING.md');
  } else if (!emailService.initialized) {
    console.log('  ❌ 邮件服务初始化失败');
    console.log('  📋 可能原因:');
    console.log('     - SMTP 服务器地址或端口错误');
    console.log('     - 用户名或密码错误');
    console.log('     - 网络连接问题');
    console.log('     - 防火墙阻止连接');
    console.log('  📚 排查指南: docs/debugging/EMAIL_SERVICE_FIX_STAGING.md');
  } else {
    console.log('  ✅ 邮件服务配置正常');
    if (testEmail) {
      console.log('  ✅ 邮件发送测试通过');
    } else {
      console.log('  ⚠️  建议: 设置 TEST_EMAIL 进行发送测试');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('诊断完成\n');
}

diagnose().catch(error => {
  console.error('❌ 诊断过程出错:', error);
  process.exit(1);
});

