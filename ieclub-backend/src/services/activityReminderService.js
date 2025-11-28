// 活动提醒服务 - 活动开始前发送通知给参与者
const prisma = require('../config/database');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class ActivityReminderService {
  /**
   * 发送活动提醒
   * 查找即将开始的活动（30分钟内），给所有已报名的参与者发送提醒
   */
  async sendUpcomingActivityReminders() {
    try {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
      const thirtyOneMinutesLater = new Date(now.getTime() + 31 * 60 * 1000);

      // 查找30-31分钟后开始的活动（避免重复发送）
      const upcomingActivities = await prisma.activity.findMany({
        where: {
          startTime: {
            gte: thirtyMinutesLater,
            lt: thirtyOneMinutesLater
          }
        },
        include: {
          participants: {
            where: {
              status: 'confirmed'
            },
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true
                }
              }
            }
          },
          organizer: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      });

      let reminderCount = 0;

      for (const activity of upcomingActivities) {
        // 给每个参与者发送提醒
        for (const participant of activity.participants) {
          await this.sendReminderNotification(
            participant.user.id,
            activity
          );
          reminderCount++;
        }

        // 也给组织者发送提醒
        await this.sendOrganizerReminderNotification(
          activity.organizer.id,
          activity
        );
        reminderCount++;

        logger.info(`活动提醒已发送: ${activity.title}, 参与者: ${activity.participants.length}人`);
      }

      if (upcomingActivities.length > 0) {
        logger.info(`活动提醒任务完成: ${upcomingActivities.length}个活动, ${reminderCount}条提醒`);
      }

      return { activitiesCount: upcomingActivities.length, remindersCount: reminderCount };
    } catch (error) {
      logger.error('发送活动提醒失败:', error);
      throw error;
    }
  }

  /**
   * 给参与者发送提醒通知
   */
  async sendReminderNotification(userId, activity) {
    try {
      const startTime = new Date(activity.startTime);
      const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

      await notificationService.createNotification({
        type: 'activity_reminder',
        userId,
        title: '活动即将开始',
        content: `【${activity.title}】将在30分钟后（${timeStr}）开始，地点：${activity.location}，请提前准备！`,
        link: `/activity/${activity.id}`,
        targetId: activity.id,
        targetType: 'activity'
      });
    } catch (error) {
      logger.error(`发送参与者提醒失败 userId=${userId}:`, error);
    }
  }

  /**
   * 给组织者发送提醒通知
   */
  async sendOrganizerReminderNotification(organizerId, activity) {
    try {
      const startTime = new Date(activity.startTime);
      const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

      await notificationService.createNotification({
        type: 'activity_reminder',
        userId: organizerId,
        title: '您组织的活动即将开始',
        content: `【${activity.title}】将在30分钟后（${timeStr}）开始，已有${activity.participantsCount || 0}人报名，请准备好签到！`,
        link: `/activity/${activity.id}`,
        targetId: activity.id,
        targetType: 'activity'
      });
    } catch (error) {
      logger.error(`发送组织者提醒失败 organizerId=${organizerId}:`, error);
    }
  }

  /**
   * 发送活动开始通知
   * 活动开始时通知所有已报名但未签到的参与者
   */
  async sendActivityStartNotifications() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      // 查找刚刚开始的活动（1分钟内）
      const startingActivities = await prisma.activity.findMany({
        where: {
          startTime: {
            gte: oneMinuteAgo,
            lte: now
          }
        },
        include: {
          participants: {
            where: {
              status: 'confirmed',
              checkedIn: false
            },
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true
                }
              }
            }
          }
        }
      });

      for (const activity of startingActivities) {
        for (const participant of activity.participants) {
          await notificationService.createNotification({
            type: 'activity_started',
            userId: participant.user.id,
            title: '活动已开始',
            content: `【${activity.title}】已经开始了，请尽快前往${activity.location}签到！`,
            link: `/activity/${activity.id}`,
            targetId: activity.id,
            targetType: 'activity'
          });
        }
      }

      return { activitiesCount: startingActivities.length };
    } catch (error) {
      logger.error('发送活动开始通知失败:', error);
      throw error;
    }
  }

  /**
   * 发送活动取消通知
   */
  async sendActivityCancelledNotification(activityId, reason = '') {
    try {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: {
          participants: {
            where: { status: 'confirmed' },
            include: {
              user: {
                select: { id: true, nickname: true }
              }
            }
          }
        }
      });

      if (!activity) return;

      for (const participant of activity.participants) {
        await notificationService.createNotification({
          type: 'activity_cancelled',
          userId: participant.user.id,
          title: '活动已取消',
          content: `很抱歉，【${activity.title}】已取消${reason ? `，原因：${reason}` : ''}`,
          link: `/activity/${activityId}`,
          targetId: activityId,
          targetType: 'activity'
        });
      }

      logger.info(`活动取消通知已发送: ${activity.title}`);
    } catch (error) {
      logger.error('发送活动取消通知失败:', error);
    }
  }
}

module.exports = new ActivityReminderService();
