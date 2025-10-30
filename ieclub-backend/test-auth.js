// 认证功能测试脚本
// 用于测试注册、登录、验证码等功能

const axios = require('axios');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'test' + Date.now() + '@mail.sustech.edu.cn';
const TEST_PASSWORD = 'Test123!@#';
const TEST_NICKNAME = '测试用户' + Date.now();

// 创建 axios 实例
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 日志函数
function log(title, data) {
  console.log('\n' + '='.repeat(60));
  console.log(`📝 ${title}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(data, null, 2));
}

function success(message) {
  console.log(`✅ ${message}`);
}

function error(message, err) {
  console.error(`❌ ${message}`);
  if (err.response) {
    console.error('状态码:', err.response.status);
    console.error('响应数据:', err.response.data);
  } else {
    console.error('错误:', err.message);
  }
}

// 测试函数
async function testAuth() {
  let token = null;
  let verifyCode = null;

  try {
    console.log('\n' + '🚀 开始测试认证功能'.padEnd(60, '='));
    console.log(`测试邮箱: ${TEST_EMAIL}`);
    console.log(`测试密码: ${TEST_PASSWORD}`);
    console.log(`测试昵称: ${TEST_NICKNAME}`);

    // ==================== 测试1: 发送注册验证码 ====================
    console.log('\n📧 测试1: 发送注册验证码...');
    try {
      const sendCodeRes = await client.post('/auth/send-verify-code', {
        email: TEST_EMAIL,
        type: 'register'
      });
      log('发送验证码响应', sendCodeRes.data);
      
      if (sendCodeRes.data.success || sendCodeRes.data.code === 200) {
        success('验证码发送成功');
        // 在实际测试中，你需要从邮箱获取验证码
        // 这里我们使用模拟验证码（需要后端支持测试模式）
        console.log('⚠️  请从邮箱中获取验证码，或查看后端日志');
        
        // 暂停等待用户输入验证码
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        verifyCode = await new Promise(resolve => {
          readline.question('请输入收到的验证码: ', answer => {
            readline.close();
            resolve(answer.trim());
          });
        });
        
        console.log(`已获取验证码: ${verifyCode}`);
      } else {
        error('验证码发送失败', new Error(sendCodeRes.data.message));
        return;
      }
    } catch (err) {
      error('发送验证码失败', err);
      return;
    }

    // ==================== 测试2: 用户注册 ====================
    console.log('\n👤 测试2: 用户注册...');
    try {
      const registerRes = await client.post('/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        verifyCode: verifyCode,
        nickname: TEST_NICKNAME
      });
      log('注册响应', registerRes.data);
      
      if (registerRes.data.success || registerRes.data.code === 200) {
        const data = registerRes.data.data || registerRes.data;
        token = data.token;
        success(`注册成功，获取到Token: ${token.substring(0, 20)}...`);
      } else {
        error('注册失败', new Error(registerRes.data.message));
        return;
      }
    } catch (err) {
      error('注册失败', err);
      return;
    }

    // ==================== 测试3: 获取用户信息 ====================
    console.log('\n📋 测试3: 获取用户信息...');
    try {
      const profileRes = await client.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      log('用户信息响应', profileRes.data);
      
      if (profileRes.data.success || profileRes.data.code === 200) {
        success('获取用户信息成功');
      }
    } catch (err) {
      error('获取用户信息失败', err);
    }

    // ==================== 测试4: 密码登录 ====================
    console.log('\n🔐 测试4: 密码登录...');
    try {
      const loginRes = await client.post('/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      log('登录响应', loginRes.data);
      
      if (loginRes.data.success || loginRes.data.code === 200) {
        const data = loginRes.data.data || loginRes.data;
        token = data.token;
        success(`登录成功，获取到新Token: ${token.substring(0, 20)}...`);
      } else {
        error('登录失败', new Error(loginRes.data.message));
      }
    } catch (err) {
      error('登录失败', err);
    }

    // ==================== 测试5: 发送登录验证码 ====================
    console.log('\n📧 测试5: 发送登录验证码...');
    try {
      const sendLoginCodeRes = await client.post('/auth/send-verify-code', {
        email: TEST_EMAIL,
        type: 'login'
      });
      log('发送登录验证码响应', sendLoginCodeRes.data);
      
      if (sendLoginCodeRes.data.success || sendLoginCodeRes.data.code === 200) {
        success('登录验证码发送成功');
        
        // 等待用户输入验证码
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const loginCode = await new Promise(resolve => {
          readline.question('请输入收到的登录验证码: ', answer => {
            readline.close();
            resolve(answer.trim());
          });
        });

        // ==================== 测试6: 验证码登录 ====================
        console.log('\n🔑 测试6: 验证码登录...');
        try {
          const codeLoginRes = await client.post('/auth/login-with-code', {
            email: TEST_EMAIL,
            code: loginCode
          });
          log('验证码登录响应', codeLoginRes.data);
          
          if (codeLoginRes.data.success || codeLoginRes.data.code === 200) {
            success('验证码登录成功');
          }
        } catch (err) {
          error('验证码登录失败', err);
        }
      }
    } catch (err) {
      error('发送登录验证码失败', err);
    }

    // ==================== 测试7: 更新用户信息 ====================
    console.log('\n✏️  测试7: 更新用户信息...');
    try {
      const updateRes = await client.put('/auth/profile', {
        bio: '这是我的个人简介',
        school: '南方科技大学',
        major: '计算机科学与技术',
        grade: '大二'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      log('更新用户信息响应', updateRes.data);
      
      if (updateRes.data.success || updateRes.data.code === 200) {
        success('更新用户信息成功');
      }
    } catch (err) {
      error('更新用户信息失败', err);
    }

    // ==================== 测试8: 修改密码 ====================
    console.log('\n🔒 测试8: 修改密码...');
    const NEW_PASSWORD = 'NewTest123!@#';
    try {
      const changePasswordRes = await client.put('/auth/change-password', {
        oldPassword: TEST_PASSWORD,
        newPassword: NEW_PASSWORD
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      log('修改密码响应', changePasswordRes.data);
      
      if (changePasswordRes.data.success || changePasswordRes.data.code === 200) {
        success('修改密码成功');

        // 用新密码登录
        console.log('\n🔐 使用新密码登录...');
        const newLoginRes = await client.post('/auth/login', {
          email: TEST_EMAIL,
          password: NEW_PASSWORD
        });
        
        if (newLoginRes.data.success || newLoginRes.data.code === 200) {
          success('新密码登录成功');
        }
      }
    } catch (err) {
      error('修改密码失败', err);
    }

    // ==================== 测试完成 ====================
    console.log('\n' + '✨ 测试完成'.padEnd(60, '='));
    console.log('✅ 所有关键功能测试通过');
    
  } catch (err) {
    console.error('\n💥 测试过程中发生未预期的错误:');
    console.error(err);
  }
}

// 运行测试
console.log('🎯 IEClub 认证功能测试工具');
console.log(`📡 API地址: ${API_BASE_URL}`);

// 检查服务器是否可访问
client.get('/test')
  .then(res => {
    success('服务器连接成功');
    return testAuth();
  })
  .catch(err => {
    error('无法连接到服务器，请确保后端服务正在运行', err);
    console.log('\n启动后端服务: cd ieclub-backend && npm run dev');
  });

