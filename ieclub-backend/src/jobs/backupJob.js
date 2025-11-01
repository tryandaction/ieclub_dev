const backupService = require('../services/backupService');
const logger = require('../utils/logger');

/**
 * 定时备份任务
 * 每天凌晨 2 点执行完整备份
 */
class BackupJob {
  /**
   * 执行备份任务
   */
  static async execute() {
    try {
      logger.info('开始执行定时备份任务');

      const result = await backupService.createFullBackup();

      logger.info('定时备份任务完成', {
        backup: result.name,
        tables: result.metadata.tables?.length || 0
      });

      return result;
    } catch (error) {
      logger.error('定时备份任务失败', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 清理过期备份
   */
  static async cleanup() {
    try {
      logger.info('开始清理过期备份');

      await backupService.cleanOldBackups();

      logger.info('过期备份清理完成');
    } catch (error) {
      logger.error('清理过期备份失败', {
        error: error.message
      });
    }
  }
}

module.exports = BackupJob;

