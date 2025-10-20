// backend/src/controllers/authController.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const { validateEmail, validatePassword } = require('../utils/validators');

// 生成6位数字验证码
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 生成JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
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
    await prisma.verificationCode.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        attempts: 0
      },
      create: {
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
};

// 注册
exports.register = async (req, res) => {
  try {
    const { email, username, password, verificationCode } = req.body;

    // 验证必填字段
    if (!email || !username || !password || !verificationCode) {
      return res.status(400).json({
        code: 400,
        message: '请填写所有必填字段'
      });
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({
        code: 400,
        message: '邮箱格式不正确'
      });
    }

    // 验证密码强度
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        code: 400,
        message: passwordError
      });
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '用户名长度应在3-20个字符之间'
      });
    }

    // 验证用户名格式（只允许字母、数字、下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        code: 400,
        message: '用户名只能包含字母、数字和下划线'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({
        code: 400,
        message: '该邮箱已被注册'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({
        code: 400,
        message: '该用户名已被使用'
      });
    }

    // 验证验证码
    const verification = await prisma.verificationCode.findUnique({
      where: { email }
    });

    if (!verification) {
      return res.status(400).json({
        code: 400,
        message: '请先获取验证码'
      });
    }

    if (verification.code !== verificationCode) {
      // 增加尝试次数
      await prisma.verificationCode.update({
        where: { email },
        data: {
          attempts: verification.attempts + 1
        }
      });

      if (verification.attempts >= 4) {
        await prisma.verificationCode.delete({
          where: { email }
        });
        return res.status(400).json({
          code: 400,
          message: '验证码错误次数过多，请重新获取'
        });
      }

      return res.status(400).json({
        code: 400,
        message: `验证码错误，还可尝试 ${5 - verification.attempts - 1} 次`
      });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verificationCode.delete({
        where: { email }
      });
      return res.status(400).json({
        code: 400,
        message: '验证码已过期，请重新获取'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        verified: true,
        lastLogin: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        verified: true,
        createdAt: true
      }
    });

    // 删除验证码记录
    await prisma.verificationCode.delete({
      where: { email }
    });

    // 生成 Token
    const token = generateToken(user.id);

    // 记录登录日志
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      }
    });

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '注册失败，请稍后重试',
      error: error.message
    });
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { account, password } = req.body; // account 可以是邮箱或用户名

    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        message: '请输入账号和密码'
      });
    }

    // 查找用户（支持邮箱或用户名登录）
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: account },
          { username: account }
        ]
      }
    });

    if (!user) {
      // 记录失败的登录尝试
      await prisma.loginLog.create({
        data: {
          userId: null,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failed',
          reason: 'user_not_found'
        }
      });

      return res.status(401).json({
        code: 401,
        message: '账号或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // 记录失败的登录尝试
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          status: 'failed',
          reason: 'wrong_password'
        }
      });

      return res.status(401).json({
        code: 401,
        message: '账号或密码错误'
      });
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // 生成 Token
    const token = generateToken(user.id);

    // 记录成功的登录
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      }
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败，请稍后重试',
      error: error.message
    });
  }
};

// 忘记密码 - 第一步：验证邮箱
exports.forgotPassword = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        code: 400,
        message: '请输入邮箱和验证码'
      });
    }

    // 验证验证码
    const verification = await prisma.verificationCode.findUnique({
      where: { email }
    });

    if (!verification || verification.type !== 'reset') {
      return res.status(400).json({
        code: 400,
        message: '请先获取验证码'
      });
    }

    if (verification.code !== verificationCode) {
      await prisma.verificationCode.update({
        where: { email },
        data: { attempts: verification.attempts + 1 }
      });

      return res.status(400).json({
        code: 400,
        message: '验证码错误'
      });
    }

    if (new Date() > verification.expiresAt) {
      await prisma.verificationCode.delete({
        where: { email }
      });
      return res.status(400).json({
        code: 400,
        message: '验证码已过期'
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30分钟

    // 更新用户的重置令牌
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires
      }
    });

    // 删除验证码
    await prisma.verificationCode.delete({
      where: { email }
    });

    res.json({
      code: 200,
      message: '验证成功',
      data: {
        resetToken,
        expiresIn: 1800 // 30分钟
      }
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({
      code: 500,
      message: '验证失败',
      error: error.message
    });
  }
};

// 重置密码 - 第二步：设置新密码
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '请输入重置令牌和新密码'
      });
    }

    // 验证密码强度
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        code: 400,
        message: passwordError
      });
    }

    // 查找用户
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: '重置令牌无效或已过期'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // 更新密码并清除重置令牌
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    // 记录密码修改日志
    await prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      code: 200,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '重置密码失败',
      error: error.message
    });
  }
};

// 修改密码（需要登录）
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '请输入旧密码和新密码'
      });
    }

    // 验证新密码强度
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({
        code: 400,
        message: passwordError
      });
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '旧密码错误'
      });
    }

    // 检查新密码是否与旧密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        code: 400,
        message: '新密码不能与旧密码相同'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    // 更新密码
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    // 记录安全日志
    await prisma.securityLog.create({
      data: {
        userId: req.user.id,
        action: 'password_change',
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      code: 500,
      message: '修改密码失败',
      error: error.message
    });
  }
};

// 获取登录日志
exports.getLoginLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.loginLog.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json({
      code: 200,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取登录日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取登录日志失败',
      error: error.message
    });
  }
};

// 获取安全日志
exports.getSecurityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.securityLog.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json({
      code: 200,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取安全日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取安全日志失败',
      error: error.message
    });
  }
};