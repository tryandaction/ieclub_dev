// src/controllers/authController.js
// 用户认证控制器

const { PrismaClient } = require('@prisma/client');
const WechatService = require('../services/wechatService');
const { generateToken } = require('../middleware/auth');
const response = require('../utils/response');
const logger = require('../utils/logger');
const config = require('../config');

const prisma = new PrismaClient();

class AuthController {
  /**
   * 微信小程序登录
   * POST /api/v1/auth/wechat-login
   */
  static async wechatLogin(req, res) {
    try {
      const { code, userInfo } = req.body;

      if (!code) {
        return response.error(res, '缺少登录凭证 code');
      }

      // 调用微信接口获取 openid 和 session_key
      const wechatData = await WechatService.code2Session(code);

      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { openid: wechatData.openid },
      });

      if (!user) {
        // 新用户注册
        user = await prisma.user.create({
          data: {
            openid: wechatData.openid,
            unionid: wechatData.unionid,
            sessionKey: wechatData.sessionKey,
            nickname: userInfo?.nickName || `用户${Math.random().toString(36).substr(2, 6)}`,
            avatar: userInfo?.avatarUrl || '',
            gender: userInfo?.gender || 0,
          },
        });

        logger.info('新用户注册:', { userId: user.id, openid: user.openid });
      } else {
        // 更新用户信息
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            sessionKey: wechatData.sessionKey,
            nickname: userInfo?.nickName || user.nickname,
            avatar: userInfo?.avatarUrl || user.avatar,
            lastLoginAt: new Date(),
          },
        });

        logger.info('用户登录:', { userId: user.id, openid: user.openid });
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return response.forbidden(res, '账号已被禁用');
      }

      // 生成 JWT Token
      const accessToken = generateToken({ userId: user.id }, 'access');
      const refreshToken = generateToken({ userId: user.id }, 'refresh');

      // 返回用户信息和 token
      return response.success(res, {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          bio: user.bio,
          skills: user.skills,
          interests: user.interests,
          credits: user.credits,
          level: user.level,
          isCertified: user.isCertified,
          isVip: user.isVip,
        },
      }, '登录成功');
    } catch (error) {
      logger.error('微信登录失败:', error);
      return response.serverError(res, '登录失败，请重试');
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/me
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          openid: true,
          nickname: true,
          avatar: true,
          gender: true,
          email: true,
          phone: true,
          bio: true,
          skills: true,
          interests: true,
          credits: true,
          level: true,
          exp: true,
          topicsCount: true,
          commentsCount: true,
          likesCount: true,
          fansCount: true,
          followsCount: true,
          isCertified: true,
          isVip: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      return response.success(res, user);
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 更新用户信息
   * PUT /api/v1/auth/profile
   */
  static async updateProfile(req, res) {
    try {
      const { nickname, bio, email, phone, skills, interests } = req.body;

      // 验证昵称唯一性（如果修改了昵称）
      if (nickname) {
        const existingUser = await prisma.user.findFirst({
          where: {
            nickname,
            id: { not: req.userId },
          },
        });

        if (existingUser) {
          return response.error(res, '昵称已被使用');
        }
      }

      // 更新用户信息
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(nickname && { nickname }),
          ...(bio !== undefined && { bio }),
          ...(email && { email }),
          ...(phone && { phone }),
          ...(skills && { skills }),
          ...(interests && { interests }),
        },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          bio: true,
          email: true,
          phone: true,
          skills: true,
          interests: true,
        },
      });

      return response.success(res, user, '更新成功');
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      return response.serverError(res, '更新失败');
    }
  }

  /**
   * 退出登录
   * POST /api/v1/auth/logout
   */
  static async logout(req, res) {
    try {
      // 可以在这里做一些清理工作，如清除 Redis 中的缓存
      // 目前 JWT 是无状态的，客户端删除 token 即可

      return response.success(res, null, '退出登录成功');
    } catch (error) {
      logger.error('退出登录失败:', error);
      return response.serverError(res);
    }
  }

  /**
   * 每日签到
   * POST /api/v1/auth/daily-checkin
   */
  static async dailyCheckin(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      // 检查今天是否已签到
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
      
      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0);
        if (lastActive.getTime() === today.getTime()) {
          return response.error(res, '今天已经签到过了', 400);
        }
      }

      // 签到奖励积分
      const creditsReward = config.business.credits.dailyLogin;

      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          credits: { increment: creditsReward },
          exp: { increment: creditsReward },
          lastActiveAt: new Date(),
        },
        select: {
          credits: true,
          level: true,
          exp: true,
        },
      });

      return response.success(res, {
        credits: updatedUser.credits,
        reward: creditsReward,
        message: `签到成功！获得 ${creditsReward} 积分`,
      }, '签到成功');
    } catch (error) {
      logger.error('每日签到失败:', error);
      return response.serverError(res, '签到失败');
    }
  }
}

module.exports = AuthController;
