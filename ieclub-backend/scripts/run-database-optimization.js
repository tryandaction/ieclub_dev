#!/usr/bin/env node
/**
 * 数据库优化脚本执行器
 * 自动执行数据库优化SQL脚本
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 日志函数
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m[WARNING]\x1b[0m ${msg}`)
};

// 从环境变量解析数据库连接信息
function parseDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl.replace('mysql://', 'http://'));
    return {
      user: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || '3306',
      database: url.pathname.substring(1)
    };
  } catch (error) {
    logger.error('无法解析 DATABASE_URL:', error.message);
    return null;
  }
}

// 执行 SQL 脚本
function executeSqlScript(scriptPath, dbConfig) {
  return new Promise((resolve, reject) => {
    const { user, password, host, port, database } = dbConfig;
    
    // 构建 MySQL 命令
    const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < "${scriptPath}"`;
    
    logger.info('执行数据库优化脚本...');
    logger.info(`数据库: ${database}@${host}:${port}`);
    logger.info(`脚本: ${scriptPath}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('Warning')) {
        logger.warn('SQL 警告:');
        console.log(stderr);
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      resolve();
    });
  });
}

// 使用 Prisma 执行 SQL（推荐方式）
async function executeSqlWithPrisma(scriptPath) {
  try {
    logger.info('使用 Prisma 执行优化脚本...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // 读取 SQL 文件
    const sqlContent = fs.readFileSync(scriptPath, 'utf-8');
    
    // 分割成单独的语句（简单处理，可能需要更复杂的解析）
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.toUpperCase() !== 'USE IECLUB');
    
    logger.info(`准备执行 ${statements.length} 条 SQL 语句...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        // 跳过某些特殊语句
        if (
          statement.includes('DELIMITER') ||
          statement.includes('CREATE OR REPLACE VIEW') ||
          statement.includes('DROP PROCEDURE') ||
          statement.includes('CREATE PROCEDURE') ||
          statement.includes('information_schema')
        ) {
          logger.warn(`跳过语句 ${i + 1}: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        if (statement.includes('ADD INDEX') || statement.includes('ANALYZE') || statement.includes('OPTIMIZE')) {
          logger.success(`✓ 执行成功 (${i + 1}/${statements.length}): ${statement.substring(0, 60)}...`);
        }
      } catch (error) {
        // 某些错误可以忽略（如索引已存在）
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists')) {
          logger.warn(`跳过已存在的对象: ${error.message.substring(0, 80)}...`);
        } else {
          logger.error(`执行失败 (${i + 1}): ${statement.substring(0, 60)}...`);
          logger.error(`错误: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    await prisma.$disconnect();
    
    logger.success(`\n执行完成: ${successCount} 成功, ${errorCount} 失败`);
    
  } catch (error) {
    logger.error('Prisma 执行失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  IEClub 数据库优化工具');
  console.log('========================================\n');
  
  // 加载环境变量
  require('dotenv').config();
  
  if (!process.env.DATABASE_URL) {
    logger.error('未找到 DATABASE_URL 环境变量');
    logger.info('请在 .env 文件中配置数据库连接信息');
    process.exit(1);
  }
  
  const scriptPath = path.join(__dirname, 'optimize-database.sql');
  
  if (!fs.existsSync(scriptPath)) {
    logger.error(`SQL 脚本不存在: ${scriptPath}`);
    process.exit(1);
  }
  
  try {
    // 使用 Prisma 执行（推荐）
    await executeSqlWithPrisma(scriptPath);
    
    console.log('\n========================================');
    logger.success('数据库优化完成！');
    console.log('========================================');
    console.log('\n建议：');
    console.log('  1. 每月运行一次此脚本以保持最佳性能');
    console.log('  2. 定期检查慢查询日志');
    console.log('  3. 监控数据库性能指标');
    console.log('  4. 根据实际使用情况调整索引\n');
    
  } catch (error) {
    logger.error('优化失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = { executeSqlWithPrisma };

