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

// 验证码存储（生产环境用Redis）
const verifyCodeStore = new Map();

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
      // const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

      // 保存验证码到内存存储（临时方案）
      verifyCodeStore.set(email, {
        code,
        expireAt: Date.now() + 10 * 60 * 1000,
        type
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

      const stored = verifyCodeStore.get(email);
      
      if (!stored) {
        return res.status(400).json({
          success: false,
          message: '验证码不存在或已过期'
        });
      }

      if (stored.expireAt < Date.now()) {
        verifyCodeStore.delete(email);
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
      const stored = verifyCodeStore.get(email);
      if (!stored || stored.code !== verifyCode || stored.expireAt < Date.now()) {
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
          avatar: `https://ui-avatars.com/api/?name=${nickname || 'User'}&background=667eea&color=fff`
        }
      });

      // 清除验证码
      verifyCodeStore.delete(email);

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
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
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
  async getProfile(req, res, next) {
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
          isVerified: true,
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
}

module.exports = AuthController;