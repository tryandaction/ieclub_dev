// ieclub-backend/src/services/emailService.js
// 邮件服务

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  initTransporter() {
    try {
      const emailConfig = config.email || {};

      // 如果没有配置，使用测试账户
      if (!emailConfig.host || !emailConfig.user) {
        logger.warn('邮件服务未配置，将使用测试模式');
        this.initialized = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port || 587,
        secure: emailConfig.secure || false,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password
        }
      });

      // 验证连接
      this.transporter.verify((error) => {
        if (error) {
          logger.error('邮件服务连接失败:', error);
          this.initialized = false;
        } else {
          logger.info('邮件服务已就绪');
          this.initialized = true;
        }
      });
    } catch (error) {
      logger.error('初始化邮件服务失败:', error);
      this.initialized = false;
    }
  }

  /**
   * 发送邮件
   * @param {Object} options - 邮件选项
   * @param {string} options.to - 收件人
   * @param {string} options.subject - 主题
   * @param {string} options.html - HTML内容
   * @param {string} options.text - 纯文本内容
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.initialized) {
      logger.warn('邮件服务未初始化，跳过发送');
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const emailConfig = config.email || {};
      const from = emailConfig.from || emailConfig.user;

      const info = await this.transporter.sendMail({
        from: `IEclub <${from}>`,
        to,
        subject,
        text,
        html
      });

      logger.info(`邮件发送成功: ${to}`, { messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('邮件发送失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email, code, purpose = 'register') {
    const purposeText = {
      register: '注册',
      login: '登录',
      reset: '重置密码',
      bind: '绑定邮箱'
    };

    const subject = `IEclub ${purposeText[purpose]}验证码`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 10px;
            color: white;
          }
          .code-box {
            background: white;
            color: #667eea;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 30px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            opacity: 0.9;
          }
          .warning {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🎓 IEclub ${purposeText[purpose]}验证</h2>
          <p>您好！</p>
          <p>您正在进行 <strong>${purposeText[purpose]}</strong> 操作，验证码为：</p>
          <div class="code-box">${code}</div>
          <p>验证码有效期为 <strong>10分钟</strong>，请尽快使用。</p>
          <div class="warning">
            <p>⚠️ 安全提示：</p>
            <ul>
              <li>请勿将验证码透露给他人</li>
              <li>IEclub 工作人员不会向您索要验证码</li>
              <li>如非本人操作，请忽略此邮件</li>
            </ul>
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© ${new Date().getFullYear()} IEclub - 创造线上线下交互的无限可能</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
IEclub ${purposeText[purpose]}验证码

您的验证码是：${code}

验证码有效期为10分钟，请尽快使用。

如非本人操作，请忽略此邮件。

© ${new Date().getFullYear()} IEclub
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email, nickname) {
    const subject = '欢迎加入 IEclub！';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 10px;
            color: white;
          }
          .welcome-box {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature {
            display: inline-block;
            margin: 10px 10px 10px 0;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 欢迎加入 IEclub！</h1>
          <p>Hi <strong>${nickname}</strong>，</p>
          <p>感谢您注册 IEclub！我们很高兴您加入这个充满活力的学术社区。</p>
          
          <div class="welcome-box">
            <h3 style="color: #667eea;">🚀 开始探索</h3>
            <p style="color: #666;">在 IEclub，您可以：</p>
            <div>
              <span class="feature" style="color: white; background: #667eea;">💡 分享知识</span>
              <span class="feature" style="color: white; background: #764ba2;">🤝 寻找合作</span>
              <span class="feature" style="color: white; background: #667eea;">📚 学习交流</span>
              <span class="feature" style="color: white; background: #764ba2;">🎯 参与活动</span>
            </div>
          </div>

          <h3>📌 快速入门</h3>
          <ul>
            <li><strong>完善个人资料</strong> - 让其他人更好地了解您</li>
            <li><strong>浏览话题广场</strong> - 发现有趣的内容和项目</li>
            <li><strong>参与讨论</strong> - 评论、点赞、分享您的想法</li>
            <li><strong>关注用户</strong> - 建立您的学术社交网络</li>
            <li><strong>每日签到</strong> - 获取积分，解锁更多功能</li>
          </ul>

          <h3>🎁 新手福利</h3>
          <p>您已获得：</p>
          <ul>
            <li>✨ 100 积分新手礼包</li>
            <li>🏆 "新手上路"徽章</li>
            <li>📚 完整功能访问权限</li>
          </ul>

          <a href="https://ieclub.online" class="button">开始探索 →</a>

          <div style="margin-top: 30px; font-size: 14px; opacity: 0.9;">
            <p>如有任何问题，请随时联系我们。</p>
            <p>© ${new Date().getFullYear()} IEclub - 创造线上线下交互的无限可能</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
欢迎加入 IEclub！

Hi ${nickname}，

感谢您注册 IEclub！我们很高兴您加入这个充满活力的学术社区。

在 IEclub，您可以：
- 💡 分享知识
- 🤝 寻找合作
- 📚 学习交流
- 🎯 参与活动

快速入门：
1. 完善个人资料
2. 浏览话题广场
3. 参与讨论
4. 关注用户
5. 每日签到

您已获得：
- ✨ 100 积分新手礼包
- 🏆 "新手上路"徽章
- 📚 完整功能访问权限

访问 https://ieclub.online 开始探索！

© ${new Date().getFullYear()} IEclub
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * 发送活动通知邮件
   */
  async sendActivityNotification(email, activity, type = 'reminder') {
    const subjects = {
      reminder: `活动提醒：${activity.title}`,
      registered: `报名成功：${activity.title}`,
      cancelled: `活动取消通知：${activity.title}`,
      updated: `活动更新通知：${activity.title}`
    };

    const subject = subjects[type] || subjects.reminder;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f5f5f5;
            padding: 40px;
            border-radius: 10px;
          }
          .activity-card {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .title {
            color: #667eea;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .info-row {
            display: flex;
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .label {
            font-weight: bold;
            color: #666;
            min-width: 80px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="activity-card">
            <h2 class="title">📅 ${activity.title}</h2>
            <div class="info-row">
              <span class="label">活动时间:</span>
              <span>${new Date(activity.startTime).toLocaleString('zh-CN')}</span>
            </div>
            <div class="info-row">
              <span class="label">活动地点:</span>
              <span>${activity.location || '待定'}</span>
            </div>
            <div class="info-row">
              <span class="label">活动类型:</span>
              <span>${activity.type}</span>
            </div>
            ${activity.description ? `
            <div style="margin-top: 20px;">
              <p style="color: #666;">${activity.description}</p>
            </div>
            ` : ''}
            ${type === 'reminder' ? `
            <div style="background: #fffbe6; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #faad14;">
              <strong>⏰ 温馨提醒</strong>
              <p>活动即将开始，请准时参加！</p>
            </div>
            ` : ''}
            <a href="https://ieclub.online/activities/${activity.id}" class="button">查看详情 →</a>
          </div>
          <div style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
            <p>© ${new Date().getFullYear()} IEclub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `${subject}\n\n活动时间: ${new Date(activity.startTime).toLocaleString('zh-CN')}\n活动地点: ${activity.location || '待定'}`
    });
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `https://ieclub.online/reset-password?token=${resetToken}`;
    const subject = 'IEclub 密码重置';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
          }
          .warning {
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔒 密码重置请求</h2>
          <p>您好！</p>
          <p>我们收到了重置您密码的请求。请点击下方按钮重置密码：</p>
          <a href="${resetUrl}" class="button">重置密码</a>
          <p>或复制以下链接到浏览器：</p>
          <p style="color: #667eea; word-break: break-all;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⚠️ 安全提示：</strong></p>
            <ul>
              <li>此链接有效期为 1 小时</li>
              <li>如非本人操作，请忽略此邮件</li>
              <li>请勿将此链接分享给他人</li>
            </ul>
          </div>
          <div style="margin-top: 30px; font-size: 14px; color: #999;">
            <p>© ${new Date().getFullYear()} IEclub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `密码重置链接: ${resetUrl}\n\n此链接有效期为1小时。如非本人操作，请忽略此邮件。`
    });
  }

  /**
   * 发送系统通知邮件
   */
  async sendSystemNotification(email, notification) {
    const subject = notification.title || 'IEclub 系统通知';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📢 ${subject}</h2>
          <div class="content">
            ${notification.content}
          </div>
          <div style="margin-top: 30px; font-size: 14px; color: #999;">
            <p>© ${new Date().getFullYear()} IEclub</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: notification.content
    });
  }
}

// 导出单例
module.exports = new EmailService();

