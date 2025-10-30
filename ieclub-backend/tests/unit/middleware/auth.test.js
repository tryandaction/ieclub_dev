// tests/unit/middleware/auth.test.js
// JWT 认证中间件测试 - 符合 IEClub 技术架构规范

const jwt = require('jsonwebtoken');
const AppError = require('../../../src/utils/AppError');

// Mock dependencies - 符合项目架构
jest.mock('jsonwebtoken');

// Mock Prisma instance
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

// Mock database module to return our mock prisma
jest.mock('../../../src/config/database', () => mockPrisma);

// Mock config - 使用项目实际配置结构
jest.mock('../../../src/config', () => ({
  jwt: {
    secret: 'test-jwt-secret-ieclub',
    refreshSecret: 'test-refresh-secret-ieclub',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },
  env: 'test',
}));

// Mock logger - 符合项目日志规范
jest.mock('../../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock response utils - 符合项目响应规范
jest.mock('../../../src/utils/response', () => ({
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  serverError: jest.fn(),
}));

const logger = require('../../../src/utils/logger');
const response = require('../../../src/utils/response');

// Import auth middleware AFTER mocks are set up
const { authenticate, optionalAuth, requireVip, requireCertified, generateToken } = require('../../../src/middleware/auth');

describe('IEClub Auth Middleware - 认证系统测试', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    
    // 清除所有mock调用记录
    jest.clearAllMocks();
    
    // 重置Prisma mock
    mockPrisma.user.findUnique.mockReset();
  });

  describe('authenticate', () => {
    it('should throw error when no authorization header', async () => {
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should throw error when authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic token123';
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should throw error when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_TOKEN_INVALID');
    });

    it('should throw error when token is expired', async () => {
      req.headers.authorization = 'Bearer expired-token';
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_TOKEN_EXPIRED');
    });

    it('should throw error when user not found', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_USER_NOT_FOUND');
    });

    it('should throw error when user is banned', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        openid: 'banned-user',
        nickname: '被封用户',
        avatar: 'avatar.jpg',
        email: 'banned@example.com',
        status: 'banned',
        level: 1,
        credits: 0,
        isCertified: false,
        isVip: false,
      });
      
      await authenticate(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].code).toBe('AUTH_USER_BANNED');
    });

    it('should authenticate successfully with valid token and active user', async () => {
      // 符合 IEClub 用户数据结构
      const mockUser = {
        id: 1,
        openid: 'ieclub_test_openid_12345',
        nickname: '张三',
        avatar: 'https://ieclub.online/avatars/zhangsan.jpg',
        email: 'zhangsan@sustech.edu.cn',
        status: 'active',
        level: 12,
        credits: 1420,
        isCertified: true,
        isVip: false,
      };

      req.headers.authorization = 'Bearer valid-ieclub-token';
      jwt.verify.mockReturnValue({ userId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      await authenticate(req, res, next);
      
      expect(req.user).toEqual(mockUser);
      expect(req.userId).toBe(1);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(req, res, next);
      
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should set user when valid token provided', async () => {
      const mockUser = {
        id: 1,
        openid: 'test-openid',
        nickname: 'Test User',
        avatar: 'avatar.jpg',
        status: 'active',
      };

      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      await optionalAuth(req, res, next);
      
      expect(req.user).toEqual(mockUser);
      expect(req.userId).toBe(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      await optionalAuth(req, res, next);
      
      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireVip - VIP权限验证', () => {
    it('should return unauthorized when no user', () => {
      requireVip(req, res, next);
      
      expect(response.unauthorized).toHaveBeenCalledWith(res);
    });

    it('should return forbidden when user is not VIP', () => {
      req.user = { 
        id: 1, 
        nickname: '普通用户', 
        isVip: false,
        level: 5,
        credits: 300
      };
      
      requireVip(req, res, next);
      
      expect(response.forbidden).toHaveBeenCalledWith(res, '该功能仅限 VIP 用户使用');
    });

    it('should continue when user is VIP', () => {
      req.user = { 
        id: 1, 
        nickname: 'VIP用户', 
        isVip: true,
        level: 15,
        credits: 2000
      };
      
      requireVip(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireCertified - 实名认证验证', () => {
    it('should return unauthorized when no user', () => {
      requireCertified(req, res, next);
      
      expect(response.unauthorized).toHaveBeenCalledWith(res);
    });

    it('should return forbidden when user is not certified', () => {
      req.user = { 
        id: 1, 
        nickname: '未认证用户', 
        isCertified: false,
        level: 3,
        credits: 150
      };
      
      requireCertified(req, res, next);
      
      expect(response.forbidden).toHaveBeenCalledWith(res, '该功能需要完成实名认证');
    });

    it('should continue when user is certified', () => {
      req.user = { 
        id: 1, 
        nickname: '已认证用户', 
        isCertified: true,
        level: 8,
        credits: 680
      };
      
      requireCertified(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('generateToken - JWT令牌生成', () => {
    it('should generate access token by default', () => {
      jwt.sign.mockReturnValue('ieclub-access-token-12345');
      
      const token = generateToken({ userId: 1 });
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        'test-jwt-secret-ieclub',
        { expiresIn: '7d' }
      );
      expect(token).toBe('ieclub-access-token-12345');
    });

    it('should generate refresh token when specified', () => {
      jwt.sign.mockReturnValue('ieclub-refresh-token-67890');
      
      const token = generateToken({ userId: 1 }, 'refresh');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        'test-refresh-secret-ieclub',
        { expiresIn: '30d' }
      );
      expect(token).toBe('ieclub-refresh-token-67890');
    });

    it('should generate token with additional payload data', () => {
      jwt.sign.mockReturnValue('ieclub-token-with-extra-data');
      
      const payload = { 
        userId: 1, 
        level: 12, 
        isVip: true,
        nickname: '张三'
      };
      const token = generateToken(payload);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret-ieclub',
        { expiresIn: '7d' }
      );
      expect(token).toBe('ieclub-token-with-extra-data');
    });
  });

  describe('Integration Tests - 集成测试', () => {
    it('should handle complete authentication flow', async () => {
      const mockUser = {
        id: 1,
        openid: 'ieclub_integration_test',
        nickname: '集成测试用户',
        avatar: 'https://ieclub.online/avatars/test.jpg',
        email: 'test@sustech.edu.cn',
        status: 'active',
        level: 10,
        credits: 1000,
        isCertified: true,
        isVip: true,
      };

      // 模拟完整的认证流程
      req.headers.authorization = 'Bearer ieclub-integration-token';
      jwt.verify.mockReturnValue({ userId: 1 });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // 执行认证
      await authenticate(req, res, next);
      
      // 验证用户信息正确设置
      expect(req.user).toEqual(mockUser);
      expect(req.userId).toBe(1);
      
      // 测试VIP权限
      requireVip(req, res, next);
      expect(next).toHaveBeenCalledTimes(2); // authenticate + requireVip
      
      // 测试认证权限
      requireCertified(req, res, next);
      expect(next).toHaveBeenCalledTimes(3); // authenticate + requireVip + requireCertified
    });
  });
});
