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

class AuthController {
  // 发送邮箱验证码
  static async sendVerifyCode(req, res, next) {
    try {
      const { email } = req.body;

      // 验证邮箱格式（南科大邮箱）
      const emailRegex = /^[a-zA-Z0-9._-]+@(mail\.)?sustech\.edu\.cn$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '请使用南科大邮箱'
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

      // 生成6位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 存储验证码（5分钟有效）
      verifyCodeStore.set(email, {
        code,
        expireAt: Date.now() + 5 * 60 * 1000
      });

      // 发送邮件
      await transporter.sendMail({
        from: `"IEClub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'IEClub 注册验证码',
        html: `
          <h2>欢迎注册IEClub</h2>
          <p>您的验证码是：<strong style="font-size: 24px; color: #3b82f6;">${code}</strong></p>
          <p>验证码5分钟内有效，请勿泄露给他人。</p>
          <p style="color: #999; font-size: 12px;">如非本人操作，请忽略此邮件。</p>
        `
      });

      res.json({
        success: true,
        message: '验证码已发送'
      });
    } catch (error) {
      console.error('发送验证码失败:', error);
      next(error);
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

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
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
            avatar: user.avatar
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;