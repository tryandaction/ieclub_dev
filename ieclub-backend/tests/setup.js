// 测试环境设置

// 检查是否需要数据库连接的环境变量
const DB_REQUIRED = process.env.DB_REQUIRED === 'true';

let prisma = null;

if (DB_REQUIRED) {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

// 测试前清理数据库（仅当需要数据库时）
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  if (DB_REQUIRED && prisma) {
    try {
      // 清理测试数据
      await prisma.$transaction([
        prisma.notification.deleteMany(),
        prisma.comment.deleteMany(),
        prisma.like.deleteMany(),
        prisma.bookmark.deleteMany(),
        prisma.follow.deleteMany(),
        prisma.topic.deleteMany(),
        prisma.user.deleteMany(),
      ]);
      console.log('✅ Test database cleaned');
    } catch (error) {
      console.warn('⚠️ Database cleanup failed, but continuing tests:', error.message);
    }
  } else {
    console.log('✅ Skipping database cleanup (DB_REQUIRED not set)');
  }
});

// 测试后清理
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
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