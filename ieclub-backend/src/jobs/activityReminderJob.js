// 活动提醒定时任务
const cron = require('node-cron');
const activityReminderService = require('../services/activityReminderService');
const logger = require('../utils/logger');

/**
 * 初始化活动提醒定时任务
 */
function initActivityReminderJob() {
  // 每分钟检查一次即将开始的活动
  cron.schedule('* * * * *', async () => {
    try {
      // 发送30分钟后活动的提醒
      await activityReminderService.sendUpcomingActivityReminders();
      
      // 发送刚开始活动的通知
      await activityReminderService.sendActivityStartNotifications();
    } catch (error) {
      logger.error('活动提醒定时任务执行失败:', error);
    }
  });

  logger.info('活动提醒定时任务已启动');
}

module.exports = { initActivityReminderJob };
