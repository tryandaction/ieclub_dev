// controllers/profileController.js
// 个人主页控制器

const prisma = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

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
        school: true,
        major: true,
        grade: true,
        level: true,
        credits: true,
        isCertified: true,
        skills: true,
        interests: true,
        achievements: true,
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
      topicsCount: user._count.topics,
      followerCount: user._count.followers,
      followingCount: user._count.follows,
      isOwner: currentUserId === userId
    }

    // 移除_count字段
    delete profile._count

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
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const {
      nickname,
      avatar,
      gender,
      bio,
      coverImage,
      motto,
      introduction,
      website,
      github,
      bilibili,
      wechat,
      school,
      major,
      grade,
      skills,
      interests,
      achievements,
      projects
    } = req.body

    // 构建更新数据
    const updateData = {}
    
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatar !== undefined) updateData.avatar = avatar
    if (gender !== undefined) updateData.gender = gender
    if (bio !== undefined) updateData.bio = bio
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (motto !== undefined) updateData.motto = motto
    if (introduction !== undefined) updateData.introduction = introduction
    if (website !== undefined) updateData.website = website
    if (github !== undefined) updateData.github = github
    if (bilibili !== undefined) updateData.bilibili = bilibili
    if (wechat !== undefined) updateData.wechat = wechat
    if (school !== undefined) updateData.school = school
    if (major !== undefined) updateData.major = major
    if (grade !== undefined) updateData.grade = grade
    
    // JSON 字段
    if (skills !== undefined) {
      updateData.skills = JSON.stringify(skills)
    }
    if (interests !== undefined) {
      updateData.interests = JSON.stringify(interests)
    }
    if (achievements !== undefined) {
      updateData.achievements = JSON.stringify(achievements)
    }
    if (projects !== undefined) {
      updateData.projects = JSON.stringify(projects)
    }

    const user = await prisma.user.update({
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

    // 解析 JSON 字段
    const profile = {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      achievements: user.achievements ? JSON.parse(user.achievements) : [],
      projects: user.projectsData ? JSON.parse(user.projectsData) : []
    }

    res.json({
      success: true,
      message: '个人主页更新成功',
      data: profile
    })
  } catch (error) {
    next(error)
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

