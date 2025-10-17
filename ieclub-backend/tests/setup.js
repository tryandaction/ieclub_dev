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