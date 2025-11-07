// controllers/postController.js
// 发布系统控制器 - 支持5种类型：我想听、我来讲、分享、活动、项目

const prisma = require('../config/database')
const { AppError } = require('../middleware/errorHandler')
const axios = require('axios')
const cheerio = require('cheerio')

/**
 * 创建发布内容
 * POST /api/posts
 */
exports.createPost = async (req, res, next) => {
  try {
    const userId = req.user.id
    const postData = req.body

    // 验证必填字段
    if (!postData.type) {
      throw new AppError('请选择发布类型', 400)
    }

    if (!postData.title || !postData.content) {
      throw new AppError('标题和内容不能为空', 400)
    }

    // 验证类型
    const validTypes = ['want_hear', 'can_tell', 'share', 'activity', 'project']
    if (!validTypes.includes(postData.type)) {
      throw new AppError('无效的发布类型', 400)
    }

    // 根据类型验证特定字段
    if (postData.type === 'share' && !postData.linkUrl) {
      throw new AppError('分享内容需要提供链接', 400)
    }

    if (postData.type === 'activity' && (!postData.location || !postData.startTime)) {
      throw new AppError('活动需要提供地点和时间', 400)
    }

    // 准备数据
    const data = {
      type: postData.type,
      title: postData.title,
      content: postData.content,
      summary: postData.summary,
      cover: postData.cover,
      category: postData.category || '未分类',
      tags: postData.tags ? JSON.stringify(postData.tags) : null,
      visibility: postData.visibility || 'public',
      status: postData.status || 'published',
      authorId: userId
    }

    // 根据类型添加特定字段
    if (postData.type === 'want_hear' || postData.type === 'can_tell') {
      data.topic = postData.topic
      data.duration = postData.duration
      data.audience = postData.audience
      data.skillsNeeded = postData.skillsNeeded ? JSON.stringify(postData.skillsNeeded) : null
      data.threshold = postData.threshold || 15
      data.scheduledAt = postData.scheduledAt ? new Date(postData.scheduledAt) : null
    }

    if (postData.type === 'share') {
      data.linkType = postData.linkType
      data.linkUrl = postData.linkUrl
      data.linkTitle = postData.linkTitle
      data.linkDesc = postData.linkDesc
      data.linkImage = postData.linkImage
      data.linkAuthor = postData.linkAuthor
      data.linkSource = postData.linkSource
    }

    if (postData.type === 'activity') {
      data.location = postData.location
      data.startTime = new Date(postData.startTime)
      data.endTime = postData.endTime ? new Date(postData.endTime) : null
      data.maxParticipants = postData.maxParticipants
      data.registrationDeadline = postData.registrationDeadline ? new Date(postData.registrationDeadline) : null
    }

    if (postData.type === 'project') {
      data.projectStage = postData.projectStage
      data.teamSize = postData.teamSize
      data.lookingFor = postData.lookingFor ? JSON.stringify(postData.lookingFor) : null
      data.github = postData.github
      data.website = postData.website
      data.demo = postData.demo
    }

    // 媒体文件
    data.images = postData.images ? JSON.stringify(postData.images) : null
    data.videos = postData.videos ? JSON.stringify(postData.videos) : null
    data.documents = postData.documents ? JSON.stringify(postData.documents) : null

    // 发布时间
    if (data.status === 'published') {
      data.publishedAt = new Date()
    }

    // 创建发布内容
    const post = await prisma.post.create({
      data,
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
    })

    // 更新用户发布计数
    await prisma.user.update({
      where: { id: userId },
      data: {
        topicsCount: { increment: 1 }
      }
    })

    // 格式化输出
    const formattedPost = formatPost(post)

    res.status(201).json({
      success: true,
      message: '发布成功',
      data: formattedPost
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 获取发布列表
 * GET /api/posts
 */
exports.getPosts = async (req, res, next) => {
  try {
    const {
      type, // 类型筛选
      category, // 分类筛选
      sort = 'latest', // 排序：latest, hot, trending
      page = 1,
      pageSize = 20
    } = req.query

    const where = {
      status: 'published',
      visibility: 'public'
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    // 排序
    let orderBy
    switch (sort) {
      case 'hot':
        orderBy = [{ hotScore: 'desc' }, { createdAt: 'desc' }]
        break
      case 'trending':
        orderBy = [{ trendingScore: 'desc' }, { createdAt: 'desc' }]
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take,
        orderBy,
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
      prisma.post.count({ where })
    ])

    // 格式化输出
    const formattedPosts = posts.map(formatPost)

    res.json({
      success: true,
      message: '获取发布列表成功',
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
 * 获取发布详情
 * GET /api/posts/:id
 */
exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true,
            level: true,
            isCertified: true,
            fansCount: true,
            topicsCount: true
          }
        }
      }
    })

    if (!post) {
      throw new AppError('内容不存在', 404)
    }

    // 检查权限
    if (post.status !== 'published' && post.authorId !== userId) {
      throw new AppError('无权查看此内容', 403)
    }

    if (post.visibility === 'private' && post.authorId !== userId) {
      throw new AppError('无权查看此内容', 403)
    }

    // 增加浏览量
    await prisma.post.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 }
      }
    })

    // 格式化输出
    const formattedPost = formatPost({
      ...post,
      viewsCount: post.viewsCount + 1
    })

    res.json({
      success: true,
      message: '获取详情成功',
      data: formattedPost
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 更新发布内容
 * PUT /api/posts/:id
 */
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const updateData = req.body

    // 查找发布内容
    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      throw new AppError('内容不存在', 404)
    }

    // 权限检查
    if (post.authorId !== userId) {
      throw new AppError('无权编辑此内容', 403)
    }

    // 准备更新数据
    const data = {}
    
    if (updateData.title !== undefined) data.title = updateData.title
    if (updateData.content !== undefined) data.content = updateData.content
    if (updateData.summary !== undefined) data.summary = updateData.summary
    if (updateData.cover !== undefined) data.cover = updateData.cover
    if (updateData.category !== undefined) data.category = updateData.category
    if (updateData.tags !== undefined) data.tags = JSON.stringify(updateData.tags)
    if (updateData.visibility !== undefined) data.visibility = updateData.visibility
    if (updateData.status !== undefined) data.status = updateData.status

    // 根据类型更新特定字段
    if (post.type === 'want_hear' || post.type === 'can_tell') {
      if (updateData.topic !== undefined) data.topic = updateData.topic
      if (updateData.duration !== undefined) data.duration = updateData.duration
      if (updateData.audience !== undefined) data.audience = updateData.audience
      if (updateData.skillsNeeded !== undefined) data.skillsNeeded = JSON.stringify(updateData.skillsNeeded)
      if (updateData.threshold !== undefined) data.threshold = updateData.threshold
      if (updateData.scheduledAt !== undefined) data.scheduledAt = new Date(updateData.scheduledAt)
    }

    if (post.type === 'share') {
      if (updateData.linkType !== undefined) data.linkType = updateData.linkType
      if (updateData.linkUrl !== undefined) data.linkUrl = updateData.linkUrl
      if (updateData.linkTitle !== undefined) data.linkTitle = updateData.linkTitle
      if (updateData.linkDesc !== undefined) data.linkDesc = updateData.linkDesc
      if (updateData.linkImage !== undefined) data.linkImage = updateData.linkImage
      if (updateData.linkAuthor !== undefined) data.linkAuthor = updateData.linkAuthor
      if (updateData.linkSource !== undefined) data.linkSource = updateData.linkSource
    }

    if (post.type === 'activity') {
      if (updateData.location !== undefined) data.location = updateData.location
      if (updateData.startTime !== undefined) data.startTime = new Date(updateData.startTime)
      if (updateData.endTime !== undefined) data.endTime = updateData.endTime ? new Date(updateData.endTime) : null
      if (updateData.maxParticipants !== undefined) data.maxParticipants = updateData.maxParticipants
      if (updateData.registrationDeadline !== undefined) data.registrationDeadline = updateData.registrationDeadline ? new Date(updateData.registrationDeadline) : null
    }

    if (post.type === 'project') {
      if (updateData.projectStage !== undefined) data.projectStage = updateData.projectStage
      if (updateData.teamSize !== undefined) data.teamSize = updateData.teamSize
      if (updateData.lookingFor !== undefined) data.lookingFor = JSON.stringify(updateData.lookingFor)
      if (updateData.github !== undefined) data.github = updateData.github
      if (updateData.website !== undefined) data.website = updateData.website
      if (updateData.demo !== undefined) data.demo = updateData.demo
    }

    // 媒体文件
    if (updateData.images !== undefined) data.images = JSON.stringify(updateData.images)
    if (updateData.videos !== undefined) data.videos = JSON.stringify(updateData.videos)
    if (updateData.documents !== undefined) data.documents = JSON.stringify(updateData.documents)

    // 更新发布时间
    if (updateData.status === 'published' && post.status !== 'published') {
      data.publishedAt = new Date()
    }

    // 更新
    const updatedPost = await prisma.post.update({
      where: { id },
      data,
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
    })

    res.json({
      success: true,
      message: '更新成功',
      data: formatPost(updatedPost)
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 删除发布内容
 * DELETE /api/posts/:id
 */
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const post = await prisma.post.findUnique({
      where: { id }
    })

    if (!post) {
      throw new AppError('内容不存在', 404)
    }

    // 权限检查
    if (post.authorId !== userId) {
      throw new AppError('无权删除此内容', 403)
    }

    // 软删除
    await prisma.post.update({
      where: { id },
      data: {
        status: 'deleted'
      }
    })

    // 更新用户发布计数
    if (post.status === 'published') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          topicsCount: { decrement: 1 }
        }
      })
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 解析外链信息（Open Graph）
 * POST /api/posts/parse-link
 */
exports.parseLink = async (req, res, next) => {
  try {
    const { url } = req.body

    if (!url) {
      throw new AppError('请提供链接地址', 400)
    }

    // 检测链接类型
    const linkType = detectLinkType(url)

    let linkInfo = {
      type: linkType,
      url: url,
      title: '',
      description: '',
      image: '',
      author: '',
      source: ''
    }

    try {
      // 获取页面内容
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)

      // 解析 Open Graph 标签
      linkInfo.title = 
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('title').text() ||
        ''

      linkInfo.description = 
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        ''

      linkInfo.image = 
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        ''

      linkInfo.author = 
        $('meta[property="og:author"]').attr('content') ||
        $('meta[name="author"]').attr('content') ||
        ''

      linkInfo.source = 
        $('meta[property="og:site_name"]').attr('content') ||
        new URL(url).hostname ||
        ''

      // 特殊处理不同平台
      if (linkType === 'bilibili') {
        linkInfo.author = $('.up-name').text().trim() || linkInfo.author
        linkInfo.source = 'Bilibili'
      } else if (linkType === 'zhihu') {
        linkInfo.source = '知乎'
      } else if (linkType === 'wechat') {
        linkInfo.source = '微信公众号'
      } else if (linkType === 'github') {
        linkInfo.source = 'GitHub'
      }

    } catch (error) {
      console.log('解析链接失败:', error.message)
      // 解析失败时返回基本信息
      linkInfo.title = url
      linkInfo.source = new URL(url).hostname
    }

    res.json({
      success: true,
      message: '解析链接成功',
      data: linkInfo
    })
  } catch (error) {
    next(error)
  }
}

/**
 * 检测链接类型
 */
function detectLinkType(url) {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('bilibili.com') || urlLower.includes('b23.tv')) {
    return 'bilibili'
  }
  if (urlLower.includes('zhihu.com')) {
    return 'zhihu'
  }
  if (urlLower.includes('weixin.qq.com') || urlLower.includes('mp.weixin.qq.com')) {
    return 'wechat'
  }
  if (urlLower.includes('github.com')) {
    return 'github'
  }
  if (urlLower.includes('juejin.cn')) {
    return 'juejin'
  }
  if (urlLower.includes('csdn.net')) {
    return 'csdn'
  }
  
  return 'article'
}

/**
 * 格式化发布内容
 */
function formatPost(post) {
  return {
    ...post,
    tags: post.tags ? JSON.parse(post.tags) : [],
    images: post.images ? JSON.parse(post.images) : [],
    videos: post.videos ? JSON.parse(post.videos) : [],
    documents: post.documents ? JSON.parse(post.documents) : [],
    skillsNeeded: post.skillsNeeded ? JSON.parse(post.skillsNeeded) : [],
    lookingFor: post.lookingFor ? JSON.parse(post.lookingFor) : []
  }
}

module.exports = exports
