// 邮件服务测试脚本
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 开始测试邮件服务...\n');
  
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };
  
  console.log('配置信息:');
  console.log('- Host:', config.host);
  console.log('- Port:', config.port);
  console.log('- Secure:', config.secure);
  console.log('- User:', config.auth.user);
  console.log('- Password:', config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET');
  console.log('');
  
  const transporter = nodemailer.createTransport(config);
  
  try {
    console.log('🔍 验证连接...');
    await transporter.verify();
    console.log('✅ 邮件服务连接成功！\n');
    
    console.log('📨 发送测试邮件...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER, // 发送给自己
      subject: 'IEclub 邮件服务测试',
      text: '这是一封测试邮件，如果您收到此邮件，说明邮件服务配置正确。',
      html: '<p>这是一封测试邮件，如果您收到此邮件，说明邮件服务配置正确。</p>'
    });
    
    console.log('✅ 测试邮件发送成功！');
    console.log('- Message ID:', info.messageId);
    console.log('- Response:', info.response);
    
  } catch (error) {
    console.error('❌ 邮件服务测试失败:');
    console.error('- 错误代码:', error.code);
    console.error('- 错误信息:', error.message);
    console.error('- 响应代码:', error.responseCode);
    console.error('- 响应:', error.response);
    console.error('\n💡 可能的原因:');
    console.error('1. QQ邮箱授权码已过期或无效');
    console.error('2. QQ邮箱SMTP服务未开启');
    console.error('3. 网络连接问题');
    console.error('4. 防火墙阻止465端口');
    console.error('\n🔧 解决方案:');
    console.error('1. 登录QQ邮箱 -> 设置 -> 账户 -> POP3/IMAP/SMTP服务');
    console.error('2. 开启"SMTP服务"并生成新的授权码');
    console.error('3. 将新授权码更新到 .env 文件的 EMAIL_PASSWORD');
    process.exit(1);
  }
}

testEmail();
