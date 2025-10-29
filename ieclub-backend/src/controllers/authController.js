// ==================== 后端完整API代码 ====================

// ===== 1. authController.js - 认证控制器（增强版）=====
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const config = require('../config');

const prisma = new PrismaClient();

// 邮件发送器配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com', // 使用QQ邮箱SMTP，可改为其他
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // 发件邮箱
    pass: process.env.EMAIL_PASS  // 授权码
  }
});

// 验证码存储（现在使用数据库）
// const verifyCodeStore = new Map(); // 已弃用

// 辅助函数
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
  return regex.test(email);
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
}

class AuthController {
  // 发送邮箱验证码
  static async sendVerifyCode(req, res, _next) {
    try {
      const { email, type = 'register' } = req.body; // type: register, reset

      // 验证邮箱格式
      if (!validateEmail(email)) {
        return res.status(400).json({
          code: 400,
          message: '邮箱格式不正确'
        });
      }

      // 检查邮箱域名是否允许
      const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
      const emailDomain = email.split('@')[1];

      if (allowedDomains.length > 0 && !allowedDomains.includes(emailDomain)) {
        return res.status(400).json({
          code: 400,
          message: `仅允许以下邮箱注册: ${allowedDomains.join(', ')}`
        });
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

      // 重置密码时检查邮箱是否存在
      if (type === 'reset') {
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

      // 发送邮件
      const subject = type === 'register' ? 'IEClub 注册验证码' : 'IEClub 密码重置验证码';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">IEClub ${type === 'register' ? '注册' : '密码重置'}验证</h2>
          <p>您好！</p>
          <p>您的验证码是：</p>
          <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p style="color: #ef4444;">验证码将在10分钟后过期，请尽快使用。</p>
          <p>如果这不是您本人的操作，请忽略此邮件。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `;

      await sendEmail(email, subject, html);

      res.json({
        code: 200,
        message: '验证码已发送，请查收邮件',
        data: {
          expiresIn: 600 // 10分钟
        }
      });
    } catch (error) {
      console.error('发送验证码失败:', error);
      res.status(500).json({
        code: 500,
        message: '发送验证码失败，请稍后重试',
        error: error.message
      });
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
      const { email, password, verifyCode, nickname } = req.body;

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

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          nickname: nickname || email.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${nickname || 'User'}&background=667eea&color=fff`,
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
      console.error('注册失败:', error);
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
      console.error('登录失败:', error);
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
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:10086'}/reset-password?token=${resetToken}`;
      const subject = 'IEClub 密码重置';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">IEClub 密码重置</h2>
          <p>您好！</p>
          <p>您请求重置密码，请点击下面的链接完成重置：</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">重置密码</a>
          <p style="color: #ef4444;">链接将在1小时后过期，请尽快使用。</p>
          <p>如果这不是您本人的操作，请忽略此邮件。</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
      `;

      await sendEmail(email, subject, html);

      res.json({
        success: true,
        message: '重置链接已发送到您的邮箱，请查收'
      });
    } catch (error) {
      console.error('密码找回失败:', error);
      next(error);
    }
  }

  // 重置密码
  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      // 验证密码强度
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码至少6位'
        });
      }

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

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: user.id },
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
      console.error('重置密码失败:', error);
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
          school: true,
          major: true,
          grade: true,
          interests: true,
          skills: true,
          verified: true,
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
      console.error('获取用户信息失败:', error);
      next(error);
    }
  }

  // 更新个人信息
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { nickname, bio, school, major, grade, skills, interests } = req.body;

      // 构建更新数据
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (bio !== undefined) updateData.bio = bio;
      if (school !== undefined) updateData.school = school;
      if (major !== undefined) updateData.major = major;
      if (grade !== undefined) updateData.grade = grade;
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
          school: true,
          major: true,
          grade: true,
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
      console.error('更新个人信息失败:', error);
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
      console.error('验证码登录失败:', error);
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
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码至少6位'
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
      console.error('修改密码失败:', error);
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
      console.error('绑定微信失败:', error);
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
      console.error('绑定手机号失败:', error);
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
      console.error('退出登录失败:', error);
      next(error);
    }
  }

  // 微信小程序登录
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
      // const wechatData = await wechatService.code2Session(code);
      // const { openid, session_key, unionid } = wechatData;

      // 临时方案：使用code作为openid（仅用于开发测试）
      const openid = `wx_${code}_${Date.now()}`;
      const unionid = null;

      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { openid }
      });

      if (!user) {
        // 首次微信登录，创建新用户
        user = await prisma.user.create({
          data: {
            openid,
            unionid,
            nickname: nickName || '微信用户',
            avatar: avatarUrl || '',
            gender: gender || 0,
            email: `${openid}@temp.ieclub.online`, // 临时邮箱，等待用户绑定
            password: '', // 微信登录无需密码
            lastLoginAt: new Date(),
            lastActiveAt: new Date()
          }
        });
      } else {
        // 已有用户，更新最后登录时间
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastActiveAt: new Date(),
            // 更新微信信息
            nickname: nickName || user.nickname,
            avatar: avatarUrl || user.avatar
          }
        });
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

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            openid: user.openid,
            nickname: user.nickname,
            avatar: user.avatar,
            email: user.email,
            level: user.level,
            isCertified: user.isCertified,
            needBindEmail: !user.email || user.email.endsWith('@temp.ieclub.online') // 是否需要绑定邮箱
          }
        }
      });
    } catch (error) {
      console.error('微信登录失败:', error);
      next(error);
    }
  }
}

module.exports = AuthController;