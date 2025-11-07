/**
 * 综合系统测试
 * 测试所有关键功能和边界条件
 */

const axios = require('axios');

// 配置
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'test_' + Date.now() + '@sustech.edu.cn';
const TEST_PASSWORD = 'TestPassword123';

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 辅助函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  stats.total++;
  if (passed) {
    stats.passed++;
    log(`✓ [${stats.total}] ${name}`, 'green');
    if (details) log(`  ${details}`, 'cyan');
  } else {
    stats.failed++;
    stats.errors.push({ test: name, details });
    log(`✗ [${stats.total}] ${name}`, 'red');
    if (details) log(`  ${details}`, 'red');
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 创建API客户端
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true // 不自动抛出错误
});

// 测试套件
class ComprehensiveTest {
  constructor() {
    this.token = null;
    this.userId = null;
    this.verifyCode = null;
  }

  async run() {
    log('\n' + '='.repeat(60), 'cyan');
    log('开始综合系统测试', 'bright');
    log('='.repeat(60) + '\n', 'cyan');

    try {
      await this.testEmailValidation();
      await this.testPasswordStrength();
      await this.testRateLimiting();
      await this.testAuthFlow();
      await this.testErrorHandling();
      await this.testSecurity();
      
      this.printSummary();
    } catch (error) {
      log(`\n测试执行失败: ${error.message}`, 'red');
      console.error(error);
    }
  }

  // 1. 邮箱验证测试
  async testEmailValidation() {
    log('\n📧 测试邮箱验证功能', 'yellow');
    log('-'.repeat(60), 'cyan');

    // 测试有效邮箱
    const validEmails = [
      'student@sustech.edu.cn',
      'staff@mail.sustech.edu.cn',
      'test.user@sustech.edu.cn',
      'user_123@mail.sustech.edu.cn'
    ];

    for (const email of validEmails) {
      const res = await api.post('/auth/send-verify-code', {
        email,
        type: 'register'
      });
      
      logTest(
        `有效邮箱 ${email}`,
        res.status === 200 || res.status === 429, // 429是频率限制，也算正常
        res.status === 429 ? '触发频率限制（正常）' : '接受'
      );
      
      if (res.status !== 429) await delay(1000); // 避免频率限制
    }

    // 测试无效邮箱
    const invalidEmails = [
      'user@gmail.com',
      'user@qq.com',
      'user@163.com',
      'invalid-email',
      'user@sustech.cn'
    ];

    for (const email of invalidEmails) {
      const res = await api.post('/auth/send-verify-code', {
        email,
        type: 'register'
      });
      
      logTest(
        `无效邮箱 ${email}`,
        res.status === 400,
        res.data?.message || '应该被拒绝'
      );
    }
  }

  // 2. 密码强度测试
  async testPasswordStrength() {
    log('\n🔒 测试密码强度验证', 'yellow');
    log('-'.repeat(60), 'cyan');

    const passwordTests = [
      { pwd: '12345678', valid: false, desc: '纯数字' },
      { pwd: 'abcdefgh', valid: false, desc: '纯字母' },
      { pwd: 'abc123', valid: false, desc: '少于8位' },
      { pwd: 'Abc12345', valid: true, desc: '符合要求' },
      { pwd: 'Test@123', valid: true, desc: '包含特殊字符' }
    ];

    for (const test of passwordTests) {
      // 注册流程中会验证密码强度
      const res = await api.post('/auth/register', {
        email: TEST_EMAIL,
        password: test.pwd,
        verifyCode: '123456',
        nickname: 'TestUser'
      });

      // 密码太弱会返回400，验证码错误会返回400，需要区分
      const passed = test.valid
        ? res.status !== 400 || !res.data?.message?.includes('密码')
        : res.data?.message?.includes('密码');

      logTest(
        `密码 "${test.pwd}" (${test.desc})`,
        passed,
        res.data?.message || ''
      );
    }
  }

  // 3. 频率限制测试
  async testRateLimiting() {
    log('\n⏱️  测试频率限制', 'yellow');
    log('-'.repeat(60), 'cyan');

    const testEmail = 'ratelimit@sustech.edu.cn';
    let hitLimit = false;

    // 快速连续请求
    for (let i = 0; i < 5; i++) {
      const res = await api.post('/auth/send-verify-code', {
        email: testEmail,
        type: 'register'
      });

      if (res.status === 429) {
        hitLimit = true;
        break;
      }
      await delay(100); // 很短的延迟
    }

    logTest(
      '频率限制机制',
      hitLimit,
      hitLimit ? '成功触发频率限制' : '未触发限制（可能需要更多请求）'
    );
  }

  // 4. 完整认证流程测试
  async testAuthFlow() {
    log('\n🔐 测试完整认证流程', 'yellow');
    log('-'.repeat(60), 'cyan');

    // 由于无法接收真实验证码，这里测试API响应格式
    
    // 测试发送验证码
    const sendRes = await api.post('/auth/send-verify-code', {
      email: TEST_EMAIL,
      type: 'register'
    });

    logTest(
      '发送注册验证码',
      sendRes.status === 200 || sendRes.status === 429,
      `状态码: ${sendRes.status}`
    );

    // 测试登录（应该失败，因为用户不存在）
    const loginRes = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    logTest(
      '不存在用户登录',
      loginRes.status === 401,
      '应该返回401未授权'
    );
  }

  // 5. 错误处理测试
  async testErrorHandling() {
    log('\n⚠️  测试错误处理', 'yellow');
    log('-'.repeat(60), 'cyan');

    // 测试缺少必填字段
    const missingFieldTests = [
      { endpoint: '/auth/send-verify-code', data: {}, desc: '缺少email' },
      { endpoint: '/auth/login', data: { email: 'test@sustech.edu.cn' }, desc: '缺少password' },
      { endpoint: '/auth/register', data: { email: 'test@sustech.edu.cn' }, desc: '缺少必填字段' }
    ];

    for (const test of missingFieldTests) {
      const res = await api.post(test.endpoint, test.data);
      logTest(
        test.desc,
        res.status === 400,
        `状态码: ${res.status}, 消息: ${res.data?.message || '无消息'}`
      );
    }

    // 测试无效数据类型
    const invalidTypeRes = await api.post('/auth/send-verify-code', {
      email: 12345, // 应该是字符串
      type: 'register'
    });

    logTest(
      '无效数据类型',
      invalidTypeRes.status === 400,
      invalidTypeRes.data?.message || ''
    );
  }

  // 6. 安全性测试
  async testSecurity() {
    log('\n🛡️  测试安全性', 'yellow');
    log('-'.repeat(60), 'cyan');

    // 测试SQL注入防护
    const sqlInjectionEmail = "'; DROP TABLE users; --@sustech.edu.cn";
    const sqlRes = await api.post('/auth/send-verify-code', {
      email: sqlInjectionEmail,
      type: 'register'
    });

    logTest(
      'SQL注入防护',
      sqlRes.status === 400,
      'SQL注入尝试被拒绝'
    );

    // 测试XSS防护
    const xssEmail = '<script>alert("xss")</script>@sustech.edu.cn';
    const xssRes = await api.post('/auth/send-verify-code', {
      email: xssEmail,
      type: 'register'
    });

    logTest(
      'XSS防护',
      xssRes.status === 400,
      'XSS尝试被拒绝'
    );

    // 测试未授权访问
    const unauthorizedRes = await api.get('/auth/profile'); // 需要token

    logTest(
      '未授权访问防护',
      unauthorizedRes.status === 401,
      '未提供token应返回401'
    );
  }

  // 打印测试总结
  printSummary() {
    log('\n' + '='.repeat(60), 'cyan');
    log('测试结果总结', 'bright');
    log('='.repeat(60), 'cyan');
    
    log(`\n总测试数: ${stats.total}`, 'cyan');
    log(`✓ 通过: ${stats.passed}`, 'green');
    log(`✗ 失败: ${stats.failed}`, stats.failed > 0 ? 'red' : 'green');
    
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    log(`\n成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    if (stats.errors.length > 0) {
      log('\n失败的测试:', 'red');
      stats.errors.forEach((error, index) => {
        log(`\n${index + 1}. ${error.test}`, 'red');
        log(`   ${error.details}`, 'yellow');
      });
    }

    log('\n' + '='.repeat(60), 'cyan');
    
    if (stats.failed === 0) {
      log('\n✨ 所有测试通过！系统状态良好！', 'green');
    } else {
      log('\n⚠️  部分测试失败，请检查上述错误', 'yellow');
    }
    
    log('');
  }
}

// 运行测试
async function main() {
  const tester = new ComprehensiveTest();
  await tester.run();
  
  // 返回退出代码
  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('测试执行出错:', error);
  process.exit(1);
});

