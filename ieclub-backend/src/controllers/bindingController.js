/**
 * 账号绑定控制器
 * 处理手机号、微信、邮箱的绑定与解绑
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

class BindingController {
  /**
   * 绑定手机号
   * POST /api/auth/bind-phone
   */
  static async bindPhone(req, res, next) {
    try {
      const { phone, code } = req.body || {};
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        });
      }

      // 验证必填字段
      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: '手机号和验证码不能为空'
        });
      }

      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '手机号格式不正确'
        });
      }

      // 验证验证码
      const stored = await prisma.verificationCode.findFirst({
        where: {
          email: phone,
          code: code.trim(),
          type: 'bind',
          used: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!stored || stored.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过期'
        });
      }

      // 检查手机号是否已被其他用户绑定
      const existingUser = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被其他用户绑定'
        });
      }

      // 检查当前用户是否已绑定手机号
      const currentUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (currentUser.phone) {
        return res.status(400).json({
          success: false,
          message: '您已绑定手机号，如需更换请先解绑'
        });
      }

      // 标记验证码为已使用
      await prisma.verificationCode.update({
        where: { id: stored.id },
        data: { 
          used: true,
          usedAt: new Date()
        }
      });

      // 绑定手机号
      await prisma.user.update({
        where: { id: userId },
        data: { phone }
      });

      // 创建绑定记录
      await prisma.userBinding.create({
        data: {
          userId,
          type: 'phone',
          bindValue: phone
        }
      });

      logger.info('用户绑定手机号成功:', { userId, phone });

      res.json({
        success: true,
        message: '手机号绑定成功'
      });
    } catch (error) {
      logger.error('绑定手机号失败:', { 
        userId: req.user?.id, 
        error: error.message,
        stack: error.stack
      });

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: '该手机号已被绑定'
        });
      }

      next(error);
    }
  }

  /**
   * 绑定微信
   * POST /api/auth/bind-wechat
   */
  static async bindWechat(req, res, next) {
    try {
      const { openid, unionid, nickname, avatar } = req.body || {};
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        });
      }

      // 验证必填字段
      if (!openid) {
        return res.status(400).json({
          success: false,
          message: '缺少微信openid'
        });
      }

      // 检查openid是否已被其他用户绑定
      const existingUser = await prisma.user.findUnique({
        where: { openid }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: '该微信已被其他用户绑定'
        });
      }

      // 检查当前用户是否已绑定微信
      const currentUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (currentUser.openid) {
        return res.status(400).json({
          success: false,
          message: '您已绑定微信，如需更换请先解绑'
        });
      }

      // 绑定微信
      await prisma.user.update({
        where: { id: userId },
        data: { 
          openid,
          unionid: unionid || null,
          nickname: nickname || currentUser.nickname,
          avatar: avatar || currentUser.avatar
        }
      });

      // 创建绑定记录
      await prisma.userBinding.create({
        data: {
          userId,
          type: 'wechat',
          bindValue: openid
        }
      });

      logger.info('用户绑定微信成功:', { userId, openid });

      res.json({
        success: true,
        message: '微信绑定成功'
      });
    } catch (error) {
      logger.error('绑定微信失败:', { 
        userId: req.user?.id, 
        error: error.message,
        stack: error.stack
      });

      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: '该微信已被绑定'
        });
      }

      next(error);
    }
  }
}

module.exports = BindingController;
