// ==================== 智能推送系统优化 ====================

import type { PushNotification, NotificationSettings } from '../types'

interface PushRule {
  type: string
  priority: 'critical' | 'important' | 'normal'
  canMerge: boolean
  maxDaily: number
}

const PUSH_RULES: Record<string, PushRule> = {
  mention: {
    type: '@提及',
    priority: 'critical',
    canMerge: false,
    maxDaily: 99  // 不限制
  },
  match_success: {
    type: '匹配成功',
    priority: 'critical',
    canMerge: false,
    maxDaily: 5
  },
  urgent_help: {
    type: '紧急求助',
    priority: 'critical',
    canMerge: false,
    maxDaily: 10
  },
  comment: {
    type: '新评论',
    priority: 'important',
    canMerge: true,
    maxDaily: 3
  },
  like: {
    type: '点赞',
    priority: 'important',
    canMerge: true,
    maxDaily: 2
  },
  trending: {
    type: '热点话题',
    priority: 'normal',
    canMerge: true,
    maxDaily: 1
  },
  recommendation: {
    type: '推荐内容',
    priority: 'normal',
    canMerge: true,
    maxDaily: 1
  }
}

export class SmartPushManager {
  private readonly DAILY_LIMIT = 3  // 每日推送绝对上限
  private readonly MERGE_WINDOW = 5 * 60 * 1000  // 5分钟合并窗口

  private pushQueue: Map<string, PushNotification[]> = new Map()
  private userPushCount: Map<string, number> = new Map()

  /**
   * 决定是否应该推送
   */
  async shouldPush(userId: string, notification: PushNotification): Promise<boolean> {
    // 1. 检查每日总量
    const todayCount = this.getTodayPushCount(userId)
    if (todayCount >= this.DAILY_LIMIT) {
      console.log('达到每日推送上限')
      return false
    }

    // 2. 检查用户设置
    const settings = await this.getUserSettings(userId)
    if (!settings.enabled || !settings.types[notification.type as keyof typeof settings.types]) {
      return false
    }

    // 3. 检查免打扰时段
    if (this.isQuietHours(settings.quietHours)) {
      // 关键通知例外
      if (PUSH_RULES[notification.type]?.priority !== 'critical') {
        return false
      }
    }

    // 4. 检查该类型今日已推送次数
    const typeCount = this.getTypePushCount(userId, notification.type)
    const rule = PUSH_RULES[notification.type]
    if (typeCount >= rule.maxDaily) {
      return false
    }

    // 5. 检查用户活跃状态
    const isUserActive = await this.isUserCurrentlyActive(userId)
    if (isUserActive) {
      // 用户正在使用，不推送（应用内显示即可）
      return false
    }

    return true
  }

  /**
   * 智能推送（包含合并逻辑）
   */
  async smartPush(userId: string, notification: PushNotification) {
    const rule = PUSH_RULES[notification.type]

    // 关键通知立即推送
    if (rule.priority === 'critical') {
      await this.sendPush(userId, notification)
      this.incrementPushCount(userId, notification.type)
      return
    }

    // 可合并通知加入队列
    if (rule.canMerge) {
      this.addToQueue(userId, notification)

      // 设置延迟推送
      setTimeout(() => {
        this.flushQueue(userId, notification.type)
      }, this.MERGE_WINDOW)
    } else {
      await this.sendPush(userId, notification)
      this.incrementPushCount(userId, notification.type)
    }
  }

  /**
   * 合并推送
   */
  private async flushQueue(userId: string, type: string) {
    const key = `${userId}-${type}`
    const notifications = this.pushQueue.get(key) || []

    if (notifications.length === 0) return

    // 合并成一条推送
    const merged = this.mergeNotifications(notifications)
    await this.sendPush(userId, merged)
    this.incrementPushCount(userId, type)

    // 清空队列
    this.pushQueue.delete(key)
  }

  /**
   * 合并多条通知
   */
  private mergeNotifications(notifications: PushNotification[]): PushNotification {
    const first = notifications[0]
    const count = notifications.length

    if (first.type === 'interaction' && first.data?.action === 'comment') {
      return {
        ...first,
        title: `收到${count}条新评论`,
        content: notifications.map(n => n.content).slice(0, 3).join('、') +
                 (count > 3 ? `等${count}条评论` : '')
      }
    }

    if (first.type === 'interaction' && first.data?.action === 'like') {
      return {
        ...first,
        title: `${count}人赞了你`,
        content: notifications.map(n => n.data.userName).slice(0, 5).join('、') +
                 (count > 5 ? `等${count}人` : '') + '赞了你的话题'
      }
    }

    return first
  }

  // 辅助方法
  private addToQueue(userId: string, notification: PushNotification) {
    const key = `${userId}-${notification.type}`
    const queue = this.pushQueue.get(key) || []
    queue.push(notification)
    this.pushQueue.set(key, queue)
  }

  private getTodayPushCount(userId: string): number {
    // 从缓存或数据库获取
    return this.userPushCount.get(userId) || 0
  }

  private getTypePushCount(userId: string, type: string): number {
    // 实际实现中从数据库查询
    return 0
  }

  private incrementPushCount(userId: string, type: string) {
    const current = this.userPushCount.get(userId) || 0
    this.userPushCount.set(userId, current + 1)
  }

  private isQuietHours(config: any): boolean {
    if (!config.enabled) return false

    const now = new Date()
    const hour = now.getHours()
    const [startHour] = config.start.split(':').map(Number)
    const [endHour] = config.end.split(':').map(Number)

    if (startHour < endHour) {
      return hour >= startHour && hour < endHour
    } else {
      return hour >= startHour || hour < endHour
    }
  }

  private async isUserCurrentlyActive(userId: string): Promise<boolean> {
    // 检查用户最后活跃时间
    const lastActive = await this.getLastActiveTime(userId)
    return Date.now() - lastActive < 60000  // 1分钟内活跃
  }

  private async getUserSettings(userId: string): Promise<NotificationSettings> {
    // 从数据库获取用户设置
    return {
      enabled: true,
      types: {
        likes: true,
        comments: true,
        mentions: true,
        follows: true,
        matching: true,
        trending: true,
        daily: true,
        weekly: true
      },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      frequency: 'realtime',
      channels: { inApp: true, push: true, email: false, sms: false }
    }
  }

  private async getLastActiveTime(userId: string): Promise<number> {
    // 从Redis获取
    return 0
  }

  private async sendPush(userId: string, notification: PushNotification) {
    // 实际推送实现
    console.log('发送推送:', userId, notification)
  }
}

// 全局实例
export const smartPushManager = new SmartPushManager()