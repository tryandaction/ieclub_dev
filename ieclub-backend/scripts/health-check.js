#!/usr/bin/env node
/**
 * 系统健康检查工具
 * 检查数据库、Redis、API、文件系统等
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const prisma = new PrismaClient();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const logger = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[✗]${colors.reset} ${msg}`),
  warn: (msg) => console.warn(`${colors.yellow}[!]${colors.reset} ${msg}`)
};

// 检查结果统计
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// 1. 检查数据库连接
async function checkDatabase() {
  console.log('\n【数据库检查】');
  
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - startTime;
    
    logger.success(`数据库连接正常 (延迟: ${latency}ms)`);
    
    if (latency > 100) {
      logger.warn(`数据库延迟较高: ${latency}ms`);
      results.warnings++;
    }
    
    // 检查数据库版本
    const versionResult = await prisma.$queryRaw`SELECT VERSION() as version`;
    logger.info(`数据库版本: ${versionResult[0].version}`);
    
    // 检查连接数
    const processListResult = await prisma.$queryRaw`SHOW PROCESSLIST`;
    logger.info(`当前连接数: ${processListResult.length}`);
    
    results.passed++;
    return true;
  } catch (error) {
    logger.error(`数据库连接失败: ${error.message}`);
    results.failed++;
    return false;
  }
}

// 2. 检查 Redis 连接
async function checkRedis() {
  console.log('\n【Redis 检查】');
  
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      connectTimeout: 5000,
      maxRetriesPerRequest: 1
    });
    
    const startTime = Date.now();
    await redis.ping();
    const latency = Date.now() - startTime;
    
    logger.success(`Redis 连接正常 (延迟: ${latency}ms)`);
    
    // 获取 Redis 信息
    const info = await redis.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      logger.info(`Redis 版本: ${versionMatch[1]}`);
    }
    
    // 检查内存使用
    const memInfo = await redis.info('memory');
    const usedMemMatch = memInfo.match(/used_memory_human:([^\r\n]+)/);
    if (usedMemMatch) {
      logger.info(`Redis 内存使用: ${usedMemMatch[1]}`);
    }
    
    await redis.quit();
    results.passed++;
    return true;
  } catch (error) {
    logger.warn(`Redis 连接失败: ${error.message}`);
    logger.info('提示: Redis 是可选的，不影响基本功能');
    results.warnings++;
    return false;
  }
}

// 3. 检查 API 端点
async function checkApiEndpoints() {
  console.log('\n【API 端点检查】');
  
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  const endpoints = [
    { path: '/health', name: '健康检查' },
    { path: '/api', name: 'API 根路径' },
    { path: '/api/topics', name: '话题列表' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint.path}`;
      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 5000 });
      const latency = Date.now() - startTime;
      
      if (response.status === 200) {
        logger.success(`${endpoint.name}: ${url} (${latency}ms)`);
        results.passed++;
      } else {
        logger.warn(`${endpoint.name}: 状态码 ${response.status}`);
        results.warnings++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logger.warn(`${endpoint.name}: 服务未启动`);
      } else {
        logger.error(`${endpoint.name}: ${error.message}`);
      }
      results.failed++;
    }
  }
}

// 4. 检查文件系统
async function checkFileSystem() {
  console.log('\n【文件系统检查】');
  
  const criticalPaths = [
    { path: 'uploads', name: '上传目录', required: true },
    { path: 'logs', name: '日志目录', required: true },
    { path: 'backups', name: '备份目录', required: false }
  ];
  
  const projectRoot = path.join(__dirname, '..');
  
  for (const item of criticalPaths) {
    const fullPath = path.join(projectRoot, item.path);
    
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // 检查权限（尝试在目录中创建测试文件）
          const testFile = path.join(fullPath, '.health-check-test');
          try {
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            logger.success(`${item.name}: ${fullPath} (可读写)`);
            results.passed++;
          } catch (error) {
            logger.error(`${item.name}: 没有写入权限`);
            results.failed++;
          }
        } else {
          logger.error(`${item.name}: 不是目录`);
          results.failed++;
        }
      } else {
        if (item.required) {
          logger.error(`${item.name}: 目录不存在 - ${fullPath}`);
          results.failed++;
        } else {
          logger.warn(`${item.name}: 目录不存在 (可选)`);
          results.warnings++;
        }
      }
    } catch (error) {
      logger.error(`${item.name}: 检查失败 - ${error.message}`);
      results.failed++;
    }
  }
}

// 5. 检查环境变量
function checkEnvironmentVariables() {
  console.log('\n【环境变量检查】');
  
  const requiredVars = [
    { key: 'NODE_ENV', name: '运行环境' },
    { key: 'DATABASE_URL', name: '数据库连接' },
    { key: 'JWT_SECRET', name: 'JWT 密钥' }
  ];
  
  const optionalVars = [
    { key: 'REDIS_HOST', name: 'Redis 主机' },
    { key: 'WECHAT_APPID', name: '微信 AppID' },
    { key: 'OSS_BUCKET', name: 'OSS 存储桶' }
  ];
  
  // 检查必需变量
  for (const varInfo of requiredVars) {
    if (process.env[varInfo.key]) {
      const value = varInfo.key.includes('SECRET') || varInfo.key.includes('PASSWORD')
        ? '***'
        : process.env[varInfo.key].substring(0, 50) + '...';
      
      logger.success(`${varInfo.name} (${varInfo.key}): ${value}`);
      results.passed++;
    } else {
      logger.error(`${varInfo.name} (${varInfo.key}): 未设置`);
      results.failed++;
    }
  }
  
  // 检查可选变量
  let optionalCount = 0;
  for (const varInfo of optionalVars) {
    if (process.env[varInfo.key]) {
      optionalCount++;
    }
  }
  
  logger.info(`可选配置: ${optionalCount}/${optionalVars.length} 已配置`);
}

// 6. 检查系统资源
function checkSystemResources() {
  console.log('\n【系统资源检查】');
  
  // CPU
  const cpus = os.cpus();
  logger.info(`CPU: ${cpus[0].model} (${cpus.length} 核心)`);
  
  // 内存
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  
  logger.info(`内存: ${usedMem}GB / ${totalMem}GB (使用率: ${memUsagePercent}%)`);
  
  if (memUsagePercent > 90) {
    logger.warn('内存使用率过高！');
    results.warnings++;
  } else {
    results.passed++;
  }
  
  // 磁盘（Node.js 没有内置方法，需要使用外部命令）
  logger.info(`操作系统: ${os.platform()} ${os.release()}`);
  logger.info(`Node.js: ${process.version}`);
  logger.info(`运行时间: ${(process.uptime() / 3600).toFixed(2)} 小时`);
  
  results.passed++;
}

// 7. 检查数据库数据完整性
async function checkDataIntegrity() {
  console.log('\n【数据完整性检查】');
  
  try {
    // 检查基础表是否存在数据
    const userCount = await prisma.user.count();
    const topicCount = await prisma.topic.count();
    const commentCount = await prisma.comment.count();
    
    logger.info(`用户数: ${userCount}`);
    logger.info(`话题数: ${topicCount}`);
    logger.info(`评论数: ${commentCount}`);
    
    if (userCount === 0) {
      logger.warn('系统中没有用户数据');
      results.warnings++;
    }
    
    // 检查孤立数据
    const orphanedTopics = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Topic t
      LEFT JOIN User u ON t.authorId = u.id
      WHERE u.id IS NULL
    `;
    
    if (orphanedTopics[0].count > 0) {
      logger.warn(`发现 ${orphanedTopics[0].count} 个孤立话题（作者不存在）`);
      results.warnings++;
    } else {
      logger.success('未发现孤立话题');
      results.passed++;
    }
    
    const orphanedComments = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM Comment c
      LEFT JOIN Topic t ON c.topicId = t.id
      WHERE t.id IS NULL
    `;
    
    if (orphanedComments[0].count > 0) {
      logger.warn(`发现 ${orphanedComments[0].count} 个孤立评论（话题不存在）`);
      results.warnings++;
    } else {
      logger.success('未发现孤立评论');
      results.passed++;
    }
    
  } catch (error) {
    logger.error(`数据完整性检查失败: ${error.message}`);
    results.failed++;
  }
}

// 生成健康报告
function generateReport() {
  console.log('\n========================================');
  console.log('  健康检查报告');
  console.log('========================================\n');
  
  const total = results.passed + results.failed + results.warnings;
  const healthScore = total > 0 
    ? ((results.passed / total) * 100).toFixed(1) 
    : 0;
  
  console.log(`检查项目: ${total}`);
  console.log(`${colors.green}✓ 通过: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ 失败: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}! 警告: ${results.warnings}${colors.reset}`);
  console.log(`\n健康评分: ${healthScore}%`);
  
  if (results.failed === 0 && results.warnings === 0) {
    console.log(`\n${colors.green}系统状态: 优秀 ✨${colors.reset}`);
    return 0;
  } else if (results.failed === 0) {
    console.log(`\n${colors.yellow}系统状态: 良好 (有些小问题需要注意)${colors.reset}`);
    return 0;
  } else {
    console.log(`\n${colors.red}系统状态: 异常 (存在严重问题)${colors.reset}`);
    return 1;
  }
}

// 主函数
async function main() {
  console.log(`${colors.blue}========================================`);
  console.log('  IEClub 系统健康检查');
  console.log(`========================================${colors.reset}`);
  
  // 加载环境变量
  require('dotenv').config();
  
  try {
    // 执行所有检查
    checkEnvironmentVariables();
    await checkDatabase();
    await checkRedis();
    await checkFileSystem();
    checkSystemResources();
    await checkDataIntegrity();
    
    // 如果服务正在运行，检查 API
    if (process.env.API_BASE_URL || process.argv.includes('--check-api')) {
      await checkApiEndpoints();
    } else {
      logger.info('\n【跳过 API 检查】使用 --check-api 参数启用');
    }
    
    // 生成报告
    const exitCode = generateReport();
    
    await prisma.$disconnect();
    process.exit(exitCode);
    
  } catch (error) {
    logger.error('健康检查出错:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = {
  checkDatabase,
  checkRedis,
  checkFileSystem,
  checkEnvironmentVariables,
  checkSystemResources,
  checkDataIntegrity
};

