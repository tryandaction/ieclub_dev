const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const archiver = require('archiver');
const unzipper = require('unzipper');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxBackups = 10; // 保留最多10个备份
  }

  /**
   * 初始化备份目录
   */
  async initBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      logger.info('备份目录已创建', { dir: this.backupDir });
    } catch (error) {
      logger.error('创建备份目录失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建数据库备份
   */
  async backupDatabase() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `db_backup_${timestamp}.sql`);

      // 从环境变量获取数据库配置
      const dbUrl = process.env.DATABASE_URL;
      const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      
      if (!match) {
        throw new Error('无法解析数据库URL');
      }

      const [, user, password, host, port, database] = match;

      // 使用 mysqldump 备份数据库
      const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > ${backupFile}`;
      
      await execPromise(command);

      logger.info('数据库备份成功', { file: backupFile });
      return backupFile;
    } catch (error) {
      logger.error('数据库备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 备份上传文件
   */
  async backupUploads() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `uploads_backup_${timestamp}.zip`);
      const uploadsDir = path.join(__dirname, '../../uploads');

      // 检查上传目录是否存在
      try {
        await fs.access(uploadsDir);
      } catch {
        logger.warn('上传目录不存在，跳过备份');
        return null;
      }

      // 创建 zip 压缩包
      const output = require('fs').createWriteStream(backupFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          logger.info('上传文件备份成功', { 
            file: backupFile, 
            size: archive.pointer() 
          });
          resolve(backupFile);
        });

        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(uploadsDir, false);
        archive.finalize();
      });
    } catch (error) {
      logger.error('上传文件备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 备份 Redis 数据
   */
  async backupRedis() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `redis_backup_${timestamp}.json`);

      // 获取所有 keys
      const keys = await redis.keys('*');
      const data = {};

      for (const key of keys) {
        const type = await redis.type(key);
        
        switch (type) {
          case 'string':
            data[key] = await redis.get(key);
            break;
          case 'hash':
            data[key] = await redis.hgetall(key);
            break;
          case 'list':
            data[key] = await redis.lrange(key, 0, -1);
            break;
          case 'set':
            data[key] = await redis.smembers(key);
            break;
          case 'zset':
            data[key] = await redis.zrange(key, 0, -1, 'WITHSCORES');
            break;
        }
      }

      await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
      logger.info('Redis备份成功', { file: backupFile, keys: keys.length });
      return backupFile;
    } catch (error) {
      logger.error('Redis备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 创建完整备份
   */
  async createFullBackup() {
    try {
      await this.initBackupDir();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `full_backup_${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // 创建备份子目录
      await fs.mkdir(backupPath, { recursive: true });

      // 备份数据库
      const dbBackup = await this.backupDatabase();
      await fs.rename(dbBackup, path.join(backupPath, 'database.sql'));

      // 备份上传文件
      const uploadsBackup = await this.backupUploads();
      if (uploadsBackup) {
        await fs.rename(uploadsBackup, path.join(backupPath, 'uploads.zip'));
      }

      // 备份 Redis
      const redisBackup = await this.backupRedis();
      await fs.rename(redisBackup, path.join(backupPath, 'redis.json'));

      // 创建元数据文件
      const metadata = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: await this.getDatabaseTables(),
        files: await fs.readdir(backupPath)
      };

      await fs.writeFile(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // 清理旧备份
      await this.cleanOldBackups();

      logger.info('完整备份创建成功', { path: backupPath });
      return {
        name: backupName,
        path: backupPath,
        metadata
      };
    } catch (error) {
      logger.error('创建完整备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 获取数据库表列表
   */
  async getDatabaseTables() {
    try {
      const tables = await prisma.$queryRaw`SHOW TABLES`;
      return tables.map(t => Object.values(t)[0]);
    } catch (error) {
      logger.error('获取数据库表失败', { error: error.message });
      return [];
    }
  }

  /**
   * 恢复数据库
   */
  async restoreDatabase(backupFile) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      
      if (!match) {
        throw new Error('无法解析数据库URL');
      }

      const [, user, password, host, port, database] = match;

      // 使用 mysql 恢复数据库
      const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${backupFile}`;
      
      await execPromise(command);

      logger.info('数据库恢复成功', { file: backupFile });
    } catch (error) {
      logger.error('数据库恢复失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 恢复上传文件
   */
  async restoreUploads(backupFile) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');

      // 清空现有上传目录
      try {
        await fs.rm(uploadsDir, { recursive: true, force: true });
      } catch (err) {
        // 忽略删除错误
      }

      await fs.mkdir(uploadsDir, { recursive: true });

      // 解压备份文件
      await require('fs').createReadStream(backupFile)
        .pipe(unzipper.Extract({ path: uploadsDir }))
        .promise();

      logger.info('上传文件恢复成功', { file: backupFile });
    } catch (error) {
      logger.error('上传文件恢复失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 恢复 Redis 数据
   */
  async restoreRedis(backupFile) {
    try {
      const content = await fs.readFile(backupFile, 'utf-8');
      const data = JSON.parse(content);

      // 清空现有数据
      await redis.flushdb();

      // 恢复数据
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          await redis.set(key, value);
        } else if (Array.isArray(value)) {
          await redis.rpush(key, ...value);
        } else if (typeof value === 'object') {
          await redis.hset(key, value);
        }
      }

      logger.info('Redis恢复成功', { file: backupFile, keys: Object.keys(data).length });
    } catch (error) {
      logger.error('Redis恢复失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 恢复完整备份
   */
  async restoreFullBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      // 检查备份是否存在
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error('备份不存在');
      }

      // 读取元数据
      const metadataPath = path.join(backupPath, 'metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

      logger.info('开始恢复备份', { backup: backupName, metadata });

      // 恢复数据库
      const dbFile = path.join(backupPath, 'database.sql');
      if (await this.fileExists(dbFile)) {
        await this.restoreDatabase(dbFile);
      }

      // 恢复上传文件
      const uploadsFile = path.join(backupPath, 'uploads.zip');
      if (await this.fileExists(uploadsFile)) {
        await this.restoreUploads(uploadsFile);
      }

      // 恢复 Redis
      const redisFile = path.join(backupPath, 'redis.json');
      if (await this.fileExists(redisFile)) {
        await this.restoreRedis(redisFile);
      }

      logger.info('完整备份恢复成功', { backup: backupName });
      return metadata;
    } catch (error) {
      logger.error('恢复完整备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 列出所有备份
   */
  async listBackups() {
    try {
      await this.initBackupDir();
      const files = await fs.readdir(this.backupDir, { withFileTypes: true });
      
      const backups = [];
      for (const file of files) {
        if (file.isDirectory() && file.name.startsWith('full_backup_')) {
          const metadataPath = path.join(this.backupDir, file.name, 'metadata.json');
          
          try {
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            const stats = await fs.stat(path.join(this.backupDir, file.name));
            
            backups.push({
              name: file.name,
              timestamp: metadata.timestamp,
              version: metadata.version,
              size: await this.getDirectorySize(path.join(this.backupDir, file.name)),
              created: stats.ctime,
              tables: metadata.tables?.length || 0
            });
          } catch {
            // 跳过无效备份
          }
        }
      }

      // 按时间倒序排列
      backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return backups;
    } catch (error) {
      logger.error('列出备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      await fs.rm(backupPath, { recursive: true, force: true });
      logger.info('备份已删除', { backup: backupName });
    } catch (error) {
      logger.error('删除备份失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 清理旧备份
   */
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.name);
          logger.info('删除旧备份', { backup: backup.name });
        }
      }
    } catch (error) {
      logger.error('清理旧备份失败', { error: error.message });
    }
  }

  /**
   * 获取目录大小
   */
  async getDirectorySize(dir) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    let size = 0;

    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        size += stats.size;
      }
    }

    return size;
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 导出特定表数据
   */
  async exportTable(tableName) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = path.join(this.backupDir, `${tableName}_export_${timestamp}.json`);

      // 使用 Prisma 查询数据
      const data = await prisma[tableName].findMany();

      await fs.writeFile(exportFile, JSON.stringify(data, null, 2));
      logger.info('表数据导出成功', { table: tableName, file: exportFile });

      return {
        file: exportFile,
        records: data.length
      };
    } catch (error) {
      logger.error('导出表数据失败', { table: tableName, error: error.message });
      throw error;
    }
  }

  /**
   * 导入表数据
   */
  async importTable(tableName, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // 使用事务批量插入
      await prisma.$transaction(
        data.map(record => prisma[tableName].create({ data: record }))
      );

      logger.info('表数据导入成功', { table: tableName, records: data.length });
      return data.length;
    } catch (error) {
      logger.error('导入表数据失败', { table: tableName, error: error.message });
      throw error;
    }
  }
}

module.exports = new BackupService();

