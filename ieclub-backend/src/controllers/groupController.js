// 小组/圈子控制器
const prisma = require('../config/database');
const { success, error } = require('../utils/response');

/**
 * 获取小组列表
 */
async function getGroups(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      category,
      keyword,
      sortBy = 'membersCount', // membersCount, createdAt
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // 构建查询条件
    const where = {
      status: 'active',
      isPublic: true
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } }
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          _count: {
            select: {
              members: true,
              topics: true
            }
          }
        }
      }),
      prisma.group.count({ where })
    ]);

    // 如果用户已登录，检查是否已加入
    const userId = req.user?.id;
    let membershipMap = {};
    
    if (userId && groups.length > 0) {
      const memberships = await prisma.groupMember.findMany({
        where: {
          userId,
          groupId: { in: groups.map(g => g.id) }
        },
        select: { groupId: true, role: true }
      });
      membershipMap = memberships.reduce((acc, m) => {
        acc[m.groupId] = m.role;
        return acc;
      }, {});
    }

    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      cover: group.cover,
      category: group.category,
      tags: group.tags ? JSON.parse(group.tags) : [],
      isPublic: group.isPublic,
      needApproval: group.needApproval,
      maxMembers: group.maxMembers,
      membersCount: group._count.members,
      topicsCount: group._count.topics,
      creator: group.creator,
      createdAt: group.createdAt,
      isJoined: !!membershipMap[group.id],
      myRole: membershipMap[group.id] || null
    }));

    return success(res, {
      list: formattedGroups,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('获取小组列表失败:', err);
    return error(res, '获取小组列表失败');
  }
}

/**
 * 获取我的小组
 */
async function getMyGroups(req, res) {
  try {
    const userId = req.user.id;
    const { role } = req.query; // owner, admin, member, all

    const where = { userId };
    if (role && role !== 'all') {
      where.role = role;
    }

    const memberships = await prisma.groupMember.findMany({
      where,
      include: {
        group: {
          include: {
            creator: {
              select: { id: true, nickname: true, avatar: true }
            },
            _count: {
              select: { members: true, topics: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const groups = memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      avatar: m.group.avatar,
      category: m.group.category,
      membersCount: m.group._count.members,
      topicsCount: m.group._count.topics,
      creator: m.group.creator,
      myRole: m.role,
      joinedAt: m.joinedAt
    }));

    return success(res, groups);
  } catch (err) {
    console.error('获取我的小组失败:', err);
    return error(res, '获取我的小组失败');
  }
}

/**
 * 获取小组详情
 */
async function getGroupDetail(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        },
        members: {
          where: { status: 'active' },
          take: 10,
          orderBy: { role: 'asc' },
          include: {
            user: {
              select: { id: true, nickname: true, avatar: true }
            }
          }
        },
        _count: {
          select: { members: true, topics: true, activities: true }
        }
      }
    });

    if (!group) {
      return error(res, '小组不存在', 404);
    }

    // 检查用户是否已加入
    let myMembership = null;
    let pendingRequest = null;
    
    if (userId) {
      myMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId } }
      });
      
      if (!myMembership) {
        pendingRequest = await prisma.groupJoinRequest.findUnique({
          where: { groupId_userId: { groupId: id, userId } }
        });
      }
    }

    return success(res, {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      cover: group.cover,
      category: group.category,
      tags: group.tags ? JSON.parse(group.tags) : [],
      isPublic: group.isPublic,
      needApproval: group.needApproval,
      maxMembers: group.maxMembers,
      membersCount: group._count.members,
      topicsCount: group._count.topics,
      activitiesCount: group._count.activities,
      creator: group.creator,
      createdAt: group.createdAt,
      recentMembers: group.members.map(m => ({
        ...m.user,
        role: m.role
      })),
      isJoined: !!myMembership,
      myRole: myMembership?.role || null,
      hasPendingRequest: !!pendingRequest
    });
  } catch (err) {
    console.error('获取小组详情失败:', err);
    return error(res, '获取小组详情失败');
  }
}

/**
 * 创建小组
 */
async function createGroup(req, res) {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      avatar,
      cover,
      category = 'general',
      tags = [],
      isPublic = true,
      needApproval = false,
      maxMembers = 200
    } = req.body;

    if (!name || name.trim().length < 2) {
      return error(res, '小组名称至少2个字符', 400);
    }

    // 检查名称是否已存在
    const existing = await prisma.group.findFirst({
      where: { name: name.trim() }
    });
    if (existing) {
      return error(res, '小组名称已存在', 400);
    }

    // 创建小组并添加创建者为成员
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description,
        avatar,
        cover,
        category,
        tags: JSON.stringify(tags),
        isPublic,
        needApproval,
        maxMembers,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'owner'
          }
        }
      },
      include: {
        creator: {
          select: { id: true, nickname: true, avatar: true }
        }
      }
    });

    return success(res, {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      category: group.category,
      creator: group.creator,
      createdAt: group.createdAt
    }, '创建成功');
  } catch (err) {
    console.error('创建小组失败:', err);
    return error(res, '创建小组失败');
  }
}

/**
 * 更新小组信息
 */
async function updateGroup(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // 检查权限（只有 owner 或 admin 可以修改）
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return error(res, '没有权限修改小组信息', 403);
    }

    // 过滤允许更新的字段
    const allowedFields = ['name', 'description', 'avatar', 'cover', 'category', 'tags', 'isPublic', 'needApproval', 'maxMembers'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'tags') {
          updateData[field] = JSON.stringify(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    const group = await prisma.group.update({
      where: { id },
      data: updateData
    });

    return success(res, group, '更新成功');
  } catch (err) {
    console.error('更新小组失败:', err);
    return error(res, '更新小组失败');
  }
}

/**
 * 加入小组
 */
async function joinGroup(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const group = await prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } }
    });

    if (!group) {
      return error(res, '小组不存在', 404);
    }

    if (group.status !== 'active') {
      return error(res, '小组已关闭', 400);
    }

    // 检查是否已是成员
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });
    if (existingMember) {
      return error(res, '您已是小组成员', 400);
    }

    // 检查人数限制
    if (group.maxMembers > 0 && group._count.members >= group.maxMembers) {
      return error(res, '小组人数已满', 400);
    }

    // 需要审批
    if (group.needApproval) {
      // 检查是否已有待处理申请
      const existingRequest = await prisma.groupJoinRequest.findUnique({
        where: { groupId_userId: { groupId: id, userId } }
      });
      
      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return error(res, '您已提交申请，请等待审核', 400);
        }
        // 更新已有申请
        await prisma.groupJoinRequest.update({
          where: { id: existingRequest.id },
          data: { reason, status: 'pending', handledAt: null }
        });
      } else {
        await prisma.groupJoinRequest.create({
          data: { groupId: id, userId, reason }
        });
      }
      
      return success(res, null, '申请已提交，请等待审核');
    }

    // 直接加入
    await prisma.$transaction([
      prisma.groupMember.create({
        data: { groupId: id, userId, role: 'member' }
      }),
      prisma.group.update({
        where: { id },
        data: { membersCount: { increment: 1 } }
      })
    ]);

    return success(res, null, '加入成功');
  } catch (err) {
    console.error('加入小组失败:', err);
    return error(res, '加入小组失败');
  }
}

/**
 * 退出小组
 */
async function leaveGroup(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!membership) {
      return error(res, '您不是小组成员', 400);
    }

    if (membership.role === 'owner') {
      return error(res, '创建者不能退出小组，请先转让或解散小组', 400);
    }

    await prisma.$transaction([
      prisma.groupMember.delete({
        where: { id: membership.id }
      }),
      prisma.group.update({
        where: { id },
        data: { membersCount: { decrement: 1 } }
      })
    ]);

    return success(res, null, '已退出小组');
  } catch (err) {
    console.error('退出小组失败:', err);
    return error(res, '退出小组失败');
  }
}

/**
 * 获取小组成员列表
 */
async function getGroupMembers(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, role } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where = { groupId: id, status: 'active' };
    if (role) {
      where.role = role;
    }

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        skip,
        take,
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              bio: true,
              level: true
            }
          }
        }
      }),
      prisma.groupMember.count({ where })
    ]);

    return success(res, {
      list: members.map(m => ({
        id: m.id,
        user: m.user,
        role: m.role,
        nickname: m.nickname,
        joinedAt: m.joinedAt
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('获取成员列表失败:', err);
    return error(res, '获取成员列表失败');
  }
}

/**
 * 处理加入申请
 */
async function handleJoinRequest(req, res) {
  try {
    const { id, requestId } = req.params;
    const userId = req.user.id;
    const { action, note } = req.body; // action: approve, reject

    // 检查权限
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return error(res, '没有权限处理申请', 403);
    }

    const request = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
      include: { group: true }
    });

    if (!request || request.groupId !== id) {
      return error(res, '申请不存在', 404);
    }

    if (request.status !== 'pending') {
      return error(res, '申请已处理', 400);
    }

    if (action === 'approve') {
      // 检查人数限制
      const group = await prisma.group.findUnique({
        where: { id },
        include: { _count: { select: { members: true } } }
      });
      
      if (group.maxMembers > 0 && group._count.members >= group.maxMembers) {
        return error(res, '小组人数已满', 400);
      }

      await prisma.$transaction([
        prisma.groupJoinRequest.update({
          where: { id: requestId },
          data: { status: 'approved', handlerId: userId, handleNote: note, handledAt: new Date() }
        }),
        prisma.groupMember.create({
          data: {
            groupId: id,
            userId: request.userId,
            role: 'member',
            joinReason: request.reason
          }
        }),
        prisma.group.update({
          where: { id },
          data: { membersCount: { increment: 1 } }
        })
      ]);
    } else {
      await prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', handlerId: userId, handleNote: note, handledAt: new Date() }
      });
    }

    return success(res, null, action === 'approve' ? '已通过申请' : '已拒绝申请');
  } catch (err) {
    console.error('处理申请失败:', err);
    return error(res, '处理申请失败');
  }
}

/**
 * 获取小组话题列表
 */
async function getGroupTopics(req, res) {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, type } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const where = { groupId: id, status: 'published' };
    if (type) {
      where.type = type;
    }

    const [topics, total] = await Promise.all([
      prisma.groupTopic.findMany({
        where,
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true }
          }
        }
      }),
      prisma.groupTopic.count({ where })
    ]);

    return success(res, {
      list: topics.map(t => ({
        id: t.id,
        title: t.title,
        content: t.content.substring(0, 200) + (t.content.length > 200 ? '...' : ''),
        images: t.images ? JSON.parse(t.images) : [],
        type: t.type,
        author: t.author,
        viewsCount: t.viewsCount,
        likesCount: t.likesCount,
        commentsCount: t.commentsCount,
        isPinned: t.isPinned,
        createdAt: t.createdAt
      })),
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('获取小组话题失败:', err);
    return error(res, '获取小组话题失败');
  }
}

/**
 * 发布小组话题
 */
async function createGroupTopic(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, images = [], type = 'discussion' } = req.body;

    // 检查是否是成员
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } }
    });

    if (!membership) {
      return error(res, '只有小组成员才能发布话题', 403);
    }

    if (membership.status !== 'active') {
      return error(res, '您已被禁言', 403);
    }

    const topic = await prisma.$transaction(async (tx) => {
      const newTopic = await tx.groupTopic.create({
        data: {
          groupId: id,
          authorId: userId,
          title,
          content,
          images: JSON.stringify(images),
          type,
          publishedAt: new Date()
        },
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true }
          }
        }
      });

      await tx.group.update({
        where: { id },
        data: { topicsCount: { increment: 1 } }
      });

      return newTopic;
    });

    return success(res, {
      id: topic.id,
      title: topic.title,
      content: topic.content,
      type: topic.type,
      author: topic.author,
      createdAt: topic.createdAt
    }, '发布成功');
  } catch (err) {
    console.error('发布话题失败:', err);
    return error(res, '发布话题失败');
  }
}

/**
 * 获取小组分类
 */
async function getGroupCategories(req, res) {
  try {
    const categories = [
      { value: 'study', label: '学习交流', icon: '📚' },
      { value: 'tech', label: '技术开发', icon: '💻' },
      { value: 'career', label: '职业发展', icon: '💼' },
      { value: 'interest', label: '兴趣爱好', icon: '🎨' },
      { value: 'life', label: '校园生活', icon: '🏠' },
      { value: 'sport', label: '运动健身', icon: '⚽' },
      { value: 'game', label: '游戏娱乐', icon: '🎮' },
      { value: 'general', label: '综合讨论', icon: '💬' }
    ];

    return success(res, categories);
  } catch (err) {
    return error(res, '获取分类失败');
  }
}

/**
 * 获取热门小组
 */
async function getHotGroups(req, res) {
  try {
    const { limit = 10 } = req.query;

    const groups = await prisma.group.findMany({
      where: { status: 'active', isPublic: true },
      take: parseInt(limit),
      orderBy: { membersCount: 'desc' },
      include: {
        creator: {
          select: { id: true, nickname: true, avatar: true }
        }
      }
    });

    return success(res, groups.map(g => ({
      id: g.id,
      name: g.name,
      avatar: g.avatar,
      category: g.category,
      membersCount: g.membersCount,
      topicsCount: g.topicsCount
    })));
  } catch (err) {
    console.error('获取热门小组失败:', err);
    return error(res, '获取热门小组失败');
  }
}

module.exports = {
  getGroups,
  getMyGroups,
  getGroupDetail,
  createGroup,
  updateGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  handleJoinRequest,
  getGroupTopics,
  createGroupTopic,
  getGroupCategories,
  getHotGroups
};
