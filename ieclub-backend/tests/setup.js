// 测试环境设置
require('dotenv').config({ path: '.env.test' });

// 设置测试数据库
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://test:test@localhost:3306/ieclub_test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 清理数据库工具函数
global.testUtils = {
  async clearDatabase() {
    // 这里可以添加清理数据库的逻辑
    // 例如：await prisma.$executeRaw`TRUNCATE TABLE ...`
  },

  async createTestUser(overrides = {}) {
    // 创建测试用户的逻辑
    return {};
  },

  async createTestTopic(overrides = {}) {
    // 创建测试话题的逻辑
    return {};
  },
};