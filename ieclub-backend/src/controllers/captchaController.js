// ieclub-backend/src/controllers/captchaController.js
// 图形验证码控制器

const CaptchaService = require('../services/captchaService');
const logger = require('../utils/logger');

class CaptchaController {
  /**
   * 生成验证码
   * GET /api/captcha/generate
   * Query参数:
   * - type: text | math (默认text)
   * - width: 图片宽度（默认150）
   * - height: 图片高度（默认50）
   */
  static async generate(req, res, next) {
    try {
      const {
        type = 'text',
        width = 150,
        height = 50,
        size = 4
      } = req.query;

      const result = await CaptchaService.generateCaptcha({
        type,
        width: parseInt(width) || 150,
        height: parseInt(height) || 50,
        size: parseInt(size) || 4
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error || '生成验证码失败'
        });
      }

      res.json({
        success: true,
        message: '验证码生成成功',
        data: result.data
      });
    } catch (error) {
      logger.error('生成验证码失败:', error);
      next(error);
    }
  }

  /**
   * 验证验证码
   * POST /api/captcha/verify
   * Body参数:
   * - key: 验证码key
   * - code: 用户输入的验证码
   */
  static async verify(req, res, next) {
    try {
      const { key, code } = req.body;

      if (!key || !code) {
        return res.status(400).json({
          success: false,
          message: '验证码key和code不能为空'
        });
      }

      const result = await CaptchaService.verifyCaptcha(key, code);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.error || '验证码验证失败'
        });
      }

      res.json({
        success: true,
        message: '验证码验证成功'
      });
    } catch (error) {
      logger.error('验证验证码失败:', error);
      next(error);
    }
  }

  /**
   * 刷新验证码
   * POST /api/captcha/refresh
   * Body参数:
   * - oldKey: 旧验证码key（可选）
   * - type: 验证码类型（可选）
   */
  static async refresh(req, res, next) {
    try {
      const { oldKey, type, width, height, size } = req.body;

      const result = await CaptchaService.refreshCaptcha(oldKey, {
        type,
        width: parseInt(width) || 150,
        height: parseInt(height) || 50,
        size: parseInt(size) || 4
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error || '刷新验证码失败'
        });
      }

      res.json({
        success: true,
        message: '验证码刷新成功',
        data: result.data
      });
    } catch (error) {
      logger.error('刷新验证码失败:', error);
      next(error);
    }
  }

  /**
   * 获取验证码SVG图片（直接返回SVG）
   * 适用于 <img> 标签直接显示
   * GET /api/captcha/image/:key
   */
  static async getImage(req, res, next) {
    try {
      const { key } = req.params;
      
      // 这个接口主要用于前端直接在img标签中使用
      // 实际的验证码数据已经在generate接口返回
      // 这里返回一个占位提示
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(`
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="50">
          <rect width="150" height="50" fill="#f0f0f0"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                font-family="Arial" font-size="14" fill="#666">
            请先调用generate接口
          </text>
        </svg>
      `);
    } catch (error) {
      logger.error('获取验证码图片失败:', error);
      next(error);
    }
  }
}

module.exports = CaptchaController;
