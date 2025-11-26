// ==================== 后端完整API代码 ====================

// ===== 1. authController.js - 认证控制器（增强版）=====
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../utils/logger');
const response = require('../utils/response');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const wechatService = require('../services/wechatService');
const { validateEmail } = require('../utils/common');
const { checkEmailAllowed } = require('../utils/emailDomainChecker');
const { handleDatabaseError } = require('../utils/errorHandler');
const { generateTokenPair } = require('../utils/tokenUtils');
const { validatePassword, validatePasswordMatch } = require('../utils/passwordValidator');

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class AuthController {
  // 发送邮箱验证码
  static async sendVerifyCode(req, res, next) {
    try {
      let { email, type = 'register' } = req.body || {}; // type: register, reset, reset_password, login
      
      // 标准化验证码类型：reset_password -> reset
      if (type === 'reset_password') {
        type = 'reset';
      }

      // 验证必填字段
      if (!email) {
        return res.status(400).json({
          success: false,
          message: '邮箱地址不能为空'
        });
      }

      // 验证邮箱格式与域名限制
      const emailCheck = await checkEmailAllowed(email, type);
      if (!emailCheck.valid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.message
        });
      }

      // 频率限制：同一邮箱1分钟内只能发送1次（与Redis限流配合）
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
        if (handleDatabaseError(dbError, res, '查询验证码')) return;
        throw dbError;
      }

      if (recentCode) {
        const waitSeconds = Math.ceil((recentCode.createdAt.getTime() + 60000 - Date.now()) / 1000);
        return res.status(429).json({
          success: false,
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
              success: false,
              message: '该邮箱已被注册'
            });
          }
        } catch (dbError) {
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
      }

      // 重置密码或登录时检查邮箱是否存在
      if (type === 'reset' || type === 'reset_password' || type === 'login') {
        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            return res.status(404).json({
              success: false,
              message: '该邮箱未注册'
            });
          }
        } catch (dbError) {
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
      }

      // 生成验证码（确保是字符串类型）
      const code = generateVerificationCode().toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到数据库
      try {
        logger.info(`💾 保存验证码到数据库:`, { 
          email, 
          code, 
          codeType: typeof code,
          type, 
          expiresAt 
        });
        await prisma.verificationCode.create({
          data: {
            email,
            code: code.toString(), // 确保是字符串类型
            type,
            expiresAt
          }
        });
        logger.info(`✅ 验证码已保存到数据库:`, { 
          email, 
          code, 
          codeType: typeof code,
          type 
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

      // 发送邮件（使用 emailService）
      let sendResult;
      const env = process.env.NODE_ENV || 'development';
      // staging 环境也视为测试环境，允许邮件失败时返回成功（验证码已保存）
      const isTestEnv = env === 'test' || env === 'development' || env === 'staging' || process.env.ALLOW_TEST_CODE === 'true';

      // 在测试环境中，记录验证码到日志以便调试
      if (isTestEnv) {
        logger.info(`🔐 [${env.toUpperCase()}] 验证码已生成: ${code} (邮箱: ${email}, 类型: ${type})`);
      }
      
      try {
        logger.info(`📧 准备发送验证码邮件到: ${email}`, { type, codeLength: code.length, env });
        sendResult = await emailService.sendVerificationCode(email, code, type);
        logger.info(`📧 邮件发送结果:`, { 
          email, 
          success: sendResult?.success, 
          error: sendResult?.error,
          messageId: sendResult?.messageId
        });
      } catch (emailError) {
        logger.error('❌ 邮件服务调用失败:', { 
          email, 
          type,
          error: emailError.message, 
          code: emailError.code,
          stack: emailError.stack 
        });
        
        // 在测试/开发/staging环境，即使邮件失败也返回成功（验证码已保存）
        if (isTestEnv) {
          logger.warn(`⚠️ ${env}环境：邮件发送失败，但验证码已保存，返回成功`, { email, code });
          return res.json({
            success: true,
            message: `验证码已生成（${env}环境：邮件发送失败，但验证码已保存）`,
            data: {
              expiresIn: 600, // 10分钟
              emailSent: false,
              verificationCode: code, // 测试环境返回验证码
              note: `这是${env}环境，验证码已保存到数据库。验证码: ${code}`
            }
          });
        }
        
        // 生产环境：验证码已保存，但邮件发送失败，返回503（服务暂时不可用）而不是500
        // 这样前端可以重试，但不会因为邮件服务问题导致验证码无法使用
        logger.error('❌ 生产环境邮件发送失败，但验证码已保存', { 
          email, 
          code,
          error: emailError.message 
        });
        return res.status(503).json({
          success: false,
          message: '验证码已生成，但邮件发送失败，请稍后重试或联系管理员',
          data: {
            expiresIn: 600, // 10分钟
            emailSent: false,
            error: emailError.message
          }
        });
      }
      
      // 检查邮件发送结果
      if (!sendResult || !sendResult.success) {
        logger.error('❌ 邮件发送失败:', { 
          email, 
          type,
          error: sendResult?.error,
          errorCode: sendResult?.errorCode,
          errorResponseCode: sendResult?.errorResponseCode,
          env
        });
        
        // 在测试/开发/staging环境，即使邮件失败也返回成功（验证码已保存）
        if (isTestEnv) {
          logger.warn(`⚠️ ${env}环境：邮件发送失败，但验证码已保存，返回成功`, { email, code });
          return res.json({
            success: true,
            message: `验证码已生成（${env}环境：邮件发送失败，但验证码已保存）`,
            data: {
              expiresIn: 600, // 10分钟
              emailSent: false,
              verificationCode: code, // 测试环境返回验证码
              note: `这是${env}环境，验证码已保存到数据库。验证码: ${code}`
            }
          });
        }
        
        // 生产环境：验证码已保存，但邮件发送失败，返回503（服务暂时不可用）而不是500
        // 这样前端可以重试，但不会因为邮件服务问题导致验证码无法使用
        const errorMessage = sendResult?.error || '验证码已生成，但邮件发送失败，请稍后重试或联系管理员';
        logger.error('❌ 生产环境邮件发送失败，但验证码已保存', { 
          email, 
          code,
          error: errorMessage 
        });
        return res.status(503).json({
          success: false,
          message: errorMessage,
          data: {
            expiresIn: 600, // 10分钟
            emailSent: false,
            error: errorMessage
          }
        });
      }

      // 邮件发送成功
      res.json({
        success: true,
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
      // 兼容前端可能传入的字段名：code 或 verifyCode
      const { email } = req.body || {};
      let code = req.body?.code ?? req.body?.verifyCode;
      
      // 统一规范化验证码：转字符串、去空白、仅保留数字
      if (typeof code !== 'undefined' && code !== null) {
        code = String(code).trim().replace(/\D/g, '');
      }
      
      // 验证必填字段
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: '邮箱和验证码不能为空'
        });
      }

      // 从数据库查询验证码（先查询所有未使用的验证码，包括已过期的）
      let stored;
      try {
        logger.info(`🔍 查询验证码:`, { 
          email, 
          code: code.trim(), 
          codeType: typeof code,
          codeLength: code.length
        });
        
        // 先查询该邮箱的所有未使用验证码（用于调试）
        const allCodes = await prisma.verificationCode.findMany({
          where: {
            email,
            used: false
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });
        logger.info(`🔍 该邮箱的所有未使用验证码:`, { 
          email, 
          count: allCodes.length,
          codes: allCodes.map(c => ({ 
            code: c.code, 
            codeType: typeof c.code,
            createdAt: c.createdAt, 
            expiresAt: c.expiresAt,
            expired: c.expiresAt < new Date()
          }))
        });
        
        // 查询匹配的验证码（确保类型一致）
        stored = await prisma.verificationCode.findFirst({
          where: {
            email,
            code: code.trim(), // 确保code是字符串类型并去除空格
            used: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        logger.info(`🔍 查询结果:`, { 
          found: !!stored, 
          email, 
          code: code.trim(),
          storedCode: stored?.code,
          storedCodeType: stored ? typeof stored.code : null
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
      
      // 检查验证码是否存在
      if (!stored) {
        const env = process.env.NODE_ENV || 'development';
        logger.warn(`⚠️ 验证码未找到:`, { email, code: code.trim() });
        
        // 在测试/开发/staging 环境下，为排查问题提供更详细的提示
        if (env === 'development' || env === 'test' || env === 'staging') {
          return res.status(400).json({
            success: false,
            message: '验证码错误或不存在，请检查后重试（测试环境提示）',
            debug: {
              note: '若是粘贴验证码失败，请手动输入或仅粘贴数字',
              normalizedCode: code.trim()
            }
          });
        }
        // 检查是否有已使用的验证码（确保类型一致）
        const usedCode = await prisma.verificationCode.findFirst({
          where: {
            email,
            code: code.trim(), // 确保code是字符串类型并去除空格
            used: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        if (usedCode) {
          logger.warn(`⚠️ 验证码已使用:`, { email, code: code.trim(), usedAt: usedCode.usedAt });
          return res.status(400).json({
            success: false,
            message: '验证码已使用，请重新获取'
          });
        }

        return res.status(400).json({
          success: false,
          message: '验证码错误或不存在，请检查后重试'
        });
      }

      // 检查验证码是否过期
      if (stored.expiresAt < new Date()) {
        logger.warn(`⚠️ 验证码已过期:`, { 
          email, 
          code: code.trim(), 
          expiresAt: stored.expiresAt,
          now: new Date()
        });
        return res.status(400).json({
          message: '验证码已过期，请重新获取'
        });
      }

      logger.info(`✅ 验证码验证通过:`, { email, code: code.trim(), type: stored.type });

      // 注意：这里只验证验证码有效性，不标记为已使用
      // 验证码将在真正使用时（注册或重置密码）才被标记为已使用
      // 这样可以避免用户在多步骤流程中因中途退出导致验证码失效

      return res.json({
        success: true,
        message: '验证码验证成功'
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
      const { email, password, nickname, gender } = req.body || {};
      // 兼容 verifyCode 或 code 字段
      let verifyCode = req.body?.verifyCode ?? req.body?.code;
      if (typeof verifyCode !== 'undefined' && verifyCode !== null) {
        verifyCode = String(verifyCode).trim().replace(/\D/g, '');
      }

      logger.info('注册请求参数:', {
        email,
        nickname,
        hasPassword: !!password,
        verifyCode: verifyCode ? '***' + verifyCode.slice(-2) : undefined,
        gender
      });

      // 验证必填字段
      if (!email || !password || !verifyCode) {
        return res.status(400).json({
          success: false,
          message: '邮箱、密码和验证码不能为空'
        });
      }

      // 验证邮箱格式与域名限制
      const emailCheck = await checkEmailAllowed(email, 'register');
      if (!emailCheck.valid) {
        return res.status(400).json({
          success: false,
          message: emailCheck.message
        });
      }

      // 简单验证密码长度
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度不能少于6个字符'
        });
      }

      // 验证验证码（确保类型一致）
      let stored;
      try {
        const verifyCodeStr = String(verifyCode).trim();
        stored = await prisma.verificationCode.findFirst({
          where: {
            email,
            code: verifyCodeStr, // 确保是字符串类型
            type: 'register',
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
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }

      if (!stored || stored.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过期'
        });
      }

      // 检查邮箱是否已注册
      let existingUser;
      try {
        existingUser = await prisma.user.findUnique({
          where: { email }
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
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }
      
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
      let user;
      try {
        user = await prisma.user.create({
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
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
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
        logger.error('标记验证码失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        // 不阻止注册流程，只记录日志
      }

      // 记录登录日志
      try {
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            loginMethod: 'register',
            status: 'success'
          }
        });
      } catch (dbError) {
        logger.error('记录登录日志失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        // 不阻止注册流程，只记录日志
      }

      // 生成 access token 和 refresh token
      const tokens = generateTokenPair(user);

      // 保存 refresh token 到数据库
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          token: tokens.accessToken, // 兼容旧版前端
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      logger.error('注册失败:', { 
        email: req.body?.email, 
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      
      // 如果是数据库连接错误，返回更友好的错误信息
      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }
      
      next(error);
    }
  }

  // 登录
  static async login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      // 验证必填字段
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: '邮箱和密码不能为空'
        });
      }

      // 记录登录尝试
      logger.info('登录尝试:', { email, ip: req.ip });

      // 验证邮箱格式与域名限制
      const emailCheck = await checkEmailAllowed(email, 'login');
      if (!emailCheck.valid) {
        logger.warn('邮箱验证失败:', { email, reason: emailCheck.message });
        return res.status(400).json({
          success: false,
          message: emailCheck.message
        });
      }

      // 查找用户
      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email }
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
        logger.error('数据库操作失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        throw dbError;
      }

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
      let failedAttempts = 0;
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        failedAttempts = await prisma.loginLog.count({
          where: {
            userId: user.id,
            status: 'failed',
            loginTime: {
              gte: fifteenMinutesAgo
            }
          }
        });
      } catch (dbError) {
        logger.error('查询登录失败次数失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        // 不阻止登录流程，继续执行
      }

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
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            lastActiveAt: new Date()
          }
        });
      } catch (dbError) {
        logger.error('更新最后登录时间失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        // 不阻止登录流程，继续执行
      }

      // 记录成功日志
      try {
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            loginMethod: 'password',
            status: 'success'
          }
        });
      } catch (dbError) {
        logger.error('记录登录日志失败:', { 
          error: dbError.message, 
          code: dbError.code, 
          name: dbError.name,
          stack: dbError.stack 
        });
        // 不阻止登录流程，继续执行
      }

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
      const { email } = req.body || {};

      // 验证必填字段
      if (!email) {
        return res.status(400).json({
          success: false,
          message: '邮箱地址不能为空'
        });
      }

      // 验证邮箱格式与域名限制
      const emailCheck = await checkEmailAllowed(email, 'reset');
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
        // 返回503（服务暂时不可用）而不是500，允许前端重试
        return res.status(503).json({
          success: false,
          message: '邮件发送失败，请稍后重试'
        });
      }

      res.json({
        success: true,
        message: '重置链接已发送到您的邮箱，请查收'
      });
    } catch (error) {
      logger.error('密码找回失败:', { 
        email: req.body?.email, 
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      
      // 如果是数据库连接错误，返回更友好的错误信息
      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }
      
      next(error);
    }
  }

  // 重置密码（支持验证码方式和token方式）
  static async resetPassword(req, res, next) {
    try {
      const { token, email, newPassword } = req.body || {};
      // 兼容 code 或 verifyCode 字段
      let code = req.body?.code ?? req.body?.verifyCode;
      if (typeof code !== 'undefined' && code !== null) {
        code = String(code).trim().replace(/\D/g, '');
      }

      // 记录重置密码请求参数（不显示密码）
      logger.info('重置密码请求:', { 
        email, 
        hasToken: !!token, 
        hasCode: !!code, 
        codeLength: code ? code.length : 0,
        hasNewPassword: !!newPassword 
      });

      // 参数验证
      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '新密码不能为空'
        });
      }

      // 简单验证密码长度
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码长度不能少于6个字符'
        });
      }

      let userId;

      // 方式1: 使用验证码重置（前端使用）
      if (email && code) {
        logger.info('使用验证码重置密码:', { email, codeLength: code.length });
        
        // 验证邮箱格式与域名限制
        const emailCheck = await checkEmailAllowed(email, 'reset');
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
            code: code.trim(),
            type: 'reset',
            used: false
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!stored) {
          logger.warn('验证码不存在:', { email, code });
          return res.status(400).json({
            success: false,
            message: '验证码错误或不存在'
          });
        }
        
        if (stored.expiresAt < new Date()) {
          logger.warn('验证码已过期:', { email, code, expiresAt: stored.expiresAt });
          return res.status(400).json({
            success: false,
            message: '验证码已过期'
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
        logger.info('验证码已标记为已使用:', { email, code });
      } else {
        logger.warn('重置密码参数不足:', { hasEmail: !!email, hasCode: !!code, hasToken: !!token });
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：需要邮箱+验证码 或 重置令牌'
        });
      }

      // 验证新密码强度（宽松版本 - 只检查长度）
      if (newPassword.length < 6 || newPassword.length > 32) {
        return res.status(400).json({
          success: false,
          message: '密码长度必须在6-32个字符之间'
        });
      }

      // 查询用户获取 tokenVersion
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
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

      // 生成新的 token 对（用于用户重新登录）
      const tokens = generateTokenPair(user);

      logger.info('用户重置密码成功:', { userId, email: user.email });

      res.json({
        success: true,
        message: '密码重置成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: '重置链接已过期或无效'
        });
      }
      logger.error('重置密码失败:', { 
        email: req.body?.email, 
        error: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      
      // 如果是数据库连接错误，返回更友好的错误信息
      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }
      
      next(error);
    }
  }

  // 验证码登录
  static async loginWithCode(req, res, next) {
    try {
      const { email } = req.body || {};
      // 兼容 code 或 verifyCode 字段
      let code = req.body?.code ?? req.body?.verifyCode;
      if (typeof code !== 'undefined' && code !== null) {
        code = String(code).trim().replace(/\D/g, '');
      }

      // 验证必填字段
      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: '邮箱和验证码不能为空'
        });
      }

      // 验证邮箱格式与域名限制
      const emailCheck = await checkEmailAllowed(email, 'login');
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
          code: code.trim(),
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

      // 生成 access token 和 refresh token
      const tokens = generateTokenPair(user);

      // 保存 refresh token 到数据库
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          token: tokens.accessToken, // 兼容旧版前端
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

  // 手机号登录
  static async loginWithPhone(req, res, next) {
    try {
      const { phone, code } = req.body || {};
      
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

      // 生成 access token 和 refresh token
      const tokens = generateTokenPair(user);

      // 保存 refresh token 到数据库
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          token: tokens.accessToken, // 兼容旧版前端
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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        });
      }

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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        });
      }

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
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权'
        });
      }
      
      const { password, reason } = req.body || {};

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
      const { code, nickName, avatarUrl, gender } = req.body || {};

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
          // 微信服务不可用，返回503（服务暂时不可用）而不是500
          return res.status(503).json({
            success: false,
            message: '微信登录服务暂时不可用，请稍后重试'
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
      logger.error('微信登录失败:', { 
        code: req.body?.code, 
        error: error.message, 
        stack: error.stack
      });
      
      // 如果是数据库连接错误，返回更友好的错误信息
      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }

      next(error);
    }
  }

  /**
   * 首次设置密码
   * POST /api/auth/set-password
   * 适用于微信登录后想设置密码的用户
   */
  static async setPassword(req, res, next) {
    try {
      const { password, confirmPassword } = req.body || {};
      const userId = req.user?.id;

      if (!password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: '密码和确认密码不能为空'
        });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
          strength: passwordValidation.strength
        });
      }

      const matchValidation = validatePasswordMatch(password, confirmPassword);
      if (!matchValidation.valid) {
        return res.status(400).json({
          success: false,
          message: matchValidation.message
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (user.password && user.password.length > 0) {
        return res.status(400).json({
          success: false,
          message: '您已设置过密码，请使用修改密码功能'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          tokenVersion: user.tokenVersion + 1,
          updatedAt: new Date()
        }
      });

      const tokens = generateTokenPair({ ...user, tokenVersion: user.tokenVersion + 1 });

      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: tokens.refreshToken }
      });

      logger.info('用户首次设置密码成功:', { userId, email: user.email });

      res.json({
        success: true,
        message: '密码设置成功',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      logger.error('设置密码失败:', { 
        userId: req.user?.id, 
        error: error.message,
        stack: error.stack
      });

      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }

      next(error);
    }
  }

  /**
   * 修改密码
   * PUT /api/auth/change-password
   * 需要提供旧密码
   */
  static async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body || {};
      const userId = req.user?.id;

      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: '旧密码、新密码和确认密码不能为空'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (!user.password || user.password.length === 0) {
        return res.status(400).json({
          success: false,
          message: '您还未设置密码，请先设置密码'
        });
      }

      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '旧密码错误'
        });
      }

      if (oldPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: '新密码不能与旧密码相同'
        });
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
          strength: passwordValidation.strength
        });
      }

      const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
      if (!matchValidation.valid) {
        return res.status(400).json({
          success: false,
          message: matchValidation.message
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          tokenVersion: user.tokenVersion + 1,
          refreshToken: null,
          updatedAt: new Date()
        }
      });

      const tokens = generateTokenPair({ ...user, tokenVersion: user.tokenVersion + 1 });

      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: tokens.refreshToken }
      });

      logger.info('用户修改密码成功:', { userId, email: user.email });

      res.json({
        success: true,
        message: '密码修改成功，请使用新密码登录',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      logger.error('修改密码失败:', { 
        userId: req.user?.id, 
        error: error.message,
        stack: error.stack
      });

      if (error.code === 'P1001' || error.code === 'P1000' || error.name === 'PrismaClientInitializationError') {
        return res.status(503).json({
          success: false,
          message: '服务暂时不可用，请稍后重试'
        });
      }

      next(error);
    }
  }

  // 获取个人信息
  static async getProfile(req, res) {
    try {
      // 兼容req.user和req.userId
      const userId = req.user?.id || req.userId;
      
      if (!userId) {
        logger.error('获取个人信息失败: userId未定义', { user: req.user, userId: req.userId });
        return response.unauthorized(res, '用户未登录');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          openid: true,
          nickname: true,
          avatar: true,
          gender: true,
          bio: true,
          school: true,
          major: true,
          grade: true,
          verified: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return response.unauthorized(res, '用户不存在');
      }

      return response.success(res, user, '获取个人信息成功');
    } catch (error) {
      logger.error('获取个人信息失败:', error);
      return response.serverError(res);
    }
  }

  // 更新个人信息
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { nickname, avatar, gender, bio, school, major, grade } = req.body;

      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (gender !== undefined) updateData.gender = gender;
      if (bio !== undefined) updateData.bio = bio;
      if (school !== undefined) updateData.school = school;
      if (major !== undefined) updateData.major = major;
      if (grade !== undefined) updateData.grade = grade;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          gender: true,
          bio: true,
          school: true,
          major: true,
          grade: true,
          level: true,
          exp: true,
          credits: true,
          isCertified: true
        }
      });

      res.json({
        success: true,
        message: '更新个人信息成功',
        data: user
      });
    } catch (error) {
      logger.error('更新个人信息失败:', error);
      next(error);
    }
  }
}

module.exports = AuthController;