// controllers/profileController.js
// 个人主页控制器

const prisma = require('../config/database')
const { AppError } = require('../middleware/errorHandler')
const logger = require('../utils/logger')

/**
 * 获取用户公开主页
 * GET /api/profile/:userId
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user?.id
    
    // 查询用户详细信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        bio: true,
        coverImage: true,
        motto: true,
        introduction: true,
        website: true,
        github: true,
        bilibili: true,
        wechat: true,
        school: true,
        major: true,
        grade: true,
        level: true,
        credits: true,
        isCertified: true,
        skills: true,
        interests: true,
        achievements: true,
        projectsData: true,
        createdAt: true,
        _count: {
          select: {
            topics: { where: { status: 'published' } },
            followers: true,
            follows: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在',
        timestamp: Date.now()
      })
    }

    // 解析JSON字段
    const profile = {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      achievements: user.achievements ? JSON.parse(user.achievements) : [],
      projects: user.projectsData ? JSON.parse(user.projectsData) : [],
      topicsCount: user._count.topics,
      followerCount: user._count.followers,
      followingCount: user._count.follows,
      isOwner: currentUserId === userId
    }
    
    // 移除原始projectsData字段
    delete profile.projectsData

    // 移除_count字段
    delete profile._count

    // 禁用缓存，确保获取最新数据
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({
      success: true,
      code: 200,
      message: '获取用户主页成功',
      data: profile,
      timestamp: Date.now()
    })
  } catch (error) {
    console.log('Profile Error:', error.message, error.stack)
    res.status(500).json({
      success: false,
      code: 500,
      message: '服务器内部错误: ' + error.message,
      timestamp: Date.now()
    })
  }
}

/**
 * 获取用户主页的发布内容
 * GET /api/profile/:userId/posts
 */
exports.getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { 
      type, // 内容类型筛选
      page = 1,
      pageSize = 20
    } = req.query

    // 验证 userId 参数
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAM', message: '用户ID无效' }
      })
    }

    const where = {
      authorId: userId,
      status: 'collecting' // Topic使用collecting状态
    }

    if (type) {
      where.contentType = type // 使用contentType字段
    }

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          contentType: true,
          category: true,
          tags: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          bookmarksCount: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              level: true,
              isCertified: true
            }
          }
        }
      }),
      prisma.topic.count({ where })
    ]).catch(() => [[], 0])

    // 解析JSON字段
    const formattedPosts = topics.map(topic => ({
      ...topic,
      tags: topic.tags ? JSON.parse(topic.tags) : []
    }))

    res.json({
      success: true,
      message: '获取用户发布内容成功',
      data: {
        posts: formattedPosts,
        total,
        page: parseInt(page),
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    console.error('getUserPosts error:', error)
    next(error)
  }
}

/**
 * 编辑个人主页
 * PUT /api/profile
 * 完全重写版本 - 增强健壮性
 */
exports.updateProfile = async (req, res, next) => {
  const startTime = Date.now()
  
  // 🔥 立即返回调试信息，确认方法被调用
  if (req.query.debug === 'true') {
    return res.json({
      success: true,
      message: 'updateProfile方法已被调用',
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      bodyKeys: Object.keys(req.body || {})
    })
  }
  
  logger.info('\n========== PUT /api/profile 开始 ==========')
  logger.info('时间:', new Date().toISOString())
  logger.info('用户ID:', req.user?.id)
  logger.info('请求体:', JSON.stringify(req.body, null, 2))
  
  try {
    // 1. 验证用户
    if (!req.user || !req.user.id) {
      logger.error('❌ 用户验证失败: req.user未定义')
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '用户未登录' }
      })
    }

    const userId = req.user.id
    const requestBody = req.body || {}

    // 2. 验证用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true }
    })

    if (!existingUser) {
      logger.error('❌ 用户不存在:', userId)
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' }
      })
    }

    if (existingUser.status !== 'active') {
      logger.error('❌ 用户状态异常:', existingUser.status)
      return res.status(403).json({
        success: false,
        error: { code: 'USER_BANNED', message: '用户已被禁用' }
      })
    }

    // 3. 构建更新数据 - 只更新提供的字段
    const updateData = {}
    
    // 基础字符串字段
    const stringFields = ['nickname', 'avatar', 'bio', 'coverImage', 'motto', 
      'introduction', 'website', 'github', 'bilibili', 'wechat', 'school', 'major', 'grade']
    
    stringFields.forEach(field => {
      if (requestBody[field] !== undefined) {
        updateData[field] = requestBody[field] === null ? null : String(requestBody[field])
      }
    })

    // gender字段特殊处理
    if (requestBody.gender !== undefined) {
      const gender = parseInt(requestBody.gender)
      if ([0, 1, 2].includes(gender)) {
        updateData.gender = gender
      }
    }
    
    // 4. JSON字段处理 - 完全安全
    const jsonFields = [
      { input: 'skills', output: 'skills' },
      { input: 'interests', output: 'interests' },
      { input: 'achievements', output: 'achievements' },
      { input: 'projects', output: 'projectsData' }  // 注意：前端用projects，数据库用projectsData
    ]

    for (const { input, output } of jsonFields) {
      if (requestBody[input] !== undefined) {
        try {
          const value = requestBody[input]
          if (value === null) {
            updateData[output] = null
          } else if (Array.isArray(value)) {
            updateData[output] = JSON.stringify(value)
          } else if (typeof value === 'string') {
            // 如果已经是字符串，先解析验证，再序列化
            const parsed = JSON.parse(value)
            updateData[output] = JSON.stringify(Array.isArray(parsed) ? parsed : [])
          } else {
            updateData[output] = '[]'
          }
        } catch (jsonError) {
          logger.warn(`⚠️ ${input}字段JSON处理失败，使用空数组:`, jsonError.message)
          updateData[output] = '[]'
        }
      }
    }

    logger.info('✅ 更新数据构建完成:', JSON.stringify(updateData, null, 2))

    // 5. 如果没有要更新的数据
    if (Object.keys(updateData).length === 0) {
      logger.warn('⚠️ 没有要更新的数据')
      return res.json({
        success: true,
        message: '没有要更新的数据',
        data: await getUserProfile(userId)
      })
    }

    // 6. 执行数据库更新
    logger.info('📝 开始数据库更新...')
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        bio: true,
        coverImage: true,
        motto: true,
        introduction: true,
        website: true,
        github: true,
        bilibili: true,
        wechat: true,
        school: true,
        major: true,
        grade: true,
        skills: true,
        interests: true,
        achievements: true,
        projectsData: true,
        level: true,
        credits: true,
        isCertified: true
      }
    })

    logger.info('✅ 数据库更新成功')

    // 7. 安全解析JSON字段返回给前端
    const safeParseJSON = (str, defaultValue = []) => {
      if (!str) return defaultValue
      try {
        const parsed = JSON.parse(str)
        return Array.isArray(parsed) ? parsed : defaultValue
      } catch {
        return defaultValue
      }
    }

    const responseData = {
      ...updatedUser,
      skills: safeParseJSON(updatedUser.skills),
      interests: safeParseJSON(updatedUser.interests),
      achievements: safeParseJSON(updatedUser.achievements),
      projects: safeParseJSON(updatedUser.projectsData),
      projectsData: undefined  // 不返回原始字段
    }

    const duration = Date.now() - startTime
    logger.info(`✅ 请求成功完成 (耗时: ${duration}ms)`)
    logger.info('========== PUT /api/profile 结束 ==========\n')

    return res.json({
      success: true,
      message: '个人主页更新成功',
      data: responseData
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('\n========== ❌ PUT /api/profile 错误 ==========')
    logger.error('耗时:', duration + 'ms')
    logger.error('错误类型:', error.constructor.name)
    logger.error('错误信息:', error.message)
    logger.error('错误堆栈:', error.stack)
    logger.error('用户ID:', req.user?.id)
    logger.error('请求体:', JSON.stringify(req.body, null, 2))
    logger.error('==========================================\n')
    
    // 传递给全局错误处理器
    next(error)
  }
}

/**
 * 辅助函数：获取用户完整Profile
 */
async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nickname: true,
      avatar: true,
      gender: true,
      bio: true,
      coverImage: true,
      motto: true,
      introduction: true,
      website: true,
      github: true,
      bilibili: true,
      wechat: true,
      school: true,
      major: true,
      grade: true,
      skills: true,
      interests: true,
      achievements: true,
      projectsData: true,
      level: true,
      credits: true,
      isCertified: true
    }
  })

  const safeParseJSON = (str, defaultValue = []) => {
    if (!str) return defaultValue
    try {
      return JSON.parse(str)
    } catch {
      return defaultValue
    }
  }

  return {
    ...user,
    skills: safeParseJSON(user.skills),
    interests: safeParseJSON(user.interests),
    achievements: safeParseJSON(user.achievements),
    projects: safeParseJSON(user.projectsData)
  }
}

/**
 * 获取用户统计数据
 * GET /api/profile/:userId/stats
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params

    // 验证 userId 参数
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAM', message: '用户ID无效' }
      })
    }

    // 获取发布总数
    const totalPosts = await prisma.topic.count({
      where: {
        authorId: userId,
        status: 'collecting' // Topic使用collecting状态而不是published
      }
    }).catch(() => 0)

    // 获取总浏览量、点赞数、评论数
    const aggregates = await prisma.topic.aggregate({
      where: {
        authorId: userId,
        status: 'collecting'
      },
      _sum: {
        viewsCount: true,
        likesCount: true,
        commentsCount: true
      }
    }).catch(() => ({ _sum: { viewsCount: 0, likesCount: 0, commentsCount: 0 } }))

    // 获取最近活跃时间
    const recentTopic = await prisma.topic.findFirst({
      where: {
        authorId: userId,
        status: 'collecting'
      },
      orderBy: { createdAt: 'desc' },
      select: { lastActiveAt: true }
    }).catch(() => null)

    // 按类型统计（contentType字段）
    const postsByType = await prisma.topic.groupBy({
      by: ['contentType'],
      where: {
        authorId: userId,
        status: 'collecting'
      },
      _count: { _all: true }
    }).catch(() => [])

    const stats = {
      postsByType: postsByType.reduce((acc, item) => {
        acc[item.contentType] = item._count._all
        return acc
      }, {}),
      totalPosts,
      totalViews: aggregates._sum.viewsCount || 0,
      totalLikes: aggregates._sum.likesCount || 0,
      totalComments: aggregates._sum.commentsCount || 0,
      lastActiveAt: recentTopic?.lastActiveAt || null
    }

    res.json({
      success: true,
      message: '获取用户统计数据成功',
      data: stats
    })
  } catch (error) {
    console.error('getUserStats error:', error)
    next(error)
  }
}

/**
 * 获取用户关注列表
 * GET /api/profile/:userId/following
 */
exports.getUserFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take,
        include: {
          following: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              level: true,
              isCertified: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({ where: { followerId: userId } })
    ])

    const users = following.map(f => f.following)

    res.json({
      success: true,
      message: '获取关注列表成功',
      data: {
        users,
        total,
        page: parseInt(page),
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取用户粉丝列表
 * GET /api/profile/:userId/followers
 */
exports.getUserFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take,
        include: {
          follower: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              level: true,
              isCertified: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({ where: { followingId: userId } })
    ])

    const users = followers.map(f => f.follower)

    res.json({
      success: true,
      message: '获取粉丝列表成功',
      data: {
        users,
        total,
        page: parseInt(page),
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取用户收藏列表
 * GET /api/profile/:userId/favorites
 */
exports.getUserFavorites = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    // 只有本人可以查看自己的收藏
    if (req.user.id !== userId) {
      throw new AppError('无权查看他人的收藏', 403)
    }

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        skip,
        take,
        include: {
          topic: {
            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                  level: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.favorite.count({ where: { userId } })
    ])

    const topics = favorites.map(f => f.topic)

    res.json({
      success: true,
      message: '获取收藏列表成功',
      data: {
        topics,
        total,
        page: parseInt(page),
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取用户参与的活动
 * GET /api/profile/:userId/activities
 */
exports.getUserActivities = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { page = 1, pageSize = 20 } = req.query

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [activities, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where: { userId },
        skip,
        take,
        include: {
          activity: {
            include: {
              organizer: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.activityParticipant.count({ where: { userId } })
    ])

    const activityList = activities.map(a => ({
      ...a.activity,
      joinedAt: a.joinedAt,
      status: a.status
    }))

    res.json({
      success: true,
      message: '获取活动列表成功',
      data: {
        activities: activityList,
        total,
        page: parseInt(page),
        pageSize: take,
        totalPages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    next(error)
  }
}

