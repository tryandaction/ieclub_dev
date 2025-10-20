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

// ===== 2. commentController.js - 评论控制器 =====
class CommentController {
  // 获取评论列表
  static async getComments(req, res, next) {
    try {
      const { topicId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: {
            topicId,
            status: 'published',
            parentId: null // 只获取顶级评论
          },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        prisma.comment.count({
          where: { topicId, status: 'published' }
        })
      ]);

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / take)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建评论
  static async createComment(req, res, next) {
    try {
      const userId = req.user.id;
      const { topicId, content, parentId, replyToUserId } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: '评论内容不能为空'
        });
      }

      // 创建评论
      const comment = await prisma.comment.create({
        data: {
          topicId,
          authorId: userId,
          content: content.trim(),
          parentId,
          rootId: parentId ? (await prisma.comment.findUnique({ where: { id: parentId } }))?.rootId || parentId : null,
          replyToUserId
        },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        }
      });

      // 更新话题评论数
      await prisma.topic.update({
        where: { id: topicId },
        data: { commentsCount: { increment: 1 } }
      });

      // TODO: 发送通知给话题作者和被回复者

      res.status(201).json({
        success: true,
        message: '评论成功',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  // 点赞评论
  static async likeComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: 'comment',
            targetId: id
          }
        }
      });

      if (existingLike) {
        // 取消点赞
        await prisma.$transaction([
          prisma.like.delete({ where: { id: existingLike.id } }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { decrement: 1 } }
          })
        ]);

        return res.json({
          success: true,
          message: '已取消点赞',
          data: { isLiked: false }
        });
      } else {
        // 添加点赞
        await prisma.$transaction([
          prisma.like.create({
            data: { userId, targetType: 'comment', targetId: id }
          }),
          prisma.comment.update({
            where: { id },
            data: { likesCount: { increment: 1 } }
          })
        ]);

        return res.json({
          success: true,
          message: '点赞成功',
          data: { isLiked: true }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // 删除评论
  static async deleteComment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const comment = await prisma.comment.findUnique({
        where: { id }
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: '评论不存在'
        });
      }

      if (comment.authorId !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权限删除此评论'
        });
      }

      // 软删除
      await prisma.comment.update({
        where: { id },
        data: { status: 'deleted' }
      });

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CommentController;

// ===== 3. routes/index.js - 路由配置（完整版）=====
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const topicController = require('../controllers/topicController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');

const { authenticate } = require('../middleware/auth');

// ===== 认证路由 =====
router.post('/auth/send-code', authController.sendVerifyCode);
router.post('/auth/verify-code', authController.verifyCode);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// ===== 话题路由 =====
router.get('/topics', topicController.getTopics);
router.get('/topics/:id', topicController.getTopicById);
router.post('/topics', authenticate, topicController.createTopic);
router.put('/topics/:id', authenticate, topicController.updateTopic);
router.delete('/topics/:id', authenticate, topicController.deleteTopic);
router.post('/topics/:id/like', authenticate, topicController.likeTopic);
router.post('/topics/:id/quick-action', authenticate, topicController.quickAction);

// ===== 评论路由 =====
router.get('/topics/:topicId/comments', commentController.getComments);
router.post('/comments', authenticate, commentController.createComment);
router.post('/comments/:id/like', authenticate, commentController.likeComment);
router.delete('/comments/:id', authenticate, commentController.deleteComment);

// ===== 用户路由 =====
router.get('/users/profile', authenticate, userController.getProfile);
router.put('/users/profile', authenticate, userController.updateProfile);

module.exports = router;

// ===== 4. .env 配置示例 =====
/*
DATABASE_URL="mysql://root:password@localhost:3306/ieclub"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000

# 邮件配置
EMAIL_USER="your-email@qq.com"
EMAIL_PASS="your-smtp-auth-code"

# 微信配置（可选）
WECHAT_APP_ID="your_wechat_app_id"
WECHAT_APP_SECRET="your_wechat_app_secret"
*/

// ===== 5. package.json 新增依赖 =====
/*
{
  "dependencies": {
    "@prisma/client": "^5.8.0",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "nodemailer": "^6.9.7",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
*/
