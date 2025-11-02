/**
 * 告警系统
 * 支持多种告警渠道：邮件、钉钉、企业微信、Slack
 */

const logger = require('./logger');
const nodemailer = require('nodemailer');
const axios = require('axios');

class AlertSystem {
  constructor() {
    this.config = {
      // 邮件配置
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL_TO?.split(',') || [],
      },
      
      // 钉钉配置
      dingtalk: {
        enabled: process.env.ALERT_DINGTALK_ENABLED === 'true',
        webhook: process.env.DINGTALK_WEBHOOK,
        secret: process.env.DINGTALK_SECRET,
      },
      
      // 企业微信配置
      wecom: {
        enabled: process.env.ALERT_WECOM_ENABLED === 'true',
        webhook: process.env.WECOM_WEBHOOK,
      },
      
      // Slack 配置
      slack: {
        enabled: process.env.ALERT_SLACK_ENABLED === 'true',
        webhook: process.env.SLACK_WEBHOOK,
      },
      
      // 告警级别阈值
      thresholds: {
        cpu: parseFloat(process.env.ALERT_THRESHOLD_CPU || '80'),
        memory: parseFloat(process.env.ALERT_THRESHOLD_MEMORY || '85'),
        responseTime: parseInt(process.env.ALERT_THRESHOLD_RESPONSE_TIME || '2000'),
        errorRate: parseFloat(process.env.ALERT_THRESHOLD_ERROR_RATE || '5'),
        slowRequestRate: parseFloat(process.env.ALERT_THRESHOLD_SLOW_REQUEST_RATE || '10'),
      },
      
      // 告警冷却时间（秒）
      cooldown: parseInt(process.env.ALERT_COOLDOWN || '300'), // 5分钟
    };
    
    // 告警历史（用于防止重复告警）
    this.alertHistory = new Map();
    
    // 初始化邮件发送器
    this.emailTransporter = null;
    if (this.config.email.enabled && this.config.email.auth.user) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: this.config.email.host,
          port: this.config.email.port,
          secure: this.config.email.secure,
          auth: this.config.email.auth,
        });
      } catch (error) {
        logger.error('邮件发送器初始化失败:', error);
      }
    }
  }
  
  /**
   * 发送告警
   * @param {Object} alert - 告警信息
   * @param {string} alert.level - 告警级别 (info|warning|error|critical)
   * @param {string} alert.title - 告警标题
   * @param {string} alert.message - 告警消息
   * @param {Object} alert.data - 告警数据
   * @param {string} alert.type - 告警类型
   */
  async sendAlert(alert) {
    const { level = 'warning', title, message, data = {}, type = 'system' } = alert;
    
    // 检查是否在冷却期内
    if (this.isInCooldown(type, title)) {
      logger.debug(`告警 ${type}:${title} 在冷却期内，跳过`);
      return;
    }
    
    // 记录告警历史
    this.recordAlert(type, title);
    
    // 构建告警内容
    const alertContent = {
      level,
      title,
      message,
      data,
      type,
      timestamp: new Date().toISOString(),
      hostname: require('os').hostname(),
      environment: process.env.NODE_ENV || 'development',
    };
    
    // 记录到日志
    logger.warn('发送告警:', alertContent);
    
    // 并发发送到所有启用的渠道
    const promises = [];
    
    if (this.config.email.enabled) {
      promises.push(this.sendEmailAlert(alertContent));
    }
    
    if (this.config.dingtalk.enabled) {
      promises.push(this.sendDingtalkAlert(alertContent));
    }
    
    if (this.config.wecom.enabled) {
      promises.push(this.sendWecomAlert(alertContent));
    }
    
    if (this.config.slack.enabled) {
      promises.push(this.sendSlackAlert(alertContent));
    }
    
    // 等待所有发送完成
    const results = await Promise.allSettled(promises);
    
    // 统计发送结果
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`告警发送完成: 成功 ${successCount}, 失败 ${failCount}`);
    
    return { success: successCount, failed: failCount };
  }
  
  /**
   * 发送邮件告警
   */
  async sendEmailAlert(alert) {
    if (!this.emailTransporter || !this.config.email.to.length) {
      return;
    }
    
    const levelEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">${levelEmoji[alert.level]} ${alert.title}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">级别: ${alert.level.toUpperCase()}</p>
        </div>
        <div style="background: #f7f7f7; padding: 20px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="margin-top: 0; color: #333;">告警信息</h3>
            <p style="color: #666; line-height: 1.6;">${alert.message}</p>
          </div>
          
          ${Object.keys(alert.data).length > 0 ? `
            <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <h3 style="margin-top: 0; color: #333;">详细数据</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(alert.data).map(([key, value]) => `
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">${key}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">${JSON.stringify(value)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
          
          <div style="background: white; padding: 15px; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #333;">系统信息</h3>
            <p style="color: #666; margin: 5px 0;"><strong>主机:</strong> ${alert.hostname}</p>
            <p style="color: #666; margin: 5px 0;"><strong>环境:</strong> ${alert.environment}</p>
            <p style="color: #666; margin: 5px 0;"><strong>时间:</strong> ${new Date(alert.timestamp).toLocaleString('zh-CN')}</p>
            <p style="color: #666; margin: 5px 0;"><strong>类型:</strong> ${alert.type}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">
          <p>此邮件由 IEClub 监控系统自动发送，请勿回复</p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: this.config.email.from,
      to: this.config.email.to.join(','),
      subject: `[${alert.level.toUpperCase()}] ${alert.title}`,
      html,
    };
    
    try {
      await this.emailTransporter.sendMail(mailOptions);
      logger.info('邮件告警发送成功');
    } catch (error) {
      logger.error('邮件告警发送失败:', error);
      throw error;
    }
  }
  
  /**
   * 发送钉钉告警
   */
  async sendDingtalkAlert(alert) {
    if (!this.config.dingtalk.webhook) {
      return;
    }
    
    const levelEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    
    let url = this.config.dingtalk.webhook;
    
    // 如果配置了签名，计算签名
    if (this.config.dingtalk.secret) {
      const timestamp = Date.now();
      const crypto = require('crypto');
      const sign = crypto
        .createHmac('sha256', this.config.dingtalk.secret)
        .update(`${timestamp}\n${this.config.dingtalk.secret}`)
        .digest('base64');
      
      url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
    }
    
    const markdown = `
### ${levelEmoji[alert.level]} ${alert.title}

**级别:** ${alert.level.toUpperCase()}

**消息:** ${alert.message}

${Object.keys(alert.data).length > 0 ? `
**详细数据:**
${Object.entries(alert.data).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`).join('\n')}
` : ''}

**系统信息:**
- 主机: ${alert.hostname}
- 环境: ${alert.environment}
- 时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}
- 类型: ${alert.type}
    `.trim();
    
    try {
      await axios.post(url, {
        msgtype: 'markdown',
        markdown: {
          title: alert.title,
          text: markdown,
        },
      });
      logger.info('钉钉告警发送成功');
    } catch (error) {
      logger.error('钉钉告警发送失败:', error);
      throw error;
    }
  }
  
  /**
   * 发送企业微信告警
   */
  async sendWecomAlert(alert) {
    if (!this.config.wecom.webhook) {
      return;
    }
    
    const levelColor = {
      info: 'info',
      warning: 'warning',
      error: 'warning',
      critical: 'warning',
    };
    
    const markdown = `
# ${alert.title}

> 级别: <font color="${levelColor[alert.level]}">${alert.level.toUpperCase()}</font>

**消息:** ${alert.message}

${Object.keys(alert.data).length > 0 ? `
**详细数据:**
${Object.entries(alert.data).map(([key, value]) => `> ${key}: ${JSON.stringify(value)}`).join('\n')}
` : ''}

**系统信息:**
> 主机: ${alert.hostname}
> 环境: ${alert.environment}
> 时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}
> 类型: ${alert.type}
    `.trim();
    
    try {
      await axios.post(this.config.wecom.webhook, {
        msgtype: 'markdown',
        markdown: {
          content: markdown,
        },
      });
      logger.info('企业微信告警发送成功');
    } catch (error) {
      logger.error('企业微信告警发送失败:', error);
      throw error;
    }
  }
  
  /**
   * 发送 Slack 告警
   */
  async sendSlackAlert(alert) {
    if (!this.config.slack.webhook) {
      return;
    }
    
    const levelColor = {
      info: '#36a64f',
      warning: '#ff9900',
      error: '#ff0000',
      critical: '#8b0000',
    };
    
    const fields = Object.entries(alert.data).map(([key, value]) => ({
      title: key,
      value: JSON.stringify(value),
      short: true,
    }));
    
    try {
      await axios.post(this.config.slack.webhook, {
        attachments: [
          {
            color: levelColor[alert.level],
            title: alert.title,
            text: alert.message,
            fields: [
              ...fields,
              {
                title: '主机',
                value: alert.hostname,
                short: true,
              },
              {
                title: '环境',
                value: alert.environment,
                short: true,
              },
              {
                title: '时间',
                value: new Date(alert.timestamp).toLocaleString('zh-CN'),
                short: true,
              },
              {
                title: '类型',
                value: alert.type,
                short: true,
              },
            ],
            footer: 'IEClub 监控系统',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
      logger.info('Slack 告警发送成功');
    } catch (error) {
      logger.error('Slack 告警发送失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查是否在冷却期内
   */
  isInCooldown(type, title) {
    const key = `${type}:${title}`;
    const lastAlert = this.alertHistory.get(key);
    
    if (!lastAlert) {
      return false;
    }
    
    const now = Date.now();
    const cooldownMs = this.config.cooldown * 1000;
    
    return now - lastAlert < cooldownMs;
  }
  
  /**
   * 记录告警历史
   */
  recordAlert(type, title) {
    const key = `${type}:${title}`;
    this.alertHistory.set(key, Date.now());
    
    // 清理过期的历史记录（保留 1 小时）
    const oneHourAgo = Date.now() - 3600000;
    for (const [k, v] of this.alertHistory.entries()) {
      if (v < oneHourAgo) {
        this.alertHistory.delete(k);
      }
    }
  }
  
  /**
   * 检查性能指标并发送告警
   */
  async checkPerformanceMetrics(metrics) {
    const alerts = [];
    
    // 检查 CPU 使用率
    if (metrics.system?.cpuUsage > this.config.thresholds.cpu) {
      alerts.push({
        level: metrics.system.cpuUsage > 90 ? 'critical' : 'warning',
        title: 'CPU 使用率过高',
        message: `CPU 使用率达到 ${metrics.system.cpuUsage.toFixed(2)}%，超过阈值 ${this.config.thresholds.cpu}%`,
        data: {
          current: `${metrics.system.cpuUsage.toFixed(2)}%`,
          threshold: `${this.config.thresholds.cpu}%`,
          loadAverage: metrics.system.loadAverage,
        },
        type: 'performance',
      });
    }
    
    // 检查内存使用率
    if (metrics.system?.memoryUsage > this.config.thresholds.memory) {
      const memoryData = {
        current: `${metrics.system.memoryUsage.toFixed(2)}%`,
        threshold: `${this.config.thresholds.memory}%`,
      };
      
      // 安全地添加内存详情（如果可用）
      if (metrics.system.totalMemory !== undefined && metrics.system.freeMemory !== undefined) {
        memoryData.used = `${(metrics.system.totalMemory - metrics.system.freeMemory).toFixed(2)} GB`;
        memoryData.total = `${metrics.system.totalMemory.toFixed(2)} GB`;
      } else if (metrics.system.memoryTotalMB !== undefined && metrics.system.memoryUsedMB !== undefined) {
        memoryData.used = `${(metrics.system.memoryUsedMB / 1024).toFixed(2)} GB`;
        memoryData.total = `${(metrics.system.memoryTotalMB / 1024).toFixed(2)} GB`;
      }
      
      alerts.push({
        level: metrics.system.memoryUsage > 95 ? 'critical' : 'warning',
        title: '内存使用率过高',
        message: `内存使用率达到 ${metrics.system.memoryUsage.toFixed(2)}%，超过阈值 ${this.config.thresholds.memory}%`,
        data: memoryData,
        type: 'performance',
      });
    }
    
    // 检查平均响应时间
    if (metrics.application?.avgResponseTime > this.config.thresholds.responseTime) {
      alerts.push({
        level: 'warning',
        title: '平均响应时间过长',
        message: `平均响应时间达到 ${metrics.application.avgResponseTime}ms，超过阈值 ${this.config.thresholds.responseTime}ms`,
        data: {
          avgResponseTime: `${metrics.application.avgResponseTime}ms`,
          threshold: `${this.config.thresholds.responseTime}ms`,
          p95ResponseTime: `${metrics.application.p95ResponseTime}ms`,
          p99ResponseTime: `${metrics.application.p99ResponseTime}ms`,
        },
        type: 'performance',
      });
    }
    
    // 检查错误率
    if (metrics.application?.errorRate > this.config.thresholds.errorRate) {
      alerts.push({
        level: metrics.application.errorRate > 10 ? 'error' : 'warning',
        title: '错误率过高',
        message: `错误率达到 ${metrics.application.errorRate.toFixed(2)}%，超过阈值 ${this.config.thresholds.errorRate}%`,
        data: {
          errorRate: `${metrics.application.errorRate.toFixed(2)}%`,
          threshold: `${this.config.thresholds.errorRate}%`,
          totalRequests: metrics.application.totalRequests,
          errorCount: metrics.application.errorCount,
        },
        type: 'error',
      });
    }
    
    // 检查慢请求率
    if (metrics.application?.slowRequestRate > this.config.thresholds.slowRequestRate) {
      alerts.push({
        level: 'warning',
        title: '慢请求率过高',
        message: `慢请求率达到 ${metrics.application.slowRequestRate.toFixed(2)}%，超过阈值 ${this.config.thresholds.slowRequestRate}%`,
        data: {
          slowRequestRate: `${metrics.application.slowRequestRate.toFixed(2)}%`,
          threshold: `${this.config.thresholds.slowRequestRate}%`,
          slowRequestCount: metrics.application.slowRequestCount,
          totalRequests: metrics.application.totalRequests,
        },
        type: 'performance',
      });
    }
    
    // 发送所有告警
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
    
    return alerts;
  }
  
  /**
   * 测试告警系统
   */
  async testAlert() {
    return this.sendAlert({
      level: 'info',
      title: '告警系统测试',
      message: '这是一条测试告警消息，如果您收到此消息，说明告警系统配置正确。',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      type: 'test',
    });
  }
}

// 导出单例
module.exports = new AlertSystem();

