// backend/src/controllers/userController.js
const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { validateEmail, validateUsername } = require('../utils/validators');

// 获取用户详细信息
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sortBy = 'latest', // latest, likes, hearts, popular
      filterType = 'all', // all, topics, projects, comments
      major, // 专业筛选
      skills, // 技能筛选
      interests // 兴趣筛选
    } = req.query;

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        verified: true,
        major: true,
        grade: true,
        skills: true,
        interests: true,
        website: true,
        github: true,
        createdAt: true,
        _count: {
          select: {
            topics: true,
            followers: true,
            following: true,
            ownedProjects: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 检查当前用户是否关注了该用户
    let isFollowing = false;
    if (req.user && req.user.id !== id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: id
          }
        }
      });
      isFollowing = !!follow;
    }

    // 构建内容查询条件
    let contentData = {};

    // 获取用户话题（支持排序和筛选）
    if (filterType === 'all' || filterType === 'topics') {
      const topicOrderBy = 
        sortBy === 'latest' ? { createdAt: 'desc' } :
        sortBy === 'likes' ? [{ likes: { _count: 'desc' } }] :
        sortBy === 'hearts' ? [{ bookmarks: { _count: 'desc' } }] :
        sortBy === 'popular' ? { viewCount: 'desc' } :
        { createdAt: 'desc' };

      const topics = await prisma.topic.findMany({
        where: {
          authorId: id,
          status: 'published'
        },
        include: {
          _count: {
            select: {
              likes: true,
              bookmarks: true,
              comments: true,
              participants: true
            }
          }
        },
        orderBy: topicOrderBy,
        take: 20
      });

      contentData.topics = topics.map(topic => ({
        ...topic,
        likeCount: topic._count.likes,
        heartCount: topic._count.bookmarks,
        commentCount: topic._count.comments,
        participantCount: topic._count.participants
      }));
    }

    // 获取用户项目
    if (filterType === 'all' || filterType === 'projects') {
      const projectOrderBy = 
        sortBy === 'latest' ? { createdAt: 'desc' } :
        sortBy === 'likes' ? [{ likes: { _count: 'desc' } }] :
        { createdAt: 'desc' };

      const projects = await prisma.project.findMany({
        where: { ownerId: id },
        include: {
          _count: {
            select: {
              members: true,
              likes: true
            }
          }
        },
        orderBy: projectOrderBy,
        take: 20
      });

      contentData.projects = projects.map(project => ({
        ...project,
        memberCount: project._count.members,
        likeCount: project._count.likes
      }));
    }

    // 获取用户评论
    if (filterType === 'all' || filterType === 'comments') {
      const comments = await prisma.comment.findMany({
        where: { authorId: id },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              cover: true
            }
          },
          _count: {
            select: {
              likes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      contentData.comments = comments.map(comment => ({
        ...comment,
        likeCount: comment._count.likes
      }));
    }

    res.json({
      code: 200,
      data: {
        user: {
          ...user,
          topicCount: user._count.topics,
          followerCount: user._count.followers,
          followingCount: user._count.following,
          projectCount: user._count.ownedProjects
        },
        isFollowing,
        content: contentData
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

// 更新用户信息
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // 验证权限
    if (req.user.id !== id) {
      return res.status(403).json({
        code: 403,
        message: '无权修改他人信息'
      });
    }

    const {
      nickname,
      bio,
      avatar,
      major,
      grade,
      skills,
      interests,
      website,
      github
    } = req.body;

    // 验证昵称长度
    if (nickname && (nickname.length < 2 || nickname.length > 30)) {
      return res.status(400).json({
        code: 400,
        message: '昵称长度应在2-30个字符之间'
      });
    }

    // 验证个人简介长度
    if (bio && bio.length > 500) {
      return res.status(400).json({
        code: 400,
        message: '个人简介不能超过500个字符'
      });
    }

    // 验证技能数量
    if (skills && skills.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '技能标签最多20个'
      });
    }

    // 验证兴趣数量
    if (interests && interests.length > 20) {
      return res.status(400).json({
        code: 400,
        message: '兴趣标签最多20个'
      });
    }

    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (major !== undefined) updateData.major = major;
    if (grade !== undefined) updateData.grade = grade;
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (website !== undefined) updateData.website = website;
    if (github !== undefined) updateData.github = github;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        major: true,
        grade: true,
        skills: true,
        interests: true,
        website: true,
        github: true,
        verified: true
      }
    });

    res.json({
      code: 200,
      message: '信息更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户信息失败',
      error: error.message
    });
  }
};

// 关注用户
exports.followUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({
        code: 400,
        message: '不能关注自己'
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.id,
          followingId: id
        }
      }
    });

    if (existingFollow) {
      // 取消关注
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: id
          }
        }
      });

      res.json({
        code: 200,
        message: '已取消关注',
        data: { isFollowing: false }
      });
    } else {
      // 关注
      await prisma.follow.create({
        data: {
          followerId: req.user.id,
          followingId: id
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: id,
          type: 'follow',
          content: `${req.user.nickname || req.user.username} 关注了你`,
          relatedId: req.user.id
        }
      });

      res.json({
        code: 200,
        message: '关注成功',
        data: { isFollowing: true }
      });
    }
  } catch (error) {
    console.error('关注操作失败:', error);
    res.status(500).json({
      code: 500,
      message: '关注操作失败',
      error: error.message
    });
  }
};

// 获取关注列表
exports.getFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: id },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              bio: true,
              verified: true,
              _count: {
                select: {
                  followers: true,
                  topics: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({
        where: { followerId: id }
      })
    ]);

    res.json({
      code: 200,
      data: following.map(f => ({
        ...f.following,
        followerCount: f.following._count.followers,
        topicCount: f.following._count.topics
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取关注列表失败',
      error: error.message
    });
  }
};

// 获取粉丝列表
exports.getFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: id },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
              bio: true,
              verified: true,
              _count: {
                select: {
                  followers: true,
                  topics: true
                }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.follow.count({
        where: { followingId: id }
      })
    ]);

    res.json({
      code: 200,
      data: followers.map(f => ({
        ...f.follower,
        followerCount: f.follower._count.followers,
        topicCount: f.follower._count.topics
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取粉丝列表失败',
      error: error.message
    });
  }
};

// 点赞用户（给用户主页点赞）
exports.likeUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({
        code: 400,
        message: '不能给自己点赞'
      });
    }

    const existingLike = await prisma.userLike.findUnique({
      where: {
        userId_likedUserId: {
          userId: req.user.id,
          likedUserId: id
        }
      }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.userLike.delete({
        where: {
          userId_likedUserId: {
            userId: req.user.id,
            likedUserId: id
          }
        }
      });

      res.json({
        code: 200,
        message: '已取消点赞',
        data: { isLiked: false }
      });
    } else {
      // 点赞
      await prisma.userLike.create({
        data: {
          userId: req.user.id,
          likedUserId: id
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: id,
          type: 'like',
          content: `${req.user.nickname || req.user.username} 赞了你`,
          relatedId: req.user.id
        }
      });

      res.json({
        code: 200,
        message: '点赞成功',
        data: { isLiked: true }
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      code: 500,
      message: '点赞操作失败',
      error: error.message
    });
  }
};

// 收藏用户（红心）
exports.heartUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({
        code: 400,
        message: '不能收藏自己'
      });
    }

    const existingHeart = await prisma.userHeart.findUnique({
      where: {
        userId_heartedUserId: {
          userId: req.user.id,
          heartedUserId: id
        }
      }
    });

    if (existingHeart) {
      // 取消收藏
      await prisma.userHeart.delete({
        where: {
          userId_heartedUserId: {
            userId: req.user.id,
            heartedUserId: id
          }
        }
      });

      res.json({
        code: 200,
        message: '已取消收藏',
        data: { isHearted: false }
      });
    } else {
      // 收藏
      await prisma.userHeart.create({
        data: {
          userId: req.user.id,
          heartedUserId: id
        }
      });

      // 创建通知
      await prisma.notification.create({
        data: {
          userId: id,
          type: 'heart',
          content: `${req.user.nickname || req.user.username} 收藏了你`,
          relatedId: req.user.id
        }
      });

      res.json({
        code: 200,
        message: '收藏成功',
        data: { isHearted: true }
      });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({
      code: 500,
      message: '收藏操作失败',
      error: error.message
    });
  }
};

// 高级搜索用户
exports.searchUsers = async (req, res) => {
  try {
    const {
      keyword,
      major,
      grade,
      skills,
      interests,
      sortBy = 'relevance', // relevance, followers, topics, latest
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 构建查询条件
    const where = {};

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { nickname: { contains: keyword } },
        { bio: { contains: keyword } }
      ];
    }

    if (major) {
      where.major = major;
    }

    if (grade) {
      where.grade = grade;
    }

    if (skills) {
      where.skills = {
        hasSome: Array.isArray(skills) ? skills : [skills]
      };
    }

    if (interests) {
      where.interests = {
        hasSome: Array.isArray(interests) ? interests : [interests]
      };
    }

    // 排序
    const orderBy = 
      sortBy === 'followers' ? [{ followers: { _count: 'desc' } }] :
      sortBy === 'topics' ? [{ topics: { _count: 'desc' } }] :
      sortBy === 'latest' ? { createdAt: 'desc' } :
      { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
          verified: true,
          major: true,
          grade: true,
          skills: true,
          interests: true,
          _count: {
            select: {
              topics: true,
              followers: true,
              ownedProjects: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      code: 200,
      data: users.map(user => ({
        ...user,
        topicCount: user._count.topics,
        followerCount: user._count.followers,
        projectCount: user._count.ownedProjects
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '搜索用户失败',
      error: error.message
    });
  }
};