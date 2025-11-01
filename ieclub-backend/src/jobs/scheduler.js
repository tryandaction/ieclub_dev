const cron = require('node-cron');
const BackupJob = require('./backupJob');
const logger = require('../utils/logger');

class JobScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * 启动所有定时任务
   */
  start() {
    logger.info('启动定时任务调度器');

    // 每天凌晨 2 点执行备份
    const backupTask = cron.schedule('0 2 * * *', async () => {
      logger.info('执行定时备份任务');
      try {
        await BackupJob.execute();
      } catch (error) {
        logger.error('定时备份任务失败', { error: error.message });
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    // 每天凌晨 3 点清理过期备份
    const cleanupTask = cron.schedule('0 3 * * *', async () => {
      logger.info('执行备份清理任务');
      try {
        await BackupJob.cleanup();
      } catch (error) {
        logger.error('备份清理任务失败', { error: error.message });
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    // 启动任务
    backupTask.start();
    cleanupTask.start();

    this.jobs.push({
      name: 'backup',
      task: backupTask,
      schedule: '0 2 * * *'
    });

    this.jobs.push({
      name: 'cleanup',
      task: cleanupTask,
      schedule: '0 3 * * *'
    });

    logger.info('定时任务调度器启动成功', {
      jobs: this.jobs.map(j => ({
        name: j.name,
        schedule: j.schedule
      }))
    });
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    logger.info('停止定时任务调度器');

    for (const job of this.jobs) {
      job.task.stop();
    }

    this.jobs = [];
    logger.info('所有定时任务已停止');
  }

  /**
   * 获取任务列表
   */
  getJobs() {
    return this.jobs.map(j => ({
      name: j.name,
      schedule: j.schedule,
      status: 'running'
    }));
  }
}

module.exports = new JobScheduler();

