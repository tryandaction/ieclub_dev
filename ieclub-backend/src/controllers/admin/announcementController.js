// 公告管理Controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 获取公告列表
 * GET /api/admin/announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      priority,
      keyword,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 构建查询条件
    const where = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
      ];
    }

    // 查询数据
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.announcement.count({ where }),
    ]);

    // 解析JSON字段
    const parsedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      targetAudience: JSON.parse(announcement.targetAudience),
      images: announcement.images ? JSON.parse(announcement.images) : null,
    }));

    return res.json({
      code: 200,
      data: {
        list: parsedAnnouncements,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    console.error('获取公告列表失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取公告列表失败',
    });
  }
};

/**
 * 获取公告详情
 * GET /api/admin/announcements/:id
 */
exports.getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    if (!announcement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
      });
    }

    // 解析JSON字段
    announcement.targetAudience = JSON.parse(announcement.targetAudience);
    announcement.images = announcement.images ? JSON.parse(announcement.images) : null;

    return res.json({
      code: 200,
      data: announcement,
    });
  } catch (error) {
    console.error('获取公告详情失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取公告详情失败',
    });
  }
};

/**
 * 创建公告
 * POST /api/admin/announcements
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      displayType,
      targetAudience,
      richContent,
      summary,
      coverImage,
      images,
      publishAt,
      expireAt,
    } = req.body;

    // 验证必填字段
    if (!title || !content || !type) {
      return res.status(400).json({
        code: 400,
        message: '标题、内容和类型不能为空',
      });
    }

    // 创建公告
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        priority: priority || 'medium',
        status: publishAt ? 'draft' : 'published',
        displayType: displayType || 'notice',
        targetAudience: JSON.stringify(targetAudience || { type: 'all' }),
        richContent,
        summary,
        coverImage,
        images: images ? JSON.stringify(images) : null,
        publishAt: publishAt ? new Date(publishAt) : new Date(),
        expireAt: expireAt ? new Date(expireAt) : null,
        createdBy: req.admin.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'create',
        resourceType: 'announcement',
        resourceId: announcement.id,
        description: `创建公告: ${title}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'info',
      },
    });

    announcement.targetAudience = JSON.parse(announcement.targetAudience);
    announcement.images = announcement.images ? JSON.parse(announcement.images) : null;

    return res.json({
      code: 200,
      message: '公告创建成功',
      data: announcement,
    });
  } catch (error) {
    console.error('创建公告失败:', error);
    return res.status(500).json({
      code: 500,
      message: '创建公告失败',
    });
  }
};

/**
 * 更新公告
 * PUT /api/admin/announcements/:id
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      type,
      priority,
      status,
      displayType,
      targetAudience,
      richContent,
      summary,
      coverImage,
      images,
      publishAt,
      expireAt,
    } = req.body;

    // 检查公告是否存在
    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
      });
    }

    // 构建更新数据
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (displayType !== undefined) updateData.displayType = displayType;
    if (targetAudience !== undefined) updateData.targetAudience = JSON.stringify(targetAudience);
    if (richContent !== undefined) updateData.richContent = richContent;
    if (summary !== undefined) updateData.summary = summary;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (publishAt !== undefined) updateData.publishAt = new Date(publishAt);
    if (expireAt !== undefined) updateData.expireAt = expireAt ? new Date(expireAt) : null;

    // 更新公告
    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            realName: true,
          },
        },
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'update',
        resourceType: 'announcement',
        resourceId: id,
        description: `更新公告: ${announcement.title}`,
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

    announcement.targetAudience = JSON.parse(announcement.targetAudience);
    announcement.images = announcement.images ? JSON.parse(announcement.images) : null;

    return res.json({
      code: 200,
      message: '公告更新成功',
      data: announcement,
    });
  } catch (error) {
    console.error('更新公告失败:', error);
    return res.status(500).json({
      code: 500,
      message: '更新公告失败',
    });
  }
};

/**
 * 删除公告
 * DELETE /api/admin/announcements/:id
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查公告是否存在
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
      });
    }

    // 软删除：更新状态为deleted
    await prisma.announcement.update({
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
        resourceType: 'announcement',
        resourceId: id,
        description: `删除公告: ${announcement.title}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'DELETE',
        path: req.path,
        status: 'success',
        level: 'warning',
      },
    });

    return res.json({
      code: 200,
      message: '公告删除成功',
    });
  } catch (error) {
    console.error('删除公告失败:', error);
    return res.status(500).json({
      code: 500,
      message: '删除公告失败',
    });
  }
};

/**
 * 发布公告
 * POST /api/admin/announcements/:id/publish
 */
exports.publishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        status: 'published',
        publishAt: new Date(),
      },
    });

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'publish',
        resourceType: 'announcement',
        resourceId: id,
        description: `发布公告: ${announcement.title}`,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: 'POST',
        path: req.path,
        status: 'success',
        level: 'info',
      },
    });

    return res.json({
      code: 200,
      message: '公告发布成功',
      data: announcement,
    });
  } catch (error) {
    console.error('发布公告失败:', error);
    return res.status(500).json({
      code: 500,
      message: '发布公告失败',
    });
  }
};

/**
 * 获取公告统计
 * GET /api/admin/announcements/:id/stats
 */
exports.getAnnouncementStats = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        viewCount: true,
        clickCount: true,
        closeCount: true,
        targetAudience: true,
      },
    });

    if (!announcement) {
      return res.status(404).json({
        code: 404,
        message: '公告不存在',
      });
    }

    // 获取查看详情
    const views = await prisma.announcementView.findMany({
      where: { announcementId: id },
    });

    const targetAudience = JSON.parse(announcement.targetAudience);
    
    // 计算统计数据
    const stats = {
      ...announcement,
      targetAudience,
      uniqueViews: views.length,
      clickRate: announcement.viewCount > 0 
        ? ((announcement.clickCount / announcement.viewCount) * 100).toFixed(2) + '%'
        : '0%',
      closeRate: announcement.viewCount > 0
        ? ((announcement.closeCount / announcement.viewCount) * 100).toFixed(2) + '%'
        : '0%',
      viewsByDay: {}, // TODO: 按天统计
    };

    return res.json({
      code: 200,
      data: stats,
    });
  } catch (error) {
    console.error('获取公告统计失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取公告统计失败',
    });
  }
};

