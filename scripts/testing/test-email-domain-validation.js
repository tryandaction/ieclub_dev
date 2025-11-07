#!/usr/bin/env node
/**
 * 邮箱域名验证测试脚本
 * 用于测试统一的邮箱域名白名单功能
 * 
 * 使用方法：
 * cd ieclub-backend
 * node ../scripts/testing/test-email-domain-validation.js
 */

const path = require('path');

// 检查是否在正确的目录运行
const currentDir = process.cwd();
if (!currentDir.includes('ieclub-backend')) {
  console.error('错误：请从 ieclub-backend 目录运行此脚本');
  console.error('使用方法：cd ieclub-backend && node ../scripts/testing/test-email-domain-validation.js');
  process.exit(1);
}

// 加载环境变量
try {
  require('dotenv').config();
} catch (error) {
  console.warn('警告：无法加载 dotenv，将使用默认配置');
}

const { checkEmailAllowed, getAllowedDomains } = require(path.join(currentDir, 'src/utils/emailDomainChecker'));

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// 打印带颜色的消息
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logSuccess(message) {
  log('✓ ' + message, 'green');
}

function logError(message) {
  log('✗ ' + message, 'red');
}

function logInfo(message) {
  log('ℹ ' + message, 'blue');
}

function logWarning(message) {
  log('⚠ ' + message, 'yellow');
}

function logSection(message) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log(colors.bold + message, 'cyan');
  log('═'.repeat(60), 'cyan');
}

// 测试用例
const testCases = [
  // 应该通过的邮箱
  { email: 'student@sustech.edu.cn', type: 'register', shouldPass: true, description: '标准南科大邮箱' },
  { email: 'staff@mail.sustech.edu.cn', type: 'register', shouldPass: true, description: '带 mail 前缀的南科大邮箱' },
  { email: 'test.user@sustech.edu.cn', type: 'login', shouldPass: true, description: '带点号的邮箱' },
  { email: 'user_123@sustech.edu.cn', type: 'reset', shouldPass: true, description: '带下划线的邮箱' },
  { email: 'a-b@mail.sustech.edu.cn', type: 'register', shouldPass: true, description: '带连字符的邮箱' },
  
  // 应该被拒绝的邮箱
  { email: 'user@gmail.com', type: 'register', shouldPass: false, description: 'Gmail 邮箱' },
  { email: 'user@qq.com', type: 'register', shouldPass: false, description: 'QQ 邮箱' },
  { email: 'user@163.com', type: 'login', shouldPass: false, description: '163 邮箱' },
  { email: 'user@outlook.com', type: 'reset', shouldPass: false, description: 'Outlook 邮箱' },
  { email: 'user@university.edu', type: 'register', shouldPass: false, description: '其他大学邮箱' },
  { email: 'invalid-email', type: 'register', shouldPass: false, description: '无效的邮箱格式' },
  { email: 'user@sustech.cn', type: 'register', shouldPass: false, description: '错误的域名' },
  { email: 'user@mail.sustech.cn', type: 'register', shouldPass: false, description: '错误的域名（带 mail）' },
];

// 运行测试
function runTests() {
  logSection('邮箱域名白名单验证测试');
  
  // 显示当前配置
  const allowedDomains = getAllowedDomains();
  logInfo('当前允许的邮箱域名：');
  allowedDomains.forEach(domain => {
    console.log('  - ' + domain);
  });
  
  logSection('测试用例执行');
  
  let passCount = 0;
  let failCount = 0;
  const failedTests = [];
  
  testCases.forEach((testCase, index) => {
    const { email, type, shouldPass, description } = testCase;
    const result = checkEmailAllowed(email, type);
    
    const testNumber = `[${index + 1}/${testCases.length}]`;
    const testDesc = `${testNumber} ${description} (${email})`;
    
    // 检查测试是否通过
    const testPassed = result.valid === shouldPass;
    
    if (testPassed) {
      logSuccess(testDesc);
      if (shouldPass) {
        console.log(`      验证通过`);
      } else {
        console.log(`      正确拒绝: ${result.message}`);
      }
      passCount++;
    } else {
      logError(testDesc);
      if (shouldPass) {
        console.log(`      期望: 通过验证`);
        console.log(`      实际: 被拒绝 - ${result.message}`);
      } else {
        console.log(`      期望: 被拒绝`);
        console.log(`      实际: 通过验证`);
      }
      failCount++;
      failedTests.push({ ...testCase, result });
    }
  });
  
  logSection('测试结果汇总');
  
  console.log(`总测试数: ${testCases.length}`);
  logSuccess(`通过: ${passCount}`);
  
  if (failCount > 0) {
    logError(`失败: ${failCount}`);
    console.log();
    logWarning('失败的测试用例：');
    failedTests.forEach(({ email, type, shouldPass, description, result }) => {
      console.log(`  - ${description}`);
      console.log(`    邮箱: ${email}`);
      console.log(`    类型: ${type}`);
      console.log(`    期望: ${shouldPass ? '通过' : '拒绝'}`);
      console.log(`    实际: ${result.valid ? '通过' : '拒绝'}`);
      if (result.message) {
        console.log(`    消息: ${result.message}`);
      }
    });
  }
  
  console.log();
  
  if (failCount === 0) {
    logSuccess('所有测试通过！✨');
    log('═'.repeat(60), 'green');
    return 0;
  } else {
    logError('部分测试失败！');
    log('═'.repeat(60), 'red');
    return 1;
  }
}

// 测试不同操作类型的错误消息
function testErrorMessages() {
  logSection('错误消息测试');
  
  const types = ['register', 'login', 'reset', 'other'];
  const testEmail = 'test@invalid-domain.com';
  
  types.forEach(type => {
    const result = checkEmailAllowed(testEmail, type);
    logInfo(`类型: ${type}`);
    console.log(`  消息: ${result.message}`);
    console.log();
  });
}

// 主函数
function main() {
  try {
    const exitCode = runTests();
    testErrorMessages();
    
    logSection('测试完成');
    
    if (exitCode === 0) {
      logSuccess('邮箱域名验证功能正常运行');
    } else {
      logError('邮箱域名验证功能存在问题，请检查配置');
    }
    
    process.exit(exitCode);
  } catch (error) {
    console.error();
    logError('测试执行出错：');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
main();

