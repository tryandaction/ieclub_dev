// ieclub-backend/src/services/captchaService.js
// 图形验证码服务 - 使用 svg-captcha 生成验证码

const svgCaptcha = require('svg-captcha');
const { getRedis } = require('../utils/redis');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * 图形验证码服务
 * 支持数字、字母、算术验证码
 */
class CaptchaService {
  /**
   * 生成图形验证码
   * @param {Object} options - 配置选项
   * @param {string} options.type - 验证码类型 (text, math)
   * @param {number} options.size - 验证码长度（text模式）
   * @param {number} options.width - 图片宽度
   * @param {number} options.height - 图片高度
   * @param {string} options.background - 背景颜色
   * @param {number} options.noise - 噪点数量
   * @param {string} options.color - 字体颜色
   * @returns {Promise<Object>} { key, image }
   */
  static async generateCaptcha(options = {}) {
    try {
      const {
        type = 'text',       // text: 字符验证码, math: 算术验证码
        size = 4,            // 验证码长度（仅text模式）
        width = 150,         // 图片宽度
        height = 50,         // 图片高度
        background = '#f0f0f0', // 背景颜色
        noise = 3,           // 噪点线条数量
        color = true,        // 是否使用彩色字体
        ignoreChars = '0o1iIl' // 排除容易混淆的字符
      } = options;

      let captcha;
      
      if (type === 'math') {
        // 算术验证码（更友好，推荐）
        captcha = svgCaptcha.createMathExpr({
          size,
          width,
          height,
          background,
          noise,
          color,
          mathMin: 1,
          mathMax: 20,
          mathOperator: '+' // 只使用加法，简单易用
        });
      } else {
        // 字符验证码
        captcha = svgCaptcha.create({
          size,
          width,
          height,
          background,
          noise,
          color,
          ignoreChars,
          charPreset: 'abcdefghjkmnpqrstuvwxyz23456789' // 去除易混淆字符
        });
      }

      // 生成唯一key
      const key = uuidv4();
      
      // 存储到Redis（5分钟过期）
      const redis = getRedis();
      if (redis) {
        const cacheKey = `captcha:${key}`;
        // 存储验证码答案（转为小写，方便比对）
        await redis.setex(cacheKey, 300, captcha.text.toLowerCase());
        
        logger.info('生成图形验证码', { 
          key, 
          type, 
          length: captcha.text.length,
          expiresIn: 300 
        });
      } else {
        logger.warn('Redis未连接，验证码将无法验证');
        return {
          success: false,
          error: 'Redis服务不可用'
        };
      }

      return {
        success: true,
        data: {
          key,                          // 验证码唯一标识
          image: captcha.data,          // SVG图片数据
          expiresIn: 300                // 过期时间（秒）
        }
      };
    } catch (error) {
      logger.error('生成图形验证码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 验证图形验证码
   * @param {string} key - 验证码key
   * @param {string} code - 用户输入的验证码
   * @param {boolean} deleteAfterVerify - 验证后是否删除（默认true，防止重复使用）
   * @returns {Promise<Object>} { valid, error }
   */
  static async verifyCaptcha(key, code, deleteAfterVerify = true) {
    try {
      if (!key || !code) {
        return {
          valid: false,
          error: '验证码key或code不能为空'
        };
      }

      const redis = getRedis();
      if (!redis) {
        logger.warn('Redis未连接，跳过验证码验证');
        // 生产环境应该返回错误，开发环境可以跳过
        if (process.env.NODE_ENV === 'production') {
          return {
            valid: false,
            error: 'Redis服务不可用'
          };
        }
        // 开发环境跳过验证
        logger.warn('开发环境：跳过验证码验证');
        return { valid: true };
      }

      const cacheKey = `captcha:${key}`;
      const storedCode = await redis.get(cacheKey);

      if (!storedCode) {
        logger.warn('验证码不存在或已过期', { key });
        return {
          valid: false,
          error: '验证码已过期或不存在，请重新获取'
        };
      }

      // 不区分大小写比对
      const userCode = String(code).trim().toLowerCase();
      const isValid = userCode === storedCode;

      if (isValid) {
        logger.info('验证码验证成功', { key });
        
        // 验证成功后删除验证码（防止重复使用）
        if (deleteAfterVerify) {
          await redis.del(cacheKey);
          logger.info('验证码已删除（防止重复使用）', { key });
        }
        
        return { valid: true };
      } else {
        logger.warn('验证码验证失败', { 
          key, 
          userCode: userCode.replace(/./g, '*'),
          expected: storedCode.replace(/./g, '*')
        });
        
        return {
          valid: false,
          error: '验证码错误，请重新输入'
        };
      }
    } catch (error) {
      logger.error('验证图形验证码失败:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * 刷新验证码（获取新的验证码）
   * @param {string} oldKey - 旧验证码key（可选，用于清理）
   * @param {Object} options - 生成新验证码的配置
   * @returns {Promise<Object>}
   */
  static async refreshCaptcha(oldKey, options = {}) {
    try {
      // 删除旧验证码
      if (oldKey) {
        const redis = getRedis();
        if (redis) {
          await redis.del(`captcha:${oldKey}`);
          logger.info('删除旧验证码', { oldKey });
        }
      }

      // 生成新验证码
      return await this.generateCaptcha(options);
    } catch (error) {
      logger.error('刷新验证码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 清理过期验证码（定时任务调用）
   * Redis会自动清理过期key，这里主要用于统计
   */
  static async cleanExpiredCaptchas() {
    try {
      const redis = getRedis();
      if (!redis) return;

      const pattern = 'captcha:*';
      const keys = await redis.keys(pattern);
      
      logger.info('验证码统计', { 
        total: keys.length,
        pattern 
      });

      return { success: true, count: keys.length };
    } catch (error) {
      logger.error('清理验证码失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CaptchaService;
