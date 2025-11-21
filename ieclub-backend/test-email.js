#!/usr/bin/env node
/**
 * 邮件服务快速测试脚本
 * 用法: node test-email.js 你的邮箱@qq.com
 */

require('dotenv').config();
const emailService = require('./src/services/emailService');

const testEmail = process.argv[2] || '2812149844@qq.com';
const testCode = '123456';

console.log('\n========================================');
console.log('📧 IEClub 邮件服务测试');
console.log('========================================\n');

console.log('配置信息:');
console.log('- 邮件服务器:', process.env.EMAIL_HOST || '未配置');
console.log('- 发件邮箱:', process.env.EMAIL_USER || '未配置');
console.log('- 授权码:', process.env.EMAIL_PASSWORD ? '已配置 (长度: ' + process.env.EMAIL_PASSWORD.length + ')' : '未配置');
console.log('- 测试收件人:', testEmail);
console.log('\n正在发送测试邮件...\n');

emailService.sendVerificationCode(testEmail, testCode, 'register')
  .then(result => {
    console.log('========================================');
    if (result.success) {
      console.log('✅ 测试成功！');
      console.log('邮件已发送到:', testEmail);
      console.log('请检查邮箱（包括垃圾邮件文件夹）');
      if (result.messageId) {
        console.log('消息ID:', result.messageId);
      }
    } else {
      console.log('❌ 测试失败！');
      console.log('错误:', result.error);
      console.log('\n常见问题:');
      console.log('1. 检查 .env 文件中 EMAIL_PASSWORD 是否是授权码（不是QQ密码）');
      console.log('2. 确认 EMAIL_HOST 和 EMAIL_PORT 正确');
      console.log('3. 确认 EMAIL_USER 是完整的邮箱地址');
      console.log('4. 如果是QQ邮箱，确认已开启SMTP服务');
    }
    console.log('========================================\n');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.log('========================================');
    console.log('❌ 测试异常！');
    console.log('错误:', error.message);
    console.log('========================================\n');
    process.exit(1);
  });
