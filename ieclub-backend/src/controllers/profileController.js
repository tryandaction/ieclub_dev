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

    // 验证 userId 参数
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new AppError('用户ID无效', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        gender: true,
        bio: true,
        
        // 个人主页信息
        coverImage: true,
        motto: true,
        introduction: true,
        website: true,
        github: true,
        bilibili: true,
        wechat: true,
        
        // 学校信息
        school: true,
        major: true,
        grade: true,
        verified: true,
        
        // 技能和兴趣
        skills: true,
        interests: true,
        
        // 个人成就
        achievements: true,
        projectsData: true,
        
        // 统计数据
        level: true,
        exp: true,
        credits: true,
        isCertified: true,
        
        // 计数器
        topicsCount: true,
        commentsCount: true,
        likesCount: true,
        fansCount: true,
        followsCount: true,
        
        createdAt: true
      }
    })

    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    // 检查是否已关注
    let isFollowing = false
    if (currentUserId && currentUserId !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId
          }
        }
      })
      isFollowing = !!follow
    }

    // 解析 JSON 字段
    const profile = {
      ...user,
      skills: user.skills ? JSON.parse(user.skills) : [],
      interests: user.interests ? JSON.parse(user.interests) : [],
      achievements: user.achievements ? JSON.parse(user.achievements) : [],
      projects: user.projectsData ? JSON.parse(user.projectsData) : [],
      isFollowing,
      isOwner: currentUserId === userId
    }

    res.json({
      success: true,
      message: '获取用户主页成功',
      data: profile
    })
  } catch (error) {
    next(error)
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
      throw new AppError('用户ID无效', 400)
    }

    const where = {
      authorId: userId,
      status: 'published'
    }

    if (type) {
      where.category = type // 使用category字段而不是type
    }

    // 如果不是本人查看，只显示公开内容
    if (req.user?.id !== userId) {
      where.isPublic = true // 使用isPublic字段
    }

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [posts, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
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
    ])

    // 解析 JSON 字段
    const formattedPosts = posts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      images: post.images ? JSON.parse(post.images) : [],
      videos: post.videos ? JSON.parse(post.videos) : [],
      documents: post.documents ? JSON.parse(post.documents) : [],
      skillsNeeded: post.skillsNeeded ? JSON.parse(post.skillsNeeded) : [],
      lookingFor: post.lookingFor ? JSON.parse(post.lookingFor) : []
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
      throw new AppError('用户ID无效', 400)
    }

    // 获取各类型发布数量
    const postStats = await prisma.topic.groupBy({
      by: ['category'],
      where: {
        authorId: userId,
        status: 'published'
      },
      _count: true
    })

    // 获取总浏览量、总点赞数
    const postAggregates = await prisma.topic.aggregate({
      where: {
        authorId: userId,
        status: 'published'
      },
      _sum: {
        viewCount: true,
        likeCount: true,
        commentCount: true
      }
    })

    // 获取最近活跃时间
    const recentPost = await prisma.topic.findFirst({
      where: {
        authorId: userId,
        status: 'published'
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })

    const stats = {
      postsByType: postStats.reduce((acc, item) => {
        acc[item.category || 'other'] = item._count
        return acc
      }, {}),
      totalPosts: postStats.reduce((sum, item) => sum + item._count, 0),
      totalViews: postAggregates._sum.viewCount || 0,
      totalLikes: postAggregates._sum.likeCount || 0,
      totalComments: postAggregates._sum.commentCount || 0,
      lastActiveAt: recentPost?.createdAt || null
    }

    res.json({
      success: true,
      message: '获取用户统计数据成功',
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

