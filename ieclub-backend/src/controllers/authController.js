// ==================== 后端完整API代码 ====================

// ===== 1. authController.js - 认证控制器（增强版）=====
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const wechatService = require('../services/wechatService');
const { validateEmail } = require('../utils/common');
const { checkEmailAllowed } = require('../utils/emailDomainChecker');

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
      const { email, type = 'register' } = req.body || {}; // type: register, reset, login
      
      // 验证必填字段
      if (!email) {
        return res.status(400).json({
          code: 400,
          message: '邮箱地址不能为空'
        });
      }

      // 验证邮箱格式与域名限制
      const emailCheck = checkEmailAllowed(email, type);
      if (!emailCheck.valid) {
        return res.status(400).json({
          code: 400,
          message: emailCheck.message
        });
      }

      // 频率限制：同一邮箱1分钟内只能发送1次
      let recentCode;
      try {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        recentCode = await prisma.verificationCode.findFirst({
          where: {
            email,
            createdAt: { gte: oneMinuteAgo }
          },
          orderBy: { createdAt: 'desc' }
        });
      } catch (dbError) {
        // 数据库连接错误
        if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
          logger.error('数据库连接失败:', { 
            error: dbError.message, 
            code: dbError.code, 
            name: dbError.name,
            stack: dbError.stack 
          });
          return res.status(503).json({
            code: 503,
            message: '服务暂时不可用，请稍后重试'
          });
        }
        // 其他数据库错误也记录日志
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }

      if (recentCode) {
        const waitSeconds = Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000);
        return res.status(429).json({
          code: 429,
          message: `验证码发送过于频繁，请${waitSeconds}秒后重试`
        });
      }

      // 注册时检查邮箱是否已存在
      if (type === 'register') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });

          if (existingUser) {
            return res.status(400).json({
              code: 400,
              message: '该邮箱已被注册'
            });
          }
        } catch (dbError) {
          if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
            logger.error('数据库连接失败:', dbError);
            return res.status(503).json({
              code: 503,
              message: '服务暂时不可用，请稍后重试'
            });
          }
          throw dbError;
        }
      }

      // 重置密码或登录时检查邮箱是否存在
      if (type === 'reset' || type === 'login') {
        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            return res.status(404).json({
              code: 404,
              message: '该邮箱未注册'
            });
          }
        } catch (dbError) {
          if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
            logger.error('数据库连接失败:', dbError);
            return res.status(503).json({
              code: 503,
              message: '服务暂时不可用，请稍后重试'
            });
          }
          throw dbError;
        }
      }

      // 生成验证码
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到数据库
      try {
        await prisma.verificationCode.create({
          data: {
            email,
            code,
            type,
            expiresAt
          }
        });
      } catch (dbError) {
        if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
          logger.error('数据库连接失败:', dbError);
          return res.status(503).json({
            code: 503,
            message: '服务暂时不可用，请稍后重试'
          });
        }
        throw dbError;
      }

      // 发送邮件（使用 emailService）
      let sendResult;
      try {
        sendResult = await emailService.sendVerificationCode(email, code, type);
      } catch (emailError) {
        logger.error('邮件服务调用失败:', { email, error: emailError.message, stack: emailError.stack });
        // 即使邮件发送失败，验证码仍然有效（已保存到数据库）
        return res.json({
          code: 200,
          message: '验证码已生成，但邮件发送失败',
          data: {
            expiresIn: 600, // 10分钟
            emailSent: false,
            code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
          }
        });
      }
      
      // 检查邮件发送结果
      if (!sendResult || !sendResult.success) {
        logger.error('邮件发送失败:', { email, error: sendResult?.error });
        
        // 即使邮件发送失败，验证码仍然有效（已保存到数据库）
        return res.json({
          code: 200,
          message: '验证码已生成，但邮件发送失败',
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
      logger.error('发送验证码失败:', { 
        email: req.body?.email, 
        error: error.message, 
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      next(error);
    }
  }

  // 验证验证码
  static async verifyCode(req, res, next) {
    try {
      const { email, code } = req.body || {};
      
      // 验证必填字段
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: '邮箱和验证码不能为空'
        });
      }
      
      // 验证邮箱格式
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }
      
      // 验证验证码格式
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: '验证码必须是6位数字'
        });
      }

      // 从数据库查询验证码
      let stored;
      try {
        stored = await prisma.verificationCode.findFirst({
          where: {
            email,
            code,
            used: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      } catch (dbError) {
        if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
          logger.error('数据库连接失败:', { 
            error: dbError.message, 
            code: dbError.code, 
            name: dbError.name,
            stack: dbError.stack 
          });
          return res.status(503).json({
            success: false,
            message: '服务暂时不可用，请稍后重试'
          });
        }
        // 其他数据库错误也记录日志
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }
      
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
      try {
        await prisma.verificationCode.update({
          where: { id: stored.id },
          data: { 
            used: true,
            usedAt: new Date()
          }
        });
      } catch (dbError) {
        if (dbError.code === 'P1001' || dbError.code === 'P1000' || dbError.name === 'PrismaClientInitializationError') {
          logger.error('数据库连接失败:', { 
            error: dbError.message, 
            code: dbError.code, 
            name: dbError.name,
            stack: dbError.stack 
          });
          return res.status(503).json({
            success: false,
            message: '服务暂时不可用，请稍后重试'
          });
        }
        // 其他数据库错误也记录日志
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }

      res.json({
        success: true,
        message: '验证成功'
      });
    } catch (error) {
      logger.error('验证验证码失败:', { 
        email: req.body?.email, 
        error: error.message, 
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      next(error);
    }
  }

  // 注册
  static async register(req, res, next) {
    try {
      const { email, password, verifyCode, nickname, gender } = req.body;

      // 验证邮箱格式与域名限制
      const emailCheck = checkEmailAllowed(email, 'register');
      if (!emailCheck.valid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.message
        });
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

      // 记录登录尝试
      logger.info('登录尝试:', { email, ip: req.ip });

      // 验证邮箱格式与域名限制
      const emailCheck = checkEmailAllowed(email, 'login');
      if (!emailCheck.valid) {
        logger.warn('邮箱验证失败:', { email, reason: emailCheck.message });
        return res.status(400).json({
          success: false,
          message: emailCheck.message
        });
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        logger.warn('登录失败 - 用户不存在:', { email });
        
        // 记录失败日志（无用户ID）
        try {
          await prisma.loginLog.create({
            data: {
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('user-agent'),
              loginMethod: 'password',
              status: 'failed',
              failReason: '用户不存在'
            }
          });
        } catch (logError) {
          logger.error('记录登录日志失败:', logError);
        }

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
      logger.error('登录失败:', { 
        email: req.body.email, 
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      // 如果是数据库连接错误，返回更友好的错误信息
      if (error.code === 'P1001' || error.message.includes('Can\'t reach database')) {
        logger.error('数据库连接失败:', error);
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }
      
      // 如果是 Prisma 客户端错误，返回更友好的错误信息
      if (error.name === 'PrismaClientInitializationError') {
        logger.error('Prisma 客户端初始化失败:', error);
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }
      
      // 其他错误传递给错误处理器
      next(error);
    }
  }

  // 密码找回
  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // 验证邮箱格式与域名限制
      const emailCheck = checkEmailAllowed(email, 'reset');
      if (!emailCheck.valid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.message
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
        // 验证邮箱格式与域名限制
        const emailCheck = checkEmailAllowed(email, 'reset');
        if (!emailCheck.valid) {
          return res.status(400).json({
            success: false,
            message: emailCheck.message
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

      // 验证邮箱格式与域名限制
      const emailCheck = checkEmailAllowed(email, 'login');
      if (!emailCheck.valid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.message
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

  // 发送手机验证码
  static async sendPhoneCode(req, res, next) {
    try {
      const { phone, type = 'bind' } = req.body; // type: bind, login

      // 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
          code: 400,
          message: '手机号格式不正确'
        });
      }

      // 频率限制：同一手机号1分钟内只能发送1次
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCode = await prisma.verificationCode.findFirst({
        where: {
          email: phone, // 复用email字段存储手机号
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

      // 绑定手机时检查是否已被绑定
      if (type === 'bind') {
        const existingUser = await prisma.user.findUnique({
          where: { phone }
        });

        if (existingUser && existingUser.id !== req.user?.id) {
          return res.status(400).json({
            code: 400,
            message: '该手机号已被其他账号绑定'
          });
        }
      }

      // 手机登录时检查手机号是否存在
      if (type === 'login') {
        const user = await prisma.user.findUnique({
          where: { phone }
        });

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: '该手机号未绑定账号'
          });
        }
      }

      // 生成验证码
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到数据库
      await prisma.verificationCode.create({
        data: {
          email: phone, // 复用email字段
          code,
          type: type === 'bind' ? 'bind_phone' : 'login',
          expiresAt
        }
      });

      // 发送短信
      const sendResult = await smsService.sendVerificationCode(phone, code, type);
      
      if (!sendResult || !sendResult.success) {
        logger.error('短信发送失败:', { phone, error: sendResult?.error });
        
        return res.json({
          code: 200,
          message: '验证码已生成，但短信发送失败',
          data: {
            expiresIn: 600,
            smsSent: false,
            code: process.env.NODE_ENV === 'development' ? code : undefined
          }
        });
      }

      res.json({
        code: 200,
        message: '验证码已发送',
        data: {
          expiresIn: 600,
          smsSent: true
        }
      });
    } catch (error) {
      logger.error('发送手机验证码失败:', { phone: req.body.phone, error: error.message });
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

  // 手机号登录
  static async loginWithPhone(req, res, next) {
    try {
      const { phone, code } = req.body;

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
        where: { phone }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '该手机号未绑定账号'
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
          loginMethod: 'phone',
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
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
            level: user.level,
            isCertified: user.isCertified
          }
        }
      });
    } catch (error) {
      logger.error('手机号登录失败:', { phone: req.body.phone, error: error.message });
      next(error);
    }
  }

  // 解绑手机号
  static async unbindPhone(req, res, next) {
    try {
      const userId = req.user.id;

      // 检查用户是否绑定了手机号
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.phone) {
        return res.status(400).json({
          success: false,
          message: '当前未绑定手机号'
        });
      }

      // 检查是否至少有一种登录方式（密码或微信）
      if (!user.password && !user.openid) {
        return res.status(400).json({
          success: false,
          message: '请先设置密码或绑定微信后再解绑手机号，否则将无法登录'
        });
      }

      // 删除绑定记录
      await prisma.userBinding.deleteMany({
        where: {
          userId,
          type: 'phone'
        }
      });

      // 清除用户手机号
      await prisma.user.update({
        where: { id: userId },
        data: { phone: null }
      });

      logger.info('用户解绑手机号:', { userId, phone: user.phone });

      res.json({
        success: true,
        message: '手机号解绑成功'
      });
    } catch (error) {
      logger.error('解绑手机号失败:', { userId: req.user?.id, error: error.message });
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

      let openid, sessionKey, unionid;

      try {
        // 调用微信服务器换取openid和session_key
        const wechatData = await wechatService.code2Session(code);
        openid = wechatData.openid;
        sessionKey = wechatData.sessionKey;
        unionid = wechatData.unionid;
        
        logger.info('微信登录成功获取openid:', { openid, hasUnionid: !!unionid });
      } catch (wechatError) {
        logger.error('微信code2Session失败:', wechatError);
        
        // 开发环境：使用临时方案
        if (process.env.NODE_ENV === 'development') {
          logger.warn('开发环境：使用临时openid');
          openid = `wx_dev_${code}_${Date.now()}`;
          sessionKey = null;
          unionid = null;
        } else {
          return res.status(500).json({
            success: false,
            message: '微信登录失败，请重试'
          });
        }
      }

      logger.info('微信登录处理:', { openid, hasNickName: !!nickName });

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