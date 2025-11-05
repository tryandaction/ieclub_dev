// ==================== 后端完整API代码 ====================

// ===== 1. authController.js - 认证控制器（增强版）=====
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const { validateEmail } = require('../utils/common');

// 密码强度验证函数
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, message: '密码至少8位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码需包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' };
  }
  return { valid: true };
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class AuthController {
  // 发送邮箱验证码
  static async sendVerifyCode(req, res, next) {
    try {
      const { email, type = 'register' } = req.body; // type: register, reset, login

      // 验证邮箱格式
      if (!validateEmail(email)) {
        return res.status(400).json({
          code: 400,
          message: '邮箱格式不正确'
        });
      }

      // 频率限制：同一邮箱1分钟内只能发送1次
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCode = await prisma.verificationCode.findFirst({
        where: {
          email,
          createdAt: { gte: oneMinuteAgo }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentCode) {
        const waitSeconds = Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000);
        return res.status(429).json({
          code: 429,
          message: `验证码发送过于频繁，请${waitSeconds}秒后重试`
        });
      }

      // 检查邮箱域名是否允许
      const allowedDomainsStr = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
      if (allowedDomainsStr) {
        const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim()).filter(d => d);
        const emailDomain = email.split('@')[1];
        
        if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
          return res.status(400).json({
            code: 400,
            message: `仅允许以下邮箱注册: ${allowedDomains.join(', ')}`
          });
        }
      }

      // 注册时检查邮箱是否已存在
      if (type === 'register') {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(400).json({
            code: 400,
            message: '该邮箱已被注册'
          });
        }
      }

      // 重置密码或登录时检查邮箱是否存在
      if (type === 'reset' || type === 'login') {
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: '该邮箱未注册'
          });
        }
      }

      // 生成验证码
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到数据库
      await prisma.verificationCode.create({
        data: {
          email,
          code,
          type,
          expiresAt
        }
      });

      // 发送邮件（使用 emailService）
      const sendResult = await emailService.sendVerificationCode(email, code, type);
      
      // 检查邮件发送结果
      if (!sendResult || !sendResult.success) {
        logger.error('邮件发送失败:', { email, error: sendResult?.error });
        
        // 即使邮件发送失败，验证码仍然有效（已保存到数据库）
        return res.json({
          code: 200,
          message: '验证码已生成，但邮件发送失败。验证码为: ' + code,
          data: {
            expiresIn: 600, // 10分钟
            emailSent: false,
            code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
          }
        });
      }

      res.json({
        code: 200,
        message: '验证码已发送，请查收邮件',
        data: {
          expiresIn: 600, // 10分钟
          emailSent: true
        }
      });
    } catch (error) {
      logger.error('发送验证码失败:', { email: req.body.email, error: error.message });
      next(error);
    }
  }

  // 验证验证码
  static async verifyCode(req, res, next) {
    try {
      const { email, code } = req.body;

      // 从数据库查询验证码
      const stored = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          used: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (!stored) {
        return res.status(400).json({
          success: false,
          message: '验证码不存在或已使用'
        });
      }

      if (stored.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码已过期'
        });
      }

      if (stored.code !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码错误'
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

      res.json({
        success: true,
        message: '验证成功'
      });
    } catch (error) {
      next(error);
    }
  }

  // 注册
  static async register(req, res, next) {
    try {
      const { email, password, verifyCode, nickname, gender } = req.body;

      // 验证邮箱格式
      if (!validateEmail(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }

      // 检查邮箱域名是否允许（如果配置了 ALLOWED_EMAIL_DOMAINS）
      const allowedDomainsStr = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
      if (allowedDomainsStr) {
        const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim()).filter(d => d);
        const emailDomain = email.split('@')[1];
        
        if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
          return res.status(400).json({
            success: false,
            message: `仅允许以下邮箱注册: ${allowedDomains.join(', ')}`
          });
        }
      }

      // 验证验证码
      const stored = await prisma.verificationCode.findFirst({
        where: {
          email,
          code: verifyCode,
          type: 'register',
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

      // 检查邮箱是否已注册
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已注册'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 生成随机头像 URL（根据性别）
      const userGender = parseInt(gender) || 0; // 0: 未知, 1: 男, 2: 女
      let avatarUrl = '';
      
      if (userGender === 1) {
        // 男性头像：使用 DiceBear Avataaars 风格
        const seed = Math.random().toString(36).substring(7);
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      } else if (userGender === 2) {
        // 女性头像：使用 DiceBear Avataaars 风格（女性特征）
        const seed = Math.random().toString(36).substring(7);
        avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffdfbf,ffd5dc,c0aede`;
      } else {
        // 未知性别：使用 DiceBear Initials 风格（基于昵称）
        const displayName = nickname || email.split('@')[0];
        avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=667eea,764ba2,f093fb,4facfe`;
      }

      // 创建用户（使用随机生成的头像）
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: nickname || email.split('@')[0],
          avatar: avatarUrl,
          gender: userGender,
          lastLoginAt: new Date(),
          lastActiveAt: new Date()
        }
      });

      // 标记验证码为已使用
      await prisma.verificationCode.update({
        where: { id: stored.id },
        data: { 
          used: true,
          usedAt: new Date()
        }
      });

      // 记录登录日志
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          loginMethod: 'register',
          status: 'success'
        }
      });

      // 生成token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      logger.error('注册失败:', { email: req.body.email, error: error.message });
      next(error);
    }
  }

  // 登录
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 验证邮箱格式
      const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '请使用南科大邮箱'
        });
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // 记录失败日志（无用户ID）
        await prisma.loginLog.create({
          data: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            loginMethod: 'password',
            status: 'failed',
            failReason: '用户不存在'
          }
        });

        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 检查登录失败次数（最近15分钟内）
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const failedAttempts = await prisma.loginLog.count({
        where: {
          userId: user.id,
          status: 'failed',
          loginTime: {
            gte: fifteenMinutesAgo
          }
        }
      });

      if (failedAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: '登录失败次数过多，请15分钟后重试'
        });
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用，请联系管理员'
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        // 记录失败日志
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            loginMethod: 'password',
            status: 'failed',
            failReason: '密码错误'
          }
        });

        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
      }

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          lastActiveAt: new Date()
        }
      });

      // 记录成功日志
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          loginMethod: 'password',
          status: 'success'
        }
      });

      // 生成token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            isCertified: user.isCertified
          }
        }
      });
    } catch (error) {
      logger.error('登录失败:', { email: req.body.email, error: error.message });
      next(error);
    }
  }

  // 密码找回
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // 验证邮箱格式
      const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '请使用南科大邮箱'
        });
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '该邮箱未注册'
        });
      }

      // 生成重置token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // 发送重置邮件
      const sendResult = await emailService.sendPasswordResetEmail(email, resetToken);
      
      // 检查邮件发送结果
      if (!sendResult || !sendResult.success) {
        logger.error('密码重置邮件发送失败:', { email, error: sendResult?.error });
        return res.status(500).json({
          success: false,
          message: '邮件发送失败，请稍后重试'
        });
      }

      res.json({
        success: true,
        message: '重置链接已发送到您的邮箱，请查收'
      });
    } catch (error) {
      logger.error('密码找回失败:', { email: req.body.email, error: error.message });
      next(error);
    }
  }

  // 重置密码（支持验证码方式和token方式）
  static async resetPassword(req, res, next) {
    try {
      const { token, email, code, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 验证密码强度
      const passwordCheck = validatePasswordStrength(newPassword);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message
        });
      }

      let userId;

      // 方式1: 使用验证码重置（前端使用）
      if (email && code) {
        // 验证邮箱格式
        const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: '请使用南科大邮箱'
          });
        }

        // 验证验证码
        const stored = await prisma.verificationCode.findFirst({
          where: {
            email,
            code,
            type: 'reset',
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

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: '该邮箱未注册'
          });
        }

        userId = user.id;

        // 标记验证码为已使用
        await prisma.verificationCode.update({
          where: { id: stored.id },
          data: { 
            used: true,
            usedAt: new Date()
          }
        });
      } 
      // 方式2: 使用token重置（邮件链接方式）
      else if (token) {
        // 验证token
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.type !== 'password_reset') {
          return res.status(400).json({
            success: false,
            message: '无效的重置链接'
          });
        }

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }

        userId = user.id;
      } else {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: '密码重置成功，请重新登录'
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: '重置链接已过期或无效'
        });
      }
      logger.error('重置密码失败:', error.message);
      next(error);
    }
  }

  // 获取用户信息
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          bio: true,
          interests: true,
          skills: true,
          level: true,
          credits: true,
          exp: true,
          isCertified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '获取用户信息成功',
        data: user
      });
    } catch (error) {
      logger.error('获取用户信息失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 更新个人信息
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { nickname, bio, skills, interests } = req.body;

      // 构建更新数据
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (bio !== undefined) updateData.bio = bio;
      if (skills !== undefined) updateData.skills = JSON.stringify(skills);
      if (interests !== undefined) updateData.interests = JSON.stringify(interests);

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          bio: true,
          skills: true,
          interests: true
        }
      });

      res.json({
        success: true,
        message: '个人信息更新成功',
        data: user
      });
    } catch (error) {
      logger.error('更新个人信息失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 验证码登录
  static async loginWithCode(req, res, next) {
    try {
      const { email, code } = req.body;

      // 验证邮箱格式
      const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '请使用南科大邮箱'
        });
      }

      // 验证验证码
      const stored = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          type: 'login',
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

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '该邮箱未注册'
        });
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用，请联系管理员'
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

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          lastActiveAt: new Date()
        }
      });

      // 记录登录日志
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          loginMethod: 'code',
          status: 'success'
        }
      });

      // 生成token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            isCertified: user.isCertified
          }
        }
      });
    } catch (error) {
      logger.error('验证码登录失败:', { email: req.body.email, error: error.message });
      next(error);
    }
  }

  // 修改密码
  static async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 验证新密码强度
      const passwordCheck = validatePasswordStrength(newPassword);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message
        });
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '原密码错误'
        });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: '密码修改成功，请重新登录'
      });
    } catch (error) {
      logger.error('修改密码失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 绑定微信
  static async bindWechat(req, res, next) {
    try {
      const userId = req.user.id;
      const { openid, unionid, nickname, avatar } = req.body;

      if (!openid) {
        return res.status(400).json({
          success: false,
          message: '缺少微信openid'
        });
      }

      // 检查openid是否已被绑定
      const existingBinding = await prisma.userBinding.findUnique({
        where: {
          type_bindValue: {
            type: 'wechat',
            bindValue: openid
          }
        }
      });

      if (existingBinding && existingBinding.userId !== userId) {
        return res.status(400).json({
          success: false,
          message: '该微信已被其他账号绑定'
        });
      }

      // 创建或更新绑定
      await prisma.userBinding.upsert({
        where: {
          type_bindValue: {
            type: 'wechat',
            bindValue: openid
          }
        },
        update: {
          metadata: JSON.stringify({ unionid, nickname, avatar }),
          updatedAt: new Date()
        },
        create: {
          userId,
          type: 'wechat',
          bindValue: openid,
          metadata: JSON.stringify({ unionid, nickname, avatar })
        }
      });

      // 同时更新用户的openid和unionid字段
      await prisma.user.update({
        where: { id: userId },
        data: { openid, unionid }
      });

      res.json({
        success: true,
        message: '微信绑定成功'
      });
    } catch (error) {
      logger.error('绑定微信失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 绑定手机号
  static async bindPhone(req, res, next) {
    try {
      const userId = req.user.id;
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '手机号格式不正确'
        });
      }

      // 验证验证码
      const stored = await prisma.verificationCode.findFirst({
        where: {
          email: phone, // 这里复用email字段存储手机号
          code,
          type: 'bind_phone',
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

      // 检查手机号是否已被绑定
      const existingUser = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被其他账号绑定'
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

      // 更新用户手机号
      await prisma.user.update({
        where: { id: userId },
        data: { phone }
      });

      // 创建绑定记录
      await prisma.userBinding.upsert({
        where: {
          type_bindValue: {
            type: 'phone',
            bindValue: phone
          }
        },
        update: {
          updatedAt: new Date()
        },
        create: {
          userId,
          type: 'phone',
          bindValue: phone
        }
      });

      res.json({
        success: true,
        message: '手机号绑定成功'
      });
    } catch (error) {
      logger.error('绑定手机号失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 解绑微信
  static async unbindWechat(req, res, next) {
    try {
      const userId = req.user.id;

      // 检查用户是否绑定了微信
      const binding = await prisma.userBinding.findFirst({
        where: {
          userId,
          type: 'wechat'
        }
      });

      if (!binding) {
        return res.status(400).json({
          success: false,
          message: '当前未绑定微信'
        });
      }

      // 检查用户是否设置了密码（如果没有密码，不能解绑微信，否则无法登录）
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user.password || user.password === '') {
        return res.status(400).json({
          success: false,
          message: '请先设置密码后再解绑微信，否则将无法登录'
        });
      }

      // 删除绑定记录
      await prisma.userBinding.delete({
        where: { id: binding.id }
      });

      // 清除用户的openid和unionid
      await prisma.user.update({
        where: { id: userId },
        data: { 
          openid: null, 
          unionid: null,
          sessionKey: null
        }
      });

      logger.info('用户解绑微信:', { userId });

      res.json({
        success: true,
        message: '微信解绑成功'
      });
    } catch (error) {
      logger.error('解绑微信失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 注销账号
  static async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password, reason } = req.body;

      // 验证密码
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 如果用户有密码，需要验证密码
      if (user.password && user.password !== '') {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: '请输入密码确认注销'
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: '密码错误'
          });
        }
      }

      // 软删除：将用户状态设置为deleted，保留数据
      await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'deleted',
          email: `deleted_${userId}_${user.email}`, // 避免邮箱冲突
          openid: null,
          unionid: null,
          sessionKey: null,
          phone: null,
          updatedAt: new Date()
        }
      });

      // 记录注销原因（可选）
      if (reason) {
        logger.info('用户注销账号:', { userId, reason });
      } else {
        logger.info('用户注销账号:', { userId });
      }

      res.json({
        success: true,
        message: '账号注销成功'
      });
    } catch (error) {
      logger.error('注销账号失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 退出登录
  static async logout(req, res, next) {
    try {
      // 由于使用JWT，退出登录主要在前端清除token
      // 这里可以记录日志或进行其他操作
      
      res.json({
        success: true,
        message: '退出登录成功'
      });
    } catch (error) {
      logger.error('退出登录失败:', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  // 微信小程序登录（完善版）
  static async wechatLogin(req, res, next) {
    try {
      const { code, nickName, avatarUrl, gender } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: '缺少微信登录凭证'
        });
      }

      // TODO: 调用微信服务器换取openid和session_key
      // 这里需要配置微信小程序的appid和secret
      // const wechatService = require('../services/wechatService');
      // const wechatData = await wechatService.code2Session(code);
      // const { openid, sessionKey, unionid } = wechatData;

      // 临时方案：使用code作为openid（仅用于开发测试）
      const openid = `wx_${code}_${Date.now()}`;
      const sessionKey = null;
      const unionid = null;

      logger.info('微信登录:', { openid, hasNickName: !!nickName });

      // 1. 先查找是否已绑定微信
      const binding = await prisma.userBinding.findUnique({
        where: {
          type_bindValue: {
            type: 'wechat',
            bindValue: openid
          }
        },
        include: {
          user: true
        }
      });

      let user;
      let isNewUser = false;
      let needBindEmail = false;

      if (binding) {
        // 已绑定：直接登录
        user = binding.user;

        // 检查用户状态
        if (user.status === 'deleted') {
          return res.status(403).json({
            success: false,
            message: '该账号已注销'
          });
        }

        if (user.status === 'banned') {
          return res.status(403).json({
            success: false,
            message: '该账号已被封禁'
          });
        }

        // 更新最后登录时间和微信信息
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastActiveAt: new Date(),
            nickname: nickName || user.nickname,
            avatar: avatarUrl || user.avatar,
            gender: gender || user.gender
          }
        });

        logger.info('已绑定用户登录:', { userId: user.id, email: user.email });
      } else {
        // 未绑定：查找是否有同openid的用户（旧数据兼容）
        user = await prisma.user.findUnique({
          where: { openid }
        });

        if (user) {
          // 存在旧数据，创建绑定记录
          await prisma.userBinding.create({
            data: {
              userId: user.id,
              type: 'wechat',
              bindValue: openid,
              metadata: JSON.stringify({ unionid, nickname: nickName, avatar: avatarUrl })
            }
          });

          logger.info('旧用户创建绑定记录:', { userId: user.id });
        } else {
          // 首次微信登录：创建新用户（临时账号，需要绑定邮箱）
          isNewUser = true;
          needBindEmail = true;

          user = await prisma.user.create({
            data: {
              openid,
              unionid,
              sessionKey,
              nickname: nickName || '微信用户',
              avatar: avatarUrl || '',
              gender: gender || 0,
              email: `temp_${openid}@ieclub.online`, // 临时邮箱
              password: '', // 无密码，必须先绑定邮箱
              lastLoginAt: new Date(),
              lastActiveAt: new Date()
            }
          });

          // 创建绑定记录
          await prisma.userBinding.create({
            data: {
              userId: user.id,
              type: 'wechat',
              bindValue: openid,
              metadata: JSON.stringify({ unionid, nickname: nickName, avatar: avatarUrl })
            }
          });

          logger.info('新用户首次微信登录:', { userId: user.id, openid });
        }
      }

      // 记录登录日志
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          loginMethod: 'wechat',
          status: 'success'
        }
      });

      // 生成token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 检查是否需要绑定邮箱（临时账号）
      if (!needBindEmail && user.email && user.email.startsWith('temp_')) {
        needBindEmail = true;
      }

      res.json({
        success: true,
        message: isNewUser ? '首次登录成功，请绑定学校邮箱' : '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            openid: user.openid,
            nickname: user.nickname,
            avatar: user.avatar,
            email: needBindEmail ? null : user.email, // 临时邮箱不返回
            level: user.level,
            credits: user.credits,
            isCertified: user.isCertified,
            isNewUser,
            needBindEmail, // 是否需要绑定邮箱
            hasPassword: !!(user.password && user.password !== '') // 是否设置了密码
          }
        }
      });
    } catch (error) {
      logger.error('微信登录失败:', { code: req.body.code, error: error.message, stack: error.stack });
      next(error);
    }
  }
}

module.exports = AuthController;