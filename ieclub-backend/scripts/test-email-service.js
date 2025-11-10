#!/usr/bin/env node
/**
 * 邮件服务测试脚本
 * 用于诊断和测试邮件发送功能
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const emailService = require('../src/services/emailService');
const logger = require('../src/utils/logger');

async function testEmailService() {
  console.log('\n📧 邮件服务诊断工具\n');
  console.log('='.repeat(60));
  
  // 1. 检查环境变量
  console.log('\n1️⃣ 检查环境变量配置:');
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const env = process.env.NODE_ENV || 'development';
  
  console.log(`   环境: ${env}`);
  console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '❌ 未设置'}`);
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ 未设置'}`);
  console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '587 (默认)'}`);
  console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE || 'false (默认)'}`);
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.log(`\n   ⚠️ 缺少必需的环境变量: ${missingVars.join(', ')}`);
    console.log('   💡 请在 .env 文件中配置这些变量');
    return;
  }
  
  // 2. 检查邮件服务初始化状态
  console.log('\n2️⃣ 检查邮件服务初始化状态:');
  console.log(`   初始化状态: ${emailService.initialized ? '✅ 已初始化' : '❌ 未初始化'}`);
  console.log(`   传输器状态: ${emailService.transporter ? '✅ 已创建' : '❌ 未创建'}`);
  
  if (!emailService.initialized || !emailService.transporter) {
    console.log('\n   ⚠️ 邮件服务未正确初始化');
    console.log('   💡 请检查邮件配置和网络连接');
    return;
  }
  
  // 3. 测试连接
  console.log('\n3️⃣ 测试邮件服务器连接:');
  try {
    await new Promise((resolve, reject) => {
      emailService.transporter.verify((error) => {
        if (error) {
          console.log('   ❌ 连接失败:', error.message);
          console.log('   错误代码:', error.code);
          console.log('   响应代码:', error.responseCode);
          reject(error);
        } else {
          console.log('   ✅ 连接成功');
          resolve();
        }
      });
    });
  } catch (error) {
    console.log('\n   ⚠️ 无法连接到邮件服务器');
    console.log('   💡 可能的原因:');
    console.log('      1. SMTP服务器地址或端口不正确');
    console.log('      2. 用户名或密码错误');
    console.log('      3. 网络连接问题');
    console.log('      4. 防火墙阻止连接');
    console.log('      5. 需要启用"允许不够安全的应用"（Gmail）');
    console.log('      6. 需要使用应用专用密码（Gmail）');
    return;
  }
  
  // 4. 测试发送验证码邮件
  console.log('\n4️⃣ 测试发送验证码邮件:');
  const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
  const testCode = '123456';
  
  console.log(`   收件人: ${testEmail}`);
  console.log(`   验证码: ${testCode}`);
  console.log('   正在发送...');
  
  try {
    const result = await emailService.sendVerificationCode(testEmail, testCode, 'register');
    
    if (result.success) {
      console.log('   ✅ 邮件发送成功!');
      console.log(`   消息ID: ${result.messageId || 'N/A'}`);
      console.log(`\n   📬 请检查 ${testEmail} 的收件箱（包括垃圾邮件文件夹）`);
    } else {
      console.log('   ❌ 邮件发送失败');
      console.log(`   错误: ${result.error}`);
      if (result.errorCode) {
        console.log(`   错误代码: ${result.errorCode}`);
      }
      if (result.errorResponseCode) {
        console.log(`   响应代码: ${result.errorResponseCode}`);
      }
    }
  } catch (error) {
    console.log('   ❌ 发送过程中发生错误');
    console.log(`   错误: ${error.message}`);
    console.log(`   堆栈: ${error.stack}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成\n');
}

// 运行测试
testEmailService().catch(error => {
  console.error('\n❌ 测试失败:', error);
  process.exit(1);
});

