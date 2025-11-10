// ieclub-backend/scripts/diagnose-email.js
// 邮件服务诊断脚本

const config = require('../src/config');
const emailService = require('../src/services/emailService');
const logger = require('../src/utils/logger');

console.log('\n📧 邮件服务诊断工具\n');
console.log('='.repeat(60));

// 1. 检查环境变量
console.log('\n1️⃣ 环境变量检查:');
console.log('-'.repeat(60));
const emailConfig = config.email || {};
const envVars = {
  'EMAIL_HOST': process.env.EMAIL_HOST,
  'EMAIL_PORT': process.env.EMAIL_PORT,
  'EMAIL_SECURE': process.env.EMAIL_SECURE,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '***已设置***' : '未设置',
  'EMAIL_FROM': process.env.EMAIL_FROM,
  'NODE_ENV': process.env.NODE_ENV
};

Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`  ${status} ${key}: ${value || '未设置'}`);
});

// 2. 检查配置对象
console.log('\n2️⃣ 配置对象检查:');
console.log('-'.repeat(60));
console.log(`  ${emailConfig.host ? '✅' : '❌'} host: ${emailConfig.host || '未配置'}`);
console.log(`  ${emailConfig.port ? '✅' : '❌'} port: ${emailConfig.port || '未配置'}`);
console.log(`  ${emailConfig.secure !== undefined ? '✅' : '❌'} secure: ${emailConfig.secure}`);
console.log(`  ${emailConfig.user ? '✅' : '❌'} user: ${emailConfig.user || '未配置'}`);
console.log(`  ${emailConfig.password ? '✅' : '❌'} password: ${emailConfig.password ? '***已设置***' : '未设置'}`);
console.log(`  ${emailConfig.from ? '✅' : '❌'} from: ${emailConfig.from || '未配置'}`);

// 3. 检查邮件服务初始化状态
console.log('\n3️⃣ 邮件服务状态:');
console.log('-'.repeat(60));
console.log(`  ${emailService.initialized ? '✅' : '❌'} 初始化状态: ${emailService.initialized ? '已初始化' : '未初始化'}`);
console.log(`  ${emailService.transporter ? '✅' : '❌'} 传输器: ${emailService.transporter ? '已创建' : '未创建'}`);

// 4. 测试连接
console.log('\n4️⃣ 连接测试:');
console.log('-'.repeat(60));
if (emailService.transporter) {
  emailService.transporter.verify((error, success) => {
    if (error) {
      console.log(`  ❌ 连接失败: ${error.message}`);
      console.log(`  📝 错误详情:`, error);
    } else {
      console.log(`  ✅ 连接成功: ${success}`);
    }
    
    // 5. 测试发送
    console.log('\n5️⃣ 测试发送:');
    console.log('-'.repeat(60));
    testEmailSend();
  });
} else {
  console.log('  ⚠️  无法测试连接：传输器未创建');
  testEmailSend();
}

// 测试发送邮件
async function testEmailSend() {
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(`\n  尝试发送测试邮件到: ${testEmail}`);
  
  try {
    const result = await emailService.sendVerificationCode(testEmail, '123456', 'register');
    
    console.log('\n  发送结果:');
    console.log('  -'.repeat(30));
    console.log(`  ${result.success ? '✅' : '❌'} 成功: ${result.success}`);
    console.log(`  📧 消息ID: ${result.messageId || 'N/A'}`);
    console.log(`  🎭 模拟模式: ${result.mock ? '是' : '否'}`);
    console.log(`  🌍 环境: ${result.env || process.env.NODE_ENV || 'development'}`);
    if (result.message) {
      console.log(`  💬 消息: ${result.message}`);
    }
    if (result.error) {
      console.log(`  ❌ 错误: ${result.error}`);
    }
  } catch (error) {
    console.log(`  ❌ 发送失败: ${error.message}`);
    console.log(`  📝 错误堆栈:`, error.stack);
  }
  
  // 6. 诊断建议
  console.log('\n6️⃣ 诊断建议:');
  console.log('-'.repeat(60));
  
  if (!emailConfig.host || !emailConfig.user) {
    console.log('  ⚠️  邮件服务未配置');
    console.log('  📝 建议:');
    console.log('     1. 检查 .env 文件是否存在');
    console.log('     2. 确认 EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD 已设置');
    console.log('     3. 如果使用 Gmail，需要生成应用专用密码');
    console.log('     4. 如果使用 SendGrid，需要设置 API Key');
  } else if (!emailService.initialized) {
    console.log('  ⚠️  邮件服务初始化失败');
    console.log('  📝 建议:');
    console.log('     1. 检查 SMTP 服务器地址和端口是否正确');
    console.log('     2. 检查用户名和密码是否正确');
    console.log('     3. 检查网络连接是否正常');
    console.log('     4. 检查防火墙设置');
  } else {
    console.log('  ✅ 邮件服务配置正常');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('诊断完成\n');
  
  process.exit(0);
}

