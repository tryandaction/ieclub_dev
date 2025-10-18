// 1. 修复后端主应用 ieclub-backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:10086',
    'http://localhost:3000',
    'https://ieclub.online',
    'https://api.ieclub.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// 健康检查 - 不需要 /api 前缀
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API 路由 - 统一使用 /api 前缀
app.use('/api', routes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.path} 不存在`
  });
});

// 错误处理
app.use(errorHandler);

module.exports = app;

// 2. 修复路由索引 ieclub-backend/src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const topicRoutes = require('./topic');
const userRoutes = require('./user');
const notificationRoutes = require('./notification');

// 路由注册 - 这里的路径会拼接到 /api 后面
router.use('/auth', authRoutes);
router.use('/topics', topicRoutes);  // 对应前端的 /api/topics
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

// API根路径
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IEclub API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      topics: '/api/topics',
      users: '/api/users',
      notifications: '/api/notifications'
    }
  });
});

module.exports = router;

// 3. 创建话题路由 ieclub-backend/src/routes/topic.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const topicController = require('../controllers/topicController');
const { validateCreateTopic } = require('../middleware/validator');

// 公开路由
router.get('/', topicController.getTopics);
router.get('/:id', topicController.getTopicDetail);

// 需要认证的路由
router.post('/', auth, validateCreateTopic, topicController.createTopic);
router.post('/:id/like', auth, topicController.likeTopic);
router.delete('/:id/like', auth, topicController.unlikeTopic);
router.post('/:id/view', topicController.incrementView);

module.exports = router;

// 4. 创建通知路由 ieclub-backend/src/routes/notification.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// 所有通知路由都需要认证
router.use(auth);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;

// 5. 修复认证中间件 ieclub-backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer '

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 查找用户
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '认证失败'
    });
  }
};

module.exports = auth;

// 6. 创建话题控制器 ieclub-backend/src/controllers/topicController.js
const { Post, User, Like, Comment } = require('../models');
const { Op } = require('sequelize');

class TopicController {
  // 获取话题列表
  static async getTopics(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        tag,
        keyword,
        sortBy = 'latest' // latest, hot, popular
      } = req.query;

      const offset = (page - 1) * limit;
      
      // 构建查询条件
      const where = {};
      
      if (type) {
        where.type = type;
      }
      
      if (tag) {
        where.tags = {
          [Op.contains]: [tag]
        };
      }
      
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { content: { [Op.like]: `%${keyword}%` } }
        ];
      }

      // 构建排序
      let order = [];
      switch (sortBy) {
        case 'hot':
          order = [['viewCount', 'DESC'], ['createdAt', 'DESC']];
          break;
        case 'popular':
          order = [['likeCount', 'DESC'], ['commentCount', 'DESC']];
          break;
        default:
          order = [['createdAt', 'DESC']];
      }

      const { count, rows } = await Post.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'avatar']
          }
        ],
        order,
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      // 如果用户已登录，查询点赞状态
      let topicsWithLikeStatus = rows;
      if (req.user) {
        const topicIds = rows.map(topic => topic.id);
        const userLikes = await Like.findAll({
          where: {
            userId: req.user.id,
            postId: { [Op.in]: topicIds }
          }
        });
        
        const likedTopicIds = new Set(userLikes.map(like => like.postId));
        
        topicsWithLikeStatus = rows.map(topic => ({
          ...topic.toJSON(),
          isLiked: likedTopicIds.has(topic.id)
        }));
      }

      res.json({
        success: true,
        data: {
          items: topicsWithLikeStatus,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('获取话题列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取话题列表失败'
      });
    }
  }

  // 获取话题详情
  static async getTopicDetail(req, res) {
    try {
      const { id } = req.params;

      const topic = await Post.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'avatar', 'bio']
          },
          {
            model: Comment,
            as: 'comments',
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'nickname', 'avatar']
              }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: '话题不存在'
        });
      }

      // 查询点赞状态
      let isLiked = false;
      if (req.user) {
        const like = await Like.findOne({
          where: {
            userId: req.user.id,
            postId: id
          }
        });
        isLiked = !!like;
      }

      res.json({
        success: true,
        data: {
          ...topic.toJSON(),
          isLiked
        }
      });
    } catch (error) {
      console.error('获取话题详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取话题详情失败'
      });
    }
  }

  // 创建话题
  static async createTopic(req, res) {
    try {
      const { title, content, type, tags } = req.body;
      const userId = req.user.id;

      const topic = await Post.create({
        title,
        content,
        type,
        tags: tags || [],
        authorId: userId,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      });

      // 获取完整的话题信息
      const fullTopic = await Post.findByPk(topic.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'nickname', 'avatar']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: fullTopic,
        message: '发布成功'
      });
    } catch (error) {
      console.error('创建话题失败:', error);
      res.status(500).json({
        success: false,
        message: '发布失败，请重试'
      });
    }
  }

  // 点赞话题
  static async likeTopic(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查话题是否存在
      const topic = await Post.findByPk(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: '话题不存在'
        });
      }

      // 检查是否已点赞
      const existingLike = await Like.findOne({
        where: { userId, postId: id }
      });

      if (existingLike) {
        return res.status(400).json({
          success: false,
          message: '已经点赞过了'
        });
      }

      // 创建点赞记录
      await Like.create({ userId, postId: id });

      // 更新话题点赞数
      await topic.increment('likeCount');

      res.json({
        success: true,
        message: '点赞成功'
      });
    } catch (error) {
      console.error('点赞失败:', error);
      res.status(500).json({
        success: false,
        message: '点赞失败'
      });
    }
  }

  // 取消点赞
  static async unlikeTopic(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 查找点赞记录
      const like = await Like.findOne({
        where: { userId, postId: id }
      });

      if (!like) {
        return res.status(400).json({
          success: false,
          message: '未点赞过'
        });
      }

      // 删除点赞记录
      await like.destroy();

      // 更新话题点赞数
      const topic = await Post.findByPk(id);
      if (topic && topic.likeCount > 0) {
        await topic.decrement('likeCount');
      }

      res.json({
        success: true,
        message: '取消点赞成功'
      });
    } catch (error) {
      console.error('取消点赞失败:', error);
      res.status(500).json({
        success: false,
        message: '取消点赞失败'
      });
    }
  }

  // 增加浏览量
  static async incrementView(req, res) {
    try {
      const { id } = req.params;

      const topic = await Post.findByPk(id);
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: '话题不存在'
        });
      }

      await topic.increment('viewCount');

      res.json({
        success: true,
        message: '浏览量已更新'
      });
    } catch (error) {
      console.error('更新浏览量失败:', error);
      res.status(500).json({
        success: false,
        message: '更新浏览量失败'
      });
    }
  }
}

module.exports = TopicController;

// 7. 创建通知控制器 ieclub-backend/src/controllers/notificationController.js
const { Notification, User } = require('../models');

class NotificationController {
  // 获取通知列表
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type } = req.query;
      const offset = (page - 1) * limit;

      const where = { userId };
      if (type) {
        where.type = type;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          items: rows,
          total: count,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('获取通知失败:', error);
      res.status(500).json({
        success: false,
        message: '获取通知失败'
      });
    }
  }

  // 标记已读
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id, userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: '通知不存在'
        });
      }

      await notification.update({ isRead: true });

      res.json({
        success: true,
        message: '已标记为已读'
      });
    } catch (error) {
      console.error('标记已读失败:', error);
      res.status(500).json({
        success: false,
        message: '标记已读失败'
      });
    }
  }

  // 全部已读
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );

      res.json({
        success: true,
        message: '全部已标记为已读'
      });
    } catch (error) {
      console.error('标记全部已读失败:', error);
      res.status(500).json({
        success: false,
        message: '标记全部已读失败'
      });
    }
  }

  // 获取未读数量
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notification.count({
        where: { userId, isRead: false }
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('获取未读数量失败:', error);
      res.status(500).json({
        success: false,
        message: '获取未读数量失败'
      });
    }
  }
}

module.exports = NotificationController;

// 8. 验证中间件 ieclub-backend/src/middleware/validator.js
const validateCreateTopic = (req, res, next) => {
  const { title, content, type } = req.body;

  // 标题验证
  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: '标题不能为空'
    });
  }

  if (title.length > 100) {
    return res.status(400).json({
      success: false,
      message: '标题不能超过100个字符'
    });
  }

  // 内容验证
  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: '内容不能为空'
    });
  }

  if (content.length > 10000) {
    return res.status(400).json({
      success: false,
      message: '内容不能超过10000个字符'
    });
  }

  // 类型验证
  const validTypes = ['supply', 'demand', 'discussion'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: '话题类型无效'
    });
  }

  next();
};

module.exports = {
  validateCreateTopic
};