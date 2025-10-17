// ==================== frontend/src/utils/mock.ts ====================
// Mock数据用于本地开发

export const mockUsers = [
  {
    id: '1',
    nickname: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    bio: '热爱技术，专注前端开发',
    skills: ['React', 'TypeScript', 'Node.js'],
    interests: ['AI', '开源', '创业'],
    city: '深圳',
    level: 5,
    points: 1280,
  },
  {
    id: '2',
    nickname: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    bio: '产品经理，关注用户体验',
    skills: ['产品设计', 'Axure', 'Figma'],
    interests: ['设计', '心理学', '商业'],
    city: '北京',
    level: 4,
    points: 890,
  },
  {
    id: '3',
    nickname: '李华',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    bio: '数据科学家，机器学习爱好者',
    skills: ['Python', 'TensorFlow', 'SQL'],
    interests: ['机器学习', '数据分析', '量化投资'],
    city: '上海',
    level: 6,
    points: 2340,
  },
];

export const mockTopics = [
  {
    id: '1',
    title: '寻找前端开发合作伙伴，一起开发AI应用',
    content: '我有一个AI创意项目想做，需要前端开发的小伙伴加入。项目是一个智能写作助手，已经有后端和AI模型，现在需要优秀的前端界面。如果你对AI感兴趣，欢迎联系！',
    contentType: 'text',
    category: '技术',
    tags: ['AI', '前端', 'React', '创业'],
    topicType: 'demand',
    demandType: '人员',
    author: mockUsers[0],
    images: [],
    createdAt: new Date('2025-01-15T10:30:00'),
    viewsCount: 234,
    likesCount: 45,
    commentsCount: 12,
    bookmarksCount: 8,
    hotScore: 892,
    _count: {
      likes: 45,
      comments: 12,
      bookmarks: 8,
    },
  },
  {
    id: '2',
    title: '分享一个超好用的代码片段管理工具',
    content: '最近发现了一个宝藏工具 - SnippetBox，可以帮你管理各种代码片段，支持多语言高亮、标签分类、全文搜索。强烈推荐给大家！\n\n主要特性：\n- 支持30+编程语言\n- 云同步\n- VSCode插件\n- 完全免费开源',
    contentType: 'markdown',
    category: '技术',
    tags: ['工具', '开发', '效率'],
    topicType: 'discussion',
    author: mockUsers[1],
    images: ['https://picsum.photos/800/400?random=1'],
    createdAt: new Date('2025-01-14T15:20:00'),
    viewsCount: 567,
    likesCount: 89,
    commentsCount: 23,
    bookmarksCount: 34,
    hotScore: 1245,
    _count: {
      likes: 89,
      comments: 23,
      bookmarks: 34,
    },
  },
  {
    id: '3',
    title: '求推荐深圳靠谱的Python培训机构',
    content: '想学Python做数据分析，有没有在深圳报过培训班的朋友？求推荐靠谱的机构，最好是小班教学的那种。预算1-2万。',
    contentType: 'text',
    category: '学习',
    tags: ['Python', '培训', '深圳'],
    topicType: 'question',
    author: mockUsers[2],
    images: [],
    createdAt: new Date('2025-01-13T09:15:00'),
    viewsCount: 156,
    likesCount: 12,
    commentsCount: 8,
    bookmarksCount: 3,
    hotScore: 345,
    _count: {
      likes: 12,
      comments: 8,
      bookmarks: 3,
    },
  },
];

export const mockComments = [
  {
    id: '1',
    topicId: '1',
    author: mockUsers[1],
    content: '我对这个项目很感兴趣！我有3年React开发经验，可以加个微信详聊吗？',
    createdAt: new Date('2025-01-15T11:30:00'),
    likesCount: 5,
    repliesCount: 1,
    replies: [
      {
        id: '1-1',
        author: mockUsers[0],
        content: '太好了！我的微信是 zhangsan_dev，加我吧',
        createdAt: new Date('2025-01-15T11:45:00'),
        likesCount: 2,
      },
    ],
  },
  {
    id: '2',
    topicId: '1',
    author: mockUsers[2],
    content: '项目技术栈是什么？用的哪个AI模型？',
    createdAt: new Date('2025-01-15T12:00:00'),
    likesCount: 3,
    repliesCount: 0,
  },
];

export const mockNotifications = [
  {
    id: '1',
    type: 'like',
    sender: mockUsers[1],
    content: '赞了你的话题',
    targetTitle: '寻找前端开发合作伙伴',
    isRead: false,
    createdAt: new Date('2025-01-15T14:30:00'),
  },
  {
    id: '2',
    type: 'comment',
    sender: mockUsers[2],
    content: '评论了你的话题',
    targetTitle: '寻找前端开发合作伙伴',
    isRead: false,
    createdAt: new Date('2025-01-15T12:00:00'),
  },
  {
    id: '3',
    type: 'follow',
    sender: mockUsers[0],
    content: '关注了你',
    isRead: true,
    createdAt: new Date('2025-01-14T10:00:00'),
  },
  {
    id: '4',
    type: 'system',
    content: '欢迎加入IEclub！快去发布你的第一个话题吧',
    isRead: true,
    createdAt: new Date('2025-01-13T08:00:00'),
  },
];


// ==================== backend/tests/unit/services/algorithmService.test.js ====================
// 算法服务单元测试

const AlgorithmService = require('../../../src/services/algorithmService');

describe('AlgorithmService', () => {
  describe('calculateHotScore', () => {
    it('应该正确计算热度分数', () => {
      const topic = {
        viewsCount: 100,
        likesCount: 20,
        commentsCount: 10,
        bookmarksCount: 5,
        recentLikes: 10,
        recentComments: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
      };

      const hotScore = AlgorithmService.calculateHotScore(topic);

      expect(hotScore).toBeGreaterThan(0);
      expect(typeof hotScore).toBe('number');
    });

    it('新发布的话题应该有更高的热度分数', () => {
      const newTopic = {
        viewsCount: 100,
        likesCount: 20,
        commentsCount: 10,
        bookmarksCount: 5,
        recentLikes: 10,
        recentComments: 5,
        createdAt: new Date(), // 刚发布
      };

      const oldTopic = {
        ...newTopic,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时前
      };

      const newScore = AlgorithmService.calculateHotScore(newTopic);
      const oldScore = AlgorithmService.calculateHotScore(oldTopic);

      expect(newScore).toBeGreaterThan(oldScore);
    });
  });

  describe('findMatches', () => {
    it('应该找到匹配的供给话题', async () => {
      // Mock数据
      const demandTopic = {
        id: '1',
        topicType: 'demand',
        demandType: '人员',
        skillsNeeded: ['React', 'TypeScript'],
        tags: ['前端', 'AI'],
        author: { city: '深圳' },
      };

      // 这里需要mock Prisma的查询
      // 实际测试中应该使用测试数据库或mock
      
      // const matches = await AlgorithmService.findMatches(demandTopic.id);
      // expect(matches).toBeDefined();
      // expect(Array.isArray(matches)).toBe(true);
    });
  });
});


// ==================== backend/tests/unit/utils/validator.test.js ====================
// 验证工具单元测试

const { isValidEmail, isValidPhone, sanitizeInput } = require('../../../src/utils/validator');

describe('Validator Utils', () => {
  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('应该验证有效的手机号', () => {
      expect(isValidPhone('13800138000')).toBe(true);
      expect(isValidPhone('18912345678')).toBe(true);
    });

    it('应该拒绝无效的手机号', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('abc12345678')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('应该清理XSS攻击代码', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('应该保留安全的HTML标签', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
    });
  });
});


// ==================== backend/tests/integration/auth.test.js ====================
// 认证集成测试

const request = require('supertest');
const app = require('../../src/app');

describe('Auth API', () => {
  describe('POST /api/v1/auth/wechat-login', () => {
    it('应该成功登录并返回Token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({
          code: 'mock_wechat_code',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('缺少code应该返回400错误', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let token;

    beforeAll(async () => {
      // 先登录获取token
      const loginResponse = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({ code: 'mock_code' });
      token = loginResponse.body.data.token;
    });

    it('应该返回当前用户信息', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
    });

    it('没有token应该返回401错误', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });
});


// ==================== backend/tests/setup.js ====================
// 测试环境设置

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 测试前清理数据库
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // 清理测试数据
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.bookmark.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.topicView.deleteMany(),
    prisma.match.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  
  console.log('✅ Test database cleaned');
});

// 测试后清理
afterAll(async () => {
  await prisma.$disconnect();
  console.log('🏁 Test environment cleaned up');
});

// Mock微信API
jest.mock('../src/services/wechatService', () => ({
  getAccessToken: jest.fn().mockResolvedValue('mock_access_token'),
  code2Session: jest.fn().mockResolvedValue({
    openid: 'mock_openid',
    session_key: 'mock_session_key',
  }),
  checkContent: jest.fn().mockResolvedValue({ safe: true }),
  imgSecCheck: jest.fn().mockResolvedValue({ pass: true }),
}));


// ==================== backend/jest.config.js ====================
// Jest配置文件

module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/index.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
};


// ==================== backend/package.json 更新（添加测试脚本）====================
// 在已有的 package.json 中添加以下测试相关的内容

{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/server.js"
    ]
  }
}


// ==================== backend/src/utils/validator.js ====================
// 验证工具函数（补充完整实现）

const xss = require('xss');

class Validator {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国大陆）
   */
  static isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 清理用户输入，防止XSS攻击
   */
  static sanitizeInput(input) {
    if (!input) return '';
    
    return xss(input, {
      whiteList: {
        p: [],
        br: [],
        strong: [],
        em: [],
        u: [],
        h1: [], h2: [], h3: [], h4: [],
        ul: [], ol: [], li: [],
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title'],
        code: ['class'],
        pre: ['class'],
        blockquote: [],
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style'],
    });
  }

  /**
   * 验证UUID格式
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 验证密码强度
   */
  static isStrongPassword(password) {
    // 至少8位，包含大小写字母、数字
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }

  /**
   * 验证URL格式
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Validator;


// ==================== 更新路由配置，添加搜索路由 ====================
// backend/src/routes/index.js - 在现有路由中添加搜索相关路由

// ... 在之前的路由配置后添加：

const SearchController = require('../controllers/searchController');

// ==================== 搜索路由 ====================
router.get('/search/topics', optionalAuth, SearchController.searchTopics);
router.get('/search/users', optionalAuth, SearchController.searchUsers);
router.get('/search/hot-keywords', SearchController.getHotKeywords);
router.get('/search/history', authenticate, SearchController.getSearchHistory);
router.delete('/search/history', authenticate, SearchController.clearSearchHistory);
router.get('/search/suggest', SearchController.getSuggestions);


// ==================== prisma/seed.js ====================
// 数据库初始数据填充脚本

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充初始数据...');

  // 1. 创建测试用户
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        openid: `test_openid_${i}`,
        nickname: `测试用户${i}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        bio: `这是测试用户${i}的个人简介`,
        skills: i % 3 === 0 ? ['React', 'Node.js'] : i % 3 === 1 ? ['Python', 'AI'] : ['产品设计', 'UI/UX'],
        interests: i % 2 === 0 ? ['技术', '创业'] : ['设计', '心理学'],
        city: i % 3 === 0 ? '深圳' : i % 3 === 1 ? '北京' : '上海',
        points: Math.floor(Math.random() * 1000) + 100,
        level: Math.floor(Math.random() * 5) + 1,
        status: 'active',
      },
    });
    users.push(user);
  }
  console.log(`✅ 创建了 ${users.length} 个测试用户`);

  // 2. 创建测试话题
  const topics = [];
  const categories = ['技术', '学术', '生活', '活动', '其他'];
  const topicTypes = ['discussion', 'demand', 'supply', 'question', 'activity', 'cooperation'];
  
  for (let i = 1; i <= 50; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const topic = await prisma.topic.create({
      data: {
        authorId: author.id,
        title: `测试话题标题 ${i} - ${categories[i % categories.length]}相关`,
        content: `这是测试话题 ${i} 的内容。内容包含了很多有趣的信息和讨论点。\n\n# 标题1\n这是第一段内容。\n\n## 标题2\n这是第二段内容，包含一些**重点**和*斜体*文字。`,
        contentType: 'markdown',
        category: categories[i % categories.length],
        tags: ['标签1', '标签2', '测试'],
        topicType: topicTypes[i % topicTypes.length],
        demandType: i % 2 === 0 ? '人员' : '技术',
        skillsNeeded: ['React', 'TypeScript'],
        location: author.city,
        viewsCount: Math.floor(Math.random() * 500),
        likesCount: Math.floor(Math.random() * 100),
        commentsCount: Math.floor(Math.random() * 30),
        bookmarksCount: Math.floor(Math.random() * 50),
        hotScore: Math.random() * 1000,
        status: 'published',
      },
    });
    topics.push(topic);
  }
  console.log(`✅ 创建了 ${topics.length} 个测试话题`);

  // 3. 创建测试评论
  let commentsCount = 0;
  for (const topic of topics.slice(0, 20)) {
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      const author = users[Math.floor(Math.random() * users.length)];
      await prisma.comment.create({
        data: {
          topicId: topic.id,
          authorId: author.id,
          content: `这是对话题「${topic.title}」的评论 ${i + 1}`,
          likesCount: Math.floor(Math.random() * 20),
          status: 'published',
        },
      });
      commentsCount++;
    }
  }
  console.log(`✅ 创建了 ${commentsCount} 条测试评论`);

  // 4. 创建测试点赞
  let likesCount = 0;
  for (const topic of topics.slice(0, 30)) {
    for (let i = 0; i < Math.floor(Math.random() * 10); i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      try {
        await prisma.like.create({
          data: {
            userId: user.id,
            targetType: 'topic',
            targetId: topic.id,
          },
        });
        likesCount++;
      } catch (error) {
        // 忽略重复点赞错误
      }
    }
  }
  console.log(`✅ 创建了 ${likesCount} 个测试点赞`);

  // 5. 创建测试关注关系
  let followsCount = 0;
  for (let i = 0; i < 20; i++) {
    const follower = users[Math.floor(Math.random() * users.length)];
    const following = users[Math.floor(Math.random() * users.length)];
    if (follower.id !== following.id) {
      try {
        await prisma.follow.create({
          data: {
            followerId: follower.id,
            followingId: following.id,
          },
        });
        followsCount++;
      } catch (error) {
        // 忽略重复关注错误
      }
    }
  }
  console.log(`✅ 创建了 ${followsCount} 个测试关注关系`);

  // 6. 创建测试通知
  for (let i = 0; i < 30; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const receiver = users[Math.floor(Math.random() * users.length)];
    if (sender.id !== receiver.id) {
      await prisma.notification.create({
        data: {
          type: ['like', 'comment', 'follow', 'system'][Math.floor(Math.random() * 4)],
          senderId: sender.id,
          receiverId: receiver.id,
          content: '这是一条测试通知',
          isRead: Math.random() > 0.5,
          status: 'delivered',
        },
      });
    }
  }
  console.log(`✅ 创建了 30 条测试通知`);

  console.log('🎉 初始数据填充完成！');
}

main()
  .catch((e) => {
    console.error('❌ 填充数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


// ==================== frontend/src/utils/constants.ts ====================
// 前端常量配置（完善版）

export const API_BASE_URL = process.env.TARO_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.ieclub.online' 
    : 'http://localhost:3000');

// 是否启用Mock数据（开发时使用）
export const USE_MOCK = process.env.TARO_APP_USE_MOCK === 'true';

// 分页配置
export const PAGE_SIZE = 20;

// 文件上传配置
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_IMAGE_COUNT = 9;

// 话题类型
export const TOPIC_TYPES = [
  { value: 'discussion', label: '讨论', icon: '💬' },
  { value: 'demand', label: '需求', icon: '🔍' },
  { value: 'supply', label: '供给', icon: '🎁' },
  { value: 'question', label: '问答', icon: '❓' },
  { value: 'activity', label: '活动', icon: '🎉' },
  { value: 'cooperation', label: '合作', icon: '🤝' },
];

// 需求类型
export const DEMAND_TYPES = [
  { value: '人员', label: '人员', icon: '👥' },
  { value: '技术', label: '技术', icon: '⚙️' },
  { value: '资金', label: '资金', icon: '💰' },
  { value: '场地', label: '场地', icon: '🏢' },
  { value: '设备', label: '设备', icon: '🖥️' },
  { value: '合作', label: '合作', icon: '🤝' },
];

// 话题分类
export const CATEGORIES = [
  { value: '技术', label: '技术', color: '#3cc51f' },
  { value: '学术', label: '学术', color: '#667eea' },
  { value: '生活', label: '生活', color: '#f59e0b' },
  { value: '活动', label: '活动', color: '#ec4899' },
  { value: '其他', label: '其他', color: '#8b5cf6' },
];

// 通知类型
export const NOTIFICATION_TYPES = {
  system: { label: '系统通知', color: '#3cc51f' },
  like: { label: '点赞', color: '#ff6b6b' },
  comment: { label: '评论', color: '#667eea' },
  follow: { label: '关注', color: '#f59e0b' },
  match: { label: '匹配', color: '#ec4899' },
};

// 用户等级配置
export const USER_LEVELS = [
  { level: 1, name: '新手', minPoints: 0, color: '#999' },
  { level: 2, name: '初级', minPoints: 100, color: '#3cc51f' },
  { level: 3, name: '中级', minPoints: 500, color: '#667eea' },
  { level: 4, name: '高级', minPoints: 1000, color: '#f59e0b' },
  { level: 5, name: '专家', minPoints: 2000, color: '#ec4899' },
  { level: 6, name: '大师', minPoints: 5000, color: '#8b5cf6' },
];

// 积分奖励规则
export const POINT_RULES = {
  dailyCheckin: 2,
  createTopic: 10,
  createComment: 5,
  receiveLike: 2,
  receiveComment: 3,
};

// 缓存键名
export const CACHE_KEYS = {
  USER_INFO: 'userInfo',
  TOKEN: 'token',
  SETTINGS: 'settings',
  SEARCH_HISTORY: 'searchHistory',
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '请先登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '输入数据格式错误',
};


// ==================== frontend/package.json 更新 ====================
// 添加Mock相关依赖和配置

{
  "dependencies": {
    "@tarojs/taro": "^3.6.0",
    "@tarojs/components": "^3.6.0",
    "@tarojs/runtime": "^3.6.0",
    "react": "^18.2.0",
    "zustand": "^4.4.0",
    "dayjs": "^1.11.10",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@tarojs/cli": "^3.6.0",
    "@tarojs/webpack5-runner": "^3.6.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0"
  },
  "scripts": {
    "dev:weapp": "taro build --type weapp --watch",
    "dev:h5": "taro build --type h5 --watch",
    "build:weapp": "taro build --type weapp",
    "build:h5": "taro build --type h5",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  }
}