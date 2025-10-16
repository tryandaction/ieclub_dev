// src/services/wechatService.js
// 微信小程序相关服务

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const { CacheManager } = require('../utils/redis');

class WechatService {
  /**
   * 微信登录 - code2Session
   * @param {string} code - 微信登录 code
   */
  static async code2Session(code) {
    try {
      const url = 'https://api.weixin.qq.com/sns/jscode2session';
      const response = await axios.get(url, {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.secret,
          js_code: code,
          grant_type: 'authorization_code',
        },
      });

      const { openid, session_key, unionid, errcode, errmsg } = response.data;

      if (errcode) {
        logger.error('微信登录失败:', { errcode, errmsg });
        throw new Error(errmsg || '微信登录失败');
      }

      return {
        openid,
        sessionKey: session_key,
        unionid,
      };
    } catch (error) {
      logger.error('code2Session 错误:', error);
      throw error;
    }
  }

  /**
   * 获取微信 Access Token
   */
  static async getAccessToken() {
    try {
      // 先从缓存获取
      const cacheKey = 'wechat:access_token';
      const cached = await CacheManager.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // 从微信服务器获取
      const url = 'https://api.weixin.qq.com/cgi-bin/token';
      const response = await axios.get(url, {
        params: {
          grant_type: 'client_credential',
          appid: config.wechat.appId,
          secret: config.wechat.secret,
        },
      });

      const { access_token, expires_in, errcode, errmsg } = response.data;

      if (errcode) {
        logger.error('获取 Access Token 失败:', { errcode, errmsg });
        throw new Error(errmsg || '获取 Access Token 失败');
      }

      // 缓存 Access Token（提前 5 分钟过期）
      await CacheManager.set(cacheKey, access_token, expires_in - 300);

      return access_token;
    } catch (error) {
      logger.error('获取 Access Token 错误:', error);
      throw error;
    }
  }

  /**
   * 发送订阅消息
   * @param {string} openid - 用户 openid
   * @param {string} templateId - 模板 ID
   * @param {object} data - 消息数据
   * @param {string} page - 跳转页面
   */
  static async sendSubscribeMessage(openid, templateId, data, page = '') {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

      const response = await axios.post(url, {
        touser: openid,
        template_id: templateId,
        page,
        data,
        miniprogram_state: config.env === 'production' ? 'formal' : 'trial',
      });

      const { errcode, errmsg } = response.data;

      if (errcode !== 0) {
        logger.error('发送订阅消息失败:', { errcode, errmsg, openid });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('发送订阅消息错误:', error);
      return false;
    }
  }

  /**
   * 生成小程序码
   * @param {string} scene - 场景值
   * @param {string} page - 页面路径
   */
  static async generateQRCode(scene, page = 'pages/index/index') {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

      const response = await axios.post(
        url,
        {
          scene,
          page,
          width: 430,
          auto_color: false,
          line_color: { r: 0, g: 0, b: 0 },
        },
        {
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      logger.error('生成小程序码错误:', error);
      throw error;
    }
  }

  /**
   * 内容安全检测 - 文本
   * @param {string} content - 待检测文本
   */
  static async msgSecCheck(content) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`;

      const response = await axios.post(url, {
        content,
        version: 2,
        scene: 1, // 1: 资料, 2: 评论, 3: 论坛, 4: 社交日志
        openid: 'default',
      });

      const { errcode, errmsg, result } = response.data;

      if (errcode !== 0) {
        logger.error('内容安全检测失败:', { errcode, errmsg });
        return { pass: false, reason: errmsg };
      }

      // result.suggest: pass(通过), review(需人工审核), risky(不通过)
      return {
        pass: result.suggest === 'pass',
        suggest: result.suggest,
        label: result.label,
      };
    } catch (error) {
      logger.error('内容安全检测错误:', error);
      // 检测失败时默认放行，避免影响用户体验
      return { pass: true };
    }
  }

  /**
   * 内容安全检测 - 图片
   * @param {Buffer} imageBuffer - 图片 Buffer
   */
  static async imgSecCheck(imageBuffer) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${accessToken}`;

      const FormData = require('form-data');
      const form = new FormData();
      form.append('media', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });

      const response = await axios.post(url, form, {
        headers: form.getHeaders(),
      });

      const { errcode, errmsg } = response.data;

      if (errcode !== 0) {
        if (errcode === 87014) {
          // 图片含有违法违规内容
          return { pass: false, reason: '图片含有违法违规内容' };
        }
        logger.error('图片安全检测失败:', { errcode, errmsg });
        return { pass: false, reason: errmsg };
      }

      return { pass: true };
    } catch (error) {
      logger.error('图片安全检测错误:', error);
      // 检测失败时默认放行
      return { pass: true };
    }
  }
}

module.exports = WechatService;
