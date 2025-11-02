#!/usr/bin/env node
/**
 * 数据库备份和恢复工具
 * 支持完整备份、增量备份、恢复等功能
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execPromise = promisify(exec);

const logger = {
  info: (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.warn(`\x1b[33m[WARNING]\x1b[0m ${msg}`)
};

// 配置
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // 保留最近30个备份

// 确保备份目录存在
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logger.success(`创建备份目录: ${BACKUP_DIR}`);
  }
}

// 解析数据库连接信息
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

// 获取备份文件列表
function getBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }
  
  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime
      };
    })
    .sort((a, b) => b.created - a.created);
}

// 清理旧备份
function cleanOldBackups() {
  const backups = getBackupFiles();
  
  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    logger.info(`清理 ${toDelete.length} 个旧备份文件...`);
    
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
      logger.info(`  删除: ${backup.name}`);
    });
  }
}

// 创建数据库备份
async function createBackup(options = {}) {
  const {
    compress = true,
    includeData = true,
    tables = null
  } = options;
  
  try {
    ensureBackupDir();
    
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    if (!dbConfig) {
      throw new Error('数据库配置错误');
    }
    
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    
    const filename = `backup_${dbConfig.database}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    logger.info('开始创建数据库备份...');
    logger.info(`数据库: ${dbConfig.database}`);
    logger.info(`备份文件: ${filename}`);
    
    // 构建 mysqldump 命令
    let command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user}`;
    
    if (dbConfig.password) {
      command += ` -p${dbConfig.password}`;
    }
    
    // 添加选项
    command += ' --single-transaction --quick --lock-tables=false';
    command += ' --routines --triggers --events';
    
    if (!includeData) {
      command += ' --no-data';
    }
    
    // 指定表
    if (tables && Array.isArray(tables)) {
      command += ` ${dbConfig.database} ${tables.join(' ')}`;
    } else {
      command += ` ${dbConfig.database}`;
    }
    
    // 输出到文件
    command += ` > "${filepath}"`;
    
    const startTime = Date.now();
    await execPromise(command);
    const duration = Date.now() - startTime;
    
    // 获取文件大小
    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    logger.success(`备份完成 (耗时: ${(duration / 1000).toFixed(2)}s, 大小: ${sizeMB}MB)`);
    
    // 压缩备份文件
    if (compress) {
      logger.info('压缩备份文件...');
      const gzCommand = process.platform === 'win32' 
        ? `powershell -Command "Compress-Archive -Path '${filepath}' -DestinationPath '${filepath}.zip' -Force"`
        : `gzip "${filepath}"`;
      
      try {
        await execPromise(gzCommand);
        const compressedPath = process.platform === 'win32' ? `${filepath}.zip` : `${filepath}.gz`;
        
        if (fs.existsSync(compressedPath)) {
          const compressedStats = fs.statSync(compressedPath);
          const compressedSizeMB = (compressedStats.size / 1024 / 1024).toFixed(2);
          const ratio = ((1 - compressedStats.size / stats.size) * 100).toFixed(1);
          
          logger.success(`压缩完成 (大小: ${compressedSizeMB}MB, 压缩率: ${ratio}%)`);
          
          // 删除原始文件
          if (process.platform !== 'win32') {
            // gzip 会自动删除原文件，这里不需要操作
          } else {
            fs.unlinkSync(filepath);
          }
        }
      } catch (error) {
        logger.warn('压缩失败，保留未压缩文件:', error.message);
      }
    }
    
    // 清理旧备份
    cleanOldBackups();
    
    logger.success(`备份保存至: ${BACKUP_DIR}`);
    
    return filepath;
    
  } catch (error) {
    logger.error('备份失败:', error.message);
    throw error;
  }
}

// 恢复数据库
async function restoreBackup(backupFile) {
  try {
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    if (!dbConfig) {
      throw new Error('数据库配置错误');
    }
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupFile)) {
      // 尝试在备份目录中查找
      const filename = path.basename(backupFile);
      backupFile = path.join(BACKUP_DIR, filename);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`备份文件不存在: ${backupFile}`);
      }
    }
    
    logger.info('开始恢复数据库...');
    logger.info(`备份文件: ${backupFile}`);
    logger.warn('⚠️  此操作将覆盖当前数据库！');
    
    // 如果是压缩文件，先解压
    let sqlFile = backupFile;
    if (backupFile.endsWith('.gz')) {
      logger.info('解压备份文件...');
      const decompressCommand = `gunzip -c "${backupFile}"`;
      sqlFile = backupFile.replace('.gz', '');
      
      await execPromise(`${decompressCommand} > "${sqlFile}"`);
      logger.success('解压完成');
    } else if (backupFile.endsWith('.zip')) {
      logger.info('解压备份文件...');
      const decompressCommand = `powershell -Command "Expand-Archive -Path '${backupFile}' -DestinationPath '${path.dirname(backupFile)}' -Force"`;
      await execPromise(decompressCommand);
      sqlFile = backupFile.replace('.zip', '');
      logger.success('解压完成');
    }
    
    // 构建 mysql 命令
    let command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user}`;
    
    if (dbConfig.password) {
      command += ` -p${dbConfig.password}`;
    }
    
    command += ` ${dbConfig.database} < "${sqlFile}"`;
    
    const startTime = Date.now();
    await execPromise(command);
    const duration = Date.now() - startTime;
    
    logger.success(`恢复完成 (耗时: ${(duration / 1000).toFixed(2)}s)`);
    
    // 清理临时解压的文件
    if (sqlFile !== backupFile && fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
    }
    
  } catch (error) {
    logger.error('恢复失败:', error.message);
    throw error;
  }
}

// 列出所有备份
function listBackups() {
  const backups = getBackupFiles();
  
  if (backups.length === 0) {
    logger.warn('没有找到备份文件');
    return;
  }
  
  console.log('\n可用的备份文件:\n');
  console.log(`${'序号'.padEnd(6)} ${'文件名'.padEnd(50)} ${'大小'.padEnd(12)} ${'创建时间'}`);
  console.log('-'.repeat(100));
  
  backups.forEach((backup, index) => {
    const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
    const date = backup.created.toLocaleString('zh-CN');
    
    console.log(
      `${(index + 1).toString().padEnd(6)} ` +
      `${backup.name.padEnd(50)} ` +
      `${(sizeMB + ' MB').padEnd(12)} ` +
      `${date}`
    );
  });
  
  console.log(`\n共 ${backups.length} 个备份文件`);
  console.log(`备份目录: ${BACKUP_DIR}\n`);
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  IEClub 数据库备份/恢复工具');
  console.log('========================================\n');
  
  // 加载环境变量
  require('dotenv').config();
  
  if (!process.env.DATABASE_URL) {
    logger.error('未找到 DATABASE_URL 环境变量');
    process.exit(1);
  }
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'backup':
      case 'create':
        await createBackup({ compress: true });
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          logger.error('请指定备份文件');
          logger.info('用法: node backup-restore.js restore <备份文件>');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
        
      case 'list':
        listBackups();
        break;
        
      case 'schema':
        // 只备份结构
        await createBackup({ compress: true, includeData: false });
        break;
        
      case 'clean':
        logger.info('清理旧备份...');
        cleanOldBackups();
        listBackups();
        break;
        
      default:
        console.log('使用方法:');
        console.log('  node backup-restore.js backup         - 创建完整备份');
        console.log('  node backup-restore.js restore <文件> - 恢复备份');
        console.log('  node backup-restore.js list           - 列出所有备份');
        console.log('  node backup-restore.js schema         - 只备份数据库结构');
        console.log('  node backup-restore.js clean          - 清理旧备份');
        console.log('');
        console.log('示例:');
        console.log('  node backup-restore.js backup');
        console.log('  node backup-restore.js restore backup_ieclub_2025-11-02.sql.gz');
        break;
    }
  } catch (error) {
    logger.error('操作失败:', error);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups
};

