// ieclub-backend/src/services/smsService.js
// 短信服务 - 支持阿里云、腾讯云等

const logger = require('../utils/logger');
const config = require('../config');

/**
 * 短信服务类
 * 支持多个短信服务商，可根据配置切换
 */
class SmsService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'aliyun'; // aliyun, tencent, mock
    this.initialized = false;
    this.client = null;
    
    this.initProvider();
  }

  /**
   * 初始化短信服务商
   */
  initProvider() {
    try {
      if (this.provider === 'aliyun') {
        this.initAliyun();
      } else if (this.provider === 'tencent') {
        this.initTencent();
      } else if (this.provider === 'mock') {
        logger.info('使用 Mock 短信服务（仅用于开发测试）');
        this.initialized = true;
      } else {
        logger.warn(`未知的短信服务商: ${this.provider}，使用 Mock 模式`);
        this.provider = 'mock';
        this.initialized = true;
      }
    } catch (error) {
      logger.error('初始化短信服务失败:', error);
      this.provider = 'mock';
      this.initialized = true;
    }
  }

  /**
   * 初始化阿里云短信服务
   */
  initAliyun() {
    try {
      if (!process.env.ALIYUN_SMS_ACCESS_KEY_ID || !process.env.ALIYUN_SMS_ACCESS_KEY_SECRET) {
        logger.warn('阿里云短信配置缺失，使用 Mock 模式');
        this.provider = 'mock';
        this.initialized = true;
        return;
      }

      // 阿里云 SDK
      const Core = require('@alicloud/pop-core');
      
      this.client = new Core({
        accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
      });

      this.initialized = true;
      logger.info('阿里云短信服务初始化成功');
    } catch (error) {
      logger.error('初始化阿里云短信服务失败:', error);
      this.provider = 'mock';
      this.initialized = true;
    }
  }

  /**
   * 初始化腾讯云短信服务
   */
  initTencent() {
    try {
      if (!process.env.TENCENT_SMS_SECRET_ID || !process.env.TENCENT_SMS_SECRET_KEY) {
        logger.warn('腾讯云短信配置缺失，使用 Mock 模式');
        this.provider = 'mock';
        this.initialized = true;
        return;
      }

      // 腾讯云 SDK
      const tencentcloud = require('tencentcloud-sdk-nodejs');
      const SmsClient = tencentcloud.sms.v20210111.Client;

      const clientConfig = {
        credential: {
          secretId: process.env.TENCENT_SMS_SECRET_ID,
          secretKey: process.env.TENCENT_SMS_SECRET_KEY,
        },
        region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
        profile: {
          httpProfile: {
            endpoint: 'sms.tencentcloudapi.com',
          },
        },
      };

      this.client = new SmsClient(clientConfig);
      this.initialized = true;
      logger.info('腾讯云短信服务初始化成功');
    } catch (error) {
      logger.error('初始化腾讯云短信服务失败:', error);
      this.provider = 'mock';
      this.initialized = true;
    }
  }

  /**
   * 发送验证码短信
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @param {string} type - 类型 (register, login, reset, bind)
   * @returns {Promise<Object>}
   */
  async sendVerificationCode(phone, code, type = 'register') {
    try {
      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return {
          success: false,
          error: '手机号格式不正确'
        };
      }

      const typeText = {
        register: '注册',
        login: '登录',
        reset: '重置密码',
        bind: '绑定手机'
      };

      logger.info(`发送${typeText[type]}验证码到手机: ${phone}`, {
        provider: this.provider,
        codeLength: code.length
      });

      if (this.provider === 'aliyun') {
        return await this.sendAliyunSms(phone, code, type);
      } else if (this.provider === 'tencent') {
        return await this.sendTencentSms(phone, code, type);
      } else {
        // Mock 模式 - 仅用于开发
        return this.sendMockSms(phone, code, type);
      }
    } catch (error) {
      logger.error('发送短信失败:', error);
      return {
        success: false,
        error: error.message || '发送失败'
      };
    }
  }

  /**
   * 阿里云发送短信
   */
  async sendAliyunSms(phone, code, type) {
    try {
      const templateCode = process.env[`ALIYUN_SMS_TEMPLATE_${type.toUpperCase()}`] || 
                          process.env.ALIYUN_SMS_TEMPLATE_CODE;
      
      if (!templateCode) {
        throw new Error('阿里云短信模板未配置');
      }

      const params = {
        PhoneNumbers: phone,
        SignName: process.env.ALIYUN_SMS_SIGN_NAME,
        TemplateCode: templateCode,
        TemplateParam: JSON.stringify({ code })
      };

      const requestOption = {
        method: 'POST'
      };

      const result = await this.client.request('SendSms', params, requestOption);

      if (result.Code === 'OK') {
        logger.info('阿里云短信发送成功', { phone, bizId: result.BizId });
        return {
          success: true,
          provider: 'aliyun',
          bizId: result.BizId
        };
      } else {
        logger.error('阿里云短信发送失败', { phone, code: result.Code, message: result.Message });
        return {
          success: false,
          error: result.Message || '发送失败'
        };
      }
    } catch (error) {
      logger.error('阿里云短信发送异常:', error);
      return {
        success: false,
        error: error.message || '发送失败'
      };
    }
  }

  /**
   * 腾讯云发送短信
   */
  async sendTencentSms(phone, code, type) {
    try {
      const templateId = process.env[`TENCENT_SMS_TEMPLATE_${type.toUpperCase()}`] || 
                        process.env.TENCENT_SMS_TEMPLATE_ID;
      
      if (!templateId) {
        throw new Error('腾讯云短信模板未配置');
      }

      const params = {
        SmsSdkAppId: process.env.TENCENT_SMS_APP_ID,
        SignName: process.env.TENCENT_SMS_SIGN_NAME,
        TemplateId: templateId,
        PhoneNumberSet: [`+86${phone}`],
        TemplateParamSet: [code, '10'] // 验证码, 有效期(分钟)
      };

      const result = await this.client.SendSms(params);

      if (result.SendStatusSet && result.SendStatusSet[0].Code === 'Ok') {
        logger.info('腾讯云短信发送成功', { phone, serialNo: result.SendStatusSet[0].SerialNo });
        return {
          success: true,
          provider: 'tencent',
          serialNo: result.SendStatusSet[0].SerialNo
        };
      } else {
        const error = result.SendStatusSet?.[0];
        logger.error('腾讯云短信发送失败', { phone, code: error?.Code, message: error?.Message });
        return {
          success: false,
          error: error?.Message || '发送失败'
        };
      }
    } catch (error) {
      logger.error('腾讯云短信发送异常:', error);
      return {
        success: false,
        error: error.message || '发送失败'
      };
    }
  }

  /**
   * Mock 短信发送（开发测试用）
   */
  sendMockSms(phone, code, type) {
    const typeText = {
      register: '注册',
      login: '登录',
      reset: '重置密码',
      bind: '绑定手机'
    };

    logger.info('【Mock短信】发送成功', {
      phone,
      code,
      type: typeText[type],
      message: `【IEclub】您的${typeText[type]}验证码是: ${code}，有效期10分钟。`
    });

    // 开发环境：控制台输出验证码
    if (process.env.NODE_ENV === 'development') {
      console.log('\n================== 短信验证码 ==================');
      console.log(`手机号: ${phone}`);
      console.log(`类型: ${typeText[type]}`);
      console.log(`验证码: ${code}`);
      console.log(`有效期: 10分钟`);
      console.log('===============================================\n');
    }

    return {
      success: true,
      provider: 'mock',
      code: process.env.NODE_ENV === 'development' ? code : undefined
    };
  }

  /**
   * 发送通知短信
   * @param {string} phone - 手机号
   * @param {string} templateCode - 模板代码
   * @param {Object} params - 模板参数
   */
  async sendNotification(phone, templateCode, params) {
    try {
      logger.info(`发送通知短信到: ${phone}`, { templateCode, params });

      if (this.provider === 'mock') {
        logger.info('【Mock短信】通知发送成功', { phone, params });
        return { success: true, provider: 'mock' };
      }

      // 实际短信服务商实现...
      return { success: true };
    } catch (error) {
      logger.error('发送通知短信失败:', error);
      return { success: false, error: error.message };
    }
  }
}

// 导出单例
module.exports = new SmsService();

