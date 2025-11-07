// 用户管理Controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 获取用户列表
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      keyword,
      school,
      status,
      verified,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 构建查询条件
    const where = {};

    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    if (school) {
      where.school = { contains: school };
    }

    if (status) {
      where.status = status;
    }

    if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    // 查询数据
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          nickname: true,
          avatar: true,
          school: true,
          major: true,
          grade: true,
          verified: true,
          status: true,
          level: true,
          credits: true,
          topicsCount: true,
          commentsCount: true,
          likesCount: true,
          followsCount: true,
          fansCount: true,
          createdAt: true,
          lastLoginAt: true,
          lastActiveAt: true,
        },
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      code: 200,
      data: {
        list: users,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
    });
  }
};

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        topics: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            likesCount: true,
            commentsCount: true,
            createdAt: true,
          },
        },
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            likesCount: true,
            commentsCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    // 获取警告记录
    const warnings = await prisma.userWarning.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // 获取封禁记录
    const bans = await prisma.userBan.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // 获取举报记录（作为举报人和被举报人）
    const [reportsAsReporter, reportsAsTarget] = await Promise.all([
      prisma.report.count({
        where: { reporterId: id },
      }),
      prisma.report.count({
        where: {
          targetType: 'user',
          targetId: id,
        },
      }),
    ]);

    // 解析JSON字段
    const userData = {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      achievements: user.achievements ? JSON.parse(user.achievements) : [],
      projectsData: user.projectsData ? JSON.parse(user.projectsData) : [],
      warnings,
      bans,
      reportStats: {
        asReporter: reportsAsReporter,
        asTarget: reportsAsTarget,
      },
    };

    return res.json({
      code: 200,
      data: userData,
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取用户详情失败',
    });
  }
};

/**
 * 更新用户信息
 * PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, status, school, major, grade } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    const updateData = {};
    if (verified !== undefined) updateData.verified = verified;
    if (status !== undefined) updateData.status = status;
    if (school !== undefined) updateData.school = school;
    if (major !== undefined) updateData.major = major;
    if (grade !== undefined) updateData.grade = grade;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'update',
        resourceType: 'user',
        resourceId: id,
        description: `更新用户信息: ${user.nickname}`,
        details: JSON.stringify({
          before: existing,
          after: updateData,
        }),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'PUT',
        path: req.path,
        status: 'success',
        level: 'info',
      },
    });

    return res.json({
      code: 200,
      message: '用户信息更新成功',
      data: user,
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '更新用户信息失败',
    });
  }
};

/**
 * 警告用户
 * POST /api/admin/users/:id/warn
 */
exports.warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, content, level, relatedPostId, relatedTopicId } = req.body;

    if (!reason || !content || !level) {
      return res.status(400).json({
        code: 400,
        message: '警告原因、内容和级别不能为空',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    // 创建警告记录
    const warning = await prisma.userWarning.create({
      data: {
        userId: id,
        adminId: req.admin.id,
        reason,
        content,
        level,
        relatedPostId,
        relatedTopicId,
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // TODO: 发送通知给用户

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'warn',
        resourceType: 'user',
        resourceId: id,
        description: `警告用户: ${user.nickname} - ${reason}`,
        details: JSON.stringify(warning),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '警告已发送',
      data: warning,
    });
  } catch (error) {
    console.error('警告用户失败:', error);
    return res.status(500).json({
      code: 500,
      message: '警告用户失败',
    });
  }
};

/**
 * 封禁用户
 * POST /api/admin/users/:id/ban
 */
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration, notifyUser = true } = req.body;

    if (!reason) {
      return res.status(400).json({
        code: 400,
        message: '封禁原因不能为空',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    if (user.status === 'banned') {
      return res.status(400).json({
        code: 400,
        message: '用户已被封禁',
      });
    }

    // 计算过期时间
    const expireAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    // 创建封禁记录
    const ban = await prisma.userBan.create({
      data: {
        userId: id,
        adminId: req.admin.id,
        reason,
        duration,
        expireAt,
        status: 'active',
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // 更新用户状态
    await prisma.user.update({
      where: { id },
      data: {
        status: 'banned',
      },
    });

    // TODO: 如果notifyUser为true，发送通知

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'ban',
        resourceType: 'user',
        resourceId: id,
        description: `封禁用户: ${user.nickname} - ${reason}`,
        details: JSON.stringify(ban),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'critical',
      },
    });

    return res.json({
      code: 200,
      message: '用户已封禁',
      data: ban,
    });
  } catch (error) {
    console.error('封禁用户失败:', error);
    return res.status(500).json({
      code: 500,
      message: '封禁用户失败',
    });
  }
};

/**
 * 解封用户
 * POST /api/admin/users/:id/unban
 */
exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    if (user.status !== 'banned') {
      return res.status(400).json({
        code: 400,
        message: '用户未被封禁',
      });
    }

    // 查找活跃的封禁记录
    const activeBan = await prisma.userBan.findFirst({
      where: {
        userId: id,
        status: 'active',
      },
    });

    if (activeBan) {
      // 更新封禁记录
      await prisma.userBan.update({
        where: { id: activeBan.id },
        data: {
          status: 'lifted',
          liftedAt: new Date(),
          liftedBy: req.admin.id,
          liftReason: reason,
        },
      });
    }

    // 更新用户状态
    await prisma.user.update({
      where: { id },
      data: {
        status: 'active',
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'unban',
        resourceType: 'user',
        resourceId: id,
        description: `解封用户: ${user.nickname}`,
        details: JSON.stringify({ reason }),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '用户已解封',
    });
  } catch (error) {
    console.error('解封用户失败:', error);
    return res.status(500).json({
      code: 500,
      message: '解封用户失败',
    });
  }
};

/**
 * 删除用户（软删除）
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
      });
    }

    // 软删除：更新状态
    await prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'delete',
        resourceType: 'user',
        resourceId: id,
        description: `删除用户: ${user.nickname}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'DELETE',
        path: req.path,
        status: 'success',
        level: 'critical',
      },
    });

    return res.json({
      code: 200,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return res.status(500).json({
      code: 500,
      message: '删除用户失败',
    });
  }
};

module.exports = exports;

