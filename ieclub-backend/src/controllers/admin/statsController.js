// 数据统计Controller
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 获取仪表盘数据
 * GET /api/admin/stats/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 并行查询所有统计数据
    const [
      totalUsers,
      totalPosts,
      totalTopics,
      totalComments,
      newUsersToday,
      newPostsToday,
      activeUsersWeek,
      pendingReports,
      activeBans,
    ] = await Promise.all([
      // 总用户数
      prisma.user.count({
        where: { status: { not: 'deleted' } },
      }),
      // 总帖子数
      prisma.post.count({
        where: { status: { not: 'deleted' } },
      }),
      // 总话题数
      prisma.topic.count(),
      // 总评论数
      prisma.comment.count({
        where: { status: 'published' },
      }),
      // 今日新增用户
      prisma.user.count({
        where: {
          createdAt: { gte: today },
          status: { not: 'deleted' },
        },
      }),
      // 今日新增帖子
      prisma.post.count({
        where: {
          createdAt: { gte: today },
          status: { not: 'deleted' },
        },
      }),
      // 7日活跃用户
      prisma.user.count({
        where: {
          lastActiveAt: { gte: weekAgo },
          status: 'active',
        },
      }),
      // 待处理举报
      prisma.report.count({
        where: { status: 'pending' },
      }),
      // 活跃封禁
      prisma.userBan.count({
        where: { status: 'active' },
      }),
    ]);

    // 获取用户增长趋势（近30天）
    const userGrowthData = await getUserGrowthTrend(30);

    // 获取帖子增长趋势（近30天）
    const postGrowthData = await getPostGrowthTrend(30);

    // 获取热门内容
    const [hotPosts, hotTopics] = await Promise.all([
      prisma.post.findMany({
        where: {
          status: 'published',
          createdAt: { gte: weekAgo },
        },
        orderBy: { hotScore: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          type: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.topic.findMany({
        where: {
          createdAt: { gte: weekAgo },
        },
        orderBy: { hotScore: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      code: 200,
      data: {
        overview: {
          totalUsers,
          totalPosts,
          totalTopics,
          totalComments,
          activeUsersWeek,
          todayNew: {
            users: newUsersToday,
            posts: newPostsToday,
          },
          pending: {
            reports: pendingReports,
          },
          activeBans,
        },
        userTrend: userGrowthData,
        contentTrend: postGrowthData,
        topContent: {
          posts: hotPosts,
          topics: hotTopics,
        },
      },
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取仪表盘数据失败',
    });
  }
};

/**
 * 获取用户统计数据
 * GET /api/admin/stats/users
 */
exports.getUserStats = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'day' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // 用户总数趋势
    const userGrowth = await getUserGrowthTrend(30, start, end);

    // 学校分布
    const schoolDistribution = await prisma.user.groupBy({
      by: ['school'],
      where: {
        school: { not: null },
        status: { not: 'deleted' },
      },
      _count: true,
      orderBy: {
        _count: {
          school: 'desc',
        },
      },
      take: 10,
    });

    // 用户等级分布
    const levelDistribution = await prisma.user.groupBy({
      by: ['level'],
      where: {
        status: { not: 'deleted' },
      },
      _count: true,
      orderBy: {
        level: 'asc',
      },
    });

    // 认证状态
    const verificationStatus = await prisma.user.groupBy({
      by: ['verified'],
      where: {
        status: { not: 'deleted' },
      },
      _count: true,
    });

    return res.json({
      code: 200,
      data: {
        growth: userGrowth,
        distribution: {
          bySchool: schoolDistribution.map(item => ({
            school: item.school,
            count: item._count,
          })),
          byLevel: levelDistribution.map(item => ({
            level: item.level,
            count: item._count,
          })),
          byVerification: verificationStatus.map(item => ({
            verified: item.verified,
            count: item._count,
          })),
        },
      },
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取用户统计失败',
    });
  }
};

/**
 * 获取内容统计数据
 * GET /api/admin/stats/content
 */
exports.getContentStats = async (req, res) => {
  try {
    // 帖子类型分布
    const postTypeDistribution = await prisma.post.groupBy({
      by: ['type'],
      where: {
        status: { not: 'deleted' },
      },
      _count: true,
    });

    // 话题类别分布
    const topicCategoryDistribution = await prisma.topic.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    // 评论统计
    const commentStats = {
      total: await prisma.comment.count({
        where: { status: 'published' },
      }),
      today: await prisma.comment.count({
        where: {
          status: 'published',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    };

    return res.json({
      code: 200,
      data: {
        posts: {
          byType: postTypeDistribution.map(item => ({
            type: item.type,
            count: item._count,
          })),
        },
        topics: {
          byCategory: topicCategoryDistribution.map(item => ({
            category: item.category,
            count: item._count,
          })),
        },
        comments: commentStats,
      },
    });
  } catch (error) {
    console.error('获取内容统计失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取内容统计失败',
    });
  }
};

/**
 * 获取互动统计数据
 * GET /api/admin/stats/engagement
 */
exports.getEngagementStats = async (req, res) => {
  try {
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    // 总互动数
    const [totalLikes, totalComments, totalBookmarks] = await Promise.all([
      prisma.like.count(),
      prisma.comment.count({ where: { status: 'published' } }),
      prisma.bookmark.count(),
    ]);

    // 今日新增
    const [likesToday, commentsToday, bookmarksToday] = await Promise.all([
      prisma.like.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.comment.count({
        where: {
          status: 'published',
          createdAt: { gte: today },
        },
      }),
      prisma.bookmark.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return res.json({
      code: 200,
      data: {
        total: {
          likes: totalLikes,
          comments: totalComments,
          bookmarks: totalBookmarks,
        },
        today: {
          likes: likesToday,
          comments: commentsToday,
          bookmarks: bookmarksToday,
        },
      },
    });
  } catch (error) {
    console.error('获取互动统计失败:', error);
    return res.status(500).json({
      code: 500,
      message: '获取互动统计失败',
    });
  }
};

/**
 * 导出数据
 * POST /api/admin/stats/export
 */
exports.exportData = async (req, res) => {
  try {
    const { type, format = 'csv', startDate, endDate } = req.body;

    // TODO: 实现数据导出功能
    // 这里应该生成CSV/Excel文件并返回下载链接

    // 记录审计日志
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin.id,
        action: 'export',
        resourceType: 'stats',
        description: `导出${type}数据`,
        details: JSON.stringify({ type, format, startDate, endDate }),
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
      message: '数据导出请求已提交',
      data: {
        // TODO: 返回下载链接
        downloadUrl: null,
      },
    });
  } catch (error) {
    console.error('导出数据失败:', error);
    return res.status(500).json({
      code: 500,
      message: '导出数据失败',
    });
  }
};

// 辅助函数：获取用户增长趋势
async function getUserGrowthTrend(days = 30, startDate, endDate) {
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const data = [];
  const current = new Date(start);

  while (current <= end) {
    const nextDay = new Date(current);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: current,
          lt: nextDay,
        },
        status: { not: 'deleted' },
      },
    });

    data.push({
      date: current.toISOString().split('T')[0],
      count,
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

// 辅助函数：获取帖子增长趋势
async function getPostGrowthTrend(days = 30, startDate, endDate) {
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const data = [];
  const current = new Date(start);

  while (current <= end) {
    const nextDay = new Date(current);
    nextDay.setDate(nextDay.getDate() + 1);

    const count = await prisma.post.count({
      where: {
        createdAt: {
          gte: current,
          lt: nextDay,
        },
        status: { not: 'deleted' },
      },
    });

    data.push({
      date: current.toISOString().split('T')[0],
      count,
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
}

