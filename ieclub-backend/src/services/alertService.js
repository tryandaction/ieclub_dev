// ieclub-backend/src/services/alertService.js
// 告警服务 - 监控系统异常并发送通知

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 告警级别
 */
const ALERT_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * 告警类型
 */
const ALERT_TYPES = {
  // 系统告警
  HIGH_CPU: 'high_cpu',
  HIGH_MEMORY: 'high_memory',
  DISK_SPACE_LOW: 'disk_space_low',
  
  // 应用告警
  HIGH_ERROR_RATE: 'high_error_rate',
  SLOW_RESPONSE: 'slow_response',
  HIGH_LOAD: 'high_load',
  
  // 数据库告警
  DB_CONNECTION_FAILED: 'db_connection_failed',
  DB_SLOW_QUERY: 'db_slow_query',
  DB_DEADLOCK: 'db_deadlock',
  
  // Redis 告警
  REDIS_CONNECTION_FAILED: 'redis_connection_failed',
  REDIS_MEMORY_HIGH: 'redis_memory_high',
  
  // 业务告警
  UNUSUAL_ACTIVITY: 'unusual_activity',
  SECURITY_BREACH: 'security_breach',
  BACKUP_FAILED: 'backup_failed'
};

/**
 * 告警阈值配置
 */
const THRESHOLDS = {
  cpu: 80,              // CPU 使用率 > 80%
  memory: 85,           // 内存使用率 > 85%
  diskSpace: 90,        // 磁盘使用率 > 90%
  errorRate: 5,         // 错误率 > 5%
  responseTime: 2000,   // 响应时间 > 2s
  dbConnections: 80,    // 数据库连接数 > 80
  requestsPerSecond: 1000  // QPS > 1000
};

/**
 * 告警记录（防止重复告警）
 */
const alertHistory = new Map();
const ALERT_COOLDOWN = 5 * 60 * 1000; // 5分钟冷却期

class AlertService {
  /**
   * 发送告警
   */
  static async sendAlert({
    type,
    level = ALERT_LEVELS.WARNING,
    title,
    message,
    details = {},
    tags = []
  }) {
    try {
      // 检查是否在冷却期内
      const alertKey = `${type}_${level}`;
      const lastAlert = alertHistory.get(alertKey);
      
      if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN) {
        logger.debug(`Alert ${alertKey} is in cooldown period, skipping`);
        return;
      }
      
      // 记录告警时间
      alertHistory.set(alertKey, Date.now());
      
      // 构建告警消息
      const alert = {
        type,
        level,
        title,
        message,
        details,
        tags,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      };
      
      // 记录到日志
      logger.warn('System Alert', alert);
      
      // 发送到各个通知渠道
      await Promise.allSettled([
        this.sendToSlack(alert),
        this.sendToEmail(alert),
        this.sendToWebhook(alert),
        this.sendToSentry(alert)
      ]);
      
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }
  
  /**
   * 发送到 Slack
   */
  static async sendToSlack(alert) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    try {
      const color = {
        [ALERT_LEVELS.INFO]: '#36a64f',
        [ALERT_LEVELS.WARNING]: '#ff9800',
        [ALERT_LEVELS.ERROR]: '#f44336',
        [ALERT_LEVELS.CRITICAL]: '#d32f2f'
      }[alert.level];
      
      const emoji = {
        [ALERT_LEVELS.INFO]: ':information_source:',
        [ALERT_LEVELS.WARNING]: ':warning:',
        [ALERT_LEVELS.ERROR]: ':x:',
        [ALERT_LEVELS.CRITICAL]: ':rotating_light:'
      }[alert.level];
      
      await axios.post(webhookUrl, {
        text: `${emoji} *${alert.title}*`,
        attachments: [{
          color,
          fields: [
            {
              title: 'Level',
              value: alert.level.toUpperCase(),
              short: true
            },
            {
              title: 'Type',
              value: alert.type,
              short: true
            },
            {
              title: 'Message',
              value: alert.message,
              short: false
            },
            {
              title: 'Environment',
              value: alert.environment,
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp,
              short: true
            }
          ],
          footer: 'IEClub Alert System',
          ts: Math.floor(Date.now() / 1000)
        }]
      });
      
      logger.debug('Alert sent to Slack');
    } catch (error) {
      logger.error('Failed to send alert to Slack:', error);
    }
  }
  
  /**
   * 发送邮件告警
   */
  static async sendToEmail(alert) {
    // 仅发送 ERROR 和 CRITICAL 级别的邮件
    if (![ALERT_LEVELS.ERROR, ALERT_LEVELS.CRITICAL].includes(alert.level)) {
      return;
    }
    
    const emailService = require('./emailService');
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) return;
    
    try {
      await emailService.sendEmail({
        to: adminEmail,
        subject: `[${alert.level.toUpperCase()}] ${alert.title}`,
        html: `
          <h2>${alert.title}</h2>
          <p><strong>Level:</strong> ${alert.level}</p>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${alert.timestamp}</p>
          <p><strong>Environment:</strong> ${alert.environment}</p>
          ${alert.details ? `<pre>${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
        `
      });
      
      logger.debug('Alert sent to email');
    } catch (error) {
      logger.error('Failed to send alert email:', error);
    }
  }
  
  /**
   * 发送到自定义 Webhook
   */
  static async sendToWebhook(alert) {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    try {
      await axios.post(webhookUrl, alert, {
        headers: {
          'Content-Type': 'application/json',
          'X-Alert-Token': process.env.ALERT_WEBHOOK_TOKEN || ''
        },
        timeout: 5000
      });
      
      logger.debug('Alert sent to webhook');
    } catch (error) {
      logger.error('Failed to send alert to webhook:', error);
    }
  }
  
  /**
   * 发送到 Sentry
   */
  static async sendToSentry(alert) {
    // 仅发送 ERROR 和 CRITICAL 级别到 Sentry
    if (![ALERT_LEVELS.ERROR, ALERT_LEVELS.CRITICAL].includes(alert.level)) {
      return;
    }
    
    const Sentry = require('@sentry/node');
    if (!Sentry.isEnabled()) return;
    
    try {
      Sentry.captureMessage(alert.title, {
        level: alert.level === ALERT_LEVELS.CRITICAL ? 'fatal' : 'error',
        tags: {
          type: alert.type,
          environment: alert.environment,
          ...alert.tags
        },
        extra: {
          message: alert.message,
          details: alert.details
        }
      });
      
      logger.debug('Alert sent to Sentry');
    } catch (error) {
      logger.error('Failed to send alert to Sentry:', error);
    }
  }
  
  /**
   * 检查系统指标并触发告警
   */
  static async checkSystemMetrics(metrics) {
    // CPU 告警
    if (metrics.system.cpuUsage > THRESHOLDS.cpu) {
      await this.sendAlert({
        type: ALERT_TYPES.HIGH_CPU,
        level: ALERT_LEVELS.WARNING,
        title: 'High CPU Usage',
        message: `CPU usage is ${metrics.system.cpuUsage.toFixed(1)}%`,
        details: { cpuUsage: metrics.system.cpuUsage }
      });
    }
    
    // 内存告警
    if (metrics.system.memUsage > THRESHOLDS.memory) {
      await this.sendAlert({
        type: ALERT_TYPES.HIGH_MEMORY,
        level: ALERT_LEVELS.WARNING,
        title: 'High Memory Usage',
        message: `Memory usage is ${metrics.system.memUsage.toFixed(1)}%`,
        details: { memUsage: metrics.system.memUsage }
      });
    }
    
    // 数据库连接告警
    if (metrics.database?.connections > THRESHOLDS.dbConnections) {
      await this.sendAlert({
        type: ALERT_TYPES.HIGH_LOAD,
        level: ALERT_LEVELS.WARNING,
        title: 'High Database Connections',
        message: `Database connections: ${metrics.database.connections}`,
        details: { connections: metrics.database.connections }
      });
    }
    
    // Redis 连接失败告警
    if (metrics.redis && !metrics.redis.connected) {
      await this.sendAlert({
        type: ALERT_TYPES.REDIS_CONNECTION_FAILED,
        level: ALERT_LEVELS.ERROR,
        title: 'Redis Connection Failed',
        message: 'Unable to connect to Redis server',
        details: metrics.redis
      });
    }
  }
  
  /**
   * 检查错误率并触发告警
   */
  static async checkErrorRate(errorMetrics) {
    const errorRate = (errorMetrics.lastHour / errorMetrics.total) * 100;
    
    if (errorRate > THRESHOLDS.errorRate) {
      await this.sendAlert({
        type: ALERT_TYPES.HIGH_ERROR_RATE,
        level: ALERT_LEVELS.ERROR,
        title: 'High Error Rate',
        message: `Error rate is ${errorRate.toFixed(1)}% in the last hour`,
        details: errorMetrics
      });
    }
  }
  
  /**
   * 清理过期的告警历史
   */
  static cleanupHistory() {
    const now = Date.now();
    for (const [key, timestamp] of alertHistory.entries()) {
      if (now - timestamp > ALERT_COOLDOWN * 2) {
        alertHistory.delete(key);
      }
    }
  }
}

// 定期清理告警历史
setInterval(() => {
  AlertService.cleanupHistory();
}, 10 * 60 * 1000); // 每10分钟清理一次

module.exports = {
  AlertService,
  ALERT_LEVELS,
  ALERT_TYPES,
  THRESHOLDS
};

